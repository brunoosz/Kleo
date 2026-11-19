import * as Prof from './profissoes'
import { necessidadesDo, ehIdoso } from '../lib/perfil'
const SPEC_PADRAO = {
  cor: '#d8d1ff',
  chapeu: 'nenhum',
  item: 'nenhum',
  oculos: 'nenhum',
  roupa: 'nenhuma',
}
export const MASCOTES_ESPECIAIS = [
  {
    id: 'kleo',
    nome: 'Kleo',
    genero: 'f',
    descricao: 'A assistente padrão',
    spec: {
      ...SPEC_PADRAO,
      cor: '#d8d1ff',
      extra: 'antena',
    },
  },
  {
    id: 'lumi',
    nome: 'Lumi',
    genero: 'f',
    descricao: 'Bengala e óculos escuros',
    spec: {
      ...SPEC_PADRAO,
      cor: '#fff0a6',
      item: 'bengala',
      oculos: 'sol',
    },
  },
  {
    id: 'echo',
    nome: 'Echo',
    genero: 'f',
    descricao: 'Aparelho auditivo',
    spec: {
      ...SPEC_PADRAO,
      cor: '#bfe6fb',
      roupa: 'lenco',
      extra: 'aparelho',
    },
  },
  {
    id: 'vo',
    nome: 'Vô',
    genero: 'm',
    descricao: 'Cabelo branco e óculos',
    spec: {
      ...SPEC_PADRAO,
      cor: '#ffd9c7',
      chapeu: 'cabelo_branco',
      oculos: 'redondo',
      item: 'xicara',
    },
  },
  {
    id: 'ramp',
    nome: 'Ramp',
    genero: 'm',
    descricao: 'Cadeira de rodas',
    spec: {
      ...SPEC_PADRAO,
      cor: '#c9f0d6',
      chapeu: 'bone',
      extra: 'cadeira',
    },
  },
]
const POR_NECESSIDADE = {
  visual: 'lumi',
  auditiva: 'echo',
  cadeirante: 'ramp',
}
function especiaisDoPerfil(profile) {
  const lista = necessidadesDo(profile)
    .map(n => POR_NECESSIDADE[n])
    .filter(Boolean)
  if (ehIdoso(profile)) lista.push('vo')
  return lista
}
const LEGADO = {
  neo: 'estudante',
  chef: 'cozinheiro',
  farmy: 'agricultor',
  homie: 'lar',
  doc: 'enfermeiro',
  ryder: 'motoboy',
  biz: 'empreendedor',
}
const CORES_RESERVA = ['#d8d1ff', '#cdeaa0', '#bfe6fb', '#ffd9c7', '#f6d5e6', '#fff0a6', '#c9f0d6', '#e3d6f5']
function corReserva(id) {
  let h = 0
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return CORES_RESERVA[h % CORES_RESERVA.length]
}
const especial = id => MASCOTES_ESPECIAIS.find(m => m.id === id)
function buscarProfissao(id) {
  try {
    const p = typeof Prof.getProfissao === 'function' ? Prof.getProfissao(id) : null
    if (!p) return null
    if (p.id === 'outro' && id !== 'outro') return null
    return p
  } catch {
    return null
  }
}
function daProfissao(p) {
  const { genero, nome, ...visual } = p.mascote || {}
  return {
    id: p.id,
    nome: nome || p.label || 'Kleo',
    genero: genero === 'f' ? 'f' : 'm',
    descricao: p.label || '',
    spec: {
      ...SPEC_PADRAO,
      cor: corReserva(p.id),
      ...visual,
    },
  }
}
function normalizar(id) {
  if (!id || id === 'auto' || typeof id !== 'string') return null
  if (especial(id)) return id
  const alvo = LEGADO[id] || id
  const p = buscarProfissao(alvo)
  return p ? p.id : null
}
export function getMascoteSpec(id) {
  const norm = normalizar(id)
  if (!norm) return especial('kleo')
  const esp = especial(norm)
  if (esp) return esp
  const p = buscarProfissao(norm)
  return p ? daProfissao(p) : especial('kleo')
}
export function generoDoMascote(id) {
  return getMascoteSpec(id).genero === 'm' ? 'm' : 'f'
}
export function resolverMascote(profile, kleoMascote) {
  const escolhido = normalizar(kleoMascote)
  if (escolhido) return escolhido
  const nec = especiaisDoPerfil(profile)[0]
  if (nec) return nec
  const prof = normalizar(profile?.profissao)
  return prof || 'kleo'
}
export function sugeridos(profile) {
  const lista = [
    normalizar(profile?.profissao),
    ...(Array.isArray(profile?.profissoesExtras) ? profile.profissoesExtras.map(normalizar) : []),
    ...especiaisDoPerfil(profile),
    'kleo',
  ].filter(Boolean)
  return [...new Set(lista)]
}
function montarLista() {
  const profs = Array.isArray(Prof.PROFISSOES) ? Prof.PROFISSOES : []
  return [
    ...MASCOTES_ESPECIAIS.map(m => ({
      id: m.id,
      nome: m.nome,
      descricao: m.descricao,
      cor: m.spec.cor,
    })),
    ...profs
      .filter(p => p && p.id)
      .map(p => {
        const m = daProfissao(p)
        return {
          id: m.id,
          nome: m.nome,
          descricao: m.descricao,
          cor: m.spec.cor,
        }
      }),
  ]
}
export const MASCOTES = montarLista()
export function getMascote(id) {
  const m = getMascoteSpec(id)
  return {
    id: m.id,
    nome: m.nome,
    descricao: m.descricao,
    cor: m.spec.cor,
  }
}
