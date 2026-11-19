import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { MESES, MESES_CURTOS, INICIAIS_SEMANA, capitalizar, celulasDoMes } from './AgendaUtil'
export default function AgendaCalendario({
  ano,
  mes,
  onMudarMes,
  selecionado,
  onSelecionar,
  hoje,
  coresPorDia,
  grande,
  simples,
}) {
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [anoSeletor, setAnoSeletor] = useState(ano)
  const toque = useRef(null)
  const ordinal = ano * 12 + mes
  const [mesAnterior, setMesAnterior] = useState(ordinal)
  const [direcao, setDirecao] = useState(0)
  if (mesAnterior !== ordinal) {
    setMesAnterior(ordinal)
    setDirecao(ordinal > mesAnterior ? 1 : -1)
  }
  const classeTroca =
    direcao === 1 ? 'anim-right' : direcao === -1 ? 'anim-left' : direcao === 2 ? 'anim-scale' : undefined
  const celulas = celulasDoMes(ano, mes)
  const alturaCelula = grande ? 56 : 46
  const lado = grande ? 52 : 44
  const aberto = seletorAberto && !simples
  const deslocar = delta => {
    const d = new Date(ano, mes + delta, 1)
    onMudarMes(d.getFullYear(), d.getMonth())
  }
  const abrirSeletor = () => {
    setAnoSeletor(ano)
    setDirecao(2)
    setSeletorAberto(v => !v)
  }
  const inicioToque = e => {
    const t = e.touches[0]
    toque.current = {
      x: t.clientX,
      y: t.clientY,
    }
  }
  const fimToque = e => {
    if (!toque.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - toque.current.x
    const dy = t.clientY - toque.current.y
    toque.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) deslocar(dx < 0 ? 1 : -1)
  }
  const titulo = (
    <>
      <span
        key={`m${ordinal}`}
        className={classeTroca}
        style={{
          ...styles.mesNome,
          fontSize: grande ? 26 : 24,
        }}
      >
        {capitalizar(MESES[mes])}
      </span>
      <span
        key={`a${ano}`}
        className={direcao === 2 ? undefined : classeTroca}
        style={{
          ...styles.anoNome,
          fontSize: grande ? 26 : 24,
        }}
      >
        {ano}
      </span>
    </>
  )
  return (
    <section style={styles.card} className="kleo-card" aria-label="Calendário">
      <div style={styles.topo}>
        {simples ? (
          <div style={styles.tituloBtn}>{titulo}</div>
        ) : (
          <button
            type="button"
            onClick={abrirSeletor}
            style={styles.tituloBtn}
            aria-expanded={aberto}
            aria-label="Escolher mês e ano"
          >
            {titulo}
            <ChevronDown
              size={20}
              color="#000"
              style={{
                transform: aberto ? 'rotate(180deg)' : 'none',
                transition: 'transform .2s',
                alignSelf: 'center',
              }}
            />
          </button>
        )}
        <div style={styles.navBtns}>
          <button
            type="button"
            onClick={() => deslocar(-1)}
            className="tap"
            style={{
              ...styles.seta,
              width: lado,
              height: lado,
            }}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={22} color="#000" />
          </button>
          <button
            type="button"
            onClick={() => deslocar(1)}
            className="tap"
            style={{
              ...styles.seta,
              width: lado,
              height: lado,
            }}
            aria-label="Próximo mês"
          >
            <ChevronRight size={22} color="#000" />
          </button>
        </div>
      </div>

      {aberto ? (
        <div className="anim-scale" style={styles.seletor}>
          <div style={styles.seletorAno}>
            <button
              type="button"
              onClick={() => setAnoSeletor(a => a - 1)}
              style={styles.seta}
              aria-label="Ano anterior"
            >
              <ChevronLeft size={20} color="#000" />
            </button>
            <span key={anoSeletor} className="anim-fade" style={styles.seletorAnoTxt}>
              {anoSeletor}
            </span>
            <button
              type="button"
              onClick={() => setAnoSeletor(a => a + 1)}
              style={styles.seta}
              aria-label="Próximo ano"
            >
              <ChevronRight size={20} color="#000" />
            </button>
          </div>
          <div key={anoSeletor} className="stagger" style={styles.gradeMeses}>
            {MESES_CURTOS.map((m, i) => {
              const ativo = i === mes && anoSeletor === ano
              const prefixo = `${anoSeletor}-${String(i + 1).padStart(2, '0')}`
              const qtd = Object.keys(coresPorDia || {})
                .filter(k => k.startsWith(prefixo))
                .reduce((t, k) => t + coresPorDia[k].length, 0)
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onMudarMes(anoSeletor, i)
                    setSeletorAberto(false)
                  }}
                  style={{
                    ...styles.chipMes,
                    minHeight: grande ? 56 : 48,
                    background: ativo ? '#000' : qtd ? 'var(--lavanda)' : 'var(--surface-2)',
                    color: ativo ? '#fff' : '#000',
                  }}
                  aria-label={`${capitalizar(MESES[i])} de ${anoSeletor}${qtd ? `, ${qtd} evento(s)` : ''}`}
                >
                  <span style={styles.chipMesConteudo}>
                    {m}
                    {qtd > 0 && (
                      <span
                        style={{
                          ...styles.chipMesQtd,
                          color: ativo ? 'var(--lima)' : 'var(--text-2)',
                        }}
                      >
                        {qtd}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div key={ordinal} className={classeTroca} onTouchStart={inicioToque} onTouchEnd={fimToque}>
          <div style={styles.semana}>
            {INICIAIS_SEMANA.map((d, i) => (
              <span
                key={i}
                style={{
                  ...styles.inicial,
                  fontSize: grande ? 15 : 13,
                }}
              >
                {d}
              </span>
            ))}
          </div>
          <div style={styles.grade} role="grid">
            {celulas.map(c => {
              const ehHoje = c.iso === hoje
              const ehSel = c.iso === selecionado
              const todas = coresPorDia[c.iso] || []
              const cores = todas.slice(0, 3)
              const diametro = grande ? 46 : 38
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => onSelecionar(c.iso)}
                  style={{
                    ...styles.celula,
                    height: alturaCelula,
                    opacity: c.doMes ? 1 : 0.32,
                  }}
                  aria-label={`Dia ${c.dia}${ehHoje ? ', hoje' : ''}${todas.length ? `, ${todas.length} evento(s)` : ''}`}
                  aria-pressed={ehSel}
                >
                  <span
                    style={{
                      ...styles.numero,
                      maxWidth: diametro,
                      fontSize: grande ? 19 : 16,
                      color: ehSel ? '#fff' : '#000',
                      background: ehHoje && !ehSel ? 'var(--lavanda)' : 'transparent',
                      fontWeight: ehHoje || ehSel ? 800 : 500,
                    }}
                  >
                    {ehSel && <span className="anim-pop" aria-hidden="true" style={styles.circulo} />}
                    <span
                      style={{
                        position: 'relative',
                      }}
                    >
                      {c.dia}
                    </span>
                  </span>
                  <span style={styles.pontos}>
                    {cores.map((cor, i) => (
                      <span
                        key={i}
                        className="anim-fade"
                        style={{
                          ...styles.ponto,
                          background: cor,
                        }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
const styles = {
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    padding: '16px 12px 12px',
  },
  topo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px 10px',
    gap: 8,
  },
  tituloBtn: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    minHeight: 44,
    padding: '0 6px',
    minWidth: 0,
  },
  mesNome: {
    fontWeight: 800,
    color: '#000',
  },
  anoNome: {
    fontWeight: 500,
    color: 'var(--text-3)',
  },
  navBtns: {
    display: 'flex',
    gap: 6,
  },
  seta: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  semana: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    paddingBottom: 6,
  },
  inicial: {
    textAlign: 'center',
    fontWeight: 700,
    color: 'var(--text-3)',
  },
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    rowGap: 2,
  },
  celula: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
    background: 'transparent',
  },
  numero: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background .15s, color .15s',
    fontVariantNumeric: 'tabular-nums',
  },
  circulo: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: '#000',
  },
  pontos: {
    display: 'flex',
    gap: 3,
    height: 6,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.25)',
  },
  seletor: {
    padding: '4px 4px 6px',
  },
  seletorAno: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  seletorAnoTxt: {
    fontSize: 22,
    fontWeight: 800,
    minWidth: 70,
    textAlign: 'center',
  },
  gradeMeses: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  chipMes: {
    borderRadius: 'var(--r-badge)',
    fontSize: 15,
    fontWeight: 600,
    transition: 'background .2s, color .2s',
  },
  chipMesConteudo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  chipMesQtd: {
    fontSize: 12,
    fontWeight: 700,
  },
}
