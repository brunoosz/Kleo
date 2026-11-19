import { useState } from 'react'
import { Sprout, CalendarPlus, Check, Ruler, Hourglass, Lightbulb, Trash2, Wheat } from 'lucide-react'
import useStorage from '../../hooks/useStorage'
import useRemocao from './useRemocao'
import { adicionarEvento, hojeISO } from '../../lib/storage'
import { CULTURAS, MESES_CURTOS, getCultura } from '../../data/plantio'
import { Card, Rotulo, Pill, Chip, Campo, Redondo } from './ui'
import { alvo, somarDias, diferencaDias, formatarData } from './util'
export default function Plantio({ necessidade }) {
  const [hoje] = useState(() => hojeISO())
  const mesAtual = Number(hoje.slice(5, 7))
  const [filtro, setFiltro] = useState('todas')
  const [selecionada, setSelecionada] = useState(null)
  const [dataPlantio, setDataPlantio] = useState(hoje)
  const [enviado, setEnviado] = useState(false)
  const [plantios, setPlantios] = useStorage('kleo_plantios', [])
  const h = alvo(necessidade)
  const lista = Array.isArray(plantios) ? plantios : []
  const culturas = filtro === 'agora' ? CULTURAS.filter(c => c.meses.includes(mesAtual)) : CULTURAS
  const cultura = selecionada ? getCultura(selecionada) : null
  const colheita = cultura && dataPlantio ? somarDias(dataPlantio, cultura.ciclo) : null
  const { saindo, remover: removerLavoura } = useRemocao(id =>
    setPlantios(a => (a || []).filter(x => x.id !== id)),
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
      cor: '#30d158',
    })
    adicionarEvento({
      titulo: `Colheita de ${cultura.nome}`,
      data: colheita,
      hora: '07:00',
      descricao: `Colheita prevista (ciclo de cerca de ${cultura.ciclo} dias).`,
      cor: '#ff9f0a',
    })
    setPlantios(atual => [
      {
        id: Date.now(),
        cultura: cultura.id,
        plantio: dataPlantio,
        colheita,
      },
      ...(atual || []),
    ])
    setEnviado(true)
  }
  return (
    <div style={styles.col}>
      <div style={styles.filtros}>
        <Chip altura={h - 4} ativo={filtro === 'todas'} onClick={() => setFiltro('todas')}>
          Todas as culturas
        </Chip>
        <Chip altura={h - 4} icon={Sprout} ativo={filtro === 'agora'} onClick={() => setFiltro('agora')}>
          Plantar agora ({CULTURAS.filter(c => c.meses.includes(mesAtual)).length})
        </Chip>
      </div>

      <Card
        style={{
          padding: '18px 14px',
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

        <div
          key={filtro}
          className="stagger"
          style={styles.grade}
          role="table"
          aria-label="Calendário anual de plantio"
        >
          <div style={styles.linhaCal} role="row">
            <span style={styles.nomeCol} />
            {MESES_CURTOS.map((m, i) => (
              <span
                key={m}
                role="columnheader"
                style={{
                  ...styles.mes,
                  color: i + 1 === mesAtual ? 'var(--kleo)' : 'var(--steel)',
                  fontWeight: i + 1 === mesAtual ? 700 : 500,
                }}
              >
                {m[0]}
              </span>
            ))}
          </div>
          {culturas.map((c, linha) => {
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
                  minHeight: Math.max(36, h - 8),
                  background: ativa ? 'var(--kleo-soft)' : 'transparent',
                  transition: 'background .3s ease',
                }}
              >
                <span
                  style={{
                    ...styles.nomeCol,
                    ...styles.nomeCultura,
                    color: ativa ? 'var(--kleo)' : 'var(--polar)',
                    transition: 'color .3s ease',
                  }}
                >
                  {c.nome}
                </span>
                {MESES_CURTOS.map((m, i) => {
                  const planta = c.meses.includes(i + 1)
                  const atual = i + 1 === mesAtual
                  return (
                    <span
                      key={m}
                      style={{
                        ...styles.celula,
                        background: atual ? 'rgba(94,92,230,0.12)' : 'transparent',
                      }}
                    >
                      <span
                        className={planta ? 'prof-cresce' : undefined}
                        style={{
                          ...styles.barra,
                          animationDelay: planta
                            ? `${0.12 + Math.min(linha, 8) * 0.04 + i * 0.025}s`
                            : undefined,
                          background: planta ? c.cor : 'var(--control)',
                          opacity: planta ? 1 : 0.5,
                          height: planta ? 10 : 4,
                          borderTopLeftRadius: planta && !c.meses.includes(i) ? 6 : 0,
                          borderBottomLeftRadius: planta && !c.meses.includes(i) ? 6 : 0,
                          borderTopRightRadius: planta && !c.meses.includes(i + 2) ? 6 : 0,
                          borderBottomRightRadius: planta && !c.meses.includes(i + 2) ? 6 : 0,
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
          Faixas coloridas indicam meses de plantio. Toque em uma cultura para calcular a colheita.
        </p>
      </Card>

      {cultura && (
        <Card
          key={cultura.id}
          style={{
            borderColor: cultura.cor + '66',
          }}
        >
          <div style={styles.detTopo}>
            <div
              className="anim-pop"
              style={{
                ...styles.detIcone,
                background: cultura.cor + '22',
                animationDelay: '0.08s',
              }}
            >
              <Sprout size={24} color={cultura.cor} />
            </div>
            <div>
              <h3 style={styles.detNome}>{cultura.nome}</h3>
              <p style={styles.detSub}>
                {cultura.meses.includes(mesAtual)
                  ? 'Boa época para plantar agora'
                  : 'Fora da época ideal de plantio'}
              </p>
            </div>
          </div>
          <div style={styles.infos} className="stagger">
            <Info icon={Hourglass} rotulo="Ciclo" texto={`Cerca de ${cultura.ciclo} dias`} />
            <Info icon={Ruler} rotulo="Espaçamento" texto={cultura.espacamento} />
            <Info icon={Lightbulb} rotulo="Dica" texto={cultura.dica} />
          </div>
          <div style={styles.calc}>
            <Campo
              rotulo="Data de plantio"
              type="date"
              value={dataPlantio}
              onChange={e => {
                setDataPlantio(e.target.value)
                setEnviado(false)
              }}
              altura={h}
            />
            {colheita && (
              <div style={styles.colheita} className="anim-scale">
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
          </div>
          <Pill
            icon={enviado ? Check : CalendarPlus}
            className={enviado ? 'check-pop' : ''}
            altura={h + 4}
            cheio
            onClick={adicionarAgenda}
            disabled={!colheita || enviado}
            style={{
              marginTop: 14,
            }}
          >
            {enviado ? 'Plantio e colheita na agenda' : 'Adicionar à agenda'}
          </Pill>
        </Card>
      )}

      {lista.length > 0 && (
        <Card>
          <Rotulo>Minhas lavouras</Rotulo>
          {lista.map(p => {
            const c = getCultura(p.cultura)
            if (!c) return null
            const total = Math.max(1, diferencaDias(p.plantio, p.colheita))
            const passados = diferencaDias(p.plantio, hoje)
            const prog = Math.min(1, Math.max(0, passados / total))
            const faltam = diferencaDias(hoje, p.colheita)
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
                      <Wheat size={15} color={c.cor} /> {c.nome}
                    </span>
                    <span
                      style={{
                        ...styles.lavFalta,
                        color: faltam <= 0 ? 'var(--green)' : 'var(--silver)',
                      }}
                    >
                      {passados < 0
                        ? `Plantio em ${-passados} dias`
                        : faltam <= 0
                          ? 'Pronta para colher'
                          : `Faltam ${faltam} dias`}
                    </span>
                  </div>
                  <div style={styles.progTrilho}>
                    <div
                      className="prof-cresce"
                      style={{
                        ...styles.progBarra,
                        width: `${prog * 100}%`,
                        background: c.cor,
                        animationDelay: '0.15s',
                      }}
                    />
                  </div>
                  <p style={styles.lavDatas}>
                    {formatarData(p.plantio)} até {formatarData(p.colheita)}
                  </p>
                </div>
                <Redondo
                  icon={Trash2}
                  label={`Remover ${c.nome}`}
                  onClick={() => removerLavoura(p.id)}
                  tamanho={h}
                  cor="var(--steel)"
                  fundo="transparent"
                />
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
function Info({ icon: Icon, rotulo, texto }) {
  return (
    <div style={styles.info}>
      <Icon
        size={17}
        color="var(--steel)"
        style={{
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div>
        <p style={styles.infoRot}>{rotulo}</p>
        <p style={styles.infoTxt}>{texto}</p>
      </div>
    </div>
  )
}
const styles = {
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  cabCal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '0 6px 10px',
  },
  regiao: {
    fontSize: 12,
    color: 'var(--steel)',
  },
  grade: {
    display: 'flex',
    flexDirection: 'column',
  },
  linhaCal: {
    display: 'grid',
    gridTemplateColumns: '92px repeat(12, 1fr)',
    alignItems: 'center',
    width: '100%',
  },
  linhaBotao: {
    borderRadius: 12,
    textAlign: 'left',
  },
  nomeCol: {
    paddingLeft: 6,
  },
  nomeCultura: {
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mes: {
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 6,
  },
  celula: {
    height: '100%',
    minHeight: 30,
    display: 'flex',
    alignItems: 'center',
  },
  barra: {
    width: '100%',
    display: 'block',
  },
  legenda: {
    fontSize: 12,
    color: 'var(--steel)',
    marginTop: 12,
    padding: '0 6px',
    lineHeight: 1.4,
  },
  detTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  detIcone: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detNome: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.025em',
  },
  detSub: {
    fontSize: 14,
    color: 'var(--silver)',
    marginTop: 2,
  },
  infos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 18,
  },
  info: {
    display: 'flex',
    gap: 10,
  },
  infoRot: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--steel)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoTxt: {
    fontSize: 15,
    lineHeight: 1.4,
    marginTop: 2,
  },
  calc: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 18,
  },
  colheita: {
    background: 'rgba(255,159,10,0.12)',
    borderRadius: 18,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  colheitaRot: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--orange)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  colheitaData: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  lavoura: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderTop: '1px solid var(--divider)',
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
    fontWeight: 600,
  },
  lavFalta: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  progTrilho: {
    height: 6,
    borderRadius: 6,
    background: 'var(--control)',
    marginTop: 8,
    overflow: 'hidden',
  },
  progBarra: {
    height: '100%',
    borderRadius: 6,
    transition: 'width .6s var(--ease-out)',
  },
  lavDatas: {
    fontSize: 12,
    color: 'var(--steel)',
    marginTop: 6,
  },
}
