/* global process, Buffer */ import { createClient } from '@supabase/supabase-js'
import { sendNotification } from 'web-push'
const UM_DIA = 24 * 60 * 60
const LIMITE_PREVIA = 80
const SERVICOS_PUSH = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
]
const espera = ms => new Promise(r => setTimeout(r, ms))
function lerConfig() {
  const env = process.env
  const limpo = v =>
    String(v || '')
      .trim()
      .replace(/^["']|["']$/g, '')
  let assunto = limpo(env.VAPID_SUBJECT)
  if (assunto && !/^(mailto:|https:)/i.test(assunto) && /^[^@\s]+@[^@\s]+$/.test(assunto))
    assunto = `mailto:${assunto}`
  const vapidServidor = limpo(env.VAPID_PUBLIC_KEY)
  const vapidCliente = limpo(env.VITE_VAPID_PUBLIC_KEY)
  return {
    url: (() => {
      try {
        return new URL(limpo(env.SUPABASE_URL || env.VITE_SUPABASE_URL)).origin
      } catch {
        return ''
      }
    })(),
    chaveServico: limpo(env.SUPABASE_SERVICE_ROLE_KEY),
    vapidPublica: vapidServidor || vapidCliente,
    vapidPrivada: limpo(env.VAPID_PRIVATE_KEY),
    vapidAssunto: assunto,
    vapidDiferente: !!(vapidServidor && vapidCliente && vapidServidor !== vapidCliente),
  }
}
const bytes = chave => {
  try {
    return Buffer.from(chave, 'base64url').length
  } catch {
    return 0
  }
}
function problemas(c) {
  const p = []
  if (!c.url) p.push('SUPABASE_URL (ou VITE_SUPABASE_URL)')
  if (!c.chaveServico) p.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!c.vapidPublica) p.push('VAPID_PUBLIC_KEY (ou VITE_VAPID_PUBLIC_KEY)')
  else if (bytes(c.vapidPublica) !== 65)
    p.push('VAPID_PUBLIC_KEY inválida (gere com: npx web-push generate-vapid-keys)')
  if (!c.vapidPrivada) p.push('VAPID_PRIVATE_KEY')
  else if (bytes(c.vapidPrivada) !== 32)
    p.push('VAPID_PRIVATE_KEY inválida (gere com: npx web-push generate-vapid-keys)')
  if (!c.vapidAssunto) p.push('VAPID_SUBJECT (ex: mailto:seu@email.com)')
  else if (!/^(mailto:\S+@\S+|https:\/\/\S+)$/i.test(c.vapidAssunto))
    p.push('VAPID_SUBJECT inválido (use mailto:seu@email.com)')
  if (c.vapidDiferente)
    p.push('VAPID_PUBLIC_KEY diferente de VITE_VAPID_PUBLIC_KEY (precisam ser a mesma chave)')
  return p
}
const responder = (status, dados) =>
  Response.json(dados, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
let cliente = null
let clienteChave = ''
function supabaseServidor(c) {
  const chave = `${c.url}|${c.chaveServico}`
  if (!cliente || clienteChave !== chave) {
    cliente = createClient(c.url, c.chaveServico, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
    clienteChave = chave
  }
  return cliente
}
export async function GET() {
  const c = lerConfig()
  return responder(200, {
    servico: 'avisos da Kleo',
    configurado: problemas(c).length === 0,
  })
}
export async function POST(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token)
    return responder(401, {
      erro: 'Entre nas Conversas para usar os avisos (falta o token de acesso).',
    })
  const c = lerConfig()
  const falta = problemas(c)
  if (falta.length) {
    return responder(503, {
      erro: `Os avisos com o app fechado não estão configurados no servidor. Confira: ${falta.join('; ')}.`,
      falta,
    })
  }
  let corpo
  try {
    corpo = await request.json()
  } catch {
    return responder(400, {
      erro: 'Pedido inválido (JSON).',
    })
  }
  const sb = supabaseServidor(c)
  let uid
  try {
    const { data, error } = await sb.auth.getUser(token)
    if (error && (error.name === 'AuthRetryableFetchError' || error.status >= 500)) {
      console.error('[push] Supabase fora do ar:', error.message)
      return responder(502, {
        erro: 'Não consegui falar com o Supabase agora. Tente de novo.',
      })
    }
    uid = data?.user?.id
    if (error || !uid)
      return responder(401, {
        erro: 'Sessão inválida ou expirada. Abra as Conversas de novo.',
      })
  } catch (e) {
    console.error('[push] getUser:', e)
    return responder(502, {
      erro: 'Não consegui falar com o Supabase agora. Tente de novo.',
    })
  }
  try {
    switch (corpo?.acao) {
      case 'inscrever':
        return await inscrever(sb, uid, corpo.inscricao)
      case 'remover':
        return await removerInscricao(sb, uid, corpo.endpoint)
      case 'avisar':
        return await avisar(sb, c, uid, corpo)
      case 'pedido':
        return await avisarPedido(sb, c, uid, corpo)
      case 'testar':
        return await testar(sb, c, uid)
      default:
        return responder(400, {
          erro: 'Ação desconhecida.',
        })
    }
  } catch (e) {
    console.error('[push] erro em', corpo?.acao, e)
    return responder(500, {
      erro: 'Erro no servidor de avisos. Tente de novo.',
    })
  }
}
const ehUuid = v =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
function endpointValido(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return false
  try {
    const u = new URL(endpoint)
    const host = u.hostname.toLowerCase()
    return u.protocol === 'https:' && SERVICOS_PUSH.some(s => host === s || host.endsWith(`.${s}`))
  } catch {
    return false
  }
}
function falhou(error, onde) {
  if (error)
    throw new Error(`${onde}: ${error.message || error.code || 'erro do banco'}`, {
      cause: error,
    })
}
async function inscrever(sb, uid, inscricao) {
  const endpoint = inscricao?.endpoint
  const p256dh = String(inscricao?.keys?.p256dh || '')
  const auth = String(inscricao?.keys?.auth || '')
  if (!endpointValido(endpoint))
    return responder(400, {
      erro: 'Este navegador usa um serviço de avisos desconhecido.',
    })
  if (bytes(p256dh) !== 65 || bytes(auth) < 16)
    return responder(400, {
      erro: 'Inscrição de avisos inválida.',
    })
  const { error } = await sb.from('push_inscricoes').upsert(
    {
      endpoint,
      uid,
      p256dh,
      auth,
    },
    {
      onConflict: 'endpoint',
    },
  )
  falhou(error, 'inscrever')
  return responder(200, {
    ok: true,
  })
}
async function removerInscricao(sb, uid, endpoint) {
  if (typeof endpoint !== 'string' || !endpoint)
    return responder(400, {
      erro: 'Falta o endpoint.',
    })
  const { error } = await sb.from('push_inscricoes').delete().eq('endpoint', endpoint).eq('uid', uid)
  falhou(error, 'remover')
  return responder(200, {
    ok: true,
  })
}
async function avisar(sb, c, uid, { para, conversa, mensagem }) {
  if (
    !ehUuid(para) ||
    !ehUuid(mensagem) ||
    typeof conversa !== 'string' ||
    !conversa ||
    conversa.length > 120
  ) {
    return responder(400, {
      erro: 'Dados do aviso incompletos.',
    })
  }
  if (para === uid)
    return responder(200, {
      ok: true,
      ignorado: true,
    })
  const rConv = await sb.from('conversas').select('id, membros').eq('id', conversa).maybeSingle()
  falhou(rConv.error, 'conversa')
  const membros = Array.isArray(rConv.data?.membros) ? rConv.data.membros : []
  if (!membros.includes(para) || !membros.includes(uid))
    return responder(403, {
      erro: 'Esta pessoa não está na conversa.',
    })
  let msg = null
  for (const pausa of [0, 800, 1600, 3200]) {
    if (pausa) await espera(pausa)
    const rMsg = await sb
      .from('mensagens')
      .select('id, conversa_id, de, tipo, texto, duracao, em')
      .eq('id', mensagem)
      .maybeSingle()
    falhou(rMsg.error, 'mensagem')
    msg = rMsg.data
    if (msg) break
  }
  if (!msg || msg.de !== uid || msg.conversa_id !== conversa)
    return responder(404, {
      erro: 'Mensagem não encontrada.',
    })
  const em = Date.parse(msg.em || '')
  if (Number.isFinite(em) && Date.now() - em > UM_DIA * 1000)
    return responder(410, {
      erro: 'Mensagem antiga demais para avisar.',
    })
  const [rPerfil, rApelido, rLidas] = await Promise.all([
    sb.from('perfis').select('nome, usuario').eq('uid', uid).maybeSingle(),
    sb.from('contatos').select('apelido').eq('dono', para).eq('contato', uid).maybeSingle(),
    sb.from('participantes').select('nao_lidas').eq('conversa_id', conversa).eq('uid', para).maybeSingle(),
  ])
  const remetente = {
    uid,
    nome: rPerfil.data?.nome,
    usuario: rPerfil.data?.usuario,
    apelido: rApelido.error ? '' : rApelido.data?.apelido,
  }
  const aviso = montarAviso({
    mensagem: msg,
    remetente,
    conversa,
    quantas: rLidas.error ? 0 : rLidas.data?.nao_lidas,
  })
  const r = await enviarPara(sb, c, para, aviso, {
    urgente: msg.tipo === 'sos',
  })
  return responder(200, {
    ok: true,
    ...r,
  })
}
async function avisarPedido(sb, c, uid, { para, tipo }) {
  if (!ehUuid(para) || para === uid || !['novo', 'aceito'].includes(tipo))
    return responder(400, {
      erro: 'Dados do aviso incompletos.',
    })
  const novo = tipo === 'novo'
  const r = await sb
    .from('amizades')
    .select('aceita, criado_em, aceita_em')
    .eq('de', novo ? uid : para)
    .eq('para', novo ? para : uid)
    .maybeSingle()
  falhou(r.error, 'amizade')
  const linha = r.data
  const quando = Date.parse((novo ? linha?.criado_em : linha?.aceita_em) || '')
  if (!linha || linha.aceita !== !novo || !Number.isFinite(quando) || Date.now() - quando > 10 * 60 * 1000)
    return responder(404, {
      erro: 'Pedido não encontrado.',
    })
  const rPerfil = await sb.from('perfis').select('nome, usuario').eq('uid', uid).maybeSingle()
  const nome =
    previa(rPerfil.data?.nome, 40) || (rPerfil.data?.usuario ? `@${rPerfil.data.usuario}` : 'Alguém')
  const aviso = {
    title: novo ? 'Pedido de amizade · Kleo Pessoas' : 'Pedido aceito · Kleo Pessoas',
    body: novo
      ? `${nome} quer conversar com você. Toque para aceitar.`
      : `${nome} aceitou seu pedido. Agora vocês podem conversar.`,
    tag: `amizade-${uid}`,
    timestamp: Date.now(),
    data: {
      url: novo ? '/pessoas' : `/pessoas/${uid}`,
      tipo: novo ? 'pedido' : 'amizade',
      de: uid,
    },
  }
  const res = await enviarPara(sb, c, para, aviso, {
    urgente: false,
  })
  return responder(200, {
    ok: true,
    ...res,
  })
}
async function testar(sb, c, uid) {
  const aviso = {
    title: 'Kleo',
    body: 'Pronto! Os avisos com o app fechado estão funcionando neste aparelho.',
    tag: 'kleo-teste-push',
    timestamp: Date.now(),
    data: {
      url: '/configuracoes?secao=conversas',
      tipo: 'teste',
    },
  }
  const r = await enviarPara(sb, c, uid, aviso, {
    urgente: false,
  })
  return responder(200, {
    ok: true,
    ...r,
  })
}
const umaLinha = t =>
  String(t || '')
    .replace(/\s+/g, ' ')
    .trim()
function previa(texto, limite = LIMITE_PREVIA) {
  const t = umaLinha(texto)
  return t.length > limite ? `${t.slice(0, limite - 1).trimEnd()}…` : t
}
function duracaoTexto(seg) {
  const s = Math.max(0, Math.round(Number(seg) || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
export function montarAviso({ mensagem, remetente, conversa, quantas = 0 }) {
  const aviso = montarAvisoBase({
    mensagem,
    remetente,
    conversa,
  })
  if (mensagem?.tipo === 'sos') return aviso
  const n = Math.floor(Number(quantas) || 0)
  return {
    ...aviso,
    title: `${aviso.title} · Kleo Pessoas`,
    body: n > 1 ? `${n} mensagens novas · ${aviso.body}` : aviso.body,
  }
}
function montarAvisoBase({ mensagem, remetente, conversa }) {
  const nome =
    previa(remetente?.apelido, 40) ||
    previa(remetente?.nome, 40) ||
    (remetente?.usuario ? `@${remetente.usuario}` : 'Alguém')
  const em = Date.parse(mensagem?.em || '')
  const base = {
    tag: `msg-${conversa}`,
    timestamp: Number.isFinite(em) ? em : Date.now(),
    data: {
      url: `/pessoas/${remetente?.uid}`,
      tipo: mensagem?.tipo || 'texto',
      de: remetente?.uid,
      conversa,
      mensagem: mensagem?.id,
    },
  }
  if (mensagem?.tipo === 'sos') {
    let motivo = previa(mensagem.texto, 120)
    if (/^preciso de ajuda\.?$/i.test(motivo)) motivo = ''
    if (motivo && !/[.!?…]$/.test(motivo)) motivo += '.'
    return {
      ...base,
      tag: `sos-${conversa}`,
      title: 'PEDIDO DE AJUDA',
      body: `${nome} pediu ajuda.${motivo ? ` ${motivo}` : ''} Toque para ver onde a pessoa está.`,
    }
  }
  if (mensagem?.tipo === 'imagem')
    return {
      ...base,
      title: nome,
      body: 'Foto',
    }
  if (mensagem?.tipo === 'local')
    return {
      ...base,
      title: nome,
      body: 'Localização',
    }
  if (mensagem?.tipo === 'audio') {
    return {
      ...base,
      title: nome,
      body: mensagem.duracao ? `Mensagem de voz (${duracaoTexto(mensagem.duracao)})` : 'Mensagem de voz',
    }
  }
  return {
    ...base,
    title: nome,
    body: previa(mensagem?.texto) || 'Nova mensagem',
  }
}
async function enviarPara(sb, c, uid, aviso, { urgente }) {
  const { data: inscricoes, error } = await sb
    .from('push_inscricoes')
    .select('endpoint, p256dh, auth')
    .eq('uid', uid)
  falhou(error, 'inscrições')
  if (!inscricoes?.length)
    return {
      enviados: 0,
      removidas: 0,
      falhas: 0,
      semAparelhos: true,
    }
  const corpo = JSON.stringify(aviso)
  const opcoes = {
    TTL: UM_DIA,
    urgency: urgente ? 'high' : 'normal',
    timeout: 10000,
    vapidDetails: {
      subject: c.vapidAssunto,
      publicKey: c.vapidPublica,
      privateKey: c.vapidPrivada,
    },
  }
  const resultados = await Promise.allSettled(
    inscricoes.map(i =>
      sendNotification(
        {
          endpoint: i.endpoint,
          keys: {
            p256dh: i.p256dh,
            auth: i.auth,
          },
        },
        corpo,
        opcoes,
      ),
    ),
  )
  const vencidas = []
  let enviados = 0
  let falhas = 0
  resultados.forEach((r, k) => {
    if (r.status === 'fulfilled') {
      enviados++
      return
    }
    const status = r.reason?.statusCode
    if (status === 404 || status === 410) {
      vencidas.push(inscricoes[k].endpoint)
      return
    }
    falhas++
    console.warn('[push] falha ao enviar:', status || '', r.reason?.body || r.reason?.message || r.reason)
  })
  if (vencidas.length) {
    const { error: e } = await sb.from('push_inscricoes').delete().in('endpoint', vencidas)
    if (e) console.warn('[push] não apagou inscrições vencidas:', e.message)
  }
  return {
    enviados,
    removidas: vencidas.length,
    falhas,
  }
}
