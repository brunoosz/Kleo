import { ler, salvar, hojeISO } from './storage'
import { interpretarDias, lerRotinas, ocorrenciasDoDia, paraMinutos } from './rotinas'
const CHAVE = 'kleo_alarmes'
const p2 = n => String(n).padStart(2, '0')
const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export function lerAlarmes() {
  const v = ler(CHAVE, [])
  return Array.isArray(v) ? v : []
}
function gravar(lista) {
  salvar(CHAVE, lista)
}
function proximaDataUmaVez(hora) {
  const agora = new Date()
  const m = paraMinutos(hora)
  const d = new Date()
  if (m !== null && m <= agora.getHours() * 60 + agora.getMinutes()) d.setDate(d.getDate() + 1)
  return hojeISO(d)
}
export function normalizarHora(t) {
  const m =
    String(t || '')
      .toLowerCase()
      .match(/(\d{1,2})\s*[:h]\s*(\d{2})?/) || String(t || '').match(/^(\d{1,2})$/)
  if (!m) return null
  const h = Math.min(23, Number(m[1]))
  const mi = Math.min(59, Number(m[2] || 0))
  return `${p2(h)}:${p2(mi)}`
}
export function adicionarAlarme({ hora, rotulo = '', dias = null }) {
  const h = normalizarHora(hora)
  if (!h) return null
  const lista = lerAlarmes()
  const ds =
    dias && String(dias).trim() && !/uma vez|hoje|amanha/i.test(String(dias)) ? interpretarDias(dias) : []
  const novo = {
    id: 'al' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    hora: h,
    rotulo: String(rotulo || '').trim(),
    dias: ds,
    ativo: true,
    data: ds.length ? null : proximaDataUmaVez(h),
  }
  gravar([...lista, novo])
  return novo
}
export function atualizarAlarme(id, patch) {
  gravar(
    lerAlarmes().map(a => {
      if (a.id !== id) return a
      const n = {
        ...a,
        ...patch,
      }
      if (patch.ativo === true && !n.dias?.length) n.data = proximaDataUmaVez(n.hora)
      if (patch.hora && !n.dias?.length) n.data = proximaDataUmaVez(n.hora)
      return n
    }),
  )
}
export function removerAlarme(id) {
  gravar(lerAlarmes().filter(a => a.id !== id))
}
export function alarmesVencidos(agora = new Date()) {
  const hoje = hojeISO(agora)
  const min = agora.getHours() * 60 + agora.getMinutes()
  const lista = lerAlarmes()
  const vencidos = []
  const nova = lista.map(a => {
    if (!a.ativo) return a
    const m = paraMinutos(a.hora)
    if (m === null || min < m || min - m > 2) return a
    const chave = `${hoje}@${a.hora}`
    if (a.ultimoToque === chave) return a
    const hojeVale = a.dias?.length ? a.dias.includes(agora.getDay()) : a.data === hoje
    if (!hojeVale) return a
    vencidos.push(a)
    return {
      ...a,
      ultimoToque: chave,
      ...(a.dias?.length
        ? {}
        : {
            ativo: false,
          }),
    }
  })
  if (vencidos.length) gravar(nova)
  return vencidos
}
export function soneca(alarme, minutos = 5) {
  const d = new Date(Date.now() + minutos * 60000)
  const lista = lerAlarmes()
  gravar([
    ...lista,
    {
      id: 'sn' + Date.now().toString(36),
      hora: `${p2(d.getHours())}:${p2(d.getMinutes())}`,
      rotulo: alarme?.rotulo || 'Soneca',
      dias: [],
      ativo: true,
      data: hojeISO(d),
      soneca: true,
    },
  ])
}
export function limparSonecas() {
  const l = lerAlarmes()
  const f = l.filter(a => !(a.soneca && !a.ativo))
  if (f.length !== l.length) gravar(f)
}
export function descreverAlarme(a) {
  if (a.dias?.length === 7) return 'Todos os dias'
  if (a.dias?.length === 5 && [1, 2, 3, 4, 5].every(d => a.dias.includes(d))) return 'Dias úteis'
  if (a.dias?.length === 2 && a.dias.includes(0) && a.dias.includes(6)) return 'Fim de semana'
  if (a.dias?.length)
    return [...a.dias]
      .sort()
      .map(d => NOMES_DIAS[d])
      .join(', ')
  if (!a.data) return 'Uma vez'
  return a.data === hojeISO() ? 'Hoje' : 'Amanhã'
}
const somarDias = (n, base = new Date()) => {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return hojeISO(d)
}
const dataLonga = iso => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d, 12).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
export function proximosCompromissos(dias = 7) {
  const hoje = hojeISO()
  const limite = somarDias(dias)
  const agoraMin = new Date().getHours() * 60 + new Date().getMinutes()
  const eventos = (ler('kleo_events', []) || [])
    .filter(e => e && e.data >= hoje && e.data <= limite)
    .filter(e => e.data !== hoje || !e.hora || (paraMinutos(e.hora) ?? 9999) >= agoraMin - 30)
    .map(e => ({
      titulo: e.titulo,
      data: e.data,
      hora: e.hora || '',
      detalhe: e.descricao || '',
      rotinaId: e.rotinaId,
    }))
  const ids = new Set(eventos.map(e => e.rotinaId).filter(Boolean))
  const consultas = lerRotinas()
    .filter(
      r =>
        r.tipo === 'consulta' &&
        r.ativo !== false &&
        r.dataInicio >= hoje &&
        r.dataInicio <= limite &&
        !ids.has(r.id),
    )
    .map(r => ({
      titulo: r.titulo,
      data: r.dataInicio,
      hora: r.horarios?.[0] || '',
      detalhe: r.detalhe || '',
    }))
  return [...eventos, ...consultas].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
}
export function agendaParaIA(dias = 7) {
  const hoje = hojeISO()
  const amanha = somarDias(1)
  const quando = d => (d === hoje ? 'HOJE' : d === amanha ? 'AMANHÃ' : dataLonga(d))
  const comp = proximosCompromissos(dias)
  const linhas = comp.map(
    c =>
      `- ${quando(c.data)}${c.hora ? ' às ' + c.hora : ''}: ${c.titulo}${c.detalhe ? ' (' + c.detalhe + ')' : ''}`,
  )
  let pendentes = []
  try {
    const agora = new Date().getHours() * 60 + new Date().getMinutes()
    pendentes = ocorrenciasDoDia(hoje)
      .filter(o => !o.feito && (paraMinutos(o.hora) ?? 0) >= agora - 15 && o.rotina.tipo !== 'agua')
      .slice(0, 6)
      .map(o => `${o.rotina.titulo} às ${o.hora}`)
  } catch {}
  const al = lerAlarmes()
    .filter(a => a.ativo)
    .map(a => `${a.hora}${a.rotulo ? ' (' + a.rotulo + ')' : ''} - ${descreverAlarme(a)}`)
  return [
    `Compromissos dos próximos ${dias} dias: ${linhas.length ? '\n' + linhas.join('\n') : 'nenhum'}`,
    `Lembretes que ainda faltam hoje: ${pendentes.length ? pendentes.join(', ') : 'nenhum'}`,
    `Despertadores ligados: ${al.length ? al.join('; ') : 'nenhum'}`,
  ].join('\n')
}
export function resumoFalado(nome = '') {
  const h = new Date().getHours()
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const hoje = hojeISO()
  const amanha = somarDias(1)
  const comp = proximosCompromissos(7)
  const deHoje = comp.filter(c => c.data === hoje)
  const deAmanha = comp.filter(c => c.data === amanha)
  const depois = comp.filter(c => c.data > amanha).slice(0, 2)
  const item = c => `${c.titulo}${c.hora ? ' às ' + c.hora.replace(':00', 'h').replace(':', 'h') : ''}`
  const partes = [
    `${saud}${nome ? ', ' + nome : ''}! Agora são ${new Date().toTimeString().slice(0, 5).replace(':', 'h')}.`,
  ]
  if (deHoje.length) partes.push(`Hoje você tem ${deHoje.map(item).join(', ')}.`)
  else partes.push('Hoje sua agenda está livre.')
  if (deAmanha.length) partes.push(`Amanhã: ${deAmanha.map(item).join(', ')}.`)
  if (depois.length)
    partes.push(`E nos próximos dias: ${depois.map(c => `${item(c)}, ${dataLonga(c.data)}`).join('; ')}.`)
  try {
    const rem = ocorrenciasDoDia(hoje).filter(o => !o.feito && o.rotina.tipo === 'remedio')
    if (rem.length)
      partes.push(
        `Remédios de hoje: ${[...new Set(rem.map(o => `${o.rotina.titulo} às ${o.hora}`))].slice(0, 4).join(', ')}.`,
      )
  } catch {}
  return partes.join(' ')
}
