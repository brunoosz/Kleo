import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  AlarmClock,
  Bell,
  BellRing,
  BellOff,
  Mic,
  Trash2,
  Minus,
  GlassWater,
  Info,
  Sparkles,
  CalendarDays,
} from 'lucide-react'
import Tela from '../components/Tela'
import { Card, Botao, BotaoIcone, Segmentado, Toggle, Tag, Modal, TituloSecao, Vazio } from '../components/ui'
import RotinaItem from '../components/RotinaItem'
import RotinaCriar from '../components/RotinaCriar'
import AlarmesSecao from '../components/AlarmesSecao'
import {
  infoTipo,
  SECOES,
  coposDoDia,
  somarCopo,
  metaCopos,
  removerRotinaCompleta,
  relativo,
  minutosAte,
  rotuloDuracao,
  rotuloDataCurta,
} from '../components/RotinaUtil'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import useAgora from '../components/profissao/useAgora'
import { hojeISO } from '../lib/storage'
import {
  ocorrenciasDoDia,
  marcarFeito,
  atualizarRotina,
  descreverDias,
  horariosDaRotina,
  rotinaAtivaEm,
  paraMinutos,
} from '../lib/rotinas'
import { permissao, pedirPermissao } from '../lib/notificacoes'
const TIPOS_VALIDOS = ['remedio', 'agua', 'consulta', 'personalizado']
export default function Rotinas() {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [params, setParams] = useSearchParams()
  const [rotinasSalvas] = useStorage('kleo_rotinas', [])
  useStorage('kleo_agua', {})
  useStorage('kleo_rotinas_extra', {})
  const agoraMs = useAgora(30000)
  const agora = new Date(agoraMs)
  const hoje = hojeISO(agora)
  const minAgora = agora.getHours() * 60 + agora.getMinutes()
  const [aba, setAba] = useState(() => (/despert|alarme/.test(params.get('aba') || '') ? 'alarmes' : 'hoje'))
  const novoParam = params.get('novo')
  const [criar, setCriar] = useState(() =>
    novoParam
      ? {
          aberto: true,
          tipo: TIPOS_VALIDOS.includes(novoParam) ? novoParam : null,
          n: 1,
        }
      : {
          aberto: false,
          tipo: null,
          n: 0,
        },
  )
  const [aviso, setAviso] = useState(null)
  const [apagar, setApagar] = useState(null)
  const [notif, setNotif] = useState(() => permissao())
  const rotinas = Array.isArray(rotinasSalvas) ? rotinasSalvas : []
  const ocorrencias = ocorrenciasDoDia(hoje)
  const doDia = ocorrencias.filter(o => o.rotina.tipo !== 'agua')
  const feitos = doDia.filter(o => o.feito).length
  const proxima = doDia.find(o => !o.feito && paraMinutos(o.hora) >= minAgora)
  const aguaHoje = rotinas.find(r => r.tipo === 'agua' && rotinaAtivaEm(r, hoje))
  const copos = coposDoDia(hoje)
  const meta = metaCopos(rotinas)
  const abrirCriar = (tipo = null) =>
    setCriar(c => ({
      aberto: true,
      tipo,
      n: c.n + 1,
    }))
  const fecharCriar = () => {
    setCriar(c => ({
      ...c,
      aberto: false,
    }))
    if (params.get('novo'))
      setParams(
        {},
        {
          replace: true,
        },
      )
  }
  const aoSalvar = r => {
    fecharCriar()
    setNotif(permissao())
    mostrarAviso(`${infoTipo(r.tipo).nome} criado. Eu aviso na hora.`)
  }
  const mostrarAviso = texto => {
    setAviso({
      texto,
      id: Date.now(),
    })
    setTimeout(() => setAviso(a => (a && a.texto === texto ? null : a)), 2800)
  }
  const alternar = o => marcarFeito(o.rotina.id, hoje, o.hora, !o.feito)
  const beberCopo = delta => {
    somarCopo(delta, hoje)
    if (delta > 0 && aguaHoje) {
      const venceu = ocorrencias.filter(
        o => o.rotina.id === aguaHoje.id && !o.feito && paraMinutos(o.hora) <= minAgora + 15,
      )
      const alvo = venceu[venceu.length - 1]
      if (alvo) marcarFeito(aguaHoje.id, hoje, alvo.hora, true)
    }
  }
  const ativarNotificacoes = async () => setNotif(await pedirPermissao())
  const cartaoNotificacao = () => {
    if (notif === 'granted') {
      return simples ? null : (
        <div style={styles.notifOk} className="anim-fade">
          <Tag cor="lima" icone={BellRing}>
            Avisos ligados neste aparelho
          </Tag>
        </div>
      )
    }
    if (notif === 'denied') {
      return (
        <Card
          cor="branco"
          style={{
            ...styles.notifCard,
            border: '1px solid var(--erro)',
          }}
        >
          <div style={styles.linhaIcone}>
            <span
              style={{
                ...styles.iconeQuadrado,
                background: 'var(--surface-2)',
              }}
            >
              <BellOff size={22} color="var(--erro)" />
            </span>
            <div>
              <strong style={styles.notifTitulo}>Avisos bloqueados</strong>
              <p style={styles.notifTexto}>
                {simples
                  ? 'Peça ajuda para liberar os avisos do site. Com o app aberto, eu aviso na tela e falando.'
                  : 'O navegador bloqueou as notificações. Toque no cadeado ao lado do endereço e libere "Notificações". Enquanto isso, com o app aberto, aviso na tela e por voz.'}
              </p>
            </div>
          </div>
        </Card>
      )
    }
    if (notif === 'indisponivel') {
      return (
        <Card cor="mist" style={styles.notifCard}>
          <div style={styles.linhaIcone}>
            <span style={styles.iconeQuadrado}>
              <Info size={22} />
            </span>
            <p style={styles.notifTexto}>
              Este navegador não mostra notificações. Com o app aberto, aviso na tela e por voz.
            </p>
          </div>
        </Card>
      )
    }
    return (
      <Card cor="lavanda" tamanho="g" style={styles.notifCard}>
        <div style={styles.linhaIcone}>
          <span style={styles.iconeQuadrado}>
            <Bell size={24} />
          </span>
          <div>
            <strong style={styles.notifTitulo}>
              {simples ? 'Quer que eu avise você?' : 'Ative os avisos'}
            </strong>
            {!simples && (
              <p style={styles.notifTexto}>Para eu lembrar dos remédios mesmo com o celular bloqueado.</p>
            )}
          </div>
        </div>
        <Botao
          icone={BellRing}
          cheio
          grande={simples}
          onClick={ativarNotificacoes}
          style={{
            marginTop: 14,
          }}
        >
          Ativar notificações
        </Botao>
      </Card>
    )
  }
  const cartaoProgresso = doDia.length > 0 && (
    <Card
      cor="lima"
      tamanho="g"
      style={{
        padding: simples ? 24 : 22,
      }}
    >
      <div style={styles.progTopo}>
        <div>
          <span style={styles.progRotulo}>Hoje</span>
          <div style={styles.progNumero}>
            <span key={feitos} className="valor-muda">
              {feitos}
            </span>
            <span style={styles.progDe}> de {doDia.length}</span>
          </div>
        </div>
        <span style={styles.progSelo}>
          {feitos === doDia.length
            ? 'Tudo feito'
            : simples
              ? 'Feitos'
              : `${Math.round((feitos / doDia.length) * 100)}% feito`}
        </span>
      </div>
      <div style={styles.trilho} aria-hidden="true">
        <span
          style={{
            ...styles.barra,
            width: `${(feitos / doDia.length) * 100}%`,
          }}
        />
      </div>
      {proxima && (
        <p style={styles.progProx}>
          Próximo: <strong>{proxima.rotina.titulo}</strong> às {proxima.hora} (
          {relativo(minutosAte(proxima.hora, agora))})
        </p>
      )}
    </Card>
  )
  const cartaoAgua = aguaHoje && (
    <Card
      cor="ceu"
      tamanho="g"
      style={{
        padding: simples ? 24 : 22,
      }}
    >
      <div style={styles.progTopo}>
        <div>
          <span style={styles.progRotulo}>Água</span>
          <div style={styles.progNumero}>
            <span key={copos} className="valor-muda">
              {copos}
            </span>
            <span style={styles.progDe}> / {meta} copos</span>
          </div>
        </div>
        <div style={styles.aguaBotoes}>
          {!simples && (
            <BotaoIcone
              icone={Minus}
              label="Tirar um copo"
              onClick={() => beberCopo(-1)}
              disabled={copos === 0}
            />
          )}
          {simples ? (
            <Botao icone={Plus} grande onClick={() => beberCopo(1)}>
              Bebi
            </Botao>
          ) : (
            <BotaoIcone icone={Plus} variante="preto" label="Bebi um copo" onClick={() => beberCopo(1)} />
          )}
        </div>
      </div>
      <div style={styles.copos} aria-label={`${copos} de ${meta} copos`}>
        {Array.from({
          length: meta,
        }).map((_, i) => (
          <span
            key={i}
            className={i === copos - 1 ? 'check-pop' : undefined}
            style={{
              ...styles.copo,
              background: i < copos ? '#000' : 'var(--surface)',
            }}
          >
            <GlassWater size={14} color={i < copos ? '#fff' : 'var(--text-3)'} aria-hidden="true" />
          </span>
        ))}
      </div>
      {!simples &&
        (() => {
          const prox = horariosDaRotina(aguaHoje).find(h => paraMinutos(h) > minAgora)
          return (
            <p style={styles.progProx}>
              {copos >= meta
                ? 'Meta do dia batida. Muito bem!'
                : prox
                  ? `Próximo lembrete às ${prox}`
                  : 'Sem mais lembretes hoje'}
            </p>
          )
        })()}
    </Card>
  )
  const linhaDoTempo = () => {
    if (!doDia.length) {
      return (
        <Vazio
          icone={AlarmClock}
          titulo={simples ? 'Nada para hoje' : 'Nenhum lembrete hoje'}
          texto={simples ? 'Toque abaixo para criar.' : 'Crie um lembrete de remédio, água ou consulta.'}
        />
      )
    }
    const idxAgora = doDia.findIndex(o => paraMinutos(o.hora) > minAgora)
    const itens = []
    doDia.forEach((o, i) => {
      if (i === idxAgora)
        itens.push({
          agora: true,
        })
      itens.push(o)
    })
    if (idxAgora === -1)
      itens.push({
        agora: true,
      })
    return (
      <div style={styles.tempo} className="stagger">
        {itens.map(o => {
          if (o.agora) {
            return (
              <div key="agora" style={styles.agoraLinha} aria-label="Agora">
                <span style={styles.agoraPonto} />
                <span style={styles.agoraTexto}>
                  Agora {String(agora.getHours()).padStart(2, '0')}:
                  {String(agora.getMinutes()).padStart(2, '0')}
                </span>
                <span style={styles.agoraTraco} />
              </div>
            )
          }
          const diff = minutosAte(o.hora, agora)
          const atrasado = !o.feito && diff < 0
          const ehProxima = proxima && o.rotina.id === proxima.rotina.id && o.hora === proxima.hora
          return (
            <div key={o.rotina.id + o.hora} style={styles.tempoLinha}>
              <span
                style={{
                  ...styles.tempoPonto,
                  background: o.feito ? '#000' : ehProxima ? 'var(--lima)' : 'var(--surface)',
                  borderColor: atrasado ? 'var(--erro)' : '#000',
                }}
                aria-hidden="true"
              />
              <Card
                style={{
                  flex: 1,
                  padding: simples ? '14px 16px' : '10px 14px',
                  border: ehProxima ? '2px solid #000' : '2px solid transparent',
                }}
              >
                <RotinaItem
                  ocorrencia={o}
                  onMarcar={alternar}
                  atrasado={atrasado}
                  quando={!o.feito && Math.abs(diff) <= 180 ? relativo(diff) : ''}
                />
              </Card>
            </div>
          )
        })}
      </div>
    )
  }
  const descHorarios = r => {
    if (r.tipo === 'agua')
      return `A cada ${r.intervaloMin >= 60 && r.intervaloMin % 60 === 0 ? `${r.intervaloMin / 60} h` : `${r.intervaloMin} min`}, das ${r.inicioDia} às ${r.fimDia}`
    if (r.tipo === 'consulta') return `${rotuloDataCurta(r.dataInicio)} às ${r.horarios[0] || ''}`
    return r.horarios.join(' · ')
  }
  const listaRotinas = () => {
    if (!rotinas.length) {
      return (
        <Vazio
          icone={Sparkles}
          titulo="Nenhuma rotina ainda"
          texto="Comece por um remédio, água ou consulta."
          cor="lima"
        />
      )
    }
    return SECOES.map(sec => {
      const lista = rotinas.filter(r => sec.tipos.includes(r.tipo))
      if (!lista.length) return null
      return (
        <section key={sec.id} aria-label={sec.titulo}>
          <TituloSecao>{sec.titulo}</TituloSecao>
          <div style={styles.listaCards} className="stagger">
            {lista.map(r => {
              const info = infoTipo(r.tipo)
              const Icone = info.icone
              const passou = r.tipo === 'consulta' && r.dataInicio < hoje
              const dur = rotuloDuracao(r, hoje)
              return (
                <Card
                  key={r.id}
                  style={{
                    opacity: r.ativo === false || passou ? 0.6 : 1,
                  }}
                >
                  <div style={styles.rotinaTopo}>
                    <span
                      style={{
                        ...styles.iconeQuadrado,
                        background: info.cor,
                      }}
                    >
                      <Icone size={22} />
                    </span>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          ...styles.rotinaTitulo,
                          fontSize: simples ? 20 : 17,
                        }}
                      >
                        {r.titulo}
                      </strong>
                      {r.detalhe && <p style={styles.rotinaDetalhe}>{r.detalhe}</p>}
                    </div>
                    {!simples && r.tipo !== 'consulta' && (
                      <Toggle
                        ligado={r.ativo !== false}
                        onChange={v =>
                          atualizarRotina(r.id, {
                            ativo: v,
                          })
                        }
                        label={`Lembrete ${r.titulo} ligado`}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      ...styles.rotinaHoras,
                      fontSize: simples ? 18 : 16,
                    }}
                  >
                    {descHorarios(r)}
                  </p>
                  <div style={styles.rotinaRodape}>
                    <div style={styles.tags}>
                      {r.tipo !== 'consulta' && r.tipo !== 'agua' && (
                        <Tag cor="mist" icone={CalendarDays}>
                          {descreverDias(r.dias)}
                        </Tag>
                      )}
                      {dur && <Tag cor={dur === 'Terminou' ? 'mist' : 'lima'}>{dur}</Tag>}
                      {passou && <Tag cor="mist">Já passou</Tag>}
                    </div>
                    {simples ? (
                      <Botao variante="fantasma" icone={Trash2} onClick={() => setApagar(r)}>
                        Apagar
                      </Botao>
                    ) : (
                      <BotaoIcone icone={Trash2} label={`Apagar ${r.titulo}`} onClick={() => setApagar(r)} />
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )
    })
  }
  const dica = (
    <Card
      cor="lavanda"
      style={{
        marginTop: 22,
      }}
    >
      <span style={styles.dicaRotulo}>{simples ? 'Mais fácil ainda' : 'Dica'}</span>
      <p
        style={{
          ...styles.dicaTexto,
          fontSize: simples ? 20 : 18,
        }}
      >
        Diga à Kleo: <strong>“me lembra de tomar losartana todo dia às 8h”</strong>
      </p>
      <Botao
        icone={Mic}
        grande={simples}
        onClick={() => navigate('/chat?voz=1')}
        style={{
          marginTop: 12,
        }}
      >
        Falar com a Kleo
      </Botao>
    </Card>
  )
  return (
    <Tela
      titulo="Rotinas"
      subtitulo={simples ? 'Seus lembretes de hoje' : 'Remédios, água e lembretes do dia'}
      acoes={
        !simples && (
          <BotaoIcone icone={Plus} variante="preto" label="Novo lembrete" onClick={() => abrirCriar()} />
        )
      }
    >
      <div style={styles.coluna}>
        {cartaoNotificacao()}

        {simples && (
          <Botao icone={Plus} grande cheio onClick={() => abrirCriar()}>
            Criar lembrete
          </Botao>
        )}

        <Segmentado
          opcoes={[
            {
              id: 'hoje',
              label: 'Hoje',
            },
            {
              id: 'todas',
              label: simples ? 'Lembretes' : 'Rotinas',
            },
            {
              id: 'alarmes',
              label: 'Despertador',
            },
          ]}
          valor={aba}
          onChange={setAba}
        />

        <div key={aba} className="anim-tab" style={styles.coluna}>
          {aba === 'alarmes' ? (
            <AlarmesSecao onFalarComKleo={() => navigate('/chat?voz=1')} />
          ) : aba === 'hoje' ? (
            <>
              {cartaoProgresso}
              {cartaoAgua}
              {doDia.length > 0 && (
                <TituloSecao
                  style={{
                    margin: '10px 2px 2px',
                  }}
                >
                  Linha do tempo
                </TituloSecao>
              )}
              {linhaDoTempo()}
            </>
          ) : (
            <>
              {listaRotinas()}
              {!simples && rotinas.length > 0 && (
                <Botao
                  variante="fantasma"
                  icone={Plus}
                  cheio
                  onClick={() => abrirCriar()}
                  style={{
                    marginTop: 8,
                  }}
                >
                  Novo lembrete
                </Botao>
              )}
            </>
          )}
        </div>

        {dica}
      </div>

      {aviso && (
        <div key={aviso.id} role="status" className="anim-pop" style={styles.toast}>
          {aviso.texto}
        </div>
      )}

      <RotinaCriar
        key={criar.n}
        aberto={criar.aberto}
        tipoInicial={criar.tipo}
        onFechar={fecharCriar}
        onSalvo={aoSalvar}
      />

      <Modal
        aberto={!!apagar}
        onFechar={() => setApagar(null)}
        titulo={simples ? 'Apagar este lembrete?' : `Apagar "${apagar?.titulo || ''}"?`}
        texto={
          simples
            ? `${apagar?.titulo || ''}. Não vou mais avisar.`
            : 'Os avisos dessa rotina param. Se for consulta, ela também sai da agenda.'
        }
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setApagar(null),
          },
          {
            label: 'Apagar',
            variante: 'perigo',
            onClick: () => {
              removerRotinaCompleta(apagar.id)
              setApagar(null)
              mostrarAviso('Lembrete apagado.')
            },
          },
        ]}
      />
    </Tela>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  notifOk: {
    display: 'flex',
  },
  notifCard: {
    padding: 20,
  },
  linhaIcone: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconeQuadrado: {
    width: 46,
    height: 46,
    borderRadius: '30%',
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
  },
  notifTitulo: {
    fontSize: 20,
    fontWeight: 800,
    display: 'block',
    lineHeight: 1.15,
    marginTop: 2,
  },
  notifTexto: {
    fontSize: 15,
    color: 'var(--text-2)',
    lineHeight: 1.45,
    marginTop: 4,
  },
  progTopo: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  progRotulo: {
    fontSize: 15,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  progNumero: {
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1,
    marginTop: 4,
    fontVariantNumeric: 'tabular-nums',
  },
  progDe: {
    fontSize: 20,
    fontWeight: 600,
  },
  progSelo: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-badge)',
    padding: '6px 14px',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  trilho: {
    height: 10,
    borderRadius: 5,
    background: 'var(--surface)',
    marginTop: 16,
    overflow: 'hidden',
  },
  barra: {
    display: 'block',
    height: '100%',
    borderRadius: 5,
    background: '#000',
    transition: 'width 0.6s var(--spring)',
  },
  progProx: {
    fontSize: 16,
    marginTop: 12,
    lineHeight: 1.4,
  },
  aguaBotoes: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  copos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  copo: {
    width: 30,
    height: 30,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.25s',
  },
  tempo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    position: 'relative',
    paddingLeft: 22,
    borderLeft: '2px dashed var(--border)',
    marginLeft: 8,
  },
  tempoLinha: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  tempoPonto: {
    position: 'absolute',
    left: -32,
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '3px solid',
    boxSizing: 'border-box',
    transition: 'background 0.25s',
  },
  agoraLinha: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  agoraPonto: {
    position: 'absolute',
    left: -30,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--erro)',
  },
  agoraTexto: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--erro)',
    whiteSpace: 'nowrap',
  },
  agoraTraco: {
    flex: 1,
    height: 2,
    background: 'var(--erro)',
    borderRadius: 1,
    opacity: 0.6,
  },
  listaCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  rotinaTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  rotinaTitulo: {
    fontWeight: 800,
    display: 'block',
    lineHeight: 1.2,
    overflowWrap: 'anywhere',
  },
  rotinaDetalhe: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 2,
  },
  rotinaHoras: {
    fontWeight: 700,
    marginTop: 12,
    fontVariantNumeric: 'tabular-nums',
  },
  rotinaRodape: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  dicaRotulo: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  dicaTexto: {
    lineHeight: 1.35,
    marginTop: 6,
  },
  toast: {
    position: 'sticky',
    bottom: 12,
    margin: '16px auto 0',
    width: 'fit-content',
    maxWidth: '100%',
    background: '#000',
    color: '#fff',
    borderRadius: 'var(--r-btn)',
    padding: '12px 20px',
    fontSize: 16,
    fontWeight: 600,
    boxShadow: 'var(--sombra)',
    zIndex: 5,
  },
}
