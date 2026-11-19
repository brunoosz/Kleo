import { useEffect, useRef, useState } from 'react'
import { Trash2, Volume2, Square, Mic, MicOff, Check, Palette } from 'lucide-react'
import Tela from './Tela'
import { Botao, BotaoIcone, Modal } from './ui'
import { falar, pararFala, ouvir, reconhecimentoDisponivel } from '../lib/voz'
import { piscarTela } from '../hooks/useAcessibilidade'
import { dataRelativa, corDaNota, CORES_NOTA } from '../data/notas'
export default function NotasEditor({ nota, alvo = 44, simples = false, auditiva, onSalvar, onExcluir }) {
  const [titulo, setTitulo] = useState(nota.titulo || '')
  const [corpo, setCorpo] = useState(nota.corpo || '')
  const [corId, setCorId] = useState(corDaNota(nota).id)
  const [lendo, setLendo] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [parcial, setParcial] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const [salvo, setSalvo] = useState(0)
  const recRef = useRef(null)
  const corpoRef = useRef(null)
  const corpoVivo = useRef(nota.corpo || '')
  const cor = CORES_NOTA.find(c => c.id === corId) || CORES_NOTA[0]
  useEffect(
    () => () => {
      recRef.current?.stop()
      pararFala()
    },
    [],
  )
  useEffect(() => {
    const el = corpoRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(simples ? 200 : 240, el.scrollHeight) + 'px'
  }, [corpo, simples])
  function salvar(campos) {
    onSalvar(campos)
    setSalvo(s => s + 1)
  }
  function mudarTitulo(v) {
    setTitulo(v)
    salvar({
      titulo: v,
    })
  }
  function mudarCorpo(v) {
    corpoVivo.current = v
    setCorpo(v)
    salvar({
      corpo: v,
    })
  }
  function mudarCor(id) {
    setCorId(id)
    salvar({
      cor: id,
    })
  }
  async function lerEmVoz() {
    if (lendo) {
      pararFala()
      setLendo(false)
      return
    }
    const texto = [titulo, corpo].filter(s => s.trim()).join('. ')
    if (!texto) {
      setAviso('A nota está vazia.')
      return
    }
    setAviso('')
    setLendo(true)
    await falar(texto, {
      forcar: true,
    })
    setLendo(false)
  }
  function ditar() {
    if (ouvindo) {
      recRef.current?.stop()
      return
    }
    setAviso('')
    setParcial('')
    setOuvindo(true)
    if (auditiva) piscarTela()
    recRef.current = ouvir({
      onParcial: t => setParcial(t),
      onFinal: t => {
        const base = corpoVivo.current.trimEnd()
        const frase = t.charAt(0).toUpperCase() + t.slice(1)
        mudarCorpo(base ? `${base}${/[.!?]$/.test(base) ? ' ' : '. '}${frase}` : frase)
      },
      onFim: () => {
        setOuvindo(false)
        setParcial('')
        recRef.current = null
      },
      onErro: msg => setAviso(msg),
    })
  }
  const podeDitar = reconhecimentoDisponivel()
  const alturaAcao = Math.max(alvo, simples ? 60 : 52)
  return (
    <Tela
      voltar
      acoes={
        simples ? null : (
          <BotaoIcone
            icone={Trash2}
            label="Excluir nota"
            cor="var(--erro)"
            onClick={() => setConfirmar(true)}
          />
        )
      }
    >
      <div className="anim-scale" style={styles.wrap}>
        <div style={styles.status}>
          <span style={styles.data}>Editada {dataRelativa(nota.atualizado)}</span>
          {salvo > 0 && (
            <span key={salvo} className="anim-fade" style={styles.salvo}>
              <Check size={14} strokeWidth={3} aria-hidden="true" /> Salvo
            </span>
          )}
        </div>

        <div
          className="kleo-card"
          style={{
            ...styles.sticker,
            background: cor.valor,
          }}
        >
          <input
            value={titulo}
            onChange={e => mudarTitulo(e.target.value)}
            placeholder="Título"
            aria-label="Título da nota"
            style={{
              ...styles.titulo,
              fontSize: simples ? 30 : 28,
            }}
            autoFocus={!nota.titulo && !nota.corpo}
          />
          <textarea
            ref={corpoRef}
            value={corpo}
            onChange={e => mudarCorpo(e.target.value)}
            placeholder={simples ? 'Escreva aqui...' : 'Comece a escrever...'}
            aria-label="Texto da nota"
            style={{
              ...styles.corpo,
              fontSize: simples ? 20 : 17,
            }}
          />
        </div>

        {!simples && (
          <div style={styles.cores} role="radiogroup" aria-label="Cor da nota">
            <Palette size={18} color="var(--text-2)" aria-hidden="true" />
            {CORES_NOTA.map(c => {
              const ativa = c.id === corId
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={ativa}
                  aria-label={c.nome}
                  className="tap"
                  onClick={() => mudarCor(c.id)}
                  style={{
                    ...styles.bolinha,
                    background: c.valor,
                    outline: ativa ? '2.5px solid #000' : 'none',
                  }}
                >
                  {ativa && (
                    <span key={c.id} className="check-pop" style={styles.centro}>
                      <Check size={16} color="#000" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {ouvindo && (
          <div className="anim-up" style={styles.legenda} role="status" aria-live="polite">
            <span
              className="wave"
              style={{
                color: '#000',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
            {parcial || 'Ouvindo... pode falar.'}
          </div>
        )}
        {aviso && (
          <p key={aviso} className="shake" style={styles.aviso} role="alert">
            {aviso}
          </p>
        )}

        {simples && (
          <div
            style={{
              marginTop: 22,
            }}
          >
            <Botao
              variante="fantasma"
              icone={Trash2}
              cheio
              onClick={() => setConfirmar(true)}
              style={{
                color: 'var(--erro)',
              }}
            >
              Apagar nota
            </Botao>
          </div>
        )}
      </div>

      <div
        className="anim-up"
        style={{
          ...styles.barraAcoes,
          animationDelay: '120ms',
        }}
      >
        <button
          type="button"
          onClick={lerEmVoz}
          aria-label={lendo ? 'Parar leitura' : 'Ler em voz alta'}
          className="tap"
          style={{
            ...styles.acao,
            minHeight: alturaAcao,
            fontSize: simples ? 18 : 16,
            background: lendo ? 'var(--lavanda)' : 'var(--surface)',
            border: lendo ? '1px solid transparent' : '1px solid var(--border)',
          }}
        >
          <span key={String(lendo)} className="anim-pop" style={styles.centro}>
            {lendo ? <Square size={18} /> : <Volume2 size={19} />}
          </span>
          {lendo ? 'Parar' : simples ? 'Ouvir' : 'Ler em voz alta'}
        </button>
        {podeDitar && (
          <button
            type="button"
            onClick={ditar}
            aria-label={ouvindo ? 'Parar ditado' : 'Ditar'}
            className={'tap' + (ouvindo ? ' pulse-ring' : '')}
            style={{
              ...styles.acao,
              minHeight: alturaAcao,
              fontSize: simples ? 18 : 16,
              background: ouvindo ? 'var(--erro)' : '#000',
              color: '#fff',
              boxShadow: 'var(--sombra)',
            }}
          >
            <span key={String(ouvindo)} className="anim-pop" style={styles.centro}>
              {ouvindo ? <MicOff size={19} /> : <Mic size={19} />}
            </span>
            {ouvindo ? 'Parar' : simples ? 'Falar' : 'Ditar'}
          </button>
        )}
      </div>

      <Modal
        aberto={confirmar}
        onFechar={() => setConfirmar(false)}
        titulo="Apagar esta nota?"
        texto="Ela some para sempre. Não dá para desfazer."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setConfirmar(false),
          },
          {
            label: 'Apagar',
            variante: 'perigo',
            onClick: () => {
              setConfirmar(false)
              onExcluir()
            },
          },
        ]}
      />
    </Tela>
  )
}
const styles = {
  wrap: {
    paddingBottom: 100,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    margin: '2px 4px 12px',
    minHeight: 26,
  },
  data: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
  },
  salvo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    fontWeight: 700,
    color: '#000',
    background: 'var(--lima)',
    borderRadius: 'var(--r-badge)',
    padding: '3px 10px',
  },
  sticker: {
    borderRadius: 'var(--r-card-m)',
    padding: '18px 20px 12px',
    boxShadow: 'var(--sombra)',
    transition: 'background 0.35s',
    color: '#000',
  },
  titulo: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#000',
    fontWeight: 800,
    lineHeight: 1.1,
    padding: '4px 0 8px',
  },
  corpo: {
    width: '100%',
    minHeight: 200,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    color: '#000',
    lineHeight: 1.55,
    fontFamily: 'inherit',
    padding: '4px 0',
    overflow: 'hidden',
  },
  cores: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingLeft: 6,
  },
  bolinha: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid var(--border)',
    outlineOffset: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    display: 'flex',
  },
  legenda: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    borderRadius: 'var(--r-btn)',
    padding: '12px 16px',
    fontSize: 16,
    color: '#000',
    marginTop: 14,
  },
  aviso: {
    color: 'var(--erro)',
    fontSize: 15,
    fontWeight: 600,
    marginTop: 12,
    paddingLeft: 6,
  },
  barraAcoes: {
    position: 'sticky',
    bottom: 0,
    display: 'flex',
    gap: 10,
    padding: '14px 0 6px',
    background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
  },
  acao: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#000',
    borderRadius: 'var(--r-btn)',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
}
