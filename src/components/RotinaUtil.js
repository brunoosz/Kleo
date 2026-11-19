import { Pill, GlassWater, Stethoscope, Dumbbell, Bell, Navigation } from 'lucide-react'
import { localPorId, nomeModo } from '../lib/locais'
import { ler, salvar, hojeISO, adicionarEvento } from '../lib/storage'
import { adicionarRotina, removerRotina, lerRotinas, paraMinutos } from '../lib/rotinas'
export const INFO_TIPO = {
  remedio: {
    nome: 'Remédio',
    secao: 'Remédios',
    icone: Pill,
    cor: 'var(--lavanda)',
    feito: 'Já tomei',
  },
  agua: {
    nome: 'Água',
    secao: 'Água',
    icone: GlassWater,
    cor: 'var(--ceu)',
    feito: 'Bebi',
  },
  consulta: {
    nome: 'Consulta',
    secao: 'Consultas',
    icone: Stethoscope,
    cor: 'var(--lima)',
    feito: 'Feito',
  },
  exercicio: {
    nome: 'Exercício',
    secao: 'Outros',
    icone: Dumbbell,
    cor: 'var(--surface-2)',
    feito: 'Feito',
  },
  personalizado: {
    nome: 'Lembrete',
    secao: 'Outros',
    icone: Bell,
    cor: 'var(--surface-2)',
    feito: 'Feito',
  },
  saida: {
    nome: 'Saída',
    secao: 'Saídas',
    icone: Navigation,
    cor: 'var(--ceu)',
    feito: 'Já saí',
  },
}
export const infoTipo = tipo => INFO_TIPO[tipo] || INFO_TIPO.personalizado
export const SECOES = [
  {
    id: 'remedio',
    titulo: 'Remédios',
    tipos: ['remedio'],
  },
  {
    id: 'agua',
    titulo: 'Água',
    tipos: ['agua'],
  },
  {
    id: 'consulta',
    titulo: 'Consultas',
    tipos: ['consulta'],
  },
  {
    id: 'saida',
    titulo: 'Saídas',
    tipos: ['saida'],
  },
  {
    id: 'outros',
    titulo: 'Outros',
    tipos: ['exercicio', 'personalizado'],
  },
]
const CHAVE_EXTRA = 'kleo_rotinas_extra'
export function lerExtras() {
  const v = ler(CHAVE_EXTRA, {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}
export const extraDe = id => lerExtras()[id] || {}
export function salvarExtra(id, patch) {
  const todos = lerExtras()
  salvar(CHAVE_EXTRA, {
    ...todos,
    [id]: {
      ...(todos[id] || {}),
      ...patch,
    },
  })
}
const CHAVE_AGUA = 'kleo_agua'
export function coposDoDia(data = hojeISO()) {
  const v = ler(CHAVE_AGUA, {})
  return Number(v?.[data]) || 0
}
export function somarCopo(delta = 1, data = hojeISO()) {
  const v = ler(CHAVE_AGUA, {})
  const base = v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  const limite = new Date()
  limite.setDate(limite.getDate() - 30)
  const lim = hojeISO(limite)
  const limpo = Object.fromEntries(Object.entries(base).filter(([d]) => d >= lim))
  limpo[data] = Math.max(0, (Number(limpo[data]) || 0) + delta)
  salvar(CHAVE_AGUA, limpo)
  return limpo[data]
}
export function metaCopos(rotinas = lerRotinas()) {
  const agua = rotinas.find(r => r.tipo === 'agua' && r.ativo !== false)
  return Number(agua && extraDe(agua.id).metaCopos) || 8
}
export function salvarDados(d) {
  const tipo = d.tipo || 'personalizado'
  if (tipo === 'agua') {
    const r = adicionarRotina({
      tipo,
      titulo: d.titulo?.trim() || 'Beber água',
      detalhe: `Meta: ${d.meta || 8} copos`,
      intervaloMin: Number(d.intervalo) || 60,
      inicioDia: d.inicio || '08:00',
      fimDia: d.fim || '22:00',
      dias: [0, 1, 2, 3, 4, 5, 6],
      dataInicio: hojeISO(),
    })
    salvarExtra(r.id, {
      metaCopos: Number(d.meta) || 8,
    })
    return r
  }
  if (tipo === 'consulta') {
    const titulo = d.titulo?.trim() || 'Consulta'
    const r = adicionarRotina({
      tipo,
      titulo,
      detalhe: d.local?.trim() || '',
      horarios: [d.hora || '09:00'],
      dias: [0, 1, 2, 3, 4, 5, 6],
      dataInicio: d.data || hojeISO(),
      duracaoDias: 1,
    })
    salvarExtra(r.id, {
      avisoDia: d.avisoDia !== false,
      avisoHora: d.avisoHora !== false,
      local: d.local || '',
    })
    adicionarEvento({
      titulo,
      data: d.data || hojeISO(),
      hora: d.hora || '09:00',
      descricao: d.local ? `Local: ${d.local}` : 'Consulta criada nas Rotinas',
      rotinaId: r.id,
    })
    return r
  }
  return adicionarRotina({
    tipo,
    titulo: d.titulo?.trim() || (tipo === 'remedio' ? 'Remédio' : 'Lembrete'),
    detalhe: d.detalhe?.trim() || '',
    horarios: d.horarios || [],
    dias: d.dias && d.dias.length ? d.dias : [0, 1, 2, 3, 4, 5, 6],
    dataInicio: hojeISO(),
    duracaoDias: Number(d.duracao) > 0 ? Number(d.duracao) : null,
  })
}
export function removerRotinaCompleta(id) {
  removerRotina(id)
  const todos = lerExtras()
  if (todos[id]) {
    delete todos[id]
    salvar(CHAVE_EXTRA, todos)
  }
  const eventos = ler('kleo_events', [])
  if (Array.isArray(eventos) && eventos.some(e => e?.rotinaId === id)) {
    salvar(
      'kleo_events',
      eventos.filter(e => e?.rotinaId !== id),
    )
  }
}
export function textoLembrete(rotina, hora) {
  const det = rotina.detalhe ? `, ${rotina.detalhe}` : ''
  switch (rotina.tipo) {
    case 'remedio':
      return `Hora do remédio: ${rotina.titulo}${det}.`
    case 'agua':
      return 'Hora de beber um copo de água.'
    case 'consulta':
      return `${rotina.titulo} agora, às ${hora}${rotina.detalhe ? `, em ${rotina.detalhe}` : ''}.`
    case 'exercicio':
      return `Hora de se movimentar: ${rotina.titulo}.`
    case 'saida': {
      const ex = extraDe(rotina.id)
      const destino = localPorId(ex.localId)
      const tempo = ex.minutosViagem ? `, ${nomeModo(ex.modo)} leva cerca de ${ex.minutosViagem} minutos` : ''
      return `Hora de sair para ${destino?.nome || rotina.titulo}${tempo}. Assim você chega às ${ex.chegada || 'tempo'}. A rota já está pronta no mapa.`
    }
    default:
      return `Lembrete: ${rotina.titulo}${det}.`
  }
}
export function tituloLembrete(rotina) {
  switch (rotina.tipo) {
    case 'remedio':
      return `Hora do remédio: ${rotina.titulo}`
    case 'agua':
      return 'Hora de beber água'
    case 'consulta':
      return rotina.titulo
    case 'saida':
      return `Hora de sair: ${rotina.titulo}`
    default:
      return rotina.titulo
  }
}
export function relativo(minutos) {
  if (minutos === 0) return 'agora'
  const abs = Math.abs(minutos)
  const t =
    abs < 60 ? `${abs} min` : abs % 60 === 0 ? `${abs / 60} h` : `${Math.floor(abs / 60)} h ${abs % 60} min`
  return minutos > 0 ? `em ${t}` : `há ${t}`
}
export function minutosAte(hora, agora = new Date()) {
  const m = paraMinutos(hora)
  if (m === null) return null
  return m - (agora.getHours() * 60 + agora.getMinutes())
}
export function rotuloDuracao(r, hoje = hojeISO()) {
  if (!(Number(r.duracaoDias) > 0) || r.tipo === 'consulta') return ''
  const [a, m, d] = String(r.dataInicio).split('-').map(Number)
  const fim = new Date(a, m - 1, d + Number(r.duracaoDias) - 1, 12)
  const fimISO = hojeISO(fim)
  if (fimISO < hoje) return 'Terminou'
  if (fimISO === hoje) return 'Último dia'
  return `Até ${String(fim.getDate()).padStart(2, '0')}/${String(fim.getMonth() + 1).padStart(2, '0')}`
}
export function rotuloDataCurta(iso) {
  const [a, m, d] = String(iso || '')
    .split('-')
    .map(Number)
  if (!a) return ''
  const dt = new Date(a, m - 1, d, 12)
  const hoje = hojeISO()
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  if (iso === hoje) return 'Hoje'
  if (iso === hojeISO(amanha)) return 'Amanhã'
  const dia = dt
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
    })
    .replace('.', '')
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}
