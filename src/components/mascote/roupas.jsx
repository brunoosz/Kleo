import { V, T } from './Vol'
const BRANCO = '#ffffff'
const TERNO = '#3d4466'
const UNIFORME = '#7fb8e0'
const JEANS = '#7aa7e0'
export const ROUPAS = {
  nenhuma: () => null,
  jaleco: () => (
    <g>
      <V d="M10 119 Q80 107 150 119 L150 170 L10 170 Z" cor={BRANCO} />
      <V d="M68 113 L92 113 L80 140 Z" cor="#bfe2f7" sw={0.9} />
      <V d="M66 113 L80 140 L70 137 L60 118 Z" cor={BRANCO} sw={1} />
      <V d="M94 113 L80 140 L90 137 L100 118 Z" cor={BRANCO} sw={1} />
      <T d="M80 140 L80 170" cor="#d9d6e3" sw={1.2} />
      <circle cx="84" cy="147" r="1.8" fill="#cdcbd0" />
      <V as="rect" x="96" y="128" width="15" height="12" rx="3" cor={BRANCO} sw={1} />
      <T d="M100 128 L100 122 M104 128 L104 124" cor="#7f7cf0" sw={1.8} />
    </g>
  ),
  avental: c => (
    <g>
      <T d="M64 122 L58 110 M96 122 L102 110" cor={c.roupa || '#ff9e86'} sw={2.4} />
      <T d="M58 136 L30 132 M102 136 L130 132" cor={c.roupa || '#ff9e86'} sw={2.4} />
      <V d="M60 126 C60 122 62 120 66 120 L94 120 C98 120 100 122 100 126 L104 170 L56 170 Z" cor="#ffb59e" />
      <V as="rect" x="70" y="138" width="20" height="12" rx="4" cor="#ff9e86" sw={0.9} />
      <T d="M80 138 L80 150" cor="#e8846c" sw={0.9} />
    </g>
  ),
  gravata: () => (
    <g>
      <V d="M62 112 L79 116 L71 126 Z" cor={BRANCO} sw={1} />
      <V d="M98 112 L81 116 L89 126 Z" cor={BRANCO} sw={1} />
      <V d="M75.5 115 L84.5 115 L83 122 L77 122 Z" cor="#ff6f6f" sw={1} />
      <V d="M77 122 L83 122 L88 144 L80 152 L72 144 Z" cor="#ff7a7a" />
      <T d="M76 132 L84 128 M74 140 L86 134" cor="#ffb0b0" sw={1.4} />
    </g>
  ),
  colete: () => (
    <g>
      <V d="M10 114 L64 114 L72 170 L10 170 Z" cor="#d2e534" />
      <V d="M150 114 L96 114 L88 170 L150 170 Z" cor="#d2e534" />
      <V as="rect" x="10" y="138" width="60" height="6" cor="#eef0f5" sw={0.8} />
      <V as="rect" x="90" y="138" width="60" height="6" cor="#eef0f5" sw={0.8} />
      <V as="rect" x="44" y="124" width="14" height="9" rx="2.5" cor="#c3d62a" sw={0.8} />
      <circle cx="92" cy="128" r="1.6" fill="#8f9c1e" />
    </g>
  ),
  terno: () => (
    <g>
      <V d="M66 112 L94 112 L80 146 Z" cor={BRANCO} sw={1} />
      <V d="M77 116 L83 116 L86 138 L80 144 L74 138 Z" cor="#ff7a7a" sw={0.9} />
      <V d="M10 114 L66 112 L80 146 L80 170 L10 170 Z" cor={TERNO} />
      <V d="M150 114 L94 112 L80 146 L80 170 L150 170 Z" cor={TERNO} />
      <T d="M66 112 L72 130 L66 132 L80 146 M94 112 L88 130 L94 132 L80 146" cor="#5a6390" sw={1.2} />
      <circle cx="84" cy="154" r="2" fill="#2a2e45" />
      <V d="M100 126 L110 124 L110 128 L100 129 Z" cor={BRANCO} sw={0.6} />
    </g>
  ),
  uniforme: () => (
    <g>
      <V d="M10 116 Q80 106 150 116 L150 170 L10 170 Z" cor={UNIFORME} />
      <V d="M64 112 L80 118 L70 126 Z" cor="#a6d2ef" sw={1} />
      <V d="M96 112 L80 118 L90 126 Z" cor="#a6d2ef" sw={1} />
      <T d="M80 118 L80 170" cor="#5f9ccc" sw={1.2} />
      {[128, 138, 148].map(y => (
        <circle key={y} cx="83" cy={y} r="1.6" fill={BRANCO} />
      ))}
      <V as="rect" x="94" y="126" width="15" height="12" rx="3" cor="#6fa9d4" sw={0.9} />
      <V d="M58 126 L64 124 L66 130 L62 134 L56 132 Z" cor="#ffd25e" sw={0.8} />
    </g>
  ),
  macacao: () => (
    <g>
      <T d="M62 126 L48 110 M98 126 L112 110" cor={JEANS} sw={5} />
      <V d="M58 124 L102 124 L102 144 L150 144 L150 170 L10 170 L10 144 L58 144 Z" cor={JEANS} />
      <V as="rect" x="70" y="130" width="20" height="10" rx="3" cor="#6b97d0" sw={0.8} />
      <circle cx="63" cy="128" r="2.4" fill="#ffd25e" stroke="#d9a520" strokeWidth="0.6" />
      <circle cx="97" cy="128" r="2.4" fill="#ffd25e" stroke="#d9a520" strokeWidth="0.6" />
      <T d="M60 150 L60 158 M100 150 L100 158" cor="#9cc0ec" sw={1.2} strokeDasharray="2 2" />
    </g>
  ),
  lenco: () => (
    <g>
      <V d="M66 118 L94 118 L80 142 Z" cor="#ff8fb1" />
      <V d="M32 112 Q80 126 128 112 L128 119 Q80 133 32 119 Z" cor="#ff9fbf" />
      {[
        [74, 126],
        [86, 126],
        [80, 134],
        [50, 120],
        [110, 120],
      ].map(([x, y]) => (
        <circle key={x + '-' + y} cx={x} cy={y} r="1.5" fill={BRANCO} opacity="0.9" />
      ))}
    </g>
  ),
}
