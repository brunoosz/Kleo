import { useId, useMemo, useState } from 'react'
import { getMascoteSpec, resolverMascote } from '../data/mascotes'
import { ler } from '../lib/storage'
import { clarear, escurecer, contorno, acentoPara } from './mascote/cores'
import { V, T, Reflexo } from './mascote/Vol'
import { MascoteCtx } from './mascote/ctx'
import { CHAPEUS, EXTRAS_CABECA } from './mascote/chapeus'
import { ITENS } from './mascote/itens'
import { OCULOS } from './mascote/oculos'
import { ROUPAS } from './mascote/roupas'
import { LUGAR_ITEM, OCULOS_COBREM, MANGAS } from './mascote/meta'
const CORPO =
  'M80 44 C116 44 132 70 132 102 C132 136 112 154 80 154 C48 154 28 136 28 102 C28 70 44 44 80 44 Z'
const MAO = {
  x: 136,
  y: 124,
}
const CHAO = {
  x: 141,
  y: 161,
}
const TINTA = '#2a2638'
function idDoPerfil() {
  try {
    return resolverMascote(ler('kleo_profile', null), ler('kleo_mascote', null))
  } catch {
    return 'kleo'
  }
}
export default function Mascote({ id, estado = 'idle', tamanho = 120, semBrilho = false, spec: specExtra }) {
  const info = useMemo(() => getMascoteSpec(!id || id === 'auto' ? idDoPerfil() : id), [id])
  const s = {
    ...info.spec,
    ...(specExtra || {}),
  }
  const cor = s.cor || '#d8d1ff'
  const uid = 'kM' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const g = nome => `url(#${uid}-${nome})`
  const acento = acentoPara(cor)
  const c = {
    cor,
    acento,
    acentoEsc: escurecer(acento, 0.2),
    borda: contorno(acento),
  }
  const [estadoAnterior, setEstadoAnterior] = useState(estado)
  const [mudou, setMudou] = useState(false)
  if (estado !== estadoAnterior) {
    setEstadoAnterior(estado)
    setMudou(true)
  }
  const reacao = mudou
    ? {
        idle: 'kleoMAssenta 0.45s var(--ease-out, ease-out)',
        ouvindo: 'kleoMAtento 0.45s var(--spring, ease-out)',
        pensando: 'kleoMInclina 0.5s var(--ease-out, ease-out)',
        falando: 'kleoMPulo 0.5s var(--spring, ease-out)',
      }[estado]
    : 'none'
  const animCorpo =
    {
      idle: 'kleoMRespira 3.6s ease-in-out infinite',
      ouvindo: 'kleoMOuvir 1.4s ease-in-out infinite',
      pensando: 'kleoMPensar 2.2s ease-in-out infinite',
      falando: 'kleoMFalar 0.55s ease-in-out infinite',
    }[estado] || 'none'
  const Chapeu = CHAPEUS[s.chapeu] || CHAPEUS.nenhum
  const Item = ITENS[s.item] || ITENS.nenhum
  const Oculos = OCULOS[s.oculos] || OCULOS.nenhum
  const Roupa = ROUPAS[s.roupa] || ROUPAS.nenhuma
  const Extra = EXTRAS_CABECA[s.extra]
  const lugar = LUGAR_ITEM[s.item] || 'mao'
  const manga = MANGAS[s.roupa]
  const cadeira = s.extra === 'cadeira'
  const olhosCobertos = OCULOS_COBREM.includes(s.oculos)
  return (
    <div
      data-sem-inverter=""
      style={{
        ...styles.wrap,
        width: tamanho,
        height: tamanho,
      }}
      aria-hidden="true"
    >
      {!semBrilho && (
        <div
          className="kleoM-anim"
          style={{
            ...styles.glow,
            background: `radial-gradient(circle, ${cor}88 0%, ${cor}33 45%, transparent 70%)`,
            animation:
              estado === 'ouvindo'
                ? 'kleoMBrilho 1.2s ease-in-out infinite'
                : 'kleoMBrilho 4s ease-in-out infinite',
          }}
        />
      )}
      <div
        key={estado}
        style={{
          ...styles.reacao,
          animation: reacao,
        }}
      >
        <svg viewBox="0 0 160 170" width={tamanho} height={tamanho} style={styles.svg}>
          <defs>
            <radialGradient id={`${uid}-corpo`} cx="38%" cy="30%" r="78%" fx="32%" fy="22%">
              <stop offset="0%" stopColor={clarear(cor, 0.65)} />
              <stop offset="45%" stopColor={cor} />
              <stop offset="100%" stopColor={escurecer(cor, 0.24)} />
            </radialGradient>
            <radialGradient id={`${uid}-pe`} cx="40%" cy="30%" r="80%">
              <stop offset="0%" stopColor={clarear(cor, 0.3)} />
              <stop offset="100%" stopColor={escurecer(cor, 0.3)} />
            </radialGradient>

            <linearGradient id={`${uid}-brilho`} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="62%" stopColor="#1d1830" stopOpacity="0" />
              <stop offset="100%" stopColor="#1d1830" stopOpacity="0.16" />
            </linearGradient>
            <radialGradient id={`${uid}-spec`}>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="62%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id={`${uid}-ao`} cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="#1d1830" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1d1830" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-olho`} cx="42%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#5a5275" />
              <stop offset="55%" stopColor="#25202f" />
              <stop offset="100%" stopColor="#120f19" />
            </radialGradient>
            <radialGradient id={`${uid}-bochecha`}>
              <stop offset="0%" stopColor="#ff8fb1" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ff8fb1" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-sombra`}>
              <stop offset="0%" stopColor="#5b4d8a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#5b4d8a" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${uid}-clip`}>
              <path d={CORPO} />
            </clipPath>
          </defs>

          <ellipse
            cx="80"
            cy="161"
            rx="44"
            ry="6.5"
            fill={g('sombra')}
            className="kleoM-anim"
            style={{
              animation: estado === 'idle' ? 'kleoMSombra 3.6s ease-in-out infinite' : 'none',
              transformOrigin: '80px 161px',
            }}
          />

          <MascoteCtx.Provider value={uid}>
            <g
              className="kleoM-anim"
              style={{
                animation: animCorpo,
                transformOrigin: '80px 160px',
              }}
            >
              {cadeira && <CadeiraFundo />}

              <ellipse
                cx="62"
                cy="154"
                rx="12"
                ry="7"
                fill={g('pe')}
                stroke={contorno(cor)}
                strokeWidth="1.2"
                strokeOpacity="0.55"
              />
              <ellipse
                cx="98"
                cy="154"
                rx="12"
                ry="7"
                fill={g('pe')}
                stroke={contorno(cor)}
                strokeWidth="1.2"
                strokeOpacity="0.55"
              />

              <path d={CORPO} fill={g('corpo')} />
              <g clipPath={g('clip')}>
                <ellipse cx="80" cy="162" rx="64" ry="30" fill={g('ao')} />
                <path d={CORPO} fill="none" stroke={g('rim')} strokeWidth="9" />
                <Roupa {...c} />
              </g>
              <path d={CORPO} fill="none" stroke={contorno(cor)} strokeWidth="1.4" strokeOpacity="0.55" />

              <ellipse
                cx="58"
                cy="64"
                rx="16"
                ry="9"
                fill={g('spec')}
                transform="rotate(-38 58 64)"
                opacity="0.9"
              />
              <circle cx="70" cy="54" r="2.6" fill="#ffffff" opacity="0.9" />

              <Rosto estado={estado} g={g} semOlhos={olhosCobertos} />
              <Oculos {...c} />
              <Chapeu {...c} />
              {Extra && <Extra {...c} />}

              {lugar === 'peito' && <Item {...c} />}
              {lugar === 'chao' && (
                <g transform={`translate(${CHAO.x} ${CHAO.y}) scale(1.1)`}>
                  <Item {...c} />
                </g>
              )}

              <g
                className="kleoM-anim"
                style={{
                  animation: estado === 'falando' ? 'kleoMAceno 0.9s ease-in-out infinite' : 'none',
                  transformOrigin: '38px 110px',
                }}
              >
                <Braco
                  cx={30}
                  cy={118}
                  rot={-45}
                  manga={manga}
                  cor={cor}
                  g={g}
                  mao={{
                    x: 22,
                    y: 126,
                  }}
                />
              </g>

              <g
                className="kleoM-anim"
                style={{
                  animation: estado === 'idle' ? 'kleoMBraco 3.6s ease-in-out infinite' : 'none',
                  transformOrigin: '122px 110px',
                }}
              >
                {lugar === 'mao' && (
                  <g transform={`translate(${MAO.x} ${MAO.y}) scale(1.15)`}>
                    <Item {...c} />
                  </g>
                )}
                <Braco
                  cx={130}
                  cy={118}
                  rot={45}
                  manga={manga}
                  cor={cor}
                  g={g}
                  mao={{
                    x: 138,
                    y: 126,
                  }}
                />
              </g>

              {cadeira && <CadeiraFrente />}
            </g>

            {estado === 'ouvindo' && <Ondas cor={escurecer(cor, 0.45)} />}
            {estado === 'pensando' && <Bolhas cor={escurecer(cor, 0.35)} />}
          </MascoteCtx.Provider>
        </svg>
      </div>
      <style>{keyframes}</style>
    </div>
  )
}
function Rosto({ estado, g, semOlhos }) {
  const olhar = estado === 'pensando' ? 'translate(3px, -3px)' : 'none'
  const escala = estado === 'ouvindo' ? 'scale(1.1)' : 'scale(1)'
  return (
    <g>
      <ellipse cx="48" cy="104" rx="9" ry="5.5" fill={g('bochecha')} />
      <ellipse cx="112" cy="104" rx="9" ry="5.5" fill={g('bochecha')} />
      {!semOlhos && (
        <g
          style={{
            transform: olhar,
            transition: 'transform 0.35s ease',
          }}
        >
          <g
            className="kleoM-anim"
            style={{
              animation: 'kleoMPisca 5s infinite',
              transformOrigin: '80px 90px',
            }}
          >
            {[62, 98].map(x => (
              <g
                key={x}
                style={{
                  transform: escala,
                  transformOrigin: `${x}px 90px`,
                  transition: 'transform 0.3s ease',
                }}
              >
                <ellipse cx={x} cy="90" rx="8.6" ry="10.6" fill={g('olho')} />
                <circle cx={x + 3} cy="85" r="3.6" fill="#ffffff" />
                <circle cx={x - 3} cy="95.5" r="1.6" fill="#ffffff" opacity="0.8" />
              </g>
            ))}
          </g>
        </g>
      )}
      <Boca estado={estado} />
    </g>
  )
}
function Boca({ estado }) {
  if (estado === 'falando') {
    return (
      <g
        className="kleoM-anim"
        style={{
          animation: 'kleoMBocaIn 0.18s ease-out, kleoMBoca 0.32s ease-in-out 0.18s infinite',
          transformOrigin: '80px 105px',
        }}
      >
        <ellipse cx="80" cy="105" rx="5.6" ry="4.6" fill={TINTA} />
        <ellipse cx="80" cy="107.5" rx="3.4" ry="1.8" fill="#ff8fa8" />
      </g>
    )
  }
  if (estado === 'ouvindo') {
    return <ellipse cx="80" cy="105" rx="3.2" ry="3.6" fill={TINTA} style={styles.trocaBoca} />
  }
  if (estado === 'pensando') {
    return (
      <T
        d="M74.5 105 Q77.5 102.5 80.5 105 Q83.5 107.5 86 105"
        cor={TINTA}
        sw={2.4}
        style={styles.trocaBoca}
      />
    )
  }
  return (
    <g style={styles.trocaBoca}>
      <path
        d="M72.5 101.5 Q80 112 87.5 101.5 Q80 104.5 72.5 101.5 Z"
        fill={TINTA}
        stroke={TINTA}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M76.5 106.2 Q80 104.6 83.5 106.2 Q80 108.4 76.5 106.2 Z" fill="#ff8fa8" />
    </g>
  )
}
function Braco({ cx, cy, rot, manga, cor, g, mao }) {
  return (
    <g>
      {manga ? (
        <>
          <V
            as="ellipse"
            cx={cx}
            cy={cy}
            rx="11"
            ry="7.2"
            cor={manga}
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
          <circle
            cx={mao.x}
            cy={mao.y}
            r="5.4"
            fill={g('corpo')}
            stroke={contorno(cor)}
            strokeWidth="1"
            strokeOpacity="0.55"
          />
        </>
      ) : (
        <ellipse
          cx={cx}
          cy={cy}
          rx="11"
          ry="7.2"
          fill={g('corpo')}
          stroke={contorno(cor)}
          strokeWidth="1.2"
          strokeOpacity="0.55"
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      )}
      <Reflexo cx={cx + (rot > 0 ? -3 : 3)} cy={cy - 3} rx={2.6} ry={1.2} rot={rot} opacidade={0.6} />
    </g>
  )
}
function CadeiraFundo() {
  return (
    <g>
      <V as="rect" x="18" y="82" width="11" height="62" rx="5.5" cor="#a9adbd" />
      <V as="rect" x="22" y="138" width="96" height="8" rx="4" cor="#c9ccd8" />
      <T d="M112 146 L116 154" cor="#8d91a3" sw={3} />
      <V as="circle" cx="117" cy="157.5" r="4.6" cor="#3a3647" />
    </g>
  )
}
function CadeiraFrente() {
  return (
    <g>
      <circle cx="42" cy="138" r="21" fill="none" stroke="#3a3647" strokeWidth="5.5" />
      <circle cx="42" cy="138" r="16.5" fill="none" stroke="#d9dbe3" strokeWidth="2" />
      <T d="M42 122 L42 154 M26 138 L58 138 M31 127 L53 149 M53 127 L31 149" cor="#c9ccd8" sw={1.2} />
      <V as="circle" cx="42" cy="138" r="4.2" cor="#89cdf3" />
      <T d="M28 124 Q34 119 42 118" cor="#ffffff" sw={1.4} opacity="0.6" />
    </g>
  )
}
function Ondas({ cor }) {
  return (
    <g fill="none" stroke={cor} strokeWidth="2.6" strokeLinecap="round">
      <path
        d="M17 80 Q11 90 17 100"
        className="kleoM-anim"
        style={{
          animation: 'kleoMOnda 1.2s ease-out infinite',
          transformOrigin: '20px 90px',
        }}
      />
      <path
        d="M9 73 Q-1 90 9 107"
        className="kleoM-anim"
        style={{
          animation: 'kleoMOnda 1.2s 0.3s ease-out infinite',
          transformOrigin: '20px 90px',
        }}
      />
    </g>
  )
}
function Bolhas({ cor }) {
  return (
    <g>
      {[
        [124, 42, 3],
        [133, 30, 4.4],
        [146, 15, 7],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill="#ffffff"
          stroke={cor}
          strokeWidth="1.4"
          className="kleoM-anim"
          style={{
            animation: `kleoMBolha 1.4s ${i * 0.22}s ease-in-out infinite`,
            transformOrigin: `${x}px ${y}px`,
          }}
        />
      ))}
    </g>
  )
}
const keyframes = `
@keyframes kleoMRespira { 0%,100% { transform: scale(1, 1) } 50% { transform: scale(0.988, 1.022) } }
@keyframes kleoMOuvir { 0%,100% { transform: rotate(-3deg) scale(1.01) } 50% { transform: rotate(-1deg) scale(1.03) } }
@keyframes kleoMPensar { 0%,100% { transform: rotate(-2.5deg) } 50% { transform: rotate(2.5deg) } }
@keyframes kleoMFalar { 0%,100% { transform: translateY(0) scale(1, 1) } 50% { transform: translateY(-2.5px) scale(0.99, 1.015) } }
@keyframes kleoMSombra { 0%,100% { transform: scale(1, 1) } 50% { transform: scale(1.03, 1) } }
@keyframes kleoMPisca { 0%,93%,100% { transform: scaleY(1) } 96% { transform: scaleY(0.08) } }
@keyframes kleoMBoca { 0%,100% { transform: scaleY(0.5) } 50% { transform: scaleY(1.15) } }
@keyframes kleoMBocaIn { from { opacity: 0; transform: scale(0.4, 0.2) } to { opacity: 1; transform: none } }
@keyframes kleoMAceno { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(24deg) } }
@keyframes kleoMBraco { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-4deg) } }
@keyframes kleoMOnda { 0% { opacity: 0; transform: scale(0.8) } 40% { opacity: 1 } 100% { opacity: 0; transform: scale(1.15) } }
@keyframes kleoMBolha { 0%,100% { opacity: 0.35; transform: translateY(0) scale(0.92) } 50% { opacity: 1; transform: translateY(-2px) scale(1) } }
@keyframes kleoMAntena { 0%,100% { transform: scale(1) } 50% { transform: scale(1.18) } }
@keyframes kleoMBrilho { 0%,100% { transform: scale(0.92); opacity: 0.7 } 50% { transform: scale(1.1); opacity: 1 } }
@keyframes kleoMRostoIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes kleoMPulo { 0% { transform: none } 30% { transform: translateY(-9px) scale(1.04, 0.97) } 60% { transform: translateY(1px) scale(0.98, 1.02) } 100% { transform: none } }
@keyframes kleoMAtento { 0% { transform: none } 45% { transform: scale(1.08) } 100% { transform: none } }
@keyframes kleoMInclina { 0% { transform: none } 50% { transform: rotate(-6deg) translateY(-2px) } 100% { transform: none } }
@keyframes kleoMAssenta { 0% { transform: translateY(-3px) } 100% { transform: none } }
@media (prefers-reduced-motion: reduce) { .kleoM-anim { animation: none !important; } }
`
const styles = {
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glow: {
    position: 'absolute',
    inset: '-18%',
    borderRadius: '50%',
    pointerEvents: 'none',
    transition: 'opacity 0.4s ease',
  },
  reacao: {
    position: 'relative',
    display: 'flex',
    transformOrigin: '50% 85%',
  },
  svg: {
    overflow: 'visible',
    position: 'relative',
  },
  trocaBoca: {
    animation: 'kleoMBocaIn 0.22s ease-out',
    transformOrigin: '80px 105px',
  },
}
