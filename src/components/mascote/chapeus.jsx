import { V, T, Reflexo, Flor, Folha } from './Vol'
const ESCURO = '#3a3647'
const BRANCO = '#ffffff'
const OURO = '#ffd25e'
export const CHAPEUS = {
  nenhum: () => null,
  chef: () => (
    <g>
      <V
        d="M50 50 C36 50 34 28 50 27 C50 12 68 8 75 18 C82 6 102 9 102 22 C118 20 124 40 110 50 Z"
        cor={BRANCO}
      />
      <T d="M66 30 C66 38 68 44 68 50 M88 28 C90 36 90 44 89 50" cor="#d9d6e3" sw={1.4} />
      <V as="rect" x="47" y="46" width="66" height="15" rx="7" cor={BRANCO} />
      <Reflexo cx={56} cy={30} rx={4} ry={2.2} />
    </g>
  ),
  palha: () => (
    <g>
      <V as="ellipse" cx="80" cy="59" rx="54" ry="10" cor="#f2cd7a" />
      <V d="M52 60 C52 36 63 28 80 28 C97 28 108 36 108 60 Z" cor="#f5d68e" />
      <V d="M53 50 C68 47 92 47 107 50 L107.6 57 C92 54 68 54 52.4 57 Z" cor="#ff8b8b" sw={0.8} />
      <T
        d="M64 36 L66 44 M80 31 L80 40 M96 36 L94 44 M38 60 L44 62 M116 62 L122 60 M60 66 L64 67 M96 67 L100 66"
        cor="#d4a24c"
        sw={1}
      />
    </g>
  ),
  capacete_obra: () => (
    <g>
      <V d="M42 62 C42 34 60 24 80 24 C100 24 118 34 118 62 Z" cor="#ffd84d" />
      <V as="rect" x="74" y="24.5" width="12" height="36" rx="6" cor="#ffe27a" sw={0.8} />
      <V as="rect" x="34" y="57" width="92" height="9" rx="4.5" cor="#f5c531" />
      <Reflexo cx={56} cy={36} rx={5} ry={2.6} />
    </g>
  ),
  capacete_moto: c => (
    <g>
      <V
        d="M32 80 C28 42 50 22 80 22 C110 22 132 42 128 80 L118 80 C117 58 102 50 80 50 C58 50 43 58 42 80 Z"
        cor={c.acento}
      />
      <V d="M46 48 C56 34 104 34 114 48 L110 55 C100 47 60 47 50 55 Z" cor={ESCURO} sw={0.8} opacity="0.85" />
      <T d="M80 22.5 L80 36" cor={BRANCO} sw={5} />
      <Reflexo cx={54} cy={32} rx={6} ry={3} />
    </g>
  ),
  bone: c => (
    <g>
      <V d="M46 60 C46 38 62 30 80 30 C98 30 114 38 114 60 Z" cor={c.acento} />
      <T d="M80 31 L80 58" cor={c.borda} sw={1} />
      <V d="M42 58 C58 67 102 67 118 58 C114 72 46 72 42 58 Z" cor={c.acentoEsc} />
      <circle cx="80" cy="30.5" r="3" fill={c.acentoEsc} />
      <Reflexo cx={60} cy={40} rx={5} ry={2.4} />
    </g>
  ),
  quepe: () => (
    <g>
      <V d="M40 46 C40 30 120 30 120 46 L112 60 L48 60 Z" cor="#4a5687" />
      <V as="rect" x="47" y="53" width="66" height="8" rx="3" cor={ESCURO} sw={0.8} />
      <V d="M50 60 C62 70 98 70 110 60 C104 66 56 66 50 60 Z" cor="#26232f" sw={0.8} />
      <V d="M80 38 L85 44 L80 50 L75 44 Z" cor={OURO} sw={0.8} />
    </g>
  ),
  bombeiro: () => (
    <g>
      <V as="ellipse" cx="80" cy="61" rx="52" ry="8" cor="#e2554a" />
      <V d="M44 62 C44 32 60 22 80 22 C100 22 116 32 116 62 Z" cor="#ff6b5e" />
      <T d="M80 23 L80 60" cor="#e2554a" sw={3} />
      <V d="M70 34 L90 34 L90 46 C90 52 84 55 80 57 C76 55 70 52 70 46 Z" cor={OURO} sw={0.9} />
      <circle cx="80" cy="43" r="3.4" fill="#e2554a" />
      <Reflexo cx={57} cy={34} rx={5} ry={2.6} />
    </g>
  ),
  touca_medica: () => (
    <g>
      <V d="M40 66 C38 36 58 26 80 26 C102 26 122 36 120 66 C100 58 60 58 40 66 Z" cor="#9ad7f0" />
      <T d="M44 60 C64 54 96 54 116 60" cor="#6fb7d8" sw={1.2} />
      {[
        [60, 38],
        [80, 33],
        [100, 38],
        [70, 47],
        [90, 47],
      ].map(([x, y]) => (
        <circle key={x + '-' + y} cx={x} cy={y} r="1.6" fill={BRANCO} opacity="0.85" />
      ))}
      <V d="M119 58 C128 56 130 64 124 66 C130 70 126 76 120 72 Z" cor="#9ad7f0" sw={0.8} />
    </g>
  ),
  capelo: () => (
    <g>
      <V d="M54 60 C54 46 106 46 106 60 C96 56 64 56 54 60 Z" cor="#2a2638" />
      <V d="M80 28 L130 41 L80 54 L30 41 Z" cor={ESCURO} />
      <circle cx="80" cy="41" r="3" fill="#d2e534" />
      <T d="M80 41 L118 46 L118 62" cor="#d2e534" sw={2} />
      <V d="M114.5 60 L121.5 60 L123 70 L113 70 Z" cor="#d2e534" sw={0.8} />
    </g>
  ),
  boina: c => (
    <g>
      <V d="M40 56 C34 40 60 28 86 31 C110 34 128 42 120 54 C112 62 48 64 40 56 Z" cor={c.acento} />
      <V as="rect" x="84" y="25" width="5" height="8" rx="2.5" cor={c.acentoEsc} sw={0.8} />
      <Reflexo cx={62} cy={40} rx={6} ry={2.6} />
    </g>
  ),
  fones: () => (
    <g>
      <T d="M36 84 C32 34 128 34 124 84" cor={ESCURO} sw={6} />
      <T d="M40 70 C42 44 118 44 120 70" cor="#5a5670" sw={1.4} />
      <V as="rect" x="22" y="74" width="17" height="26" rx="8" cor="#d2e534" />
      <V as="rect" x="121" y="74" width="17" height="26" rx="8" cor="#d2e534" />
      <V as="rect" x="35" y="78" width="6" height="18" rx="3" cor={ESCURO} sw={0.8} />
      <V as="rect" x="119" y="78" width="6" height="18" rx="3" cor={ESCURO} sw={0.8} />
    </g>
  ),
  piloto: () => (
    <g>
      <V d="M40 46 C40 30 120 30 120 46 L112 60 L48 60 Z" cor={BRANCO} />
      <V as="rect" x="47" y="53" width="66" height="8" rx="3" cor="#34406b" sw={0.8} />
      <V d="M50 60 C62 70 98 70 110 60 C104 66 56 66 50 60 Z" cor="#26232f" sw={0.8} />
      <V
        d="M80 40 C74 38 66 39 60 42 C68 44 74 45 80 46 C86 45 92 44 100 42 C94 39 86 38 80 40 Z"
        cor={OURO}
        sw={0.8}
      />
      <circle cx="80" cy="43" r="3" fill="#34406b" />
    </g>
  ),
  laco: () => (
    <g>
      <V d="M102 46 C92 30 78 36 82 48 C85 58 96 56 102 46 Z" cor="#ff8fb1" />
      <V d="M102 46 C112 30 126 36 122 48 C119 58 108 56 102 46 Z" cor="#ff8fb1" />
      <V as="ellipse" cx="102" cy="47" rx="5" ry="5.5" cor="#ff6f9c" />
      <circle cx="88" cy="44" r="1.4" fill="#ffffff" opacity="0.8" />
      <circle cx="116" cy="44" r="1.4" fill="#ffffff" opacity="0.8" />
    </g>
  ),
  bandana: () => (
    <g>
      <V d="M38 70 C36 38 58 28 80 28 C102 28 124 38 122 70 C100 61 60 61 38 70 Z" cor="#ff7a7a" />
      {[
        [58, 42],
        [80, 36],
        [102, 42],
        [68, 54],
        [92, 54],
        [48, 60],
        [112, 60],
      ].map(([x, y]) => (
        <circle key={x + '-' + y} cx={x} cy={y} r="2" fill={BRANCO} opacity="0.9" />
      ))}
      <V d="M120 64 L136 58 L132 70 Z" cor="#ff6a6a" sw={0.8} />
      <V d="M120 66 L134 76 L122 76 Z" cor="#ff6a6a" sw={0.8} />
      <circle cx="121" cy="66" r="3.5" fill="#e85a5a" />
    </g>
  ),
  gorro: () => (
    <g>
      <V d="M40 66 C38 34 58 22 80 22 C102 22 122 34 120 66 Z" cor="#89cdf3" />
      <V as="rect" x="36" y="56" width="88" height="14" rx="7" cor="#6fb6e6" />
      <T
        d="M48 59 L48 67 M58 58 L58 68 M68 58 L68 68 M78 58 L78 68 M88 58 L88 68 M98 58 L98 68 M108 58 L108 68 M116 59 L116 67"
        cor="#5aa2d2"
        sw={1.2}
      />
      <V as="circle" cx="80" cy="20" r="9" cor={BRANCO} />
      <Reflexo cx={56} cy={36} rx={5} ry={2.4} />
    </g>
  ),
  cabelo_branco: () => (
    <g>
      <V
        d="M42 74 C30 74 26 62 34 56 C30 48 38 40 46 44 C48 36 58 38 58 46 C54 50 50 54 52 60 C48 64 50 72 42 74 Z"
        cor="#f4f4f7"
      />
      <V
        d="M118 74 C130 74 134 62 126 56 C130 48 122 40 114 44 C112 36 102 38 102 46 C106 50 110 54 108 60 C112 64 110 72 118 74 Z"
        cor="#f4f4f7"
      />
      <V
        d="M72 46 C70 36 80 32 86 38 C90 32 98 38 94 44 C90 42 86 44 84 47 C80 44 76 44 72 46 Z"
        cor="#f4f4f7"
      />
      <T d="M40 58 C42 54 46 54 48 56 M114 56 C116 54 120 54 122 58" cor="#cfcfd8" sw={1} />
    </g>
  ),
  coque: () => (
    <g>
      <V as="circle" cx="80" cy="25" r="13" cor="#7a5444" />
      <V
        d="M36 74 C32 38 58 30 80 30 C102 30 128 38 124 74 C118 58 100 48 84 50 C70 52 54 58 36 74 Z"
        cor="#7a5444"
      />
      <V as="rect" x="70" y="34" width="20" height="5" rx="2.5" cor="#d2e534" sw={0.8} />
      <T d="M60 40 C68 36 76 36 82 38 M90 38 C100 38 108 42 112 48" cor="#5e3f32" sw={1.1} />
      <Reflexo cx={74} cy={20} rx={4} ry={2} />
    </g>
  ),
  cartola: () => (
    <g>
      <V as="ellipse" cx="80" cy="51" rx="38" ry="7" cor="#2a2638" />
      <V d="M58 50 L60 12 C60 8 100 8 100 12 L102 50 Z" cor={ESCURO} />
      <V as="rect" x="58.5" y="38" width="43" height="8" rx="1.5" cor="#b7b2ff" sw={0.8} />
      <V as="ellipse" cx="80" cy="11" rx="20" ry="3.5" cor="#4a4560" sw={0.8} />
      <Reflexo cx={66} cy={22} rx={2} ry={6} rot={0} opacidade={0.4} />
    </g>
  ),
  tiara_flor: () => (
    <g>
      <T d="M44 62 C48 40 112 40 116 62" cor="#8fd16a" sw={3} />
      <Folha x={56} y={50} rot={-50} />
      <Folha x={104} y={50} rot={50} />
      <Flor x={46} y={58} cor="#ff9fbf" />
      <Flor x={62} y={46} cor="#d8d1ff" />
      <Flor x={80} y={42} cor="#ffffff" r={5} />
      <Flor x={98} y={46} cor="#89cdf3" />
      <Flor x={114} y={58} cor="#ff9fbf" />
    </g>
  ),
  viseira: c => (
    <g>
      <V d="M42 62 C46 46 114 46 118 62 L116 67 C108 56 52 56 44 67 Z" cor={c.acento} />
      <V d="M40 62 C56 74 104 74 120 62 C116 80 44 80 40 62 Z" cor={c.acentoEsc} />
      <Reflexo cx={60} cy={70} rx={6} ry={2} rot={-6} />
    </g>
  ),
  headset: () => (
    <g>
      <T d="M38 84 C34 40 126 40 122 84" cor={ESCURO} sw={4} />
      <V as="rect" x="24" y="76" width="16" height="22" rx="7" cor="#b7b2ff" />
      <V as="rect" x="121" y="80" width="12" height="15" rx="6" cor="#b7b2ff" />
      <T d="M32 96 C36 108 50 110 64 108" cor={ESCURO} sw={2.4} />
      <V as="ellipse" cx="66" cy="108" rx="4" ry="3" cor={ESCURO} sw={0.8} />
    </g>
  ),
  coroa_folhas: () => (
    <g>
      <T d="M42 64 C46 44 114 44 118 64" cor="#5fa83e" sw={2} />
      {[
        [44, 62, -70],
        [50, 54, -55],
        [58, 48, -38],
        [68, 44, -20],
        [92, 44, 20],
        [102, 48, 38],
        [110, 54, 55],
        [116, 62, 70],
      ].map(([x, y, r]) => (
        <Folha key={x} x={x} y={y} rot={r} cor={x % 4 === 0 ? '#8fd16a' : '#a6dc7f'} />
      ))}
      <circle cx="80" cy="43" r="3.4" fill="#ff8b8b" stroke="#d9605f" strokeWidth={0.8} />
    </g>
  ),
  touca_natacao: () => (
    <g>
      <V d="M38 70 C34 32 58 24 80 24 C102 24 126 32 122 70 C104 60 56 60 38 70 Z" cor="#89cdf3" />
      <T d="M40 58 C62 50 98 50 120 58" cor={ESCURO} sw={2.2} />
      <V as="ellipse" cx="68" cy="53" rx="8" ry="6" cor="#d8d1ff" />
      <V as="ellipse" cx="92" cy="53" rx="8" ry="6" cor="#d8d1ff" />
      <Reflexo cx={66} cy={51} rx={2.6} ry={1.4} />
      <Reflexo cx={90} cy={51} rx={2.6} ry={1.4} />
      <Reflexo cx={54} cy={36} rx={6} ry={2.6} />
    </g>
  ),
}
export const EXTRAS_CABECA = {
  antena: () => (
    <g>
      <T d="M80 45 L80 30" cor={ESCURO} sw={2.6} />
      <g
        className="kleoM-anim"
        style={{
          animation: 'kleoMAntena 2.4s ease-in-out infinite',
          transformOrigin: '80px 26px',
        }}
      >
        <V as="circle" cx="80" cy="26" r="5.5" cor="#d2e534" />
        <Reflexo cx={78} cy={24} rx={1.8} ry={1.1} />
      </g>
    </g>
  ),
  aparelho: () => (
    <g>
      <V d="M128 74 C138 74 140 90 132 96 C130 98 127 96 128 93 C132 88 132 80 126 79 Z" cor="#b7b2ff" />
      <circle cx="129" cy="95" r="2.4" fill={ESCURO} />
      <T d="M138 80 C142 84 142 90 138 94" cor="#b7b2ff" sw={1.6} />
    </g>
  ),
}
