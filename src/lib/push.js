import { modoRede, tokenAcesso, meuUid } from './rede'
import { pedirPermissao, registroSW } from './notificacoes'
import { ler, salvar, remover } from './storage'
import { plataforma, rodandoComoApp } from './instalar'
import { ehAppNativo } from './plataforma'
import { urlApi } from './api'
const VAPID = String(import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim()
const CHAVE = 'kleo_push_ativo'
const RENOVAR_MS = 24 * 60 * 60 * 1000
export const MOTIVOS = {
  https: 'Os avisos só funcionam em site seguro (endereço com https).',
  iphone: 'No iPhone, os avisos só chegam com o app da Kleo baixado.',
  'iphone-antigo': 'Atualize o iPhone para o iOS 16.4 ou mais novo para receber avisos.',
  navegador:
    'Este navegador não recebe avisos com o app fechado. Use o Chrome, Edge, Firefox ou Samsung Internet.',
  servidor: 'Avisos com o app fechado indisponíveis no momento.',
  conversas: 'Os avisos funcionam com as Conversas ligadas.',
  conta: 'Crie sua conta nas Conversas para ligar os avisos.',
  app: 'No app baixado, as mensagens avisam com a Kleo aberta ou minimizada. Lembretes e despertadores avisam mesmo com o app fechado.',
}
export function pushSuportado() {
  if (typeof window === 'undefined' || ehAppNativo()) return false
  return (
    window.isSecureContext === true &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}
export function pushConfigurado() {
  return pushSuportado() && !!VAPID && modoRede() === 'supabase'
}
const uidAtual = () => {
  try {
    return meuUid() || null
  } catch {
    return null
  }
}
export function motivoPush() {
  if (typeof window === 'undefined') return 'navegador'
  if (modoRede() !== 'supabase') return 'conversas'
  if (ehAppNativo()) return 'app'
  if (!window.isSecureContext) return 'https'
  const ios = plataforma() === 'ios'
  if (ios && !rodandoComoApp()) return 'iphone'
  if (!pushSuportado()) return ios ? 'iphone-antigo' : 'navegador'
  if (!VAPID) return 'servidor'
  if (!uidAtual()) return 'conta'
  return null
}
function calcular() {
  const motivo = motivoPush()
  if (motivo)
    return {
      estado: 'indisponivel',
      motivo,
    }
  if (Notification.permission === 'denied')
    return {
      estado: 'bloqueado',
      motivo: null,
    }
  if (Notification.permission === 'granted' && ler(CHAVE, null))
    return {
      estado: 'ativo',
      motivo: null,
    }
  return {
    estado: 'inativo',
    motivo: null,
  }
}
let atual = null
const ouvintes = new Set()
function atualizar() {
  const novo = calcular()
  if (atual && novo.estado === atual.estado && novo.motivo === atual.motivo) return
  atual = novo
  ouvintes.forEach(fn => fn())
}
export function lerPush() {
  if (!atual) atual = calcular()
  return atual
}
export function assinarPush(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}
export function conferirPush() {
  atualizar()
  return lerPush()
}
export async function estadoPush() {
  const { estado } = calcular()
  if (estado !== 'ativo') return estado
  try {
    const reg = await registroSW(4000)
    const sub = await reg?.pushManager?.getSubscription()
    return sub ? 'ativo' : 'inativo'
  } catch {
    return 'inativo'
  }
}
function chaveBytes() {
  const b64 = VAPID.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}
function mesmaChave(buffer, bytes) {
  if (!buffer) return true
  const a = new Uint8Array(buffer)
  return a.length === bytes.length && a.every((v, i) => v === bytes[i])
}
async function inscricao({ criar }) {
  const reg = await registroSW(8000)
  if (!reg?.pushManager) throw new Error('SEM_SW')
  const chave = chaveBytes()
  let sub = await reg.pushManager.getSubscription()
  if (sub && !mesmaChave(sub.options?.applicationServerKey, chave)) {
    await sub.unsubscribe().catch(() => {})
    sub = null
  }
  if (!sub && criar)
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chave,
    })
  return sub
}
async function chamarServidor(corpo, { keepalive = false } = {}) {
  const token = await tokenAcesso()
  if (!token) throw new Error('SEM_LOGIN')
  const r = await fetch(urlApi('push'), {
    method: 'POST',
    keepalive,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  })
  let dados = null
  try {
    dados = await r.json()
  } catch {}
  if (!r.ok) {
    const e = new Error(dados?.erro || `HTTP_${r.status}`)
    e.status = r.status
    e.doServidor = dados?.erro || ''
    throw e
  }
  return dados || {}
}
const BLOQUEADO =
  'As notificações estão bloqueadas. Libere nos ajustes do navegador ou do celular e tente de novo.'
function mensagemErro(e) {
  if (e?.message === 'SEM_LOGIN') return MOTIVOS.conta
  if (e?.message === 'SEM_SW') return 'Não consegui preparar os avisos. Recarregue a página e tente de novo.'
  if (e?.status === 503) return e.doServidor || MOTIVOS.servidor
  if (e?.status === 401) return 'Sua sessão nas Conversas expirou. Abra as Conversas e tente de novo.'
  if (e?.status === 400 && e.doServidor) return e.doServidor
  if (e?.name === 'NotAllowedError') return BLOQUEADO
  if (e?.name === 'AbortError' || e?.name === 'InvalidStateError')
    return 'O serviço de avisos do navegador não respondeu. Confira a internet e tente de novo.'
  if (e instanceof TypeError) return 'Sem internet agora. Confira a conexão e tente de novo.'
  return 'Não consegui ligar os avisos agora. Tente de novo em instantes.'
}
export async function ativarPush() {
  const motivo = motivoPush()
  if (motivo)
    return {
      ok: false,
      erro: MOTIVOS[motivo],
    }
  const perm = await pedirPermissao()
  atualizar()
  if (perm === 'denied')
    return {
      ok: false,
      erro: BLOQUEADO,
    }
  if (perm !== 'granted')
    return {
      ok: false,
      erro: 'Para receber os avisos, toque em Permitir quando o celular perguntar.',
    }
  try {
    const sub = await inscricao({
      criar: true,
    })
    await chamarServidor({
      acao: 'inscrever',
      inscricao: sub.toJSON(),
    })
    salvar(CHAVE, {
      endpoint: sub.endpoint,
      uid: uidAtual(),
      em: Date.now(),
    })
    atualizar()
    return {
      ok: true,
    }
  } catch (e) {
    console.warn('[Kleo] Avisos não ligados:', e?.message || e)
    return {
      ok: false,
      erro: mensagemErro(e),
    }
  }
}
export async function desativarPush() {
  remover(CHAVE)
  try {
    const reg = await registroSW(4000)
    const sub = await reg?.pushManager?.getSubscription()
    if (sub) {
      chamarServidor({
        acao: 'remover',
        endpoint: sub.endpoint,
      }).catch(() => {})
      await sub.unsubscribe()
    }
  } catch {}
  atualizar()
  return {
    ok: true,
  }
}
export async function testarPush() {
  try {
    const r = await chamarServidor({
      acao: 'testar',
    })
    if (!r.enviados)
      return {
        ok: false,
        erro: 'Este aparelho não está registrado. Desligue e ligue os avisos de novo.',
      }
    return {
      ok: true,
    }
  } catch (e) {
    return {
      ok: false,
      erro: mensagemErro(e),
    }
  }
}
const idDe = v => (v && typeof v === 'object' ? v.id || v.uid : v) || null
export function avisarPush({ para, conversa, mensagem, pedido } = {}) {
  try {
    if (!VAPID || modoRede() !== 'supabase') return
    if (pedido) {
      if (!idDe(para)) return
      chamarServidor(
        {
          acao: 'pedido',
          para: idDe(para),
          tipo: pedido === 'aceito' ? 'aceito' : 'novo',
        },
        {
          keepalive: true,
        },
      ).catch(() => {})
      return
    }
    const corpo = {
      acao: 'avisar',
      para: idDe(para),
      conversa: idDe(conversa),
      mensagem: idDe(mensagem),
    }
    if (!corpo.para || !corpo.conversa || !corpo.mensagem) return
    chamarServidor(corpo, {
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
let sincronizando = null
export function sincronizarPush({ forcar = false } = {}) {
  if (sincronizando) return sincronizando
  sincronizando = (async () => {
    try {
      const salvo = ler(CHAVE, null)
      if (!salvo || !pushConfigurado()) return
      if (Notification.permission !== 'granted') return
      const sub = await inscricao({
        criar: true,
      })
      if (!sub) return
      const uid = uidAtual()
      const mudou = sub.endpoint !== salvo.endpoint || (!!uid && uid !== salvo.uid)
      if (!forcar && !mudou && Date.now() - (salvo.em || 0) < RENOVAR_MS) return
      await chamarServidor({
        acao: 'inscrever',
        inscricao: sub.toJSON(),
      })
      salvar(CHAVE, {
        endpoint: sub.endpoint,
        uid,
        em: Date.now(),
      })
    } catch (e) {
      console.warn('[Kleo] Avisos: não consegui conferir a inscrição:', e?.message || e)
    } finally {
      sincronizando = null
      atualizar()
    }
  })()
  return sincronizando
}
let iniciado = false
export function iniciarPush() {
  if (iniciado || typeof window === 'undefined') return
  iniciado = true
  window.addEventListener('kleo-push-renovar', () => {
    sincronizarPush({
      forcar: true,
    })
  })
  window.addEventListener('kleo-storage', atualizar)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') atualizar()
  })
  try {
    navigator.permissions
      ?.query({
        name: 'notifications',
      })
      .then(st => {
        st.addEventListener('change', () => {
          atualizar()
          if (Notification.permission === 'granted' && ler(CHAVE, null))
            sincronizarPush({
              forcar: true,
            })
        })
      })
      .catch(() => {})
  } catch {}
  setTimeout(() => {
    sincronizarPush()
  }, 5000)
}
