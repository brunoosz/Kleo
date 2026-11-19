import { isValidElement, useEffect, useId, useRef } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import Camada from './Camada'
import useSaida from '../hooks/useSaida'
import useModoSimples from '../hooks/useModoSimples'
export { default as SeloMarca } from './SeloMarca'
const SUPERFICIES = {
  branco: 'var(--surface)',
  lavanda: 'var(--lavanda)',
  lima: 'var(--lima)',
  ceu: 'var(--ceu)',
  creme: 'var(--bg)',
  mist: 'var(--surface-2)',
}
export function Card({ cor = 'branco', tamanho = 'm', onClick, className, style, children, ...resto }) {
  const base = {
    ...styles.card,
    background: SUPERFICIES[cor] || cor,
    borderRadius: tamanho === 'g' ? 'var(--r-card)' : 'var(--r-card-m)',
    padding: tamanho === 'g' ? 28 : 20,
    boxShadow: cor === 'creme' ? 'none' : 'var(--sombra)',
    ...style,
  }
  const classe = ['kleo-card', onClick ? 'tap' : '', className || ''].filter(Boolean).join(' ')
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classe}
        style={{
          ...styles.cardBotao,
          ...base,
        }}
        {...resto}
      >
        {children}
      </button>
    )
  }
  return (
    <div className={classe} style={base} {...resto}>
      {children}
    </div>
  )
}
const VARIANTES_BOTAO = {
  primario: {
    background: '#000',
    color: '#fff',
    boxShadow: 'var(--sombra)',
  },
  fantasma: {
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  suave: {
    background: 'var(--lavanda)',
    color: '#000',
    boxShadow: 'var(--sombra)',
  },
  lima: {
    background: 'var(--lima)',
    color: '#000',
    boxShadow: 'var(--sombra)',
  },
  perigo: {
    background: 'var(--erro)',
    color: '#fff',
    boxShadow: 'var(--sombra)',
  },
}
export function Botao({
  variante = 'primario',
  icone: Icone,
  grande = false,
  cheio = false,
  carregando = false,
  disabled = false,
  onClick,
  children,
  style,
  type = 'button',
  ...resto
}) {
  const simples = useModoSimples()
  const alto = grande || simples
  const inativo = disabled || carregando
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inativo}
      aria-busy={carregando || undefined}
      style={{
        ...styles.botao,
        ...(VARIANTES_BOTAO[variante] || VARIANTES_BOTAO.primario),
        minHeight: alto ? 56 : 48,
        fontSize: alto ? 18 : 16,
        padding: alto ? '10px 26px' : '10px 20px',
        width: cheio ? '100%' : undefined,
        opacity: disabled && !carregando ? 0.45 : 1,
        ...style,
      }}
      {...resto}
    >
      {carregando ? (
        <LoaderCircle size={alto ? 22 : 19} className="girar" aria-hidden="true" />
      ) : (
        Icone && <Icone size={alto ? 22 : 19} strokeWidth={2.2} aria-hidden="true" />
      )}
      {children && <span>{children}</span>}
    </button>
  )
}
const VARIANTES_ICONE = {
  branco: {
    fundo: 'var(--surface)',
    cor: '#000',
    sombra: true,
  },
  preto: {
    fundo: '#000',
    cor: '#fff',
    sombra: true,
  },
  lavanda: {
    fundo: 'var(--lavanda)',
    cor: '#000',
    sombra: false,
  },
  lima: {
    fundo: 'var(--lima)',
    cor: '#000',
    sombra: false,
  },
}
export function BotaoIcone({
  icone,
  icon,
  label,
  onClick,
  variante = 'branco',
  cor,
  fundo,
  disabled,
  style,
  className,
  ...resto
}) {
  const simples = useModoSimples()
  const Icone = icone || icon
  const v = VARIANTES_ICONE[variante] || VARIANTES_ICONE.branco
  const lado = simples ? 56 : 44
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={['tap', className].filter(Boolean).join(' ')}
      style={{
        ...styles.botaoIcone,
        width: lado,
        height: lado,
        background: fundo || v.fundo,
        boxShadow: v.sombra && !fundo ? 'var(--sombra)' : 'none',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      {...resto}
    >
      <span key={label} className="anim-scale" style={styles.centro}>
        {Icone && (
          <Icone size={simples ? 24 : 20} color={cor || v.cor} strokeWidth={2.1} aria-hidden="true" />
        )}
      </span>
    </button>
  )
}
export function Chip({ ativo = false, cor = 'lavanda', icone: Icone, onClick, children, style, ...resto }) {
  const simples = useModoSimples()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      style={{
        ...styles.chip,
        minHeight: simples ? 48 : 40,
        fontSize: simples ? 17 : 15,
        background: ativo ? '#000' : SUPERFICIES[cor] || cor,
        color: ativo ? '#fff' : '#000',
        border: !ativo && cor === 'branco' ? '1px solid var(--border)' : '1px solid transparent',
        ...style,
      }}
      {...resto}
    >
      {Icone && <Icone size={simples ? 19 : 16} strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </button>
  )
}
export function Tag({ cor = 'lavanda', icone: Icone, children, style }) {
  return (
    <span
      style={{
        ...styles.tag,
        background: SUPERFICIES[cor] || cor,
        ...style,
      }}
    >
      {Icone && <Icone size={15} strokeWidth={2.2} color="#000" aria-hidden="true" />}
      {children}
    </span>
  )
}
export function Toggle({ ligado = false, onChange, label, disabled }) {
  const simples = useModoSimples()
  const w = simples ? 60 : 52
  const h = simples ? 36 : 32
  const bola = h - 6
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!ligado}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!ligado)}
      style={{
        ...styles.toggle,
        width: w,
        height: h,
        background: ligado ? '#000' : 'var(--border)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        style={{
          ...styles.toggleBola,
          width: bola,
          height: bola,
          transform: `translateX(${ligado ? w - bola - 3 : 3}px)`,
        }}
      />
    </button>
  )
}
export function Segmentado({ opcoes = [], valor, onChange, style }) {
  const simples = useModoSimples()
  const n = Math.max(opcoes.length, 1)
  const idx = Math.max(
    0,
    opcoes.findIndex(o => o.id === valor),
  )
  return (
    <div
      role="tablist"
      style={{
        ...styles.seg,
        minHeight: simples ? 56 : 48,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...styles.segIndicador,
          width: `calc((100% - 8px) / ${n})`,
          left: `calc(4px + ${idx} * (100% - 8px) / ${n})`,
        }}
      />
      {opcoes.map(o => {
        const ativo = o.id === valor
        const Icone = o.icone
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange?.(o.id)}
            style={{
              ...styles.segBotao,
              fontSize: simples ? 17 : 15,
              color: ativo ? '#fff' : 'var(--text-2)',
            }}
          >
            {Icone && <Icone size={simples ? 19 : 16} strokeWidth={2.2} aria-hidden="true" />}
            <span style={styles.segTexto}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
export function Campo({ rotulo, icone: Icone, multilinha = false, id, style, ...inputProps }) {
  const simples = useModoSimples()
  const idAuto = useId()
  const idCampo = id || idAuto
  const Elemento = multilinha ? 'textarea' : 'input'
  return (
    <div style={styles.campoWrap}>
      {rotulo && (
        <label
          htmlFor={idCampo}
          style={{
            ...styles.campoRotulo,
            fontSize: simples ? 16 : 14,
          }}
        >
          {rotulo}
        </label>
      )}
      <div style={styles.campoCaixa}>
        {Icone && (
          <Icone
            size={19}
            color="var(--text-3)"
            aria-hidden="true"
            style={{
              ...styles.campoIcone,
              top: multilinha ? 16 : '50%',
              transform: multilinha ? 'none' : 'translateY(-50%)',
            }}
          />
        )}
        <Elemento
          id={idCampo}
          style={{
            ...styles.campo,
            ...(multilinha
              ? styles.campoMulti
              : {
                  height: simples ? 58 : 52,
                }),
            fontSize: simples ? 18 : 16,
            paddingLeft: Icone ? 46 : 18,
            ...style,
          }}
          {...inputProps}
        />
      </div>
    </div>
  )
}
function useEsc(ativo, aoFechar) {
  const ref = useRef(aoFechar)
  useEffect(() => {
    ref.current = aoFechar
  })
  useEffect(() => {
    if (!ativo) return
    const tecla = e => {
      if (e.key === 'Escape') ref.current?.()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [ativo])
}
export function Sheet({ aberto, onFechar, titulo, children, altura }) {
  const { montado, saindo } = useSaida(aberto)
  const painel = useRef(null)
  useEsc(aberto, onFechar)
  useEffect(() => {
    if (aberto) painel.current?.focus()
  }, [aberto])
  if (!montado) return null
  return (
    <Camada>
      <div
        className={'kleo-veu ' + (saindo ? 'sheet-backdrop-out' : 'sheet-backdrop')}
        style={styles.veu}
        onClick={onFechar}
      />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo || 'Painel'}
        tabIndex={-1}
        className={saindo ? 'sheet-out' : 'sheet'}
        style={{
          ...styles.sheet,
          ...(altura
            ? {
                height: altura,
              }
            : {
                maxHeight: '88vh',
              }),
        }}
      >
        <div style={styles.alca} aria-hidden="true" />
        <div style={styles.sheetTopo}>
          {titulo ? <h2 style={styles.sheetTitulo}>{titulo}</h2> : <span />}
          <BotaoIcone icone={X} label="Fechar" onClick={onFechar} />
        </div>
        <div style={styles.sheetCorpo}>{children}</div>
      </div>
    </Camada>
  )
}
export function Modal({ aberto, onFechar, titulo, texto, acoes = [], children }) {
  const simples = useModoSimples()
  const { montado, saindo } = useSaida(aberto, 220)
  useEsc(aberto, onFechar)
  if (!montado) return null
  const lista = acoes.length
    ? acoes
    : [
        {
          label: 'Ok',
          variante: 'primario',
          onClick: onFechar,
        },
      ]
  return (
    <Camada>
      <div
        className={'kleo-veu ' + (saindo ? 'sheet-backdrop-out' : 'sheet-backdrop')}
        style={styles.veu}
        onClick={onFechar}
      />
      <div style={styles.modalCentro}>
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={titulo}
          className={saindo ? 'modal-out' : 'modal'}
          style={styles.modal}
        >
          {titulo && (
            <h2
              style={{
                ...styles.modalTitulo,
                fontSize: simples ? 26 : 23,
              }}
            >
              {titulo}
            </h2>
          )}
          {texto && (
            <p
              style={{
                ...styles.modalTexto,
                fontSize: simples ? 18 : 16,
              }}
            >
              {texto}
            </p>
          )}
          {children}
          <div
            style={{
              ...styles.modalAcoes,
              flexDirection: simples || lista.length > 2 ? 'column-reverse' : 'row',
            }}
          >
            {lista.map((a, i) => (
              <Botao
                key={a.label + i}
                variante={a.variante || (i === lista.length - 1 ? 'primario' : 'fantasma')}
                onClick={a.onClick}
                cheio
                style={{
                  flex: 1,
                }}
              >
                {a.label}
              </Botao>
            ))}
          </div>
        </div>
      </div>
    </Camada>
  )
}
export function TituloSecao({ children, acao, style }) {
  const acaoObj = acao && typeof acao === 'object' && !isValidElement(acao) && acao.label
  return (
    <div
      style={{
        ...styles.secao,
        ...style,
      }}
    >
      <h2 style={styles.secaoTitulo}>{children}</h2>
      {acaoObj ? (
        <button type="button" onClick={acao.onClick} style={styles.secaoAcao}>
          {acao.label}
        </button>
      ) : (
        acao
      )}
    </div>
  )
}
export function Vazio({ icone: Icone, titulo, texto, acao, cor = 'lavanda' }) {
  const acaoObj = acao && typeof acao === 'object' && !isValidElement(acao) && acao.label
  return (
    <div style={styles.vazio} className="anim-up">
      {Icone && (
        <span
          style={{
            ...styles.vazioIcone,
            background: SUPERFICIES[cor] || cor,
          }}
          className="anim-pop"
        >
          <Icone size={30} color="#000" strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      {titulo && <h3 style={styles.vazioTitulo}>{titulo}</h3>}
      {texto && <p style={styles.vazioTexto}>{texto}</p>}
      {acaoObj ? (
        <Botao
          icone={acao.icone}
          onClick={acao.onClick}
          style={{
            marginTop: 8,
          }}
        >
          {acao.label}
        </Botao>
      ) : (
        acao && (
          <div
            style={{
              marginTop: 8,
            }}
          >
            {acao}
          </div>
        )
      )}
    </div>
  )
}
const styles = {
  card: {
    position: 'relative',
    color: 'var(--text)',
  },
  cardBotao: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    font: 'inherit',
  },
  botao: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 'var(--r-btn)',
    fontWeight: 600,
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
  },
  botaoIcone: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  centro: {
    display: 'flex',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 16px',
    borderRadius: 'var(--r-badge)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 'var(--r-badge)',
    fontSize: 14,
    fontWeight: 400,
    color: '#000',
    whiteSpace: 'nowrap',
  },
  toggle: {
    position: 'relative',
    borderRadius: 999,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.25s',
  },
  toggleBola: {
    position: 'absolute',
    left: 0,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    transition: 'transform 0.35s var(--spring)',
  },
  seg: {
    position: 'relative',
    display: 'flex',
    padding: 4,
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface-2)',
  },
  segIndicador: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 21,
    background: '#000',
    transition: 'left 0.4s var(--spring)',
  },
  segBotao: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontWeight: 600,
    borderRadius: 21,
    padding: '0 8px',
    transition: 'color 0.25s',
  },
  segTexto: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  campoWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },
  campoRotulo: {
    fontWeight: 600,
    color: 'var(--text-2)',
    paddingLeft: 6,
  },
  campoCaixa: {
    position: 'relative',
  },
  campoIcone: {
    position: 'absolute',
    left: 18,
    pointerEvents: 'none',
  },
  campo: {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-btn)',
    paddingRight: 18,
    color: 'var(--text)',
  },
  campoMulti: {
    minHeight: 120,
    padding: '14px 18px',
    borderRadius: 20,
    resize: 'vertical',
    lineHeight: 1.45,
  },
  veu: {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
  },
  sheet: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 901,
    margin: '0 auto',
    maxWidth: 520,
    background: 'var(--bg)',
    borderRadius: 'var(--r-card) var(--r-card) 0 0',
    boxShadow: '0 -10px 40px rgba(120, 100, 200, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
  },
  alca: {
    width: 44,
    height: 5,
    borderRadius: 3,
    background: 'var(--border)',
    margin: '10px auto 2px',
    flexShrink: 0,
  },
  sheetTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '8px 20px 12px',
    flexShrink: 0,
  },
  sheetTitulo: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
  },
  sheetCorpo: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '4px 20px calc(24px + env(safe-area-inset-bottom))',
  },
  modalCentro: {
    position: 'fixed',
    inset: 0,
    zIndex: 901,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    pointerEvents: 'none',
  },
  modal: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 400,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: 26,
    boxShadow: 'var(--sombra)',
  },
  modalTitulo: {
    fontWeight: 800,
    lineHeight: 1.05,
  },
  modalTexto: {
    color: 'var(--text-2)',
    marginTop: 10,
    lineHeight: 1.45,
  },
  modalAcoes: {
    display: 'flex',
    gap: 10,
    marginTop: 22,
  },
  secao: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    margin: '24px 2px 12px',
  },
  secaoTitulo: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  secaoAcao: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    padding: '6px 2px',
  },
  vazio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    padding: '36px 20px',
  },
  vazioIcone: {
    width: 72,
    height: 72,
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    boxShadow: 'var(--sombra)',
  },
  vazioTitulo: {
    fontSize: 21,
    fontWeight: 700,
  },
  vazioTexto: {
    fontSize: 16,
    color: 'var(--text-2)',
    maxWidth: 300,
    lineHeight: 1.45,
  },
}
