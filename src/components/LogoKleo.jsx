import { KleoFeijao } from './SeloMarca'
const LETRAS = [
  {
    x: 0,
    d: 'M352 0L139 0L140-1440L352-1440L352-560L776-1080L1042-1080L594-540L1088 0L804 0L352-520L352 0Z',
  },
  {
    x: 1043,
    d: 'M369 0L160 0L160-1470L369-1470L369 0Z',
  },
  {
    x: 1552,
    d: 'M619 30Q458 30 336.5-40.5Q215-111 147.5-237.5Q80-364 80-531Q80-708 146.5-838Q213-968 332-1039Q451-1110 609-1110Q774-1110 890-1033.5Q1006-957 1063.5-816Q1121-675 1109-481L304-481Q316-345 381-265Q460-167 609-167Q707-167 778.5-211.5Q850-256 890-339L1095-274Q1032-129 904-49.5Q776 30 619 30ZM309-644L895-644Q881-767 829-835Q759-925 617-925Q460-925 381-826Q326-757 309-644Z',
  },
]
const O = {
  x: 2820,
  y: -1101,
  largura: 1079,
}
const VB = {
  x: 110,
  y: -1490,
  w: 3819,
  h: 1550,
}
const KLEO_PEQUENA = {
  anel: 14,
  medidas: {
    haste: 26.85,
    hasteW: 10,
    bolaR: 12,
    bolaBorda: 5,
    rx: 12.5,
    ry: 15,
    olhoY: 52,
  },
}
const KLEO_GRANDE = {
  anel: 10.5,
  medidas: {
    haste: 26.1,
    hasteW: 7.6,
    bolaR: 11,
    bolaBorda: 3.6,
    rx: 11.2,
    ry: 13.6,
    olhoY: 47.5,
  },
}
export default function LogoKleo({ tamanho = 32, slogan = false, animado = false, className, style }) {
  const pequeno = tamanho < 44
  const kleo = pequeno ? KLEO_PEQUENA : KLEO_GRANDE
  const largura = Math.round((VB.w * tamanho) / VB.h)
  const tinta = 'var(--kleo-tinta, #000)'
  const rapido = animado === 'rapido'
  const classes = [
    'marca-logo',
    'marca-piscando',
    'marca-viva',
    animado ? 'marca-entrada' : '',
    rapido ? 'marca-rapida' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
  const fonteSlogan = Math.max(13, Math.round(tamanho * 0.2))
  const atrasoLetra = i => (rapido ? 0.02 + i * 0.05 : 0.06 + i * 0.08)
  return (
    <span
      role="img"
      aria-label={slogan ? 'Kleo. Mais autonomia. Mais liberdade.' : 'Kleo'}
      className={classes}
      style={{
        ...styles.raiz,
        ...(slogan
          ? {
              ...styles.comSlogan,
              gap: Math.round(tamanho * 0.2),
            }
          : null),
        ...style,
      }}
    >
      <svg
        data-sem-inverter=""
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        width={largura}
        height={tamanho}
        aria-hidden="true"
        focusable="false"
        style={styles.svg}
      >
        <g
          style={{
            fill: tinta,
          }}
        >
          {LETRAS.map((l, i) => (
            <g
              key={i}
              className="marca-letra"
              style={
                animado
                  ? {
                      animationDelay: `${atrasoLetra(i)}s`,
                    }
                  : undefined
              }
            >
              <path transform={`translate(${l.x} 0)`} d={l.d} />
            </g>
          ))}
        </g>
        <g className="marca-kleo">
          <KleoFeijao
            x={O.x}
            y={O.y}
            largura={O.largura}
            anel={kleo.anel}
            medidas={kleo.medidas}
            variante={pequeno ? 'chapado' : 'volume'}
            tinta={tinta}
            bochechas={tamanho >= 56}
            boca={tamanho >= 80}
            brilho={tamanho >= 26}
          />
        </g>
      </svg>
      {slogan && (
        <span
          className="marca-slogan"
          style={{
            ...styles.slogan,
            fontSize: fonteSlogan,
          }}
        >
          <span style={styles.frase}>Mais autonomia.</span>
          <span style={styles.frase}>
            Mais{' '}
            <span style={styles.destaqueCaixa}>
              <span className="marca-destaque" aria-hidden="true" style={styles.destaque} />
              liberdade.
            </span>
          </span>
        </span>
      )}
    </span>
  )
}
const styles = {
  raiz: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    lineHeight: 1,
    maxWidth: '100%',
  },
  comSlogan: {
    flexDirection: 'column',
  },
  svg: {
    display: 'block',
    overflow: 'visible',
    maxWidth: '100%',
    height: 'auto',
  },
  slogan: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: '0.3em',
    rowGap: '0.12em',
    fontWeight: 700,
    lineHeight: 1.2,
    color: 'var(--text)',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  frase: {
    whiteSpace: 'nowrap',
  },
  destaqueCaixa: {
    position: 'relative',
    display: 'inline-block',
    padding: '0 0.3em',
    isolation: 'isolate',
  },
  destaque: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    background: 'var(--lima)',
    borderRadius: 'var(--r-badge)',
  },
}
