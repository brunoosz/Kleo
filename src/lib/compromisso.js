import { hojeISO } from './storage'
const DIAS = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
}
const TITULOS = [
  [/almo[çc]/, 'Almoço'],
  [/jant/, 'Jantar'],
  [/caf[ée]/, 'Café'],
  [/churrasco/, 'Churrasco'],
  [/festa/, 'Festa'],
  [/anivers/, 'Aniversário'],
  [/consulta|m[ée]dic|dentista|exame/, 'Consulta'],
  [/reuni/, 'Reunião'],
  [/visita|passar a[íi]|passo a[íi]|chego|chegar|chegando|vou a[íi]/, 'Visita'],
  [/cinema|filme/, 'Cinema'],
  [/missa|culto|igreja/, 'Missa'],
  [/viagem|viajar/, 'Viagem'],
  [/caminhad|passeio|parque/, 'Passeio'],
]
const semAcento = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
function somar(base, dias) {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  return d
}
export function compromissoLocal(texto, nome = '') {
  const t = semAcento(texto)
  const agora = new Date()
  let data = null
  if (/depois de amanha/.test(t)) data = somar(agora, 2)
  else if (/amanha/.test(t)) data = somar(agora, 1)
  else if (/\bhoje\b|hoje a noite|hoje de/.test(t)) data = agora
  if (!data) {
    const m = t.match(/\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)\b/)
    if (m) {
      const alvo = DIAS[m[1]]
      let dif = (alvo - agora.getDay() + 7) % 7
      if (dif === 0) dif = /que vem|proxim/.test(t) ? 7 : 0
      else if (/que vem/.test(t)) dif += 7
      data = somar(agora, dif)
    }
  }
  if (!data) {
    const m = t.match(/\bdia (\d{1,2})\b/) || t.match(/\b(\d{1,2})\/(\d{1,2})\b/)
    if (m) {
      const dia = Number(m[1])
      const mes = m[2] ? Number(m[2]) - 1 : agora.getMonth()
      let d = new Date(agora.getFullYear(), mes, dia, 12)
      if (d < new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()))
        d = m[2]
          ? new Date(agora.getFullYear() + 1, mes, dia, 12)
          : new Date(agora.getFullYear(), mes + 1, dia, 12)
      if (d.getDate() === dia) data = d
    }
  }
  if (!data) return null
  let hora = ''
  if (/meio[- ]dia/.test(t)) hora = '12:00'
  else if (/meia[- ]noite/.test(t)) hora = '00:00'
  else {
    const h = t.match(/\b(\d{1,2})\s*(?:h|:|horas?)\s*(\d{2})?\b/) || t.match(/\bas (\d{1,2})\b/)
    if (h) {
      let hh = Number(h[1])
      const mm = h[2] ? Number(h[2]) : 0
      if (hh <= 11 && /(da|de) (tarde|noite)/.test(t)) hh += 12
      if (hh <= 23 && mm <= 59) hora = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    }
  }
  const tipo = TITULOS.find(([r]) => r.test(t))?.[1] || 'Encontro'
  const quem = String(nome || '').split(' ')[0]
  return {
    titulo: quem ? `${tipo} com ${quem}` : tipo,
    data: hojeISO(data),
    hora,
  }
}
