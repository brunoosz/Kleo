import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Check, LayoutGrid, WandSparkles } from 'lucide-react'
import Mascote from '../components/Mascote'
import MascExplorar, { CardMascote } from '../components/MascExplorar'
import FileiraRolavel from '../components/FileiraRolavel'
import { Botao, BotaoIcone, Tag, TituloSecao } from '../components/ui'
import { getMascoteSpec, resolverMascote, sugeridos } from '../data/mascotes'
import { ler, salvar } from '../lib/storage'
import { falar } from '../lib/voz'
import useModoSimples from '../hooks/useModoSimples'
import { leituraVozAtiva } from '../lib/perfil'
export default function MascoteSelector() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const vindoDeConfig = params.get('voltar') === '1'
  const simples = useModoSimples()
  const profile = useMemo(() => ler('kleo_profile', null), [])
  const leitura = useMemo(() => leituraVozAtiva(profile), [profile])
  const automatico = useMemo(() => resolverMascote(profile, 'auto'), [profile])
  const recomendados = useMemo(
    () =>
      sugeridos(profile).map(id => {
        const m = getMascoteSpec(id)
        return {
          id: m.id,
          nome: m.nome,
          sub: m.descricao,
        }
      }),
    [profile],
  )
  const [selecionado, setSelecionado] = useState(() => {
    const salvo = ler('kleo_mascote', null)
    if (!salvo || salvo === 'auto' || typeof salvo !== 'string') return 'auto'
    return getMascoteSpec(salvo).id
  })
  const [animKey, setAnimKey] = useState(0)
  const [explorar, setExplorar] = useState(false)
  const exibido = selecionado === 'auto' ? automatico : selecionado
  const atual = getMascoteSpec(exibido)
  const ehRecomendado = recomendados.some(r => r.id === exibido)
  function escolher(id) {
    setExplorar(false)
    if (id === selecionado) return
    setSelecionado(id)
    setAnimKey(k => k + 1)
    if (leitura) {
      const alvo = id === 'auto' ? automatico : id
      const m = getMascoteSpec(alvo)
      falar(`${id === 'auto' ? 'Automático. ' : ''}${m.nome}. ${m.descricao}.`, {
        mascote: alvo,
      }).catch(() => {})
    }
  }
  function continuar() {
    salvar('kleo_mascote', selecionado)
    if (vindoDeConfig) navigate(-1)
    else if (ler('kleo_tutorial_done', false) === true)
      navigate('/home', {
        replace: true,
      })
    else
      navigate('/tutorial', {
        replace: true,
      })
  }
  return (
    <div style={styles.root}>
      <header style={styles.header}>
        {vindoDeConfig && (
          <div style={styles.headerTop}>
            {simples ? (
              <button type="button" className="tap" style={styles.voltarPill} onClick={() => navigate(-1)}>
                <ChevronLeft size={22} aria-hidden="true" /> Voltar
              </button>
            ) : (
              <BotaoIcone icone={ChevronLeft} label="Voltar" onClick={() => navigate(-1)} />
            )}
          </div>
        )}
        <h1
          style={{
            ...styles.titulo,
            fontSize: simples ? 38 : 42,
          }}
          className="anim-up"
        >
          Seu mascote
        </h1>
        {!simples && (
          <p
            style={{
              ...styles.subtitulo,
              animationDelay: '0.08s',
            }}
            className="anim-up"
          >
            Só muda o visual. Quem te ajuda é sempre a Kleo.
          </p>
        )}
      </header>

      <main style={styles.main}>
        <section className="anim-scale" style={styles.destaque} aria-live="polite">
          <div style={styles.selos}>
            {selecionado === 'auto' && (
              <Tag cor="lima" icone={WandSparkles} key="auto">
                Automático
              </Tag>
            )}
            {selecionado !== 'auto' && ehRecomendado && (
              <Tag cor="lima" key="rec">
                Combina com você
              </Tag>
            )}
          </div>
          <span
            style={{
              ...styles.bolinha,
              ...styles.bolinhaCeu,
            }}
            aria-hidden="true"
          />
          <span
            style={{
              ...styles.bolinha,
              ...styles.bolinhaBranca,
            }}
            aria-hidden="true"
          />

          <div key={animKey} style={styles.destaqueMascote}>
            <Mascote id={atual.id} tamanho={simples ? 190 : 200} estado="idle" />
          </div>
          <div
            key={'txt-' + animKey}
            className="anim-up"
            style={{
              animationDelay: '0.06s',
            }}
          >
            <h2 style={styles.destaqueNome}>{atual.nome}</h2>
            <p style={styles.destaqueDesc}>{atual.descricao}</p>
          </div>
        </section>

        <TituloSecao>Para você</TituloSecao>

        <Fileira simples={simples}>
          <button
            type="button"
            className="tap anim-up"
            onClick={() => escolher('auto')}
            aria-pressed={selecionado === 'auto'}
            aria-label="Automático: combina com seu perfil"
            style={{
              ...styles.cardAuto,
              width: simples ? undefined : 128,
              background: selecionado === 'auto' ? 'var(--lima)' : 'var(--surface)',
              outline: selecionado === 'auto' ? '2px solid #000' : 'none',
            }}
          >
            {selecionado === 'auto' && (
              <span className="anim-pop" style={styles.check}>
                <Check size={13} color="#fff" strokeWidth={3} aria-hidden="true" />
              </span>
            )}
            <span style={styles.autoIcone}>
              <WandSparkles size={26} color="#000" aria-hidden="true" />
            </span>
            <span
              style={{
                ...styles.autoNome,
                fontSize: simples ? 17 : 15,
              }}
            >
              Automático
            </span>
            {!simples && <span style={styles.autoSub}>Combina com o perfil</span>}
          </button>
          {recomendados.map((m, i) => (
            <CardMascote
              key={m.id}
              m={m}
              ativo={selecionado === m.id}
              simples={simples}
              atraso={0.04 * (i + 1)}
              largura={simples ? undefined : 128}
              onClick={() => escolher(m.id)}
            />
          ))}
        </Fileira>

        <div style={styles.explorar}>
          <Botao variante="fantasma" icone={LayoutGrid} cheio onClick={() => setExplorar(true)}>
            Ver todos os mascotes
          </Botao>
        </div>
      </main>

      <footer style={styles.footer}>
        <Botao grande cheio onClick={continuar}>
          Continuar com{' '}
          <span
            key={atual.id}
            className="anim-fade"
            style={{
              display: 'inline-block',
            }}
          >
            {atual.nome}
          </span>
        </Botao>
      </footer>

      <MascExplorar
        aberto={explorar}
        onFechar={() => setExplorar(false)}
        selecionado={selecionado === 'auto' ? null : selecionado}
        onEscolher={escolher}
        simples={simples}
      />
      <style>{keyframes}</style>
    </div>
  )
}
function Fileira({ simples, children }) {
  if (simples)
    return (
      <div style={styles.gradeSimples} role="group" aria-label="Mascotes sugeridos">
        {children}
      </div>
    )
  return (
    <div style={styles.carrosselWrap}>
      <FileiraRolavel rotulo="Mascotes sugeridos" style={styles.carrossel}>
        {children}
      </FileiraRolavel>
    </div>
  )
}
const keyframes = `
@keyframes msDestaque {
  0% { opacity: 0; transform: scale(0.7) translateY(14px); }
  55% { opacity: 1; transform: scale(1.06) translateY(-6px); }
  100% { opacity: 1; transform: none; }
}
`
const styles = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    color: 'var(--text)',
    maxWidth: 520,
    margin: '0 auto',
    width: '100%',
  },
  header: {
    padding: '18px 16px 4px',
    paddingTop: 'max(18px, env(safe-area-inset-top))',
    flexShrink: 0,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  voltarPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
    padding: '0 18px 0 12px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    color: 'var(--text)',
    fontSize: 18,
    fontWeight: 600,
  },
  titulo: {
    fontWeight: 800,
    lineHeight: 0.98,
  },
  subtitulo: {
    fontSize: 17,
    color: 'var(--text-2)',
    marginTop: 8,
    lineHeight: 1.4,
  },
  main: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '16px 16px 20px',
  },
  destaque: {
    position: 'relative',
    borderRadius: 'var(--r-card)',
    background: 'var(--lavanda)',
    boxShadow: 'var(--sombra)',
    padding: '26px 20px 26px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    overflow: 'hidden',
  },
  selos: {
    position: 'absolute',
    top: 18,
    left: 18,
    display: 'flex',
    gap: 6,
    zIndex: 1,
  },
  bolinha: {
    position: 'absolute',
    borderRadius: '50%',
  },
  bolinhaCeu: {
    width: 70,
    height: 70,
    background: 'var(--ceu)',
    opacity: 0.55,
    right: -18,
    top: 40,
  },
  bolinhaBranca: {
    width: 40,
    height: 40,
    background: 'var(--surface)',
    opacity: 0.6,
    left: 26,
    bottom: 96,
  },
  destaqueMascote: {
    position: 'relative',
    margin: '20px 0 8px',
    animation: 'msDestaque 0.55s var(--ease-out) both',
  },
  destaqueNome: {
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1,
  },
  destaqueDesc: {
    fontSize: 17,
    color: 'var(--text-2)',
    marginTop: 6,
  },
  carrosselWrap: {
    margin: '0 -16px',
  },
  carrossel: {
    gap: 10,
    padding: '4px 16px 14px',
  },
  gradeSimples: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  cardAuto: {
    position: 'relative',
    flexShrink: 0,
    borderRadius: 'var(--r-card-m)',
    padding: '14px 8px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: 'var(--text)',
    outlineOffset: -2,
    minHeight: 140,
    transition: 'background 0.25s',
  },
  autoIcone: {
    width: 64,
    height: 64,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  autoNome: {
    fontWeight: 700,
  },
  autoSub: {
    fontSize: 12,
    color: 'var(--text-3)',
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  explorar: {
    marginTop: 18,
  },
  footer: {
    flexShrink: 0,
    padding: '12px 16px',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    background: 'var(--bg)',
  },
}
