import { V, T, Reflexo, Faisca } from './Vol'
import { estrela } from './cores'
const ESCURO = '#3a3647'
const METAL = '#d9dbe3'
const METAL_ESC = '#a9adbd'
const MADEIRA = '#d9a066'
const OURO = '#ffd25e'
const VERMELHO = '#ff7a7a'
const ROSA = '#ff9fbf'
const VERDE = '#8fd16a'
const AMARELO = '#ffe066'
const CEU = '#89cdf3'
const LAVANDA = '#d8d1ff'
const PERI = '#b7b2ff'
const LIMA = '#d2e534'
const BRANCO = '#ffffff'
function engrenagem(cx, cy, R, r, dentes = 8) {
  const pts = []
  const passo = (Math.PI * 2) / dentes
  for (let i = 0; i < dentes; i++) {
    const a = i * passo
    const angs = [a - passo * 0.3, a - passo * 0.16, a + passo * 0.16, a + passo * 0.3]
    const raios = [r, R, R, r]
    angs.forEach((ang, k) =>
      pts.push((cx + raios[k] * Math.cos(ang)).toFixed(1) + ',' + (cy + raios[k] * Math.sin(ang)).toFixed(1)),
    )
  }
  return pts.join(' ')
}
export const ITENS = {
  nenhum: () => null,
  notebook: () => (
    <g>
      <V as="rect" x="-15" y="-31" width="30" height="24" rx="3.5" cor={ESCURO} />
      <V as="rect" x="-12" y="-28" width="24" height="18" rx="2" cor={LAVANDA} sw={0.6} />
      <rect x="-9" y="-25" width="10" height="2.2" rx="1.1" fill={ESCURO} opacity="0.7" />
      <rect x="-9" y="-21" width="15" height="2.2" rx="1.1" fill={LIMA} />
      <rect x="-9" y="-17" width="8" height="2.2" rx="1.1" fill={ESCURO} opacity="0.5" />
      <V d="M-20 -1 L20 -1 L16 -7 L-16 -7 Z" cor={METAL} />
    </g>
  ),
  estetoscopio: () => (
    <g>
      <T d="M60 113 C56 130 66 141 80 141 C94 141 104 130 100 113" cor="#5a5670" sw={3} />
      <T d="M80 141 L80 147" cor="#5a5670" sw={3} />
      <V as="circle" cx="80" cy="151" r="6.5" cor={METAL} />
      <circle cx="80" cy="151" r="3.4" fill={CEU} />
      <circle cx="60" cy="112" r="2.4" fill={METAL_ESC} />
      <circle cx="100" cy="112" r="2.4" fill={METAL_ESC} />
    </g>
  ),
  chave_inglesa: () => (
    <g>
      <V as="rect" x="-3.5" y="-26" width="7" height="34" rx="3.5" cor={METAL} />
      <V d="M-7 -24 C-14 -30 -11 -43 -3 -43 L-3 -34 L3 -34 L3 -43 C11 -43 14 -30 7 -24 Z" cor={METAL} />
      <circle cx="0" cy="2" r="1.8" fill={METAL_ESC} />
    </g>
  ),
  regua: () => (
    <g transform="rotate(8)">
      <V as="rect" x="-5" y="-40" width="10" height="50" rx="3" cor={AMARELO} />
      <T
        d="M-5 -35 L-1 -35 M-5 -30 L1 -30 M-5 -25 L-1 -25 M-5 -20 L1 -20 M-5 -15 L-1 -15 M-5 -10 L1 -10 M-5 -5 L-1 -5"
        cor="#b38a1f"
        sw={1}
      />
    </g>
  ),
  livro: () => (
    <g transform="rotate(-6)">
      <V as="rect" x="-11" y="-26" width="24" height="30" rx="3" cor={BRANCO} />
      <V as="rect" x="-13" y="-27" width="23" height="31" rx="3" cor={VERMELHO} />
      <rect x="-13" y="-27" width="4" height="31" rx="2" fill="#e85a5a" />
      <V as="rect" x="-6" y="-20" width="13" height="6" rx="2" cor={BRANCO} sw={0.6} />
    </g>
  ),
  maleta: () => (
    <g>
      <T d="M-6 5 L-6 -1 Q-6 -4 -3 -4 L3 -4 Q6 -4 6 -1 L6 5" cor={ESCURO} sw={3} />
      <V as="rect" x="-16" y="4" width="32" height="24" rx="5" cor="#b07d52" />
      <T d="M-16 13 L16 13" cor="#8a5f3b" sw={1.2} />
      <V as="rect" x="-11" y="10.5" width="5" height="5" rx="1.2" cor={OURO} sw={0.6} />
      <V as="rect" x="6" y="10.5" width="5" height="5" rx="1.2" cor={OURO} sw={0.6} />
    </g>
  ),
  malhete: () => (
    <g transform="rotate(12)">
      <V as="rect" x="-2.6" y="-30" width="5.2" height="36" rx="2.6" cor={MADEIRA} />
      <V as="rect" x="-14" y="-41" width="28" height="13" rx="5" cor="#b97d47" />
      <rect x="-9" y="-41" width="3" height="13" fill={OURO} />
      <rect x="6" y="-41" width="3" height="13" fill={OURO} />
    </g>
  ),
  distintivo: () => (
    <g>
      <polygon
        points={estrela(101, 132, 10, 4.6)}
        fill={OURO}
        stroke="#c9961f"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="101" cy="132" r="3.6" fill="#ffe7a0" stroke="#c9961f" strokeWidth="0.8" />
      <Reflexo cx={97} cy={127} rx={1.6} ry={1} />
    </g>
  ),
  mangueira: () => (
    <g>
      <T d="M0 4 C0 22 -16 24 -10 36" cor="#c95a52" sw={8} />
      <T d="M0 4 C0 22 -16 24 -10 36" cor={VERMELHO} sw={6} />
      <V d="M-4 2 L-6 -24 L-3 -34 L3 -34 L6 -24 L4 2 Z" cor={OURO} />
      <V as="rect" x="-4" y="-38" width="8" height="5" rx="2" cor={METAL} />
      <circle cx="0" cy="-44" r="1.8" fill={CEU} />
      <circle cx="-5" cy="-42" r="1.4" fill={CEU} />
      <circle cx="5" cy="-42" r="1.4" fill={CEU} />
    </g>
  ),
  prancheta: () => (
    <g transform="rotate(-8)">
      <V as="rect" x="-14" y="-32" width="27" height="35" rx="4" cor={MADEIRA} />
      <V as="rect" x="-11" y="-27" width="21" height="27" rx="2" cor={BRANCO} sw={0.6} />
      <V as="rect" x="-6" y="-35" width="11" height="6" rx="2" cor={METAL} />
      <T d="M-7 -20 L6 -20 M-7 -15 L6 -15 M-7 -10 L2 -10" cor="#cdcbd0" sw={1.4} />
      <T d="M-8 -5 L-6 -3 L-2 -7" cor="#1f9d55" sw={1.6} />
    </g>
  ),
  sacola: () => (
    <g>
      <T d="M-7 7 C-7 -5 7 -5 7 7" cor="#5aa2d2" sw={2.2} />
      <V d="M-14 6 L14 6 L16 32 C16 34 15 35 13 35 L-13 35 C-15 35 -16 34 -16 32 Z" cor={CEU} />
      <V
        d="M0 26 C-6 22 -6 16 -2.5 16 C-1 16 0 17.5 0 17.5 C0 17.5 1 16 2.5 16 C6 16 6 22 0 26 Z"
        cor={BRANCO}
        sw={0.6}
      />
    </g>
  ),
  camera: () => (
    <g>
      <V as="rect" x="-10" y="-25" width="10" height="6" rx="2" cor="#55506a" />
      <V as="rect" x="-17" y="-21" width="31" height="21" rx="5" cor={ESCURO} />
      <V as="circle" cx="-1.5" cy="-10.5" r="7.5" cor={METAL} />
      <circle cx="-1.5" cy="-10.5" r="4.6" fill="#2a2638" />
      <Reflexo cx={-3} cy={-12.5} rx={1.6} ry={1} />
      <rect x="7" y="-18" width="5" height="3" rx="1" fill={LIMA} />
    </g>
  ),
  claquete: () => (
    <g transform="rotate(-6)">
      <V as="rect" x="-15" y="-24" width="28" height="21" rx="3" cor={ESCURO} />
      <g transform="rotate(-14 -15 -25)">
        <V as="rect" x="-15" y="-31" width="28" height="6" rx="1.5" cor={ESCURO} />
        <path
          d="M-11 -31 L-7 -31 L-10 -25 L-14 -25 Z M-3 -31 L1 -31 L-2 -25 L-6 -25 Z M5 -31 L9 -31 L6 -25 L2 -25 Z"
          fill={BRANCO}
        />
      </g>
      <T d="M-11 -17 L9 -17 M-11 -12 L3 -12 M-11 -7 L6 -7" cor={BRANCO} sw={1.4} opacity="0.85" />
    </g>
  ),
  microfone: () => (
    <g transform="rotate(10)">
      <V d="M-3.5 -14 L3.5 -14 L2.5 8 C2.5 10 -2.5 10 -2.5 8 Z" cor={ESCURO} />
      <V as="rect" x="-5.5" y="-17" width="11" height="5" rx="2" cor={PERI} />
      <V as="circle" cx="0" cy="-25" r="9.5" cor={METAL} />
      <T
        d="M-6 -29 L6 -29 M-8 -25 L8 -25 M-6 -21 L6 -21 M-3 -33 L-3 -17 M3 -33 L3 -17"
        cor={METAL_ESC}
        sw={0.9}
      />
      <Reflexo cx={-4} cy={-29} rx={2.4} ry={1.4} />
    </g>
  ),
  caneta: () => (
    <g transform="rotate(12)">
      <V as="rect" x="-2.8" y="-34" width="5.6" height="40" rx="2.8" cor="#7f7cf0" />
      <V d="M-2.8 -34 L0 -42 L2.8 -34 Z" cor={METAL} sw={0.8} />
      <T d="M2.8 -28 L4.5 -28 L4.5 -14" cor={METAL_ESC} sw={1.2} />
    </g>
  ),
  volante: () => (
    <g>
      <circle cx="80" cy="134" r="17" fill="none" stroke="#2a2638" strokeWidth="6.5" />
      <circle cx="80" cy="134" r="17" fill="none" stroke="#55506a" strokeWidth="4.5" />
      <T d="M66 128 Q72 118 84 117" cor="#ffffff" sw={1.4} opacity="0.5" />
      <T d="M63 134 L97 134 M80 134 L80 151" cor="#55506a" sw={3.4} />
      <V as="circle" cx="80" cy="134" r="5.5" cor={PERI} />
    </g>
  ),
  caixa: () => (
    <g>
      <V as="rect" x="-16" y="-26" width="32" height="26" rx="3" cor="#e0b07a" />
      <T d="M-16 -19 L16 -19" cor="#c48f57" sw={1} />
      <rect x="-4" y="-26" width="8" height="12" fill="#f3d9a8" />
      <T d="M-11 -9 L-11 -5 M-13 -7 L-11 -9 L-9 -7" cor="#9b6b3c" sw={1.1} />
    </g>
  ),
  mala: () => (
    <g>
      <T d="M-5 -30 L-5 -38 L5 -38 L5 -30" cor={ESCURO} sw={2.6} />
      <V as="rect" x="-13" y="-31" width="26" height="27" rx="6" cor={CEU} />
      <T d="M-6 -27 L-6 -8 M6 -27 L6 -8" cor="#6fb6e6" sw={1.6} />
      <circle cx="-8" cy="-2" r="2.6" fill={ESCURO} />
      <circle cx="8" cy="-2" r="2.6" fill={ESCURO} />
    </g>
  ),
  rolo_pintura: () => (
    <g>
      <T d="M0 -4 L0 -20 L-8 -20 L-8 -26" cor={METAL_ESC} sw={2.2} />
      <V as="rect" x="-2.8" y="-5" width="5.6" height="14" rx="2.8" cor={VERMELHO} />
      <V as="rect" x="-20" y="-37" width="24" height="11" rx="5.5" cor={PERI} />
      <path d="M-16 -26 C-16 -22 -14 -22 -14 -26 Z" fill={PERI} />
    </g>
  ),
  serrote: () => (
    <g transform="rotate(6)">
      <V d="M-5 -6 L5 -6 L3 -42 L-9 -38 Z" cor={METAL} />
      <path
        d="M-5 -6 L-6.5 -10 L-5.2 -12 L-7 -16 L-5.6 -18 L-7.6 -22 L-6.2 -24 L-8.2 -28 L-6.8 -30 L-8.8 -34 L-7.6 -36 L-9 -38"
        fill="none"
        stroke={METAL_ESC}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <V as="rect" x="-6" y="-7" width="12" height="15" rx="5" cor={MADEIRA} />
      <rect x="-2.5" y="-3" width="5" height="7" rx="2.5" fill="#b97d47" />
    </g>
  ),
  martelo: () => (
    <g transform="rotate(10)">
      <V as="rect" x="-2.6" y="-28" width="5.2" height="35" rx="2.6" cor={MADEIRA} />
      <V
        d="M-13 -37 L6 -37 C10 -37 12 -34 12 -30 L6 -28 L-13 -28 C-14 -28 -15 -29 -15 -30 L-15 -35 C-15 -36 -14 -37 -13 -37 Z"
        cor={METAL}
      />
    </g>
  ),
  tocha_solda: () => (
    <g>
      <circle cx="9" cy="-34" r="9" fill={AMARELO} opacity="0.35" />
      <T d="M0 -10 L0 -22 L6 -29" cor={METAL_ESC} sw={3.2} />
      <V as="rect" x="-3.2" y="-12" width="6.4" height="20" rx="3.2" cor={ESCURO} />
      <V as="rect" x="4" y="-33" width="5" height="6" rx="1.5" cor={METAL} transform="rotate(45 6.5 -30)" />
      <Faisca x={10} y={-35} s={6} cor="#ffb347" />
      <Faisca x={16} y={-28} s={3} />
      <Faisca x={4} y={-42} s={2.6} />
    </g>
  ),
  controle_remoto: () => (
    <g transform="rotate(-6)">
      <T d="M6 -24 L6 -36" cor={METAL_ESC} sw={1.6} />
      <circle cx="6" cy="-37" r="2.4" fill={VERMELHO} />
      <V as="rect" x="-9" y="-25" width="18" height="31" rx="5" cor={OURO} />
      <V as="circle" cx="0" cy="-15" r="4.5" cor={ESCURO} sw={0.8} />
      <circle cx="-4" cy="-4" r="2" fill={VERMELHO} />
      <circle cx="4" cy="-4" r="2" fill={VERDE} />
    </g>
  ),
  regador: () => (
    <g>
      <T d="M4 -10 L16 -24" cor="#5fa83e" sw={4.4} />
      <T d="M4 -10 L16 -24" cor={VERDE} sw={3} />
      <V as="ellipse" cx="17" cy="-25" rx="3.4" ry="2.2" cor={VERDE} transform="rotate(-40 17 -25)" />
      <T d="M-14 -20 C-14 -32 2 -32 2 -20" cor="#5fa83e" sw={2.6} />
      <V d="M-18 -1 L-16 -21 L4 -21 L6 -1 Z" cor={VERDE} />
      <circle cx="18" cy="-18" r="1.2" fill={CEU} />
      <circle cx="20" cy="-14" r="1.2" fill={CEU} />
    </g>
  ),
  tesoura: () => (
    <g transform="rotate(8)">
      <V d="M-1.5 -6 L-9 -38 L-4.5 -38 L3 -6 Z" cor={METAL} sw={0.9} />
      <V d="M1.5 -6 L9 -38 L4.5 -38 L-3 -6 Z" cor={METAL} sw={0.9} />
      <circle cx="0" cy="-12" r="1.6" fill={METAL_ESC} />
      <circle cx="-5" cy="2" r="5" fill="none" stroke={VERMELHO} strokeWidth="3.4" />
      <circle cx="5" cy="2" r="5" fill="none" stroke={VERMELHO} strokeWidth="3.4" />
    </g>
  ),
  planta: () => (
    <g>
      <V as="ellipse" cx="-7" cy="-26" rx="5" ry="10" cor={VERDE} transform="rotate(-30 -7 -26)" />
      <V as="ellipse" cx="7" cy="-28" rx="5" ry="11" cor="#a6dc7f" transform="rotate(28 7 -28)" />
      <V as="ellipse" cx="0" cy="-32" rx="4.5" ry="11" cor={VERDE} />
      <V d="M-12 -17 L12 -17 L9 0 L-9 0 Z" cor="#e0906a" />
      <V as="rect" x="-13.5" y="-19" width="27" height="5" rx="2" cor="#ea9f7a" />
    </g>
  ),
  espiga: () => (
    <g transform="rotate(10)">
      <V as="ellipse" cx="0" cy="-22" rx="7.5" ry="17" cor="#ffd84d" />
      {[-32, -26, -20, -14].map(y => (
        <g key={y}>
          <circle cx="-3" cy={y} r="1.6" fill="#ffe98a" />
          <circle cx="3" cy={y + 3} r="1.6" fill="#ffe98a" />
        </g>
      ))}
      <V d="M0 2 C-12 -4 -12 -18 -8 -28 C-6 -16 -2 -8 0 2 Z" cor={VERDE} sw={0.9} />
      <V d="M0 2 C12 -4 12 -18 8 -26 C6 -16 2 -8 0 2 Z" cor="#a6dc7f" sw={0.9} />
    </g>
  ),
  frigideira: () => (
    <g>
      <V as="rect" x="-2.6" y="-14" width="5.2" height="20" rx="2.6" cor={MADEIRA} />
      <V as="circle" cx="1" cy="-26" r="14" cor={ESCURO} />
      <circle cx="1" cy="-26" r="10.5" fill="#55506a" />
      <path d="M-6 -27 C-8 -33 2 -36 6 -32 C10 -28 7 -20 0 -21 C-4 -21 -5 -24 -6 -27 Z" fill={BRANCO} />
      <V as="circle" cx="1" cy="-27" r="3.6" cor={OURO} sw={0.6} />
    </g>
  ),
  batedor: () => (
    <g transform="rotate(10)">
      <T d="M-2 -10 C-11 -24 -7 -41 0 -41 C7 -41 11 -24 2 -10" cor={METAL_ESC} sw={1.6} />
      <T d="M-1 -10 C-5 -24 -3 -41 0 -41 C3 -41 5 -24 1 -10" cor={METAL_ESC} sw={1.6} />
      <V as="rect" x="-2.8" y="-11" width="5.6" height="18" rx="2.8" cor={ROSA} />
    </g>
  ),
  pao: () => (
    <g>
      <V as="ellipse" cx="2" cy="-16" rx="9" ry="21" cor="#e9b46a" transform="rotate(18 2 -16)" />
      <T d="M-6 -24 L2 -28 M-3 -15 L5 -19 M0 -6 L8 -10" cor="#f6d39a" sw={2.2} />
    </g>
  ),
  bolo: () => (
    <g>
      <V as="ellipse" cx="0" cy="-1.5" rx="19" ry="3" cor={BRANCO} />
      <V as="rect" x="-15" y="-23" width="30" height="21" rx="5" cor="#ffd9e6" />
      <rect x="-15" y="-14" width="30" height="4" fill={ROSA} />
      <V
        d="M-15 -18 C-15 -23 -12 -24 -10 -24 L10 -24 C12 -24 15 -23 15 -18 C13 -16 12 -19 10 -17 C8 -15 6 -19 4 -17 C2 -15 -1 -19 -3 -17 C-5 -15 -8 -19 -10 -17 C-12 -15 -13 -18 -15 -18 Z"
        cor={BRANCO}
        sw={0.8}
      />
      <T d="M1 -29 Q3 -34 6 -35" cor="#5fa83e" sw={1.2} />
      <V as="circle" cx="0" cy="-27.5" r="3.6" cor={VERMELHO} />
    </g>
  ),
  xicara: () => (
    <g>
      <T d="M-4 -24 C-6 -28 -2 -30 -4 -34 M3 -24 C1 -28 5 -30 3 -34" cor="#b8b4c6" sw={1.4} opacity="0.8" />
      <V as="ellipse" cx="0" cy="0" rx="14" ry="3" cor={BRANCO} />
      <T d="M9 -15 C16 -15 16 -7 8 -7" cor={BRANCO} sw={4} />
      <T d="M9 -15 C16 -15 16 -7 8 -7" cor="#d9d6e3" sw={1} />
      <V d="M-10 -19 L10 -19 L8 -4 C7 -1 -7 -1 -8 -4 Z" cor={BRANCO} />
      <rect x="-9.6" y="-14" width="19.2" height="3.5" fill={PERI} />
      <ellipse cx="0" cy="-18.5" rx="9" ry="1.6" fill="#8a5a3b" />
    </g>
  ),
  haltere: () => (
    <g>
      <V as="rect" x="-14" y="-2" width="28" height="4" rx="2" cor={METAL} />
      <V as="rect" x="-21" y="-10" width="9" height="20" rx="3.5" cor="#7f7cf0" />
      <V as="rect" x="12" y="-10" width="9" height="20" rx="3.5" cor="#7f7cf0" />
    </g>
  ),
  tapete_yoga: () => (
    <g>
      <V as="rect" x="-8" y="-36" width="16" height="36" rx="8" cor={PERI} />
      <V as="ellipse" cx="0" cy="-34" rx="7.5" ry="4" cor="#cdc9ff" sw={0.8} />
      <T d="M0 -34 C2 -35 3 -33 1 -32 C-2 -31 -3 -35 0 -36" cor="#8f89e8" sw={0.9} />
      <V as="rect" x="-8.5" y="-15" width="17" height="4" rx="2" cor={LIMA} sw={0.6} />
    </g>
  ),
  secador: () => (
    <g>
      <V as="rect" x="-3.5" y="-13" width="7" height="20" rx="3.5" cor={ROSA} />
      <V as="rect" x="-8" y="-28" width="26" height="15" rx="7.5" cor={ROSA} />
      <V as="rect" x="15" y="-27" width="5" height="13" rx="2" cor={ESCURO} />
      <V as="circle" cx="-6" cy="-20.5" r="6.5" cor="#ffc2d6" sw={0.8} />
      <T d="M-9 -20.5 L-3 -20.5 M-6 -23.5 L-6 -17.5" cor="#e57fa3" sw={1} />
    </g>
  ),
  pente: () => (
    <g transform="rotate(10)">
      <T
        d="M2 -33 L9 -33 M2 -29 L9 -29 M2 -25 L9 -25 M2 -21 L9 -21 M2 -17 L9 -17 M2 -13 L9 -13 M2 -9 L9 -9"
        cor="#e57fa3"
        sw={1.8}
      />
      <V as="rect" x="-4" y="-37" width="7" height="44" rx="3.5" cor={ROSA} />
    </g>
  ),
  navalha: () => (
    <g transform="rotate(8)">
      <V d="M-3 -16 L-3 -37 C4 -39 10 -35 9 -27 L3 -16 Z" cor={METAL} />
      <T d="M-1 -34 C3 -35 6 -32 6 -28" cor={BRANCO} sw={1.2} />
      <V as="rect" x="-3.2" y="-17" width="6.4" height="24" rx="3.2" cor={ESCURO} />
      <circle cx="0" cy="-15" r="1.5" fill={METAL} />
    </g>
  ),
  esmalte: () => (
    <g>
      <V as="rect" x="-4" y="-30" width="8" height="16" rx="3" cor={ESCURO} />
      <V d="M-10 -5 C-11 -17 11 -17 10 -5 C10 1 -10 1 -10 -5 Z" cor="#ff7aa8" />
      <Reflexo cx={-5} cy={-9} rx={1.6} ry={3} rot={10} opacidade={0.7} />
    </g>
  ),
  agulha: () => (
    <g>
      <V as="rect" x="-10" y="-25" width="20" height="5" rx="2" cor={MADEIRA} />
      <V as="rect" x="-8" y="-21" width="16" height="16" rx="2" cor="#ff8b8b" />
      <T d="M-8 -17 L8 -17 M-8 -13 L8 -13 M-8 -9 L8 -9" cor="#e86a6a" sw={0.9} />
      <V as="rect" x="-10" y="-6" width="20" height="5" rx="2" cor={MADEIRA} />
      <T d="M3 -12 L14 -40" cor={METAL_ESC} sw={2.2} />
      <T d="M3 -12 L14 -40" cor={METAL} sw={1.2} />
      <T d="M13 -36 C20 -30 18 -20 10 -18" cor="#ff8b8b" sw={1.2} />
    </g>
  ),
  paleta: () => (
    <g transform="rotate(-8)">
      <V d="M-16 -16 C-16 -33 14 -37 17 -21 C19 -11 8 -13 6 -6 C4 1 -16 2 -16 -16 Z" cor="#f0c992" />
      <circle cx="-8" cy="-25" r="3.4" fill={VERMELHO} />
      <circle cx="0" cy="-29" r="3.4" fill={AMARELO} />
      <circle cx="9" cy="-25" r="3.4" fill={CEU} />
      <circle cx="-10" cy="-15" r="3.4" fill={VERDE} />
      <circle cx="6" cy="-17" r="2.6" fill={PERI} />
    </g>
  ),
  mamadeira: () => (
    <g transform="rotate(8)">
      <V d="M-4 -30 C-4 -38 4 -38 4 -30 Z" cor="#ffd9a8" />
      <V as="rect" x="-8.5" y="-31" width="17" height="6" rx="2" cor={CEU} />
      <V as="rect" x="-7" y="-25" width="14" height="27" rx="5" cor={BRANCO} />
      <rect x="-6" y="-13" width="12" height="14" rx="4" fill="#fff3d6" />
      <T d="M3 -20 L6 -20 M3 -15 L6 -15 M3 -10 L6 -10" cor="#b8b4c6" sw={0.9} />
    </g>
  ),
  coracao: () => (
    <g>
      <V
        d="M0 -4 C-19 -15 -15 -33 -5 -31 C-2 -30.5 0 -27 0 -27 C0 -27 2 -30.5 5 -31 C15 -33 19 -15 0 -4 Z"
        cor={ROSA}
      />
      <Reflexo cx={-8} cy={-24} rx={3} ry={1.8} />
    </g>
  ),
  globo: () => (
    <g>
      <V as="ellipse" cx="0" cy="-2.5" rx="10" ry="3" cor={MADEIRA} />
      <T d="M0 -5 L0 -9" cor={METAL_ESC} sw={2} />
      <V as="circle" cx="0" cy="-23" r="13" cor={CEU} />
      <path
        d="M-8 -30 C-4 -33 2 -30 0 -26 C-2 -22 -8 -24 -10 -27 Z M3 -20 C7 -22 10 -18 8 -14 C6 -12 2 -14 3 -20 Z"
        fill={VERDE}
      />
      <T d="M-15 -14 C-12 -36 12 -38 15 -28" cor={METAL_ESC} sw={1.6} />
    </g>
  ),
  dente: () => (
    <g>
      <V
        d="M-10 -34 C-15 -34 -15 -21 -12 -15 C-10 -9 -10 -3 -6 -3 C-3 -3 -3 -11 0 -11 C3 -11 3 -3 6 -3 C10 -3 10 -9 12 -15 C15 -21 15 -34 10 -34 C6 -34 4 -32 0 -32 C-4 -32 -6 -34 -10 -34 Z"
        cor={BRANCO}
      />
      <circle cx="-4" cy="-22" r="1.4" fill={ESCURO} />
      <circle cx="4" cy="-22" r="1.4" fill={ESCURO} />
      <T d="M-2.5 -18.5 Q0 -16.5 2.5 -18.5" cor={ESCURO} sw={1} />
      <Faisca x={13} y={-36} s={4} />
    </g>
  ),
  cerebro: () => (
    <g>
      <V
        d="M-14 -14 C-19 -22 -11 -33 -2 -30 C2 -35 15 -33 14 -22 C19 -16 12 -5 4 -8 C0 -3 -10 -5 -12 -9 C-15 -9 -16 -12 -14 -14 Z"
        cor="#ffb3c7"
      />
      <T
        d="M0 -29 C-2 -22 2 -16 0 -9 M-9 -24 C-6 -22 -6 -18 -9 -16 M8 -25 C5 -22 7 -18 10 -17"
        cor="#e88aa6"
        sw={1.2}
      />
    </g>
  ),
  pata: () => (
    <g>
      <V as="circle" cx="0" cy="-20" r="15" cor={BRANCO} />
      <V as="ellipse" cx="0" cy="-15" rx="6.5" ry="5.5" cor="#8a6252" sw={0.6} />
      <V as="ellipse" cx="-7.5" cy="-23" rx="2.6" ry="3.4" cor="#8a6252" sw={0.6} />
      <V as="ellipse" cx="-2.5" cy="-27" rx="2.6" ry="3.4" cor="#8a6252" sw={0.6} />
      <V as="ellipse" cx="2.5" cy="-27" rx="2.6" ry="3.4" cor="#8a6252" sw={0.6} />
      <V as="ellipse" cx="7.5" cy="-23" rx="2.6" ry="3.4" cor="#8a6252" sw={0.6} />
    </g>
  ),
  pilula: () => (
    <g transform="rotate(-35 0 -16)">
      <V d="M-6.5 -16 L-6.5 -27 A6.5 6.5 0 0 1 6.5 -27 L6.5 -16 Z" cor={VERMELHO} />
      <V d="M-6.5 -16 L-6.5 -5 A6.5 6.5 0 0 0 6.5 -5 L6.5 -16 Z" cor={BRANCO} />
      <Reflexo cx={-3} cy={-26} rx={1.4} ry={3} rot={0} />
    </g>
  ),
  lupa: () => (
    <g transform="rotate(-10)">
      <V as="rect" x="-2.8" y="-13" width="5.6" height="20" rx="2.8" cor={ESCURO} />
      <circle cx="0" cy="-26" r="11" fill="#d6f0ff" opacity="0.75" />
      <circle cx="0" cy="-26" r="11" fill="none" stroke={METAL_ESC} strokeWidth="4.6" />
      <circle cx="0" cy="-26" r="11" fill="none" stroke={METAL} strokeWidth="2.8" />
      <Reflexo cx={-4} cy={-30} rx={3} ry={1.6} />
    </g>
  ),
  escudo: () => (
    <g>
      <V d="M0 -42 L15 -36 L15 -21 C15 -11 7 -4 0 -1 C-7 -4 -15 -11 -15 -21 L-15 -36 Z" cor={CEU} />
      <V d="M0 -36 L9 -32 L9 -22 C9 -15 4 -10 0 -8 C-4 -10 -9 -15 -9 -22 L-9 -32 Z" cor={BRANCO} sw={0.8} />
      <T d="M-4 -22 L-1 -19 L5 -26" cor="#1f9d55" sw={2} />
    </g>
  ),
  codigo: () => (
    <g transform="rotate(-6)">
      <V as="rect" x="-15" y="-35" width="30" height="29" rx="8" cor={ESCURO} />
      <T d="M-6 -27 L-11 -21 L-6 -15 M6 -27 L11 -21 L6 -15 M2.5 -29 L-2.5 -13" cor={LIMA} sw={2.2} />
    </g>
  ),
  grafico: () => (
    <g transform="rotate(-6)">
      <V as="rect" x="-16" y="-37" width="31" height="31" rx="7" cor={BRANCO} />
      <V as="rect" x="-11" y="-17" width="5" height="7" rx="1.5" cor={CEU} sw={0.6} />
      <V as="rect" x="-3" y="-23" width="5" height="13" rx="1.5" cor={PERI} sw={0.6} />
      <V as="rect" x="5" y="-30" width="5" height="20" rx="1.5" cor={LIMA} sw={0.6} />
      <T d="M-11 -25 L-3 -30 L4 -33 M1 -34 L4 -33 L3 -30" cor="#1f9d55" sw={1.4} />
    </g>
  ),
  robo: () => (
    <g>
      <T d="M0 -30 L0 -35" cor={METAL_ESC} sw={1.6} />
      <circle cx="0" cy="-36.5" r="2.4" fill={VERMELHO} />
      <V as="rect" x="-10" y="-16" width="20" height="14" rx="4" cor={METAL} />
      <V as="rect" x="-9.5" y="-30" width="19" height="14" rx="5" cor={METAL} />
      <rect x="-7" y="-27" width="14" height="8" rx="3" fill={ESCURO} />
      <circle cx="-3" cy="-23" r="1.6" fill={LIMA} />
      <circle cx="3" cy="-23" r="1.6" fill={LIMA} />
      <V as="rect" x="-8" y="-2.5" width="6" height="3" rx="1.5" cor={ESCURO} sw={0.6} />
      <V as="rect" x="2" y="-2.5" width="6" height="3" rx="1.5" cor={ESCURO} sw={0.6} />
      <circle cx="0" cy="-9" r="2.2" fill={PERI} />
    </g>
  ),
  cadeado: () => (
    <g>
      <T d="M-6 -20 L-6 -27 C-6 -36 6 -36 6 -27 L6 -20" cor={METAL_ESC} sw={4.4} />
      <T d="M-6 -20 L-6 -27 C-6 -36 6 -36 6 -27 L6 -20" cor={METAL} sw={2.6} />
      <V as="rect" x="-10.5" y="-22" width="21" height="19" rx="5" cor={OURO} />
      <circle cx="0" cy="-14.5" r="2.4" fill={ESCURO} />
      <rect x="-1" y="-14" width="2" height="5" rx="1" fill={ESCURO} />
    </g>
  ),
  roteador: () => (
    <g>
      <T d="M-10 -10 L-12 -27 M10 -10 L12 -27" cor={ESCURO} sw={2.8} />
      <circle cx="-12" cy="-28" r="2" fill={ESCURO} />
      <circle cx="12" cy="-28" r="2" fill={ESCURO} />
      <T d="M-6 -22 Q0 -27 6 -22 M-3 -18 Q0 -20.5 3 -18" cor="#5aa2d2" sw={1.6} />
      <V as="rect" x="-16" y="-11" width="32" height="10" rx="4" cor={BRANCO} />
      {[-9, -4, 1].map(x => (
        <circle key={x} cx={x} cy="-6" r="1.4" fill={LIMA} stroke="#8f9c1e" strokeWidth="0.4" />
      ))}
    </g>
  ),
  chip: () => (
    <g transform="rotate(-6)">
      <T
        d="M-6 -36 L-6 -32 M0 -36 L0 -32 M6 -36 L6 -32 M-6 -12 L-6 -8 M0 -12 L0 -8 M6 -12 L6 -8 M-16 -28 L-12 -28 M-16 -22 L-12 -22 M-16 -16 L-12 -16 M12 -28 L16 -28 M12 -22 L16 -22 M12 -16 L16 -16"
        cor={METAL_ESC}
        sw={1.8}
      />
      <V as="rect" x="-12" y="-34" width="24" height="24" rx="4" cor={ESCURO} />
      <V as="rect" x="-7" y="-29" width="14" height="14" rx="2.5" cor={PERI} sw={0.6} />
    </g>
  ),
  engrenagem: () => (
    <g>
      <V as="polygon" points={engrenagem(0, -22, 15, 11, 8)} cor="#c9ccd8" />
      <circle cx="0" cy="-22" r="5" fill="#8d91a3" />
      <circle cx="0" cy="-22" r="2.4" fill="#d9dbe3" />
    </g>
  ),
  raio: () => (
    <g>
      <V d="M5 -43 L-11 -18 L-1 -18 L-6 2 L11 -25 L1 -25 Z" cor={AMARELO} />
      <Reflexo cx={-2} cy={-26} rx={1.4} ry={3.4} rot={30} />
    </g>
  ),
  tubo_ensaio: () => (
    <g transform="rotate(12)">
      <rect x="-5" y="-38" width="10" height="38" rx="5" fill="#eef7ff" opacity="0.9" />
      <V d="M-5 -20 L5 -20 L5 -5 A5 5 0 0 1 -5 -5 Z" cor={VERDE} sw={0.6} />
      <rect x="-5" y="-38" width="10" height="38" rx="5" fill="none" stroke={METAL_ESC} strokeWidth="1.2" />
      <V as="rect" x="-6.5" y="-40" width="13" height="4" rx="2" cor={PERI} sw={0.6} />
      <circle cx="1" cy="-26" r="1.6" fill={VERDE} />
      <circle cx="-1" cy="-31" r="1.1" fill={VERDE} />
      <Reflexo cx={-2.5} cy={-30} rx={0.9} ry={4} rot={0} opacidade={0.7} />
    </g>
  ),
  calculadora: () => (
    <g transform="rotate(-6)">
      <V as="rect" x="-12" y="-37" width="24" height="33" rx="5" cor={ESCURO} />
      <rect x="-8" y="-33" width="16" height="7" rx="2" fill={LIMA} />
      {[-21, -15, -9].map(y =>
        [-6, 0, 6].map(x => (
          <rect
            key={x + '/' + y}
            x={x - 2}
            y={y - 2}
            width="4"
            height="4"
            rx="1.2"
            fill={x === 6 && y === -9 ? PERI : '#ffffff'}
            opacity="0.9"
          />
        )),
      )}
    </g>
  ),
  chave: () => (
    <g transform="rotate(-10)">
      <V as="rect" x="-2" y="-24" width="4" height="26" rx="2" cor={OURO} />
      <V as="rect" x="2" y="-6" width="5" height="3" rx="1" cor={OURO} sw={0.6} />
      <V as="rect" x="2" y="-12" width="4" height="3" rx="1" cor={OURO} sw={0.6} />
      <V as="circle" cx="0" cy="-31" r="8.5" cor={OURO} />
      <circle cx="0" cy="-31" r="3.4" fill="#fff7dc" stroke="#c9961f" strokeWidth="0.8" />
    </g>
  ),
  casa: () => (
    <g>
      <V d="M-14 0 L-14 -16 L0 -27 L14 -16 L14 0 Z" cor="#ffe9c7" />
      <V d="M-19 -14 L0 -32 L19 -14 L15 -12 L0 -26 L-15 -12 Z" cor={VERMELHO} />
      <V as="rect" x="-4" y="-11" width="8" height="11" rx="2" cor={PERI} sw={0.8} />
      <V as="rect" x="6" y="-14" width="6" height="6" rx="1.4" cor={CEU} sw={0.6} />
    </g>
  ),
  bandeja: () => (
    <g>
      <V d="M-11 -22 L-4 -22 L-5 -6 L-10 -6 Z" cor="#e6f4ff" />
      <rect x="-10.3" y="-16" width="5.6" height="9.5" fill="#ffb347" opacity="0.85" />
      <T d="M-6 -22 L-2 -30" cor={VERMELHO} sw={1.2} />
      <V d="M3 -14 L15 -14 L14 -7 C13 -5 5 -5 4 -7 Z" cor={BRANCO} />
      <ellipse cx="9" cy="-13.6" rx="5.6" ry="1.2" fill="#8a5a3b" />
      <V as="ellipse" cx="0" cy="-4" rx="19" ry="4" cor={METAL} />
    </g>
  ),
  cesta: () => (
    <g>
      <T d="M-12 -14 C-12 -33 12 -33 12 -14" cor="#b97d47" sw={2.6} />
      <V as="circle" cx="-6" cy="-16" r="5" cor={VERMELHO} />
      <V as="circle" cx="5" cy="-17" r="5" cor={OURO} />
      <V as="ellipse" cx="0" cy="-20" rx="2.4" ry="5" cor={VERDE} transform="rotate(20 0 -20)" />
      <V d="M-16 -14 L16 -14 L12 0 L-12 0 Z" cor={MADEIRA} />
      <T d="M-14 -9 L14 -9 M-13 -4.5 L13 -4.5" cor="#b97d47" sw={1} />
    </g>
  ),
  trena: () => (
    <g>
      <V as="rect" x="9" y="-12" width="11" height="4" rx="1" cor={AMARELO} sw={0.6} />
      <T d="M12 -12 L12 -10 M15 -12 L15 -10 M18 -12 L18 -10" cor="#b38a1f" sw={0.8} />
      <V as="rect" x="-12" y="-27" width="23" height="23" rx="7" cor={OURO} />
      <V as="circle" cx="-0.5" cy="-15.5" r="5" cor={ESCURO} sw={0.8} />
      <V as="rect" x="-3" y="-30" width="7" height="4" rx="1.5" cor={VERMELHO} sw={0.6} />
    </g>
  ),
  bengala: () => (
    <g>
      <T d="M-6 -12 C-6 -20 3 -20 3 -12 L7 36" cor="#9b98a8" sw={4.4} />
      <T d="M-6 -12 C-6 -20 3 -20 3 -12 L7 36" cor={BRANCO} sw={3} />
      <T d="M6 25 L7 35.5" cor={VERMELHO} sw={3} />
    </g>
  ),
  aviao: () => (
    <g transform="rotate(-20 0 -24)">
      <V d="M-4 -24 L-9 -36 L-4 -36 L5 -24 Z" cor={PERI} />
      <V d="M-16 -22 L-19 -30 L-15 -30 L-10 -24 Z" cor={PERI} />
      <V as="ellipse" cx="0" cy="-23" rx="18" ry="5.5" cor={BRANCO} />
      <V d="M-4 -22 L-9 -10 L-4 -10 L5 -22 Z" cor={PERI} />
      {[2, 6, 10].map(x => (
        <circle key={x} cx={x} cy="-24" r="1.3" fill={CEU} />
      ))}
    </g>
  ),
  telefone: () => (
    <g transform="rotate(-8)">
      <V as="rect" x="-9" y="-33" width="18" height="31" rx="4.5" cor={ESCURO} />
      <rect x="-7" y="-30" width="14" height="24" rx="2.5" fill={CEU} />
      <rect x="-5" y="-27" width="8" height="3.4" rx="1.7" fill={BRANCO} />
      <rect x="-2" y="-21.5" width="7" height="3.4" rx="1.7" fill={LIMA} />
      <rect x="-5" y="-16" width="6" height="3.4" rx="1.7" fill={BRANCO} />
    </g>
  ),
  cartao: () => (
    <g transform="rotate(-14)">
      <V as="rect" x="-15" y="-29" width="27" height="18" rx="3.5" cor={PERI} />
      <V as="rect" x="-11" y="-25" width="6" height="4.5" rx="1" cor={OURO} sw={0.5} />
      <T d="M-11 -16 L-3 -16 M0 -16 L7 -16" cor={BRANCO} sw={1.4} />
    </g>
  ),
  balanca: () => (
    <g>
      <T d="M0 6 L0 -36" cor="#c9961f" sw={3.2} />
      <T d="M0 6 L0 -36" cor={OURO} sw={2} />
      <T d="M-16 -33 L16 -33" cor={OURO} sw={2.4} />
      <T d="M-16 -33 L-21 -20 M-16 -33 L-11 -20 M16 -33 L11 -20 M16 -33 L21 -20" cor="#c9961f" sw={0.8} />
      <V d="M-22 -20 L-10 -20 C-10 -15 -22 -15 -22 -20 Z" cor={OURO} />
      <V d="M10 -20 L22 -20 C22 -15 10 -15 10 -20 Z" cor={OURO} />
      <V as="circle" cx="0" cy="-37" r="2.6" cor={OURO} sw={0.6} />
    </g>
  ),
  lapis: () => (
    <g transform="rotate(12)">
      <V as="rect" x="-3.2" y="-30" width="6.4" height="34" rx="1.4" cor={AMARELO} />
      <V d="M-3.2 -30 L0 -40 L3.2 -30 Z" cor="#f3d1a1" sw={0.8} />
      <path d="M-1.1 -36.6 L0 -40 L1.1 -36.6 Z" fill={ESCURO} />
      <rect x="-3.2" y="4" width="6.4" height="3" fill={METAL} />
      <V as="rect" x="-3.2" y="6.5" width="6.4" height="4" rx="1.6" cor={ROSA} sw={0.6} />
    </g>
  ),
  pincel: () => (
    <g transform="rotate(10)">
      <V as="rect" x="-2.4" y="-20" width="4.8" height="27" rx="2.4" cor={MADEIRA} />
      <V as="rect" x="-3" y="-26" width="6" height="7" rx="1" cor={METAL} sw={0.8} />
      <V d="M-3 -26 C-4 -32 -1 -38 0 -40 C1 -38 4 -32 3 -26 Z" cor="#a17853" sw={0.8} />
      <path d="M-2 -33 C-1 -37 0 -39 0 -40 C1 -38 2 -35 2 -33 Z" fill={PERI} />
    </g>
  ),
  tijolo: () => (
    <g>
      <V as="rect" x="-16" y="-10" width="15" height="9" rx="2" cor="#e98a6c" />
      <V as="rect" x="1" y="-10" width="15" height="9" rx="2" cor="#e98a6c" />
      <V as="rect" x="-8" y="-20" width="15" height="9" rx="2" cor="#f09b7c" />
      <circle cx="-12" cy="-6" r="0.9" fill="#c86a50" />
      <circle cx="10" cy="-5" r="0.9" fill="#c86a50" />
    </g>
  ),
  cano: () => (
    <g>
      <T d="M0 7 L0 -24 L14 -24" cor="#9ea3b5" sw={9.4} />
      <T d="M0 7 L0 -24 L14 -24" cor="#e8edf2" sw={7.4} />
      <T d="M-1.8 4 L-1.8 -22" cor={BRANCO} sw={1.4} opacity="0.9" />
      <V as="rect" x="-6" y="-30" width="12" height="12" rx="3" cor={METAL} />
      <V as="rect" x="12" y="-29" width="5" height="10" rx="1.5" cor={CEU} sw={0.8} />
    </g>
  ),
  mapa: () => (
    <g transform="rotate(-6)">
      <V d="M-15 -34 L-5 -31 L5 -34 L15 -31 L15 -7 L5 -10 L-5 -7 L-15 -10 Z" cor="#e9f6ff" />
      <path d="M-5 -31 L5 -34 L5 -10 L-5 -7 Z" fill={CEU} opacity="0.45" />
      <T
        d="M-11 -14 C-6 -20 0 -16 4 -22 C6 -25 9 -25 10 -27"
        cor={VERMELHO}
        sw={1.4}
        strokeDasharray="2.4 2"
      />
      <V
        d="M10 -26 C6 -26 6 -31 10 -31 C14 -31 14 -26 10 -21 Z"
        cor={VERMELHO}
        sw={0.6}
        transform="translate(0 -1)"
      />
    </g>
  ),
  seringa: () => (
    <g transform="rotate(14)">
      <T d="M0 -32 L0 -40" cor={METAL_ESC} sw={1.2} />
      <rect x="-4.5" y="-32" width="9" height="24" rx="2" fill="#eef7ff" />
      <rect x="-4.5" y="-24" width="9" height="16" rx="2" fill={CEU} opacity="0.8" />
      <rect x="-4.5" y="-32" width="9" height="24" rx="2" fill="none" stroke={METAL_ESC} strokeWidth="1.1" />
      <T d="M-8 -8 L8 -8" cor={METAL_ESC} sw={2} />
      <T d="M0 -8 L0 4 M-4 4 L4 4" cor={PERI} sw={2.4} />
      <T d="M1.5 -28 L4.5 -28 M1.5 -23 L4.5 -23 M1.5 -18 L4.5 -18" cor={BRANCO} sw={0.8} />
    </g>
  ),
  folha: () => (
    <g>
      <T d="M0 6 L0 -4" cor="#5fa83e" sw={2} />
      <V d="M0 -3 C-16 -14 -10 -37 7 -41 C13 -27 12 -10 0 -3 Z" cor={VERDE} />
      <T d="M0 -4 C2 -16 4 -28 6 -38 M1 -16 L-5 -20 M3 -26 L-2 -31 M2 -14 L8 -18" cor="#5fa83e" sw={1} />
    </g>
  ),
  bandeira: () => (
    <g>
      <T d="M0 8 L0 -40" cor={METAL_ESC} sw={2.4} />
      <circle cx="0" cy="-41" r="2.2" fill={OURO} />
      <V d="M1 -39 C8 -41 14 -36 20 -35 C14 -30 8 -27 1 -26 Z" cor={LIMA} />
    </g>
  ),
}
