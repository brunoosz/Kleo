import {
  LIMITE_CORPO,
  MAX_TOKENS,
  TEMPO_INATIVO_MS,
  ORCAMENTO_MS,
  MODELOS,
  chavesIA,
  bases,
  disponibilidade,
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
  testarChave,
} from './_ia-comum.js'
import { penalizar } from './_cofre.js'
const FUNCOES = ['chat', 'rapido', 'visao', 'navegacao', 'json']
const IMAGEM_OK = /^data:image\/(png|jpe?g|webp|gif|heic|heif);base64,/i
const MAX_MENSAGENS = 60
const MAX_IMAGENS = 4
export async function GET(request) {
  if (!origemPermitida(request)) return erroOrigem()
  const k = await chavesIA()
  const dados = disponibilidade(k)
  let verificar = false
  try {
    verificar = new URL(request.url).searchParams.has('verificar')
  } catch {}
  if (verificar && dados.ok) {
    const lim = limitar(ipDe(request), 'verificar')
    if (!lim.ok) return erroLimite(lim)
    dados.verificacao = await verificarChaves(k)
  }
  return Response.json(dados, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
export async function POST(request) {
  if (!origemPermitida(request)) return erroOrigem()
  if (Number(request.headers.get('content-length') || 0) > LIMITE_CORPO)
    return erroJSON(413, 'IA_INTEGRADA_GRANDE', 'A mensagem ficou grande demais.')
  let texto
  try {
    texto = await request.text()
  } catch {
    return erroJSON(400, 'IA_INTEGRADA_PEDIDO', 'Não consegui ler o pedido.')
  }
  if (texto.length > LIMITE_CORPO)
    return erroJSON(413, 'IA_INTEGRADA_GRANDE', 'A mensagem ficou grande demais.')
  let corpo
  try {
    corpo = JSON.parse(texto)
  } catch {
    return erroJSON(400, 'IA_INTEGRADA_PEDIDO', 'O pedido não é um JSON válido.')
  }
  const pedido = validarPedido(corpo)
  if (pedido.erro) return erroJSON(400, 'IA_INTEGRADA_PEDIDO', pedido.erro)
  const k = await chavesIA()
  if (!disponibilidade(k).ok)
    return erroJSON(503, 'IA_INTEGRADA_DESLIGADA', 'A IA integrada não está configurada neste servidor.')
  const lim = limitar(ipDe(request), pedido.funcao === 'navegacao' ? 'navegacao' : 'conversa')
  if (!lim.ok) return erroLimite(lim)
  const plano = planejar(pedido, k)
  if (!plano.length)
    return erroJSON(503, 'IA_INTEGRADA_DESLIGADA', 'Nenhum provedor de IA configurado para esta função.')
  return responder(pedido, plano, request.signal)
}
function validarPedido(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo))
    return {
      erro: 'Pedido vazio.',
    }
  const funcao = FUNCOES.includes(corpo.funcao) ? corpo.funcao : 'chat'
  if (!Array.isArray(corpo.messages) || !corpo.messages.length)
    return {
      erro: 'Faltam as mensagens.',
    }
  if (corpo.messages.length > MAX_MENSAGENS)
    return {
      erro: 'A conversa ficou longa demais.',
    }
  let imagens = 0
  const messages = []
  for (const m of corpo.messages) {
    if (!m || typeof m !== 'object') continue
    if (!['system', 'user', 'assistant'].includes(m.role))
      return {
        erro: 'Papel de mensagem inválido.',
      }
    if (typeof m.content === 'string') {
      if (m.content.trim())
        messages.push({
          role: m.role,
          content: m.content,
        })
      continue
    }
    if (!Array.isArray(m.content))
      return {
        erro: 'Conteúdo de mensagem inválido.',
      }
    const partes = []
    for (const p of m.content) {
      if (p?.type === 'text' && typeof p.text === 'string') {
        if (p.text)
          partes.push({
            type: 'text',
            text: p.text,
          })
      } else if (p?.type === 'image_url') {
        const url = typeof p.image_url === 'string' ? p.image_url : p.image_url?.url
        if (typeof url !== 'string' || !IMAGEM_OK.test(url))
          return {
            erro: 'Imagem inválida: envie como data URL (png, jpeg ou webp).',
          }
        imagens++
        partes.push({
          type: 'image_url',
          image_url: {
            url,
          },
        })
      } else {
        return {
          erro: 'Tipo de conteúdo não suportado.',
        }
      }
    }
    if (partes.length)
      messages.push({
        role: m.role,
        content: partes,
      })
  }
  if (imagens > MAX_IMAGENS)
    return {
      erro: 'Imagens demais em um só pedido.',
    }
  if (!messages.some(m => m.role === 'user'))
    return {
      erro: 'Falta a mensagem da pessoa.',
    }
  const max = Math.round(Number(corpo.max_tokens))
  const temp = Number(corpo.temperature)
  return {
    funcao,
    messages,
    imagens,
    max_tokens: Number.isFinite(max) && max > 0 ? Math.min(max, MAX_TOKENS) : 800,
    temperature: Number.isFinite(temp) ? Math.min(Math.max(temp, 0), 1.5) : 0.7,
    stream: corpo.stream !== false,
  }
}
function planejar(pedido, k) {
  const b = bases()
  const base = {
    groq: b.groq,
    gemini: b.geminiOpenAI,
    openai: b.openai,
    openrouter: b.openrouter,
  }
  const plano = []
  const adicionar = (provedor, modelos, visao = false) => {
    for (const chave of k[provedor] || []) {
      const lista = visao ? [...modelos, chave.modelo] : [chave.modelo, ...modelos]
      for (const modelo of [...new Set(lista.filter(Boolean))]) {
        plano.push({
          provedor,
          modelo,
          visao,
          chave: chave.valor,
          chaveId: chave.id,
          base: base[provedor],
        })
      }
    }
  }
  if (pedido.imagens > 0 || pedido.funcao === 'visao' || pedido.funcao === 'navegacao') {
    adicionar('gemini', pedido.funcao === 'navegacao' ? MODELOS.gemini.navegacao : MODELOS.gemini.visao, true)
    adicionar('openai', MODELOS.openai.visao, true)
    adicionar('openrouter', MODELOS.openrouter.visao, true)
    adicionar('groq', MODELOS.groq.visao, true)
  } else {
    const rapido = pedido.funcao === 'rapido'
    adicionar('groq', rapido ? MODELOS.groq.rapido : MODELOS.groq.texto)
    adicionar('gemini', MODELOS.gemini.texto)
    adicionar('openrouter', MODELOS.openrouter.texto)
    adicionar('openai', rapido ? MODELOS.openai.rapido : MODELOS.openai.texto)
  }
  return plano
}
function montarCorpo(alvo, pedido, semExtras) {
  const messages = alvo.visao
    ? pedido.messages
    : pedido.messages.map(m => ({
        role: m.role,
        content:
          typeof m.content === 'string'
            ? m.content
            : m.content
                .filter(p => p.type === 'text')
                .map(p => p.text)
                .join('\n'),
      }))
  const corpo = {
    model: alvo.modelo,
    messages,
    stream: pedido.stream,
    max_tokens: pedido.max_tokens,
    temperature: pedido.temperature,
  }
  let extras = false
  if (!semExtras) {
    if (alvo.provedor === 'groq' && /gpt-oss/i.test(alvo.modelo)) {
      corpo.reasoning_effort = 'low'
      extras = true
    } else if (alvo.provedor === 'groq' && /qwen/i.test(alvo.modelo)) {
      corpo.reasoning_format = 'hidden'
      extras = true
    } else if (alvo.provedor === 'gemini') {
      corpo.reasoning_effort = /gemini-2\.5-flash/i.test(alvo.modelo) ? 'none' : 'minimal'
      extras = true
    }
  }
  if (alvo.provedor === 'gemini' || /gpt-oss|qwen/i.test(alvo.modelo))
    corpo.max_tokens = pedido.max_tokens + 1024
  if (alvo.provedor === 'openai' && /^(o\d|gpt-5)/.test(alvo.modelo)) {
    delete corpo.max_tokens
    delete corpo.temperature
    corpo.max_completion_tokens = pedido.max_tokens + 1024
  }
  return {
    corpo,
    extras,
  }
}
async function tentar(alvo, pedido, sinal, semExtras = false) {
  const { corpo, extras } = montarCorpo(alvo, pedido, semExtras)
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${alvo.chave}`,
  }
  if (alvo.provedor === 'openrouter') {
    headers['HTTP-Referer'] = 'https://kleo.app'
    headers['X-Title'] = 'Kleo'
  }
  const res = await buscarComTempo(
    `${alvo.base}/chat/completions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(corpo),
    },
    {
      sinal,
    },
  )
  if (res.erro) {
    return {
      falha: {
        provedor: alvo.provedor,
        modelo: alvo.modelo,
        chaveId: alvo.chaveId,
        status: 0,
        tipo: res.estourou ? 'tempo' : 'rede',
        motivo: '',
        detalhe: mascarar(res.erro?.message),
      },
    }
  }
  const { r, ctrl, soltar } = res
  if (!r.ok) {
    soltar()
    const falha = await lerFalha(r, alvo)
    if (falha.tipo === 'pedido' && extras) return tentar(alvo, pedido, sinal, true)
    return {
      falha,
    }
  }
  const cabecalhos = {
    'Cache-Control': 'no-store',
    'X-Kleo-Provedor': alvo.provedor,
    'X-Kleo-Modelo': alvo.modelo,
  }
  const tipo = r.headers.get('content-type') || ''
  if (pedido.stream && r.body && !tipo.includes('application/json')) {
    return {
      resposta: new Response(repassar(r.body, ctrl, soltar), {
        headers: {
          ...cabecalhos,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'X-Accel-Buffering': 'no',
        },
      }),
    }
  }
  const j = await r.json().catch(() => null)
  soltar()
  if (!j)
    return {
      falha: {
        provedor: alvo.provedor,
        modelo: alvo.modelo,
        chaveId: alvo.chaveId,
        status: r.status,
        tipo: 'servidor',
        motivo: '',
        detalhe: 'Resposta inválida do provedor.',
      },
    }
  return {
    resposta: Response.json(j, {
      headers: cabecalhos,
    }),
  }
}
function repassar(origem, ctrl, soltar) {
  const leitor = origem.getReader()
  const codificador = new TextEncoder()
  let timer = null
  const armar = () => {
    clearTimeout(timer)
    timer = setTimeout(() => ctrl.abort(), TEMPO_INATIVO_MS)
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
          const aviso = {
            error: {
              message: 'A resposta da IA foi interrompida.',
              code: 'IA_INTEGRADA_FALHOU',
            },
          }
          controller.enqueue(codificador.encode(`data: ${JSON.stringify(aviso)}\n\n`))
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
async function responder(pedido, plano, sinal) {
  const inicio = Date.now()
  const falhas = []
  const pular = new Set()
  for (const alvo of plano) {
    if (pular.has(alvo.chaveId)) continue
    if (sinal?.aborted) break
    if (falhas.length && Date.now() - inicio > ORCAMENTO_MS) break
    const r = await tentar(alvo, pedido, sinal)
    if (r.resposta) return r.resposta
    falhas.push(r.falha)
    if (r.falha.tipo === 'chave') {
      pular.add(alvo.chaveId)
      penalizar(alvo.chaveId, 'chave')
    } else if (r.falha.tipo === 'limite') penalizar(alvo.chaveId, 'limite')
  }
  return erroFinal(falhas)
}
async function verificarChaves(k) {
  const saida = {}
  for (const p of ['groq', 'gemini', 'openrouter', 'openai']) {
    const lista = (k[p] || []).slice(0, 5)
    if (!lista.length) continue
    const res = await Promise.all(lista.map(c => testarChave(p, c.valor)))
    const bons = res.filter(r => r.ok).length
    const ruim = res.find(r => !r.ok)
    saida[p] = {
      ok: bons > 0,
      chaves: lista.length,
      funcionando: bons,
    }
    if (ruim)
      Object.assign(saida[p], {
        codigo: ruim.codigo,
        motivo: ruim.motivo || undefined,
        detalhe: ruim.detalhe || undefined,
      })
  }
  return saida
}
