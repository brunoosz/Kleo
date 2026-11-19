import {
  erroJSON,
  erroOrigem,
  origemPermitida,
  ipDe,
  limitar,
  buscarComTempo,
  bases,
  mascarar,
} from './_ia-comum.js'
import { chavesServidor, penalizar, ajustesApp, marcarVozSemCota } from './_cofre.js'
const MODELOS_VOZ = ['eleven_flash_v2_5', 'eleven_turbo_v2_5', 'eleven_multilingual_v2']
const MODELO_PADRAO = 'eleven_flash_v2_5'
const VOZ_PADRAO = 'EXAVITQu4vr4xnSDxMaL'
const MAX_TEXTO = 1500
const LETRAS_DIA = 40000
const MAX_CORPO = 16 * 1024
const UM_DIA = 24 * 60 * 60 * 1000
const INATIVO_MS = 20000
const letras = globalThis.__kleoLetrasVoz || (globalThis.__kleoLetrasVoz = new Map())
const cacheVozes =
  globalThis.__kleoVozesEleven ||
  (globalThis.__kleoVozesEleven = {
    lista: null,
    em: 0,
  })
const semCache = {
  'Cache-Control': 'no-store',
}
function contarLetras(ip, n) {
  const agora = Date.now()
  let c = letras.get(ip)
  if (!c || agora - c.inicio > UM_DIA)
    c = {
      inicio: agora,
      total: 0,
    }
  if (c.total + n > LETRAS_DIA) {
    letras.set(ip, c)
    return {
      ok: false,
      retryAfter: Math.ceil((c.inicio + UM_DIA - agora) / 1000),
    }
  }
  c.total += n
  letras.set(ip, c)
  if (letras.size > 5000) for (const [k, v] of letras) if (agora - v.inicio > UM_DIA) letras.delete(k)
  return {
    ok: true,
  }
}
async function falhaEleven(r) {
  const txt = await r.text().catch(() => '')
  let j = null
  try {
    j = JSON.parse(txt)
  } catch {}
  const d = j?.detail
  const motivo = String((d && typeof d === 'object' ? d.status || d.code : '') || '')
  const detalhe = mascarar(typeof d === 'string' ? d : d?.message || txt).slice(0, 200)
  let tipo = 'servidor'
  if (r.status === 429 || /quota|credit|limit_exceeded|too_many_concurrent|system_busy/i.test(motivo))
    tipo = 'limite'
  else if (/missing_permissions/i.test(motivo)) tipo = 'permissao'
  else if (r.status === 401 || r.status === 403 || /invalid_api_key|unauthorized/i.test(motivo))
    tipo = 'chave'
  else if (r.status === 400 || r.status === 404 || r.status === 422) tipo = 'pedido'
  return {
    status: r.status,
    tipo,
    motivo,
    detalhe,
    cota: tipo === 'limite' && /quota|credit|limit_exceeded/i.test(`${motivo} ${detalhe}`),
  }
}
const erroVoz = (status, code, message, extra = {}) => erroJSON(status, code, message, extra)
export async function GET(request) {
  if (!origemPermitida(request)) return erroOrigem()
  const k = await chavesServidor()
  const lista = k.elevenlabs || []
  let pedirVozes = false
  try {
    pedirVozes = new URL(request.url).searchParams.has('vozes')
  } catch {}
  if (!pedirVozes) {
    const aj = await ajustesApp()
    return Response.json(
      {
        ok: lista.length > 0,
        aparelho: aj.vozAparelho,
        semCota: aj.vozSemCotaEm > 0 && Date.now() - aj.vozSemCotaEm < UM_DIA,
        modelos: MODELOS_VOZ,
        padrao: MODELO_PADRAO,
      },
      {
        headers: semCache,
      },
    )
  }
  if (!lista.length) return erroVoz(503, 'VOZ_DESLIGADA', 'A voz natural não está ligada neste servidor.')
  const lim = limitar(ipDe(request), 'vozes')
  if (!lim.ok)
    return erroVoz(429, 'VOZ_LIMITE', 'Muitos pedidos seguidos. Espere um pouquinho.', {
      retryAfter: lim.retryAfter,
    })
  if (cacheVozes.lista && Date.now() - cacheVozes.em < 10 * 60 * 1000)
    return Response.json(
      {
        vozes: cacheVozes.lista,
      },
      {
        headers: semCache,
      },
    )
  for (const chave of lista) {
    const res = await buscarComTempo(
      `${bases().elevenlabs}/v1/voices`,
      {
        headers: {
          'xi-api-key': chave.valor,
          Accept: 'application/json',
        },
      },
      {
        tempoMs: 10000,
      },
    )
    if (res.erro) continue
    res.soltar()
    if (!res.r.ok) {
      const f = await falhaEleven(res.r)
      if (f.tipo === 'chave' || f.tipo === 'limite') penalizar(chave.id, f.tipo)
      continue
    }
    const j = await res.r.json().catch(() => null)
    const vozes = (Array.isArray(j?.voices) ? j.voices : [])
      .filter(v => v?.voice_id)
      .map(v => ({
        voice_id: String(v.voice_id),
        name: String(v.name || 'Voz'),
        labels: v.labels && typeof v.labels === 'object' ? v.labels : {},
        preview_url: typeof v.preview_url === 'string' ? v.preview_url : '',
        categoria: String(v.category || ''),
      }))
    cacheVozes.lista = vozes
    cacheVozes.em = Date.now()
    return Response.json(
      {
        vozes,
      },
      {
        headers: semCache,
      },
    )
  }
  return erroVoz(502, 'VOZ_FALHOU', 'Não consegui buscar as vozes agora.')
}
export async function POST(request) {
  if (!origemPermitida(request)) return erroOrigem()
  if (Number(request.headers.get('content-length') || 0) > MAX_CORPO)
    return erroVoz(413, 'VOZ_GRANDE', 'Texto grande demais para a voz natural.')
  let corpo
  try {
    const txt = await request.text()
    if (txt.length > MAX_CORPO) return erroVoz(413, 'VOZ_GRANDE', 'Texto grande demais para a voz natural.')
    corpo = JSON.parse(txt)
  } catch {
    return erroVoz(400, 'VOZ_PEDIDO', 'O pedido não é um JSON válido.')
  }
  const texto = typeof corpo?.texto === 'string' ? corpo.texto.replace(/\s+/g, ' ').trim() : ''
  if (!texto) return erroVoz(400, 'VOZ_PEDIDO', 'Falta o texto.')
  if (texto.length > MAX_TEXTO)
    return erroVoz(413, 'VOZ_GRANDE', `Texto grande demais para a voz natural (até ${MAX_TEXTO} letras).`)
  const voz = /^[A-Za-z0-9]{8,40}$/.test(String(corpo.voz || '')) ? String(corpo.voz) : VOZ_PADRAO
  const escolhido = MODELOS_VOZ.includes(corpo.modelo) ? corpo.modelo : null
  const vel = Number(corpo.velocidade)
  const velocidade = Number.isFinite(vel) ? Math.min(1.2, Math.max(0.7, vel)) : 1
  const lista = (await chavesServidor()).elevenlabs || []
  if (!lista.length) return erroVoz(503, 'VOZ_DESLIGADA', 'A voz natural não está ligada neste servidor.')
  const ip = ipDe(request)
  const lim = limitar(ip, 'voz')
  if (!lim.ok)
    return erroVoz(429, 'VOZ_LIMITE', 'Muitas falas seguidas. Espere um pouquinho.', {
      retryAfter: lim.retryAfter,
    })
  const cota = contarLetras(ip, texto.length)
  if (!cota.ok)
    return erroVoz(429, 'VOZ_COTA', 'A voz natural já falou bastante hoje neste aparelho.', {
      retryAfter: cota.retryAfter,
      aparelho: (await ajustesApp()).vozAparelho,
    })
  const falhas = []
  const inicio = Date.now()
  for (const chave of lista) {
    if (request.signal?.aborted || Date.now() - inicio > 20000) break
    const modelo = escolhido || (MODELOS_VOZ.includes(chave.modelo) ? chave.modelo : MODELO_PADRAO)
    const pedido = {
      text: texto,
      model_id: modelo,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.25,
        use_speaker_boost: true,
        speed: velocidade,
      },
    }
    if (/_v2_5$/.test(modelo)) pedido.language_code = 'pt'
    const res = await buscarComTempo(
      `${bases().elevenlabs}/v1/text-to-speech/${encodeURIComponent(voz)}/stream?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': chave.valor,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(pedido),
      },
      {
        tempoMs: 15000,
        sinal: request.signal,
      },
    )
    if (res.erro) {
      falhas.push({
        status: 0,
        tipo: res.estourou ? 'tempo' : 'rede',
        detalhe: mascarar(res.erro?.message),
      })
      continue
    }
    if (!res.r.ok) {
      res.soltar()
      const f = await falhaEleven(res.r)
      falhas.push(f)
      if (f.tipo === 'chave' || f.tipo === 'permissao' || f.tipo === 'limite') {
        penalizar(chave.id, f.tipo === 'limite' ? 'limite' : 'chave')
        continue
      }
      if (f.tipo === 'pedido') break
      continue
    }
    marcarVozSemCota(false)
    return new Response(repassarAudio(res.r.body, res.ctrl, res.soltar), {
      headers: {
        ...semCache,
        'Content-Type': 'audio/mpeg',
        'X-Kleo-Voz-Modelo': modelo,
        'X-Accel-Buffering': 'no',
      },
    })
  }
  for (const f of falhas)
    console.warn('[Kleo voz servidor]', f.status || '', f.tipo, f.motivo || '', f.detalhe || '')
  if (falhas.some(f => f.tipo === 'pedido'))
    return erroVoz(
      400,
      'VOZ_PEDIDO',
      falhas.find(f => f.tipo === 'pedido').detalhe || 'O serviço de voz recusou o pedido.',
    )
  if (falhas.some(f => f.tipo === 'limite')) {
    const semCota = falhas.some(f => f.tipo === 'limite' && f.cota)
    if (semCota) await marcarVozSemCota(true)
    return erroVoz(429, semCota ? 'VOZ_COTA' : 'VOZ_LIMITE', 'A voz natural está sem cota agora.', {
      retryAfter: semCota ? 3600 : 30,
      aparelho: (await ajustesApp()).vozAparelho,
    })
  }
  if (falhas.length && falhas.every(f => f.tipo === 'chave' || f.tipo === 'permissao'))
    return erroVoz(503, 'VOZ_CHAVE', 'A chave de voz do servidor foi recusada.')
  return erroVoz(502, 'VOZ_FALHOU', 'O serviço de voz não respondeu agora.')
}
function repassarAudio(origem, ctrl, soltar) {
  const leitor = origem.getReader()
  let timer = null
  const armar = () => {
    clearTimeout(timer)
    timer = setTimeout(() => ctrl.abort(), INATIVO_MS)
  }
  const encerrar = () => {
    clearTimeout(timer)
    soltar()
  }
  armar()
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await leitor.read()
        if (done) {
          encerrar()
          controller.close()
          return
        }
        armar()
        controller.enqueue(value)
      } catch {
        encerrar()
        try {
          controller.close()
        } catch {}
      }
    },
    cancel() {
      encerrar()
      ctrl.abort()
      leitor.cancel().catch(() => {})
    },
  })
}
