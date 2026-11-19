import { contorno } from './cores'
import { useGrad } from './ctx'
import { estrela } from './cores'
export function V({ as = 'path', cor = '#ffffff', borda, sw = 1.2, semBrilho = false, ...props }) {
  const g = useGrad()
  const El = as
  const traco = borda === false ? 'none' : borda || contorno(cor)
  return (
    <>
      <El
        fill={cor}
        stroke={traco}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
        {...props}
      />
      {!semBrilho && <El fill={g('brilho')} stroke="none" {...props} style={styles.semToque} />}
    </>
  )
}
export function T({ cor = '#2a2638', sw = 2, ...props }) {
  return (
    <path fill="none" stroke={cor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...props} />
  )
}
export function Reflexo({ cx, cy, rx = 2.2, ry, opacidade = 0.85, rot = -30 }) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry ?? rx * 0.6}
      fill="#ffffff"
      opacity={opacidade}
      transform={`rotate(${rot} ${cx} ${cy})`}
      style={styles.semToque}
    />
  )
}
export function Flor({ x, y, cor, r = 4.2 }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map(a => (
        <V
          key={a}
          as="ellipse"
          cx={x}
          cy={y - r}
          rx={r * 0.62}
          ry={r}
          cor={cor}
          sw={0.8}
          transform={`rotate(${a} ${x} ${y})`}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.55} fill="#ffd84d" stroke="#d9a520" strokeWidth={0.6} />
    </g>
  )
}
export function Folha({ x, y, rot, cor = '#8fd16a' }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <V
        d={`M${x} ${y} C${x - 5} ${y - 4} ${x - 5} ${y - 12} ${x} ${y - 16} C${x + 5} ${y - 12} ${x + 5} ${y - 4} ${x} ${y} Z`}
        cor={cor}
        sw={0.8}
      />
      <T d={`M${x} ${y - 1} L${x} ${y - 13}`} cor="#5fa83e" sw={0.8} />
    </g>
  )
}
export function Faisca({ x, y, s = 4, cor = '#ffe066' }) {
  return <polygon points={estrela(x, y, s, s * 0.35, 4)} fill={cor} stroke="#d9a520" strokeWidth="0.5" />
}
const styles = {
  semToque: {
    pointerEvents: 'none',
  },
}
