import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useRolagemHorizontal from '../hooks/useRolagemHorizontal'
export default function FileiraRolavel({
  children,
  style,
  fundo = 'var(--bg)',
  rotulo,
  className,
  ...resto
}) {
  const ref = useRef(null)
  const { podeEsq, podeDir, rolar } = useRolagemHorizontal(ref)
  return (
    <div style={styles.wrap} className={className}>
      <div
        ref={ref}
        style={{
          ...styles.trilho,
          ...style,
        }}
        role="group"
        aria-label={rotulo}
        {...resto}
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        style={{
          ...styles.sombra,
          left: 0,
          background: `linear-gradient(to right, ${fundo}, transparent)`,
          opacity: podeEsq ? 1 : 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...styles.sombra,
          right: 0,
          background: `linear-gradient(to left, ${fundo}, transparent)`,
          opacity: podeDir ? 1 : 0,
        }}
      />
      {podeEsq && (
        <button
          type="button"
          className="tap"
          style={{
            ...styles.seta,
            left: 6,
          }}
          onClick={() => rolar(-1)}
          aria-label="Ver anteriores"
        >
          <ChevronLeft size={22} color="#000" aria-hidden="true" />
        </button>
      )}
      {podeDir && (
        <button
          type="button"
          className="tap"
          style={{
            ...styles.seta,
            right: 6,
          }}
          onClick={() => rolar(1)}
          aria-label="Ver mais"
        >
          <ChevronRight size={22} color="#000" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
const styles = {
  wrap: {
    position: 'relative',
    minWidth: 0,
  },
  trilho: {
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    overscrollBehaviorX: 'contain',
  },
  sombra: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
    pointerEvents: 'none',
    transition: 'opacity 0.25s ease',
  },
  seta: {
    position: 'absolute',
    top: 'calc(50% - 20px)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
}
