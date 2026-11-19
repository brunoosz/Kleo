'use strict'

const { app, BrowserWindow, Menu, protocol, net, session, shell, ipcMain, screen } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const ESQUEMA = 'kleo'
const ORIGEM = `${ESQUEMA}://app`
const ID_APP = 'com.kheo.kleo'
const PASTA_DIST = path.join(__dirname, '..', 'dist')
const ICONE = path.join(__dirname, '..', 'build', 'icon.ico')
const CREME = '#f7f4f2'
const DEV_URL = String(process.env.KLEO_DEV_URL || '').replace(/\/+$/, '')
function lerConfiguracao() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).kleo || {}
  } catch {
    return {}
  }
}
const API_BASE = String(process.env.KLEO_API_BASE || lerConfiguracao().apiBase || '')
  .trim()
  .replace(/\/+$/, '')
function ehDaKleo(url) {
  const u = String(url || '')
  if (u === ORIGEM || u.startsWith(`${ORIGEM}/`)) return true
  return !!DEV_URL && (u === DEV_URL || u.startsWith(`${DEV_URL}/`))
}
protocol.registerSchemesAsPrivileged([
  {
    scheme: ESQUEMA,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      codeCache: true,
    },
  },
])
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
}
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: http:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' data: blob: https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:*",
  'frame-src https:',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')
const textoJSON = (status, dados) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
async function servirArquivo(pathname) {
  let relativo
  try {
    relativo = decodeURIComponent(pathname).replace(/^\/+/, '')
  } catch {
    return new Response('Endereço inválido', {
      status: 400,
    })
  }
  if (relativo === 'sw.js')
    return new Response('', {
      status: 404,
    })
  const alvo = path.resolve(PASTA_DIST, relativo)
  if (alvo !== PASTA_DIST && !alvo.startsWith(PASTA_DIST + path.sep))
    return new Response('Proibido', {
      status: 403,
    })
  let arquivo = alvo
  const info = await fs.promises.stat(alvo).catch(() => null)
  if (!info || info.isDirectory()) {
    if (!info && path.extname(relativo))
      return new Response('Não encontrado', {
        status: 404,
      })
    arquivo = path.join(PASTA_DIST, 'index.html')
  }
  const tipo = TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream'
  const cabecalhos = {
    'content-type': tipo,
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
  }
  if (tipo.startsWith('text/html')) cabecalhos['content-security-policy'] = CSP
  return new Response(await fs.promises.readFile(arquivo), {
    headers: cabecalhos,
  })
}
const NAO_REPASSAR = new Set([
  'host',
  'origin',
  'referer',
  'cookie',
  'connection',
  'content-length',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
])
const NAO_DEVOLVER = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'set-cookie',
])
async function repassarApi(request, url) {
  if (!API_BASE) {
    return textoJSON(404, {
      error: {
        message: 'O servidor da Kleo não foi configurado neste app (VITE_API_BASE).',
        code: 'NAO_ENCONTRADO',
      },
    })
  }
  const cabecalhos = new Headers()
  for (const [k, v] of request.headers) {
    const nome = k.toLowerCase()
    if (!NAO_REPASSAR.has(nome) && !nome.startsWith('sec-')) cabecalhos.set(k, v)
  }
  const metodo = request.method.toUpperCase()
  const init = {
    method: metodo,
    headers: cabecalhos,
    redirect: 'follow',
    bypassCustomProtocolHandlers: true,
  }
  if (!['GET', 'HEAD'].includes(metodo)) init.body = Buffer.from(await request.arrayBuffer())
  let resposta
  try {
    resposta = await net.fetch(`${API_BASE}${url.pathname}${url.search}`, init)
  } catch {
    return textoJSON(502, {
      error: {
        message: 'Sem conexão com o servidor da Kleo. Confira a internet.',
        code: 'SEM_REDE',
      },
    })
  }
  const devolver = new Headers()
  resposta.headers.forEach((v, k) => {
    if (!NAO_DEVOLVER.has(k.toLowerCase())) devolver.set(k, v)
  })
  return new Response(resposta.body, {
    status: resposta.status,
    statusText: resposta.statusText,
    headers: devolver,
  })
}
function registrarProtocolo() {
  protocol.handle(ESQUEMA, async request => {
    let url
    try {
      url = new URL(request.url)
    } catch {
      return new Response('Endereço inválido', {
        status: 400,
      })
    }
    if (url.host !== 'app')
      return new Response('Não encontrado', {
        status: 404,
      })
    if (/^\/api(\/|$)/i.test(url.pathname)) return repassarApi(request, url)
    if (!['GET', 'HEAD'].includes(request.method.toUpperCase()))
      return new Response('Método não permitido', {
        status: 405,
      })
    return servirArquivo(url.pathname)
  })
}
const PERMITIDAS = new Set([
  'media',
  'geolocation',
  'notifications',
  'clipboard-read',
  'clipboard-sanitized-write',
  'fullscreen',
  'speaker-selection',
  'screen-wake-lock',
  'idle-detection',
])
function configurarPermissoes(sessao) {
  sessao.setPermissionRequestHandler((wc, permissao, responder, detalhes) => {
    const origem = detalhes?.requestingUrl || wc?.getURL() || ''
    responder(PERMITIDAS.has(permissao) && ehDaKleo(origem))
  })
  sessao.setPermissionCheckHandler((wc, permissao, origemPedido) => {
    return PERMITIDAS.has(permissao) && ehDaKleo(origemPedido || wc?.getURL() || '')
  })
  try {
    sessao.setSpellCheckerLanguages(['pt-BR'])
  } catch {}
}
const ESQUEMAS_EXTERNOS = new Set([
  'https:',
  'http:',
  'mailto:',
  'tel:',
  'sms:',
  'whatsapp:',
  'geo:',
  'maps:',
])
function abrirFora(url) {
  let u
  try {
    u = new URL(url)
  } catch {
    return
  }
  if (ESQUEMAS_EXTERNOS.has(u.protocol)) shell.openExternal(u.href).catch(() => {})
}
function protegerConteudo(wc) {
  wc.setWindowOpenHandler(({ url }) => {
    abrirFora(url)
    return {
      action: 'deny',
    }
  })
  wc.on('will-navigate', (ev, url) => {
    if (ehDaKleo(url)) return
    ev.preventDefault()
    abrirFora(url)
  })
  wc.on('will-redirect', (ev, url) => {
    if (ev.isMainFrame === false || ehDaKleo(url)) return
    ev.preventDefault()
    abrirFora(url)
  })
  wc.on('will-attach-webview', ev => ev.preventDefault())
}
let janela = null
const ARQUIVO_JANELA = () => path.join(app.getPath('userData'), 'janela.json')
function lerEstadoJanela() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_JANELA(), 'utf8')) || {}
  } catch {
    return {}
  }
}
function salvarEstadoJanela() {
  if (!janela || janela.isDestroyed()) return
  try {
    const maximizada = janela.isMaximized()
    const limites = maximizada ? janela.getNormalBounds() : janela.getBounds()
    fs.writeFileSync(
      ARQUIVO_JANELA(),
      JSON.stringify({
        ...limites,
        maximizada,
      }),
    )
  } catch {}
}
const entre = (v, min, max) => Math.max(min, Math.min(max, v))
function limitesIniciais() {
  const salvo = lerEstadoJanela()
  const area = screen.getPrimaryDisplay().workArea
  const largura = entre(Number(salvo.width) || 480, 360, area.width)
  const altura = entre(Number(salvo.height) || Math.min(900, area.height - 40), 560, area.height)
  const limites = {
    width: largura,
    height: altura,
  }
  if (Number.isFinite(salvo.x) && Number.isFinite(salvo.y)) {
    const dentro = screen.getAllDisplays().some(d => {
      const a = d.workArea
      return (
        salvo.x >= a.x - 40 &&
        salvo.y >= a.y - 40 &&
        salvo.x + 120 <= a.x + a.width &&
        salvo.y + 80 <= a.y + a.height
      )
    })
    if (dentro)
      Object.assign(limites, {
        x: salvo.x,
        y: salvo.y,
      })
  }
  return {
    limites,
    maximizada: !!salvo.maximizada,
  }
}
function mostrarJanela() {
  if (!janela || janela.isDestroyed()) return
  if (janela.isMinimized()) janela.restore()
  if (!janela.isVisible()) janela.show()
  janela.focus()
}
function atalhos(wc) {
  wc.on('before-input-event', (ev, entrada) => {
    if (entrada.type !== 'keyDown') return
    const ctrl = entrada.control || entrada.meta
    const tecla = String(entrada.key || '').toLowerCase()
    if (ctrl && (tecla === '=' || tecla === '+' || entrada.code === 'NumpadAdd')) {
      wc.setZoomLevel(Math.min(wc.getZoomLevel() + 0.5, 4))
      ev.preventDefault()
    } else if (ctrl && (tecla === '-' || entrada.code === 'NumpadSubtract')) {
      wc.setZoomLevel(Math.max(wc.getZoomLevel() - 0.5, -3))
      ev.preventDefault()
    } else if (ctrl && tecla === '0') {
      wc.setZoomLevel(0)
      ev.preventDefault()
    } else if (tecla === 'f5' || (ctrl && tecla === 'r')) {
      wc.reload()
      ev.preventDefault()
    } else if (tecla === 'f11') {
      janela?.setFullScreen(!janela.isFullScreen())
      ev.preventDefault()
    } else if (!app.isPackaged && (tecla === 'f12' || (ctrl && entrada.shift && tecla === 'i'))) {
      wc.toggleDevTools()
      ev.preventDefault()
    }
  })
}
function menuDeContexto(wc) {
  wc.on('context-menu', (_ev, p) => {
    const itens = []
    for (const sugestao of (p.dictionarySuggestions || []).slice(0, 4)) {
      itens.push({
        label: sugestao,
        click: () => wc.replaceMisspelling(sugestao),
      })
    }
    if (itens.length)
      itens.push({
        type: 'separator',
      })
    if (p.isEditable) {
      itens.push(
        {
          label: 'Desfazer',
          role: 'undo',
          enabled: p.editFlags.canUndo,
        },
        {
          type: 'separator',
        },
        {
          label: 'Recortar',
          role: 'cut',
          enabled: p.editFlags.canCut,
        },
        {
          label: 'Copiar',
          role: 'copy',
          enabled: p.editFlags.canCopy,
        },
        {
          label: 'Colar',
          role: 'paste',
          enabled: p.editFlags.canPaste,
        },
        {
          label: 'Selecionar tudo',
          role: 'selectAll',
        },
      )
    } else if (p.selectionText && p.selectionText.trim()) {
      itens.push({
        label: 'Copiar',
        role: 'copy',
      })
    } else if (p.linkURL && !ehDaKleo(p.linkURL)) {
      itens.push({
        label: 'Abrir no navegador',
        click: () => abrirFora(p.linkURL),
      })
    }
    if (itens.length)
      Menu.buildFromTemplate(itens).popup({
        window: janela || undefined,
      })
  })
}
function criarJanela() {
  const { limites, maximizada } = limitesIniciais()
  janela = new BrowserWindow({
    ...limites,
    minWidth: 360,
    minHeight: 560,
    show: false,
    title: 'Kleo',
    icon: fs.existsSync(ICONE) ? ICONE : path.join(PASTA_DIST, 'icone-512.png'),
    backgroundColor: CREME,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: true,
      backgroundThrottling: false,
    },
  })
  janela.setMenu(null)
  atalhos(janela.webContents)
  menuDeContexto(janela.webContents)
  janela.once('ready-to-show', () => {
    if (maximizada) janela.maximize()
    janela.show()
  })
  janela.on('close', salvarEstadoJanela)
  janela.on('closed', () => {
    janela = null
  })
  janela.webContents.on('render-process-gone', (_ev, detalhes) => {
    if (detalhes.reason !== 'clean-exit' && janela && !janela.isDestroyed())
      setTimeout(() => janela?.reload(), 800)
  })
  janela.loadURL(DEV_URL || `${ORIGEM}/`)
}
app.commandLine.appendSwitch('lang', 'pt-BR')
app.setName('Kleo')
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', mostrarJanela)
  app.on('web-contents-created', (_ev, wc) => protegerConteudo(wc))
  ipcMain.on('kleo:mostrar-janela', ev => {
    if (janela && ev.sender === janela.webContents) mostrarJanela()
  })
  ipcMain.on('kleo:selo', (ev, n) => {
    if (!janela || ev.sender !== janela.webContents) return
    const total = Math.max(0, Math.min(999, Math.floor(Number(n) || 0)))
    try {
      app.setBadgeCount(total)
    } catch {
      void 0
    }
    if (total > 0 && !janela.isFocused()) janela.flashFrame(true)
    if (total === 0) janela.flashFrame(false)
  })
  app.whenReady().then(() => {
    app.setAppUserModelId(ID_APP)
    Menu.setApplicationMenu(null)
    registrarProtocolo()
    configurarPermissoes(session.defaultSession)
    criarJanela()
  })
  app.on('window-all-closed', () => app.quit())
}
