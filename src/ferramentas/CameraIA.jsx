import { useRef, useState, useEffect } from 'react'
import { Camera, ImagePlus, ScanSearch, X, Lightbulb } from 'lucide-react'
import { Card, Botao, BotaoIcone } from '../components/ui'
import { analisarImagem, temIA, mensagemErro } from '../lib/ia'
import { falar } from '../lib/voz'
import { useDados, useTam, reduzirImagem, nomeProfissao, novoId, criarAcumulador } from './comum'
import { Rotulo, Coluna, Entrada, RespostaIA, SemIA } from './pecas'
import CameraAoVivo from '../components/CameraAoVivo'
export default function CameraIA({ config = {}, profissao, chave }) {
  const { simples, h } = useTam()
  const [foto, setFoto] = useState(null)
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [historico, setHistorico] = useDados(chave, [])
  const [aoVivo, setAoVivo] = useState(false)
  const galRef = useRef(null)
  const ctrl = useRef(null)
  const lista = Array.isArray(historico) ? historico : []
  useEffect(() => () => ctrl.current?.abort(), [])
  if (!temIA('visao'))
    return (
      <SemIA texto="A IA da Kleo não está disponível agora. Tente de novo mais tarde para a Kleo analisar suas fotos." />
    )
  const escolher = async e => {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    try {
      setErro('')
      setResposta('')
      setFoto(await reduzirImagem(arq, 1024))
    } catch (err) {
      setErro(err.message)
    }
  }
  const analisar = async () => {
    if (!foto || carregando) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setCarregando(true)
    setErro('')
    setResposta('')
    const base = config.prompt || 'Descreva o que aparece na foto e dê orientações úteis.'
    const extra = pergunta.trim() ? `\nPergunta do usuário: ${pergunta.trim()}` : ''
    const prof = nomeProfissao(profissao)
    try {
      const r = await analisarImagem(foto, base + extra, {
        signal: c.signal,
        maxTokens: 700,
        onToken: criarAcumulador(setResposta),
        extraSystem: `Responda em português do Brasil, de forma prática e direta${simples ? ', com frases bem curtas e simples' : ''}.${prof ? ` O usuário trabalha como ${prof}.` : ''} Se a foto não estiver clara, peça outra foto e diga como tirar. Não use comandos especiais.`,
      })
      const texto = String(r || '').trim() || 'Não consegui analisar esta foto. Tente outra mais nítida.'
      setResposta(texto)
      if (simples) falar(texto)
      const mini = await miniatura(foto)
      setHistorico(a =>
        [
          {
            id: novoId(),
            mini,
            texto,
            ts: Date.now(),
          },
          ...(Array.isArray(a) ? a : []),
        ].slice(0, 4),
      )
    } catch (e) {
      if (e?.name !== 'AbortError') setErro(mensagemErro(e))
    } finally {
      if (ctrl.current === c) setCarregando(false)
    }
  }
  return (
    <Coluna>
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        onChange={escolher}
        style={{
          display: 'none',
        }}
      />

      <Card cor={foto ? 'branco' : 'ceu'}>
        {config.titulo && <p style={styles.titulo}>{config.titulo}</p>}
        {config.dica && !foto && (
          <p style={styles.dica}>
            <Lightbulb
              size={18}
              style={{
                flexShrink: 0,
                marginTop: 2,
              }}
            />{' '}
            {config.dica}
          </p>
        )}

        {foto ? (
          <div className="anim-scale" style={styles.previa}>
            <img src={foto} alt="Foto para análise" style={styles.img} />
            <div style={styles.fechar}>
              <BotaoIcone
                icone={X}
                label="Remover foto"
                variante="branco"
                onClick={() => {
                  setFoto(null)
                  setResposta('')
                  setErro('')
                }}
              />
            </div>
          </div>
        ) : aoVivo ? (
          <CameraAoVivo
            simples={simples}
            onFoto={f => {
              setAoVivo(false)
              setErro('')
              setResposta('')
              setFoto(f)
            }}
          />
        ) : (
          <button
            onClick={() => setAoVivo(true)}
            className="tap"
            style={{
              ...styles.area,
              minHeight: simples ? 200 : 170,
            }}
          >
            <span style={styles.areaIcone}>
              <Camera size={34} color="#000" />
            </span>
            <span style={styles.areaTxt}>Tirar foto</span>
          </button>
        )}

        {foto && !simples && (
          <div
            style={{
              marginTop: 14,
            }}
          >
            <Entrada
              placeholder="Pergunta extra (opcional)"
              aria-label="Pergunta extra"
              value={pergunta}
              onChange={e => setPergunta(e.target.value)}
              altura={h}
            />
          </div>
        )}

        <div style={styles.botoes}>
          {foto ? (
            <Botao
              variante="primario"
              icone={ScanSearch}
              grande={simples}
              cheio
              carregando={carregando}
              disabled={carregando}
              onClick={analisar}
            >
              {carregando ? 'Analisando' : 'Analisar foto'}
            </Botao>
          ) : (
            <Botao
              variante="fantasma"
              icone={ImagePlus}
              grande={simples}
              cheio
              onClick={() => galRef.current?.click()}
            >
              Escolher da galeria
            </Botao>
          )}
        </div>
        {foto && !carregando && (
          <div
            style={{
              marginTop: 10,
            }}
          >
            <Botao
              variante="fantasma"
              icone={Camera}
              cheio
              onClick={() => {
                setFoto(null)
                setResposta('')
                setAoVivo(true)
              }}
            >
              Tirar outra
            </Botao>
          </div>
        )}
      </Card>

      <RespostaIA texto={resposta} carregando={carregando} erro={erro} titulo="O que a Kleo viu" />

      {!simples && lista.length > 0 && !resposta && !carregando && (
        <Card>
          <Rotulo>Análises recentes</Rotulo>
          <Coluna gap={10}>
            {lista.map(x => (
              <button key={x.id} onClick={() => setResposta(x.texto)} className="tap" style={styles.hist}>
                {x.mini && <img src={x.mini} alt="" style={styles.histImg} />}
                <span style={styles.histTxt}>{x.texto}</span>
              </button>
            ))}
          </Coluna>
        </Card>
      )}
    </Coluna>
  )
}
function miniatura(dataURL) {
  return new Promise(ok => {
    const img = new Image()
    img.onload = () => {
      const e = 96 / Math.max(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * e)
      c.height = Math.round(img.height * e)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      ok(c.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => ok(null)
    img.src = dataURL
  })
}
const styles = {
  titulo: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#000',
    marginBottom: 10,
  },
  dica: {
    display: 'flex',
    gap: 8,
    fontSize: 15,
    lineHeight: 1.4,
    color: '#000',
    marginBottom: 14,
  },
  area: {
    width: '100%',
    borderRadius: 30,
    border: '2px dashed rgba(0,0,0,0.35)',
    background: 'rgba(255,255,255,0.55)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  areaIcone: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaTxt: {
    fontSize: 18,
    fontWeight: 700,
    color: '#000',
  },
  previa: {
    position: 'relative',
    borderRadius: 30,
    overflow: 'hidden',
    background: 'var(--surface-2)',
  },
  img: {
    width: '100%',
    maxHeight: 360,
    objectFit: 'contain',
    display: 'block',
  },
  fechar: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  botoes: {
    marginTop: 14,
  },
  hist: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    textAlign: 'left',
    padding: 8,
    borderRadius: 15,
    background: 'var(--surface-2)',
  },
  histImg: {
    width: 52,
    height: 52,
    borderRadius: 15,
    objectFit: 'cover',
    flexShrink: 0,
  },
  histTxt: {
    fontSize: 14,
    lineHeight: 1.35,
    color: 'var(--text-2)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
}
