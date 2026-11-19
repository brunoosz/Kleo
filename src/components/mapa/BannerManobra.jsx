import { RotateCcw } from 'lucide-react'
import { formatarDistancia } from '../MapaRotas'
import { IconeManobra } from './manobras'
export default function BannerManobra({
  instrucao,
  depois,
  distancia,
  recalculando,
  simples,
  grande,
  compacto,
}) {
  const titulo =
    instrucao?.tipo === 'arrive' ? 'Destino' : instrucao?.rua || instrucao?.curta || 'Siga em frente'
  const tam = grande || simples ? 1.18 : 1
  if (recalculando) {
    return (
      <div style={styles.banner} role="status" aria-live="assertive" className="anim-fade">
        <span
          style={{
            ...styles.seta,
            width: 64 * tam,
            height: 64 * tam,
          }}
        >
          <RotateCcw size={34 * tam} color="#000" className="girar" aria-hidden="true" />
        </span>
        <div style={styles.textos}>
          <div
            style={{
              ...styles.titulo,
              fontSize: 26 * tam,
            }}
          >
            Recalculando...
          </div>
          <div style={styles.sub}>Procurando outro caminho</div>
        </div>
      </div>
    )
  }
  return (
    <div style={styles.wrap}>
      <div
        style={{
          ...styles.banner,
          padding: compacto ? '12px 14px' : '16px 18px',
        }}
        role="status"
        aria-live="polite"
      >
        <span
          key={instrucao?.noCaminho}
          className="anim-pop"
          style={{
            ...styles.seta,
            width: 66 * tam,
            height: 66 * tam,
          }}
        >
          <IconeManobra ins={instrucao} size={40 * tam} color="#000" strokeWidth={2.6} aria-hidden="true" />
        </span>
        <div style={styles.textos}>
          <div
            style={{
              ...styles.dist,
              fontSize: 34 * tam,
            }}
          >
            {distancia != null ? formatarDistancia(distancia) : ''}
          </div>
          <div
            key={titulo}
            className="anim-fade"
            style={{
              ...styles.titulo,
              fontSize: (simples ? 22 : 20) * tam,
            }}
          >
            {instrucao?.tipo === 'arrive' ? 'Destino à frente' : simples ? instrucao?.curta : titulo}
          </div>
          {!simples && instrucao?.rua && instrucao?.tipo !== 'arrive' && (
            <div style={styles.sub}>{instrucao.curta}</div>
          )}
        </div>
      </div>
      {depois && !simples && !compacto && (
        <div style={styles.depois} className="anim-up">
          <span>Depois</span>
          <IconeManobra ins={depois} size={18} color="#000" strokeWidth={2.4} aria-hidden="true" />
          <span style={styles.depoisTexto}>
            {depois.tipo === 'arrive' ? 'Chegada' : depois.rua || depois.curta}
          </span>
        </div>
      )}
    </div>
  )
}
const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
  },
  banner: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#000',
    color: '#fff',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    position: 'relative',
    zIndex: 2,
  },
  seta: {
    flexShrink: 0,
    borderRadius: 22,
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    minWidth: 0,
  },
  dist: {
    fontWeight: 800,
    lineHeight: 1,
    color: '#fff',
  },
  titulo: {
    fontWeight: 700,
    lineHeight: 1.15,
    marginTop: 4,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  sub: {
    fontSize: 15,
    color: '#cfcdd6',
    marginTop: 3,
    fontWeight: 500,
  },
  depois: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: -14,
    padding: '20px 16px 8px 16px',
    background: 'var(--lavanda)',
    color: '#000',
    borderRadius: '0 0 22px 22px',
    fontSize: 15,
    fontWeight: 600,
    maxWidth: '85%',
    marginLeft: 14,
    boxShadow: 'var(--sombra)',
    position: 'relative',
    zIndex: 1,
  },
  depoisTexto: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
}
