import { useState } from 'react'
import { Plus, CalendarPlus, Trash2, MapPin, Clock, Check, CalendarClock } from 'lucide-react'
import { Card, Botao, BotaoIcone, Chip, Vazio } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { adicionarEvento } from '../lib/storage'
import { proximoDiaSemana } from '../components/profissao/util'
import { useDados, useTam, novoId, singular, dataCurta, fmt } from './comum'
import { Coluna, Entrada, Rotulo } from './pecas'
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
const FAIXAS = {
  Plantões: [
    ['07:00', '19:00'],
    ['19:00', '07:00'],
    ['07:00', '13:00'],
    ['13:00', '19:00'],
  ],
  Aulas: [
    ['07:30', '12:00'],
    ['13:00', '17:30'],
    ['19:00', '22:30'],
  ],
  padrao: [
    ['06:00', '14:00'],
    ['08:00', '17:00'],
    ['14:00', '22:00'],
    ['22:00', '06:00'],
  ],
}
export default function Escala({ config = {}, chave }) {
  const { simples, h } = useTam()
  const rotulo = config.rotulo || 'Turnos'
  const um = singular(rotulo)
  const faixas = FAIXAS[rotulo] || FAIXAS.padrao
  const [escala, setEscala] = useDados(chave, [])
  const [dias, setDias] = useState([])
  const [inicio, setInicio] = useState(faixas[0][0])
  const [fim, setFim] = useState(faixas[0][1])
  const [local, setLocal] = useState('')
  const [enviados, setEnviados] = useState({})
  const lista = Array.isArray(escala) ? escala : []
  const ordenada = [...lista].sort(
    (a, b) => ORDEM.indexOf(a.dia) - ORDEM.indexOf(b.dia) || a.inicio.localeCompare(b.inicio),
  )
  const totalHoras = lista.reduce((s, t) => s + horas(t.inicio, t.fim), 0)
  const hojeDia = new Date().getDay()
  const alternarDia = d => setDias(a => (a.includes(d) ? a.filter(x => x !== d) : [...a, d]))
  const adicionar = () => {
    if (!dias.length || !inicio || !fim) return
    setEscala(a => [
      ...(Array.isArray(a) ? a : []),
      ...dias.map(dia => ({
        id: novoId(),
        dia,
        inicio,
        fim,
        local: local.trim(),
      })),
    ])
    setDias([])
  }
  const enviar = t => {
    const data = proximoDiaSemana(t.dia)
    adicionarEvento({
      titulo: `${um}${t.local ? ' - ' + t.local : ''}`,
      data,
      hora: t.inicio,
      descricao: `${um} das ${t.inicio} às ${t.fim}${t.local ? ' em ' + t.local : ''}.`,
    })
    setEnviados(e => ({
      ...e,
      [t.id]: data,
    }))
  }
  const { saindo, remover } = useRemocao(id =>
    setEscala(a => (Array.isArray(a) ? a : []).filter(t => t.id !== id)),
  )
  return (
    <Coluna>
      {lista.length > 0 && (
        <Card cor="lavanda">
          <div style={styles.resumo}>
            <div>
              <p style={styles.resumoRot}>Horas na semana</p>
              <p key={totalHoras} className="valor-muda" style={styles.resumoNum}>
                {fmt(totalHoras, 1)} h
              </p>
            </div>
            <div
              style={{
                textAlign: 'right',
              }}
            >
              <p style={styles.resumoRot}>{rotulo}</p>
              <p style={styles.resumoNum}>{lista.length}</p>
            </div>
          </div>
        </Card>
      )}

      {ordenada.length === 0 ? (
        <Card>
          <Vazio
            icone={CalendarClock}
            titulo={`Sem ${rotulo.toLowerCase()} cadastrados`}
            texto="Monte sua semana abaixo e mande para a agenda com um toque."
          />
        </Card>
      ) : (
        <Coluna gap={10} className="stagger">
          {ordenada.map(t => {
            const ehHoje = t.dia === hojeDia
            return (
              <div key={t.id} className={saindo(t.id) ? 'item-out' : undefined}>
                <Card cor={ehHoje ? 'lima' : 'branco'}>
                  <div style={styles.turno}>
                    <span
                      style={{
                        ...styles.dia,
                        background: ehHoje ? 'var(--surface)' : 'var(--surface-2)',
                      }}
                    >
                      {DIAS[t.dia]}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <p style={styles.hora}>
                        <Clock size={16} /> {t.inicio} às {t.fim}
                      </p>
                      {(t.local || !simples) && (
                        <p style={styles.local}>
                          <MapPin size={14} /> {t.local || 'Local não informado'}
                        </p>
                      )}
                      {enviados[t.id] && (
                        <p className="anim-pop" style={styles.enviado}>
                          <Check size={14} /> Na agenda em {dataCurta(enviados[t.id])}
                        </p>
                      )}
                    </div>
                    <BotaoIcone
                      icone={enviados[t.id] ? Check : CalendarPlus}
                      label={`Mandar ${um.toLowerCase()} para a agenda`}
                      variante="lavanda"
                      onClick={() => enviar(t)}
                    />
                    {!simples && (
                      <BotaoIcone
                        icone={Trash2}
                        label={`Apagar ${um.toLowerCase()}`}
                        onClick={() => remover(t.id)}
                      />
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
          {!simples && ordenada.length > 1 && (
            <Botao variante="fantasma" icone={CalendarPlus} onClick={() => ordenada.forEach(enviar)}>
              Mandar todos para a agenda
            </Botao>
          )}
        </Coluna>
      )}

      <Card>
        <Rotulo>Novo {um.toLowerCase()}</Rotulo>
        <p style={styles.ajuda}>Escolha um ou mais dias.</p>
        <div style={styles.dias}>
          {DIAS.map((d, i) => (
            <button
              key={d}
              onClick={() => alternarDia(i)}
              aria-pressed={dias.includes(i)}
              aria-label={DIAS_LONGOS[i]}
              className={dias.includes(i) ? 'check-pop' : undefined}
              style={{
                ...styles.diaBtn,
                height: h,
                background: dias.includes(i) ? '#000' : 'var(--surface-2)',
                color: dias.includes(i) ? '#fff' : '#000',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <div style={styles.faixas}>
          {faixas.map(([a, b]) => (
            <Chip
              key={a + b}
              cor="ceu"
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
        {!simples && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 12,
              }}
            >
              <Entrada
                rotulo="Início"
                type="time"
                value={inicio}
                onChange={e => setInicio(e.target.value)}
                altura={h}
              />
              <Entrada
                rotulo="Fim"
                type="time"
                value={fim}
                onChange={e => setFim(e.target.value)}
                altura={h}
              />
            </div>
            <div
              style={{
                marginTop: 12,
              }}
            >
              <Entrada
                rotulo="Local"
                placeholder="Ex: Hospital Central, Escola Municipal"
                value={local}
                onChange={e => setLocal(e.target.value)}
                altura={h}
              />
            </div>
          </>
        )}
        <div
          style={{
            marginTop: 14,
          }}
        >
          <Botao
            variante="primario"
            icone={Plus}
            grande={simples}
            cheio
            disabled={!dias.length}
            onClick={adicionar}
          >
            {dias.length > 1
              ? `Adicionar ${dias.length} ${rotulo.toLowerCase()}`
              : `Adicionar ${um.toLowerCase()}`}
          </Botao>
        </div>
      </Card>
    </Coluna>
  )
}
const styles = {
  resumo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resumoRot: {
    fontSize: 14,
    fontWeight: 600,
    color: '#000',
  },
  resumoNum: {
    fontSize: 38,
    fontWeight: 800,
    lineHeight: 1,
    color: '#000',
    marginTop: 4,
  },
  turno: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dia: {
    width: 52,
    height: 52,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 800,
    flexShrink: 0,
    color: '#000',
  },
  hora: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 17,
    fontWeight: 700,
    color: '#000',
  },
  local: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  enviado: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--sucesso)',
    marginTop: 4,
    transformOrigin: 'left center',
  },
  ajuda: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: -4,
    marginBottom: 12,
  },
  dias: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
  },
  diaBtn: {
    borderRadius: 30,
    fontSize: 13,
    fontWeight: 700,
  },
  faixas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
}
