import { ChevronRight } from 'lucide-react'
import { Toggle } from './ui'
import useModoSimples from '../hooks/useModoSimples'
if (typeof document !== 'undefined' && !document.getElementById('cfg-grupo-anim')) {
  const el = document.createElement('style')
  el.id = 'cfg-grupo-anim'
  el.textContent =
    '.cfggrupo-linha { transition: background .25s ease, opacity .25s ease; }' +
    ' .cfggrupo-linha:not(:disabled):active { background: var(--surface-2) !important; transition: background 0s; }' +
    ' @keyframes cfgDestaque { 0% { box-shadow: 0 0 0 0 rgba(183,178,255,0); } 25% { box-shadow: 0 0 0 6px var(--lavanda-forte); } 100% { box-shadow: var(--sombra); } }' +
    ' .cfg-destaque { animation: cfgDestaque 1.8s ease-out both; }'
  document.head.appendChild(el)
}
const CORES_ICONE = {
  lavanda: 'var(--lavanda)',
  forte: 'var(--lavanda-forte)',
  lima: 'var(--lima)',
  ceu: 'var(--ceu)',
  mist: 'var(--surface-2)',
  creme: 'var(--bg)',
}
export function ConfigGrupo({
  id,
  titulo,
  rodape,
  acao,
  children,
  destaque = false,
  semPadding = false,
  style,
}) {
  return (
    <section id={id ? `cfg-${id}` : undefined} style={styles.secao}>
      {(titulo || acao) && (
        <div style={styles.topo}>
          {titulo && <h2 style={styles.titulo}>{titulo}</h2>}
          {acao}
        </div>
      )}
      <div
        className={['kleo-card', destaque ? 'cfg-destaque' : ''].filter(Boolean).join(' ')}
        style={{
          ...styles.grupo,
          padding: semPadding ? 0 : '6px 0',
          ...style,
        }}
      >
        {children}
      </div>
      {rodape && <p style={styles.rodape}>{rodape}</p>}
    </section>
  )
}
export function ConfigIcone({ icon, icone, cor = 'lavanda', destrutivo = false, tamanho }) {
  const simples = useModoSimples()
  const Icone = icone || icon
  const lado = tamanho || (simples ? 42 : 36)
  return (
    <span
      style={{
        ...styles.icone,
        width: lado,
        height: lado,
        background: destrutivo ? 'rgba(229, 72, 77, 0.13)' : CORES_ICONE[cor] || cor,
      }}
      aria-hidden="true"
    >
      {Icone && (
        <Icone size={Math.round(lado * 0.5)} color={destrutivo ? 'var(--erro)' : '#000'} strokeWidth={2.1} />
      )}
    </span>
  )
}
export function ConfigLinha({
  icon,
  icone,
  cor = 'lavanda',
  titulo,
  detalhe,
  direita,
  onClick,
  destrutivo = false,
  semChevron = false,
  ultima = false,
  desabilitado = false,
  ariaLabel,
  className = '',
  style,
}) {
  const simples = useModoSimples()
  const Icone = icone || icon
  const conteudo = (
    <>
      {Icone && <ConfigIcone icone={Icone} cor={cor} destrutivo={destrutivo} />}
      <span
        style={{
          ...styles.linhaCorpo,
          borderBottom: ultima ? 'none' : '1px solid var(--surface-2)',
        }}
      >
        <span style={styles.textos}>
          <span
            style={{
              ...styles.linhaTitulo,
              fontSize: simples ? 18 : 16,
              color: destrutivo ? 'var(--erro)' : 'var(--text)',
            }}
          >
            {titulo}
          </span>
          {detalhe && (
            <span
              style={{
                ...styles.detalhe,
                fontSize: simples ? 15 : 14,
              }}
            >
              {detalhe}
            </span>
          )}
        </span>
        {direita}
        {onClick && !semChevron && (
          <ChevronRight
            size={20}
            color="var(--text-3)"
            style={{
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
        )}
      </span>
    </>
  )
  const estilo = {
    ...styles.linha,
    minHeight: simples ? 68 : 58,
    opacity: desabilitado ? 0.45 : 1,
    ...style,
  }
  if (onClick) {
    return (
      <button
        type="button"
        className={`cfggrupo-linha ${className}`}
        onClick={onClick}
        disabled={desabilitado}
        style={{
          ...estilo,
          width: '100%',
          textAlign: 'left',
        }}
        aria-label={ariaLabel}
      >
        {conteudo}
      </button>
    )
  }
  return (
    <div className={className || undefined} style={estilo}>
      {conteudo}
    </div>
  )
}
export function ConfigSwitch({ ativo, onChange, label, disabled }) {
  return <Toggle ligado={!!ativo} onChange={onChange} label={label} disabled={disabled} />
}
export function ConfigBloco({ children, style }) {
  return (
    <div
      style={{
        ...styles.bloco,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
const styles = {
  secao: {
    marginTop: 30,
    scrollMarginTop: 12,
  },
  topo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    margin: '0 4px 12px',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
    color: 'var(--text)',
  },
  grupo: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    overflow: 'hidden',
    boxShadow: 'var(--sombra)',
  },
  rodape: {
    fontSize: 14,
    color: 'var(--text-3)',
    margin: '10px 12px 0',
    lineHeight: 1.45,
  },
  icone: {
    borderRadius: '30%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 16,
    background: 'transparent',
    color: 'var(--text)',
    font: 'inherit',
  },
  linhaCorpo: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  linhaTitulo: {
    fontWeight: 600,
    lineHeight: 1.25,
    overflowWrap: 'anywhere',
  },
  detalhe: {
    color: 'var(--text-2)',
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },
  bloco: {
    padding: '14px 18px',
  },
}
