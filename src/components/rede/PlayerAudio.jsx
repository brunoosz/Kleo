import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { formatarDuracao } from '../../lib/rede/util'
function gerarBarras(semente) {
  let h = 7
  for (const ch of String(semente)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const lista = []
  for (let i = 0; i < 28; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    const base = 0.3 + ((h >>> 8) % 70) / 100
    lista.push(Math.min(1, base * (0.65 + 0.35 * Math.sin(i / 2.2))))
  }
  return lista
}
let tocandoAgora = null
export default function PlayerAudio({
  src,
  duracao = 0,
  escuro = false,
  autoplay = false,
  simples = false,
  onFim,
  semente = '',
}) {
  const audio = useRef(null)
  const [tocando, setTocando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [atual, setAtual] = useState(0)
  const [velocidade, setVelocidade] = useState(1)
  const fimRef = useRef(onFim)
  useEffect(() => {
    fimRef.current = onFim
  })
  const barras = useMemo(() => gerarBarras(semente || src?.slice(-40) || 'x'), [semente, src])
  useEffect(() => {
    const a = new Audio(src)
    audio.current = a
    a.preload = /^https?:/i.test(src || '') && !autoplay ? 'none' : 'metadata'
    const tempo = () => {
      const total = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : duracao || 1
      setAtual(a.currentTime)
      setProgresso(Math.min(1, a.currentTime / total))
    }
    const fim = () => {
      setTocando(false)
      setProgresso(0)
      setAtual(0)
      if (tocandoAgora === a) tocandoAgora = null
      fimRef.current?.()
    }
    const pausa = () => setTocando(false)
    const toca = () => setTocando(true)
    a.addEventListener('timeupdate', tempo)
    a.addEventListener('ended', fim)
    a.addEventListener('pause', pausa)
    a.addEventListener('play', toca)
    if (autoplay) {
      tocandoAgora?.pause()
      tocandoAgora = a
      a.play().catch(() => {})
    }
    return () => {
      a.pause()
      a.removeEventListener('timeupdate', tempo)
      a.removeEventListener('ended', fim)
      a.removeEventListener('pause', pausa)
      a.removeEventListener('play', toca)
      if (tocandoAgora === a) tocandoAgora = null
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])
  const alternar = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) {
      if (tocandoAgora && tocandoAgora !== a) tocandoAgora.pause()
      tocandoAgora = a
      a.playbackRate = velocidade
      a.play().catch(() => {})
    } else a.pause()
  }
  const trocarVelocidade = () => {
    const nova = velocidade === 1 ? 1.5 : velocidade === 1.5 ? 2 : 1
    setVelocidade(nova)
    if (audio.current) audio.current.playbackRate = nova
  }
  const pular = e => {
    const a = audio.current
    if (!a) return
    const r = e.currentTarget.getBoundingClientRect()
    const fr = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const total = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : duracao
    if (total) a.currentTime = fr * total
  }
  const corCheia = escuro ? '#fff' : '#000'
  const corVazia = escuro ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)'
  const lado = simples ? 52 : 44
  const Icone = tocando ? Pause : Play
  return (
    <div style={styles.linha}>
      <button
        type="button"
        onClick={alternar}
        className="tap"
        style={{
          ...styles.play,
          width: lado,
          height: lado,
          background: escuro ? '#fff' : '#000',
          color: escuro ? '#000' : '#fff',
        }}
        aria-label={
          tocando ? 'Pausar mensagem de voz' : `Ouvir mensagem de voz de ${formatarDuracao(duracao)}`
        }
      >
        <Icone
          size={simples ? 24 : 20}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden="true"
          style={{
            marginLeft: tocando ? 0 : 2,
          }}
        />
      </button>
      <div style={styles.meio}>
        <div style={styles.ondas} onClick={pular} role="presentation">
          {barras.map((b, i) => (
            <span
              key={i}
              style={{
                ...styles.barra,
                height: `${Math.round(b * 100)}%`,
                background: progresso > 0 && i / barras.length < progresso ? corCheia : corVazia,
              }}
            />
          ))}
        </div>
        <div
          style={{
            ...styles.rodape,
            color: escuro ? 'rgba(255,255,255,0.8)' : 'var(--text-2)',
          }}
        >
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatarDuracao(tocando || atual ? atual : duracao)}
          </span>
          <button
            type="button"
            onClick={trocarVelocidade}
            style={{
              ...styles.vel,
              color: 'inherit',
              borderColor: corVazia,
            }}
            aria-label={`Velocidade ${velocidade}x`}
          >
            {velocidade}x
          </button>
        </div>
      </div>
    </div>
  )
}
const styles = {
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 210,
  },
  play: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  meio: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  ondas: {
    height: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 2.5,
    cursor: 'pointer',
  },
  barra: {
    flex: 1,
    minWidth: 2,
    borderRadius: 2,
    transition: 'background 0.15s',
  },
  rodape: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
    fontWeight: 600,
  },
  vel: {
    fontSize: 12,
    fontWeight: 800,
    padding: '1px 8px',
    borderRadius: 20,
    border: '1.5px solid',
    background: 'transparent',
  },
}
