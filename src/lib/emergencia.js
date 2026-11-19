import { registerPlugin } from '@capacitor/core'
import { ler, salvar } from './storage'
import { plataformaAtual } from './plataforma'
const CHAVE = 'kleo_emergencia'
export const MAX_EMERGENCIA = 5
export function lerContatosEmergencia() {
  const v = ler(CHAVE, [])
  return Array.isArray(v) ? v : []
}
export function salvarContatoEmergencia(c) {
  const lista = lerContatosEmergencia()
  const id = c.id || 'em' + Date.now().toString(36)
  const novo = {
    ...c,
    id,
    nome: String(c.nome || '').trim(),
    telefone: soDigitos(c.telefone),
  }
  const existe = lista.some(x => x.id === id)
  const nova = existe ? lista.map(x => (x.id === id ? novo : x)) : [...lista, novo].slice(0, MAX_EMERGENCIA)
  salvar(CHAVE, nova)
  return novo
}
export function removerContatoEmergencia(id) {
  salvar(
    CHAVE,
    lerContatosEmergencia().filter(x => x.id !== id),
  )
}
export const soDigitos = t =>
  String(t || '')
    .replace(/\D/g, '')
    .slice(0, 15)
export function telefoneInternacional(t) {
  const d = soDigitos(t)
  if (!d) return ''
  if (d.length <= 4) return d
  if (d.startsWith('55') && d.length >= 12) return '+' + d
  if (d.length === 10 || d.length === 11) return '+55' + d
  return '+' + d
}
export function formatarTelefone(t) {
  const d = soDigitos(t).replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}
export function mascararTelefone(t) {
  const d = soDigitos(t).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
export const telefoneValido = t => {
  const d = soDigitos(t)
  return d.length >= 10 && d.length <= 13
}
export const linkLigar = t => `tel:${telefoneInternacional(t)}`
export const linkSMS = (t, corpo) => `sms:${telefoneInternacional(t)}?&body=${encodeURIComponent(corpo)}`
export function linkSMSTodos(telefones, corpo) {
  const nums = telefones.map(telefoneInternacional).filter(Boolean)
  if (!nums.length) return ''
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent || '')
  if (ios && nums.length > 1) return `sms:/open?addresses=${nums.join(',')}&body=${encodeURIComponent(corpo)}`
  return `sms:${nums.join(',')}?&body=${encodeURIComponent(corpo)}`
}
export const linkWhatsApp = (t, corpo) =>
  `https://wa.me/${telefoneInternacional(t).replace('+', '')}?text=${encodeURIComponent(corpo)}`
export const linkLocalizacao = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`
export function textoSOS({ nome, motivo, lat, lng, fonte }) {
  const quem = nome || 'Uma pessoa'
  const porque = motivo ? ` Motivo: ${motivo}.` : ''
  const onde = Number.isFinite(lat)
    ? ` ${fonte === 'cidade' ? 'Localização aproximada (cidade)' : 'Localização'}: ${linkLocalizacao(lat, lng)}`
    : ''
  return `EMERGÊNCIA: ${quem} pediu ajuda pela Kleo.${porque}${onde}`
}
export const NUMEROS_EMERGENCIA = [
  {
    numero: '192',
    nome: 'SAMU',
    descricao: 'Ambulância',
  },
  {
    numero: '193',
    nome: 'Bombeiros',
    descricao: 'Resgate e incêndio',
  },
  {
    numero: '190',
    nome: 'Polícia',
    descricao: 'Perigo ou violência',
  },
]
const EU = '(estou|t[ôo]|to|eu t[ôo]|eu estou)'
export const PADRAO_SOS = new RegExp(
  [
    String.raw`\bsocorro\b`,
    String.raw`^\s*(me )?ajud[ae]m?( me)?( por favor)?[\s!.]*$`,
    'algu[ée]m me ajud',
    'preciso de (ajuda|socorro) (urgente|agora|r[áa]pido)',
    String.raw`^\s*(é uma |estou numa |t[ôo] numa )?emerg[êe]ncia[\s!.]*$`,
    'chama(r)? (uma |a )?ambul[âa]ncia|chama(r)? o samu|liga(r)? (pro|para o) samu',
    `${EU} passando (muito )?mal`,
    `${EU} (tendo|com) (um |uma )?(infarto|ataque card[íi]aco|avc|derrame|convuls)`,
    'acho que (é|estou tendo|t[ôo] tendo) (um |uma )?(infarto|ataque card[íi]aco|avc|derrame)',
    `(${EU} com|sinto|sentindo|t[ôo] sentindo) (uma )?(dor (muito )?(forte )?no peito|falta de ar)`,
    'n[ãa]o consigo (respirar|me mexer|(me )?levantar)',
    '(ca[íi]|levei um tombo|escorreguei)[^.!?]{0,30}n[ãa]o consigo',
    'desmaiei|vou desmaiar|estou desmaiando',
    'fui (assaltad|atacad|agredid)',
    `${EU} em perigo|est[ãa]o invadindo|tem algu[ée]m (dentro de casa|invadindo)`,
  ].join('|'),
  'i',
)
export function acionarEmergencia(motivo = '', origem = 'manual') {
  window.dispatchEvent(
    new CustomEvent('kleo-emergencia', {
      detail: {
        motivo: String(motivo || '').slice(0, 160),
        origem,
      },
    }),
  )
}
let plugin = null
const pluginSOS = () => (plugin ||= registerPlugin('Emergencia'))
export const sosAutomatico = () => plataformaAtual() === 'android'
export async function permissoesSOS() {
  if (!sosAutomatico()) return { sms: false, ligar: false }
  try {
    return await pluginSOS().permissoes()
  } catch {
    return { sms: false, ligar: false }
  }
}
export async function pedirPermissoesSOS() {
  if (!sosAutomatico()) return { sms: false, ligar: false }
  try {
    return await pluginSOS().pedirPermissoes()
  } catch {
    return { sms: false, ligar: false }
  }
}
export async function enviarSmsAutomatico(telefones, texto) {
  const numeros = telefones.map(telefoneInternacional).filter(Boolean)
  if (!sosAutomatico() || !numeros.length) return { enviados: [], falhas: numeros }
  try {
    return await pluginSOS().enviarSms({ numeros, texto })
  } catch {
    return { enviados: [], falhas: numeros }
  }
}
export async function ligarAutomatico(telefone) {
  if (!sosAutomatico()) return null
  try {
    return await pluginSOS().ligar({ numero: telefoneInternacional(telefone) })
  } catch {
    return null
  }
}
