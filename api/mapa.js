import {
  erroJSON,
  erroOrigem,
  origemPermitida,
  ipDe,
  limitar,
  buscarComTempo,
  bases,
  mascarar,
  lerCorpoErro,
} from './_ia-comum.js'
import { chavesServidor, penalizar } from './_cofre.js'
const TIPOS = ['roadmap', 'satellite']
const ZOOM_MAX = 22
const CACHE_TILE = 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=604800'
const CACHE_VAZIO = 'public, max-age=3600, s-maxage=86400'
const sessoes = globalThis.__kleoSessoesMapa || (globalThis.__kleoSessoesMapa = new Map())
const inteiro = v => (/^\d{1,8}$/.test(String(v ?? '')) ? Number(v) : NaN)
function refererPermitido(request) {
  const ref = request.headers.get('referer')
  if (!ref) return true
  let origem
  try {
    origem = new URL(ref).origin
  } catch {
    return false
  }
  if (/^(capacitor|ionic|app|file):/i.test(ref)) return true
  return origemPermitida({
    url: request.url,
    headers: {
      get: n => (n === 'origin' ? origem : request.headers.get(n)),
    },
  })
}
async function falhaGoogle(r) {
  const txt = await r.text().catch(() => '')
  const c = lerCorpoErro(txt)
  const d = `${c.motivo} ${c.estado} ${c.detalhe}`
  let tipo = 'servidor'
  if (r.status === 429 || /RATE_LIMIT|RESOURCE_EXHAUSTED/i.test(d)) tipo = 'limite'
  else if (/session/i.test(d) && (r.status === 400 || r.status === 401 || r.status === 403)) tipo = 'sessao'
  else if (
    r.status === 400 ||
    r.status === 401 ||
    r.status === 403 ||
    /API_KEY|billing|SERVICE_DISABLED/i.test(d)
  )
    tipo = 'chave'
  else if (r.status === 404) tipo = 'pedido'
  return {
    status: r.status,
    tipo,
    motivo: c.motivo,
    detalhe: mascarar(c.detalhe).slice(0, 200),
  }
}
async function criarSessao(chave, tipo) {
  const id = `${chave.id}|${tipo}`
  const s = sessoes.get(id)
  if (s && s.expira - 3600000 > Date.now())
    return {
      sessao: s.sessao,
    }
  const corpo = {
    mapType: tipo,
    language: 'pt-BR',
    region: 'BR',
  }
  if (tipo === 'satellite') corpo.layerTypes = ['layerRoadmap']
  const res = await buscarComTempo(
    `${bases().googleTiles}/v1/createSession?key=${encodeURIComponent(chave.valor)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corpo),
    },
    {
      tempoMs: 8000,
    },
  )
  if (res.erro)
    return {
      falha: {
        status: 0,
        tipo: 'rede',
        detalhe: mascarar(res.erro?.message),
      },
    }
  res.soltar()
  if (!res.r.ok)
    return {
      falha: await falhaGoogle(res.r),
    }
  const j = await res.r.json().catch(() => null)
  if (!j?.session)
    return {
      falha: {
        status: 502,
        tipo: 'servidor',
        detalhe: 'createSession sem sessão',
      },
    }
  const expira = Number(j.expiry) * 1000 || Date.now() + 7 * 24 * 3600000
  sessoes.set(id, {
    sessao: String(j.session),
    expira,
  })
  if (sessoes.size > 50) for (const [k, v] of sessoes) if (v.expira < Date.now()) sessoes.delete(k)
  return {
    sessao: String(j.session),
  }
}
export async function GET(request) {
  if (!origemPermitida(request) || !refererPermitido(request)) return erroOrigem()
  let p
  try {
    p = new URL(request.url).searchParams
  } catch {
    return erroJSON(400, 'MAPA_PEDIDO', 'Pedido inválido.')
  }
  const lista = (await chavesServidor()).google_maps || []
  if (p.has('status')) {
    return Response.json(
      {
        ok: lista.length > 0,
        tipos: TIPOS,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      },
    )
  }
  const z = inteiro(p.get('z'))
  const x = inteiro(p.get('x'))
  const y = inteiro(p.get('y'))
  const tipo = p.get('tipo') || 'roadmap'
  const lado = 2 ** z
  if (!TIPOS.includes(tipo) || !(z >= 0 && z <= ZOOM_MAX) || !(x >= 0 && x < lado) || !(y >= 0 && y < lado)) {
    return erroJSON(400, 'MAPA_PEDIDO', 'Tile inválido.')
  }
  if (!lista.length)
    return erroJSON(503, 'MAPA_DESLIGADO', 'O mapa do Google não está ligado neste servidor.')
  const lim = limitar(ipDe(request), 'mapa')
  if (!lim.ok)
    return erroJSON(429, 'MAPA_LIMITE', 'Muitos pedidos de mapa seguidos. Espere um pouquinho.', {
      retryAfter: lim.retryAfter,
    })
  const falhas = []
  for (const chave of lista) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const s = await criarSessao(chave, tipo)
      if (s.falha) {
        falhas.push(s.falha)
        if (s.falha.tipo === 'chave' || s.falha.tipo === 'limite') penalizar(chave.id, s.falha.tipo)
        break
      }
      const url = `${bases().googleTiles}/v1/2dtiles/${z}/${x}/${y}?session=${encodeURIComponent(s.sessao)}&key=${encodeURIComponent(chave.valor)}`
      const res = await buscarComTempo(
        url,
        {
          headers: {
            Accept: 'image/*',
          },
        },
        {
          tempoMs: 10000,
          sinal: request.signal,
        },
      )
      if (res.erro) {
        falhas.push({
          status: 0,
          tipo: 'rede',
          detalhe: mascarar(res.erro?.message),
        })
        break
      }
      res.soltar()
      if (res.r.ok) {
        const corpo = await res.r.arrayBuffer()
        return new Response(corpo, {
          headers: {
            'Content-Type': res.r.headers.get('content-type') || 'image/png',
            'Cache-Control': CACHE_TILE,
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }
      const f = await falhaGoogle(res.r)
      if (f.tipo === 'pedido')
        return new Response(null, {
          status: 404,
          headers: {
            'Cache-Control': CACHE_VAZIO,
          },
        })
      falhas.push(f)
      if (f.tipo === 'sessao' && tentativa === 0) {
        sessoes.delete(`${chave.id}|${tipo}`)
        continue
      }
      if (f.tipo === 'chave' || f.tipo === 'limite') penalizar(chave.id, f.tipo)
      break
    }
  }
  for (const f of falhas.slice(0, 3))
    console.warn('[Kleo mapa]', f.status || '', f.tipo, f.motivo || '', f.detalhe || '')
  if (falhas.some(f => f.tipo === 'limite'))
    return erroJSON(429, 'MAPA_COTA', 'A cota do mapa do Google acabou por agora.', {
      retryAfter: 300,
    })
  if (falhas.length && falhas.every(f => f.tipo === 'chave' || f.tipo === 'sessao'))
    return erroJSON(503, 'MAPA_CHAVE', 'O Google recusou a chave do mapa do servidor.')
  return erroJSON(502, 'MAPA_FALHOU', 'O Google não respondeu agora.')
}
