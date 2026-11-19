import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const SALTO = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-connection',
  'http2-settings',
  'te',
  'trailer',
])
const LIMITE_DEV = 10 * 1024 * 1024
function responderJSON(res, status, dados) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(dados))
}
async function paraRequest(req, res) {
  const seguro = !!req.socket?.encrypted
  const host = req.headers[':authority'] || req.headers.host || 'localhost'
  const url = new URL(req.originalUrl || req.url, `${seguro ? 'https' : 'http'}://${host}`)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.startsWith(':') || SALTO.has(k) || v === undefined) continue
    if (Array.isArray(v)) v.forEach(x => headers.append(k, x))
    else headers.set(k, String(v))
  }
  if (!headers.has('host')) headers.set('host', host)
  if (!headers.has('x-forwarded-for') && req.socket?.remoteAddress)
    headers.set('x-forwarded-for', req.socket.remoteAddress)
  const ctrl = new AbortController()
  res.on('close', () => {
    if (!res.writableFinished) ctrl.abort()
  })
  const init = {
    method: req.method,
    headers,
    signal: ctrl.signal,
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    const partes = []
    let total = 0
    for await (const parte of req) {
      total += parte.length
      if (total > LIMITE_DEV) return null
      partes.push(parte)
    }
    init.body = Buffer.concat(partes)
  }
  return new Request(url, init)
}
async function enviarResposta(resposta, res, semCorpo = false) {
  res.statusCode = resposta.status
  resposta.headers.forEach((v, k) => {
    if (!SALTO.has(k)) res.setHeader(k, v)
  })
  if (!resposta.body || semCorpo) {
    resposta.body?.cancel().catch(() => {})
    res.end()
    return
  }
  res.flushHeaders?.()
  const leitor = resposta.body.getReader()
  res.on('close', () => {
    leitor.cancel().catch(() => {})
  })
  try {
    for (;;) {
      const { done, value } = await leitor.read()
      if (done) break
      res.write(value)
    }
  } catch {}
  res.end()
}
function middlewareApi(raiz, carregar, aoErro) {
  return async (req, res, next) => {
    const caminho = String(req.originalUrl || req.url || '').split('?')[0]
    if (!/^\/api(\/|$)/i.test(caminho)) return next()
    const m = /^\/api\/([a-z0-9][a-z0-9-]*)\/?$/i.exec(caminho)
    const nome = m?.[1]
    const arquivo = nome ? path.join(raiz, 'api', `${nome}.js`) : ''
    if (!nome || !fs.existsSync(arquivo))
      return responderJSON(res, 404, {
        error: {
          message: `Função ${caminho} não existe.`,
          code: 'NAO_ENCONTRADO',
        },
      })
    try {
      const mod = await carregar(nome, arquivo)
      const metodo = String(req.method || 'GET').toUpperCase()
      const fn = mod[metodo] || (metodo === 'HEAD' ? mod.GET : null)
      if (typeof fn !== 'function') {
        const permitidos = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].filter(
          x => typeof mod[x] === 'function',
        )
        res.setHeader('Allow', permitidos.join(', '))
        return responderJSON(res, 405, {
          error: {
            message: 'Método não permitido.',
            code: 'METODO',
          },
        })
      }
      const request = await paraRequest(req, res)
      if (!request)
        return responderJSON(res, 413, {
          error: {
            message: 'Corpo grande demais.',
            code: 'IA_INTEGRADA_GRANDE',
          },
        })
      await enviarResposta(await fn(request), res, metodo === 'HEAD')
    } catch (e) {
      aoErro?.(e)
      console.error(`[api/${nome}]`, e)
      if (!res.headersSent)
        responderJSON(res, 500, {
          error: {
            message: `Erro interno em /api/${nome}.`,
            code: 'ERRO_SERVIDOR',
          },
        })
      else res.end()
    }
  }
}
function funcoesApi() {
  let raiz = process.cwd()
  return {
    name: 'kleo-funcoes-api',
    apply: 'serve',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v
    },
    configResolved(config) {
      raiz = config.root
    },
    configureServer(server) {
      server.middlewares.use(
        middlewareApi(
          raiz,
          nome => server.ssrLoadModule(`/api/${nome}.js`),
          e => server.ssrFixStacktrace?.(e),
        ),
      )
    },
    configurePreviewServer(server) {
      server.middlewares.use(
        middlewareApi(raiz, (nome, arquivo) => {
          const mtime = fs.statSync(arquivo).mtimeMs
          return import(`${pathToFileURL(arquivo).href}?v=${mtime}`)
        }),
      )
    },
  }
}
function previaComEndereco() {
  return {
    name: 'kleo-previa-com-endereco',
    apply: 'build',
    transformIndexHtml(html) {
      const dominio = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '')
      if (!/^[a-z0-9.-]+(:\d+)?$/i.test(dominio)) return html
      return html.replace(
        /(<meta (?:property="og:image"|name="twitter:image") content=")\/(?!\/)/g,
        `$1https://${dominio}/`,
      )
    },
  }
}
export default defineConfig(({ mode }) => ({
  plugins: [react(), funcoesApi(), previaComEndereco(), ...(mode === 'celular' ? [basicSsl()] : [])],
  server:
    mode === 'celular'
      ? {
          host: true,
        }
      : {},
}))
