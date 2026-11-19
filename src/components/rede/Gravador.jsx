import { useCallback, useEffect, useRef, useState } from 'react'
import useGravador from '../../hooks/useGravador'
import { Mic, Trash2, ArrowUp, X, Check } from 'lucide-react'
import { Sheet, Botao } from '../ui'
import Avatar from '../Avatar'
import useModoSimples from '../../hooks/useModoSimples'
import { gravacaoDisponivel, MAX_SEGUNDOS } from '../../lib/audio'
import { enviarAudio, mensagemErroEnvio } from '../../lib/rede/envio'
import { formatarDuracao, nomeExibicao } from '../../lib/rede/util'
import { falar } from '../../lib/voz'
export function BarraGravacao({ gravador, onCancelar, onEnviar, simples }) {
  const alvo = simples ? 56 : 48
  return (
    <div
      className="anim-fade"
      style={{
        ...styles.barra,
        minHeight: alvo + 8,
      }}
    >
      <button
        type="button"
        className="tap"
        onClick={onCancelar}
        style={{
          ...styles.redondo,
          width: alvo,
          height: alvo,
          background: 'var(--surface-2)',
        }}
        aria-label="Descartar áudio"
      >
        <Trash2 size={21} color="var(--erro)" aria-hidden="true" />
      </button>
      <div style={styles.barraMeio} aria-live="polite">
        <span className="ponto-vivo" style={styles.pontoRec} />
        <span
          style={{
            ...styles.tempo,
            fontSize: simples ? 20 : 17,
          }}
        >
          {formatarDuracao(gravador.segundos)}
        </span>
        <span style={styles.ondas} aria-hidden="true">
          {[0.5, 0.8, 1, 0.75, 0.9, 0.6, 1, 0.7].map((f, i) => (
            <span
              key={i}
              style={{
                ...styles.onda,
                transform: `scaleY(${0.15 + Math.min(1, gravador.nivel * 1.6) * f})`,
              }}
            />
          ))}
        </span>
        <span style={styles.limite}>{simples ? 'Gravando' : `máx. ${formatarDuracao(MAX_SEGUNDOS)}`}</span>
      </div>
      <button
        type="button"
        className="tap"
        onClick={onEnviar}
        style={{
          ...styles.redondo,
          width: alvo,
          height: alvo,
          background: '#000',
        }}
        aria-label="Enviar áudio"
      >
        <ArrowUp size={22} color="#fff" aria-hidden="true" />
      </button>
    </div>
  )
}
export function GravadorSheet({ aberto, contato, onFechar }) {
  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      titulo={contato ? `Áudio para ${nomeExibicao(contato)}` : 'Áudio'}
    >
      {contato && <ConteudoGravador key={contato.uid} contato={contato} onFechar={onFechar} />}
    </Sheet>
  )
}
function ConteudoGravador({ contato, onFechar }) {
  const simples = useModoSimples()
  const gravador = useGravador()
  const pode = gravacaoDisponivel()
  const [fase, setFase] = useState(pode ? 'gravando' : 'erro')
  const [conta, setConta] = useState(3)
  const [erro, setErro] = useState(pode ? '' : 'Este navegador não grava áudio.')
  const resultado = useRef(null)
  const timer = useRef(null)
  const nome = nomeExibicao(contato)
  const mandar = useCallback(
    async res => {
      clearInterval(timer.current)
      if (!res?.blob?.size) {
        setErro('Não ouvi nada. Tente de novo.')
        setFase('erro')
        return
      }
      setFase('enviando')
      try {
        await enviarAudio(contato.uid, res)
        setFase('enviado')
        falar(`Áudio enviado para ${nome}.`, {
          forcar: true,
        }).catch(() => {})
        setTimeout(onFechar, 1300)
      } catch (e) {
        setErro(mensagemErroEnvio(e))
        setFase('erro')
      }
    },
    [contato.uid, nome, onFechar],
  )
  const contar = useCallback(
    res => {
      resultado.current = res
      if (!res?.falou) {
        setErro('Não ouvi sua voz. Fale mais perto do celular.')
        setFase('erro')
        return
      }
      setFase('contando')
      setConta(3)
      let n = 3
      timer.current = setInterval(() => {
        n -= 1
        setConta(n)
        if (n <= 0) mandar(res)
      }, 1000)
    },
    [mandar],
  )
  useEffect(() => {
    if (!pode) return
    gravador
      .iniciar({
        silencio: true,
        onFim: contar,
      })
      .catch(e => {
        setErro(mensagemErroEnvio(e))
        setFase('erro')
      })
    return () => clearInterval(timer.current) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const enviarAgora = async () => {
    if (fase === 'gravando') {
      const res = await gravador.parar()
      if (res) mandar(res)
      return
    }
    if (fase === 'contando') mandar(resultado.current)
  }
  const cancelar = () => {
    clearInterval(timer.current)
    gravador.cancelar()
    onFechar()
  }
  const escala = 1 + Math.min(0.5, gravador.nivel * 0.9)
  return (
    <div style={styles.sheet}>
      <div style={styles.palco}>
        <span
          style={{
            ...styles.anel,
            transform: `scale(${fase === 'gravando' ? escala : 1})`,
            opacity: fase === 'gravando' ? 1 : 0.4,
          }}
          aria-hidden="true"
        />
        <Avatar
          nome={contato.nome || nome}
          foto={contato.foto}
          chave={contato.uid}
          tamanho={simples ? 120 : 104}
        />
      </div>

      <p
        style={{
          ...styles.status,
          fontSize: simples ? 24 : 21,
        }}
        aria-live="assertive"
      >
        {fase === 'gravando' && (gravador.estado === 'gravando' ? 'Pode falar...' : 'Abrindo o microfone...')}
        {fase === 'contando' && `Enviando em ${conta}...`}
        {fase === 'enviando' && 'Enviando...'}
        {fase === 'enviado' && 'Enviado!'}
        {fase === 'erro' && erro}
      </p>
      {fase === 'gravando' && <p style={styles.tempoGrande}>{formatarDuracao(gravador.segundos)}</p>}
      {fase === 'gravando' && (
        <p style={styles.dica}>Quando terminar, é só ficar em silêncio que eu envio.</p>
      )}

      <div style={styles.acoes}>
        {(fase === 'gravando' || fase === 'contando') && (
          <>
            <Botao variante="primario" grande cheio icone={ArrowUp} onClick={enviarAgora}>
              Enviar agora
            </Botao>
            <Botao variante="fantasma" grande cheio icone={X} onClick={cancelar}>
              Cancelar
            </Botao>
          </>
        )}
        {fase === 'enviado' && (
          <span className="anim-pop" style={styles.ok}>
            <Check size={36} color="#000" aria-hidden="true" />
          </span>
        )}
        {fase === 'erro' && (
          <>
            <Botao
              variante="primario"
              grande
              cheio
              icone={Mic}
              onClick={() => {
                setErro('')
                setFase('gravando')
                gravador
                  .iniciar({
                    silencio: true,
                    onFim: contar,
                  })
                  .catch(e => {
                    setErro(mensagemErroEnvio(e))
                    setFase('erro')
                  })
              }}
            >
              Gravar de novo
            </Botao>
            <Botao variante="fantasma" grande cheio onClick={onFechar}>
              Fechar
            </Botao>
          </>
        )}
      </div>
    </div>
  )
}
const styles = {
  barra: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    padding: '4px 6px',
    boxShadow: 'var(--sombra), inset 0 0 0 2px var(--erro)',
  },
  barraMeio: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  pontoRec: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--erro)',
    color: 'var(--erro)',
    flexShrink: 0,
  },
  tempo: {
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  ondas: {
    flex: 1,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    minWidth: 30,
  },
  onda: {
    flex: 1,
    maxWidth: 6,
    height: '100%',
    borderRadius: 3,
    background: '#000',
    transition: 'transform 0.1s',
  },
  limite: {
    fontSize: 12,
    color: 'var(--text-3)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  redondo: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheet: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  palco: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    margin: '4px 0 6px',
  },
  anel: {
    position: 'absolute',
    inset: 22,
    borderRadius: '50%',
    background: 'var(--lavanda)',
    transition: 'transform 0.12s linear, opacity 0.3s',
  },
  status: {
    fontWeight: 800,
    lineHeight: 1.25,
    minHeight: 30,
  },
  tempoGrande: {
    fontSize: 32,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  dica: {
    fontSize: 15,
    color: 'var(--text-2)',
    maxWidth: 320,
  },
  acoes: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 14,
  },
  ok: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
}
