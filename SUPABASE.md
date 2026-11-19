# Conversas da Kleo no Supabase (gratuito, sem cartão)

As Conversas entre pessoas (perfil com @, contatos com apelido, texto, mensagens de voz com transcrição,
confirmação de leitura, pedido de ajuda com localização) usam o **Supabase** no plano Free:

| Peça do Supabase | Para quê |
| --- | --- |
| Postgres + RLS | perfis, contatos, conversas, participantes, mensagens (cada pessoa só vê o que é dela) |
| Login anônimo | conta presa ao aparelho, sem e-mail nem senha (bom para idosos) |
| Storage (balde privado `audios`) | mensagens de voz de até 5 minutos / 5 MB, tocadas por links assinados de 24 h |
| Realtime | mensagens, leitura e lista de conversas chegam na hora |

Sem configurar nada, o app funciona no **modo demonstração** (contatos fictícios que respondem sozinhos).
O passo a passo para leigos, com o nome de cada botão, está na pasta `kit/` (e no `Kleo-kit.zip`), que também explica as chaves de IA, os avisos, a publicação na Vercel e o app para baixar.

## 1. Criar o projeto

1. Entre em https://supabase.com/dashboard e clique em **New project** (crie a organização no plano **Free** se pedir).
2. Nome: `kleo`. **Database Password**: gere, copie e guarde (o app não usa, mas serve para administrar o banco).
3. **Region**: `South America (São Paulo)` (mais perto, mais rápido).
4. **Create new project** e espere uns 2 minutos.

## 2. Preparar o banco (um arquivo só)

**SQL Editor** > **New query** > cole o arquivo [`supabase/schema.sql`](supabase/schema.sql) inteiro > **Run**.

- Se aparecer o aviso de operação destrutiva (por causa dos `drop ... if exists`), confirme em **Run this query**.
- Resultado esperado: `Success. No rows returned`. Pode rodar de novo quando quiser: não apaga dados e não dá erro.

O script cria:

- Tabelas `perfis`, `contatos`, `conversas`, `participantes`, `mensagens` e `push_inscricoes`, com índices
  (inclusive busca por pedaço do @ ou do nome, sem acentos, via `pg_trgm`).
- **RLS em todas**: perfis visíveis a quem entrou e editáveis só pelo dono; contatos só do dono; conversas e
  participantes só para os membros (criação só pela RPC); mensagens: membros leem, envio só em nome próprio,
  só a coluna `transcricao` pode mudar (privilégio por coluna), só o autor apaga; `push_inscricoes` sem
  política nenhuma (só a service role, no `api/push.js`).
- **Gatilhos** (security definer, `search_path = ''`): hora da mensagem sempre do servidor; resumo
  `conversas.ultima` e contador `nao_lidas` ao enviar, apagar e transcrever; hora da leitura do servidor.
- **RPCs**: `garantir_conversa(outro uuid) returns text` e `apagar_minha_conta()` (só `authenticated`).
- **Storage**: balde privado `audios` (5 MB, `audio/*`), caminho `<conversa_id>/<mensagem_id>.<ext>`;
  ouvir e enviar só membros da conversa, apagar só quem enviou.
- **Realtime**: `mensagens`, `participantes`, `conversas` e `contatos` na publicação `supabase_realtime`.

O script foi testado num Postgres de verdade (PGlite) com imitações do Supabase: 106 verificações de
RLS, gatilhos, RPCs, Storage e idempotência (rodado 3 vezes, inclusive com dados).

## 3. Ligar o login anônimo

**Authentication** > **Sign In / Providers** > ligue **Allow anonymous sign-ins** > **Save changes**.

Dia da apresentação: o Supabase limita 30 contas anônimas novas por hora **por IP**. Se muita gente for
testar no mesmo Wi-Fi, aumente em **Authentication** > **Rate Limits** (contas anônimas) e salve.

## 4. Copiar a URL e as chaves

- **Project URL** (`https://<ref>.supabase.co`): botão **Connect** no topo do projeto ou **Project Settings** > **Data API**.
- **Publishable key** (`sb_publishable_...`): **Project Settings** > **API Keys**. É pública (vai para o app).
  A antiga **anon** (aba *Legacy API Keys*) também funciona.
- **Secret key** (`sb_secret_...`): mesma página, botão de revelar. É **segredo**: só no servidor
  (`SUPABASE_SERVICE_ROLE_KEY`, usada pelo `api/push.js`). Nunca em variável `VITE_`, nunca no app, nunca no GitHub.

## 5. Ligar no app

- **Para todos os aparelhos** (recomendado): copie o `.env.example` para `.env.local` e preencha
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (também aceita o nome `VITE_SUPABASE_PUBLISHABLE_KEY`).
  Reinicie o `npm run dev`. Na Vercel, cadastre as mesmas variáveis em **Settings** > **Environment Variables**
  e faça um novo deploy.
- **Só neste aparelho**: **Ajustes** > **Conversas** > cole a URL e a chave juntas (qualquer ordem ou formato) > **Conectar**.
  O app recusa a chave secreta se ela for colada por engano.

Conferir: **Ajustes** > **Conversas** mostra **Ligadas: pessoas de verdade** e `Supabase · <ref>`.
Se mostrar **Modo demonstração**, toque em **Sair da demonstração**.

## 6. Testar com duas pessoas

1. Abra o app em dois aparelhos (PC com `npm run dev`; celular com `npm run celular` no endereço https, ou a Vercel).
2. Em cada um: **Pessoas** > crie o perfil com um @ diferente.
3. Num deles: **Adicionar alguém pelo @** > procure o @ (ou o nome) do outro > **Adicionar** > converse.
4. Teste texto, áudio (microfone), "Ver em texto", apagar (segurar a própria mensagem) e o pedido de ajuda
   (cadastre o outro como contato de emergência e toque em **Pedir socorro**).
5. No painel: **Table Editor** mostra as linhas; **Storage** > `audios` mostra os áudios.

## Como o app usa o banco (src/lib/rede/supabase.js)

- Mesma API do modo demonstração (`demo.js`); `index.js` escolhe `supabase` | `demo` | `nenhum` e exporta
  `modoRede()`, `tokenAcesso()` e `meuUid()` (usados pelos avisos push).
- O id da mensagem nasce no aparelho (`crypto.randomUUID()`), então reenviar nunca duplica.
- **Sem internet**: texto e pedido de ajuda aparecem com o relógio e vão para a fila `kleo_rede_fila`;
  saem sozinhos quando a internet volta (pedido de ajuda primeiro). Áudio espera subir e avisa se falhar.
- Depois de cada envio, `avisarPush()` pede ao `api/push.js` o aviso com o app fechado.
- Realtime com RLS; os canais são removidos ao sair da tela e refeitos (com nova busca) quando o token renova,
  a internet volta ou o app volta para a frente.
- Quem usava a versão com Firebase: a config antiga e os caches daquela conta são apagados sozinhos.

## Limites do plano Free

500 MB de banco, 1 GB de arquivos (um áudio de 5 minutos tem cerca de 1 MB), 5 GB de tráfego por mês,
50 mil usuários ativos por mês, 200 conexões de tempo real ao mesmo tempo, 2 milhões de mensagens de
tempo real por mês, 2 projetos ativos. Sobra para a apresentação e os testes.

## Pausa por falta de uso

Projeto Free fica **pausado depois de 1 semana sem uso**. O app então mostra "Confira a internet" e guarda
na fila o que for enviado. Para reativar: abra o projeto no painel e clique no botão de restaurar
(**Restore project**); leva alguns minutos e nada se perde. Abra o app pelo menos uma vez por semana e
confira um dia antes da apresentação.
