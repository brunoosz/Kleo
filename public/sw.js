const ESCOPO = self.registration.scope
const ICONE = new URL('icone-192.png', ESCOPO).href
const SELO = new URL('icone-badge-96.png', ESCOPO).href
const ACOES_QUE_ABREM = new Set(['ver', 'abrir'])
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event =>
  event.waitUntil(
    (async () => {
      try {
        await self.registration.navigationPreload?.enable()
      } catch {}
      await self.clients.claim()
    })(),
  ),
)
const SVG = caminhos =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${caminhos.map(d => `<path d="${d}"/>`).join('')}</svg>`
const ICONE_SEM_WIFI = SVG([
  'M12 20h.01',
  'M8.5 16.429a5 5 0 0 1 7 0',
  'M5 12.859a10 10 0 0 1 5.17-2.69',
  'M19 12.859a10 10 0 0 0-2.007-1.523',
  'M2 8.82a15 15 0 0 1 4.177-2.643',
  'M22 8.82a15 15 0 0 0-11.288-3.764',
  'm2 2 20 20',
])
const ICONE_TELEFONE = SVG([
  'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
]).replace(/width="40" height="40"/, 'width="22" height="22"')
const PAGINA_SEM_INTERNET = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f7f4f2">
<title>Kleo · Sem internet</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; }
  body { background: #f7f4f2; color: #000; font-family: Manrope, Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    display: flex; align-items: center; justify-content: center; padding: 24px 16px; min-height: 100vh; }
  main { width: 100%; max-width: 420px; background: #fff; border-radius: 40px; padding: 32px 24px; text-align: center;
    box-shadow: rgba(198, 185, 237, 0.3) 5px 5px 20px 0; }
  .icone { width: 84px; height: 84px; border-radius: 30%; background: #d8d1ff; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 18px; }
  h1 { font-size: 30px; font-weight: 800; line-height: 1.05; }
  p { font-size: 18px; line-height: 1.45; color: #4d4c51; margin-top: 12px; }
  .acoes { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
  .botao { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 58px; border-radius: 25px;
    font: inherit; font-size: 18px; font-weight: 700; border: 0; cursor: pointer; text-decoration: none; }
  .botao:focus-visible { outline: 3px solid #000; outline-offset: 2px; }
  .preto { background: #000; color: #fff; }
  .sos { background: #d92d34; color: #fff; }
  .dica { font-size: 15px; color: #767481; margin-top: 18px; }
</style>
</head>
<body>
<main>
  <div class="icone">${ICONE_SEM_WIFI}</div>
  <h1>Sem internet</h1>
  <p>A Kleo precisa de internet para abrir. Confira o Wi-Fi ou os dados móveis.</p>
  <div class="acoes">
    <button type="button" class="botao preto" onclick="location.reload()">Tentar de novo</button>
    <a class="botao sos" href="tel:192">${ICONE_TELEFONE} Emergência: ligar 192</a>
  </div>
  <p class="dica">Quando a internet voltar, a Kleo abre sozinha.</p>
</main>
<script>addEventListener('online', function () { location.reload() })</script>
</body>
</html>`
self.addEventListener('fetch', event => {
  const req = event.request
  if (req.mode !== 'navigate' || req.method !== 'GET') return
  event.respondWith(
    (async () => {
      try {
        const pre = await event.preloadResponse
        if (pre) return pre
        return await fetch(req)
      } catch {
        return new Response(PAGINA_SEM_INTERNET, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      }
    })(),
  )
})
function lerAviso(dados) {
  if (!dados) return {}
  try {
    return dados.json() || {}
  } catch {
    return {
      body: dados.text(),
    }
  }
}
self.addEventListener('push', event => {
  event.waitUntil(mostrarAviso(lerAviso(event.data)))
})
async function mostrarAviso(aviso) {
  const dados = aviso.data && typeof aviso.data === 'object' ? aviso.data : {}
  const sos = dados.tipo === 'sos'
  const janelas = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  for (const j of janelas)
    j.postMessage({
      tipo: 'kleo-push',
      aviso,
    })
  const appNaTela = janelas.some(j => j.focused || j.visibilityState === 'visible')
  if (appNaTela && !sos && dados.tipo !== 'teste') return
  const opcoes = {
    body: String(aviso.body || ''),
    tag: aviso.tag || 'kleo-aviso',
    renotify: true,
    icon: ICONE,
    badge: SELO,
    lang: 'pt-BR',
    timestamp: Number(aviso.timestamp) || Date.now(),
    data: {
      ...dados,
      url: dados.url || '/',
    },
    vibrate: sos ? [800, 250, 800, 250, 800, 250, 800] : [200, 100, 200],
    requireInteraction: sos,
  }
  if (sos)
    opcoes.actions = [
      {
        action: 'ver',
        title: 'Ver onde está',
      },
    ]
  await self.registration.showNotification(String(aviso.title || 'Kleo'), opcoes)
}
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    (async () => {
      let nova = event.newSubscription || null
      if (!nova) {
        try {
          const chave = event.oldSubscription?.options?.applicationServerKey
          if (chave)
            nova = await self.registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: chave,
            })
        } catch {}
      }
      const janelas = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const j of janelas) {
        j.postMessage({
          tipo: 'kleo-push-renovar',
          antigo: event.oldSubscription?.endpoint || null,
          novo: nova?.endpoint || null,
        })
      }
    })(),
  )
})
self.addEventListener('notificationclick', event => {
  const dados = event.notification.data || {}
  const acao = event.action || ''
  const tag = event.notification.tag
  event.notification.close()
  const destino = new URL(String(dados.url || '/').replace(/^\//, ''), ESCOPO).href
  const abrirTela = !acao || ACOES_QUE_ABREM.has(acao)
  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const msg = {
        tipo: 'kleo-notificacao',
        acao,
        tag,
        url: dados.url || '/',
        dados,
      }
      const janela = janelas.find(c => c.url.startsWith(ESCOPO)) || janelas[0]
      if (janela) {
        janela.postMessage(msg)
        try {
          await janela.focus()
        } catch {}
        if (abrirTela && 'navigate' in janela && janela.url !== destino) {
          try {
            await janela.navigate(destino)
          } catch {}
        }
        return
      }
      const nova = await self.clients.openWindow(abrirTela ? destino : ESCOPO)
      if (nova && acao) nova.postMessage(msg)
    })(),
  )
})
