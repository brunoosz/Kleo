import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Volume2, Timer, Check } from 'lucide-react'
import { falar, pararFala } from '../../lib/voz'
import { criarTimer } from './util'
import Camada from '../Camada'
function minutosDoPasso(texto) {
  const m = texto.match(/(\d+)\s*(?:a\s*\d+\s*)?(min|minuto|minutos|hora|horas|h)\b/i)
  if (!m) return null
  const n = Number(m[1])
  return /^h/i.test(m[2]) ? n * 60 : n
}
export default function ModoCozinhar({ receita, necessidade, onFechar, saindo = false }) {
  const [passo, setPasso] = useState(0)
  const [direcao, setDirecao] = useState('anim-right')
  const [timerCriado, setTimerCriado] = useState(null)
  const total = receita.passos.length
  const texto = receita.passos[passo]
  const minutos = minutosDoPasso(texto)
  const forcar = necessidade === 'visual'
  useEffect(() => {
    falar(`Passo ${passo + 1}. ${receita.passos[passo]}`, {
      forcar,
    })
  }, [passo, receita, forcar])
  useEffect(() => {
    let trava = null
    navigator.wakeLock
      ?.request('screen')
      .then(t => {
        trava = t
      })
      .catch(() => {})
    return () => {
      pararFala()
      trava?.release?.().catch?.(() => {})
    }
  }, [])
  const ir = n => {
    setTimerCriado(null)
    setDirecao(n > passo ? 'anim-right' : 'anim-left')
    setPasso(n)
  }
  const iniciarTimer = () => {
    criarTimer(`${receita.nome} - passo ${passo + 1}`, minutos)
    setTimerCriado(passo)
  }
  return (
    <Camada>
      <div
        style={styles.fundo}
        className={saindo ? 'sheet-out' : 'sheet'}
        role="dialog"
        aria-modal="true"
        aria-label={`Modo cozinhar: ${receita.nome}`}
      >
        <div style={styles.caixa}>
          <div style={styles.topo}>
            <div>
              <p style={styles.rotulo}>Modo cozinhar</p>
              <p style={styles.nome}>{receita.nome}</p>
            </div>
            <button
              onClick={onFechar}
              className="prof-press"
              style={styles.fechar}
              aria-label="Fechar modo cozinhar"
            >
              <X size={22} />
            </button>
          </div>

          <div style={styles.barra} aria-hidden="true">
            {receita.passos.map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.segmento,
                  background: i <= passo ? 'var(--kleo)' : 'var(--control)',
                  transform: i === passo ? 'scaleY(1.6)' : 'none',
                }}
              />
            ))}
          </div>

          <div style={styles.centro} key={passo} className={direcao} aria-live="polite">
            <p style={styles.numero}>
              Passo{' '}
              <span
                className="valor-muda"
                style={{
                  display: 'inline-block',
                  color: 'var(--kleo)',
                }}
              >
                {passo + 1}
              </span>{' '}
              de {total}
            </p>
            <p style={styles.texto}>{texto}</p>

            {minutos && (
              <button
                onClick={iniciarTimer}
                disabled={timerCriado === passo}
                className="prof-press anim-up"
                style={{
                  ...styles.timer,
                  opacity: timerCriado === passo ? 0.7 : 1,
                  animationDelay: '0.12s',
                }}
              >
                <span
                  key={timerCriado === passo ? 'ok' : 'novo'}
                  className="anim-pop"
                  style={{
                    display: 'flex',
                  }}
                >
                  {timerCriado === passo ? <Check size={20} /> : <Timer size={20} />}
                </span>
                <span>
                  {timerCriado === passo
                    ? `Temporizador de ${minutos} min iniciado`
                    : `Iniciar temporizador de ${minutos} min`}
                </span>
              </button>
            )}
          </div>

          <button
            onClick={() =>
              falar(`Passo ${passo + 1}. ${texto}`, {
                forcar: true,
              })
            }
            className="prof-press"
            style={styles.ouvir}
          >
            <Volume2 size={20} /> <span>Ouvir este passo</span>
          </button>

          <div style={styles.rodape}>
            <button
              onClick={() => ir(passo - 1)}
              disabled={passo === 0}
              className="prof-press"
              style={{
                ...styles.nav,
                background: 'var(--control)',
                opacity: passo === 0 ? 0.35 : 1,
              }}
              aria-label="Passo anterior"
            >
              <ChevronLeft size={26} /> <span>Anterior</span>
            </button>
            {passo < total - 1 ? (
              <button
                onClick={() => ir(passo + 1)}
                className="prof-press"
                style={{
                  ...styles.nav,
                  background: 'var(--kleo)',
                }}
                aria-label="Próximo passo"
              >
                <span>Próximo</span> <ChevronRight size={26} />
              </button>
            ) : (
              <button
                onClick={() => {
                  falar('Receita concluída. Bom apetite!', {
                    forcar,
                  })
                  onFechar()
                }}
                className="prof-press anim-pop"
                style={{
                  ...styles.nav,
                  background: 'var(--green)',
                  color: '#000',
                }}
              >
                <Check size={24} /> <span>Concluir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'var(--black)',
    display: 'flex',
    justifyContent: 'center',
  },
  caixa: {
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 20px',
    paddingTop: 'max(20px, env(safe-area-inset-top))',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
  },
  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  rotulo: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--kleo)',
  },
  nome: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    marginTop: 2,
  },
  fechar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'var(--control)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  barra: {
    display: 'flex',
    gap: 4,
    marginTop: 18,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    transition: 'background 0.35s ease, transform 0.35s var(--ease-out)',
  },
  centro: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 18,
    overflowY: 'auto',
    padding: '20px 0',
  },
  numero: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--steel)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  texto: {
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
  },
  timer: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    padding: '0 20px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255,159,10,0.15)',
    color: 'var(--orange)',
    fontSize: 16,
    fontWeight: 600,
  },
  ouvir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 'var(--radius-pill)',
    background: 'var(--kleo-soft)',
    color: 'var(--kleo)',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  },
  rodape: {
    display: 'flex',
    gap: 12,
  },
  nav: {
    flex: 1,
    minHeight: 68,
    borderRadius: 'var(--radius-pill)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--white)',
  },
}
