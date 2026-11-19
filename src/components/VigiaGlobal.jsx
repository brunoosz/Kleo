import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ler, salvar, hojeISO } from '../lib/storage'
import { falar } from '../lib/voz'
import { notificar } from '../lib/notificacoes'
import { ocorrenciasDoDia, marcarFeito, lerRotinas, paraMinutos } from '../lib/rotinas'
import { piscarTela } from '../hooks/useAcessibilidade'
import { calcularModoSimples } from '../hooks/useModoSimples'
import { temNecessidade, avisosVisuaisAtivos, leituraVozAtiva } from '../lib/perfil'
import useStorage from '../hooks/useStorage'
import { verificarTimers, verificarPomodoro } from './profissao/util'
import { paraISO, minutosDe } from './AgendaUtil'
import { textoLembrete, tituloLembrete, extraDe, somarCopo, infoTipo } from './RotinaUtil'
import RotinaAlerta from './RotinaAlerta'
import AlarmeTocando from './AlarmeTocando'
import { alarmesVencidos, soneca, limparSonecas } from '../lib/alarmes'
import { atualizarSaidas } from '../lib/saidas'
import { localPorId, linkRota } from '../lib/locais'
const ANTECEDENCIA = 15
const CHAVE_AVISADOS = 'kleo_avisados'
const TOLERANCIA = 10
const CHAVE_AVISOS_ROTINA = 'kleo_rotinas_avisos'
const CHAVE_ADIADAS = 'kleo_rotinas_adiadas'
const ADIAR_MIN = 10
function lerAvisados() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CHAVE_AVISADOS) || '[]'))
  } catch {
    return new Set()
  }
}
function salvarAvisados(set) {
  try {
    sessionStorage.setItem(CHAVE_AVISADOS, JSON.stringify([...set].slice(-200)))
  } catch {}
}
function lerRegistro() {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_AVISOS_ROTINA) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}
function registrar(chaves) {
  const reg = lerRegistro()
  const limite = Date.now() - 3 * 86400000
  const novo = Object.fromEntries(Object.entries(reg).filter(([, t]) => t > limite))
  chaves.forEach(k => {
    novo[k] = Date.now()
  })
  try {
    localStorage.setItem(CHAVE_AVISOS_ROTINA, JSON.stringify(novo))
  } catch {}
}
function perfilAtual() {
  const profile = ler('kleo_profile', {}) || {}
  return {
    surdo: temNecessidade(profile, 'auditiva'),
    avisos: avisosVisuaisAtivos(profile),
    leitura: leituraVozAtiva(profile),
    simples: calcularModoSimples(ler('kleo_modo_simples', null), profile),
  }
}
function avisarSentidos(texto, { forcarVoz = false } = {}) {
  const { surdo, avisos, leitura, simples } = perfilAtual()
  navigator.vibrate?.([250, 100, 250])
  if (avisos) piscarTela()
  if (!surdo)
    falar(texto, {
      forcar: forcarVoz || leitura || simples,
    }).catch(() => {})
}
function verificarCompromissos() {
  const salvos = ler('kleo_events', [])
  const ids = new Set(lerRotinas().map(r => r.id))
  const eventos = (Array.isArray(salvos) ? salvos : []).filter(e => !(e?.rotinaId && ids.has(e.rotinaId)))
  const agora = new Date()
  const hoje = paraISO(agora)
  const min = agora.getHours() * 60 + agora.getMinutes()
  const avisados = lerAvisados()
  const novos = eventos.filter(e => {
    if (!e || e.data !== hoje || avisados.has(String(e.id))) return false
    const m = minutosDe(e.hora)
    return m !== null && m >= min && m <= min + ANTECEDENCIA
  })
  if (!novos.length) return
  novos.forEach(e => avisados.add(String(e.id)))
  salvarAvisados(avisados)
  const e = novos[0]
  const faltam = minutosDe(e.hora) - min
  const texto =
    novos.length === 1
      ? `Lembrete: ${e.titulo} ${faltam <= 0 ? 'agora' : `em ${faltam} minuto${faltam > 1 ? 's' : ''}`}, às ${e.hora}.`
      : `Lembrete: ${novos.length} compromissos em breve. O primeiro é ${e.titulo}, às ${e.hora}.`
  notificar(novos.length === 1 ? e.titulo : 'Compromissos em breve', {
    corpo: texto,
    tag: `evento-${e.id}`,
    url: '/agenda',
  }).catch(() => {})
  avisarSentidos(texto)
}
function alertaDe(rotina, data, hora, chave) {
  return {
    chave,
    rotina,
    data,
    hora,
    titulo: tituloLembrete(rotina),
    texto: rotina.detalhe || '',
    fala: textoLembrete(rotina, hora),
  }
}
function verificarRotinas() {
  const agora = new Date()
  const hoje = hojeISO(agora)
  const min = agora.getHours() * 60 + agora.getMinutes()
  const reg = lerRegistro()
  const novos = []
  for (const o of ocorrenciasDoDia(hoje)) {
    if (o.feito) continue
    const m = paraMinutos(o.hora)
    if (m === null || min < m || min - m > TOLERANCIA) continue
    const chave = `${o.rotina.id}@${hoje}@${o.hora}`
    if (reg[chave]) continue
    novos.push(alertaDe(o.rotina, hoje, o.hora, chave))
  }
  const adiadas = ler(CHAVE_ADIADAS, [])
  if (Array.isArray(adiadas) && adiadas.length) {
    const rotinas = lerRotinas()
    const restantes = []
    for (const a of adiadas) {
      if (Date.now() < a.quando) {
        restantes.push(a)
        continue
      }
      const r = rotinas.find(x => x.id === a.rotinaId)
      const feito = r && Array.isArray(r.feitos?.[a.data]) && r.feitos[a.data].includes(a.hora)
      if (r && !feito && Date.now() - a.quando < 6 * 3600000) {
        novos.push(alertaDe(r, a.data, a.hora, `${r.id}@${a.data}@${a.hora}@adiado${a.quando}`))
      }
    }
    if (restantes.length !== adiadas.length) salvar(CHAVE_ADIADAS, restantes)
  }
  for (const r of lerRotinas()) {
    if (r.tipo !== 'consulta' || r.ativo === false || !r.horarios?.[0]) continue
    const [a, me, d] = String(r.dataInicio).split('-').map(Number)
    const [h, mi] = r.horarios[0].split(':').map(Number)
    const quando = new Date(a, me - 1, d, h, mi).getTime()
    if (!(quando > Date.now())) continue
    const ex = extraDe(r.id)
    const antes = [
      {
        suf: '1d',
        ms: 86400000,
        ligado: ex.avisoDia !== false,
        titulo: `Amanhã: ${r.titulo}`,
        fala: `Lembrete: amanhã você tem ${r.titulo}, às ${r.horarios[0]}.`,
      },
      {
        suf: '1h',
        ms: 3600000,
        ligado: ex.avisoHora !== false,
        titulo: `Daqui 1 hora: ${r.titulo}`,
        fala: `Daqui uma hora você tem ${r.titulo}, às ${r.horarios[0]}.`,
      },
    ]
    for (const p of antes) {
      const alvo = quando - p.ms
      const chave = `${r.id}@pre${p.suf}`
      if (!p.ligado || reg[chave] || Date.now() < alvo || Date.now() - alvo > TOLERANCIA * 60000) continue
      novos.push({
        chave,
        rotina: r,
        data: r.dataInicio,
        hora: r.horarios[0],
        antecipado: true,
        titulo: p.titulo,
        texto: [r.detalhe, `às ${r.horarios[0]}`].filter(Boolean).join(' · '),
        fala: p.fala,
      })
    }
  }
  if (novos.length) registrar(novos.map(n => n.chave))
  return novos
}
function rotaDaSaida(rotina) {
  if (rotina?.tipo !== 'saida') return null
  const ex = extraDe(rotina.id)
  const local = localPorId(ex.localId)
  return local ? linkRota(local, ex.modo) : null
}
function dispararAlertas(novos) {
  novos.forEach(n => {
    const info = infoTipo(n.rotina.tipo)
    notificar(n.titulo, {
      corpo: n.antecipado ? n.texto : n.fala,
      tag: `rotina-${n.chave}`,
      url: rotaDaSaida(n.rotina) || '/rotinas',
      acoes: n.antecipado
        ? undefined
        : [
            {
              action: 'feito',
              title: info.feito,
            },
            {
              action: 'adiar',
              title: `Daqui ${ADIAR_MIN} min`,
            },
          ],
      dados: {
        rotinaId: n.rotina.id,
        data: n.data,
        hora: n.hora,
        chave: n.chave,
      },
    }).catch(() => {})
  })
  const textoFala =
    novos.length === 1
      ? novos[0].fala
      : `${novos[0].fala} E mais ${novos.length - 1} lembrete${novos.length > 2 ? 's' : ''}.`
  avisarSentidos(textoFala, {
    forcarVoz: novos.some(n => n.rotina.tipo === 'remedio'),
  })
}
function fecharNotificacao(chave) {
  try {
    navigator.serviceWorker?.ready
      .then(reg =>
        reg.getNotifications({
          tag: `rotina-${chave}`,
        }),
      )
      .then(lista => (lista || []).forEach(n => n.close()))
      .catch(() => {})
  } catch {}
}
export default function VigiaGlobal() {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState([])
  const [tocando, setTocando] = useState(null)
  const [rotinasSalvas] = useStorage('kleo_rotinas', [])
  const navRef = useRef(navigate)
  useEffect(() => {
    navRef.current = navigate
  })
  useEffect(() => {
    const rodar = () => {
      if (!ler('kleo_profile')) return
      try {
        verificarTimers()
      } catch {}
      try {
        verificarPomodoro()
      } catch {}
    }
    const rodarAgenda = () => {
      if (!ler('kleo_profile')) return
      try {
        verificarCompromissos()
      } catch {}
      try {
        const novos = verificarRotinas()
        if (novos.length) {
          dispararAlertas(novos)
          setAlertas(atual => [...atual, ...novos.filter(n => !atual.some(a => a.chave === n.chave))])
        }
      } catch (e) {
        console.warn('[Kleo] Falha ao verificar rotinas:', e)
      }
    }
    const rodarAlarmes = () => {
      if (!ler('kleo_profile')) return
      try {
        const [a] = alarmesVencidos()
        if (!a) return
        notificar(a.rotulo || 'Despertador', {
          corpo: `São ${a.hora}. Toque para parar.`,
          tag: `alarme-${a.id}`,
          url: '/rotinas',
        }).catch(() => {})
        if (perfilAtual().avisos) piscarTela()
        setTocando(atual => atual || a)
      } catch (e) {
        console.warn('[Kleo] Falha no despertador:', e)
      }
    }
    const rodarSaidas = () => {
      if (!ler('kleo_profile')) return
      atualizarSaidas().catch(() => {})
    }
    rodar()
    rodarAgenda()
    rodarAlarmes()
    rodarSaidas()
    const t4 = setInterval(rodarSaidas, 20 * 60000)
    const t3 = setInterval(rodarAlarmes, 5000)
    const t1 = setInterval(rodar, 1000)
    const t2 = setInterval(rodarAgenda, 30000)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') rodarAgenda()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    const aoNotificacao = ev => {
      const d = ev.detail || {}
      const dados = d.dados || {}
      if (dados.rotinaId && d.acao === 'feito') {
        resolverFeito(dados)
        setAlertas(atual => atual.filter(a => a.chave !== dados.chave))
      } else if (dados.rotinaId && d.acao === 'adiar') {
        adiar(dados)
        setAlertas(atual => atual.filter(a => a.chave !== dados.chave))
      } else if (d.url && window.location.pathname !== d.url) {
        navRef.current(d.url)
      }
    }
    window.addEventListener('kleo-notificacao', aoNotificacao)
    return () => {
      clearInterval(t1)
      clearInterval(t2)
      clearInterval(t3)
      clearInterval(t4)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('kleo-notificacao', aoNotificacao)
    }
  }, [])
  const rotinas = Array.isArray(rotinasSalvas) ? rotinasSalvas : []
  const visiveis = alertas.filter(a => {
    if (a.antecipado) return true
    const r = rotinas.find(x => x.id === a.rotina.id)
    return r && !(Array.isArray(r.feitos?.[a.data]) && r.feitos[a.data].includes(a.hora))
  })
  const atual = visiveis[0]
  const tirar = chave => setAlertas(l => l.filter(a => a.chave !== chave))
  return (
    <>
      <RotinaAlerta
        alerta={tocando ? null : atual}
        total={visiveis.length}
        onFeito={() => {
          resolverFeito(atual)
          fecharNotificacao(atual.chave)
          tirar(atual.chave)
        }}
        onAdiar={() => {
          adiar(atual)
          fecharNotificacao(atual.chave)
          tirar(atual.chave)
        }}
        onFechar={() => {
          fecharNotificacao(atual.chave)
          tirar(atual.chave)
        }}
        onRota={() => {
          const url = rotaDaSaida(atual.rotina)
          resolverFeito(atual)
          fecharNotificacao(atual.chave)
          tirar(atual.chave)
          if (url) navRef.current(url)
        }}
      />
      {tocando && (
        <AlarmeTocando
          alarme={tocando}
          onParar={() => {
            setTocando(null)
            limparSonecas()
          }}
          onSoneca={() => {
            soneca(tocando, 5)
            setTocando(null)
            limparSonecas()
          }}
        />
      )}
    </>
  )
}
function resolverFeito({ rotinaId, data, hora, rotina }) {
  const id = rotinaId || rotina?.id
  if (!id || !hora) return
  marcarFeito(id, data || hojeISO(), hora, true)
  const tipo = rotina?.tipo || lerRotinas().find(r => r.id === id)?.tipo
  if (tipo === 'agua') somarCopo(1, data || hojeISO())
}
function adiar({ rotinaId, data, hora, rotina }) {
  const id = rotinaId || rotina?.id
  if (!id) return
  const lista = ler(CHAVE_ADIADAS, [])
  salvar(CHAVE_ADIADAS, [
    ...(Array.isArray(lista) ? lista : []),
    {
      rotinaId: id,
      data: data || hojeISO(),
      hora,
      quando: Date.now() + ADIAR_MIN * 60000,
    },
  ])
}
