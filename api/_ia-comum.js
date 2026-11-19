import process from 'node:process'
import { chavesServidor } from './_cofre.js'
export const LIMITE_CORPO = 4 * 1024 * 1024
export const MAX_TOKENS = 1500
export const TEMPO_RESPOSTA_MS = 15000
export const TEMPO_INATIVO_MS = 30000
export const ORCAMENTO_MS = 28000
export const MODELOS = {
  groq: {
    texto: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    rapido: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
    visao: ['qwen/qwen3.8-27b'],
    transcricao: ['whisper-large-v3-turbo', 'whisper-large-v3'],
  },
  gemini: {
    texto: ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash', 'gemini-flash-latest'],
    visao: ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'],
    navegacao: [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ],
    transcricao: ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash'],
  },
  openai: {
    texto: ['gpt-4.1-mini', 'gpt-4o-mini'],
    rapido: ['gpt-4.1-nano', 'gpt-4.1-mini'],
    visao: ['gpt-4.1-mini', 'gpt-4o-mini'],
    transcricao: ['gpt-4o-mini-transcribe', 'whisper-1'],
  },
  openrouter: {
    texto: ['openai/gpt-4o-mini', 'google/gemini-2.5-flash'],
    visao: ['openai/gpt-4o-mini', 'google/gemini-2.5-flash'],
  },
}
export async function chavesIA() {
  const k = await chavesServidor()
  return {
    groq: k.groq,
    gemini: k.gemini,
    openrouter: k.openrouter,
    openai: k.openai,
  }
}
export function bases() {
  const teste =
    !process.env.VERCEL && process.env.KLEO_IA_TESTE_BASE
      ? String(process.env.KLEO_IA_TESTE_BASE).trim().replace(/\/+$/, '')
      : ''
  return {
    groq: teste ? `${teste}/groq/openai/v1` : 'https://api.groq.com/openai/v1',
    geminiOpenAI: teste
      ? `${teste}/gemini/v1beta/openai`
      : 'https://generativelanguage.googleapis.com/v1beta/openai',
    gemini: teste ? `${teste}/gemini/v1beta` : 'https://generativelanguage.googleapis.com/v1beta',
    openai: teste ? `${teste}/openai/v1` : 'https://api.openai.com/v1',
    openrouter: teste ? `${teste}/openrouter/api/v1` : 'https://openrouter.ai/api/v1',
    elevenlabs: teste ? `${teste}/elevenlabs` : 'https://api.elevenlabs.io',
    googleTiles: teste ? `${teste}/googletiles` : 'https://tile.googleapis.com',
  }
}
export function disponibilidade(k) {
  const tem = p => (k?.[p] || []).length > 0
  const algum = ['groq', 'gemini', 'openrouter', 'openai'].some(tem)
  return {
    ok: algum,
    chat: algum,
    visao: algum,
    transcricao: tem('groq') || tem('gemini') || tem('openai'),
    provedores: ['groq', 'gemini', 'openrouter', 'openai'].filter(tem),
  }
}
export function erroJSON(status, code, message, extra = {}) {
  const headers = {
    'Cache-Control': 'no-store',
  }
  if (extra.retryAfter) headers['Retry-After'] = String(extra.retryAfter)
  return Response.json(
    {
      error: {
        message,
        code,
        ...extra,
      },
    },
    {
      status,
      headers,
    },
  )
}
export const mascarar = texto =>
  String(texto || '')
    .replace(
      /(gsk_|sk-or-v1-|sk-or-|sk-ant-|sk-proj-|sk_|sk-|AIza|sb_secret_|sb_publishable_)[A-Za-z0-9_-]{4,}/g,
      '$1***',
    )
    .replace(/\d{6,}/g, '***')
    .replace(/\s+/g, ' ')
    .trim()
export function origemPermitida(request) {
  const origem = request.headers.get('origin')
  if (!origem) return true
  let o
  try {
    o = new URL(origem)
  } catch {
    return false
  }
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(o.hostname)) return true
  let hostPedido = ''
  try {
    hostPedido = new URL(request.url).host
  } catch {}
  const hosts = [request.headers.get('x-forwarded-host'), request.headers.get('host'), hostPedido]
    .filter(Boolean)
    .map(h => String(h).split(',')[0].trim().toLowerCase())
  if (hosts.includes(o.host.toLowerCase())) return true
  const extras = String(process.env.KLEO_ORIGENS || '')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean)
  return extras.includes(o.origin.toLowerCase())
}
export const erroOrigem = () =>
  erroJSON(403, 'IA_INTEGRADA_ORIGEM', 'Este endereço não pode usar a IA da Kleo.')
const LIMITES = {
  conversa: {
    minuto: 20,
    dia: 300,
  },
  navegacao: {
    minuto: 45,
    dia: 2500,
  },
  transcricao: {
    minuto: 10,
    dia: 150,
  },
  verificar: {
    minuto: 4,
    dia: 40,
  },
  voz: {
    minuto: 120,
    dia: 3000,
  },
  vozes: {
    minuto: 6,
    dia: 60,
  },
  cofreTeste: {
    minuto: 12,
    dia: 200,
  },
  mapa: {
    minuto: 900,
    dia: 30000,
  },
}
const UM_DIA = 24 * 60 * 60 * 1000
const contadores = globalThis.__kleoLimitesIA || (globalThis.__kleoLimitesIA = new Map())
export function ipDe(request) {
  const h = request.headers
  const bruto = h.get('x-real-ip') || String(h.get('x-forwarded-for') || '').split(',')[0]
  return String(bruto || 'desconhecido')
    .trim()
    .slice(0, 64)
}
export function limitar(ip, grupo) {
  const regra = LIMITES[grupo] || LIMITES.conversa
  const agora = Date.now()
  const chave = `${grupo}|${ip}`
  let c = contadores.get(chave)
  if (!c || agora - c.diaInicio > UM_DIA)
    c = {
      minuto: [],
      dia: 0,
      diaInicio: agora,
    }
  c.minuto = c.minuto.filter(t => agora - t < 60000)
  if (c.dia >= regra.dia) {
    contadores.set(chave, c)
    return {
      ok: false,
      motivo: 'dia',
      retryAfter: Math.ceil((c.diaInicio + UM_DIA - agora) / 1000),
    }
  }
  if (c.minuto.length >= regra.minuto) {
    contadores.set(chave, c)
    return {
      ok: false,
      motivo: 'minuto',
      retryAfter: Math.max(1, Math.ceil((c.minuto[0] + 60000 - agora) / 1000)),
    }
  }
  c.minuto.push(agora)
  c.dia++
  contadores.set(chave, c)
  if (contadores.size > 5000) {
    for (const [k, v] of contadores) if (agora - v.diaInicio > UM_DIA) contadores.delete(k)
  }
  return {
    ok: true,
  }
}
export function erroLimite(r) {
  const msg =
    r.motivo === 'dia'
      ? 'Você usou bastante a IA grátis da Kleo hoje. Ela volta amanhã.'
      : 'Muitos pedidos seguidos para a IA grátis da Kleo. Espere um pouquinho.'
  return erroJSON(429, 'IA_INTEGRADA_LIMITE', msg, {
    retryAfter: r.retryAfter,
  })
}
export function lerCorpoErro(txt) {
  let j = null
  try {
    j = JSON.parse(txt)
  } catch {}
  const raiz = Array.isArray(j) ? j[0] : j
  const bruto = raiz && typeof raiz === 'object' ? (raiz.error ?? raiz) : null
  const e =
    typeof bruto === 'string'
      ? {
          message: bruto,
        }
      : bruto && typeof bruto === 'object'
        ? bruto
        : {}
  const detalhes = Array.isArray(e.details) ? e.details : []
  const info = detalhes.find(d => d && typeof d === 'object' && d.reason) || {}
  const legado = Array.isArray(e.errors) ? e.errors.find(x => x && x.reason) : null
  const mensagem = (typeof e.message === 'string' && e.message) || (j ? '' : String(txt || ''))
  return {
    detalhe: String(mensagem).replace(/\s+/g, ' ').trim().slice(0, 300),
    motivo: String(info.reason || legado?.reason || (typeof e.code === 'string' ? e.code : '') || '').trim(),
    estado: typeof e.status === 'string' ? e.status : '',
  }
}
export function tipoFalha(status, c) {
  const d = `${c.detalhe} ${c.motivo}`.toLowerCase()
  const motivo = c.motivo.toUpperCase()
  if (status === 429 || /RATE_LIMIT|RESOURCE_EXHAUSTED|DAILYLIMIT/.test(motivo)) return 'limite'
  const chaveRuim = status === 400 && /api key|api_key/.test(d) && !/reasoning|thinking/.test(d)
  if (
    /^API_KEY_|SERVICE_DISABLED|CONSUMER_|BILLING|INVALID_API_KEY/.test(motivo) ||
    status === 401 ||
    status === 403 ||
    chaveRuim
  )
    return 'chave'
  if (status === 413 || /too large|context.length|maximum context/.test(d)) return 'grande'
  if (status === 404 || /model_not_found|model_decommissioned/.test(d)) return 'modelo'
  if (
    status === 400 &&
    /model/.test(d) &&
    /not found|does not exist|decommission|no longer|not supported for|unknown model|invalid model/.test(d) &&
    !/reasoning|thinking|parameter|argument/.test(d)
  )
    return 'modelo'
  if (status >= 500) return 'servidor'
  return 'pedido'
}
export async function lerFalha(r, alvo) {
  const txt = await r.text().catch(() => '')
  const c = lerCorpoErro(txt)
  let tipo = tipoFalha(r.status, c)
  if (/insufficient_quota|billing/i.test(`${c.motivo} ${c.detalhe}`) && tipo !== 'limite') tipo = 'limite'
  const motivo = c.motivo || (tipo === 'chave' && /api key/i.test(c.detalhe) ? 'API_KEY_INVALID' : '')
  return {
    provedor: alvo.provedor,
    modelo: alvo.modelo,
    chaveId: alvo.chaveId,
    status: r.status,
    tipo,
    motivo,
    detalhe: mascarar(c.detalhe),
  }
}
export function erroFinal(falhas) {
  const tipos = new Set(falhas.map(f => f.tipo))
  const resumo = falhas
    .map(f => `${f.provedor}/${f.modelo}: ${f.status || f.tipo}${f.motivo ? ' ' + f.motivo : ''}`)
    .join('; ')
    .slice(0, 400)
  for (const f of falhas)
    console.warn(
      '[Kleo IA servidor]',
      f.provedor,
      f.modelo,
      f.status || '',
      f.tipo,
      f.motivo || '',
      f.detalhe || '',
    )
  if (tipos.has('limite'))
    return erroJSON(429, 'IA_INTEGRADA_LIMITE', 'A IA grátis da Kleo está muito usada agora.', {
      detalhe: resumo,
      retryAfter: 30,
    })
  if (falhas.length && falhas.every(f => f.tipo === 'chave')) {
    const motivos = [...new Set(falhas.map(f => `${f.provedor}: ${f.motivo || 'HTTP ' + f.status}`))].join(
      ', ',
    )
    return erroJSON(503, 'IA_INTEGRADA_CHAVE', `Chave do servidor recusada (${motivos}).`, {
      detalhe: resumo,
    })
  }
  if (falhas.length && falhas.every(f => f.tipo === 'grande'))
    return erroJSON(413, 'IA_INTEGRADA_GRANDE', 'A mensagem ficou grande demais.', {
      detalhe: resumo,
    })
  if (falhas.length && falhas.every(f => f.tipo === 'pedido'))
    return erroJSON(400, 'IA_INTEGRADA_PEDIDO', falhas[0].detalhe || 'O provedor recusou o pedido.', {
      detalhe: resumo,
    })
  return erroJSON(502, 'IA_INTEGRADA_FALHOU', 'Os provedores de IA não responderam agora.', {
    detalhe: resumo,
  })
}
export async function buscarComTempo(url, init, { tempoMs = TEMPO_RESPOSTA_MS, sinal } = {}) {
  const ctrl = new AbortController()
  const repassar = () => ctrl.abort()
  if (sinal?.aborted) ctrl.abort()
  sinal?.addEventListener?.('abort', repassar, {
    once: true,
  })
  const timer = setTimeout(() => ctrl.abort(), tempoMs)
  try {
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
    })
    return {
      r,
      ctrl,
      soltar: () => sinal?.removeEventListener?.('abort', repassar),
    }
  } catch (e) {
    sinal?.removeEventListener?.('abort', repassar)
    return {
      erro: e,
      estourou: ctrl.signal.aborted && !sinal?.aborted,
      ctrl,
    }
  } finally {
    clearTimeout(timer)
  }
}
export async function testarChave(servico, valor, { voz = 'EXAVITQu4vr4xnSDxMaL' } = {}) {
  const b = bases()
  const inicio = Date.now()
  const pedidos = {
    groq: () => [
      `${b.groq}/models`,
      {
        headers: {
          Authorization: `Bearer ${valor}`,
        },
      },
    ],
    gemini: () => [
      `${b.gemini}/models?pageSize=1`,
      {
        headers: {
          'x-goog-api-key': valor,
        },
      },
    ],
    openai: () => [
      `${b.openai}/models`,
      {
        headers: {
          Authorization: `Bearer ${valor}`,
        },
      },
    ],
    openrouter: () => [
      `${b.openrouter}/key`,
      {
        headers: {
          Authorization: `Bearer ${valor}`,
        },
      },
    ],
    elevenlabs: () => [
      `${b.elevenlabs}/v1/text-to-speech/${voz}?output_format=mp3_22050_32`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': valor,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: 'Oi.',
          model_id: 'eleven_flash_v2_5',
        }),
      },
    ],
    google_maps: () => [
      `${b.googleTiles}/v1/createSession?key=${encodeURIComponent(valor)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mapType: 'roadmap',
          language: 'pt-BR',
          region: 'BR',
        }),
      },
    ],
  }
  if (!pedidos[servico])
    return {
      ok: false,
      ms: 0,
      codigo: 'SEM_TESTE',
      detalhe: 'Este serviço não tem teste automático.',
    }
  const tirarChave = s =>
    String(s || '')
      .split(valor)
      .join('***')
  const [url, init] = pedidos[servico]()
  const res = await buscarComTempo(url, init, {
    tempoMs: 12000,
  })
  const ms = Date.now() - inicio
  if (res.erro)
    return {
      ok: false,
      ms,
      codigo: res.estourou ? 'TEMPO' : 'REDE',
      detalhe: mascarar(tirarChave(res.erro?.message)),
    }
  res.soltar()
  if (res.r.ok) {
    await res.r.body?.cancel().catch(() => {})
    return {
      ok: true,
      ms,
    }
  }
  const txt = tirarChave(await res.r.text().catch(() => ''))
  const status = res.r.status
  if (servico === 'elevenlabs') {
    let det = null
    try {
      det = JSON.parse(txt)?.detail
    } catch {}
    const motivo = String((det && typeof det === 'object' ? det.status || det.code : '') || '')
    const detalhe = mascarar(typeof det === 'string' ? det : det?.message || txt).slice(0, 200)
    const codigo =
      /quota|credit|limit/i.test(motivo) || status === 429
        ? 'SEM_COTA'
        : /missing_permissions/i.test(motivo)
          ? 'SEM_PERMISSAO_VOZ'
          : status === 401 || status === 403
            ? 'CHAVE_RECUSADA'
            : 'ERRO'
    return {
      ok: false,
      ms,
      status,
      codigo,
      motivo,
      detalhe,
    }
  }
  const c = lerCorpoErro(txt)
  const tipo = tipoFalha(status, c)
  const motivo = c.motivo || c.estado || ''
  if (servico === 'google_maps') {
    const d = `${motivo} ${c.detalhe}`
    const codigo = /API_KEY_INVALID|KEYINVALID|api key not valid|expired/i.test(d)
      ? 'CHAVE_RECUSADA'
      : /SERVICE_DISABLED|ACCESSNOTCONFIGURED|has not been used|is disabled/i.test(d)
        ? 'API_DESATIVADA'
        : /API_KEY_.*BLOCKED|referer|referrer|are blocked/i.test(d)
          ? 'CHAVE_RESTRITA'
          : status === 429 || /RATE_LIMIT|RESOURCE_EXHAUSTED/i.test(d)
            ? 'SEM_COTA'
            : /billing/i.test(d) || status === 403 || status === 404
              ? 'SEM_FATURAMENTO'
              : status === 400 || status === 401
                ? 'CHAVE_RECUSADA'
                : 'ERRO'
    return {
      ok: false,
      ms,
      status,
      codigo,
      motivo,
      detalhe: mascarar(c.detalhe),
    }
  }
  const codigo = /SERVICE_DISABLED|ACCESSNOTCONFIGURED/i.test(motivo)
    ? 'API_DESATIVADA'
    : tipo === 'limite' || /insufficient_quota/i.test(`${motivo} ${c.detalhe}`)
      ? 'SEM_COTA'
      : tipo === 'chave'
        ? 'CHAVE_RECUSADA'
        : 'ERRO'
  return {
    ok: false,
    ms,
    status,
    codigo,
    motivo,
    detalhe: mascarar(c.detalhe),
  }
}
