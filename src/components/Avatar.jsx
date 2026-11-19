import { corDe, iniciais } from '../lib/rede/util'
export default function Avatar({ nome, foto, chave, tamanho = 48, online = false, anel = false, style }) {
  const fonte = Math.max(12, Math.round(tamanho * 0.38))
  return (
    <span
      data-sem-inverter={foto ? '' : undefined}
      style={{
        ...styles.base,
        width: tamanho,
        height: tamanho,
        background: foto ? 'var(--surface-2)' : corDe(chave || nome),
        boxShadow: anel ? '0 0 0 3px var(--surface), 0 0 0 5px #000' : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      {foto ? (
        <img src={foto} alt="" style={styles.foto} draggable={false} />
      ) : (
        <span
          style={{
            ...styles.iniciais,
            fontSize: fonte,
          }}
        >
          {iniciais(nome)}
        </span>
      )}
      {online && (
        <span
          style={{
            ...styles.online,
            width: Math.max(10, tamanho * 0.24),
            height: Math.max(10, tamanho * 0.24),
          }}
        />
      )}
    </span>
  )
}
const styles = {
  base: {
    position: 'relative',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'visible',
    color: '#000',
  },
  foto: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
  },
  iniciais: {
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  online: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    background: 'var(--sucesso)',
    border: '2px solid var(--surface)',
  },
}
