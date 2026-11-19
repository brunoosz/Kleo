import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Sparkles, Trash2, BellRing, X, Volume2, CalendarCheck, ArrowUpRight } from 'lucide-react'
import Tela from '../components/Tela'
import AgendaCalendario from '../components/AgendaCalendario'
import AgendaSheet from '../components/AgendaSheet'
import {
  rotuloDia,
  ordenarPorHora,
  minutosDe,
  paraISO,
  parseISO,
  MESES,
  corEvento,
} from '../components/AgendaUtil'
import { Botao, BotaoIcone, Card, Modal } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useAcessibilidade from '../hooks/useAcessibilidade'
import useModoSimples from '../hooks/useModoSimples'
import useSaida from '../hooks/useSaida'
import { falar } from '../lib/voz'
export default function Agenda() {
  const navigate = useNavigate()
  const { necessidades, leituraVoz } = useAcessibilidade()
  const simples = useModoSimples()
  const grande = simples || necessidades.includes('visual')
  const [eventosBrutos, setEventos] = useStorage('kleo_events', [])
  const eventos = useMemo(
    () => (Array.isArray(eventosBrutos) ? eventosBrutos.filter(e => e && e.data) : []),
    [eventosBrutos],
  )
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  const hoje = paraISO(agora)
  const [params] = useSearchParams()
  const dataParam = params.get('data')
  const dataInicial = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : null
  const [selecionado, setSelecionado] = useState(() => dataInicial || paraISO(new Date()))
  const [visivel, setVisivel] = useState(() => {
    const d = dataInicial ? parseISO(dataInicial) : new Date()
    return {
      ano: d.getFullYear(),
      mes: d.getMonth(),
    }
  })
  const [sheet, setSheet] = useState({
    evento: null,
    chave: 0,
  })
  const [sheetAberto, setSheetAberto] = useState(false)
  const [removendoId, setRemovendoId] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [bannerFechado, setBannerFechado] = useState(false)
  const coresPorDia = useMemo(() => {
    const mapa = {}
    ordenarPorHora(eventos).forEach(e => {
      ;(mapa[e.data] = mapa[e.data] || []).push(corEvento(e.cor))
    })
    return mapa
  }, [eventos])
  const eventosDoDia = useMemo(
    () => ordenarPorHora(eventos.filter(e => e.data === selecionado)),
    [eventos, selecionado],
  )
  const qtdMes = useMemo(() => {
    const prefixo = `${visivel.ano}-${String(visivel.mes + 1).padStart(2, '0')}`
    return eventos.filter(e => e.data.startsWith(prefixo)).length
  }, [eventos, visivel])
  const proximos = useMemo(() => {
    const min = agora.getHours() * 60 + agora.getMinutes()
    return ordenarPorHora(
      eventos.filter(e => {
        if (e.data !== hoje) return false
        const m = minutosDe(e.hora)
        return m !== null && m >= min && m <= min + 60
      }),
    )
  }, [eventos, agora, hoje])
  const textoLembrete = proximos.length
    ? proximos.length === 1
      ? `${proximos[0].titulo} às ${proximos[0].hora}${faltam(proximos[0].hora, agora)}`
      : `${proximos.length} compromissos na próxima hora. O primeiro é ${proximos[0].titulo}, às ${proximos[0].hora}.`
    : ''
  const selecionar = iso => {
    setSelecionado(iso)
    const d = parseISO(iso)
    if (d && (d.getMonth() !== visivel.mes || d.getFullYear() !== visivel.ano)) {
      setVisivel({
        ano: d.getFullYear(),
        mes: d.getMonth(),
      })
    }
  }
  const mudarMes = (ano, mes) => {
    setVisivel({
      ano,
      mes,
    })
    const atual = parseISO(selecionado)
    const ultimo = new Date(ano, mes + 1, 0).getDate()
    const dia = Math.min(atual ? atual.getDate() : 1, ultimo)
    const alvo = paraISO(new Date(ano, mes, dia, 12))
    setSelecionado(ano === agora.getFullYear() && mes === agora.getMonth() ? hoje : alvo)
  }
  const irParaHoje = () => {
    setVisivel({
      ano: agora.getFullYear(),
      mes: agora.getMonth(),
    })
    setSelecionado(hoje)
  }
  const abrirNovo = () => {
    setSheet(s => ({
      evento: null,
      chave: (Number(String(s.chave).split('-').pop()) || 0) + 1,
    }))
    setSheetAberto(true)
  }
  const abrirEdicao = ev => {
    setSheet(s => ({
      evento: ev,
      chave: `${ev.id}-${(Number(String(s.chave).split('-').pop()) || 0) + 1}`,
    }))
    setSheetAberto(true)
  }
  const salvarEvento = ev => {
    setEventos(lista => {
      const arr = Array.isArray(lista) ? lista : []
      return arr.some(e => e.id === ev.id) ? arr.map(e => (e.id === ev.id ? ev : e)) : [...arr, ev]
    })
    setSheetAberto(false)
    selecionar(ev.data)
  }
  const excluir = id => {
    setConfirmar(null)
    setRemovendoId(id)
    setTimeout(() => {
      setEventos(lista => (Array.isArray(lista) ? lista.filter(e => e.id !== id) : []))
      setRemovendoId(r => (r === id ? null : r))
    }, 300)
  }
  const ouvirDia = () => {
    const rotulo = rotuloDia(selecionado)
    if (!eventosDoDia.length) {
      falar(`${rotulo}. Nenhum compromisso.`, {
        forcar: true,
      }).catch(() => {})
      return
    }
    const partes = eventosDoDia.map(e => `${e.hora ? `às ${e.hora}, ` : ''}${e.titulo}`)
    falar(
      `${rotulo}. ${eventosDoDia.length} compromisso${eventosDoDia.length > 1 ? 's' : ''}: ${partes.join('; ')}.`,
      {
        forcar: true,
      },
    ).catch(() => {})
  }
  const ehHoje = selecionado === hoje
  const mostrarBotaoHoje = !(
    visivel.ano === agora.getFullYear() &&
    visivel.mes === agora.getMonth() &&
    ehHoje
  )
  const mostrarOuvir = simples || leituraVoz
  const { montado: bannerMontado, saindo: bannerSaindo } = useSaida(
    proximos.length > 0 && !bannerFechado,
    220,
  )
  return (
    <Tela
      titulo="Agenda"
      subtitulo={
        simples
          ? undefined
          : `${qtdMes ? `${qtdMes} compromisso${qtdMes > 1 ? 's' : ''}` : 'Nenhum compromisso'} em ${MESES[visivel.mes]}`
      }
      acoes={
        <>
          {mostrarBotaoHoje && (
            <button
              type="button"
              onClick={irParaHoje}
              className="anim-pop tap"
              style={{
                ...styles.btnHoje,
                minHeight: grande ? 56 : 44,
              }}
              aria-label="Ir para hoje"
            >
              Hoje
            </button>
          )}
          {!simples && (
            <BotaoIcone icone={Plus} variante="preto" onClick={abrirNovo} label="Novo compromisso" />
          )}
        </>
      }
    >
      <style>{`
        @keyframes agendaSino { 0%, 70%, 100% { transform: rotate(0); } 75% { transform: rotate(14deg); } 80% { transform: rotate(-12deg); } 85% { transform: rotate(8deg); } 90% { transform: rotate(-4deg); } }
        .agenda-sino { animation: agendaSino 2.6s ease-in-out infinite; transform-origin: 50% 10%; }
      `}</style>

      {bannerMontado && proximos.length > 0 && (
        <div className={bannerSaindo ? 'anim-out' : 'anim-up'} style={styles.banner} role="alert">
          <span className="anim-pop" style={styles.bannerIcone}>
            <span
              className="agenda-sino"
              style={{
                display: 'flex',
              }}
            >
              <BellRing size={21} color="#000" />
            </span>
          </span>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <p style={styles.bannerRotulo}>Em breve</p>
            <p
              style={{
                ...styles.bannerTexto,
                fontSize: grande ? 18 : 16,
              }}
            >
              {textoLembrete}
            </p>
          </div>
          <BotaoIcone icone={X} label="Dispensar lembrete" onClick={() => setBannerFechado(true)} />
        </div>
      )}

      {simples && (
        <div
          style={{
            marginBottom: 14,
          }}
        >
          <Botao icone={Plus} cheio grande onClick={abrirNovo}>
            Novo compromisso
          </Botao>
        </div>
      )}

      <AgendaCalendario
        ano={visivel.ano}
        mes={visivel.mes}
        onMudarMes={mudarMes}
        selecionado={selecionado}
        onSelecionar={selecionar}
        hoje={hoje}
        coresPorDia={coresPorDia}
        grande={grande}
        simples={simples}
      />

      <div style={styles.cabecalhoDia}>
        <div
          style={{
            minWidth: 0,
          }}
        >
          {ehHoje && (
            <span className="anim-pop" style={styles.seloHoje}>
              Hoje
            </span>
          )}
          <h2
            key={selecionado}
            className="anim-fade"
            style={{
              ...styles.tituloDia,
              fontSize: grande ? 26 : 24,
            }}
          >
            {rotuloDia(selecionado, agora.getFullYear())}
          </h2>
        </div>
        {mostrarOuvir &&
          (simples ? (
            <Botao variante="fantasma" icone={Volume2} onClick={ouvirDia}>
              Ouvir
            </Botao>
          ) : (
            <BotaoIcone icone={Volume2} label="Ouvir compromissos do dia" onClick={ouvirDia} />
          ))}
      </div>

      {eventosDoDia.length === 0 ? (
        <Card key={selecionado} cor="mist" className="anim-scale" style={styles.vazio}>
          <span
            className="anim-pop"
            style={{
              ...styles.vazioIcone,
              animationDelay: '80ms',
            }}
          >
            <CalendarCheck size={30} color="#000" />
          </span>
          <p style={styles.vazioTitulo}>Dia livre</p>
          <p style={styles.vazioTexto}>Nenhum compromisso para este dia.</p>
          {!simples && (
            <Botao
              variante="primario"
              icone={Plus}
              onClick={abrirNovo}
              style={{
                marginTop: 14,
              }}
            >
              Adicionar compromisso
            </Botao>
          )}
        </Card>
      ) : (
        <div key={selecionado} className="stagger" style={styles.lista}>
          {eventosDoDia.map(ev => {
            const passou =
              ehHoje &&
              minutosDe(ev.hora) !== null &&
              minutosDe(ev.hora) < agora.getHours() * 60 + agora.getMinutes()
            const cor = corEvento(ev.cor)
            return (
              <div key={ev.id} className={removendoId === ev.id ? 'item-out' : undefined}>
                <div
                  className="kleo-card"
                  style={{
                    ...styles.card,
                    opacity: passou ? 0.6 : 1,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => abrirEdicao(ev)}
                    className="tap"
                    style={styles.cardCorpo}
                    aria-label={`Editar ${ev.titulo}${ev.hora ? `, às ${ev.hora}` : ''}`}
                  >
                    <span
                      style={{
                        ...styles.hora,
                        background: cor,
                        minWidth: grande ? 76 : 66,
                      }}
                    >
                      <span
                        style={{
                          ...styles.horaTexto,
                          fontSize: ev.hora ? (grande ? 20 : 18) : 13,
                        }}
                      >
                        {ev.hora || 'Dia todo'}
                      </span>
                    </span>
                    <span style={styles.cardTexto}>
                      <span
                        style={{
                          ...styles.cardTitulo,
                          fontSize: grande ? 19 : 17,
                        }}
                      >
                        {ev.titulo}
                      </span>
                      {ev.descricao && !simples && <span style={styles.cardDesc}>{ev.descricao}</span>}
                      {passou && <span style={styles.passou}>Já passou</span>}
                    </span>
                  </button>
                  {simples ? (
                    <Botao
                      variante="fantasma"
                      icone={Trash2}
                      onClick={() => setConfirmar(ev)}
                      style={styles.btnApagar}
                    >
                      Apagar
                    </Botao>
                  ) : (
                    <BotaoIcone
                      icone={Trash2}
                      label={`Excluir ${ev.titulo}`}
                      variante="lavanda"
                      onClick={() => setConfirmar(ev)}
                      style={{
                        alignSelf: 'center',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Card cor="lavanda" onClick={() => navigate('/chat')} style={styles.btnKleo}>
        <span style={styles.btnKleoLinha}>
          <span style={styles.btnKleoIcone}>
            <Sparkles size={19} color="#fff" />
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <span style={styles.btnKleoTitulo}>Pedir para a Kleo</span>
            {!simples && <span style={styles.btnKleoSub}>"Marque dentista sexta às 15h"</span>}
          </span>
          <ArrowUpRight size={20} color="#000" />
        </span>
      </Card>

      <AgendaSheet
        aberto={sheetAberto}
        chave={sheet.chave}
        evento={sheet.evento}
        dataPadrao={selecionado}
        onSalvar={salvarEvento}
        onFechar={() => setSheetAberto(false)}
        simples={simples}
      />

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo={simples ? 'Apagar compromisso?' : 'Excluir compromisso?'}
        texto={
          confirmar
            ? `"${confirmar.titulo}"${confirmar.hora ? ` às ${confirmar.hora}` : ''} vai sair da sua agenda.`
            : ''
        }
        acoes={[
          {
            label: 'Manter',
            variante: 'fantasma',
            onClick: () => setConfirmar(null),
          },
          {
            label: simples ? 'Apagar' : 'Excluir',
            variante: 'perigo',
            onClick: () => confirmar && excluir(confirmar.id),
          },
        ]}
      />
    </Tela>
  )
}
function faltam(hora, agora) {
  const m = minutosDe(hora)
  if (m === null) return ''
  const dif = m - (agora.getHours() * 60 + agora.getMinutes())
  if (dif <= 0) return ', agora'
  return `, em ${dif} min`
}
const styles = {
  btnHoje: {
    padding: '0 18px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--lavanda)',
    color: '#000',
    fontSize: 16,
    fontWeight: 600,
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 12px 14px 16px',
    marginBottom: 14,
    background: 'var(--lima)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
  },
  bannerIcone: {
    width: 44,
    height: 44,
    borderRadius: '30%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerRotulo: {
    fontSize: 13,
    fontWeight: 700,
    color: '#000',
  },
  bannerTexto: {
    fontWeight: 600,
    color: '#000',
    marginTop: 2,
    lineHeight: 1.3,
  },
  cabecalhoDia: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    margin: '26px 2px 12px',
  },
  seloHoje: {
    display: 'inline-block',
    fontSize: 13,
    fontWeight: 700,
    color: '#000',
    background: 'var(--lavanda)',
    borderRadius: 'var(--r-badge)',
    padding: '3px 12px',
    marginBottom: 8,
  },
  tituloDia: {
    fontWeight: 800,
    lineHeight: 1.1,
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 6,
    background: 'var(--surface)',
    paddingRight: 12,
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    transition: 'opacity .2s',
  },
  cardCorpo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    textAlign: 'left',
    minHeight: 72,
    borderRadius: 'var(--r-card-m)',
  },
  hora: {
    alignSelf: 'stretch',
    borderRadius: 20,
    flexShrink: 0,
    padding: '8px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horaTexto: {
    fontWeight: 800,
    color: '#000',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  cardTexto: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardTitulo: {
    fontWeight: 700,
    color: '#000',
    wordBreak: 'break-word',
    lineHeight: 1.2,
  },
  cardDesc: {
    fontSize: 15,
    color: 'var(--text-2)',
    lineHeight: 1.35,
    wordBreak: 'break-word',
  },
  passou: {
    fontSize: 13,
    color: 'var(--text-3)',
    fontWeight: 600,
  },
  btnApagar: {
    alignSelf: 'center',
    padding: '10px 16px',
  },
  vazio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '28px 20px',
    boxShadow: 'none',
  },
  vazioIcone: {
    width: 64,
    height: 64,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vazioTitulo: {
    fontSize: 21,
    fontWeight: 800,
  },
  vazioTexto: {
    fontSize: 16,
    color: 'var(--text-2)',
    marginTop: 4,
  },
  btnKleo: {
    marginTop: 20,
    padding: '12px 18px 12px 12px',
  },
  btnKleoLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  btnKleoIcone: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnKleoTitulo: {
    display: 'block',
    fontSize: 17,
    fontWeight: 700,
    color: '#000',
  },
  btnKleoSub: {
    display: 'block',
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 2,
  },
}
