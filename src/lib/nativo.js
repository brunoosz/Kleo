import { ehCapacitor, plataformaAtual } from './plataforma'
import { conferirPermissaoNativa } from './notificacoes'
const CANAIS = [
  {
    id: 'kleo-lembretes',
    name: 'Lembretes e despertadores',
    description: 'Remédios, rotinas, compromissos e despertadores',
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#D2E534',
  },
  {
    id: 'kleo-mensagens',
    name: 'Mensagens',
    description: 'Mensagens da família e dos amigos',
    importance: 4,
    visibility: 0,
    vibration: true,
  },
  {
    id: 'kleo-sos',
    name: 'Pedidos de ajuda',
    description: 'Quando alguém pede ajuda',
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#D92D34',
  },
]
const INICIO = Date.now()
const ESPERA_MONTAGEM = 2500
function entregarToque(detalhe) {
  const disparar = () =>
    window.dispatchEvent(
      new CustomEvent('kleo-notificacao', {
        detail: detalhe,
      }),
    )
  const falta = ESPERA_MONTAGEM - (Date.now() - INICIO)
  if (falta > 0) setTimeout(disparar, falta)
  else disparar()
}
async function telaDeAbertura() {
  const { SplashScreen } = await import('@capacitor/splash-screen')
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  await SplashScreen.hide({
    fadeOutDuration: 250,
  })
}
async function botaoVoltar(App) {
  await App.addListener('backButton', ({ canGoBack }) => {
    if (document.querySelector('[aria-modal="true"]')) {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      return
    }
    if (canGoBack && location.pathname !== '/home') {
      history.back()
      return
    }
    App.minimizeApp().catch(() => {})
  })
}
async function notificacoesLocais(App) {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  if (plataformaAtual() === 'android') {
    for (const canal of CANAIS) {
      try {
        await LocalNotifications.createChannel(canal)
      } catch {}
    }
  }
  await conferirPermissaoNativa()
  await LocalNotifications.addListener('localNotificationActionPerformed', ev => {
    const extra = ev?.notification?.extra || {}
    const acao = ev?.actionId && ev.actionId !== 'tap' ? ev.actionId : ''
    entregarToque({
      tipo: 'kleo-notificacao',
      acao,
      tag: extra.tag || '',
      url: extra.url || '/',
      dados: extra.dados || {},
    })
  })
  await App.addListener('resume', () => {
    conferirPermissaoNativa()
  })
}
let iniciado = false
export async function iniciarNativo() {
  if (iniciado || typeof window === 'undefined') return
  iniciado = true
  try {
    document.documentElement.dataset.plataforma = plataformaAtual()
  } catch {}
  if (!ehCapacitor()) return
  const { App } = await import('@capacitor/app')
  const etapas = [telaDeAbertura(), notificacoesLocais(App)]
  if (plataformaAtual() === 'android') etapas.push(botaoVoltar(App))
  const resultados = await Promise.allSettled(etapas)
  resultados.forEach(r => {
    if (r.status === 'rejected') console.warn('[Kleo] Parte nativa:', r.reason?.message || r.reason)
  })
  try {
    const { iniciarAgendaNativa } = await import('./agendaNativa')
    await iniciarAgendaNativa(App)
  } catch (e) {
    console.warn('[Kleo] Lembretes com o app fechado indisponíveis:', e?.message || e)
  }
}
