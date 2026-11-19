function paraRGB(hex) {
  let h = String(hex || '#d8d1ff')
    .replace('#', '')
    .trim()
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = 'd8d1ff'
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function paraHex([r, g, b]) {
  const f = v =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0')
  return '#' + f(r) + f(g) + f(b)
}
export function misturar(a, b, t) {
  const A = paraRGB(a),
    B = paraRGB(b)
  return paraHex(A.map((v, i) => v + (B[i] - v) * t))
}
export const clarear = (cor, t) => misturar(cor, '#ffffff', t)
export const escurecer = (cor, t) => misturar(cor, '#1d1830', t)
export const contorno = cor => escurecer(cor, 0.38)
const PALETA_ACENTO = ['#b7b2ff', '#89cdf3', '#d2e534', '#ff9fbf', '#ffb59e']
export function acentoPara(cor) {
  const A = paraRGB(cor)
  let melhor = PALETA_ACENTO[0],
    dist = -1
  for (const p of PALETA_ACENTO) {
    const B = paraRGB(p)
    const d = (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2
    if (d > dist) {
      dist = d
      melhor = p
    }
  }
  return melhor
}
export function estrela(cx, cy, R, r, n = 5) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const raio = i % 2 === 0 ? R : r
    const a = (Math.PI / n) * i - Math.PI / 2
    pts.push((cx + raio * Math.cos(a)).toFixed(1) + ',' + (cy + raio * Math.sin(a)).toFixed(1))
  }
  return pts.join(' ')
}
