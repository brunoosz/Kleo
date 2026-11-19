import { createClient } from '@supabase/supabase-js'
import { idConversa, semAcento } from './util'
import { ler, salvar, remover } from '../storage'
import { avisarPush } from '../push'
const BALDE = 'audios'
const BALDE_IMAGENS = 'imagens'
const VALIDADE_URL = 24 * 3600
const MAX_MENSAGENS = 120
const CHAVE_FILA = 'kleo_rede_fila'
const COLUNAS_PERFIL = 'uid, nome, usuario, foto'
const COLUNAS_MSG =
  'id, conversa_id, de, tipo, texto, audio_path, imagem_path, duracao, transcricao, lat, lng, em'
let sb = null
let cfgAtual = ''
let uid = null
let pararAuth = null
let entrando = null
let filaLigada = false
const urls = new Map()
const cacheMsgs = new Map()
const emissores = new Map()
const pendentes = new Map()
const perfis = new Map()
const garantidas = new Set()
const assinaturas = new Set()
let contadorCanais = 0
let ultimaReconexao = 0
let timerReconexao = null
let esvaziando = null
let timerFila = null
let tentativas = 0
export function iniciar(cfg, { conversas = true } = {}) {
  const chave = `${cfg.url}|${cfg.chave}`
  if (!sb || chave !== cfgAtual) {
    if (sb) encerrar()
    sb = createClient(cfg.url, cfg.chave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
    cfgAtual = chave
    const { data } = sb.auth.onAuthStateChange((evento, sessao) => {
      const antes = uid
      uid = sessao?.user?.id || null
      if (evento === 'SIGNED_OUT' || (antes && uid && antes !== uid)) limparMemoria()
      if (evento === 'TOKEN_REFRESHED' || evento === 'SIGNED_IN') setTimeout(reconectarTudo, 0)
    })
    pararAuth = () => data.subscription.unsubscribe()
  }
  if (conversas && !filaLigada) {
    filaLigada = true
    carregarFila()
    agendarFila(1500)
  }
}
export const cliente = () => sb
function encerrar() {
  ;[...assinaturas].forEach(a => a.parar())
  pararAuth?.()
  pararAuth = null
  sb?.removeAllChannels().catch(() => {})
  clearTimeout(timerFila)
  clearTimeout(timerReconexao)
  limparMemoria()
  sb = null
  uid = null
  filaLigada = false
}
export const uidAtual = () => uid
export async function tokenAcesso() {
  try {
    return (await sessaoAtual())?.access_token || null
  } catch {
    return null
  }
}
function erroDe(error, status) {
  if (!error) return null
  if (error.kleo) return error
  const msg = String(error.message || error.msg || error.error_description || '')
  const cod = String(error.code || '')
  const st = Number(status ?? error.status ?? 0) || 0
  let codigo = 'ERRO_SUPABASE'
  if (
    error.name === 'AuthRetryableFetchError' ||
    error.name === 'StorageUnknownError' ||
    /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg)
  )
    codigo = 'SEM_INTERNET'
  else if (/anonymous sign-ins are disabled/i.test(msg) || cod === 'anonymous_provider_disabled')
    codigo = 'ANONIMO_DESLIGADO'
  else if (/invalid api key|no api key|apikey/i.test(msg)) codigo = 'CHAVE_INVALIDA'
  else if (st === 413 || /maximum allowed size|payload too large/i.test(msg)) codigo = 'AUDIO_GRANDE'
  else if (st === 415 || /mime type/i.test(msg)) codigo = 'AUDIO_FORMATO'
  else if (/jwt expired/i.test(msg) || cod === 'PGRST303') codigo = 'SESSAO_EXPIRADA'
  else if (
    cod === '42P01' ||
    cod === '42883' ||
    cod === 'PGRST202' ||
    cod === 'PGRST205' ||
    /schema cache|does not exist/i.test(msg)
  )
    codigo = 'BANCO_SEM_TABELAS'
  else if (cod === '42501' || /row-level security|permission denied/i.test(msg)) codigo = 'SEM_PERMISSAO'
  else {
    const conhecido = [
      'PESSOA_NAO_ENCONTRADA',
      'SEM_PERFIL',
      'CONVERSA_INVALIDA',
      'NAO_ENTROU',
      'NAO_SAO_AMIGOS',
      'PEDIDO_NAO_ENCONTRADO',
    ].find(c => msg.includes(c))
    if (conhecido) codigo = conhecido
  }
  const e = new Error(codigo, {
    cause: error,
  })
  e.kleo = true
  e.code = cod
  e.status = st
  e.transitorio =
    codigo === 'SEM_INTERNET' ||
    codigo === 'SESSAO_EXPIRADA' ||
    st === 408 ||
    st === 429 ||
    st >= 500 ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  return e
}
async function sessaoAtual() {
  const { data, error } = await sb.auth.getSession()
  if (error) throw erroDe(error, error.status ?? 0)
  uid = data.session?.user?.id || null
  return data.session
}
async function garantirLogin() {
  const s = await sessaoAtual()
  if (s?.user) return s.user
  if (!entrando) {
    entrando = sb.auth
      .signInAnonymously()
      .then(({ data, error }) => {
        if (error) throw erroDe(error, error.status)
        uid = data.user?.id || null
        return data.user
      })
      .finally(() => {
        entrando = null
      })
  }
  return entrando
}
async function quemSou(conta) {
  try {
    const s = await sessaoAtual()
    if (s?.user) return s.user.id
  } catch (e) {
    if (e.transitorio && conta?.uid) return conta.uid
    throw e
  }
  throw new Error('SEM_PERFIL')
}
const contaSalva = () => {
  const c = ler('kleo_rede_conta', null)
  return c?.uid ? c : null
}
function ms(v) {
  if (!v) return 0
  if (typeof v === 'number') return v
  const t = Date.parse(
    String(v)
      .replace(' ', 'T')
      .replace(/(\.\d{3})\d+/, '$1')
      .replace(/([+-]\d{2})$/, '$1:00'),
  )
  return Number.isFinite(t) ? t : 0
}
const numero = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const perfilLimpo = p => ({
  uid: p.uid,
  nome: p.nome || '',
  usuario: p.usuario || '',
  foto: p.foto || null,
})
function novoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
function extensao(tipo) {
  if (/ogg/.test(tipo)) return 'ogg'
  if (/mp4|m4a|aac/.test(tipo)) return 'm4a'
  if (/mpeg|mp3/.test(tipo)) return 'mp3'
  if (/wav/.test(tipo)) return 'wav'
  return 'webm'
}
const chaveUrl = (balde, caminho) => `${balde}/${caminho}`
async function assinarUrls(caminhos, balde = BALDE) {
  const agora = Date.now()
  const faltam = [...new Set(caminhos.filter(Boolean))].filter(
    c => !((urls.get(chaveUrl(balde, c))?.expira || 0) > agora + 60000),
  )
  if (!faltam.length) return
  try {
    const { data, error } = await sb.storage.from(balde).createSignedUrls(faltam, VALIDADE_URL)
    if (error) return
    for (const d of data || []) {
      if (d.path && d.signedUrl && !d.error)
        urls.set(chaveUrl(balde, d.path), {
          url: d.signedUrl,
          expira: agora + VALIDADE_URL * 1000,
        })
    }
  } catch {}
}
async function assinarMidias(linhas) {
  await Promise.all([
    assinarUrls(linhas.map(m => m.audio_path)),
    assinarUrls(
      linhas.map(m => m.imagem_path),
      BALDE_IMAGENS,
    ),
  ])
}
const urlDe = (caminho, balde = BALDE) => (caminho ? urls.get(chaveUrl(balde, caminho))?.url || null : null)
function mensagemDe(l) {
  const audio = urlDe(l.audio_path)
  const imagem = urlDe(l.imagem_path, BALDE_IMAGENS)
  return {
    id: l.id,
    de: l.de,
    tipo: l.tipo || 'texto',
    texto:
      l.tipo === 'audio' && !audio
        ? 'Mensagem de voz indisponível agora.'
        : l.tipo === 'imagem' && !imagem
          ? 'Foto indisponível agora.'
          : l.texto || '',
    audio,
    imagem,
    duracao: l.duracao || 0,
    transcricao: l.transcricao || '',
    lat: numero(l.lat),
    lng: numero(l.lng),
    em: ms(l.em) || Date.now(),
    pendente: false,
  }
}
function listaDe(conversa) {
  const linhas = [...(cacheMsgs.get(conversa)?.values() || [])]
    .sort((a, b) => ms(a.em) - ms(b.em))
    .slice(-MAX_MENSAGENS)
  const ids = new Set(linhas.map(l => l.id))
  const indo = [...pendentes.values()]
    .filter(p => p.conversa === conversa && !ids.has(p.msg.id) && (!uid || p.msg.de === uid))
    .map(p => p.msg)
    .sort((a, b) => a.em - b.em)
  return [...linhas.map(mensagemDe), ...indo]
}
function emitirConversa(conversa) {
  emissores.get(conversa)?.forEach(f => f())
}
function guardarCarga(conversa, linhas) {
  const antigo = cacheMsgs.get(conversa) || new Map()
  const novo = new Map(linhas.map(l => [l.id, l]))
  const maisNova = Math.max(0, ...linhas.map(l => ms(l.em)))
  for (const [id, l] of antigo) if (!novo.has(id) && ms(l.em) > maisNova) novo.set(id, l)
  cacheMsgs.set(conversa, novo)
  for (const id of novo.keys()) pendentes.delete(id)
}
async function receberMensagem(l) {
  if (!l?.id || !l.conversa_id) return
  if ((l.audio_path || l.imagem_path) && !pendentes.has(l.id)) await assinarMidias([l])
  const mapa = cacheMsgs.get(l.conversa_id) || new Map()
  mapa.set(l.id, {
    ...(mapa.get(l.id) || {}),
    ...l,
  })
  cacheMsgs.set(l.conversa_id, mapa)
  pendentes.delete(l.id)
  emitirConversa(l.conversa_id)
}
function tirarMensagem(conversa, id) {
  if (!id || !cacheMsgs.get(conversa)?.delete(id)) return
  emitirConversa(conversa)
}
function limparMemoria() {
  cacheMsgs.clear()
  pendentes.clear()
  garantidas.clear()
  perfis.clear()
  for (const { url } of urls.values()) if (url.startsWith('blob:')) URL.revokeObjectURL(url)
  urls.clear()
}
function assinar({ tipo, preparar, carregar, eventos, erro, semConta }) {
  const cliente = sb
  let vivo = true
  let canal = null
  let timer = null
  let eu = null
  let carregou = false
  const recarregar = (espera = 300) => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      if (!vivo || !eu) return
      try {
        await carregar(eu)
        carregou = true
      } catch (e) {
        if (vivo && !carregou) erro?.(e)
      }
    }, espera)
  }
  const conectar = () => {
    if (!vivo || !eu) return
    if (canal) cliente.removeChannel(canal).catch(() => {})
    canal = cliente.channel(`kleo-${tipo}-${++contadorCanais}`)
    for (const ev of eventos(eu)) {
      const filtro = {
        event: ev.evento,
        schema: 'public',
        table: ev.tabela,
        ...(ev.filtro
          ? {
              filter: ev.filtro,
            }
          : {}),
      }
      canal.on('postgres_changes', filtro, p => {
        if (!vivo) return
        if (ev.aoMudar) ev.aoMudar(p, recarregar)
        else recarregar()
      })
    }
    canal.subscribe(status => {
      if (vivo && status === 'SUBSCRIBED') recarregar()
    })
  }
  const item = {
    tipo,
    recarregar,
    reconectar: () => {
      if (!vivo || !eu) return
      const st = canal?.state
      if (st !== 'joined' && st !== 'joining') conectar()
      recarregar(150)
    },
    parar: () => {
      vivo = false
      clearTimeout(timer)
      assinaturas.delete(item)
      if (canal) cliente.removeChannel(canal).catch(() => {})
      canal = null
    },
  }
  assinaturas.add(item)
  ;(async () => {
    try {
      eu = (await sessaoAtual())?.user?.id || null
    } catch (e) {
      eu = e.transitorio ? uid || contaSalva()?.uid || null : null
      if (!eu) {
        if (vivo) erro?.(e)
        return
      }
    }
    if (!vivo) return
    if (!eu) {
      semConta?.()
      return
    }
    if (preparar) await preparar(eu)
    if (!vivo) return
    recarregar(0)
    conectar()
  })().catch(e => {
    if (vivo) erro?.(e)
  })
  return item.parar
}
function recarregarTipo(tipo, espera = 0) {
  assinaturas.forEach(a => {
    if (a.tipo === tipo) a.recarregar(espera)
  })
}
function reconectarTudo() {
  if (!sb) return
  clearTimeout(timerReconexao)
  const falta = 2000 - (Date.now() - ultimaReconexao)
  if (falta > 0) {
    timerReconexao = setTimeout(reconectarTudo, falta)
    return
  }
  ultimaReconexao = Date.now()
  assinaturas.forEach(a => a.reconectar())
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (sb) {
      esvaziarFila()
      reconectarTudo()
    }
  })
  document.addEventListener('visibilitychange', () => {
    if (sb && document.visibilityState === 'visible') {
      reconectarTudo()
      esvaziarFila()
    }
  })
  window.addEventListener('kleo-push', () => {
    if (sb) reconectarTudo()
  })
}
export async function minhaConta() {
  let s
  try {
    s = await sessaoAtual()
  } catch (e) {
    const c = contaSalva()
    if (e.transitorio && c) return c
    throw e
  }
  if (!s?.user) return null
  const { data, error, status } = await sb
    .from('perfis')
    .select(COLUNAS_PERFIL)
    .eq('uid', s.user.id)
    .maybeSingle()
  if (error) {
    const e = erroDe(error, status)
    const c = contaSalva()
    if (e.transitorio && c?.uid === s.user.id) return c
    throw e
  }
  return data ? perfilLimpo(data) : null
}
export async function usuarioDisponivel(usuario) {
  const eu = await garantirLogin()
  const { data, error, status } = await sb.from('perfis').select('uid').eq('usuario', usuario).maybeSingle()
  if (error) throw erroDe(error, status)
  return !data || data.uid === eu.id
}
const erroPerfil = (error, status) =>
  error.code === '23505'
    ? new Error('USUARIO_EM_USO', {
        cause: error,
      })
    : erroDe(error, status)
export async function criarConta({ nome, usuario, foto }) {
  const eu = await garantirLogin()
  const { data, error, status } = await sb
    .from('perfis')
    .upsert(
      {
        uid: eu.id,
        nome,
        usuario,
        foto: foto || null,
      },
      {
        onConflict: 'uid',
      },
    )
    .select(COLUNAS_PERFIL)
    .single()
  if (error) throw erroPerfil(error, status)
  return perfilLimpo(data)
}
export async function atualizarConta({ nome, usuario, foto }, atual) {
  const eu = await garantirLogin()
  const dados = {
    nome,
    usuario: usuario || atual?.usuario,
    foto: foto ?? null,
  }
  const { data, error, status } = await sb
    .from('perfis')
    .update(dados)
    .eq('uid', eu.id)
    .select(COLUNAS_PERFIL)
    .maybeSingle()
  if (error) throw erroPerfil(error, status)
  if (!data) return criarConta(dados)
  perfis.delete(eu.id)
  return perfilLimpo(data)
}
export async function apagarConta() {
  const s = await sessaoAtual()
  if (!s?.user) return
  const { error, status } = await sb.rpc('apagar_minha_conta')
  if (error) throw erroDe(error, status)
  await sb.auth
    .signOut({
      scope: 'local',
    })
    .catch(() => {})
  uid = null
  remover(CHAVE_FILA)
  limparMemoria()
}
async function perfisDe(lista) {
  const agora = Date.now()
  const faltam = [...new Set(lista.filter(Boolean))].filter(
    u => !(agora - (perfis.get(u)?.em || 0) < 10 * 60000),
  )
  if (faltam.length) {
    const { data, error } = await sb.from('perfis').select(COLUNAS_PERFIL).in('uid', faltam)
    if (!error) {
      for (const u of faltam)
        perfis.set(u, {
          p: null,
          em: agora,
        })
      for (const p of data || [])
        perfis.set(p.uid, {
          p: perfilLimpo(p),
          em: agora,
        })
    }
  }
  return u => perfis.get(u)?.p || null
}
export async function buscarPessoas(texto) {
  const eu = await garantirLogin()
  const t = semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
  if (t.length < 2) return []
  const { data, error, status } = await sb
    .from('perfis')
    .select(COLUNAS_PERFIL)
    .or(`usuario.ilike.%${t}%,busca.ilike.%${t}%`)
    .neq('uid', eu.id)
    .limit(20)
  if (error) throw erroDe(error, status)
  const nomeBusca = p =>
    semAcento(p.nome)
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, '')
  const nota = p => (p.usuario === t ? 0 : p.usuario.startsWith(t) ? 1 : nomeBusca(p).startsWith(t) ? 2 : 3)
  return (data || []).map(perfilLimpo).sort((a, b) => nota(a) - nota(b) || a.usuario.localeCompare(b.usuario))
}
export async function perfilDe(alvo) {
  const s = await sessaoAtual()
  if (!s?.user) return null
  const { data, error, status } = await sb.from('perfis').select(COLUNAS_PERFIL).eq('uid', alvo).maybeSingle()
  if (error) throw erroDe(error, status)
  return data ? perfilLimpo(data) : null
}
export function ouvirContatos(cb, erro) {
  return assinar({
    tipo: 'contatos',
    erro,
    semConta: () => cb([]),
    carregar: async eu => {
      const { data, error, status } = await sb
        .from('contatos')
        .select(`contato, apelido, adicionado_em, perfil:perfis!contatos_contato_fkey(${COLUNAS_PERFIL})`)
        .eq('dono', eu)
        .order('adicionado_em')
      if (error) throw erroDe(error, status)
      cb(
        (data || []).map(c => ({
          ...(c.perfil
            ? perfilLimpo(c.perfil)
            : {
                nome: '',
                usuario: '',
                foto: null,
              }),
          uid: c.contato,
          apelido: c.apelido || '',
          adicionadoEm: ms(c.adicionado_em),
        })),
      )
    },
    eventos: eu => [
      {
        evento: 'INSERT',
        tabela: 'contatos',
        filtro: `dono=eq.${eu}`,
      },
      {
        evento: 'UPDATE',
        tabela: 'contatos',
        filtro: `dono=eq.${eu}`,
      },
      {
        evento: 'DELETE',
        tabela: 'contatos',
        aoMudar: (p, recarregar) => {
          if (p.old?.dono === eu) recarregar()
        },
      },
    ],
  })
}
export async function adicionarContato(p, apelido = '') {
  const eu = await garantirLogin()
  const linha = {
    dono: eu.id,
    contato: p.uid,
    ...(apelido
      ? {
          apelido,
        }
      : {}),
  }
  const { error, status } = await sb.from('contatos').upsert(linha, {
    onConflict: 'dono,contato',
    ignoreDuplicates: !apelido,
  })
  if (error) throw erroDe(error, status)
  recarregarTipo('contatos')
}
export async function removerContato(alvo) {
  const eu = await garantirLogin()
  const { error, status } = await sb.from('contatos').delete().eq('dono', eu.id).eq('contato', alvo)
  if (error) throw erroDe(error, status)
  recarregarTipo('contatos')
}
export async function renomearContato(alvo, apelido) {
  const eu = await garantirLogin()
  const { error, status } = await sb
    .from('contatos')
    .update({
      apelido: apelido || '',
    })
    .eq('dono', eu.id)
    .eq('contato', alvo)
  if (error) throw erroDe(error, status)
  recarregarTipo('contatos')
}
export function ouvirAmizades(cb, erro) {
  return assinar({
    tipo: 'amizades',
    erro,
    semConta: () => cb([]),
    carregar: async eu => {
      const { data, error, status } = await sb
        .from('amizades')
        .select('de, para, aceita, criado_em, aceita_em')
        .or(`de.eq.${eu},para.eq.${eu}`)
      if (error) throw erroDe(error, status)
      const linhas = data || []
      const perfil = await perfisDe(linhas.map(l => (l.de === eu ? l.para : l.de)))
      cb(
        linhas.map(l => {
          const outro = l.de === eu ? l.para : l.de
          return {
            ...(perfil(outro) || {
              nome: '',
              usuario: '',
              foto: null,
            }),
            uid: outro,
            estado: l.aceita ? 'amigos' : l.de === eu ? 'enviado' : 'recebido',
            em: ms(l.aceita_em || l.criado_em),
          }
        }),
      )
    },
    eventos: eu => [
      {
        evento: '*',
        tabela: 'amizades',
        filtro: `de=eq.${eu}`,
      },
      {
        evento: '*',
        tabela: 'amizades',
        filtro: `para=eq.${eu}`,
      },
      {
        evento: 'DELETE',
        tabela: 'amizades',
        aoMudar: (p, recarregar) => {
          if (p.old?.de === eu || p.old?.para === eu || !p.old?.de) recarregar()
        },
      },
    ],
  })
}
async function rpcAmizade(nome, args) {
  await garantirLogin()
  const { data, error, status } = await sb.rpc(nome, args)
  if (error) throw erroDe(error, status)
  recarregarTipo('amizades')
  return data
}
export async function pedirAmizade(outro) {
  const estado = await rpcAmizade('pedir_amizade', {
    para: outro,
  })
  if (estado === 'enviado')
    try {
      avisarPush({
        para: outro,
        pedido: 'novo',
      })
    } catch {}
  return estado
}
export async function responderAmizade(outro, aceitar) {
  const estado = await rpcAmizade('responder_amizade', {
    de: outro,
    aceitar: !!aceitar,
  })
  if (estado === 'amigos')
    try {
      avisarPush({
        para: outro,
        pedido: 'aceito',
      })
    } catch {}
  return estado
}
export async function desfazerAmizade(outro) {
  await rpcAmizade('desfazer_amizade', {
    outro,
  })
}
async function garantirConversa(outro, eu) {
  const cid = idConversa(eu, outro)
  if (garantidas.has(cid)) return cid
  const { data, error, status } = await sb.rpc('garantir_conversa', {
    outro,
  })
  if (error) throw erroDe(error, status)
  garantidas.add(data)
  return data
}
function conversaDe(c, eu, perfil) {
  const outro = (c.membros || []).find(m => m !== eu) || eu
  const minha = (c.participantes || []).find(p => p.uid === eu)
  const consigo = outro === eu
  const dele = consigo ? null : (c.participantes || []).find(p => p.uid === outro)
  return {
    id: c.id,
    outro,
    consigo,
    ultima: c.ultima
      ? {
          ...c.ultima,
          em: ms(c.ultima.em),
        }
      : null,
    naoLidas: minha?.nao_lidas || 0,
    lidoAteOutro: ms(dele?.lido_ate),
    atualizadoEm: ms(c.atualizado_em),
    perfil: perfil(outro),
  }
}
export function ouvirConversas(cb, erro) {
  return assinar({
    tipo: 'conversas',
    erro,
    semConta: () => cb([]),
    carregar: async eu => {
      const { data, error, status } = await sb
        .from('conversas')
        .select('id, membros, ultima, atualizado_em, participantes(uid, nao_lidas, lido_ate)')
        .order('atualizado_em', {
          ascending: false,
        })
        .limit(100)
      if (error) throw erroDe(error, status)
      const lista = data || []
      const perfil = await perfisDe(lista.map(c => (c.membros || []).find(m => m !== eu) || eu))
      cb(lista.map(c => conversaDe(c, eu, perfil)))
    },
    eventos: () => [
      {
        evento: '*',
        tabela: 'conversas',
      },
      {
        evento: '*',
        tabela: 'participantes',
      },
    ],
  })
}
export function ouvirMensagens(outro, cb, erro) {
  let conversa = null
  const emitir = () => cb(listaDe(conversa))
  const parar = assinar({
    tipo: 'mensagens',
    erro,
    semConta: () => cb([]),
    preparar: async eu => {
      conversa = idConversa(eu, outro)
      if (!emissores.has(conversa)) emissores.set(conversa, new Set())
      emissores.get(conversa).add(emitir)
      if (cacheMsgs.has(conversa) || [...pendentes.values()].some(p => p.conversa === conversa)) emitir()
      await garantirConversa(outro, eu).catch(() => {})
    },
    carregar: async () => {
      try {
        const { data, error, status } = await sb
          .from('mensagens')
          .select(COLUNAS_MSG)
          .eq('conversa_id', conversa)
          .order('em', {
            ascending: false,
          })
          .limit(MAX_MENSAGENS)
        if (error) throw erroDe(error, status)
        await assinarMidias(data)
        guardarCarga(conversa, data)
        emitir()
      } catch (e) {
        if (cacheMsgs.has(conversa) || [...pendentes.values()].some(p => p.conversa === conversa)) emitir()
        else throw e
      }
    },
    eventos: () => [
      {
        evento: 'INSERT',
        tabela: 'mensagens',
        filtro: `conversa_id=eq.${conversa}`,
        aoMudar: p => {
          receberMensagem(p.new)
        },
      },
      {
        evento: 'UPDATE',
        tabela: 'mensagens',
        filtro: `conversa_id=eq.${conversa}`,
        aoMudar: p => {
          receberMensagem(p.new)
        },
      },
      {
        evento: 'DELETE',
        tabela: 'mensagens',
        aoMudar: p => tirarMensagem(conversa, p.old?.id),
      },
    ],
  })
  return () => {
    parar()
    emissores.get(conversa)?.delete(emitir)
  }
}
export async function mensagensRecentes(outro, quantas = 10) {
  const s = await sessaoAtual()
  if (!s?.user) return []
  const { data, error, status } = await sb
    .from('mensagens')
    .select(COLUNAS_MSG)
    .eq('conversa_id', idConversa(s.user.id, outro))
    .order('em', {
      ascending: false,
    })
    .limit(quantas)
  if (error) throw erroDe(error, status)
  await assinarMidias(data)
  return data.reverse().map(mensagemDe)
}
async function inserir(item) {
  await garantirConversa(item.outro, item.de)
  const linha = {
    id: item.id,
    conversa_id: item.conversa,
    de: item.de,
    tipo: item.tipo,
    texto: item.texto || null,
    audio_path: item.audio_path || null,
    imagem_path: item.imagem_path || null,
    duracao: item.duracao || null,
    lat: numero(item.lat),
    lng: numero(item.lng),
  }
  const { data, error, status } = await sb.from('mensagens').insert(linha).select(COLUNAS_MSG).single()
  if (error && error.code !== '23505') throw erroDe(error, status)
  if (data) await receberMensagem(data)
  else {
    pendentes.delete(item.id)
    recarregarTipo('mensagens')
  }
  if (item.outro !== item.de)
    try {
      avisarPush({
        para: item.outro,
        conversa: item.conversa,
        mensagem: item.id,
      })
    } catch {}
  return true
}
async function enviarOuGuardar(item) {
  try {
    return await inserir(item)
  } catch (e) {
    if (e.transitorio) {
      guardarNaFila(item)
      return false
    }
    pendentes.delete(item.id)
    emitirConversa(item.conversa)
    throw e
  }
}
async function enviarArquivo(item, blob, urlLocal) {
  const foto = item.tipo === 'imagem'
  const balde = foto ? BALDE_IMAGENS : BALDE
  const tipo = foto
    ? 'image/jpeg'
    : String(blob.type || 'audio/webm')
        .split(';')[0]
        .trim() || 'audio/webm'
  const caminho = `${item.conversa}/${item.id}.${foto ? 'jpg' : extensao(tipo)}`
  let subiu = false
  try {
    await garantirConversa(item.outro, item.de)
    const arquivo =
      blob.type === tipo
        ? blob
        : new Blob([blob], {
            type: tipo,
          })
    const { error } = await sb.storage.from(balde).upload(caminho, arquivo, {
      contentType: tipo,
      upsert: false,
      cacheControl: '31536000',
    })
    const jaExiste =
      error && (error.statusCode === '409' || /already exists|duplicate/i.test(error.message || ''))
    if (error && !jaExiste) throw erroDe(error, error.status)
    subiu = true
    urls.set(chaveUrl(balde, caminho), {
      url: urlLocal,
      expira: Infinity,
    })
    return await inserir({
      ...item,
      [foto ? 'imagem_path' : 'audio_path']: caminho,
    })
  } catch (e) {
    pendentes.delete(item.id)
    emitirConversa(item.conversa)
    if (subiu)
      sb.storage
        .from(balde)
        .remove([caminho])
        .catch(() => {})
    URL.revokeObjectURL(urlLocal)
    throw erroDe(e) || e
  }
}
export async function enviar(outro, msg, conta) {
  const eu = await quemSou(conta)
  const conversa = idConversa(eu, outro)
  const id = novoId()
  const tipo = msg.tipo || 'texto'
  const local = {
    id,
    de: eu,
    tipo,
    texto: tipo === 'audio' || tipo === 'imagem' ? '' : String(msg.texto || ''),
    audio: null,
    imagem: null,
    duracao: Math.round(msg.duracao || 0),
    transcricao: '',
    lat: numero(msg.lat),
    lng: numero(msg.lng),
    em: Date.now(),
    pendente: true,
  }
  if (tipo === 'audio') {
    if (!msg.blob?.size) throw new Error('AUDIO_VAZIO')
    local.audio = URL.createObjectURL(msg.blob)
  }
  if (tipo === 'imagem') {
    if (!msg.blob?.size) throw new Error('IMAGEM_INVALIDA')
    local.imagem = URL.createObjectURL(msg.blob)
  }
  if (tipo === 'local' && (local.lat === null || local.lng === null)) throw new Error('SEM_LOCAL')
  pendentes.set(id, {
    conversa,
    outro,
    msg: local,
  })
  emitirConversa(conversa)
  const item = {
    id,
    outro,
    conversa,
    de: eu,
    tipo,
    texto: local.texto,
    duracao: local.duracao,
    lat: local.lat,
    lng: local.lng,
    criadoEm: local.em,
  }
  const confirmado =
    tipo === 'audio'
      ? enviarArquivo(item, msg.blob, local.audio)
      : tipo === 'imagem'
        ? enviarArquivo(item, msg.blob, local.imagem)
        : enviarOuGuardar(item)
  confirmado.catch(e =>
    console.warn(
      '[Kleo] Falha ao enviar mensagem:',
      tipo,
      e?.message || e,
      e?.status || '',
      e?.code || '',
      e?.cause?.message || e?.cause?.error || '',
      e?.cause || '',
    ),
  )
  return {
    id,
    confirmado,
  }
}
export async function atualizarMensagem(outro, idMsg, patch) {
  if (!patch || !('transcricao' in patch)) return
  const { data, error, status } = await sb
    .from('mensagens')
    .update({
      transcricao: patch.transcricao || null,
    })
    .eq('id', idMsg)
    .select(COLUNAS_MSG)
    .maybeSingle()
  if (error) throw erroDe(error, status)
  if (data) await receberMensagem(data)
}
export async function apagarMensagem(outro, idMsg) {
  const { data, error, status } = await sb
    .from('mensagens')
    .delete()
    .eq('id', idMsg)
    .select('conversa_id, audio_path, imagem_path')
  if (error) throw erroDe(error, status)
  const linha = data?.[0]
  if (linha) {
    if (linha.audio_path)
      sb.storage
        .from(BALDE)
        .remove([linha.audio_path])
        .catch(() => {})
    if (linha.imagem_path)
      sb.storage
        .from(BALDE_IMAGENS)
        .remove([linha.imagem_path])
        .catch(() => {})
    tirarMensagem(linha.conversa_id, idMsg)
  } else {
    tirarDaFila(idMsg)
  }
  recarregarTipo('conversas')
}
export async function marcarLida(outro) {
  let eu = uid
  if (!eu) eu = (await sessaoAtual().catch(() => null))?.user?.id
  if (!eu) return
  const { error } = await sb
    .from('participantes')
    .update({
      nao_lidas: 0,
      lido_ate: new Date().toISOString(),
    })
    .eq('conversa_id', idConversa(eu, outro))
    .eq('uid', eu)
  if (!error) recarregarTipo('conversas')
}
function lerFila() {
  const v = ler(CHAVE_FILA, [])
  return Array.isArray(v) ? v.filter(x => x?.id && x.conversa && x.outro) : []
}
function gravarFila(lista) {
  if (lista.length) salvar(CHAVE_FILA, lista.slice(-200))
  else remover(CHAVE_FILA)
}
const mensagemDaFila = x => ({
  id: x.id,
  de: x.de,
  tipo: x.tipo,
  texto: x.texto || '',
  audio: null,
  imagem: null,
  duracao: 0,
  transcricao: '',
  lat: numero(x.lat),
  lng: numero(x.lng),
  em: x.criadoEm || Date.now(),
  pendente: true,
})
function carregarFila() {
  for (const x of lerFila())
    if (!pendentes.has(x.id))
      pendentes.set(x.id, {
        conversa: x.conversa,
        outro: x.outro,
        msg: mensagemDaFila(x),
      })
}
function guardarNaFila(item) {
  gravarFila([...lerFila().filter(x => x.id !== item.id), item])
  agendarFila(item.tipo === 'sos' ? 3000 : 8000)
}
function tirarDaFila(id) {
  const fila = lerFila()
  if (fila.some(x => x.id === id)) gravarFila(fila.filter(x => x.id !== id))
  const p = pendentes.get(id)
  if (p) {
    pendentes.delete(id)
    emitirConversa(p.conversa)
  }
}
function agendarFila(espera) {
  clearTimeout(timerFila)
  timerFila = setTimeout(esvaziarFila, espera)
}
function esvaziarFila() {
  if (esvaziando || !sb) return esvaziando
  const fila = lerFila()
  if (!fila.length) return null
  esvaziando = (async () => {
    let eu = null
    try {
      eu = (await sessaoAtual())?.user?.id || null
    } catch {
      agendarFila(fila.some(x => x.tipo === 'sos') ? 5000 : 15000)
      return
    }
    if (!eu) return
    const ordem = fila
      .filter(x => x.de === eu)
      .sort(
        (a, b) =>
          (a.tipo === 'sos' ? 0 : 1) - (b.tipo === 'sos' ? 0 : 1) || (a.criadoEm || 0) - (b.criadoEm || 0),
      )
    for (const item of ordem) {
      try {
        await inserir(item)
        tirarDaFila(item.id)
        tentativas = 0
        window.dispatchEvent(
          new CustomEvent('kleo-rede-enviada', {
            detail: {
              id: item.id,
              tipo: item.tipo,
              para: item.outro,
            },
          }),
        )
      } catch (e) {
        if (e.transitorio) {
          tentativas++
          agendarFila(
            ordem.some(x => x.tipo === 'sos') ? 5000 : Math.min(60000, 5000 * 2 ** Math.min(tentativas, 4)),
          )
          return
        }
        console.warn('[Kleo] Mensagem da fila descartada:', e?.message || e)
        tirarDaFila(item.id)
      }
    }
  })().finally(() => {
    esvaziando = null
  })
  return esvaziando
}
