import { useState } from 'react'
import { Sprout, CalendarPlus, Check, Ruler, Hourglass, Lightbulb, Trash2, Wheat } from 'lucide-react'
import { Card, Botao, BotaoIcone, Chip } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { adicionarEvento } from '../lib/storage'
import { CULTURAS, MESES_CURTOS, getCultura } from '../data/plantio'
import { somarDias, diferencaDias, formatarData } from '../components/profissao/util'
import { useDados, useTam, hoje, novoId } from './comum'
import { Coluna, Rotulo, Entrada, Barra } from './pecas'
export default function Plantio({ chave }) {
  const { simples, h } = useTam()
  const [diaHoje] = useState(() => hoje())
  const mesAtual = Number(diaHoje.slice(5, 7))
  const [filtro, setFiltro] = useState(simples ? 'agora' : 'todas')
  const [selecionada, setSelecionada] = useState(null)
  const [dataPlantio, setDataPlantio] = useState(diaHoje)
  const [enviado, setEnviado] = useState(false)
  const [plantios, setPlantios] = useDados(chave, [])
  const lista = Array.isArray(plantios) ? plantios : []
  const agora = CULTURAS.filter(c => c.meses.includes(mesAtual))
  const culturas = filtro === 'agora' ? agora : CULTURAS
  const cultura = selecionada ? getCultura(selecionada) : null
  const colheita = cultura && dataPlantio ? somarDias(dataPlantio, cultura.ciclo) : null
  const { saindo, remover } = useRemocao(id =>
    setPlantios(a => (Array.isArray(a) ? a : []).filter(x => x.id !== id)),
  )
  const escolher = id => {
    setSelecionada(id === selecionada ? null : id)
    setEnviado(false)
  }
  const adicionarAgenda = () => {
    adicionarEvento({
      titulo: `Plantio de ${cultura.nome}`,
      data: dataPlantio,
      hora: '07:00',
      descricao: `Espaçamento: ${cultura.espacamento}. ${cultura.dica}`,
    })
    adicionarEvento({
      titulo: `Colheita de ${cultura.nome}`,
      data: colheita,
      hora: '07:00',
      descricao: `Colheita prevista (ciclo de cerca de ${cultura.ciclo} dias).`,
    })
    setPlantios(a => [
      {
        id: novoId(),
        cultura: cultura.id,
        plantio: dataPlantio,
        colheita,
      },
      ...(Array.isArray(a) ? a : []),
    ])
    setEnviado(true)
  }
  return (
    <Coluna>
      <div style={styles.filtros}>
        <Chip cor="lima" icone={Sprout} ativo={filtro === 'agora'} onClick={() => setFiltro('agora')}>
          Plantar agora ({agora.length})
        </Chip>
        <Chip cor="lima" ativo={filtro === 'todas'} onClick={() => setFiltro('todas')}>
          Todas
        </Chip>
      </div>

      {simples ? (
        <Coluna gap={10}>
          {culturas.map(c => (
            <Card key={c.id} cor={c.id === selecionada ? 'lima' : 'branco'} onClick={() => escolher(c.id)}>
              <div style={styles.simplesItem}>
                <Sprout size={24} />
                <span
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                  }}
                >
                  {c.nome}
                </span>
              </div>
            </Card>
          ))}
        </Coluna>
      ) : (
        <Card
          style={{
            padding: '20px 14px',
          }}
        >
          <div style={styles.cabCal}>
            <Rotulo
              style={{
                marginBottom: 0,
              }}
            >
              Calendário de plantio
            </Rotulo>
            <span style={styles.regiao}>Sudeste e Centro-Oeste</span>
          </div>
          <div key={filtro} className="stagger" role="table" aria-label="Calendário anual de plantio">
            <div style={styles.linhaCal} role="row">
              <span />
              {MESES_CURTOS.map((m, i) => (
                <span
                  key={m}
                  role="columnheader"
                  style={{
                    ...styles.mes,
                    color: i + 1 === mesAtual ? '#000' : 'var(--text-3)',
                    fontWeight: i + 1 === mesAtual ? 800 : 500,
                  }}
                >
                  {m[0]}
                </span>
              ))}
            </div>
            {culturas.map(c => {
              const ativa = c.id === selecionada
              return (
                <button
                  key={c.id}
                  role="row"
                  onClick={() => escolher(c.id)}
                  aria-pressed={ativa}
                  aria-label={`${c.nome}: plantio em ${[...c.meses]
                    .sort((a, b) => a - b)
                    .map(m => MESES_CURTOS[m - 1])
                    .join(', ')}`}
                  style={{
                    ...styles.linhaCal,
                    ...styles.linhaBotao,
                    background: ativa ? 'var(--lavanda)' : 'transparent',
                  }}
                >
                  <span style={styles.nomeCultura}>{c.nome}</span>
                  {MESES_CURTOS.map((m, i) => {
                    const planta = c.meses.includes(i + 1)
                    return (
                      <span
                        key={m}
                        style={{
                          ...styles.celula,
                          background: i + 1 === mesAtual ? 'rgba(216,209,255,0.45)' : 'transparent',
                        }}
                      >
                        <span
                          className={planta ? 'fer-cresce' : undefined}
                          style={{
                            ...styles.barra,
                            animationDelay: planta ? `${0.1 + i * 0.025}s` : undefined,
                            background: planta ? 'var(--lima)' : 'var(--surface-2)',
                            height: planta ? 12 : 4,
                            borderRadius: planta ? 6 : 2,
                            outline: planta ? '1px solid rgba(0,0,0,0.08)' : 'none',
                          }}
                        />
                      </span>
                    )
                  })}
                </button>
              )
            })}
          </div>
          <p style={styles.legenda}>
            Faixas verdes indicam meses de plantio. Toque numa cultura para calcular a colheita.
          </p>
        </Card>
      )}

      {cultura && (
        <Card key={cultura.id} cor="lima" tamanho="g" className="anim-scale">
          <h3 style={styles.detNome}>{cultura.nome}</h3>
          <p style={styles.detSub}>
            {cultura.meses.includes(mesAtual)
              ? 'Boa época para plantar agora'
              : 'Fora da época ideal de plantio'}
          </p>
          <Coluna
            gap={12}
            style={{
              marginTop: 16,
            }}
          >
            <Info icon={Hourglass} rotulo="Ciclo" texto={`Cerca de ${cultura.ciclo} dias`} />
            {!simples && <Info icon={Ruler} rotulo="Espaçamento" texto={cultura.espacamento} />}
            <Info icon={Lightbulb} rotulo="Dica" texto={cultura.dica} />
          </Coluna>
          <div
            style={{
              marginTop: 18,
            }}
          >
            <Entrada
              rotulo="Data de plantio"
              type="date"
              value={dataPlantio}
              onChange={e => {
                setDataPlantio(e.target.value)
                setEnviado(false)
              }}
              altura={h}
            />
          </div>
          {colheita && (
            <div style={styles.colheita}>
              <span style={styles.colheitaRot}>Colheita prevista</span>
              <span key={colheita} className="anim-right" style={styles.colheitaData}>
                {formatarData(colheita, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
          <div
            style={{
              marginTop: 14,
            }}
          >
            <Botao
              variante="primario"
              icone={enviado ? Check : CalendarPlus}
              grande
              cheio
              disabled={!colheita || enviado}
              onClick={adicionarAgenda}
            >
              {enviado ? 'Plantio e colheita na agenda' : 'Pôr na agenda'}
            </Botao>
          </div>
        </Card>
      )}

      {lista.length > 0 && (
        <Card>
          <Rotulo>Minhas lavouras</Rotulo>
          {lista.map(p => {
            const c = getCultura(p.cultura)
            if (!c) return null
            const total = Math.max(1, diferencaDias(p.plantio, p.colheita))
            const passados = diferencaDias(p.plantio, diaHoje)
            const faltam = diferencaDias(diaHoje, p.colheita)
            return (
              <div key={p.id} className={saindo(p.id) ? 'item-out' : 'anim-up'} style={styles.lavoura}>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div style={styles.lavTopo}>
                    <span style={styles.lavNome}>
                      <Wheat size={16} /> {c.nome}
                    </span>
                    <span
                      style={{
                        ...styles.lavFalta,
                        color: faltam <= 0 ? 'var(--sucesso)' : 'var(--text-2)',
                      }}
                    >
                      {passados < 0
                        ? `Plantio em ${-passados} dias`
                        : faltam <= 0
                          ? 'Pronta para colher'
                          : `Faltam ${faltam} dias`}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                    }}
                  >
                    <Barra progresso={passados / total} cor="var(--lima)" />
                  </div>
                  <p style={styles.lavDatas}>
                    {formatarData(p.plantio)} até {formatarData(p.colheita)}
                  </p>
                </div>
                <BotaoIcone icone={Trash2} label={`Remover ${c.nome}`} onClick={() => remover(p.id)} />
              </div>
            )
          })}
        </Card>
      )}
    </Coluna>
  )
}
function Info({ icon: Icon, rotulo, texto }) {
  return (
    <div style={styles.info}>
      <span style={styles.infoIcone}>
        <Icon size={17} color="#000" />
      </span>
      <div>
        <p style={styles.infoRot}>{rotulo}</p>
        <p style={styles.infoTxt}>{texto}</p>
      </div>
    </div>
  )
}
const styles = {
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  simplesItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#000',
  },
  cabCal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '0 6px 10px',
    gap: 8,
  },
  regiao: {
    fontSize: 12,
    color: 'var(--text-3)',
  },
  linhaCal: {
    display: 'grid',
    gridTemplateColumns: '86px repeat(12, 1fr)',
    alignItems: 'center',
    width: '100%',
  },
  linhaBotao: {
    borderRadius: 15,
    textAlign: 'left',
    minHeight: 40,
    transition: 'background .3s ease',
  },
  nomeCultura: {
    paddingLeft: 8,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#000',
  },
  mes: {
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 6,
  },
  celula: {
    height: '100%',
    minHeight: 32,
    display: 'flex',
    alignItems: 'center',
    padding: '0 1px',
  },
  barra: {
    width: '100%',
    display: 'block',
  },
  legenda: {
    fontSize: 12,
    color: 'var(--text-3)',
    marginTop: 12,
    padding: '0 6px',
    lineHeight: 1.4,
  },
  detNome: {
    fontSize: 34,
    fontWeight: 800,
    color: '#000',
  },
  detSub: {
    fontSize: 15,
    color: '#000',
    marginTop: 4,
  },
  info: {
    display: 'flex',
    gap: 10,
  },
  infoIcone: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoRot: {
    fontSize: 12,
    fontWeight: 700,
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoTxt: {
    fontSize: 15,
    lineHeight: 1.4,
    marginTop: 2,
    color: '#000',
  },
  colheita: {
    background: 'var(--surface)',
    borderRadius: 25,
    padding: '12px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 12,
  },
  colheitaRot: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  colheitaData: {
    fontSize: 20,
    fontWeight: 800,
  },
  lavoura: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderTop: '1px solid var(--surface-2)',
  },
  lavTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  lavNome: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 16,
    fontWeight: 700,
  },
  lavFalta: {
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  lavDatas: {
    fontSize: 12,
    color: 'var(--text-3)',
    marginTop: 6,
  },
}
