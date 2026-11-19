import { useId } from 'react'
const LAVANDA = '#d8d1ff'
const LIMA = '#d2e534'
const OLHO = '#1d1830'
const HASTE = '#2a2638'
const CORPO = 'M52 0C88 0 104 26 104 58C104 92 84 110 52 110C20 110 0 92 0 58C0 26 16 0 52 0Z'
const MEDIDAS = {
  chapado: {
    olhos: [32.5, 71.5],
    olhoY: 52,
    rx: 12.2,
    ry: 15,
    haste: 10,
    hasteW: 8.5,
    bolaR: 11.5,
    bolaBorda: 0,
  },
  volume: {
    olhos: [33.5, 70.5],
    olhoY: 47,
    rx: 11,
    ry: 13.4,
    haste: 13,
    hasteW: 5.6,
    bolaR: 8.8,
    bolaBorda: 1.4,
  },
}
function misturar(a, b, t) {
  const rgb = h => {
    const n = parseInt(String(h).replace('#', '').slice(0, 6), 16)
    return Number.isNaN(n) ? [216, 209, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const A = rgb(a),
    B = rgb(b)
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  )
}
function superelipse(n = 5, pontos = 120) {
  let d = ''
  for (let i = 0; i < pontos; i++) {
    const a = (i / pontos) * Math.PI * 2
    const c = Math.cos(a),
      s = Math.sin(a)
    const x = 50 + 50 * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = 50 + 50 * Math.sign(s) * Math.abs(s) ** (2 / n)
    d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)
  }
  return d + 'Z'
}
const LADRILHO = superelipse()
export function KleoFeijao({
  x = 0,
  y = 0,
  largura = 104,
  variante = 'volume',
  corpo = LAVANDA,
  tinta = HASTE,
  anel = 0,
  medidas,
  bochechas = false,
  boca = false,
  brilho = true,
  sombra = false,
}) {
  const uid = 'kF' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const g = nome => `url(#${uid}-${nome})`
  const volume = variante === 'volume'
  const m = {
    ...(volume ? MEDIDAS.volume : MEDIDAS.chapado),
    ...(medidas || {}),
  }
  const s = largura / (104 + anel)
  const bolaY = -m.haste - m.bolaR * 0.5
  const traco = {
    stroke: tinta,
  }
  const tracoBola =
    anel > 0
      ? traco
      : {
          stroke: misturar(LIMA, '#1d1830', 0.42),
        }
  const reflexo = {
    x: 52 - m.bolaR * 0.3,
    y: bolaY - m.bolaR * 0.38,
  }
  const bocaY = m.olhoY + m.ry + 1.5
  const bochechaY = m.olhoY + m.ry * 0.95
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${anel / 2} ${anel / 2})`}>
      {volume && (
        <defs>
          <radialGradient id={`${uid}-corpo`} cx="38%" cy="30%" r="78%" fx="32%" fy="22%">
            <stop offset="0%" stopColor={misturar(corpo, '#ffffff', 0.7)} />
            <stop offset="45%" stopColor={corpo} />
            <stop offset="100%" stopColor={misturar(corpo, '#1d1830', 0.26)} />
          </radialGradient>
          <radialGradient id={`${uid}-ao`} cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#1d1830" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1d1830" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="62%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75" />
          </linearGradient>
          <radialGradient id={`${uid}-spec`}>
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-olho`} cx="42%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#5d5480" />
            <stop offset="55%" stopColor="#25202f" />
            <stop offset="100%" stopColor="#100d17" />
          </radialGradient>
          <radialGradient id={`${uid}-bochecha`}>
            <stop offset="0%" stopColor="#ff8fb1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff8fb1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-lima`} cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#f1f8b8" />
            <stop offset="55%" stopColor={LIMA} />
            <stop offset="100%" stopColor="#a9b827" />
          </radialGradient>
          <radialGradient id={`${uid}-chao`}>
            <stop offset="0%" stopColor="#3d3170" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#3d3170" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${uid}-clip`}>
            <path d={CORPO} />
          </clipPath>
        </defs>
      )}

      {sombra && (
        <ellipse cx="52" cy="111.5" rx="44" ry="6.5" fill={volume ? g('chao') : 'rgba(61,49,112,0.2)'} />
      )}

      <g className="marca-antena">
        <path
          className="marca-haste"
          d={`M52 8V${-m.haste}`}
          fill="none"
          style={traco}
          strokeWidth={m.hasteW}
          strokeLinecap="round"
        />
        <g className="marca-bolinha">
          <circle
            cx="52"
            cy={bolaY}
            r={m.bolaR}
            fill={volume ? g('lima') : LIMA}
            style={m.bolaBorda ? tracoBola : undefined}
            strokeWidth={m.bolaBorda || undefined}
          />
          {volume && (
            <ellipse
              cx={reflexo.x}
              cy={reflexo.y}
              rx={m.bolaR * 0.36}
              ry={m.bolaR * 0.22}
              fill="#ffffff"
              opacity="0.9"
              transform={`rotate(-30 ${reflexo.x} ${reflexo.y})`}
            />
          )}
        </g>
      </g>

      <path d={CORPO} fill={volume ? g('corpo') : corpo} />
      {volume && (
        <g clipPath={g('clip')}>
          <ellipse cx="52" cy="118" rx="64" ry="30" fill={g('ao')} />
          <path d={CORPO} fill="none" stroke={g('rim')} strokeWidth="9" />
        </g>
      )}
      {anel > 0 ? (
        <path d={CORPO} fill="none" style={traco} strokeWidth={anel} />
      ) : (
        volume && (
          <path
            d={CORPO}
            fill="none"
            stroke={misturar(corpo, '#1d1830', 0.4)}
            strokeWidth="1.3"
            strokeOpacity="0.45"
          />
        )
      )}
      {volume && (
        <>
          <ellipse
            cx="30"
            cy="21"
            rx="16"
            ry="9"
            fill={g('spec')}
            transform="rotate(-38 30 21)"
            opacity="0.95"
          />
          <circle cx="43" cy="10.5" r="2.6" fill="#ffffff" opacity="0.9" />
        </>
      )}

      {bochechas && (
        <>
          <ellipse
            cx={m.olhos[0] - 15}
            cy={bochechaY}
            rx="9.5"
            ry="5.8"
            fill={volume ? g('bochecha') : 'rgba(255,143,177,0.5)'}
          />
          <ellipse
            cx={m.olhos[1] + 15}
            cy={bochechaY}
            rx="9.5"
            ry="5.8"
            fill={volume ? g('bochecha') : 'rgba(255,143,177,0.5)'}
          />
        </>
      )}

      <g className="marca-olhos">
        {m.olhos.map(ox => (
          <g key={ox}>
            <ellipse cx={ox} cy={m.olhoY} rx={m.rx} ry={m.ry} fill={volume ? g('olho') : OLHO} />
            {brilho && (
              <ellipse
                cx={ox + m.rx * 0.34}
                cy={m.olhoY - m.ry * 0.44}
                rx={m.rx * 0.42}
                ry={m.rx * 0.4}
                fill="#ffffff"
              />
            )}
            {brilho && volume && (
              <circle
                cx={ox - m.rx * 0.36}
                cy={m.olhoY + m.ry * 0.48}
                r={m.rx * 0.17}
                fill="#ffffff"
                opacity="0.85"
              />
            )}
          </g>
        ))}
      </g>

      {boca && (
        <g transform={`translate(0 ${bocaY - 58.5})`}>
          <path
            d="M45 58.5Q52 68.5 59 58.5Q52 61.4 45 58.5Z"
            fill={OLHO}
            stroke={OLHO}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M48.8 63Q52 61.5 55.2 63Q52 65.1 48.8 63Z" fill="#ff8fa8" />
        </g>
      )}
    </g>
  )
}
export default function SeloMarca({ tamanho = 44, cor, piscar = false, className, style }) {
  const uid = 'kS' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const grande = tamanho >= 40
  const largura = grande ? 59 : 64
  const base = grande ? 88.5 : 92
  const alturaCorpo = (largura * 110) / 104
  const classes = ['marca-selo', piscar ? 'marca-piscando' : '', className || ''].filter(Boolean).join(' ')
  return (
    <span
      role="img"
      aria-label="Kleo"
      data-sem-inverter=""
      className={classes}
      style={{
        ...styles.selo,
        width: tamanho,
        height: tamanho,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
        style={styles.svg}
      >
        <defs>
          <linearGradient id={`${uid}-fundo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbc6ff" />
            <stop offset="100%" stopColor="#a49cf5" />
          </linearGradient>
          {grande && (
            <>
              <radialGradient id={`${uid}-halo`} cx="50%" cy="54%" r="46%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`${uid}-topo`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </>
          )}
        </defs>
        <path d={LADRILHO} fill={cor || `url(#${uid}-fundo)`} />
        {grande && (
          <>
            <path d={LADRILHO} fill={`url(#${uid}-topo)`} />
            <circle cx="50" cy="54" r="46" fill={`url(#${uid}-halo)`} />
            <path
              d={LADRILHO}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.4"
              strokeWidth="0.9"
              transform="translate(50 50) scale(0.991) translate(-50 -50)"
            />
          </>
        )}
        <KleoFeijao
          x={50 - largura / 2}
          y={base - alturaCorpo}
          largura={largura}
          variante={grande ? 'volume' : 'chapado'}
          corpo={grande ? '#e3deff' : '#f4f2ff'}
          bochechas={grande}
          boca={grande}
          sombra={grande}
          brilho={tamanho >= 24}
        />
      </svg>
    </span>
  )
}
const styles = {
  selo: {
    display: 'inline-flex',
    flexShrink: 0,
    borderRadius: '23%',
    boxShadow: 'var(--sombra)',
  },
  svg: {
    display: 'block',
    overflow: 'visible',
  },
}
