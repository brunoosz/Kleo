import { ler, salvar, remover } from '../storage'
import { semAcento, nomeExibicao } from './util'
export * from './util'
const env = import.meta.env || {}
const CHAVE_CONFIG = 'kleo_supabase_config'
const CHAVE_ORIGEM = 'kleo_rede_origem'
const CACHES = [
  'kleo_rede_conta',
  'kleo_rede_contatos',
  'kleo_rede_amizades',
  'kleo_rede_conversas',
  'kleo_rede_naolidas',
  'kleo_rede_avisados',
  'kleo_rede_fila',
]
;(function migrarDoFirebase() {
  try {
    const tinhaConfig = localStorage.getItem('kleo_firebase_config') !== null
    const modo = ler('kleo_rede_modo', null)
    if (!tinhaConfig && modo !== 'firebase') return
    localStorage.removeItem('kleo_firebase_config')
    if (modo === 'firebase') localStorage.removeItem('kleo_rede_modo')
    if (modo !== 'demo') CACHES.forEach(k => localStorage.removeItem(k))
  } catch {}
})()
try {
  localStorage.removeItem(CHAVE_CONFIG)
} catch {}
function limparUrl(u) {
  try {
    const x = new URL(String(u || '').trim())
    if (x.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(x.hostname)) return ''
    return x.origin
  } catch {
    return ''
  }
}
const daEnv = () => {
  const url = limparUrl(env.VITE_SUPABASE_URL)
  const chave = String(env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
  if (!url || !chave) return null
  if (/^sb_secret_/.test(chave) || lerJwt(chave)?.role === 'service_role') {
    console.error(
      '[Kleo] VITE_SUPABASE_ANON_KEY está com a chave SECRETA. Troque pela publishable (sb_publishable_...) e gere outra secret no Supabase.',
    )
    return null
  }
  return {
    url,
    chave,
  }
}
export const configSupabase = () => daEnv()
function lerJwt(jwt) {
  try {
    const b = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)))
  } catch {
    return null
  }
}
export function modoRede() {
  if (ler('kleo_rede_modo', null) === 'demo') return 'demo'
  if (configSupabase()) return 'supabase'
  return 'nenhum'
}
export function usarDemonstracao(ligar = true) {
  limparCaches()
  if (ligar) {
    salvar('kleo_rede_modo', 'demo')
  } else {
    remover('kleo_rede_modo')
    remover('kleo_demo_rede')
  }
}
let impl = null
let implChave = null
function conferirOrigem(origem) {
  if (ler(CHAVE_ORIGEM, null) === origem) return
  limparCaches()
  salvar(CHAVE_ORIGEM, origem)
}
export async function rede() {
  const m = modoRede()
  if (m === 'nenhum') throw new Error('REDE_DESLIGADA')
  const cfg = m === 'supabase' ? configSupabase() : null
  const chave = m === 'supabase' ? `supabase:${cfg.url}|${cfg.chave}` : 'demo'
  if (impl && implChave === chave) return impl
  conferirOrigem(m === 'supabase' ? `supabase:${cfg.url}` : 'demo')
  const mod = m === 'supabase' ? await import('./supabase.js') : await import('./demo.js')
  if (m === 'supabase') mod.iniciar(cfg)
  impl = mod
  implChave = chave
  return impl
}
export async function clienteSupabase() {
  const cfg = configSupabase()
  if (!cfg) return null
  const mod = await import('./supabase.js')
  mod.iniciar(cfg, {
    conversas: false,
  })
  return mod.cliente()
}
const chamar =
  nome =>
  async (...args) =>
    (await rede())[nome](...args)
export const minhaConta = async () => {
  const c = await (await rede()).minhaConta()
  if (c) salvar('kleo_rede_conta', c)
  else remover('kleo_rede_conta')
  return c
}
export const criarConta = async dados => {
  const c = await (await rede()).criarConta(dados)
  salvar('kleo_rede_conta', c)
  return c
}
export const atualizarConta = async dados => {
  const atual = ler('kleo_rede_conta', null)
  const c = await (await rede()).atualizarConta(dados, atual)
  salvar('kleo_rede_conta', c)
  return c
}
export const apagarConta = async () => {
  await (await rede()).apagarConta()
  limparCaches()
}
export const usuarioDisponivel = chamar('usuarioDisponivel')
export const buscarPessoas = chamar('buscarPessoas')
export const adicionarContato = chamar('adicionarContato')
export const removerContato = chamar('removerContato')
export const renomearContato = chamar('renomearContato')
export const perfilDe = chamar('perfilDe')
export const pedirAmizade = chamar('pedirAmizade')
export const responderAmizade = chamar('responderAmizade')
export const desfazerAmizade = chamar('desfazerAmizade')
export const atualizarMensagem = chamar('atualizarMensagem')
export const apagarMensagem = chamar('apagarMensagem')
export const marcarLida = chamar('marcarLida')
export const mensagensRecentes = chamar('mensagensRecentes')
export async function enviar(outro, msg) {
  return (await rede()).enviar(outro, msg, ler('kleo_rede_conta', null))
}
export async function tokenAcesso() {
  if (modoRede() !== 'supabase') return null
  try {
    return await (await rede()).tokenAcesso()
  } catch {
    return null
  }
}
export function meuUid() {
  const m = modoRede()
  if (m === 'nenhum') return null
  if (m === 'supabase' && impl?.uidAtual && implChave?.startsWith('supabase:'))
    return impl.uidAtual() || contaCache()?.uid || null
  return contaCache()?.uid || null
}
function ouvinte(nome) {
  return (...args) => {
    let parar = null
    let vivo = true
    const funcoes = args.filter(a => typeof a === 'function')
    const erro = funcoes.length > 1 ? funcoes[funcoes.length - 1] : null
    rede()
      .then(r => {
        if (vivo) parar = r[nome](...args)
      })
      .catch(e => erro?.(e))
    return () => {
      vivo = false
      parar?.()
    }
  }
}
export const ouvirContatos = ouvinte('ouvirContatos')
export const ouvirAmizades = ouvinte('ouvirAmizades')
export const ouvirConversas = ouvinte('ouvirConversas')
export const ouvirMensagens = ouvinte('ouvirMensagens')
export function limparCaches() {
  for (const k of CACHES) remover(k)
}
export const contaCache = () => ler('kleo_rede_conta', null)
export const contatosCache = () => {
  const v = ler('kleo_rede_contatos', [])
  return Array.isArray(v) ? v : []
}
export const conversasCache = () => {
  const v = ler('kleo_rede_conversas', [])
  return Array.isArray(v) ? v : []
}
let aberta = null
export const definirConversaAberta = uid => {
  aberta = uid
}
export const conversaAberta = () => aberta
const norm = s => semAcento(s).toLowerCase().replace(/^@/, '').trim()
export function resolverContato(texto) {
  const alvo = norm(texto)
    .replace(/^(a|o|pra|para|minha|meu|com)\s+/, '')
    .replace(/^(a|o)\s+/, '')
  if (!alvo)
    return {
      contato: null,
      ambiguos: [],
    }
  const conta = contaCache()
  if (
    conta &&
    /^(mim|eu|comigo|mim mesm[oa]|eu mesm[oa]|voce|voce mesm[oa]|(minhas )?anotac(oes|ao))$/.test(alvo)
  )
    return {
      contato: {
        ...conta,
        apelido: `@${conta.usuario} (Você)`,
      },
      ambiguos: [],
    }
  const lista = contatosCache()
  const pontos = lista
    .map(c => {
      const campos = [c.apelido, c.nome, c.usuario].filter(Boolean).map(norm)
      const primeiros = [c.apelido, c.nome].filter(Boolean).map(x => norm(x).split(/\s+/)[0])
      let p = 0
      if (campos.includes(alvo)) p = 100
      else if (primeiros.includes(alvo)) p = 80
      else if (campos.some(x => x.startsWith(alvo))) p = 60
      else if (campos.some(x => x.includes(alvo))) p = 40
      else if (alvo.split(/\s+/).some(w => w.length > 2 && primeiros.includes(w))) p = 30
      return {
        c,
        p,
      }
    })
    .filter(x => x.p > 0)
    .sort((a, b) => b.p - a.p)
  if (!pontos.length)
    return {
      contato: null,
      ambiguos: [],
    }
  const empatados = pontos.filter(x => x.p === pontos[0].p)
  if (empatados.length > 1)
    return {
      contato: null,
      ambiguos: empatados.map(x => x.c),
    }
  return {
    contato: pontos[0].c,
    ambiguos: [],
  }
}
export function redeParaIA() {
  if (modoRede() === 'nenhum' || !contaCache()) return ''
  const conta = contaCache()
  const contatos = contatosCache()
  const conversas = conversasCache()
  const nomePor = uid => {
    const c = contatos.find(x => x.uid === uid)
    if (c) return nomeExibicao(c)
    const conv = conversas.find(x => x.outro === uid)
    return conv?.perfil?.nome || 'alguém'
  }
  const naoLidas = conversas.filter(c => c.naoLidas > 0 && c.ultima && c.ultima.de !== conta.uid)
  const amizades = ler('kleo_rede_amizades', null)
  const pendente = uid =>
    modoRede() === 'supabase' &&
    Array.isArray(amizades) &&
    amizades.find(a => a.uid === uid)?.estado !== 'amigos'
  const linhasContatos = contatos
    .slice(0, 30)
    .map(
      c =>
        `${nomeExibicao(c)}${c.apelido && c.nome ? ` (${c.nome})` : ''} @${c.usuario}${pendente(c.uid) ? ' (ainda não aceitou a amizade: não dá para mandar mensagem)' : ''}`,
    )
    .join('; ')
  const linhasNovas = naoLidas
    .slice(0, 8)
    .map(c => {
      const u = c.ultima
      const quando = Math.max(1, Math.round((Date.now() - (u.em || Date.now())) / 60000))
      const conteudo =
        u.tipo === 'audio'
          ? `mandou um áudio${u.transcricao ? `: "${u.transcricao}"` : ''}`
          : u.tipo === 'sos'
            ? 'PEDIU AJUDA (emergência)'
            : u.tipo === 'imagem'
              ? 'mandou uma foto'
              : u.tipo === 'local'
                ? 'mandou a localização dela'
                : `"${u.texto}"`
      return `- ${nomePor(c.outro)} (${c.naoLidas} nova${c.naoLidas > 1 ? 's' : ''}, há ${quando < 60 ? quando + ' min' : Math.round(quando / 60) + ' h'}): ${conteudo}`
    })
    .join('\n')
  return `Seu usuário nas Conversas: @${conta.usuario}
Contatos: ${linhasContatos || '(nenhum ainda)'}
Para anotar algo para a própria pessoa, use o contato "mim" (conversa consigo mesma).
Mensagens novas: ${linhasNovas ? '\n' + linhasNovas : 'nenhuma'}`
}
