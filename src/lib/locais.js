import { ler, salvar } from './storage'
import { rotaAPe, rotaCarro, planejarMetro, formatarDuracao } from '../components/MapaRotas'
import { sistemaEm } from '../data/metros'
import { obterPosicao, MODOS_ROTA } from './lugares'
const CHAVE = 'kleo_locais'
export const TIPOS_LOCAL = [
  {
    id: 'casa',
    nome: 'Casa',
  },
  {
    id: 'trabalho',
    nome: 'Trabalho',
  },
  {
    id: 'faculdade',
    nome: 'Faculdade',
  },
  {
    id: 'escola',
    nome: 'Escola',
  },
  {
    id: 'outro',
    nome: 'Outro',
  },
]
const semAcento = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
export function lerLocais() {
  const v = ler(CHAVE, [])
  return Array.isArray(v) ? v.filter(l => l && l.id && Number.isFinite(l.lat) && Number.isFinite(l.lng)) : []
}
export function salvarLocal(local) {
  const lista = lerLocais()
  const nome =
    String(local.nome || '')
      .trim()
      .slice(0, 40) || 'Lugar'
  const item = {
    id: local.id || `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    nome,
    tipo: TIPOS_LOCAL.some(t => t.id === local.tipo) ? local.tipo : 'outro',
    endereco: String(local.endereco || '')
      .trim()
      .slice(0, 160),
    lat: Number(local.lat),
    lng: Number(local.lng),
  }
  const outros = lista.filter(l => l.id !== item.id && semAcento(l.nome) !== semAcento(nome))
  salvar(CHAVE, [...outros, item])
  return item
}
export function removerLocal(id) {
  salvar(
    CHAVE,
    lerLocais().filter(l => l.id !== id),
  )
}
export const localPorId = id => lerLocais().find(l => l.id === id) || null
export function acharLocal(texto) {
  const t = semAcento(texto)
    .replace(/^(a |o |para |pra |ate |no |na |em )+/, '')
    .replace(/^(minha |meu |minhas |meus )/, '')
    .replace(/[.!?]+$/, '')
    .trim()
  if (!t) return null
  const lista = lerLocais()
  return (
    lista.find(l => semAcento(l.nome) === t) ||
    lista.find(l => l.tipo !== 'outro' && semAcento(TIPOS_LOCAL.find(x => x.id === l.tipo)?.nome) === t) ||
    null
  )
}
export function casa() {
  return lerLocais().find(l => l.tipo === 'casa') || null
}
export function linkRota(local, modo = '') {
  const q = new URLSearchParams({
    destino: local.nome,
    lat: String(local.lat),
    lon: String(local.lng),
  })
  if (modo) q.set('modo', modo)
  return `/mapa?${q}`
}
export async function estimarMinutos(origem, destino, modo) {
  if (modo === 'metro') {
    const plano = planejarMetro(origem, destino, {
      sistema: sistemaEm(origem),
    })
    return Math.ceil(plano.minutos)
  }
  if (modo === 'carro' || modo === 'onibus') {
    const r = await rotaCarro(origem, destino)
    return Math.ceil((r.duracao * (modo === 'onibus' ? 1.6 : 1.3)) / 60)
  }
  const r = await rotaAPe(origem, destino)
  return Math.ceil(r.duracao / 60)
}
export async function origemDaSaida(origemId) {
  const o = (origemId && localPorId(origemId)) || casa()
  if (o) return o
  return obterPosicao()
}
export function locaisParaIA() {
  const lista = lerLocais()
  if (!lista.length) return ''
  return `LUGARES SALVOS DA PESSOA (use as coordenadas no NAVEGAR quando ela citar o nome, ex: "me leva pra casa"):\n${lista
    .map(l => `- ${l.nome}${l.endereco ? ' - ' + l.endereco : ''} | coordenadas ${l.lat},${l.lng}`)
    .join('\n')}`
}
export const nomeModo = modo => MODOS_ROTA[modo] || 'a pé'
export const duracaoCurta = min => formatarDuracao(min * 60)
