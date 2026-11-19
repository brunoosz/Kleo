import { Buffer } from 'node:buffer'
import {
  LIMITE_CORPO,
  MODELOS,
  chavesIA,
  bases,
  erroJSON,
  erroOrigem,
  origemPermitida,
  ipDe,
  limitar,
  erroLimite,
  lerFalha,
  erroFinal,
  buscarComTempo,
  mascarar,
} from './_ia-comum.js'
import { penalizar } from './_cofre.js'
const FORMATOS = {
  'audio/webm': {
    ext: 'webm',
    gemini: ['audio/webm'],
  },
  'video/webm': {
    ext: 'webm',
    gemini: ['audio/webm'],
  },
  'audio/mp4': {
    ext: 'm4a',
    gemini: ['audio/m4a', 'audio/mp4', 'audio/aac'],
  },
  'audio/m4a': {
    ext: 'm4a',
    gemini: ['audio/m4a', 'audio/mp4'],
  },
  'audio/x-m4a': {
    ext: 'm4a',
    gemini: ['audio/m4a', 'audio/mp4'],
  },
  'audio/aac': {
    ext: 'm4a',
    gemini: ['audio/aac', 'audio/m4a'],
  },
  'audio/ogg': {
    ext: 'ogg',
    gemini: ['audio/ogg'],
  },
  'audio/opus': {
    ext: 'ogg',
    gemini: ['audio/opus', 'audio/ogg'],
  },
  'audio/mpeg': {
    ext: 'mp3',
    gemini: ['audio/mp3', 'audio/mpeg'],
  },
  'audio/mp3': {
    ext: 'mp3',
    gemini: ['audio/mp3', 'audio/mpeg'],
  },
  'audio/wav': {
    ext: 'wav',
    gemini: ['audio/wav'],
  },
  'audio/x-wav': {
    ext: 'wav',
    gemini: ['audio/wav'],
  },
  'audio/wave': {
    ext: 'wav',
    gemini: ['audio/wav'],
  },
  'audio/flac': {
    ext: 'flac',
    gemini: ['audio/flac'],
  },
  'application/octet-stream': {
    ext: 'webm',
    gemini: ['audio/webm'],
  },
}
const PROMPT =
  'Transcreva exatamente o que é falado neste áudio, em português do Brasil. Responda somente com o texto falado, sem comentários, sem aspas e sem marcação de tempo. Se não houver fala, responda apenas: [sem fala]'
export async function POST(request) {
  if (!origemPermitida(request)) return erroOrigem()
  const k = await chavesIA()
  if (!k.groq.length && !k.gemini.length && !k.openai.length)
    return erroJSON(
      503,
      'IA_INTEGRADA_DESLIGADA',
      'A transcrição integrada não está configurada neste servidor.',
    )
  const mime = String(request.headers.get('content-type') || 'application/octet-stream')
    .split(';')[0]
    .trim()
    .toLowerCase()
  const formato = FORMATOS[mime]
  if (!formato)
    return erroJSON(415, 'IA_INTEGRADA_PEDIDO', `Formato de áudio não suportado (${mime.slice(0, 40)}).`)
  if (Number(request.headers.get('content-length') || 0) > LIMITE_CORPO)
    return erroJSON(413, 'IA_INTEGRADA_GRANDE', 'O áudio ficou grande demais.')
  const lim = limitar(ipDe(request), 'transcricao')
  if (!lim.ok) return erroLimite(lim)
  let audio
  try {
    audio = new Uint8Array(await request.arrayBuffer())
  } catch {
    return erroJSON(400, 'IA_INTEGRADA_PEDIDO', 'Não consegui ler o áudio.')
  }
  if (audio.byteLength > LIMITE_CORPO)
    return erroJSON(413, 'IA_INTEGRADA_GRANDE', 'O áudio ficou grande demais.')
  if (audio.byteLength < 100) return erroJSON(400, 'IA_INTEGRADA_PEDIDO', 'O áudio está vazio.')
  const falhas = []
  const sinal = request.signal
  const inicio = Date.now()
  const tentativas = [
    ...k.groq.map(c => ({
      provedor: 'groq',
      chave: c,
      rodar: () => comWhisper('groq', audio, mime, formato, c.valor, sinal),
    })),
    ...k.openai.map(c => ({
      provedor: 'openai',
      chave: c,
      rodar: () => comWhisper('openai', audio, mime, formato, c.valor, sinal),
    })),
    ...k.gemini.map(c => ({
      provedor: 'gemini',
      chave: c,
      rodar: () => comGemini(audio, formato, c.valor, sinal),
    })),
  ]
  const recusou = new Set()
  for (const t of tentativas) {
    if (sinal?.aborted || (falhas.length && Date.now() - inicio > 45000)) break
    if (recusou.has(t.provedor)) continue
    const r = await t.rodar()
    if (typeof r.texto === 'string')
      return Response.json(
        {
          texto: r.texto,
          provedor: t.provedor,
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      )
    falhas.push(...r.falhas)
    const ultima = r.falhas[r.falhas.length - 1]
    if (ultima?.tipo === 'chave' || ultima?.tipo === 'limite') penalizar(t.chave.id, ultima.tipo)
    if (ultima?.tipo === 'pedido' || ultima?.tipo === 'grande') recusou.add(t.provedor)
  }
  return erroFinal(falhas)
}
const falhaDeRede = (provedor, modelo, res) => ({
  provedor,
  modelo,
  status: 0,
  tipo: res.estourou ? 'tempo' : 'rede',
  motivo: '',
  detalhe: mascarar(res.erro?.message),
})
async function comWhisper(provedor, audio, mime, formato, chave, sinal) {
  const falhas = []
  for (const modelo of MODELOS[provedor].transcricao) {
    const form = new FormData()
    form.append(
      'file',
      new Blob([audio], {
        type: mime,
      }),
      `audio.${formato.ext}`,
    )
    form.append('model', modelo)
    form.append('language', 'pt')
    form.append('response_format', 'json')
    form.append('temperature', '0')
    const res = await buscarComTempo(
      `${bases()[provedor]}/audio/transcriptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${chave}`,
        },
        body: form,
      },
      {
        tempoMs: 30000,
        sinal,
      },
    )
    if (res.erro) {
      falhas.push(falhaDeRede(provedor, modelo, res))
      continue
    }
    res.soltar()
    if (res.r.ok) {
      const j = await res.r.json().catch(() => null)
      if (typeof j?.text === 'string')
        return {
          texto: j.text.trim(),
          falhas,
        }
      falhas.push({
        provedor,
        modelo,
        status: 200,
        tipo: 'servidor',
        motivo: '',
        detalhe: 'Resposta sem texto.',
      })
      continue
    }
    const falha = await lerFalha(res.r, {
      provedor,
      modelo,
    })
    falhas.push(falha)
    if (falha.tipo === 'chave' || falha.tipo === 'pedido' || falha.tipo === 'grande') break
  }
  return {
    falhas,
  }
}
async function comGemini(audio, formato, chave, sinal) {
  const falhas = []
  const dados = Buffer.from(audio).toString('base64')
  for (const modelo of MODELOS.gemini.transcricao) {
    let pensar = true
    let m = 0
    let resultado = null
    for (let volta = 0; volta < 4; volta++) {
      resultado = await pedirGemini({
        modelo,
        mime: formato.gemini[m],
        dados,
        chave,
        sinal,
        pensar,
      })
      if (!resultado.falha)
        return {
          texto: resultado.texto,
          falhas,
        }
      const f = resultado.falha
      if (f.tipo !== 'pedido') break
      const d = `${f.detalhe} ${f.motivo}`.toLowerCase()
      if (pensar && /thinking|reasoning|level|budget/.test(d)) {
        pensar = false
        continue
      }
      if (
        m + 1 < formato.gemini.length &&
        /mime|audio|format|unsupported|not supported|invalid argument/.test(d)
      ) {
        m++
        continue
      }
      break
    }
    falhas.push(resultado.falha)
    if (['chave', 'pedido', 'grande'].includes(resultado.falha.tipo)) break
  }
  return {
    falhas,
  }
}
async function pedirGemini({ modelo, mime, dados, chave, sinal, pensar }) {
  const geracao = {
    temperature: 0,
    maxOutputTokens: 4096,
  }
  if (pensar)
    geracao.thinkingConfig = /gemini-2\.5/i.test(modelo)
      ? {
          thinkingBudget: 0,
        }
      : {
          thinkingLevel: 'minimal',
        }
  const corpo = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mime,
              data: dados,
            },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ],
    generationConfig: geracao,
  }
  const res = await buscarComTempo(
    `${bases().gemini}/models/${encodeURIComponent(modelo)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': chave,
      },
      body: JSON.stringify(corpo),
    },
    {
      tempoMs: 40000,
      sinal,
    },
  )
  if (res.erro)
    return {
      falha: falhaDeRede('gemini', modelo, res),
    }
  res.soltar()
  if (!res.r.ok)
    return {
      falha: await lerFalha(res.r, {
        provedor: 'gemini',
        modelo,
      }),
    }
  const j = await res.r.json().catch(() => null)
  const partes = j?.candidates?.[0]?.content?.parts
  if (!Array.isArray(partes)) {
    const motivo = j?.promptFeedback?.blockReason || j?.candidates?.[0]?.finishReason || 'SEM_TEXTO'
    return {
      falha: {
        provedor: 'gemini',
        modelo,
        status: 200,
        tipo: 'servidor',
        motivo,
        detalhe: 'O Gemini não devolveu texto.',
      },
    }
  }
  const texto = partes
    .filter(p => typeof p?.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('')
    .trim()
  return {
    texto: /^\[?\s*sem fala\s*\]?\.?$/i.test(texto) ? '' : texto,
  }
}
