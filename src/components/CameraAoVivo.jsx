import { useEffect, useRef, useState } from 'react'
import { Camera, ScanEye, SwitchCamera, RefreshCw, CameraOff } from 'lucide-react'
import { BotaoIcone, Botao } from './ui'
import { paraDataURL, arquivoParaDataURL } from '../lib/imagem'
function estadoInicial() {
  if (typeof window === 'undefined') return 'indisponivel'
  if (window.isSecureContext === false) return 'inseguro'
  if (!navigator.mediaDevices?.getUserMedia) return 'indisponivel'
  return 'iniciando'
}
export default function CameraAoVivo({ onFoto, simples = false, frenteInicial = false }) {
  const videoRef = useRef(null)
  const inputRef = useRef(null)
  const [estado, setEstado] = useState(estadoInicial)
  const [frente, setFrente] = useState(frenteInicial)
  const [tentativa, setTentativa] = useState(0)
  useEffect(() => {
    if (estado === 'inseguro' || estado === 'indisponivel') return
    let fluxo = null
    let cancelado = false
    const pedir = video =>
      navigator.mediaDevices.getUserMedia({
        video,
        audio: false,
      })
    const ideal = {
      facingMode: {
        ideal: frente ? 'user' : 'environment',
      },
      width: {
        ideal: 1280,
      },
      height: {
        ideal: 960,
      },
    }
    pedir(ideal)
      .catch(e =>
        e?.name === 'OverconstrainedError' || e?.name === 'NotReadableError'
          ? pedir(true)
          : Promise.reject(e),
      )
      .then(s => {
        if (cancelado) {
          s.getTracks().forEach(t => t.stop())
          return
        }
        fluxo = s
        const v = videoRef.current
        if (v) {
          v.srcObject = s
          v.play?.().catch(() => {})
        }
        setEstado('ativo')
      })
      .catch(e => {
        if (cancelado) return
        const n = e?.name
        setEstado(
          n === 'NotAllowedError' || n === 'SecurityError'
            ? 'negado'
            : n === 'NotReadableError'
              ? 'ocupada'
              : 'indisponivel',
        )
      })
    return () => {
      cancelado = true
      fluxo?.getTracks().forEach(t => t.stop())
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frente, tentativa])
  const capturar = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    navigator.vibrate?.(30)
    onFoto?.(paraDataURL(v, v.videoWidth, v.videoHeight))
  }
  const tentarDeNovo = () => {
    setEstado('iniciando')
    setTentativa(t => t + 1)
  }
  const aoEscolher = async e => {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    try {
      onFoto?.(await arquivoParaDataURL(arq))
    } catch {}
  }
  const falhou = !['iniciando', 'ativo'].includes(estado)
  const MSG = {
    negado: {
      t: 'A câmera está bloqueada',
      d: 'Toque no cadeado ao lado do endereço do site, libere a Câmera e tente de novo.',
    },
    ocupada: {
      t: 'A câmera está em uso',
      d: 'Feche outro app ou aba que esteja usando a câmera e tente de novo.',
    },
    inseguro: {
      t: 'Câmera ao vivo precisa de conexão segura',
      d: 'Abra o app com https (no PC rode "npm run celular" e use o endereço https que aparecer).',
    },
    indisponivel: {
      t: 'Não encontrei a câmera',
      d: 'Tente de novo ou use a câmera do celular.',
    },
  }
  return (
    <div style={styles.coluna}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={aoEscolher}
        style={{
          display: 'none',
        }}
      />

      {!falhou ? (
        <div style={styles.visor}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              ...styles.video,
              transform: frente ? 'scaleX(-1)' : 'none',
              opacity: estado === 'ativo' ? 1 : 0,
            }}
          />
          {estado !== 'ativo' && (
            <div className="anim-fade" style={styles.espera}>
              <ScanEye size={34} color="#000" aria-hidden="true" />
              <span>Abrindo a câmera...</span>
            </div>
          )}
          <Cantos />
          <div style={styles.troca}>
            <BotaoIcone
              icone={SwitchCamera}
              label="Trocar câmera"
              onClick={() => {
                setEstado('iniciando')
                setFrente(f => !f)
              }}
            />
          </div>
          <button
            type="button"
            onClick={capturar}
            disabled={estado !== 'ativo'}
            className="tap camVivo-obturador"
            style={{
              ...styles.obturador,
              width: simples ? 84 : 74,
              height: simples ? 84 : 74,
              opacity: estado === 'ativo' ? 1 : 0.5,
            }}
            aria-label="Tirar foto"
          >
            <span style={styles.miolo}>
              <Camera size={simples ? 30 : 26} color="#fff" aria-hidden="true" />
            </span>
          </button>
        </div>
      ) : (
        <div
          className="anim-scale"
          style={{
            ...styles.visor,
            ...styles.falha,
          }}
          role="alert"
        >
          <CameraOff size={34} aria-hidden="true" />
          <strong
            style={{
              fontSize: simples ? 20 : 18,
            }}
          >
            {MSG[estado]?.t}
          </strong>
          <span style={styles.falhaTexto}>{MSG[estado]?.d}</span>
          <div style={styles.falhaAcoes}>
            {estado !== 'inseguro' && (
              <Botao icone={RefreshCw} onClick={tentarDeNovo}>
                Tentar de novo
              </Botao>
            )}
            <Botao variante="fantasma" icone={Camera} onClick={() => inputRef.current?.click()}>
              Câmera do celular
            </Botao>
          </div>
        </div>
      )}
      <style>{css}</style>
    </div>
  )
}
function Cantos() {
  const base = {
    ...styles.canto,
    borderColor: '#fff',
  }
  return (
    <>
      <span
        className="camVivo-canto"
        style={{
          ...base,
          top: 16,
          left: 16,
          borderRight: 'none',
          borderBottom: 'none',
          '--dx': '4px',
          '--dy': '4px',
        }}
      />
      <span
        className="camVivo-canto"
        style={{
          ...base,
          top: 16,
          right: 16,
          borderLeft: 'none',
          borderBottom: 'none',
          '--dx': '-4px',
          '--dy': '4px',
        }}
      />
      <span
        className="camVivo-canto"
        style={{
          ...base,
          bottom: 16,
          left: 16,
          borderRight: 'none',
          borderTop: 'none',
          '--dx': '4px',
          '--dy': '-4px',
        }}
      />
      <span
        className="camVivo-canto"
        style={{
          ...base,
          bottom: 16,
          right: 16,
          borderLeft: 'none',
          borderTop: 'none',
          '--dx': '-4px',
          '--dy': '-4px',
        }}
      />
    </>
  )
}
const css = `
.camVivo-obturador { animation: camVivoAnel 2.4s var(--ease-in-out) infinite; }
.camVivo-canto { animation: camVivoCanto 2.4s var(--ease-in-out) infinite; pointer-events: none; }
@keyframes camVivoAnel { 0%,100% { box-shadow: 0 0 0 6px rgba(216,209,255,0.9), var(--sombra); } 50% { box-shadow: 0 0 0 12px rgba(216,209,255,0.35), var(--sombra); } }
@keyframes camVivoCanto { 0%,100% { transform: none; opacity: 0.85; } 50% { transform: translate(var(--dx), var(--dy)); opacity: 1; } }
`
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  visor: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: 'var(--r-card-m)',
    background: '#1d1b22',
    overflow: 'hidden',
    boxShadow: 'var(--sombra)',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.4s',
  },
  espera: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 16,
    fontWeight: 600,
    color: '#000',
    background: 'var(--surface-2)',
  },
  canto: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 3,
    borderStyle: 'solid',
    borderRadius: 8,
    opacity: 0.85,
  },
  troca: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  obturador: {
    position: 'absolute',
    left: '50%',
    bottom: 18,
    transform: 'translateX(-50%)',
    borderRadius: '50%',
    background: '#fff',
    padding: 5,
    display: 'flex',
  },
  miolo: {
    flex: 1,
    borderRadius: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  falha: {
    background: 'var(--lavanda)',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    textAlign: 'center',
    aspectRatio: 'auto',
    minHeight: 240,
  },
  falhaTexto: {
    fontSize: 15,
    lineHeight: 1.4,
    maxWidth: 340,
  },
  falhaAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
}
