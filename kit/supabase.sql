-- =====================================================================================
-- Kleo · Conversas entre pessoas · banco de dados no Supabase (Postgres)
-- =====================================================================================
-- O que este script faz:
--   1. Cria as tabelas das Conversas: perfis, contatos, conversas, participantes e mensagens,
--      além de push_inscricoes (avisos com o app fechado; só o servidor, em api/push.js, acessa).
--   2. Liga a segurança por linha (RLS) em todas: cada pessoa só lê e muda o que é dela.
--   3. Cria os gatilhos que mantêm o resumo de cada conversa e o contador de não lidas.
--   4. Cria as funções que o app chama: garantir_conversa(outro), apagar_minha_conta() e os
--      pedidos de amizade (pedir_amizade, responder_amizade, desfazer_amizade): só conversa
--      quem aceitou o pedido.
--   5. Cria os baldes privados 'audios' (mensagens de voz) e 'imagens' (fotos), até 5 MB cada,
--      e quem pode ver, enviar e apagar.
--   6. Liga o tempo real (Realtime) das tabelas que o app escuta.
--   7. Contas e papéis (convidado, usuário e o ÚNICO dono) e o cofre das chaves de API (IA e vozes),
--      que só o dono mexe e ninguém lê pelo app (o servidor lê com a chave secreta).
--
-- Como usar: painel do Supabase > SQL Editor > New query > cole este arquivo INTEIRO > Run.
-- Rode tudo de uma vez. Resultado esperado: "Success. No rows returned".
-- Se o painel avisar "destructive operation" (por causa dos "drop ... if exists"), confirme em
-- "Run this query": o script só apaga e recria as próprias regras e gatilhos.
-- Pode rodar de novo quando quiser: não apaga dados e não dá erro.
-- =====================================================================================

begin;

-- -------------------------------------------------------------------------------------
-- 0. Extensão de busca e esquema interno
-- -------------------------------------------------------------------------------------

-- pg_trgm deixa rápida a busca de pessoas por pedaço do nome ou do @ (ilike '%ana%')
create extension if not exists pg_trgm with schema extensions;

-- Funções internas ficam no esquema "privado", que não aparece na API do Supabase
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to authenticated, service_role;


-- -------------------------------------------------------------------------------------
-- 1. Tabelas
-- -------------------------------------------------------------------------------------

-- Perfil de cada pessoa (uma conta anônima por aparelho). usuario é o @: único e minúsculo.
create table if not exists public.perfis (
  uid uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  usuario text not null,
  foto text,                                  -- foto pequena (data URL JPEG de 256 px)
  preferencias jsonb,                         -- respostas do primeiro uso (só a própria pessoa lê)
  -- nome sem acentos, espaços e símbolos ("José Ávila" -> "joseavila"), só para a busca
  busca text generated always as (
    regexp_replace(
      translate(lower(nome),
        'áàâãäåéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ',
        'aaaaaaeeeeiiiiooooouuuucnyyaaaaaaeeeeiiiiooooouuuucny'),
      '[^a-z0-9._]', '', 'g')
  ) stored,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_usuario_unico unique (usuario),
  constraint perfis_usuario_formato check (usuario ~ '^[a-z0-9._]{3,20}$'),
  constraint perfis_nome_tamanho check (char_length(btrim(nome)) between 1 and 60),
  constraint perfis_foto_formato check (foto is null or (foto like 'data:image/%' and char_length(foto) <= 300000)),
  constraint perfis_preferencias_formato check (
    preferencias is null or (jsonb_typeof(preferencias) = 'object' and char_length(preferencias::text) <= 20000))
);

-- Bancos criados antes das contas: acrescenta a coluna preferencias (e a regra dela)
alter table public.perfis add column if not exists preferencias jsonb;
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'perfis_preferencias_formato' and conrelid = 'public.perfis'::regclass
  ) then
    alter table public.perfis add constraint perfis_preferencias_formato check (
      preferencias is null or (jsonb_typeof(preferencias) = 'object' and char_length(preferencias::text) <= 20000));
  end if;
end;
$$;

-- Agenda de cada pessoa: quem ela adicionou e o apelido que deu ("Filha", "Mãe")
create table if not exists public.contatos (
  dono uuid not null,
  contato uuid not null,
  apelido text not null default '',
  adicionado_em timestamptz not null default now(),
  constraint contatos_pkey primary key (dono, contato),
  constraint contatos_dono_fkey foreign key (dono) references public.perfis (uid) on delete cascade,
  constraint contatos_contato_fkey foreign key (contato) references public.perfis (uid) on delete cascade,
  constraint contatos_nao_eu check (dono <> contato),
  constraint contatos_apelido_tamanho check (char_length(apelido) <= 40)
);

-- Conversa entre duas pessoas. id = '<uid menor>_<uid maior>', igual para as duas.
-- Conversa consigo mesmo (anotações): id = '<uid>_<uid>', membros = [uid, uid].
-- ultima = resumo da última mensagem {id, tipo, texto, de, em, duracao?, transcricao?}
create table if not exists public.conversas (
  id text primary key,
  membros uuid[] not null,
  ultima jsonb,
  atualizado_em timestamptz not null default now(),
  constraint conversas_dois_membros check (cardinality(membros) = 2 and membros[1] <= membros[2]),
  constraint conversas_id_formato check (id = membros[1]::text || '_' || membros[2]::text)
);
alter table public.conversas drop constraint if exists conversas_dois_membros;
alter table public.conversas add constraint conversas_dois_membros
  check (cardinality(membros) = 2 and membros[1] <= membros[2]);

-- Lado de cada pessoa na conversa: quantas não lidas e até quando leu (para o "lida")
create table if not exists public.participantes (
  conversa_id text not null references public.conversas (id) on delete cascade,
  uid uuid not null references auth.users (id) on delete cascade,
  nao_lidas integer not null default 0,
  lido_ate timestamptz,
  constraint participantes_pkey primary key (conversa_id, uid),
  constraint participantes_nao_lidas_positivo check (nao_lidas >= 0)
);

-- Mensagens: texto, voz (arquivo no Storage em audios/<conversa_id>/<id>.<ext>), foto
-- (imagens/<conversa_id>/<id>.jpg), localização (lat/lng) ou pedido de ajuda
-- O id é gerado no aparelho (crypto.randomUUID) para dar para reenviar sem duplicar.
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id text not null references public.conversas (id) on delete cascade,
  de uuid not null,
  tipo text not null default 'texto',
  texto text,
  audio_path text,
  imagem_path text,
  duracao integer,
  transcricao text,
  lat double precision,
  lng double precision,
  em timestamptz not null default now(),
  constraint mensagens_tipo check (tipo in ('texto', 'audio', 'sos', 'imagem', 'local')),
  constraint mensagens_conteudo check (
    (tipo = 'texto' and char_length(btrim(coalesce(texto, ''))) > 0)
    or (tipo = 'audio' and audio_path is not null)
    or (tipo = 'imagem' and imagem_path is not null)
    or (tipo = 'local' and lat is not null and lng is not null)
    or tipo = 'sos'),
  constraint mensagens_texto_tamanho check (texto is null or char_length(texto) <= 4000),
  constraint mensagens_transcricao_tamanho check (transcricao is null or char_length(transcricao) <= 8000),
  constraint mensagens_duracao check (duracao is null or duracao between 0 and 600),
  constraint mensagens_lat check (lat is null or lat between -90 and 90),
  constraint mensagens_lng check (lng is null or lng between -180 and 180),
  constraint mensagens_audio_na_pasta check (audio_path is null or split_part(audio_path, '/', 1) = conversa_id),
  constraint mensagens_imagem_na_pasta check (imagem_path is null or split_part(imagem_path, '/', 1) = conversa_id)
);

-- Bancos criados antes das fotos e da localização: ganha a coluna e os tipos novos (idempotente)
alter table public.mensagens add column if not exists imagem_path text;
alter table public.mensagens drop constraint if exists mensagens_tipo;
alter table public.mensagens add constraint mensagens_tipo check (tipo in ('texto', 'audio', 'sos', 'imagem', 'local'));
alter table public.mensagens drop constraint if exists mensagens_conteudo;
alter table public.mensagens add constraint mensagens_conteudo check (
  (tipo = 'texto' and char_length(btrim(coalesce(texto, ''))) > 0)
  or (tipo = 'audio' and audio_path is not null)
  or (tipo = 'imagem' and imagem_path is not null)
  or (tipo = 'local' and lat is not null and lng is not null)
  or tipo = 'sos');
alter table public.mensagens drop constraint if exists mensagens_imagem_na_pasta;
alter table public.mensagens add constraint mensagens_imagem_na_pasta check (imagem_path is null or split_part(imagem_path, '/', 1) = conversa_id);

-- Aparelhos que recebem aviso com o app fechado (Web Push). Só a service role mexe (api/push.js).
create table if not exists public.push_inscricoes (
  endpoint text primary key,
  uid uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);


-- -------------------------------------------------------------------------------------
-- 2. Índices
-- -------------------------------------------------------------------------------------
-- Já cobertos por chaves: perfis(usuario) pela restrição única perfis_usuario_unico e
-- contatos(dono) pela chave primária (dono, contato).
create index if not exists contatos_contato_idx on public.contatos (contato);
create index if not exists conversas_membros_idx on public.conversas using gin (membros);
create index if not exists participantes_uid_idx on public.participantes (uid);
create index if not exists mensagens_conversa_em_idx on public.mensagens (conversa_id, em);
create index if not exists push_inscricoes_uid_idx on public.push_inscricoes (uid);

-- Busca por pedaço do @ ou do nome (ilike '%termo%'), onde quer que o pg_trgm esteja instalado
do $$
declare
  esquema text;
begin
  select n.nspname into esquema
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'pg_trgm';
  execute format('create index if not exists perfis_usuario_trgm_idx on public.perfis using gin (usuario %I.gin_trgm_ops)', esquema);
  execute format('create index if not exists perfis_busca_trgm_idx on public.perfis using gin (busca %I.gin_trgm_ops)', esquema);
end;
$$;


-- -------------------------------------------------------------------------------------
-- 3. Funções internas e gatilhos
-- -------------------------------------------------------------------------------------

-- Quem está usando o app participa desta conversa? (usada nas políticas e no Storage)
create or replace function privado.eh_membro(conversa text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversas c
     where c.id = conversa and c.membros @> array[(select auth.uid())]
  );
$$;

-- Resumo da mensagem mostrado na lista de conversas (e lido pela Kleo)
create or replace function privado.resumo(m public.mensagens)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', m.id,
    'tipo', m.tipo,
    'texto', case m.tipo
      when 'sos' then coalesce(nullif(btrim(m.texto), ''), 'Pedido de ajuda')
      when 'audio' then 'Mensagem de voz' || case when coalesce(m.duracao, 0) > 0
        then ' (' || (m.duracao / 60) || ':' || lpad((m.duracao % 60)::text, 2, '0') || ')' else '' end
      when 'imagem' then 'Foto'
      when 'local' then 'Localização'
      else left(coalesce(m.texto, ''), 140)
    end,
    'de', m.de,
    'em', m.em,
    'duracao', m.duracao,
    'transcricao', nullif(btrim(m.transcricao), '')
  ));
$$;

-- A hora da mensagem é sempre a do servidor (o relógio do celular pode estar errado)
create or replace function privado.mensagem_antes_de_inserir()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.em := now();
  return new;
end;
$$;

-- Mensagem nova: atualiza o resumo da conversa e soma 1 nas não lidas de quem recebe
create or replace function privado.mensagem_inserida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversas
     set ultima = privado.resumo(new),
         atualizado_em = greatest(atualizado_em, new.em)
   where id = new.conversa_id
     and (ultima is null or coalesce((ultima ->> 'em')::timestamptz, '-infinity'::timestamptz) <= new.em);
  update public.participantes
     set nao_lidas = nao_lidas + 1
   where conversa_id = new.conversa_id and uid <> new.de;
  return null;
end;
$$;

-- Mensagem apagada: sai das não lidas de quem ainda não tinha lido e, se era a última,
-- o resumo passa a ser a anterior (ou some, se a conversa ficou vazia)
create or replace function privado.mensagem_apagada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  anterior public.mensagens;
begin
  update public.participantes
     set nao_lidas = nao_lidas - 1
   where conversa_id = old.conversa_id and uid <> old.de and nao_lidas > 0
     and (lido_ate is null or lido_ate < old.em);
  if exists (select 1 from public.conversas where id = old.conversa_id and ultima ->> 'id' = old.id::text) then
    select * into anterior
      from public.mensagens
     where conversa_id = old.conversa_id
     order by em desc
     limit 1;
    update public.conversas
       set ultima = case when anterior.id is null then null else privado.resumo(anterior) end,
           atualizado_em = coalesce(anterior.em, atualizado_em)
     where id = old.conversa_id;
  end if;
  return null;
end;
$$;

-- Transcrição nova de um áudio: se ele é o último da conversa, o resumo ganha o texto
create or replace function privado.transcricao_alterada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.transcricao is distinct from old.transcricao then
    update public.conversas
       set ultima = case
             when nullif(btrim(new.transcricao), '') is null then ultima - 'transcricao'
             else ultima || jsonb_build_object('transcricao', btrim(new.transcricao))
           end
     where id = new.conversa_id and ultima ->> 'id' = new.id::text;
  end if;
  return null;
end;
$$;

-- Marcar como lida: a hora da leitura vem do servidor e nunca volta para trás
create or replace function privado.participante_antes_de_atualizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.lido_ate is distinct from old.lido_ate then
    new.lido_ate := greatest(coalesce(old.lido_ate, '-infinity'::timestamptz), now());
  end if;
  return new;
end;
$$;

-- Perfil alterado: registra quando (e não deixa mudar a data de criação)
create or replace function privado.perfil_antes_de_atualizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  new.criado_em := old.criado_em;
  return new;
end;
$$;

drop trigger if exists mensagens_hora_do_servidor on public.mensagens;
create trigger mensagens_hora_do_servidor
  before insert on public.mensagens
  for each row execute function privado.mensagem_antes_de_inserir();

drop trigger if exists mensagens_ao_inserir on public.mensagens;
create trigger mensagens_ao_inserir
  after insert on public.mensagens
  for each row execute function privado.mensagem_inserida();

drop trigger if exists mensagens_ao_apagar on public.mensagens;
create trigger mensagens_ao_apagar
  after delete on public.mensagens
  for each row execute function privado.mensagem_apagada();

drop trigger if exists mensagens_ao_transcrever on public.mensagens;
create trigger mensagens_ao_transcrever
  after update of transcricao on public.mensagens
  for each row execute function privado.transcricao_alterada();

drop trigger if exists participantes_hora_da_leitura on public.participantes;
create trigger participantes_hora_da_leitura
  before update on public.participantes
  for each row execute function privado.participante_antes_de_atualizar();

drop trigger if exists perfis_ao_atualizar on public.perfis;
create trigger perfis_ao_atualizar
  before update on public.perfis
  for each row execute function privado.perfil_antes_de_atualizar();


-- -------------------------------------------------------------------------------------
-- 3b. Amizades: só dá para conversar depois que a outra pessoa aceita o pedido
-- -------------------------------------------------------------------------------------
-- Uma linha por dupla: de = quem pediu, para = quem recebeu. aceita = true depois do "Aceitar".
-- Na primeira vez, quem já tinha conversa entre si vira amigo automaticamente.
do $$
begin
  if to_regclass('public.amizades') is null then
    create table public.amizades (
      de uuid not null references public.perfis (uid) on delete cascade,
      para uuid not null references public.perfis (uid) on delete cascade,
      aceita boolean not null default false,
      criado_em timestamptz not null default now(),
      aceita_em timestamptz,
      constraint amizades_pkey primary key (de, para),
      constraint amizades_nao_eu check (de <> para)
    );
    create unique index amizades_dupla_idx on public.amizades (least(de, para), greatest(de, para));
    create index amizades_para_idx on public.amizades (para);
    insert into public.amizades (de, para, aceita, aceita_em)
    select c.membros[1], c.membros[2], true, now()
      from public.conversas c
     where c.membros[1] <> c.membros[2]
       and exists (select 1 from public.perfis p where p.uid = c.membros[1])
       and exists (select 1 from public.perfis p where p.uid = c.membros[2])
    on conflict do nothing;
  end if;
end;
$$;

-- As duas pessoas são amigas? (a própria pessoa sempre pode falar consigo mesma)
create or replace function privado.sao_amigos(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select a = b or exists (
    select 1 from public.amizades m
     where m.aceita and least(m.de, m.para) = least(a, b) and greatest(m.de, m.para) = greatest(a, b)
  );
$$;

-- Os dois membros da conversa são amigos? (usada na política de enviar mensagem)
create or replace function privado.pode_conversar(conversa text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversas c
     where c.id = conversa and privado.sao_amigos(c.membros[1], c.membros[2])
  );
$$;

-- Manda o pedido. Se a outra pessoa já tinha pedido, vira amizade na hora.
-- Devolve 'enviado' ou 'amigos'.
create or replace function public.pedir_amizade(para uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  linha public.amizades;
begin
  if eu is null then
    raise exception 'NAO_ENTROU' using errcode = '28000';
  end if;
  if pedir_amizade.para is null or pedir_amizade.para = eu then
    raise exception 'CONVERSA_INVALIDA' using errcode = '22023';
  end if;
  if not exists (select 1 from public.perfis where uid = eu) then
    raise exception 'SEM_PERFIL' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.perfis where uid = pedir_amizade.para) then
    raise exception 'PESSOA_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
  select * into linha from public.amizades m
   where least(m.de, m.para) = least(eu, pedir_amizade.para)
     and greatest(m.de, m.para) = greatest(eu, pedir_amizade.para);
  if found then
    if linha.aceita then
      return 'amigos';
    end if;
    if linha.de = eu then
      return 'enviado';
    end if;
    update public.amizades m set aceita = true, aceita_em = now()
     where m.de = linha.de and m.para = linha.para;
    return 'amigos';
  end if;
  insert into public.amizades (de, para) values (eu, pedir_amizade.para);
  return 'enviado';
end;
$$;

-- Aceita (ou recusa) o pedido que "de" mandou. Devolve 'amigos' ou 'recusado'.
create or replace function public.responder_amizade(de uuid, aceitar boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if eu is null then
    raise exception 'NAO_ENTROU' using errcode = '28000';
  end if;
  if coalesce(responder_amizade.aceitar, false) then
    update public.amizades m set aceita = true, aceita_em = now()
     where m.de = responder_amizade.de and m.para = eu and not m.aceita;
    if not found and not privado.sao_amigos(eu, responder_amizade.de) then
      raise exception 'PEDIDO_NAO_ENCONTRADO' using errcode = 'P0002';
    end if;
    return 'amigos';
  end if;
  delete from public.amizades m where m.de = responder_amizade.de and m.para = eu and not m.aceita;
  return 'recusado';
end;
$$;

-- Cancela o pedido enviado ou desfaz a amizade (com qualquer um dos dois lados)
create or replace function public.desfazer_amizade(outro uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if eu is null then
    raise exception 'NAO_ENTROU' using errcode = '28000';
  end if;
  delete from public.amizades m
   where least(m.de, m.para) = least(eu, desfazer_amizade.outro)
     and greatest(m.de, m.para) = greatest(eu, desfazer_amizade.outro);
end;
$$;

alter table public.amizades enable row level security;
revoke all on table public.amizades from anon, authenticated;
grant all on table public.amizades to service_role;
grant select on table public.amizades to authenticated;
drop policy if exists "amizades: os dois veem" on public.amizades;
create policy "amizades: os dois veem" on public.amizades
  for select to authenticated using (de = (select auth.uid()) or para = (select auth.uid()));
revoke all on function privado.sao_amigos(uuid, uuid), privado.pode_conversar(text) from public, anon, authenticated;
grant execute on function privado.sao_amigos(uuid, uuid), privado.pode_conversar(text) to authenticated, service_role;
revoke all on function public.pedir_amizade(uuid), public.responder_amizade(uuid, boolean),
  public.desfazer_amizade(uuid) from public, anon;
grant execute on function public.pedir_amizade(uuid), public.responder_amizade(uuid, boolean),
  public.desfazer_amizade(uuid) to authenticated;


-- -------------------------------------------------------------------------------------
-- 4. Funções que o app chama (supabase.rpc)
-- -------------------------------------------------------------------------------------

-- Abre (ou cria) a conversa com outra pessoa e devolve o id '<uid menor>_<uid maior>'.
-- Com outro = a própria pessoa, abre a conversa consigo mesmo ('<uid>_<uid>', uma linha em participantes).
-- É o único jeito de criar conversa: confere se as duas pessoas têm perfil.
create or replace function public.garantir_conversa(outro uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  primeiro uuid;
  segundo uuid;
  cid text;
begin
  if eu is null then
    raise exception 'NAO_ENTROU' using errcode = '28000';
  end if;
  if outro is null then
    raise exception 'CONVERSA_INVALIDA' using errcode = '22023';
  end if;
  if not exists (select 1 from public.perfis where uid = eu) then
    raise exception 'SEM_PERFIL' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.perfis where uid = outro) then
    raise exception 'PESSOA_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
  if not privado.sao_amigos(eu, outro) then
    raise exception 'NAO_SAO_AMIGOS' using errcode = 'P0001';
  end if;

  primeiro := least(eu, outro);
  segundo := greatest(eu, outro);
  cid := primeiro::text || '_' || segundo::text;

  insert into public.conversas (id, membros)
  values (cid, array[primeiro, segundo])
  on conflict (id) do nothing;

  insert into public.participantes (conversa_id, uid)
  select cid, u from (select distinct unnest(array[eu, outro]) as u) d
  on conflict (conversa_id, uid) do nothing;

  return cid;
end;
$$;

-- Apaga a conta de quem chamou: inscrições de aviso, contatos (dos dois lados), perfil (e o @)
-- e o próprio login. As mensagens já enviadas continuam na conversa da outra pessoa.
create or replace function public.apagar_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if eu is null then
    raise exception 'NAO_ENTROU' using errcode = '28000';
  end if;
  delete from public.push_inscricoes where uid = eu;
  delete from public.contatos where dono = eu or contato = eu;
  delete from public.perfis where uid = eu;
  delete from auth.users where id = eu;      -- leva junto as linhas de participantes
end;
$$;


-- -------------------------------------------------------------------------------------
-- 5. Quem pode o quê: privilégios e políticas de segurança por linha (RLS)
-- -------------------------------------------------------------------------------------
-- Visitante sem login (anon) não acessa nada. Quem entrou (authenticated, que inclui a conta
-- anônima do app) recebe só o necessário; as políticas filtram linha por linha.

revoke all on table public.perfis, public.contatos, public.conversas, public.participantes,
  public.mensagens, public.push_inscricoes from anon, authenticated;
grant all on table public.perfis, public.contatos, public.conversas, public.participantes,
  public.mensagens, public.push_inscricoes to service_role;

-- perfis: quem entrou vê nome, @ e foto de todos; as preferências (respostas do primeiro uso) só a
-- própria pessoa lê, pela função minhas_preferencias(). Por isso o "select *" em perfis não vale.
grant select (uid, nome, usuario, foto, busca, criado_em, atualizado_em) on table public.perfis to authenticated;
grant insert (uid, nome, usuario, foto, preferencias) on table public.perfis to authenticated;
grant update (uid, nome, usuario, foto, preferencias) on table public.perfis to authenticated;
grant delete on table public.perfis to authenticated;
grant select, insert, update, delete on table public.contatos to authenticated;
grant select on table public.conversas to authenticated;                    -- criar só pela RPC
grant select on table public.participantes to authenticated;
grant update (nao_lidas, lido_ate) on table public.participantes to authenticated;
grant select, insert, delete on table public.mensagens to authenticated;
grant update (transcricao) on table public.mensagens to authenticated;     -- só a transcrição muda

-- Funções internas: só o banco usa (eh_membro também roda dentro das políticas)
revoke all on function privado.eh_membro(text) from public, anon, authenticated;
grant execute on function privado.eh_membro(text) to authenticated, service_role;
revoke all on function
  privado.resumo(public.mensagens),
  privado.mensagem_antes_de_inserir(),
  privado.mensagem_inserida(),
  privado.mensagem_apagada(),
  privado.transcricao_alterada(),
  privado.participante_antes_de_atualizar(),
  privado.perfil_antes_de_atualizar()
from public, anon, authenticated;

-- Funções do app: só para quem entrou
revoke all on function public.garantir_conversa(uuid), public.apagar_minha_conta() from public, anon;
grant execute on function public.garantir_conversa(uuid), public.apagar_minha_conta() to authenticated;

alter table public.perfis enable row level security;
alter table public.contatos enable row level security;
alter table public.conversas enable row level security;
alter table public.participantes enable row level security;
alter table public.mensagens enable row level security;
alter table public.push_inscricoes enable row level security;

-- perfis: quem entrou vê todos (para achar pelo @); cada um cria, muda e apaga só o seu
drop policy if exists "perfis: quem entrou ve" on public.perfis;
create policy "perfis: quem entrou ve" on public.perfis
  for select to authenticated using (true);
drop policy if exists "perfis: cria o seu" on public.perfis;
create policy "perfis: cria o seu" on public.perfis
  for insert to authenticated with check (uid = (select auth.uid()));
drop policy if exists "perfis: muda o seu" on public.perfis;
create policy "perfis: muda o seu" on public.perfis
  for update to authenticated using (uid = (select auth.uid())) with check (uid = (select auth.uid()));
drop policy if exists "perfis: apaga o seu" on public.perfis;
create policy "perfis: apaga o seu" on public.perfis
  for delete to authenticated using (uid = (select auth.uid()));

-- contatos: só o dono vê e mexe na própria agenda
drop policy if exists "contatos: so o dono" on public.contatos;
create policy "contatos: so o dono" on public.contatos
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

-- conversas: só os dois membros veem; ninguém cria nem muda direto (só a RPC e os gatilhos)
drop policy if exists "conversas: membros veem" on public.conversas;
create policy "conversas: membros veem" on public.conversas
  for select to authenticated using (membros @> array[(select auth.uid())]);

-- participantes: os membros veem as duas linhas (para o "lida"); cada um muda só a sua
drop policy if exists "participantes: membros veem" on public.participantes;
create policy "participantes: membros veem" on public.participantes
  for select to authenticated using (privado.eh_membro(conversa_id));
drop policy if exists "participantes: muda a sua" on public.participantes;
create policy "participantes: muda a sua" on public.participantes
  for update to authenticated
  using (uid = (select auth.uid()))
  with check (uid = (select auth.uid()));

-- mensagens: membros leem; envia só em nome próprio e numa conversa sua;
-- membros podem pôr a transcrição de um áudio; só o autor apaga
drop policy if exists "mensagens: membros leem" on public.mensagens;
create policy "mensagens: membros leem" on public.mensagens
  for select to authenticated using (privado.eh_membro(conversa_id));
drop policy if exists "mensagens: envia em nome proprio" on public.mensagens;
create policy "mensagens: envia em nome proprio" on public.mensagens
  for insert to authenticated
  with check (de = (select auth.uid()) and privado.eh_membro(conversa_id) and privado.pode_conversar(conversa_id));
drop policy if exists "mensagens: membros transcrevem audios" on public.mensagens;
create policy "mensagens: membros transcrevem audios" on public.mensagens
  for update to authenticated
  using (tipo = 'audio' and privado.eh_membro(conversa_id))
  with check (tipo = 'audio' and privado.eh_membro(conversa_id));
drop policy if exists "mensagens: autor apaga" on public.mensagens;
create policy "mensagens: autor apaga" on public.mensagens
  for delete to authenticated using (de = (select auth.uid()));

-- push_inscricoes: RLS ligado e NENHUMA política de propósito (só a service role acessa)


-- -------------------------------------------------------------------------------------
-- 6. Storage: baldes privados 'audios' e 'imagens' (pasta = id da conversa, arquivo = id da mensagem)
-- -------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audios', 'audios', false, 5242880, array['audio/*'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Ouvir: quem é membro da conversa da 1a pasta do caminho
drop policy if exists "kleo audios: membros ouvem" on storage.objects;
create policy "kleo audios: membros ouvem" on storage.objects
  for select to authenticated
  using (bucket_id = 'audios' and privado.eh_membro((storage.foldername(name))[1]));

-- Enviar: só para uma conversa sua e como dono do arquivo
drop policy if exists "kleo audios: membros enviam" on storage.objects;
create policy "kleo audios: membros enviam" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'audios'
    and owner_id = (select auth.uid())::text
    and privado.eh_membro((storage.foldername(name))[1])
  );

-- Apagar: só quem enviou
drop policy if exists "kleo audios: autor apaga" on storage.objects;
create policy "kleo audios: autor apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'audios' and owner_id = (select auth.uid())::text);

-- Balde privado 'imagens' (fotos das conversas, JPEG até 5 MB): mesmas regras do 'audios'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', false, 5242880, array['image/*'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kleo imagens: membros veem" on storage.objects;
create policy "kleo imagens: membros veem" on storage.objects
  for select to authenticated
  using (bucket_id = 'imagens' and privado.eh_membro((storage.foldername(name))[1]));

drop policy if exists "kleo imagens: membros enviam" on storage.objects;
create policy "kleo imagens: membros enviam" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'imagens'
    and owner_id = (select auth.uid())::text
    and privado.eh_membro((storage.foldername(name))[1])
  );

drop policy if exists "kleo imagens: autor apaga" on storage.objects;
create policy "kleo imagens: autor apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagens' and owner_id = (select auth.uid())::text);


-- -------------------------------------------------------------------------------------
-- 7. Realtime: o app escuta estas tabelas (as políticas RLS filtram o que cada um recebe)
-- -------------------------------------------------------------------------------------
do $$
declare
  tabela text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  -- Se a publicação já inclui todas as tabelas, não há o que acrescentar
  if (select puballtables from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;
  foreach tabela in array array['mensagens', 'participantes', 'conversas', 'contatos', 'amizades'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tabela
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tabela);
    end if;
  end loop;
end;
$$;


-- -------------------------------------------------------------------------------------
-- 8. Contas, papéis e cofre de chaves (IA e vozes)
-- -------------------------------------------------------------------------------------
-- Três papéis, devolvidos por public.meu_papel():
--   'convidado' = entrou sem e-mail (login anônimo: o token traz is_anonymous = true)
--   'usuario'   = conta com e-mail e senha
--   'dono'      = a ÚNICA conta que guarda as chaves de API (IA e vozes) no cofre
-- Ninguém vira dono pelo app. Só pelo SQL Editor, com o e-mail da conta (passo 13 do kit):
--   insert into privado.donos (uid) select id from auth.users where email = 'seu-email@exemplo.com';
-- As funções do app nunca devolvem o valor de uma chave (o dono vê só os 4 últimos caracteres).
-- Quem lê os valores é o servidor do app (api/_cofre.js), com a chave secreta, pela cofre_valores().

-- Dono do app: no máximo UMA linha (o índice único sobre um valor fixo só aceita uma)
create table if not exists privado.donos (
  uid uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create unique index if not exists donos_um_so on privado.donos ((true));

-- Cofre: chaves de API de cada serviço, na ordem de uso dentro do serviço (1 = a primeira)
create table if not exists privado.chaves (
  id uuid primary key default gen_random_uuid(),
  servico text not null,
  rotulo text not null default '',
  valor text not null,
  modelo text,
  ordem integer not null default 1,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint chaves_rotulo_tamanho check (char_length(rotulo) <= 60),
  constraint chaves_valor_formato check (char_length(valor) between 20 and 2000 and valor !~ '\s'),
  constraint chaves_modelo_tamanho check (modelo is null or char_length(modelo) between 1 and 120),
  constraint chaves_ordem_positiva check (ordem >= 1)
);
-- Serviços aceitos (refeita a cada execução para acompanhar a lista)
alter table privado.chaves drop constraint if exists chaves_servico_valido;
alter table privado.chaves add constraint chaves_servico_valido
  check (servico in ('gemini', 'groq', 'openai', 'openrouter', 'elevenlabs', 'google_maps', 'outro'));
create index if not exists chaves_servico_ordem_idx on privado.chaves (servico, ordem);

-- Ninguém acessa estas tabelas direto (nem a service role: o servidor usa a cofre_valores)
alter table privado.donos enable row level security;
alter table privado.chaves enable row level security;
revoke all on table privado.donos, privado.chaves from public, anon, authenticated, service_role;

-- Quem chamou é o dono? (conta com e-mail que está em privado.donos; convidado nunca é)
create or replace function privado.eh_dono()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from privado.donos d
      join auth.users u on u.id = d.uid
     where d.uid = (select auth.uid())
       and coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false) = false
  );
$$;

-- Papel de quem chamou: 'dono', 'usuario' ou 'convidado'
create or replace function public.meu_papel()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  anonimo boolean;
begin
  if eu is null then
    return 'convidado';
  end if;
  -- Convidado = sessão anônima (is_anonymous no token). Quem acabou de transformar o convidado
  -- em conta ainda pode estar com o token antigo: vale o que está gravado no login.
  anonimo := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  select coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, anonimo) into anonimo
    from auth.users u
   where u.id = eu;
  if not found or anonimo then
    return 'convidado';
  end if;
  if privado.eh_dono() then
    return 'dono';
  end if;
  return 'usuario';
end;
$$;

-- O @ está livre? Usada na tela de criar conta (funciona antes de entrar). O próprio @ conta como livre.
create or replace function public.usuario_livre(usuario text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
      from public.perfis p
     where p.usuario = lower(btrim(coalesce(usuario_livre.usuario, '')))
       and p.uid is distinct from (select auth.uid())
  );
$$;

-- Preferências do primeiro uso (perfis.preferencias): só a própria pessoa lê e grava
create or replace function public.minhas_preferencias()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select p.preferencias from public.perfis p where p.uid = (select auth.uid());
$$;

create or replace function public.salvar_minhas_preferencias(preferencias jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if eu is null then
    raise exception 'NAO_ENTROU' using errcode = '28000';
  end if;
  if salvar_minhas_preferencias.preferencias is not null
     and jsonb_typeof(salvar_minhas_preferencias.preferencias) <> 'object' then
    raise exception 'PREFERENCIAS_INVALIDAS' using errcode = '22023';
  end if;
  update public.perfis p
     set preferencias = salvar_minhas_preferencias.preferencias
   where p.uid = eu;
  return found;
end;
$$;

-- Conta nova com e-mail: cria o perfil com o @ escolhido no cadastro (nome e @ vêm nos metadados
-- do login). Se o @ já tiver dono, o cadastro inteiro falha (o app confere antes e explica).
-- Convidados (anônimos) e contas criadas pelo painel sem @ ficam sem perfil até criarem um.
create or replace function privado.conta_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  dados jsonb := to_jsonb(new);
  meta jsonb := coalesce(dados -> 'raw_user_meta_data', '{}'::jsonb);
  u text := lower(btrim(coalesce(meta ->> 'usuario', '')));
  n text := btrim(coalesce(meta ->> 'nome', ''));
begin
  if coalesce((dados ->> 'is_anonymous')::boolean, false) then
    return null;
  end if;
  if u !~ '^[a-z0-9._]{3,20}$' then
    return null;
  end if;
  if n = '' then
    n := u;
  end if;
  insert into public.perfis (uid, nome, usuario)
  values (new.id, left(n, 60), u)
  on conflict (uid) do nothing;
  return null;
end;
$$;

-- Gatilho no login (criado uma vez só; o corpo acima é atualizado a cada execução)
do $$
begin
  if not exists (
    select 1 from pg_trigger
     where tgname = 'kleo_conta_criada' and tgrelid = 'auth.users'::regclass and not tgisinternal
  ) then
    create trigger kleo_conta_criada
      after insert on auth.users
      for each row execute function privado.conta_criada();
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sem permissão para o gatilho em auth.users: o app cria o perfil no primeiro login.';
end;
$$;

-- O serviço de login do Supabase roda o gatilho acima
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant usage on schema privado to supabase_auth_admin';
  end if;
exception
  when insufficient_privilege then null;
end;
$$;

-- Lista do cofre para o Painel do dono: nunca devolve o valor, só os 4 últimos caracteres
create or replace function public.cofre_listar()
returns table (
  id uuid, servico text, rotulo text, mascara text, modelo text, ordem integer, ativa boolean,
  criado_em timestamptz, atualizado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.eh_dono() then
    raise exception 'SOMENTE_DONO' using errcode = '42501';
  end if;
  return query
    select c.id, c.servico, c.rotulo, '••••' || right(c.valor, 4), c.modelo, c.ordem, c.ativa,
           c.criado_em, c.atualizado_em
      from privado.chaves c
     order by c.servico, c.ordem, c.criado_em;
end;
$$;

-- Guarda uma chave nova no fim da fila do serviço. Devolve o id.
create or replace function public.cofre_adicionar(servico text, valor text, rotulo text default '', modelo text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  s text := lower(btrim(coalesce(cofre_adicionar.servico, '')));
  v text := regexp_replace(coalesce(cofre_adicionar.valor, ''), '\s', '', 'g');
  r text := left(btrim(coalesce(cofre_adicionar.rotulo, '')), 60);
  m text := nullif(left(btrim(coalesce(cofre_adicionar.modelo, '')), 120), '');
  proxima integer;
  novo uuid;
begin
  if not privado.eh_dono() then
    raise exception 'SOMENTE_DONO' using errcode = '42501';
  end if;
  if s not in ('gemini', 'groq', 'openai', 'openrouter', 'elevenlabs', 'google_maps', 'outro') then
    raise exception 'SERVICO_INVALIDO' using errcode = '22023';
  end if;
  if char_length(v) < 20 or char_length(v) > 2000 then
    raise exception 'VALOR_INVALIDO' using errcode = '22023';
  end if;
  -- Uma mudança no cofre por vez (dois toques juntos não embaralham a ordem)
  perform pg_advisory_xact_lock(hashtext('kleo_cofre'));
  if exists (select 1 from privado.chaves c where c.servico = s and c.valor = v) then
    raise exception 'CHAVE_REPETIDA' using errcode = '23505';
  end if;
  select coalesce(max(c.ordem), 0) + 1 into proxima from privado.chaves c where c.servico = s;
  insert into privado.chaves (servico, rotulo, valor, modelo, ordem)
  values (s, r, v, m, proxima)
  returning id into novo;
  return novo;
end;
$$;

-- Muda rótulo, modelo, ligada/desligada ou troca o valor (null = não mexe; modelo '' = sem modelo)
create or replace function public.cofre_atualizar(id uuid, rotulo text default null, modelo text default null, ativa boolean default null, valor text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v text := case when cofre_atualizar.valor is null then null else regexp_replace(cofre_atualizar.valor, '\s', '', 'g') end;
  s text;
begin
  if not privado.eh_dono() then
    raise exception 'SOMENTE_DONO' using errcode = '42501';
  end if;
  if v is not null and (char_length(v) < 20 or char_length(v) > 2000) then
    raise exception 'VALOR_INVALIDO' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('kleo_cofre'));
  select c.servico into s from privado.chaves c where c.id = cofre_atualizar.id;
  if not found then
    raise exception 'CHAVE_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
  if v is not null and exists (
    select 1 from privado.chaves c where c.servico = s and c.valor = v and c.id <> cofre_atualizar.id
  ) then
    raise exception 'CHAVE_REPETIDA' using errcode = '23505';
  end if;
  update privado.chaves c
     set rotulo = case when cofre_atualizar.rotulo is null then c.rotulo else left(btrim(cofre_atualizar.rotulo), 60) end,
         modelo = case when cofre_atualizar.modelo is null then c.modelo else nullif(left(btrim(cofre_atualizar.modelo), 120), '') end,
         ativa = coalesce(cofre_atualizar.ativa, c.ativa),
         valor = coalesce(v, c.valor),
         atualizado_em = now()
   where c.id = cofre_atualizar.id;
end;
$$;

-- Leva a chave para a posição nova_ordem dentro do serviço (1 = a primeira) e renumera as outras
create or replace function public.cofre_mover(id uuid, nova_ordem integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s text;
  ids uuid[];
  alvo integer;
begin
  if not privado.eh_dono() then
    raise exception 'SOMENTE_DONO' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('kleo_cofre'));
  select c.servico into s from privado.chaves c where c.id = cofre_mover.id;
  if not found then
    raise exception 'CHAVE_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
  select coalesce(array_agg(c.id order by c.ordem, c.criado_em), '{}'::uuid[])
    into ids
    from privado.chaves c
   where c.servico = s and c.id <> cofre_mover.id;
  alvo := greatest(1, least(coalesce(cofre_mover.nova_ordem, 1), coalesce(array_length(ids, 1), 0) + 1));
  ids := ids[1:alvo - 1] || cofre_mover.id || ids[alvo:];
  update privado.chaves c
     set ordem = x.pos, atualizado_em = now()
    from unnest(ids) with ordinality as x(chave, pos)
   where c.id = x.chave and c.ordem <> x.pos;
end;
$$;

-- Apaga a chave do cofre e renumera as que ficaram no serviço
create or replace function public.cofre_remover(id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s text;
begin
  if not privado.eh_dono() then
    raise exception 'SOMENTE_DONO' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('kleo_cofre'));
  delete from privado.chaves c where c.id = cofre_remover.id returning c.servico into s;
  if s is null then
    raise exception 'CHAVE_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
  update privado.chaves c
     set ordem = x.pos
    from (
      select c2.id as chave, row_number() over (order by c2.ordem, c2.criado_em) as pos
        from privado.chaves c2
       where c2.servico = s
    ) x
   where c.id = x.chave and c.ordem <> x.pos;
end;
$$;

-- Valores das chaves para o servidor do app (api/_cofre.js). SÓ a service role executa.
create or replace function public.cofre_valores()
returns table (id uuid, servico text, valor text, modelo text, ordem integer, ativa boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.servico, c.valor, c.modelo, c.ordem, c.ativa
    from privado.chaves c
   order by c.servico, c.ordem, c.criado_em;
$$;

-- Ajustes gerais do app: voz do aparelho (só o dono liga) e quando a cota da voz natural acabou
create table if not exists privado.ajustes (
  id boolean primary key default true check (id),
  voz_aparelho boolean not null default false,
  voz_sem_cota_em timestamptz,
  atualizado_em timestamptz not null default now()
);
insert into privado.ajustes (id) values (true) on conflict (id) do nothing;
alter table privado.ajustes enable row level security;
revoke all on table privado.ajustes from public, anon, authenticated, service_role;

create or replace function public.ajustes_app()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('voz_aparelho', a.voz_aparelho, 'voz_sem_cota_em', a.voz_sem_cota_em)
    from privado.ajustes a
   where a.id;
$$;

create or replace function public.salvar_voz_aparelho(ligada boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privado.eh_dono() then
    raise exception 'SOMENTE_DONO' using errcode = '42501';
  end if;
  insert into privado.ajustes (id, voz_aparelho, atualizado_em) values (true, coalesce(ligada, false), now())
  on conflict (id) do update set voz_aparelho = excluded.voz_aparelho, atualizado_em = now();
end;
$$;

create or replace function public.marcar_voz_sem_cota(acabou boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into privado.ajustes (id, voz_sem_cota_em) values (true, case when acabou then now() end)
  on conflict (id) do update set voz_sem_cota_em = case when acabou then now() end;
$$;

-- Quem pode chamar o quê
revoke all on function privado.eh_dono(), privado.conta_criada() from public, anon, authenticated;
revoke all on function
  public.meu_papel(),
  public.usuario_livre(text),
  public.minhas_preferencias(),
  public.salvar_minhas_preferencias(jsonb),
  public.cofre_listar(),
  public.cofre_adicionar(text, text, text, text),
  public.cofre_atualizar(uuid, text, text, boolean, text),
  public.cofre_mover(uuid, integer),
  public.cofre_remover(uuid),
  public.cofre_valores(),
  public.ajustes_app(),
  public.salvar_voz_aparelho(boolean),
  public.marcar_voz_sem_cota(boolean)
from public, anon, authenticated;
grant execute on function
  public.meu_papel(),
  public.minhas_preferencias(),
  public.salvar_minhas_preferencias(jsonb),
  public.cofre_listar(),
  public.cofre_adicionar(text, text, text, text),
  public.cofre_atualizar(uuid, text, text, boolean, text),
  public.cofre_mover(uuid, integer),
  public.cofre_remover(uuid)
to authenticated;
grant execute on function public.usuario_livre(text) to anon, authenticated;
grant execute on function public.cofre_valores() to service_role;
grant execute on function public.ajustes_app() to anon, authenticated, service_role;
grant execute on function public.salvar_voz_aparelho(boolean) to authenticated;
grant execute on function public.marcar_voz_sem_cota(boolean) to service_role;

-- A API do Supabase passa a enxergar as funções novas na hora
notify pgrst, 'reload schema';

commit;
