import { ler, salvar, hojeISO } from './storage'
const CHAVE = 'kleo_rotinas'
export const TIPOS_ROTINA = {
  remedio: {
    nome: 'Remédio',
    verbo: 'Hora do remédio',
  },
  agua: {
    nome: 'Água',
    verbo: 'Hora de beber água',
  },
  consulta: {
    nome: 'Consulta',
    verbo: 'Lembrete de consulta',
  },
  exercicio: {
    nome: 'Exercício',
    verbo: 'Hora de se movimentar',
  },
  personalizado: {
    nome: 'Lembrete',
    verbo: 'Lembrete',
  },
  saida: {
    nome: 'Saída',
    verbo: 'Hora de sair',
  },
}
const TODOS_DIAS = [0, 1, 2, 3, 4, 5, 6]
const p2 = n => String(n).padStart(2, '0')
export function paraMinutos(hora) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora || '').trim())
  if (!m) return null
  const h = Number(m[1]),
    mi = Number(m[2])
  if (h > 23 || mi > 59) return null
  return h * 60 + mi
}
const deMinutos = min => `${p2(Math.floor(min / 60))}:${p2(min % 60)}`
const paraData = iso => {
  const [a, m, d] = String(iso).split('-').map(Number)
  return new Date(a, (m || 1) - 1, d || 1, 12)
}
const somarDias = (iso, n) => {
  const d = paraData(iso)
  d.setDate(d.getDate() + n)
  return hojeISO(d)
}
const NOMES_DIA = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
}
export function interpretarDias(texto) {
  if (Array.isArray(texto)) return normalizarDias(texto)
  const t = String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
  if (!t || /todo|diari|sempre/.test(t)) return [...TODOS_DIAS]
  if (/util|semana(?!l)/.test(t) && !/fim/.test(t)) return [1, 2, 3, 4, 5]
  if (/fim de semana|fds/.test(t)) return [0, 6]
  const valor = s => {
    const k = s.trim().slice(0, 3)
    if (k in NOMES_DIA) return NOMES_DIA[k]
    const n = parseInt(s, 10)
    return n >= 0 && n <= 6 ? n : null
  }
  const dias = new Set()
  for (const parte of t.split(/[,;\s]+e?\s*/).filter(Boolean)) {
    const [a, b] = parte.split('-')
    const ia = valor(a)
    if (ia === null) continue
    if (b !== undefined) {
      const ib = valor(b)
      if (ib === null) continue
      for (let i = ia, guard = 0; guard < 7; i = (i + 1) % 7, guard++) {
        dias.add(i)
        if (i === ib) break
      }
    } else dias.add(ia)
  }
  return dias.size ? [...dias].sort() : [...TODOS_DIAS]
}
function normalizarDias(dias) {
  const l = (Array.isArray(dias) ? dias : TODOS_DIAS).map(Number).filter(n => n >= 0 && n <= 6)
  return l.length ? [...new Set(l)].sort() : [...TODOS_DIAS]
}
function normalizar(r) {
  const horarios = (Array.isArray(r.horarios) ? r.horarios : [])
    .map(h => paraMinutos(h))
    .filter(m => m !== null)
    .sort((a, b) => a - b)
    .map(deMinutos)
  return {
    id: r.id || `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    tipo: TIPOS_ROTINA[r.tipo] ? r.tipo : 'personalizado',
    titulo: String(r.titulo || 'Lembrete').trim(),
    detalhe: String(r.detalhe || '').trim(),
    horarios: [...new Set(horarios)],
    intervaloMin: Number(r.intervaloMin) > 0 ? Math.max(15, Number(r.intervaloMin)) : 0,
    inicioDia: paraMinutos(r.inicioDia) !== null ? r.inicioDia : '08:00',
    fimDia: paraMinutos(r.fimDia) !== null ? r.fimDia : '22:00',
    dias: normalizarDias(r.dias),
    dataInicio: /^\d{4}-\d{2}-\d{2}$/.test(r.dataInicio || '') ? r.dataInicio : hojeISO(),
    duracaoDias: Number(r.duracaoDias) > 0 ? Math.round(Number(r.duracaoDias)) : null,
    ativo: r.ativo !== false,
    feitos: r.feitos && typeof r.feitos === 'object' && !Array.isArray(r.feitos) ? r.feitos : {},
    criadoEm: r.criadoEm || Date.now(),
  }
}
export function lerRotinas() {
  const v = ler(CHAVE, [])
  return Array.isArray(v) ? v.filter(r => r && r.id) : []
}
function gravar(lista) {
  salvar(CHAVE, lista)
}
export function adicionarRotina(r) {
  const nova = normalizar(r || {})
  gravar([...lerRotinas(), nova])
  return nova
}
export function atualizarRotina(id, patch) {
  let atualizada = null
  gravar(
    lerRotinas().map(r => {
      if (r.id !== id) return r
      atualizada = normalizar({
        ...r,
        ...patch,
        id,
      })
      return atualizada
    }),
  )
  return atualizada
}
export function removerRotina(id) {
  gravar(lerRotinas().filter(r => r.id !== id))
}
export function horariosDaRotina(r) {
  if (Number(r?.intervaloMin) > 0) {
    const ini = paraMinutos(r.inicioDia) ?? 480
    const fim = paraMinutos(r.fimDia) ?? 1320
    const lista = []
    for (let m = ini; m <= fim && lista.length < 96; m += Number(r.intervaloMin)) lista.push(deMinutos(m))
    return lista
  }
  return Array.isArray(r?.horarios) ? r.horarios : []
}
export function rotinaAtivaEm(r, dataISO = hojeISO()) {
  if (!r || r.ativo === false) return false
  const inicio = r.dataInicio || '0000-01-01'
  if (dataISO < inicio) return false
  if (Number(r.duracaoDias) > 0 && dataISO >= somarDias(inicio, Number(r.duracaoDias))) return false
  const dia = paraData(dataISO).getDay()
  return normalizarDias(r.dias).includes(dia)
}
export function ocorrenciasDoDia(dataISO = hojeISO()) {
  const lista = []
  for (const r of lerRotinas()) {
    if (!rotinaAtivaEm(r, dataISO)) continue
    const feitos = Array.isArray(r.feitos?.[dataISO]) ? r.feitos[dataISO] : []
    for (const hora of horariosDaRotina(r))
      lista.push({
        rotina: r,
        hora,
        feito: feitos.includes(hora),
      })
  }
  return lista.sort((a, b) => a.hora.localeCompare(b.hora))
}
export function marcarFeito(id, dataISO = hojeISO(), hora, valor = true) {
  const limite = somarDias(hojeISO(), -60)
  gravar(
    lerRotinas().map(r => {
      if (r.id !== id) return r
      const feitos = {}
      for (const [d, hs] of Object.entries(r.feitos || {})) if (d >= limite) feitos[d] = hs
      const dia = new Set(Array.isArray(feitos[dataISO]) ? feitos[dataISO] : [])
      if (valor) dia.add(hora)
      else dia.delete(hora)
      feitos[dataISO] = [...dia].sort()
      return {
        ...r,
        feitos,
      }
    }),
  )
}
export function proximaOcorrencia(agora = new Date()) {
  const hoje = hojeISO(agora)
  const minAgora = agora.getHours() * 60 + agora.getMinutes()
  for (let i = 0; i <= 7; i++) {
    const data = somarDias(hoje, i)
    const prox = ocorrenciasDoDia(data).find(o => !o.feito && (i > 0 || paraMinutos(o.hora) >= minAgora))
    if (prox)
      return {
        ...prox,
        data,
        emMin: i * 1440 + paraMinutos(prox.hora) - minAgora,
      }
  }
  return null
}
export function pendentesAte(agora = new Date()) {
  const min = agora.getHours() * 60 + agora.getMinutes()
  return ocorrenciasDoDia(hojeISO(agora)).filter(o => !o.feito && paraMinutos(o.hora) <= min)
}
export function descreverDias(dias) {
  const d = normalizarDias(dias)
  if (d.length === 7) return 'Todos os dias'
  if (d.join() === '1,2,3,4,5') return 'Segunda a sexta'
  if (d.join() === '0,6') return 'Fim de semana'
  const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return d.map(i => nomes[i]).join(', ')
}
