import { Check } from 'lucide-react'
import useModoSimples from '../hooks/useModoSimples'
import { infoTipo } from './RotinaUtil'
export default function RotinaItem({ ocorrencia, onMarcar, atrasado = false, quando, compacto = false }) {
  const simples = useModoSimples()
  const { rotina, hora, feito } = ocorrencia
  const info = infoTipo(rotina.tipo)
  const Icone = info.icone
  const lado = simples ? 56 : 46
  const rotuloAcao = feito
    ? `Desmarcar ${rotina.titulo} das ${hora}`
    : `Marcar ${rotina.titulo} das ${hora} como feito`
  return (
    <div
      style={{
        ...styles.linha,
        minHeight: simples ? 72 : compacto ? 56 : 64,
        opacity: feito ? 0.62 : 1,
      }}
    >
      <span
        style={{
          ...styles.icone,
          width: lado - 6,
          height: lado - 6,
          background: info.cor,
        }}
        aria-hidden="true"
      >
        <Icone size={simples ? 24 : 20} color="#000" strokeWidth={2.1} />
      </span>
      <div style={styles.texto}>
        <span
          style={{
            ...styles.titulo,
            fontSize: simples ? 19 : 16,
            textDecoration: feito ? 'line-through' : 'none',
          }}
        >
          {rotina.titulo}
        </span>
        <span
          style={{
            ...styles.sub,
            fontSize: simples ? 16 : 14,
          }}
        >
          <strong style={styles.hora}>{hora}</strong>
          {atrasado && !feito ? (
            <span style={styles.atrasado}>
              {simples ? 'Atrasado' : `Atrasado ${quando ? `(${quando.replace('há ', '')})` : ''}`}
            </span>
          ) : quando && !feito ? (
            <span>{quando}</span>
          ) : null}
          {!simples && rotina.detalhe ? <span style={styles.detalhe}>· {rotina.detalhe}</span> : null}
        </span>
        {simples && rotina.detalhe && (
          <span
            style={{
              ...styles.sub,
              fontSize: 16,
            }}
          >
            {rotina.detalhe}
          </span>
        )}
      </div>
      {simples ? (
        <button
          type="button"
          onClick={() => onMarcar?.(ocorrencia)}
          aria-label={rotuloAcao}
          className="tap"
          style={{
            ...styles.botaoTexto,
            background: feito ? 'var(--surface-2)' : '#000',
            color: feito ? '#000' : '#fff',
          }}
        >
          {feito ? (
            <span key="f" className="check-pop" style={styles.centro}>
              <Check size={20} strokeWidth={3} />
            </span>
          ) : null}
          <span>{feito ? 'Feito' : info.feito}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onMarcar?.(ocorrencia)}
          aria-label={rotuloAcao}
          aria-pressed={feito}
          className="tap"
          style={{
            ...styles.check,
            width: lado,
            height: lado,
            background: feito ? '#000' : 'var(--surface)',
            border: feito ? '2px solid #000' : `2px solid ${atrasado ? 'var(--erro)' : 'var(--border)'}`,
          }}
        >
          {feito && (
            <span key="f" className="check-pop" style={styles.centro}>
              <Check size={22} color="#fff" strokeWidth={3} />
            </span>
          )}
        </button>
      )}
    </div>
  )
}
const styles = {
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'opacity 0.3s',
  },
  icone: {
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texto: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  titulo: {
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sub: {
    color: 'var(--text-2)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    lineHeight: 1.3,
  },
  hora: {
    color: 'var(--text)',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  detalhe: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  atrasado: {
    background: 'var(--erro)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 'var(--r-badge)',
  },
  check: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s, border-color 0.2s',
  },
  botaoTexto: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 52,
    padding: '0 18px',
    borderRadius: 'var(--r-btn)',
    fontSize: 17,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: 'var(--sombra)',
  },
  centro: {
    display: 'flex',
  },
}
