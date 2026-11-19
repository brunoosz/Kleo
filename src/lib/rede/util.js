export const semAcento = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
export function normalizarUsuario(t) {
  return semAcento(t)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 20)
}
export function validarUsuario(u) {
  if (!u || u.length < 3) return 'Use pelo menos 3 letras ou números.'
  if (!/^[a-z0-9]/.test(u)) return 'Comece com uma letra ou número.'
  if (/[._]$/.test(u)) return 'Não termine com ponto ou sublinhado.'
  if (/[._]{2}/.test(u)) return 'Evite dois símbolos seguidos.'
  return ''
}
export function sugerirUsuario(nome) {
  const partes = semAcento(nome)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const base = partes.length > 1 ? `${partes[0]}.${partes[partes.length - 1]}` : partes[0] || 'kleo'
  return normalizarUsuario(base).slice(0, 16)
}
export const idConversa = (a, b) => [a, b].sort().join('_')
export function formatarDuracao(seg) {
  const s = Math.max(0, Math.round(seg || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
export function resumoMensagem(m) {
  if (!m) return ''
  if (m.tipo === 'audio') return `Mensagem de voz${m.duracao ? ` (${formatarDuracao(m.duracao)})` : ''}`
  if (m.tipo === 'sos') return 'Pedido de ajuda'
  if (m.tipo === 'imagem') return 'Foto'
  if (m.tipo === 'local') return 'Localização'
  if (m.tipo === 'apagada') return 'Mensagem apagada'
  return String(m.texto || '').slice(0, 140)
}
export function nomeExibicao(c) {
  return (c?.apelido || '').trim() || (c?.nome || '').trim() || (c?.usuario ? `@${c.usuario}` : 'Contato')
}
const DIA = 86400000
const inicioDoDia = ms => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
export function horaLista(ms) {
  if (!ms) return ''
  const hoje = inicioDoDia(Date.now())
  if (ms >= hoje) return new Date(ms).toTimeString().slice(0, 5)
  if (ms >= hoje - DIA) return 'Ontem'
  if (ms >= hoje - 6 * DIA)
    return new Date(ms)
      .toLocaleDateString('pt-BR', {
        weekday: 'short',
      })
      .replace('.', '')
      .replace(/^./, c => c.toUpperCase())
  return new Date(ms).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}
export function rotuloDia(ms) {
  const hoje = inicioDoDia(Date.now())
  if (ms >= hoje) return 'Hoje'
  if (ms >= hoje - DIA) return 'Ontem'
  return new Date(ms).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
export const mesmoDia = (a, b) => inicioDoDia(a) === inicioDoDia(b)
export function emMs(v) {
  if (!v) return 0
  if (typeof v === 'number') return v
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (typeof v.seconds === 'number') return v.seconds * 1000
  return 0
}
const CORES = ['#d8d1ff', '#cdeaa0', '#bfe6fb', '#ffd9c7', '#f6d5e6', '#fff0a6', '#c9f0d6', '#e3d6f5']
export function corDe(chave) {
  let h = 0
  for (const ch of String(chave || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return CORES[h % CORES.length]
}
export function iniciais(nome) {
  const p = String(nome || '')
    .replace(/^@/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!p.length) return '?'
  return ((p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}
