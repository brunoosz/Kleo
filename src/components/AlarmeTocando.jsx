import { useEffect, useRef, useState } from 'react'
import { AlarmClock, BellOff, TimerReset } from 'lucide-react'
import Camada from './Camada'
import Mascote from './Mascote'
import { Botao } from './ui'
import useModoSimples from '../hooks/useModoSimples'
import { ler } from '../lib/storage'
import { falar, pararFala } from '../lib/voz'
import { resumoFalado } from '../lib/alarmes'
import { resolverMascote } from '../data/mascotes'
import { temNecessidade } from '../lib/perfil'
function criarToque() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx)
    return {
      parar() {},
    }
  const ctx = new Ctx()
  ctx.resume?.().catch(() => {})
  const notas = [659.25, 783.99, 1046.5, 783.99]
  let volta = 0
  let vivo = true
  const tocar = () => {
    if (!vivo) return
    const vol = Math.min(0.5, 0.12 + volta * 0.04)
    const t0 = ctx.currentTime + 0.05
    notas.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      const t = t0 + i * 0.22
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      osc.connect(g).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.55)
    })
    navigator.vibrate?.([300, 120, 300])
    volta++
  }
  tocar()
  const id = setInterval(tocar, 1700)
  return {
    parar() {
      vivo = false
      clearInterval(id)
      navigator.vibrate?.(0)
      setTimeout(() => ctx.close?.().catch(() => {}), 600)
    },
  }
}
export default function AlarmeTocando({ alarme, onParar, onSoneca }) {
  const simples = useModoSimples()
  const toque = useRef(null)
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    toque.current = criarToque()
    const relogio = setInterval(() => setAgora(new Date()), 1000)
    const limite = setTimeout(() => {
      toque.current?.parar()
      onParar?.({
        silencioso: true,
      })
    }, 5 * 60000)
    return () => {
      toque.current?.parar()
      clearInterval(relogio)
      clearTimeout(limite)
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarme?.id])
  if (!alarme) return null
  const profile = ler('kleo_profile', {}) || {}
  const mascote = resolverMascote(profile, ler('kleo_mascote', 'auto'))
  const surdo = temNecessidade(profile, 'auditiva')
  const parar = () => {
    toque.current?.parar()
    onParar?.()
    if (!surdo) {
      pararFala()
      const nome = String(profile.name || '')
        .trim()
        .split(' ')[0]
      setTimeout(
        () =>
          falar(resumoFalado(nome), {
            forcar: true,
            mascote,
          }).catch(() => {}),
        350,
      )
    }
  }
  const adiar = () => {
    toque.current?.parar()
    onSoneca?.()
  }
  return (
    <Camada>
      <div
        role="alertdialog"
        aria-live="assertive"
        aria-label={`Despertador ${alarme.hora}`}
        className="anim-fade"
        style={styles.fundo}
      >
        <div className="anim-pop" style={styles.miolo}>
          <span style={styles.rotulo}>
            <AlarmClock size={20} aria-hidden="true" /> Despertador
          </span>
          <strong
            style={{
              ...styles.hora,
              fontSize: simples ? 84 : 76,
            }}
          >
            {agora.toTimeString().slice(0, 5)}
          </strong>
          {alarme.rotulo && (
            <span
              style={{
                ...styles.texto,
                fontSize: simples ? 24 : 21,
              }}
            >
              {alarme.rotulo}
            </span>
          )}
          <div
            style={{
              margin: '18px 0 8px',
            }}
          >
            <Mascote id={mascote} tamanho={simples ? 170 : 150} estado="falando" />
          </div>
          <div style={styles.acoes}>
            <Botao variante="primario" grande cheio icone={BellOff} onClick={parar}>
              Parar
            </Botao>
            <Botao variante="fantasma" grande cheio icone={TimerReset} onClick={adiar}>
              Soneca 5 min
            </Botao>
          </div>
          {!surdo && <span style={styles.dica}>Ao parar, a Kleo conta como está o seu dia.</span>}
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 9600,
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  miolo: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  rotulo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  hora: {
    fontWeight: 800,
    lineHeight: 1,
    marginTop: 10,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.03em',
  },
  texto: {
    fontWeight: 700,
    marginTop: 8,
    overflowWrap: 'anywhere',
  },
  acoes: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
  },
  dica: {
    fontSize: 15,
    color: 'var(--text-2)',
    marginTop: 14,
  },
}
