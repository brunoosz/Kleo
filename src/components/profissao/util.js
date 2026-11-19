import { ler, salvar, hojeISO } from '../../lib/storage'
import { falar } from '../../lib/voz'
import { piscarTela } from '../../hooks/useAcessibilidade'
import { temNecessidade, leituraVozAtiva } from '../../lib/perfil'
export const alvo = nec => (nec === 'visual' || nec === 'idoso' ? 56 : 44)
export function bipe() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ;[0, 0.35, 0.7].forEach(t => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.3)
    })
    setTimeout(() => ctx.close?.(), 1500)
  } catch {}
}
export function dispararAlarme(texto) {
  const perfil = ler('kleo_profile', {})
  const surdo = temNecessidade(perfil, 'auditiva')
  if (!surdo) bipe()
  navigator.vibrate?.([300, 120, 300, 120, 300])
  piscarTela()
  if (!surdo)
    setTimeout(
      () =>
        falar(texto, {
          forcar: leituraVozAtiva(perfil),
        }),
      1100,
    )
}
export function criarTimer(nome, minutos) {
  const duracao = Math.max(1, Math.round(minutos * 60)) * 1000
  const timers = ler('kleo_timers', []) || []
  timers.push({
    id: Date.now() + Math.random(),
    nome: nome || `Temporizador ${minutos} min`,
    duracao,
    fim: Date.now() + duracao,
    restante: duracao,
    estado: 'rodando',
  })
  salvar('kleo_timers', timers)
}
export function formatarTempo(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = n => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`
}
export function somarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number)
  return hojeISO(new Date(a, m - 1, d + dias))
}
export function diferencaDias(deIso, ateIso) {
  const [a1, m1, d1] = deIso.split('-').map(Number)
  const [a2, m2, d2] = ateIso.split('-').map(Number)
  return Math.round((new Date(a2, m2 - 1, d2) - new Date(a1, m1 - 1, d1)) / 86400000)
}
export function formatarData(
  iso,
  opcoes = {
    day: '2-digit',
    month: 'short',
  },
) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', opcoes).replace('.', '')
}
export function proximoDiaSemana(dia) {
  const hoje = new Date()
  const delta = (dia - hoje.getDay() + 7) % 7
  return hojeISO(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + delta))
}
export function relativo(dias) {
  if (dias < -1) return `Atrasado ${-dias} dias`
  if (dias === -1) return 'Atrasado 1 dia'
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  return `Em ${dias} dias`
}
export const reais = v =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
export const numero = t => {
  const txt = String(t ?? '').trim()
  const n = parseFloat(txt.includes(',') ? txt.replace(/\./g, '').replace(',', '.') : txt)
  return Number.isFinite(n) ? n : 0
}
export function verificarTimers() {
  const timers = ler('kleo_timers', []) || []
  const agora = Date.now()
  const vencidos = timers.filter(t => t.estado === 'rodando' && t.fim && t.fim <= agora)
  if (!vencidos.length) return
  salvar(
    'kleo_timers',
    timers.map(t =>
      vencidos.includes(t)
        ? {
            ...t,
            estado: 'terminado',
            restante: 0,
            fim: null,
          }
        : t,
    ),
  )
  vencidos.forEach((t, i) => setTimeout(() => dispararAlarme(`Temporizador ${t.nome} terminou`), i * 2500))
}
const MIN_POMODORO = {
  foco: 25,
  pausa: 5,
}
export function verificarPomodoro() {
  const p = ler('kleo_pomodoro', null)
  if (!p || p.estado !== 'rodando' || !p.fim || p.fim > Date.now()) return
  const proxima = p.fase === 'foco' ? 'pausa' : 'foco'
  const min = {
    foco: p.focoMin || MIN_POMODORO.foco,
    pausa: p.pausaMin || MIN_POMODORO.pausa,
  }
  salvar('kleo_pomodoro', {
    ...p,
    fase: proxima,
    estado: 'parado',
    fim: null,
    restante: min[proxima] * 60000,
    ciclos: p.fase === 'foco' ? (p.ciclos || 0) + 1 : p.ciclos || 0,
  })
  dispararAlarme(
    p.fase === 'foco'
      ? `Foco concluído. Hora de uma pausa de ${min.pausa} minutos.`
      : 'Pausa encerrada. Vamos voltar a focar.',
  )
}
