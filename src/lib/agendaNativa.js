import { ler, salvar, hojeISO } from './storage'
import { ocorrenciasDoDia, lerRotinas, paraMinutos } from './rotinas'
import { lerAlarmes } from './alarmes'
import { plataformaAtual } from './plataforma'
import {
  idNotificacao,
  marcarAgendados,
  permissao,
  conferirPermissaoNativa,
  tipoDasAcoes,
} from './notificacoes'
import { tituloLembrete, textoLembrete, infoTipo, extraDe } from '../components/RotinaUtil'
import { localPorId, linkRota } from './locais'
function urlDaRotina(r) {
  if (r.tipo !== 'saida') return '/rotinas'
  const ex = extraDe(r.id)
  const l = localPorId(ex.localId)
  return l ? linkRota(l, ex.modo) : '/rotinas'
}
const DIAS = 3
const MAXIMO = 60
const CHAVE = 'kleo_agenda_nativa'
const ADIAR_MIN = 10
function emMs(dataISO, hora) {
  const [a, m, d] = String(dataISO).split('-').map(Number)
  const [h, mi] = String(hora).split(':').map(Number)
  return new Date(a, m - 1, d, h, mi, 0, 0).getTime()
}
function diaISO(somar) {
  const d = new Date()
  d.setDate(d.getDate() + somar)
  return hojeISO(d)
}
export function proximosAvisos(agora = Date.now()) {
  const limite = agora + DIAS * 86400000
  const vale = em => em > agora + 20000 && em <= limite
  const lista = []
  for (let i = 0; i <= DIAS; i++) {
    const data = diaISO(i)
    for (const o of ocorrenciasDoDia(data)) {
      if (o.feito) continue
      const em = emMs(data, o.hora)
      if (!vale(em)) continue
      const chave = `${o.rotina.id}@${data}@${o.hora}`
      lista.push({
        tag: `rotina-${chave}`,
        em,
        titulo: tituloLembrete(o.rotina),
        corpo: textoLembrete(o.rotina, o.hora),
        url: urlDaRotina(o.rotina),
        acoes: [
          {
            action: 'feito',
            title: infoTipo(o.rotina.tipo).feito || 'Feito',
          },
          {
            action: 'adiar',
            title: `Daqui ${ADIAR_MIN} min`,
          },
        ],
        dados: {
          rotinaId: o.rotina.id,
          data,
          hora: o.hora,
          chave,
        },
      })
    }
  }
  for (const r of lerRotinas()) {
    if (r.tipo !== 'consulta' || r.ativo === false || !r.horarios?.[0] || !r.dataInicio) continue
    const consulta = emMs(r.dataInicio, r.horarios[0])
    const ex = extraDe(r.id)
    const antes = [
      {
        suf: '1d',
        ms: 86400000,
        ligado: ex.avisoDia !== false,
        titulo: `Amanhã: ${r.titulo}`,
      },
      {
        suf: '1h',
        ms: 3600000,
        ligado: ex.avisoHora !== false,
        titulo: `Daqui 1 hora: ${r.titulo}`,
      },
    ]
    for (const p of antes) {
      const em = consulta - p.ms
      if (!p.ligado || !vale(em)) continue
      const chave = `${r.id}@pre${p.suf}`
      lista.push({
        tag: `rotina-${chave}`,
        em,
        titulo: p.titulo,
        corpo: [r.detalhe, `às ${r.horarios[0]}`].filter(Boolean).join(' · '),
        url: '/rotinas',
        dados: {
          rotinaId: r.id,
          data: r.dataInicio,
          hora: r.horarios[0],
          chave,
        },
      })
    }
  }
  for (const a of lerAlarmes()) {
    if (!a?.ativo || paraMinutos(a.hora) === null) continue
    for (let i = 0; i <= DIAS; i++) {
      const data = diaISO(i)
      const diaSemana = new Date(emMs(data, '12:00')).getDay()
      const hoje = Array.isArray(a.dias) && a.dias.length ? a.dias.includes(diaSemana) : a.data === data
      if (!hoje || a.ultimoToque === `${data}@${a.hora}`) continue
      const em = emMs(data, a.hora)
      if (!vale(em)) continue
      lista.push({
        tag: `alarme-${a.id}@${data}`,
        base: `alarme-${a.id}`,
        em,
        titulo: a.rotulo || 'Despertador',
        corpo: `São ${a.hora}. Toque para abrir a Kleo.`,
        url: '/rotinas',
        dados: {
          alarmeId: a.id,
        },
      })
    }
  }
  return lista.sort((x, y) => x.em - y.em).slice(0, MAXIMO)
}
let fila = Promise.resolve()
const enfileirar = tarefa => {
  fila = fila.then(tarefa).catch(e => console.warn('[Kleo] Agenda do sistema:', e?.message || e))
  return fila
}
let naTela = true
async function cancelarPendentes(LN) {
  marcarAgendados([])
  const ids = ler(CHAVE, [])
  if (!Array.isArray(ids) || !ids.length) return
  try {
    const { notifications } = await LN.getPending()
    const pendentes = new Set((notifications || []).map(n => Number(n.id)))
    const cancelar = ids.filter(id => pendentes.has(Number(id)))
    if (cancelar.length)
      await LN.cancel({
        notifications: cancelar.map(id => ({
          id: Number(id),
        })),
      })
  } finally {
    salvar(CHAVE, [])
  }
}
async function agendar(LN) {
  await cancelarPendentes(LN)
  if (naTela || !ler('kleo_profile')) return
  if (permissao() !== 'granted') await conferirPermissaoNativa()
  if (permissao() !== 'granted') return
  const lista = proximosAvisos()
  if (!lista.length) return
  let exato = true
  if (plataformaAtual() === 'android') {
    try {
      exato = (await LN.checkExactNotificationSetting()).exact_alarm === 'granted'
    } catch {
      exato = false
    }
  }
  const notificacoes = []
  for (const item of lista) {
    const n = {
      id: idNotificacao(item.tag),
      title: item.titulo,
      body: item.corpo,
      channelId: 'kleo-lembretes',
      autoCancel: true,
      isExactNotification: exato,
      schedule: {
        at: new Date(item.em),
        allowWhileIdle: true,
      },
      extra: {
        url: item.url,
        tag: item.base || item.tag,
        dados: item.dados || {},
      },
    }
    if (item.acoes) {
      const tipo = await tipoDasAcoes(LN, item.acoes)
      if (tipo) n.actionTypeId = tipo
    }
    notificacoes.push(n)
  }
  if (naTela) return
  await LN.schedule({
    notifications: notificacoes,
  })
  salvar(
    CHAVE,
    notificacoes.map(n => n.id),
  )
  marcarAgendados(
    lista.map(i => ({
      tag: i.base || i.tag,
      em: i.em,
    })),
  )
}
let iniciada = false
export async function iniciarAgendaNativa(App) {
  if (iniciada) return
  iniciada = true
  const { LocalNotifications: LN } = await import('@capacitor/local-notifications')
  enfileirar(() => cancelarPendentes(LN))
  await App.addListener('pause', () => {
    naTela = false
    enfileirar(() => agendar(LN))
  })
  await App.addListener('resume', () => {
    naTela = true
    enfileirar(() => cancelarPendentes(LN))
  })
}
