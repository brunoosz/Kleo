import { V, T, Reflexo } from './Vol'
const ARMACAO = '#3a3647'
const VIDRO = '#e6f4ff'
export const OCULOS = {
  nenhum: () => null,
  redondo: () => (
    <g>
      <T d="M48 87 L34 84 M112 87 L126 84" cor={ARMACAO} sw={2.4} />
      <circle cx="62" cy="90" r="14" fill={VIDRO} opacity="0.28" />
      <circle cx="98" cy="90" r="14" fill={VIDRO} opacity="0.28" />
      <circle cx="62" cy="90" r="14" fill="none" stroke={ARMACAO} strokeWidth="3" />
      <circle cx="98" cy="90" r="14" fill="none" stroke={ARMACAO} strokeWidth="3" />
      <T d="M76 88 Q80 84 84 88" cor={ARMACAO} sw={2.6} />
      <T d="M53 82 Q56 79 60 79" cor="#ffffff" sw={1.6} />
      <T d="M89 82 Q92 79 96 79" cor="#ffffff" sw={1.6} />
    </g>
  ),
  quadrado: () => (
    <g>
      <T d="M47 86 L34 84 M113 86 L126 84" cor={ARMACAO} sw={2.4} />
      <rect x="47" y="77" width="30" height="25" rx="8" fill={VIDRO} opacity="0.28" />
      <rect x="83" y="77" width="30" height="25" rx="8" fill={VIDRO} opacity="0.28" />
      <rect x="47" y="77" width="30" height="25" rx="8" fill="none" stroke={ARMACAO} strokeWidth="3.2" />
      <rect x="83" y="77" width="30" height="25" rx="8" fill="none" stroke={ARMACAO} strokeWidth="3.2" />
      <T d="M77 86 Q80 83 83 86" cor={ARMACAO} sw={2.8} />
      <T d="M52 83 L57 80" cor="#ffffff" sw={1.6} />
      <T d="M88 83 L93 80" cor="#ffffff" sw={1.6} />
    </g>
  ),
  sol: () => (
    <g>
      <T d="M46 85 L33 83 M114 85 L127 83" cor={ARMACAO} sw={2.6} />
      <V
        d="M45 82 C45 78 77 78 77 82 C77 96 72 103 61 103 C50 103 45 96 45 82 Z"
        cor="#2a2638"
        sw={2.2}
        borda={ARMACAO}
      />
      <V
        d="M83 82 C83 78 115 78 115 82 C115 96 110 103 99 103 C88 103 83 96 83 82 Z"
        cor="#2a2638"
        sw={2.2}
        borda={ARMACAO}
      />
      <T d="M77 84 Q80 81 83 84" cor={ARMACAO} sw={2.6} />
      <T d="M51 86 L58 82 M89 86 L96 82" cor="#ffffff" sw={2} opacity="0.75" />
      <Reflexo cx={70} cy={96} rx={2} ry={1.2} opacidade={0.5} />
      <Reflexo cx={108} cy={96} rx={2} ry={1.2} opacidade={0.5} />
    </g>
  ),
  protecao: () => (
    <g>
      <T d="M40 88 L30 86 M120 88 L130 86" cor="#5a5670" sw={4} />
      <V
        as="rect"
        x="40"
        y="75"
        width="80"
        height="30"
        rx="15"
        cor="#bfe6ff"
        sw={3.4}
        borda="#5a5670"
        opacity="0.6"
      />
      <rect x="40" y="75" width="80" height="30" rx="15" fill="none" stroke="#5a5670" strokeWidth="3.4" />
      <T d="M80 76 L80 104" cor="#5a5670" sw={2.4} />
      <T d="M48 84 L56 79 M88 84 L96 79" cor="#ffffff" sw={2} />
    </g>
  ),
  vr: () => (
    <g>
      <T d="M38 90 L28 88 M122 90 L132 88" cor={ARMACAO} sw={4} />
      <V as="rect" x="38" y="73" width="84" height="34" rx="15" cor="#ffffff" />
      <V as="rect" x="45" y="78" width="70" height="24" rx="11" cor="#b7b2ff" sw={0.8} />
      <circle cx="62" cy="90" r="3" fill="#d2e534" />
      <circle cx="98" cy="90" r="3" fill="#d2e534" />
      <T d="M70 96 Q80 100 90 96" cor="#ffffff" sw={1.6} opacity="0.8" />
      <Reflexo cx={54} cy={82} rx={4} ry={1.6} />
    </g>
  ),
}
