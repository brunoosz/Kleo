import { hojeISO } from './storage'
import { adicionarRotina, atualizarRotina, lerRotinas, paraMinutos, rotinaAtivaEm } from './rotinas'
import { extraDe, salvarExtra } from '../components/RotinaUtil'
import { localPorId, estimarMinutos, origemDaSaida, nomeModo } from './locais'
export const FOLGA_PADRAO = 10
const RECALCULAR_MS = 3 * 3600 * 1000
const p2 = n => String(n).padStart(2, '0')
export function horaDeSair(chegada, minutosViagem, folga = FOLGA_PADRAO) {
  const m = paraMinutos(chegada)
  if (m === null) return null
  const t = (((m - Math.max(1, minutosViagem) - folga) % 1440) + 1440) % 1440
  return `${p2(Math.floor(t / 60))}:${p2(t % 60)}`
}
async function estimar(destino, modo, origemId) {
  const origem = await origemDaSaida(origemId)
  if (!origem) return null
  return estimarMinutos(origem, destino, modo)
}
export async function criarSaida({
  localId,
  chegada,
  modo = 'pe',
  dias,
  folga = FOLGA_PADRAO,
  titulo,
  origemId,
}) {
  const destino = localPorId(localId)
  if (!destino) throw new Error('SEM_LOCAL')
  let minutos
  try {
    minutos = await estimar(destino, modo, origemId)
  } catch {
    minutos = null
  }
  const viagem = minutos ?? 30
  const r = adicionarRotina({
    tipo: 'saida',
    titulo: titulo?.trim() || destino.nome,
    detalhe: `Chegar às ${chegada} · ${nomeModo(modo)}`,
    horarios: [horaDeSair(chegada, viagem, folga)],
    dias: dias && dias.length ? dias : [1, 2, 3, 4, 5],
    dataInicio: hojeISO(),
  })
  salvarExtra(r.id, {
    localId,
    origemId: origemId || null,
    chegada,
    modo,
    folga,
    minutosViagem: viagem,
    estimado: minutos === null,
    calculadoEm: Date.now(),
  })
  return r
}
export async function atualizarSaidas({ forcar = false } = {}) {
  const hoje = hojeISO()
  for (const r of lerRotinas()) {
    if (r.tipo !== 'saida' || !rotinaAtivaEm(r, hoje)) continue
    const ex = extraDe(r.id)
    if (!forcar && ex.calculadoEm && Date.now() - ex.calculadoEm < RECALCULAR_MS) continue
    const destino = localPorId(ex.localId)
    if (!destino || !ex.chegada) continue
    const feitosHoje = Array.isArray(r.feitos?.[hoje]) ? r.feitos[hoje] : []
    if (feitosHoje.length) continue
    let minutos
    try {
      minutos = await estimar(destino, ex.modo, ex.origemId)
    } catch {
      continue
    }
    if (!Number.isFinite(minutos)) continue
    const nova = horaDeSair(ex.chegada, minutos, ex.folga ?? FOLGA_PADRAO)
    salvarExtra(r.id, {
      minutosViagem: minutos,
      estimado: false,
      calculadoEm: Date.now(),
    })
    const atual = r.horarios?.[0]
    const agora = new Date()
    const minAgora = agora.getHours() * 60 + agora.getMinutes()
    if (nova && nova !== atual && paraMinutos(atual) > minAgora + 5)
      atualizarRotina(r.id, {
        horarios: [nova],
      })
  }
}
export function textoSaida(rotina) {
  const ex = extraDe(rotina.id)
  const destino = localPorId(ex.localId)
  const nome = destino?.nome || rotina.titulo
  const tempo = ex.minutosViagem ? `, ${nomeModo(ex.modo)} leva cerca de ${ex.minutosViagem} minutos` : ''
  return `Hora de sair para ${nome}${tempo}. Assim você chega às ${ex.chegada || 'tempo'}. A rota já está pronta no mapa.`
}
