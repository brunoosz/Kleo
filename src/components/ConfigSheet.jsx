import { useEffect } from 'react'
import useSaida from '../hooks/useSaida'
import useModoSimples from '../hooks/useModoSimples'
import Camada from './Camada'
import { Botao } from './ui'
export default function ConfigSheet({
  aberto,
  titulo,
  mensagem,
  confirmarTexto = 'Confirmar',
  destrutivo = true,
  onConfirmar,
  onCancelar,
  icon: Icon,
  confirmarDesabilitado = false,
  children,
}) {
  const simples = useModoSimples()
  useEffect(() => {
    if (!aberto) return
    const tecla = e => {
      if (e.key === 'Escape') onCancelar?.()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto, onCancelar])
  const { montado, saindo } = useSaida(aberto)
  if (!montado) return null
  return (
    <Camada>
      <div
        className={'kleo-veu ' + (saindo ? 'sheet-backdrop-out' : 'sheet-backdrop')}
        style={{
          ...styles.fundo,
          pointerEvents: saindo ? 'none' : 'auto',
        }}
        onClick={onCancelar}
        role="presentation"
      />
      <div style={styles.posicao}>
        <div
          style={styles.folha}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="config-sheet-titulo"
          className={saindo ? 'sheet-out' : 'sheet'}
        >
          <div style={styles.alca} aria-hidden="true" />
          {Icon && (
            <span
              className="anim-pop"
              style={{
                ...styles.iconeTopo,
                animationDelay: '0.12s',
                background: destrutivo ? 'rgba(229, 72, 77, 0.13)' : 'var(--lavanda)',
              }}
            >
              <Icon size={28} color={destrutivo ? 'var(--erro)' : '#000'} strokeWidth={2.1} />
            </span>
          )}
          <h3
            id="config-sheet-titulo"
            style={{
              ...styles.titulo,
              fontSize: simples ? 28 : 25,
            }}
          >
            {titulo}
          </h3>
          {mensagem && (
            <p
              style={{
                ...styles.mensagem,
                fontSize: simples ? 18 : 16,
              }}
            >
              {mensagem}
            </p>
          )}
          {children && <div style={styles.extra}>{children}</div>}
          <div style={styles.acoes}>
            <Botao
              variante={destrutivo ? 'perigo' : 'primario'}
              grande
              cheio
              onClick={onConfirmar}
              disabled={confirmarDesabilitado}
            >
              {confirmarTexto}
            </Botao>
            <Botao variante="fantasma" grande cheio onClick={onCancelar}>
              Cancelar
            </Botao>
          </div>
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
  },
  posicao: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  folha: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 520,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card) var(--r-card) 0 0',
    boxShadow: '0 -10px 40px rgba(120, 100, 200, 0.18)',
    padding: '10px 22px calc(22px + env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  alca: {
    width: 44,
    height: 5,
    borderRadius: 3,
    background: 'var(--border)',
    marginBottom: 8,
  },
  iconeTopo: {
    width: 64,
    height: 64,
    borderRadius: '30%',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontWeight: 800,
    lineHeight: 1.05,
    color: 'var(--text)',
  },
  mensagem: {
    color: 'var(--text-2)',
    lineHeight: 1.45,
    maxWidth: 420,
  },
  extra: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  acoes: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 12,
  },
}
