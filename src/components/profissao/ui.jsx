import { useLayoutEffect, useRef } from 'react'
const ESTILOS_PROF = `
.prof-press { transition: background .25s ease, color .25s ease, opacity .25s ease, transform .18s var(--ease-out), border-color .25s ease; }
.prof-press:active:not(:disabled) { transform: scale(0.95); }
.prof-campo:focus { border-color: var(--kleo) !important; }
.prof-cascata > * { animation: fadeUp .45s var(--ease-out) backwards; }
.prof-cascata > *:nth-child(2) { animation-delay: .05s; }
.prof-cascata > *:nth-child(3) { animation-delay: .10s; }
.prof-cascata > *:nth-child(4) { animation-delay: .15s; }
.prof-cascata > *:nth-child(5) { animation-delay: .20s; }
.prof-cascata > *:nth-child(6) { animation-delay: .25s; }
.prof-cascata > *:nth-child(7) { animation-delay: .30s; }
.prof-cascata > *:nth-child(n+8) { animation-delay: .34s; }
@keyframes profAnelEntra { from { stroke-dashoffset: var(--prof-anel-c); } }
@keyframes profCresce { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.prof-cresce { transform-origin: left center; animation: profCresce .6s var(--ease-out) backwards; }
`
if (typeof document !== 'undefined' && !document.getElementById('prof-ui-anim')) {
  const el = document.createElement('style')
  el.id = 'prof-ui-anim'
  el.textContent = ESTILOS_PROF
  document.head.appendChild(el)
}
export function Segmentado({ opcoes, valor, onChange, altura = 44, rotulo = 'Seções' }) {
  const caixaRef = useRef(null)
  const pilulaRef = useRef(null)
  const chave = opcoes.map(o => o.id + o.label).join('|')
  useLayoutEffect(() => {
    const caixa = caixaRef.current
    const pilula = pilulaRef.current
    if (!caixa || !pilula) return
    const posicionar = () => {
      const ativo = caixa.querySelector('[aria-selected="true"]')
      if (!ativo) {
        pilula.style.opacity = '0'
        return
      }
      pilula.style.opacity = '1'
      pilula.style.left = ativo.offsetLeft + 'px'
      pilula.style.width = ativo.offsetWidth + 'px'
    }
    posicionar()
    const raf = requestAnimationFrame(() => {
      pilula.style.transition = 'left .38s var(--ease-out), width .38s var(--ease-out), opacity .2s ease'
    })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(posicionar) : null
    ro?.observe(caixa)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [valor, chave])
  return (
    <div ref={caixaRef} style={styles.seg} role="tablist" aria-label={rotulo}>
      <span ref={pilulaRef} style={styles.segPilula} aria-hidden="true" />
      {opcoes.map(o => {
        const ativo = o.id === valor
        const Icon = o.icon
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(o.id)}
            className="prof-press"
            style={{
              ...styles.segItem,
              minHeight: altura - 8,
              color: ativo ? 'var(--white)' : 'var(--silver)',
              fontWeight: ativo ? 600 : 500,
            }}
          >
            {Icon && <Icon size={16} />}
            <span>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
export function Card({ children, style, className = 'anim-up', ...resto }) {
  return (
    <section
      className={className}
      style={{
        ...styles.card,
        ...style,
      }}
      {...resto}
    >
      {children}
    </section>
  )
}
export function Rotulo({ children, style }) {
  return (
    <p
      style={{
        ...styles.rotulo,
        ...style,
      }}
    >
      {children}
    </p>
  )
}
export function Pill({
  icon: Icon,
  children,
  variante = 'primario',
  altura = 44,
  cheio = false,
  style,
  className = '',
  ...resto
}) {
  const cores = {
    primario: {
      background: 'var(--kleo)',
      color: 'var(--white)',
    },
    secundario: {
      background: 'var(--control)',
      color: 'var(--polar)',
    },
    suave: {
      background: 'var(--kleo-soft)',
      color: 'var(--kleo)',
    },
    perigo: {
      background: 'rgba(255,59,48,0.14)',
      color: 'var(--red)',
    },
  }[variante]
  return (
    <button
      {...resto}
      className={`prof-press ${className}`}
      style={{
        ...styles.pill,
        ...cores,
        minHeight: altura,
        width: cheio ? '100%' : undefined,
        opacity: resto.disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {Icon && <Icon size={18} />}
      {children && <span>{children}</span>}
    </button>
  )
}
export function Redondo({
  icon: Icon,
  label,
  onClick,
  tamanho = 44,
  cor = 'var(--polar)',
  fundo = 'var(--control)',
  disabled,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      className={`prof-press ${className}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        ...styles.redondo,
        width: tamanho,
        height: tamanho,
        background: fundo,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span key={Icon.displayName || Icon.name} className="anim-pop" style={styles.redondoIcone}>
        <Icon
          size={Math.round(tamanho * 0.42)}
          color={cor}
          style={{
            transition: 'color .25s ease',
          }}
        />
      </span>
    </button>
  )
}
export function Chip({ ativo, children, icon: Icon, altura = 40, className = '', ...resto }) {
  return (
    <button
      {...resto}
      className={`prof-press ${className}`}
      aria-pressed={ativo}
      style={{
        ...styles.chip,
        minHeight: altura,
        background: ativo ? 'var(--kleo)' : 'var(--control)',
        color: ativo ? 'var(--white)' : 'var(--polar)',
      }}
    >
      {Icon && <Icon size={15} />}
      <span>{children}</span>
    </button>
  )
}
export function Campo({ rotulo, altura = 48, style, ...resto }) {
  return (
    <label style={styles.campoWrap}>
      {rotulo && <span style={styles.campoRotulo}>{rotulo}</span>}
      <input
        {...resto}
        className="prof-campo"
        style={{
          ...styles.campo,
          minHeight: altura,
          ...style,
        }}
      />
    </label>
  )
}
export function Anel({
  progresso = 0,
  tamanho = 120,
  espessura = 9,
  cor = 'var(--kleo)',
  curva = 'linear',
  children,
}) {
  const r = (tamanho - espessura) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, progresso))
  return (
    <div
      style={{
        ...styles.anel,
        width: tamanho,
        height: tamanho,
      }}
    >
      <svg
        width={tamanho}
        height={tamanho}
        style={{
          transform: 'rotate(-90deg)',
        }}
        aria-hidden="true"
      >
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke="var(--control)"
          strokeWidth={espessura}
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{
            '--prof-anel-c': c,
            animation: 'profAnelEntra .9s var(--ease-out) backwards',
            transition: `stroke-dashoffset ${curva === 'suave' ? '0.6s var(--ease-out)' : '0.5s linear'}, stroke .4s ease`,
          }}
        />
      </svg>
      <div style={styles.anelCentro}>{children}</div>
    </div>
  )
}
export function Vazio({ icon: Icon, titulo, texto }) {
  return (
    <div style={styles.vazio} className="anim-fade">
      <div style={styles.vazioIcone} className="anim-pop">
        <Icon size={26} color="var(--steel)" />
      </div>
      <p style={styles.vazioTitulo}>{titulo}</p>
      {texto && <p style={styles.vazioTexto}>{texto}</p>}
    </div>
  )
}
const styles = {
  seg: {
    position: 'relative',
    display: 'flex',
    gap: 4,
    padding: 4,
    borderRadius: 'var(--radius-pill)',
    background: 'var(--charcoal)',
    border: '1px solid var(--divider)',
  },
  segPilula: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: 0,
    opacity: 0,
    borderRadius: 'var(--radius-pill)',
    background: 'var(--control)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    pointerEvents: 'none',
  },
  segItem: {
    position: 'relative',
    zIndex: 1,
    background: 'transparent',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 'var(--radius-pill)',
    fontSize: 14,
    padding: '0 8px',
  },
  card: {
    background: 'var(--charcoal)',
    borderRadius: 'var(--radius-card)',
    padding: 20,
    border: '1px solid var(--divider)',
  },
  rotulo: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--steel)',
    marginBottom: 10,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 'var(--radius-pill)',
    padding: '0 20px',
    fontSize: 15,
    fontWeight: 600,
  },
  redondo: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  redondoIcone: {
    display: 'flex',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 16px',
    borderRadius: 'var(--radius-chip)',
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  campoWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  campoRotulo: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--steel)',
  },
  campo: {
    width: '100%',
    background: 'var(--control)',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    padding: '0 14px',
    fontSize: 16,
    colorScheme: 'dark',
    transition: 'border-color .2s ease, background .2s ease',
  },
  anel: {
    position: 'relative',
    flexShrink: 0,
  },
  anelCentro: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazio: {
    textAlign: 'center',
    padding: '28px 12px',
  },
  vazioIcone: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--control)',
    margin: '0 auto 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: 600,
  },
  vazioTexto: {
    fontSize: 14,
    color: 'var(--silver)',
    marginTop: 4,
  },
}
