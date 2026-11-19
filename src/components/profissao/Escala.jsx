import { useState } from 'react'
import { Plus, CalendarPlus, Trash2, MapPin, Clock, Check, CalendarClock } from 'lucide-react'
import useStorage from '../../hooks/useStorage'
import useRemocao from './useRemocao'
import { adicionarEvento } from '../../lib/storage'
import { Card, Rotulo, Pill, Chip, Campo, Redondo, Vazio } from './ui'
import { alvo, proximoDiaSemana, formatarData } from './util'
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const ORDEM = [1, 2, 3, 4, 5, 6, 0]
function horas(inicio, fim) {
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fim.split(':').map(Number)
  let min = h2 * 60 + m2 - (h1 * 60 + m1)
  if (min <= 0) min += 24 * 60
  return min / 60
}
export default function Escala({ necessidade }) {
  const [escala, setEscala] = useStorage('kleo_escala', [])
  const [dias, setDias] = useState([])
  const [inicio, setInicio] = useState('08:00')
  const [fim, setFim] = useState('16:00')
  const [local, setLocal] = useState('')
  const [enviados, setEnviados] = useState({})
  const h = alvo(necessidade)
  const lista = Array.isArray(escala) ? escala : []
  const ordenada = [...lista].sort(
    (a, b) => ORDEM.indexOf(a.dia) - ORDEM.indexOf(b.dia) || a.inicio.localeCompare(b.inicio),
  )
  const totalHoras = lista.reduce((s, t) => s + horas(t.inicio, t.fim), 0)
  const alternarDia = d => setDias(atual => (atual.includes(d) ? atual.filter(x => x !== d) : [...atual, d]))
  const adicionar = () => {
    if (!dias.length || !inicio || !fim) return
    const novos = dias.map(dia => ({
      id: Date.now() + Math.random(),
      dia,
      inicio,
      fim,
      local: local.trim(),
    }))
    setEscala(atual => [...(atual || []), ...novos])
    setDias([])
  }
  const enviar = t => {
    const data = proximoDiaSemana(t.dia)
    adicionarEvento({
      titulo: `Turno${t.local ? ' - ' + t.local : ''}`,
      data,
      hora: t.inicio,
      descricao: `Turno de trabalho das ${t.inicio} às ${t.fim}${t.local ? ' em ' + t.local : ''}.`,
      cor: '#ff9f0a',
    })
    setEnviados(e => ({
      ...e,
      [t.id]: data,
    }))
  }
  const enviarTodos = () => ordenada.forEach(enviar)
  const { saindo, remover: excluir } = useRemocao(id =>
    setEscala(atual => (atual || []).filter(t => t.id !== id)),
  )
  return (
    <div style={styles.col}>
      {lista.length > 0 && (
        <Card style={styles.resumo}>
          <div>
            <Rotulo
              style={{
                marginBottom: 4,
              }}
            >
              Carga semanal
            </Rotulo>
            <p key={totalHoras} className="valor-muda" style={styles.resumoNum}>
              {totalHoras.toLocaleString('pt-BR', {
                maximumFractionDigits: 1,
              })}
              <span style={styles.resumoUn}> h</span>
            </p>
          </div>
          <div
            style={{
              textAlign: 'right',
            }}
          >
            <Rotulo
              style={{
                marginBottom: 4,
              }}
            >
              Turnos
            </Rotulo>
            <p
              key={lista.length}
              className="valor-muda"
              style={{
                ...styles.resumoNum,
                transformOrigin: 'right center',
              }}
            >
              {lista.length}
            </p>
          </div>
        </Card>
      )}

      <Card>
        <Rotulo>Novo turno</Rotulo>
        <p style={styles.ajuda}>Escolha um ou mais dias da semana.</p>
        <div style={styles.dias}>
          {DIAS.map((d, i) => (
            <button
              key={d}
              onClick={() => alternarDia(i)}
              aria-pressed={dias.includes(i)}
              aria-label={DIAS_LONGOS[i]}
              className={`prof-press${dias.includes(i) ? ' check-pop' : ''}`}
              style={{
                ...styles.dia,
                height: h,
                background: dias.includes(i) ? 'var(--kleo)' : 'var(--control)',
                color: dias.includes(i) ? 'var(--white)' : 'var(--polar)',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <div
          style={{
            ...styles.linha,
            marginTop: 14,
          }}
        >
          <Campo
            rotulo="Início"
            type="time"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            altura={h}
          />
          <Campo rotulo="Fim" type="time" value={fim} onChange={e => setFim(e.target.value)} altura={h} />
        </div>
        <div
          style={{
            marginTop: 12,
          }}
        >
          <Campo
            rotulo="Local"
            placeholder="Ex: Restaurante Sabor da Terra"
            value={local}
            onChange={e => setLocal(e.target.value)}
            altura={h}
          />
        </div>
        <div style={styles.presets}>
          {[
            ['06:00', '14:00'],
            ['08:00', '16:00'],
            ['14:00', '22:00'],
            ['18:00', '23:59'],
          ].map(([a, b]) => (
            <Chip
              key={a}
              altura={h - 6}
              ativo={inicio === a && fim === b}
              onClick={() => {
                setInicio(a)
                setFim(b)
              }}
            >
              {a} - {b}
            </Chip>
          ))}
        </div>
        <Pill
          icon={Plus}
          altura={h + 4}
          cheio
          onClick={adicionar}
          disabled={!dias.length}
          style={{
            marginTop: 14,
          }}
        >
          Adicionar{' '}
          {dias.length > 1 ? (
            <span
              key={dias.length}
              className="valor-muda"
              style={{
                display: 'inline-block',
              }}
            >
              {dias.length} turnos
            </span>
          ) : (
            'turno'
          )}
        </Pill>
      </Card>

      {ordenada.length === 0 ? (
        <Card>
          <Vazio
            icon={CalendarClock}
            titulo="Sua escala está vazia"
            texto="Cadastre seus turnos e envie para a agenda com um toque."
          />
        </Card>
      ) : (
        <>
          <div style={styles.cabLista}>
            <Rotulo
              style={{
                marginBottom: 0,
              }}
            >
              Minha semana
            </Rotulo>
            <Pill
              icon={CalendarPlus}
              variante="suave"
              altura={h - 8}
              onClick={enviarTodos}
              style={{
                padding: '0 14px',
                fontSize: 14,
              }}
            >
              Enviar todos
            </Pill>
          </div>
          <div className="stagger" style={styles.col}>
            {ordenada.map(t => (
              <Card key={t.id} className={saindo(t.id) ? 'item-out' : undefined} style={styles.turno}>
                <div style={styles.turnoDia}>
                  <span style={styles.turnoDiaTxt}>{DIAS[t.dia]}</span>
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <p style={styles.turnoHora}>
                    <Clock size={15} color="var(--steel)" /> {t.inicio} às {t.fim}
                  </p>
                  <p style={styles.turnoLocal}>
                    <MapPin size={14} /> {t.local || 'Local não informado'}
                  </p>
                  {enviados[t.id] && (
                    <p
                      className="anim-pop"
                      style={{
                        ...styles.enviado,
                        transformOrigin: 'left center',
                      }}
                    >
                      <Check size={13} /> Na agenda em {formatarData(enviados[t.id])}
                    </p>
                  )}
                </div>
                <Redondo
                  icon={enviados[t.id] ? Check : CalendarPlus}
                  label="Enviar turno para a agenda"
                  onClick={() => enviar(t)}
                  tamanho={h}
                  fundo="var(--kleo-soft)"
                  cor="var(--kleo)"
                />
                <Redondo
                  icon={Trash2}
                  label="Excluir turno"
                  onClick={() => excluir(t.id)}
                  tamanho={h}
                  cor="var(--steel)"
                  fundo="transparent"
                />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
const styles = {
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  resumo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resumoNum: {
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'var(--green)',
    lineHeight: 1,
  },
  resumoUn: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--silver)',
  },
  ajuda: {
    fontSize: 14,
    color: 'var(--silver)',
    marginTop: -4,
    marginBottom: 12,
  },
  dias: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
  },
  dia: {
    borderRadius: 'var(--radius-chip)',
    fontSize: 13,
    fontWeight: 600,
  },
  linha: {
    display: 'flex',
    gap: 10,
  },
  presets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  cabLista: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 4px 0',
  },
  turno: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  turnoDia: {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: 'rgba(255,159,10,0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  turnoDiaTxt: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--orange)',
  },
  turnoHora: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 17,
    fontWeight: 600,
  },
  turnoLocal: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 14,
    color: 'var(--silver)',
    marginTop: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  enviado: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--green)',
    marginTop: 4,
  },
}
