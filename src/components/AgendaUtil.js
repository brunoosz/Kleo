export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]
export const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]
export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const INICIAIS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const CORES_EVENTO = ['#b7b2ff', '#d2e534', '#89cdf3', '#ffb3c7', '#ffcf8a', '#e0b8ff']
export const NOMES_CORES = ['Lavanda', 'Lima', 'Céu', 'Rosa', 'Pêssego', 'Lilás']
const CORES_ANTIGAS = {
  '#5e5ce6': '#b7b2ff',
  '#30d158': '#d2e534',
  '#ff9f0a': '#ffcf8a',
  '#ff3b30': '#ffb3c7',
  '#64d2ff': '#89cdf3',
  '#bf5af2': '#e0b8ff',
}
export function corEvento(cor) {
  if (!cor || typeof cor !== 'string' || cor.startsWith('var(')) return CORES_EVENTO[0]
  return CORES_ANTIGAS[cor.toLowerCase()] || cor
}
export const capitalizar = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
export function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12)
}
export function paraISO(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export function rotuloDia(iso, anoAtual) {
  const d = parseISO(iso)
  if (!d) return ''
  const base = `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
  return anoAtual && d.getFullYear() !== anoAtual ? `${base} de ${d.getFullYear()}` : base
}
export function celulasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1, 12)
  const inicio = new Date(ano, mes, 1 - primeiro.getDay(), 12)
  const celulas = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i, 12)
    celulas.push({
      iso: paraISO(d),
      dia: d.getDate(),
      doMes: d.getMonth() === mes,
    })
  }
  return celulas
}
export function minutosDe(hora) {
  if (!hora || !/^\d{1,2}:\d{2}/.test(hora)) return null
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}
export function ordenarPorHora(lista) {
  return [...lista].sort((a, b) => (minutosDe(a.hora) ?? -1) - (minutosDe(b.hora) ?? -1))
}
