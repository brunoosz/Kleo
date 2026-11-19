import { ehAppNativo, ehCapacitor, ponteElectron } from './plataforma'
let modLocal = null
function notifLocais() {
  if (!modLocal) modLocal = import('@capacitor/local-notifications').then(m => m.LocalNotifications)
  return modLocal
}
let permNativa = 'default'
const traduzirPerm = s => (s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'default')
export async function conferirPermissaoNativa() {
  if (!ehCapacitor()) return permissao()
  try {
    const LN = await notifLocais()
    permNativa = traduzirPerm((await LN.checkPermissions()).display)
  } catch {}
  return permNativa
}
export function idNotificacao(tag) {
  if (!tag) return 1 + Math.floor(Math.random() * 2000000000)
  let h = 7
  for (const ch of String(tag)) h = (Math.imul(31, h) + ch.codePointAt(0)) | 0
  return h & 0x7fffffff || 1
}
export function canalDe(tag = '', urgente = false) {
  const t = String(tag)
  if (urgente || t.startsWith('sos') || t === 'kleo-sos') return 'kleo-sos'
  if (t.startsWith('msg-')) return 'kleo-mensagens'
  return 'kleo-lembretes'
}
const tiposAcoes = new Map()
export async function tipoDasAcoes(LN, acoes) {
  const lista = acoes.slice(0, 2).filter(a => a && a.action && a.title)
  if (!lista.length) return undefined
  const chave = lista.map(a => `${a.action}:${a.title}`).join('|')
  const id = `kleo-acoes-${idNotificacao(chave)}`
  if (!tiposAcoes.has(id)) {
    tiposAcoes.set(id, {
      id,
      actions: lista.map(a => ({
        id: a.action,
        title: a.title,
        foreground: true,
      })),
    })
    try {
      await LN.registerActionTypes({
        types: [...tiposAcoes.values()],
      })
    } catch {
      return undefined
    }
  }
  return id
}
const agendadosNoSistema = new Map()
export function marcarAgendados(lista) {
  agendadosNoSistema.clear()
  for (const { tag, em } of lista || []) {
    if (!tag) continue
    const t = String(tag)
    agendadosNoSistema.set(t, [...(agendadosNoSistema.get(t) || []), em])
  }
}
function sistemaJaAvisa(tag) {
  if (!tag || typeof document === 'undefined' || document.visibilityState === 'visible') return false
  const horarios = agendadosNoSistema.get(String(tag)) || []
  return horarios.some(em => Math.abs(Date.now() - em) < 5 * 60 * 1000)
}
async function notificarNativo(titulo, { corpo, tag, acoes, url, dados, urgente, silenciosa }) {
  if (permNativa !== 'granted') await conferirPermissaoNativa()
  if (permNativa !== 'granted') return false
  if (sistemaJaAvisa(tag)) return true
  try {
    const LN = await notifLocais()
    const n = {
      id: idNotificacao(tag),
      title: String(titulo || 'Kleo'),
      body: String(corpo || ''),
      channelId: canalDe(tag, urgente),
      autoCancel: true,
      isExactNotification: false,
      extra: {
        url,
        tag: tag || '',
        dados: dados || {},
      },
    }
    if (silenciosa) n.silent = true
    if (Array.isArray(acoes) && acoes.length) {
      const tipo = await tipoDasAcoes(LN, acoes)
      if (tipo) n.actionTypeId = tipo
    }
    await LN.schedule({
      notifications: [n],
    })
    return true
  } catch (e) {
    console.warn('[Kleo] Notificação local não exibida:', e?.message || e)
    return false
  }
}
export const notificacoesSuportadas = () =>
  typeof window !== 'undefined' && (ehCapacitor() || 'Notification' in window)
export function permissao() {
  if (ehCapacitor()) return permNativa
  if (!notificacoesSuportadas()) return 'indisponivel'
  return Notification.permission
}
export async function pedirPermissao() {
  if (ehCapacitor()) {
    try {
      const LN = await notifLocais()
      permNativa = traduzirPerm((await LN.requestPermissions()).display)
    } catch {}
    return permNativa
  }
  if (!notificacoesSuportadas()) return 'indisponivel'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    const r = await Notification.requestPermission()
    return r || Notification.permission
  } catch {
    return new Promise(resolve => {
      try {
        Notification.requestPermission(resolve)
      } catch {
        resolve(Notification.permission)
      }
    })
  }
}
let registro = null
function baseURL() {
  try {
    return import.meta.env.BASE_URL || '/'
  } catch {
    return '/'
  }
}
export async function registroSW(limite = 1500) {
  if (registro) return registro
  if (ehAppNativo()) return null
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise(resolve => setTimeout(() => resolve(null), limite)),
  ])
  if (reg) registro = reg
  return reg
}
export async function notificar(
  titulo,
  { corpo = '', tag, acoes, url = '/', vibrar = true, silenciosa = false, dados = {}, urgente = false } = {},
) {
  if (vibrar) {
    try {
      navigator.vibrate?.([200, 100, 200])
    } catch {}
  }
  if (ehCapacitor())
    return notificarNativo(titulo, {
      corpo,
      tag,
      acoes,
      url,
      dados,
      urgente,
      silenciosa,
    })
  if (permissao() !== 'granted') return false
  const opcoes = {
    body: corpo,
    tag,
    renotify: !!tag,
    icon: `${baseURL()}icone-192.png`,
    badge: `${baseURL()}icone-badge-96.png`,
    silent: silenciosa,
    requireInteraction: urgente,
    vibrate: vibrar ? [200, 100, 200] : undefined,
    data: {
      url,
      ...dados,
    },
  }
  if (Array.isArray(acoes) && acoes.length) opcoes.actions = acoes.slice(0, 2)
  try {
    const reg = await registroSW()
    if (reg?.showNotification) {
      await reg.showNotification(titulo, opcoes)
      return true
    }
  } catch {}
  try {
    delete opcoes.actions
    const n = new Notification(titulo, opcoes)
    n.onclick = () => {
      try {
        ponteElectron()?.mostrarJanela()
      } catch {}
      window.focus()
      n.close()
      if (url && location.pathname + location.search !== url) {
        window.dispatchEvent(
          new CustomEvent('kleo-notificacao', {
            detail: {
              tipo: 'abrir',
              url,
              tag,
              dados,
            },
          }),
        )
      }
    }
    return true
  } catch {
    return false
  }
}
const EVENTOS_SW = new Set(['kleo-notificacao', 'kleo-push', 'kleo-push-renovar'])
export function registrarSW() {
  if (typeof window === 'undefined') return
  if (ehAppNativo()) {
    import('./nativo')
      .then(m => m.iniciarNativo())
      .catch(e => console.warn('[Kleo] App nativo não iniciado:', e?.message || e))
    return
  }
  if (!('serviceWorker' in navigator)) return
  const registrar = () => {
    navigator.serviceWorker
      .register(`${baseURL()}sw.js`, {
        scope: baseURL(),
        updateViaCache: 'none',
      })
      .then(reg => {
        registro = reg
      })
      .catch(e => console.warn('[Kleo] Service worker não registrado:', e?.message || e))
  }
  if (document.readyState === 'complete') registrar()
  else
    window.addEventListener('load', registrar, {
      once: true,
    })
  navigator.serviceWorker.addEventListener('message', ev => {
    const d = ev.data
    if (!d || !EVENTOS_SW.has(d.tipo)) return
    window.dispatchEvent(
      new CustomEvent(d.tipo, {
        detail: d.tipo === 'kleo-push' ? d.aviso : d,
      }),
    )
  })
}
