import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Volume2, Sparkles, Square } from 'lucide-react'
import { Botao, Card } from '../components/ui'
import { falar, pararFala } from '../lib/voz'
import { copiar } from './comum'
const ESTILOS = `
@keyframes ferGira { to { transform: rotate(360deg); } }
@keyframes ferPulsa { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes ferCresce { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ferAnel { from { stroke-dashoffset: var(--fer-c); } }
@keyframes ferCursor { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
.fer-gira { animation: ferGira 1s linear infinite; }
.fer-pulsa { animation: ferPulsa 1.1s ease-in-out infinite; }
.fer-cresce { transform-origin: left center; animation: ferCresce .6s var(--ease-out) backwards; }
.fer-cursor::after { content: ''; display: inline-block; width: 8px; height: 1.1em; margin-left: 2px; vertical-align: text-bottom; background: currentColor; border-radius: 2px; animation: ferCursor 1s steps(1) infinite; }
.fer-campo { width: 100%; min-width: 0; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-btn); padding: 0 16px; font-size: 16px; transition: border-color .2s ease; color: var(--text); }
.fer-campo:focus { border-color: var(--text); }
.fer-campo.multi { border-radius: 22px; padding: 14px 16px; resize: vertical; line-height: 1.45; }
`
if (typeof document !== 'undefined' && !document.getElementById('fer-estilos')) {
  const el = document.createElement('style')
  el.id = 'fer-estilos'
  el.textContent = ESTILOS
  document.head.appendChild(el)
}
export function Rotulo({ children, style }) {
  return (
    <p
      style={{
        ...styles.rotulo,
        ...style,
      }}
    >
      {children}
    </p>
  )
}
export function Coluna({ children, gap = 14, style, className, ...resto }) {
  return (
    <div
      {...resto}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
export function Linha({ children, gap = 10, style, className }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap,
        alignItems: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
export function Entrada({ rotulo, altura = 48, multilinha, style, ...resto }) {
  const Tag = multilinha ? 'textarea' : 'input'
  return (
    <label style={styles.entradaWrap}>
      {rotulo && <span style={styles.entradaRotulo}>{rotulo}</span>}
      <Tag
        {...resto}
        className={`fer-campo${multilinha ? ' multi' : ''}`}
        style={{
          minHeight: altura,
          ...style,
        }}
      />
    </label>
  )
}
export function Anel({
  progresso = 0,
  tamanho = 160,
  espessura = 12,
  cor = 'var(--text)',
  trilho = 'var(--surface-2)',
  suave,
  children,
}) {
  const r = (tamanho - espessura) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, progresso || 0))
  return (
    <div
      style={{
        position: 'relative',
        width: tamanho,
        height: tamanho,
        flexShrink: 0,
      }}
    >
      <svg
        width={tamanho}
        height={tamanho}
        style={{
          transform: 'rotate(-90deg)',
        }}
        aria-hidden="true"
      >
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={trilho} strokeWidth={espessura} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{
            '--fer-c': c,
            animation: 'ferAnel .9s var(--ease-out) backwards',
            transition: `stroke-dashoffset ${suave ? '.6s var(--ease-out)' : '.5s linear'}, stroke .3s ease`,
          }}
        />
      </svg>
      <div style={styles.anelCentro}>{children}</div>
    </div>
  )
}
export function Barra({ progresso = 0, cor = 'var(--text)', altura = 10 }) {
  const p = Math.min(1, Math.max(0, progresso || 0))
  return (
    <div
      style={{
        ...styles.barraTrilho,
        height: altura,
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
    >
      <div
        style={{
          ...styles.barraCheia,
          width: `${p * 100}%`,
          background: cor,
        }}
      />
    </div>
  )
}
export function Grande({ valor, rotulo, tamanho = 44, cor = 'var(--text)', alinhar = 'left' }) {
  return (
    <div
      style={{
        textAlign: alinhar,
      }}
      aria-live="polite"
    >
      {rotulo && <p style={styles.grandeRot}>{rotulo}</p>}
      <p
        key={valor}
        className="valor-muda"
        style={{
          ...styles.grande,
          fontSize: tamanho,
          color: cor,
          transformOrigin: alinhar === 'left' ? 'left center' : 'center',
        }}
      >
        {valor}
      </p>
    </div>
  )
}
export function Marca({ feito, tamanho = 26 }) {
  return (
    <span
      className={feito ? 'check-pop' : undefined}
      style={{
        ...styles.marca,
        width: tamanho,
        height: tamanho,
        background: feito ? 'var(--text)' : 'var(--surface)',
        borderColor: feito ? 'var(--text)' : 'var(--border)',
      }}
      aria-hidden="true"
    >
      {feito && <Check size={Math.round(tamanho * 0.58)} color="#fff" strokeWidth={3} />}
    </span>
  )
}
export function SemIA({
  texto = 'A IA da Kleo não está disponível agora. Em Ajustes, ligue a IA da Kleo ou adicione uma chave grátis para usar esta ferramenta.',
}) {
  const navigate = useNavigate()
  return (
    <Card cor="lavanda">
      <div style={styles.semIA}>
        <span style={styles.semIAIcone}>
          <Sparkles size={22} color="#000" />
        </span>
        <div
          style={{
            flex: 1,
          }}
        >
          <p style={styles.semIATitulo}>Ative a inteligência da Kleo</p>
          <p style={styles.semIATexto}>{texto}</p>
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
        }}
      >
        <Botao variante="primario" cheio onClick={() => navigate('/configuracoes?secao=ia')}>
          Abrir Ajustes
        </Botao>
      </div>
    </Card>
  )
}
export function RespostaIA({
  texto,
  carregando,
  erro,
  onParar,
  titulo = 'Resposta da Kleo',
  cor = 'lavanda',
}) {
  const [copiado, setCopiado] = useState(false)
  const [falando, setFalando] = useState(false)
  if (!texto && !carregando && !erro) return null
  const aoCopiar = async () => {
    if (await copiar(texto)) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    }
  }
  const aoOuvir = () => {
    if (falando) {
      pararFala()
      setFalando(false)
      return
    }
    setFalando(true)
    Promise.resolve(
      falar(texto, {
        forcar: true,
      }),
    ).finally(() => setFalando(false))
  }
  return (
    <Card cor={cor} className="anim-scale">
      <Rotulo
        style={{
          color: '#000',
        }}
      >
        {titulo}
      </Rotulo>
      {erro ? (
        <p key={erro} className="shake" style={styles.erro} role="alert">
          {erro}
        </p>
      ) : !texto ? (
        <Coluna
          gap={10}
          style={{
            marginTop: 4,
          }}
          aria-hidden="true"
        >
          <div
            className="skeleton"
            style={{
              height: 16,
              width: '90%',
            }}
          />
          <div
            className="skeleton"
            style={{
              height: 16,
              width: '75%',
            }}
          />
          <div
            className="skeleton"
            style={{
              height: 16,
              width: '55%',
            }}
          />
        </Coluna>
      ) : (
        <p className={carregando ? 'fer-cursor' : undefined} style={styles.resposta} aria-live="polite">
          {texto}
        </p>
      )}
      {carregando && onParar && (
        <div
          style={{
            marginTop: 14,
          }}
        >
          <Botao variante="fantasma" icone={Square} onClick={onParar}>
            Parar
          </Botao>
        </div>
      )}
      {!carregando && texto && !erro && (
        <Linha
          style={{
            marginTop: 16,
            flexWrap: 'wrap',
          }}
        >
          <Botao variante="primario" icone={copiado ? Check : Copy} onClick={aoCopiar}>
            {copiado ? 'Copiado' : 'Copiar'}
          </Botao>
          <Botao variante="fantasma" icone={falando ? Square : Volume2} onClick={aoOuvir}>
            {falando ? 'Parar' : 'Ouvir'}
          </Botao>
        </Linha>
      )}
    </Card>
  )
}
const styles = {
  rotulo: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-3)',
    marginBottom: 10,
  },
  entradaWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  entradaRotulo: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    paddingLeft: 4,
  },
  anelCentro: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  barraTrilho: {
    width: '100%',
    borderRadius: 30,
    background: 'var(--surface-2)',
    overflow: 'hidden',
  },
  barraCheia: {
    height: '100%',
    borderRadius: 30,
    transition: 'width .5s var(--ease-out)',
  },
  grandeRot: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    marginBottom: 2,
  },
  grande: {
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  marca: {
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background .25s ease, border-color .25s ease',
  },
  semIA: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  semIAIcone: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  semIATitulo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#000',
  },
  semIATexto: {
    fontSize: 15,
    color: '#000',
    marginTop: 4,
    lineHeight: 1.4,
  },
  erro: {
    color: 'var(--erro)',
    fontSize: 16,
    fontWeight: 600,
  },
  resposta: {
    fontSize: 17,
    lineHeight: 1.55,
    color: '#000',
    whiteSpace: 'pre-wrap',
  },
}
