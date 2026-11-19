import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Volume2, Timer, Check } from 'lucide-react'
import { falar, pararFala } from '../lib/voz'
import { criarTimer } from '../components/profissao/util'
import Camada from '../components/Camada'
function minutosDoPasso(texto) {
  const m = String(texto).match(/(\d+)\s*(?:a\s*\d+\s*)?(min|minuto|minutos|hora|horas|h)\b/i)
  if (!m) return null
  const n = Number(m[1])
  return /^h/i.test(m[2]) ? n * 60 : n
}
export default function ModoCozinhar({ receita, onFechar, saindo = false, forcarVoz = false }) {
  const [passo, setPasso] = useState(0)
  const [direcao, setDirecao] = useState('anim-right')
  const [timerCriado, setTimerCriado] = useState(null)
  const total = receita.passos.length
  const texto = receita.passos[passo]
  const minutos = minutosDoPasso(texto)
  const fecharRef = useRef(onFechar)
  useEffect(() => {
    fecharRef.current = onFechar
  })
  useEffect(() => {
    falar(`Passo ${passo + 1}. ${receita.passos[passo]}`, {
      forcar: forcarVoz,
    })
  }, [passo, receita, forcarVoz])
  useEffect(() => {
    let trava = null
    navigator.wakeLock
      ?.request('screen')
      .then(t => {
        trava = t
      })
      .catch(() => {})
    const tecla = e => {
      if (e.key === 'Escape') fecharRef.current?.()
    }
    window.addEventListener('keydown', tecla)
    return () => {
      pararFala()
      trava?.release?.().catch?.(() => {})
      window.removeEventListener('keydown', tecla)
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
            <div
              style={{
                minWidth: 0,
              }}
            >
              <p style={styles.rotulo}>Modo cozinhar</p>
              <p style={styles.nome}>{receita.nome}</p>
            </div>
            <button
              onClick={onFechar}
              className="tap"
              style={styles.fechar}
              aria-label="Fechar modo cozinhar"
            >
              <X size={24} />
            </button>
          </div>

          <div style={styles.barra} aria-hidden="true">
            {receita.passos.map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.segmento,
                  background: i <= passo ? '#000' : 'var(--lavanda)',
                  transform: i === passo ? 'scaleY(1.6)' : 'none',
                }}
              />
            ))}
          </div>

          <div style={styles.centro} key={passo} className={direcao} aria-live="polite">
            <p style={styles.numero}>
              Passo {passo + 1} de {total}
            </p>
            <p style={styles.texto}>{texto}</p>
            {minutos && (
              <button
                onClick={iniciarTimer}
                disabled={timerCriado === passo}
                className="tap anim-up"
                style={{
                  ...styles.timer,
                  animationDelay: '0.12s',
                }}
              >
                {timerCriado === passo ? <Check size={20} /> : <Timer size={20} />}
                <span>
                  {timerCriado === passo
                    ? `Temporizador de ${minutos} min ligado`
                    : `Ligar temporizador de ${minutos} min`}
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
            className="tap"
            style={styles.ouvir}
          >
            <Volume2 size={20} /> <span>Ouvir este passo</span>
          </button>

          <div style={styles.rodape}>
            <button
              onClick={() => ir(passo - 1)}
              disabled={passo === 0}
              className="tap"
              style={{
                ...styles.nav,
                ...styles.navFantasma,
                opacity: passo === 0 ? 0.35 : 1,
              }}
              aria-label="Passo anterior"
            >
              <ChevronLeft size={26} /> <span>Voltar</span>
            </button>
            {passo < total - 1 ? (
              <button
                onClick={() => ir(passo + 1)}
                className="tap"
                style={{
                  ...styles.nav,
                  background: '#000',
                  color: '#fff',
                }}
                aria-label="Próximo passo"
              >
                <span>Próximo</span> <ChevronRight size={26} />
              </button>
            ) : (
              <button
                onClick={() => {
                  falar('Receita concluída. Bom apetite!', {
                    forcar: forcarVoz,
                  })
                  onFechar()
                }}
                className="tap anim-pop"
                style={{
                  ...styles.nav,
                  background: 'var(--lima)',
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
    background: 'var(--bg)',
    display: 'flex',
    justifyContent: 'center',
  },
  caixa: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
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
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-3)',
  },
  nome: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.1,
    marginTop: 4,
  },
  fechar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
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
    height: 5,
    borderRadius: 5,
    transition: 'background .35s ease, transform .35s var(--ease-out)',
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
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  texto: {
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  timer: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    padding: '0 20px',
    borderRadius: 25,
    background: 'var(--lima)',
    color: '#000',
    fontSize: 16,
    fontWeight: 600,
  },
  ouvir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: 25,
    background: 'var(--lavanda)',
    color: '#000',
    fontSize: 17,
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
    borderRadius: 25,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 19,
    fontWeight: 700,
  },
  navFantasma: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    color: '#000',
  },
}
