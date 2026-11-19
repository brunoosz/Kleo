import { useEffect, useRef, useState } from 'react'
import { Phone, RotateCw } from 'lucide-react'
import LogoKleo from './LogoKleo'
const ENTRADA = 800
const SAIDA = 340
const FONTES_MAX = 2500
const FRASE_CARREGANDO = 2600
const FRASE_LENTA = 7000
const TENTAR_DE_NOVO = 20000
function revelarApp() {
  const html = document.documentElement
  html.setAttribute('data-abertura', 'revelando')
  setTimeout(() => {
    if (html.getAttribute('data-abertura') === 'revelando') html.removeAttribute('data-abertura')
  }, 700)
}
export default function Abertura({ pronto, onFim }) {
  const [montada, setMontada] = useState(false)
  const [fontes, setFontes] = useState(false)
  const [espera, setEspera] = useState(0)
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false)
  const [saindo, setSaindo] = useState(false)
  const fimRef = useRef(onFim)
  useEffect(() => {
    fimRef.current = onFim
  })
  useEffect(() => {
    let vivo = true
    const tempos = [
      setTimeout(() => setMontada(true), ENTRADA),
      setTimeout(() => setFontes(true), FONTES_MAX),
      setTimeout(() => setEspera(1), FRASE_CARREGANDO),
      setTimeout(() => setEspera(2), FRASE_LENTA),
      setTimeout(() => setEspera(3), TENTAR_DE_NOVO),
    ]
    const fontesProntas = document.fonts?.ready
    if (fontesProntas)
      fontesProntas.then(
        () => {
          if (vivo) setFontes(true)
        },
        () => {},
      )
    else tempos.push(setTimeout(() => setFontes(true), 0))
    const ligou = () => setOnline(true)
    const caiu = () => setOnline(false)
    window.addEventListener('online', ligou)
    window.addEventListener('offline', caiu)
    return () => {
      vivo = false
      tempos.forEach(clearTimeout)
      window.removeEventListener('online', ligou)
      window.removeEventListener('offline', caiu)
    }
  }, [])
  const podeSair = pronto && fontes && montada
  useEffect(() => {
    if (!podeSair || saindo) return
    let q1 = 0,
      q2 = 0
    const t = setTimeout(() => {
      q1 = requestAnimationFrame(() => {
        q2 = requestAnimationFrame(() => {
          setSaindo(true)
          revelarApp()
        })
      })
    }, 40)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(q1)
      cancelAnimationFrame(q2)
    }
  }, [podeSair, saindo])
  useEffect(() => {
    if (!saindo) return
    const t = setTimeout(() => fimRef.current?.(), SAIDA)
    return () => clearTimeout(t)
  }, [saindo])
  const esperando = montada
  const frase =
    espera === 0
      ? ''
      : espera === 1
        ? 'Carregando…'
        : online
          ? 'A internet está lenta, já já abre.'
          : 'Sem internet agora. Já já abre.'
  const classes = ['abertura', esperando ? 'abertura-esperando' : '', saindo ? 'abertura-saindo' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div
      className={classes}
      style={{
        ...styles.raiz,
        ...(saindo ? styles.raizSaindo : null),
      }}
    >
      <div className="abertura-cena" style={styles.cena}>
        <span className="abertura-halo" style={styles.halo} aria-hidden="true" />
        <span
          className="abertura-adesivo"
          style={{
            ...styles.adesivo,
            ...styles.adesivoLima,
          }}
          aria-hidden="true"
        />
        <span
          className="abertura-adesivo"
          style={{
            ...styles.adesivo,
            ...styles.adesivoCeu,
          }}
          aria-hidden="true"
        />
        <span
          className="abertura-adesivo"
          style={{
            ...styles.adesivo,
            ...styles.adesivoPeri,
          }}
          aria-hidden="true"
        />
        <h1 style={styles.titulo}>
          <LogoKleo tamanho={100} animado="rapido" />
        </h1>
      </div>

      <div style={styles.rodapeFrase}>
        <p role="status" aria-live="polite" style={styles.frase}>
          {frase && (
            <span key={frase} className="abertura-frase">
              {frase}
            </span>
          )}
        </p>
        {espera >= 3 && (
          <button
            type="button"
            className="abertura-frase tap"
            style={styles.tentar}
            onClick={() => window.location.reload()}
          >
            <RotateCw size={18} aria-hidden="true" /> Tentar de novo
          </button>
        )}
      </div>

      <div style={styles.rodape}>
        {espera >= 1 && (
          <a href="tel:192" className="abertura-frase tap" style={styles.emergencia}>
            <Phone size={16} aria-hidden="true" /> Emergência: ligar 192
          </a>
        )}
        <p className="abertura-by" style={styles.by}>
          by Kheo
        </p>
      </div>
    </div>
  )
}
const styles = {
  raiz: {
    position: 'fixed',
    inset: 0,
    zIndex: 9500,
    background: 'var(--bg)',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    overflow: 'hidden',
    transition: `opacity ${SAIDA}ms var(--ease-in-out)`,
  },
  raizSaindo: {
    opacity: 0,
    pointerEvents: 'none',
  },
  cena: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  titulo: {
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '100%',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 400,
    height: 400,
    margin: '-206px 0 0 -200px',
    borderRadius: '50%',
    pointerEvents: 'none',
    background:
      'radial-gradient(circle, rgba(216,209,255,0.95) 0%, rgba(216,209,255,0.45) 42%, rgba(216,209,255,0) 70%)',
  },
  adesivo: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    boxShadow: 'var(--sombra)',
  },
  adesivoLima: {
    width: 26,
    height: 26,
    background: 'var(--lima)',
    left: 'max(4px, calc(50% - 150px))',
    top: 'calc(50% - 104px)',
  },
  adesivoCeu: {
    width: 18,
    height: 18,
    background: 'var(--ceu)',
    left: 'min(calc(100% - 22px), calc(50% + 128px))',
    top: 'calc(50% + 40px)',
  },
  adesivoPeri: {
    width: 13,
    height: 13,
    background: 'var(--lavanda-forte)',
    left: 'calc(50% + 96px)',
    top: 'calc(50% - 112px)',
  },
  rodapeFrase: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 'calc(50% + 86px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  frase: {
    minHeight: 26,
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-2)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  tentar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    padding: '0 22px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--text)',
    color: 'var(--bg)',
    fontSize: 16,
    fontWeight: 700,
  },
  rodape: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 'max(20px, env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  emergencia: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '0 16px',
    borderRadius: 'var(--r-btn)',
    background: 'rgba(217,45,52,0.1)',
    color: '#b3261e',
    fontSize: 15,
    fontWeight: 700,
  },
  by: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-3)',
  },
}
