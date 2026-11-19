import { useRef, useState } from 'react'
import { Image as ImageIcon, ArrowUp, RefreshCw, ScanEye } from 'lucide-react'
import { Sheet, Botao, Chip } from './ui'
import CameraAoVivo from './CameraAoVivo'
import { arquivoParaDataURL } from '../lib/imagem'
const PERGUNTAS = [
  'O que é isso?',
  'Leia o texto para mim',
  'Qual a validade?',
  'Descreva o ambiente',
  'Isso é seguro?',
]
const PERGUNTAS_SIMPLES = ['O que é isso?', 'Leia para mim']
export default function ChatCamera({ aberto, onFechar, onEnviar, simples = false }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Câmera Kleo">
      <ConteudoCamera onEnviar={onEnviar} simples={simples} />
    </Sheet>
  )
}
function ConteudoCamera({ onEnviar, simples }) {
  const inputGaleria = useRef(null)
  const [foto, setFoto] = useState(null)
  const [pergunta, setPergunta] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [flash, setFlash] = useState(0)
  const alvo = simples ? 56 : 48
  const escolher = async e => {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    setErro('')
    setCarregando(true)
    try {
      setFoto(await arquivoParaDataURL(arquivo))
    } catch {
      setErro('Não consegui abrir essa imagem. Tente outra.')
    } finally {
      setCarregando(false)
    }
  }
  const enviar = texto => {
    if (!foto) return
    onEnviar(foto, (texto ?? pergunta).trim())
  }
  const perguntas = simples ? PERGUNTAS_SIMPLES : PERGUNTAS
  return (
    <div style={styles.root}>
      <p
        style={{
          ...styles.subtitulo,
          fontSize: simples ? 18 : 16,
        }}
      >
        {simples
          ? 'Tire uma foto. Eu digo o que vejo.'
          : 'Mostre algo e eu te digo o que vejo: rótulos, remédios, placas, documentos.'}
      </p>

      <input
        ref={inputGaleria}
        type="file"
        accept="image/*"
        onChange={escolher}
        style={{
          display: 'none',
        }}
      />

      {!foto ? (
        <div key="visor" className="anim-tab" style={styles.coluna}>
          <CameraAoVivo
            simples={simples}
            onFoto={f => {
              setFlash(n => n + 1)
              setFoto(f)
            }}
          />
          <Botao
            variante="fantasma"
            icone={ImageIcon}
            cheio
            carregando={carregando}
            onClick={() => inputGaleria.current?.click()}
          >
            Escolher da galeria
          </Botao>
        </div>
      ) : (
        <div key="foto" style={styles.coluna}>
          <div className="anim-scale" style={styles.previewWrap}>
            <img
              key={flash}
              src={foto}
              alt="Pré-visualização da foto"
              className="chatCam-revela"
              style={styles.preview}
            />
            <button
              type="button"
              onClick={() => setFoto(null)}
              className="anim-fade tap"
              style={{
                ...styles.trocar,
                minHeight: simples ? 52 : 42,
                fontSize: simples ? 17 : 15,
                animationDelay: '0.25s',
              }}
              aria-label="Tirar outra foto"
            >
              <RefreshCw size={16} aria-hidden="true" /> Outra foto
            </button>
          </div>

          <div style={styles.chips}>
            {perguntas.map((p, i) => (
              <span
                key={p}
                className="anim-up"
                style={{
                  display: 'flex',
                  animationDelay: `${0.12 + i * 0.05}s`,
                }}
              >
                <Chip cor={i % 3 === 0 ? 'lavanda' : i % 3 === 1 ? 'ceu' : 'lima'} onClick={() => enviar(p)}>
                  {p}
                </Chip>
              </span>
            ))}
          </div>

          <form
            onSubmit={e => {
              e.preventDefault()
              enviar()
            }}
            className="anim-up"
            style={{
              ...styles.form,
              animationDelay: '0.3s',
            }}
          >
            <input
              value={pergunta}
              onChange={e => setPergunta(e.target.value)}
              placeholder={simples ? 'Ou escreva aqui' : 'Pergunte algo sobre a foto'}
              aria-label="Pergunta sobre a foto"
              style={{
                ...styles.input,
                height: alvo,
                fontSize: simples ? 18 : 16,
              }}
            />
            <button
              type="submit"
              className="tap"
              style={{
                ...styles.enviar,
                width: alvo,
                height: alvo,
              }}
              aria-label="Enviar foto para a Kleo"
            >
              <ArrowUp size={22} color="#fff" aria-hidden="true" />
            </button>
          </form>
          {simples && (
            <Botao grande cheio icone={ScanEye} onClick={() => enviar()}>
              Enviar para a Kleo
            </Botao>
          )}
        </div>
      )}

      {erro && (
        <p key={erro} className="shake" style={styles.erro} role="alert">
          {erro}
        </p>
      )}
      <style>{estilosLocais}</style>
    </div>
  )
}
const estilosLocais = `
.chatCam-obturador { animation: chatCamAnel 2.4s var(--ease-in-out) infinite; }
.chatCam-carregando { animation: chatCamCarrega 0.9s ease-in-out infinite; }
.chatCam-canto { animation: chatCamCanto 2.4s var(--ease-in-out) infinite; pointer-events: none; }
.chatCam-revela { animation: chatCamRevela 0.6s var(--ease-out) both; }
@keyframes chatCamAnel { 0%,100% { box-shadow: 0 0 0 6px rgba(216,209,255,0.9), var(--sombra); } 50% { box-shadow: 0 0 0 12px rgba(216,209,255,0.35), var(--sombra); } }
@keyframes chatCamCarrega { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.9); } }
@keyframes chatCamCanto { 0%,100% { transform: none; opacity: 0.85; } 50% { transform: translate(var(--dx), var(--dy)); opacity: 1; } }
@keyframes chatCamRevela { from { filter: brightness(1.9) saturate(0.4); } to { filter: none; } }
`
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  subtitulo: {
    color: 'var(--text-2)',
    lineHeight: 1.4,
    marginTop: -4,
  },
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
    background: 'var(--surface-2)',
    overflow: 'hidden',
    boxShadow: 'var(--sombra)',
  },
  visorBotao: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: 'var(--lavanda)',
    color: '#000',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.4s',
  },
  visorEspera: {
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
  },
  visorTexto: {
    fontWeight: 600,
    color: '#000',
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
  trocaCamera: {
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
  obturadorMiolo: {
    flex: 1,
    borderRadius: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewWrap: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    maxHeight: 340,
    objectFit: 'cover',
    borderRadius: 'var(--r-card-m)',
    display: 'block',
    boxShadow: 'var(--sombra)',
  },
  trocar: {
    position: 'absolute',
    top: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 16px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    color: '#000',
    fontWeight: 600,
    boxShadow: 'var(--sombra)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  form: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    padding: 4,
    paddingLeft: 0,
    boxShadow: 'var(--sombra)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    padding: '0 18px',
  },
  enviar: {
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: {
    color: 'var(--erro)',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 600,
  },
}
