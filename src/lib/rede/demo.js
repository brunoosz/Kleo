import { idConversa, resumoMensagem, semAcento } from './util'
import { blobParaDataURL } from '../audio'
const CHAVE = 'kleo_demo_rede'
const EU = 'eu-demo'
const PESSOAS = [
  {
    uid: 'demo-ana',
    nome: 'Ana Souza',
    usuario: 'ana.souza',
    foto: null,
  },
  {
    uid: 'demo-carlos',
    nome: 'Carlos Lima',
    usuario: 'carlos.lima',
    foto: null,
  },
  {
    uid: 'demo-rosa',
    nome: 'Rosa Martins',
    usuario: 'dona.rosa',
    foto: null,
  },
  {
    uid: 'demo-pedro',
    nome: 'Pedro Alves',
    usuario: 'pedro.alves',
    foto: null,
  },
]
let memoria = null
const vazio = () => ({
  conta: null,
  contatos: {},
  msgs: {},
  naoLidas: {},
  lidoAte: {},
})
function ler() {
  if (memoria) return memoria
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) || 'null')
    if (v && typeof v === 'object') return (memoria = v)
  } catch {}
  return (memoria = vazio())
}
function semAudiosAntigos(d) {
  const msgs = {}
  for (const [id, lista] of Object.entries(d.msgs || {})) {
    msgs[id] = lista.map((m, i) => {
      if (i >= lista.length - 3) return m
      if (m.audio)
        return {
          ...m,
          audio: null,
          texto: 'Mensagem de voz antiga (o som não ficou guardado).',
        }
      if (m.imagem)
        return {
          ...m,
          imagem: null,
          texto: 'Foto antiga (a imagem não ficou guardada).',
        }
      return m
    })
  }
  return {
    ...d,
    msgs,
  }
}
function gravar(d) {
  memoria = d
  try {
    localStorage.setItem(CHAVE, JSON.stringify(d))
  } catch {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(semAudiosAntigos(d)))
    } catch {}
  }
  ouvintes.forEach(f => f())
}
const ouvintes = new Set()
const assinar = f => {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}
const atraso = ms => new Promise(r => setTimeout(r, ms))
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
if (typeof window !== 'undefined') {
  const esquecer = () => {
    memoria = null
    ouvintes.forEach(f => f())
  }
  window.addEventListener('kleo-storage', e => {
    if (e.detail === CHAVE || e.detail === '*') esquecer()
  })
  window.addEventListener('storage', e => {
    if (e.key === CHAVE || e.key === null) esquecer()
  })
}
export async function minhaConta() {
  return ler().conta
}
export async function usuarioDisponivel(usuario) {
  await atraso(150)
  return !PESSOAS.some(p => p.usuario === usuario)
}
export async function criarConta({ nome, usuario, foto }) {
  const d = ler()
  d.conta = {
    uid: EU,
    nome,
    usuario,
    foto: foto || null,
  }
  if (!Object.keys(d.contatos).length) {
    d.contatos['demo-ana'] = {
      apelido: 'Filha',
      adicionadoEm: Date.now(),
    }
    d.contatos['demo-carlos'] = {
      apelido: '',
      adicionadoEm: Date.now(),
    }
    const primeiro = (nome || '').split(' ')[0]
    const id = idConversa(EU, 'demo-ana')
    d.msgs[id] = [
      {
        id: novoId(),
        de: 'demo-ana',
        tipo: 'texto',
        texto: `Oi${primeiro ? ', ' + primeiro : ''}! Vamos almoçar juntos no domingo ao meio-dia? Faço aquela lasanha.`,
        em: Date.now() - 5 * 60000,
      },
    ]
    d.naoLidas[id] = 1
  }
  gravar(d)
  return d.conta
}
export async function atualizarConta({ nome, usuario, foto }) {
  const d = ler()
  d.conta = {
    ...(d.conta || {
      uid: EU,
    }),
    nome,
    usuario: usuario || d.conta?.usuario,
    foto: foto ?? null,
  }
  gravar(d)
  return d.conta
}
export async function apagarConta() {
  memoria = null
  try {
    localStorage.removeItem(CHAVE)
  } catch {}
  ouvintes.forEach(f => f())
}
export const uidAtual = () => ler().conta?.uid || null
export async function tokenAcesso() {
  return null
}
const paraBusca = s =>
  semAcento(s)
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
export async function buscarPessoas(texto) {
  await atraso(250)
  const t = paraBusca(texto)
  if (t.length < 2) return []
  return PESSOAS.filter(p => p.usuario.includes(t) || paraBusca(p.nome).includes(t))
}
export async function perfilDe(uid) {
  if (uid === EU) return ler().conta
  return PESSOAS.find(p => p.uid === uid) || null
}
const comPerfil = (uid, extra) => ({
  ...((uid === EU && ler().conta) ||
    PESSOAS.find(p => p.uid === uid) || {
      uid,
      nome: 'Contato',
      usuario: '',
      foto: null,
    }),
  ...extra,
})
export function ouvirContatos(cb) {
  const emitir = () => {
    const d = ler()
    cb(
      Object.entries(d.contatos).map(([uid, c]) =>
        comPerfil(uid, {
          apelido: c.apelido || '',
          adicionadoEm: c.adicionadoEm,
        }),
      ),
    )
  }
  emitir()
  return assinar(emitir)
}
export async function adicionarContato(p, apelido = '') {
  const d = ler()
  d.contatos[p.uid] = {
    apelido: apelido || d.contatos[p.uid]?.apelido || '',
    adicionadoEm: d.contatos[p.uid]?.adicionadoEm || Date.now(),
  }
  gravar(d)
}
export function ouvirAmizades(cb) {
  const emitir = () => {
    const d = ler()
    cb(
      Object.entries(d.contatos).map(([uid, c]) =>
        comPerfil(uid, {
          estado: 'amigos',
          em: c.adicionadoEm,
        }),
      ),
    )
  }
  emitir()
  return assinar(emitir)
}
export async function pedirAmizade(uid) {
  const d = ler()
  if (!d.contatos[uid]) {
    d.contatos[uid] = {
      apelido: '',
      adicionadoEm: Date.now(),
    }
    gravar(d)
  }
  return 'amigos'
}
export async function responderAmizade(uid, aceitar) {
  return aceitar ? pedirAmizade(uid) : 'recusado'
}
export async function desfazerAmizade(uid) {
  return removerContato(uid)
}
export async function removerContato(uid) {
  const d = ler()
  delete d.contatos[uid]
  gravar(d)
}
export async function renomearContato(uid, apelido) {
  const d = ler()
  if (d.contatos[uid]) d.contatos[uid].apelido = apelido || ''
  gravar(d)
}
export function ouvirConversas(cb) {
  const emitir = () => {
    const d = ler()
    cb(
      Object.entries(d.msgs)
        .filter(([, l]) => l.length)
        .map(([id, lista]) => {
          const outro = id.split('_').find(u => u !== EU) || EU
          const u = lista[lista.length - 1]
          return {
            id,
            outro,
            consigo: outro === EU,
            ultima: {
              tipo: u.tipo,
              texto: u.tipo === 'sos' ? u.texto || 'Pedido de ajuda' : resumoMensagem(u),
              de: u.de,
              em: u.em,
              duracao: u.duracao,
              transcricao: u.transcricao,
            },
            naoLidas: d.naoLidas[id] || 0,
            lidoAteOutro: d.lidoAte[`${id}:${outro}`] || 0,
            atualizadoEm: u.em,
            perfil: comPerfil(outro),
          }
        }),
    )
  }
  emitir()
  return assinar(emitir)
}
export function ouvirMensagens(outro, cb) {
  const id = idConversa(EU, outro)
  const emitir = () => cb([...(ler().msgs[id] || [])])
  emitir()
  return assinar(emitir)
}
export async function mensagensRecentes(outro, quantas = 10) {
  return (ler().msgs[idConversa(EU, outro)] || []).slice(-quantas)
}
function resposta(msg, nome) {
  const t = String(msg.texto || '').toLowerCase()
  if (msg.tipo === 'sos')
    return 'Recebi seu pedido de ajuda! Estou indo agora. Fique onde está, já liguei para o SAMU.'
  if (msg.tipo === 'audio') return `Ouvi seu áudio, ${nome}! Tá tudo certo, depois a gente conversa mais.`
  if (msg.tipo === 'imagem') return 'Que foto linda!'
  if (msg.tipo === 'local') return 'Vi onde você está, chego em 10 min.'
  if (/estou bem|tô bem|to bem/.test(t)) return 'Que alívio! Qualquer coisa me chama.'
  if (/almo|janta|sair|encontr|visit|passe|caf[ée]|vamos|s[áa]bado|domingo/.test(t))
    return 'Combinado! Pode ser no sábado às 15h aqui em casa?'
  if (/rem[ée]dio|m[ée]dico|consulta|exame/.test(t))
    return 'Não esquece o remédio, viu? Se quiser eu te levo na consulta.'
  if (/^oi|ol[áa]|bom dia|boa tarde|boa noite/.test(t)) return `Oi, ${nome}! Tudo bem por aí?`
  return ['Que bom ter notícias suas!', 'Entendi! Obrigada por avisar.', 'Combinado, falamos mais tarde.'][
    Math.floor(Math.random() * 3)
  ]
}
export async function enviar(outro, msg, conta) {
  const audio = msg.tipo === 'audio' && msg.blob && !msg.audio ? await blobParaDataURL(msg.blob) : msg.audio
  const imagem =
    msg.tipo === 'imagem' && msg.blob && !msg.imagem ? await blobParaDataURL(msg.blob) : msg.imagem
  const dados = {
    ...msg,
    audio,
    imagem,
  }
  const d = ler()
  const id = idConversa(EU, outro)
  const nova = {
    id: novoId(),
    de: EU,
    tipo: msg.tipo || 'texto',
    em: Date.now(),
  }
  for (const k of ['texto', 'audio', 'imagem', 'duracao', 'transcricao', 'lat', 'lng'])
    if (dados[k] !== undefined && dados[k] !== null && dados[k] !== '') nova[k] = dados[k]
  d.msgs[id] = [...(d.msgs[id] || []), nova].slice(-150)
  gravar(d)
  if (PESSOAS.some(p => p.uid === outro)) {
    const nome = (conta?.nome || '').split(' ')[0] || ''
    setTimeout(() => {
      const x = ler()
      x.lidoAte[`${id}:${outro}`] = Date.now()
      gravar(x)
    }, 1200)
    setTimeout(
      () => {
        const x = ler()
        x.msgs[id] = [
          ...(x.msgs[id] || []),
          {
            id: novoId(),
            de: outro,
            tipo: 'texto',
            texto: resposta(nova, nome),
            em: Date.now(),
          },
        ]
        x.naoLidas[id] = (x.naoLidas[id] || 0) + 1
        gravar(x)
      },
      msg.tipo === 'sos' ? 2500 : 3200 + Math.random() * 1500,
    )
  }
  return {
    id: nova.id,
    confirmado: Promise.resolve(true),
  }
}
export async function atualizarMensagem(outro, idMsg, patch) {
  const d = ler()
  const id = idConversa(EU, outro)
  d.msgs[id] = (d.msgs[id] || []).map(m =>
    m.id === idMsg
      ? {
          ...m,
          ...patch,
        }
      : m,
  )
  gravar(d)
}
export async function apagarMensagem(outro, idMsg) {
  const d = ler()
  const id = idConversa(EU, outro)
  d.msgs[id] = (d.msgs[id] || []).filter(m => m.id !== idMsg)
  gravar(d)
}
export async function marcarLida(outro) {
  const d = ler()
  const id = idConversa(EU, outro)
  if (!d.naoLidas[id]) return
  d.naoLidas[id] = 0
  gravar(d)
}
