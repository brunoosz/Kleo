import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import BottomNav from './BottomNav'
import { BotaoIcone } from './ui'
import useModoSimples from '../hooks/useModoSimples'
export { BotaoIcone } from './ui'
export default function Tela({
  titulo,
  subtitulo,
  acoes,
  voltar = false,
  semNav = false,
  semPadding = false,
  rolavel = true,
  children,
}) {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const temTopo = voltar || acoes
  return (
    <div style={styles.root}>
      {(titulo || temTopo) && (
        <header style={styles.header}>
          {temTopo && (
            <div style={styles.headerTop}>
              {voltar ? (
                simples ? (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={styles.voltarTexto}
                    className="anim-left tap"
                  >
                    <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" /> <span>Voltar</span>
                  </button>
                ) : (
                  <span className="anim-left">
                    <BotaoIcone icone={ChevronLeft} label="Voltar" onClick={() => navigate(-1)} />
                  </span>
                )
              ) : (
                <span />
              )}
              <div style={styles.acoes} className="anim-fade">
                {acoes}
              </div>
            </div>
          )}

          {titulo && (
            <h1
              key={titulo}
              className="anim-up"
              style={{
                ...styles.titulo,
                fontSize: simples ? 36 : 40,
              }}
            >
              {titulo}
            </h1>
          )}
          {subtitulo && (
            <p
              key={subtitulo}
              className="anim-up"
              style={{
                ...styles.subtitulo,
                fontSize: simples ? 18 : 17,
                animationDelay: '0.06s',
              }}
            >
              {subtitulo}
            </p>
          )}
        </header>
      )}
      <main
        style={{
          ...styles.main,
          overflowY: rolavel ? 'auto' : 'hidden',
          padding: semPadding ? 0 : '10px 20px 28px',
        }}
      >
        {children}
      </main>
      {!semNav && <BottomNav />}
    </div>
  )
}
const styles = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 520,
    margin: '0 auto',
    width: '100%',
    background: 'var(--bg)',
    color: 'var(--text)',
  },
  header: {
    padding: '12px 20px 8px',
    flexShrink: 0,
    paddingTop: 'max(12px, env(safe-area-inset-top))',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
    marginBottom: 6,
  },
  voltarTexto: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
    padding: '0 20px 0 12px',
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    boxShadow: 'var(--sombra)',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
  },
  acoes: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  titulo: {
    fontWeight: 800,
    letterSpacing: 'normal',
    lineHeight: 1,
    marginTop: 6,
    color: 'var(--text)',
    overflowWrap: 'break-word',
  },
  subtitulo: {
    color: 'var(--text-2)',
    marginTop: 8,
    lineHeight: 1.35,
  },
  main: {
    flex: 1,
    minHeight: 0,
  },
}
