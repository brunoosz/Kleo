import {
  Component,
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { RotateCw, WifiOff, House } from 'lucide-react'
import Home from './screens/Home'
import Abertura from './components/Abertura'
import useAcessibilidade from './hooks/useAcessibilidade'
import VigiaGlobal from './components/VigiaGlobal'
import VigiaConversas from './components/VigiaConversas'
import AvisoVoz from './components/AvisoVoz'
import Emergencia from './components/Emergencia'
import { sessaoAtual, ouvirSessao, destinoDepoisDeEntrar } from './lib/conta'
import * as conta from './lib/conta'
import { perfilCompleto } from './lib/perfil'
import { ler } from './lib/storage'
import './index.css'
function sobDemanda(carregar) {
  let modulo = null
  const buscar = () =>
    carregar().then(m => {
      modulo = m
      return m
    })
  const Tela = lazy(() =>
    modulo
      ? {
          then: entregar => entregar(modulo),
        }
      : buscar(),
  )
  return {
    Tela,
    buscar,
  }
}
const TELAS = {
  entrar: sobDemanda(() => import('./screens/Entrar')),
  onboarding: sobDemanda(() => import('./screens/Onboarding')),
  mascote: sobDemanda(() => import('./screens/MascoteSelector')),
  tutorial: sobDemanda(() => import('./screens/Tutorial')),
  chat: sobDemanda(() => import('./screens/Chat')),
  agenda: sobDemanda(() => import('./screens/Agenda')),
  notas: sobDemanda(() => import('./screens/Notas')),
  mapa: sobDemanda(() => import('./screens/Mapa')),
  rotinas: sobDemanda(() => import('./screens/Rotinas')),
  profissao: sobDemanda(() => import('./screens/Profissao')),
  configuracoes: sobDemanda(() => import('./screens/Configuracoes')),
  pessoas: sobDemanda(() => import('./screens/Pessoas')),
  conversa: sobDemanda(() => import('./screens/Conversa')),
}
const Entrar = TELAS.entrar.Tela
const Onboarding = TELAS.onboarding.Tela
const MascoteSelector = TELAS.mascote.Tela
const Tutorial = TELAS.tutorial.Tela
const Chat = TELAS.chat.Tela
const Agenda = TELAS.agenda.Tela
const Notas = TELAS.notas.Tela
const Mapa = TELAS.mapa.Tela
const Rotinas = TELAS.rotinas.Tela
const Profissao = TELAS.profissao.Tela
const Configuracoes = TELAS.configuracoes.Tela
const Pessoas = TELAS.pessoas.Tela
const Conversa = TELAS.conversa.Tela
const ignorar = () => {}
function preCarregarRota(caminho) {
  const [, base, resto] = String(caminho || '').split('/')
  const chave = base === 'pessoas' && resto ? 'conversa' : base
  if (TELAS[chave]) TELAS[chave].buscar().catch(ignorar)
}
function preCarregarTelas() {
  if (navigator.connection?.saveData) return
  const fila = Object.values(TELAS)
  const quandoLivre = f =>
    window.requestIdleCallback
      ? window.requestIdleCallback(f, {
          timeout: 3000,
        })
      : setTimeout(f, 300)
  const proxima = () => {
    const t = fila.shift()
    if (t)
      t.buscar()
        .catch(ignorar)
        .finally(() => quandoLivre(proxima))
  }
  quandoLivre(proxima)
}
const carregando = {
  n: 0,
  ouvintes: new Set(),
}
function mudarCarregando(delta) {
  carregando.n += delta
  carregando.ouvintes.forEach(f => f())
}
function assinarCarregando(f) {
  carregando.ouvintes.add(f)
  return () => carregando.ouvintes.delete(f)
}
const haTelaCarregando = () => carregando.n > 0
const SessaoContexto = createContext(undefined)
const RESERVA_SESSAO = 12000
const normalizarSessao = s =>
  s && typeof s === 'object'
    ? {
        ...s,
        logado: !!s.logado,
      }
    : {
        logado: false,
      }
const mesmaSessao = (a, b) => !!a && a.logado === b.logado && a.tipo === b.tipo && a.uid === b.uid
let abriuPeloEmail = false
function contaJaEntrou() {
  try {
    const e = conta.estadoConta?.()
    return !!e && !e.carregando && !!e.logado
  } catch {
    return false
  }
}
function useSessao() {
  const [sessao, setSessao] = useState(undefined)
  useEffect(() => {
    let vivo = true
    const aplicar = s => {
      if (!vivo) return
      const nova = normalizarSessao(s)
      setSessao(atual => (mesmaSessao(atual, nova) ? atual : nova))
    }
    const conferir = () => Promise.resolve().then(() => sessaoAtual())
    const retorno = Promise.resolve()
      .then(() => conta.retornoDoEmail?.())
      .catch(() => null)
    Promise.all([conferir(), retorno]).then(
      ([s, r]) => {
        abriuPeloEmail = !!r
        aplicar(s)
      },
      erro => {
        console.warn('[Kleo] Não consegui conferir a sessão:', erro)
        aplicar({
          logado: false,
        })
      },
    )
    let parar = null
    try {
      parar = ouvirSessao(s => {
        if (s && typeof s === 'object' && 'logado' in s) aplicar(s)
        else conferir().then(aplicar, ignorar)
      })
    } catch {}
    const reserva = setTimeout(() => {
      if (vivo && perfilCompleto())
        setSessao(atual =>
          atual === undefined
            ? {
                logado: true,
                tipo: 'local',
                provisoria: true,
              }
            : atual,
        )
    }, RESERVA_SESSAO)
    return () => {
      vivo = false
      clearTimeout(reserva)
      if (typeof parar === 'function') parar()
    }
  }, [])
  return sessao
}
const CHAVE_ULTIMA_ROTA = 'kleo_ultima_rota'
const RETOMAR_MS = 15 * 60000
const RETOMAVEL =
  /^\/(home|chat|agenda|notas|mapa|rotinas|configuracoes|profissao(\/[^/]+)?|pessoas(\/[^/]+)?)$/
function lembrarRota(rota) {
  if (!RETOMAVEL.test(rota)) return
  try {
    localStorage.setItem(
      CHAVE_ULTIMA_ROTA,
      JSON.stringify({
        rota,
        em: Date.now(),
      }),
    )
  } catch {}
}
function rotaParaRetomar() {
  const u = ler(CHAVE_ULTIMA_ROTA, null)
  const recente = u && Date.now() - (Number(u.em) || 0) < RETOMAR_MS
  return recente && typeof u.rota === 'string' && RETOMAVEL.test(u.rota) ? u.rota : null
}
function destinoInicial(sessao) {
  if (!sessao?.logado) return '/entrar'
  if (!perfilCompleto()) return '/onboarding'
  if (!ler('kleo_mascote')) return '/mascote'
  if (ler('kleo_tutorial_done', false) !== true) return '/tutorial'
  return rotaParaRetomar() || '/home'
}
function destinoAposEntrar() {
  try {
    const d = destinoDepoisDeEntrar()
    if (typeof d === 'string' && d.startsWith('/') && !d.startsWith('/entrar')) return d
  } catch {}
  return perfilCompleto() ? '/home' : '/onboarding'
}
function Inicio() {
  const sessao = useContext(SessaoContexto)
  return <Navigate to={destinoInicial(sessao)} replace />
}
function Protegida({ children, semPerfil = false }) {
  const sessao = useContext(SessaoContexto)
  const location = useLocation()
  const logado = !!sessao?.logado || contaJaEntrou()
  if (!logado)
    return (
      <Navigate
        to="/entrar"
        replace
        state={{
          de: location.pathname + location.search,
        }}
      />
    )
  if (!semPerfil && !perfilCompleto()) return <Navigate to="/onboarding" replace />
  return children
}
function SoVisitante({ children }) {
  const sessao = useContext(SessaoContexto)
  const [jaEntrou] = useState(() => !!sessao?.logado && !abriuPeloEmail)
  useEffect(() => {
    abriuPeloEmail = false
  }, [])
  return jaEntrou ? <Navigate to={destinoAposEntrar()} replace /> : children
}
function TelaCarregando() {
  useEffect(() => {
    mudarCarregando(1)
    return () => mudarCarregando(-1)
  }, [])
  return (
    <div style={styles.carregando} role="status" aria-label="Carregando a tela">
      <div className="skeleton" style={styles.esqTitulo} />
      <div
        className="skeleton"
        style={{
          ...styles.esqCard,
          height: 168,
        }}
      />
      <div
        className="skeleton"
        style={{
          ...styles.esqCard,
          height: 124,
        }}
      />
      <div
        className="skeleton"
        style={{
          ...styles.esqCard,
          height: 92,
        }}
      />
    </div>
  )
}
function FalhaTela() {
  const semInternet = typeof navigator !== 'undefined' && navigator.onLine === false
  return (
    <div style={styles.falha} role="alert">
      <span style={styles.falhaIcone} aria-hidden="true">
        <WifiOff size={30} color="#000" />
      </span>
      <h1 style={styles.falhaTitulo}>Não consegui abrir esta tela</h1>
      <p style={styles.falhaTexto}>
        {semInternet
          ? 'Parece que a internet caiu. Confira o Wi-Fi ou os dados móveis.'
          : 'Confira a internet e tente de novo.'}
      </p>
      <button
        type="button"
        className="tap"
        style={styles.falhaBotao}
        onClick={() => window.location.reload()}
      >
        <RotateCw size={20} aria-hidden="true" /> Tentar de novo
      </button>
      <a href="/home" className="tap" style={styles.falhaLink}>
        <House size={18} aria-hidden="true" /> Ir para o Início
      </a>
    </div>
  )
}
class ErroDeTela extends Component {
  constructor(props) {
    super(props)
    this.state = {
      erro: null,
    }
  }
  static getDerivedStateFromError(erro) {
    return {
      erro,
    }
  }
  componentDidCatch(erro) {
    console.warn('[Kleo] Não consegui abrir a tela:', erro?.message || erro)
  }
  render() {
    return this.state.erro ? <FalhaTela /> : this.props.children
  }
}
const ROTAS_ABA = ['/home', '/chat', '/agenda', '/notas', '/mapa', '/rotinas', '/profissao', '/pessoas']
const ehAba = rota => ROTAS_ABA.some(r => rota === r || (r === '/profissao' && rota.startsWith(r + '/')))
let rotaAnterior = null
const TITULOS = {
  '/home': 'Início',
  '/chat': 'Conversar com a Kleo',
  '/agenda': 'Agenda',
  '/notas': 'Notas',
  '/mapa': 'Mapa',
  '/rotinas': 'Rotinas',
  '/profissao': 'Trabalho',
  '/configuracoes': 'Ajustes',
  '/pessoas': 'Pessoas',
  '/onboarding': 'Boas-vindas',
  '/mascote': 'Mascote',
  '/tutorial': 'Tutorial',
  '/entrar': 'Entrar',
}
function tituloDa(rota) {
  if (rota.startsWith('/pessoas/')) return 'Conversa'
  const base = '/' + (rota.split('/')[1] || '')
  return TITULOS[base] || ''
}
function RotasAnimadas() {
  const location = useLocation()
  const tipo = useNavigationType()
  const sessao = useContext(SessaoContexto)
  const de = rotaAnterior && rotaAnterior !== '/' ? rotaAnterior : null
  const para = location.pathname
  let anim = 'route-fade'
  if (de && ehAba(de) && ehAba(para)) anim = 'route-tab'
  else if (de && de !== para) anim = tipo === 'POP' ? 'route-back' : 'route-push'
  useEffect(() => {
    rotaAnterior = para
    lembrarRota(para)
  }, [para])
  useEffect(() => {
    const t = tituloDa(para)
    document.title = t ? `Kleo · ${t}` : 'Kleo'
  }, [para])
  if (sessao === undefined) return null
  return (
    <div key={location.pathname} className={'route ' + anim}>
      <ErroDeTela>
        <Suspense fallback={<TelaCarregando />}>
          <Routes location={location}>
            <Route path="/" element={<Inicio />} />
            <Route
              path="/entrar"
              element={
                <SoVisitante>
                  <Entrar />
                </SoVisitante>
              }
            />
            <Route
              path="/onboarding"
              element={
                <Protegida semPerfil>
                  <Onboarding />
                </Protegida>
              }
            />
            <Route
              path="/mascote"
              element={
                <Protegida>
                  <MascoteSelector />
                </Protegida>
              }
            />
            <Route
              path="/tutorial"
              element={
                <Protegida>
                  <Tutorial />
                </Protegida>
              }
            />
            <Route
              path="/home"
              element={
                <Protegida>
                  <Home />
                </Protegida>
              }
            />
            <Route
              path="/chat"
              element={
                <Protegida>
                  <Chat />
                </Protegida>
              }
            />
            <Route
              path="/agenda"
              element={
                <Protegida>
                  <Agenda />
                </Protegida>
              }
            />
            <Route
              path="/notas"
              element={
                <Protegida>
                  <Notas />
                </Protegida>
              }
            />
            <Route
              path="/mapa"
              element={
                <Protegida>
                  <Mapa />
                </Protegida>
              }
            />
            <Route
              path="/rotinas"
              element={
                <Protegida>
                  <Rotinas />
                </Protegida>
              }
            />
            <Route
              path="/profissao"
              element={
                <Protegida>
                  <Profissao />
                </Protegida>
              }
            />
            <Route
              path="/profissao/:id"
              element={
                <Protegida>
                  <Profissao />
                </Protegida>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <Protegida>
                  <Configuracoes />
                </Protegida>
              }
            />
            <Route
              path="/pessoas"
              element={
                <Protegida>
                  <Pessoas />
                </Protegida>
              }
            />
            <Route
              path="/pessoas/:uid"
              element={
                <Protegida>
                  <Conversa />
                </Protegida>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErroDeTela>
    </div>
  )
}
function Raiz() {
  useAcessibilidade()
  const sessao = useSessao()
  const location = useLocation()
  const [abrindo, setAbrindo] = useState(true)
  const telaCarregando = useSyncExternalStore(assinarCarregando, haTelaCarregando)
  const pronto = sessao !== undefined && location.pathname !== '/' && !telaCarregando
  useEffect(() => {
    preCarregarRota(window.location.pathname)
    if (!perfilCompleto()) {
      TELAS.entrar.buscar().catch(ignorar)
      TELAS.onboarding.buscar().catch(ignorar)
    }
  }, [])
  const fimDaAbertura = useCallback(() => {
    setAbrindo(false)
    preCarregarTelas()
  }, [])
  return (
    <SessaoContexto.Provider value={sessao}>
      <VigiaGlobal />
      <VigiaConversas />
      <AvisoVoz />

      <Emergencia />

      <div className="rotas-palco" aria-busy={abrindo ? 'true' : undefined}>
        <RotasAnimadas />
      </div>
      {abrindo && <Abertura pronto={pronto} onFim={fimDaAbertura} />}
    </SessaoContexto.Provider>
  )
}
function App() {
  return (
    <BrowserRouter>
      <Raiz />
    </BrowserRouter>
  )
}
export default App
const styles = {
  carregando: {
    height: '100%',
    maxWidth: 520,
    margin: '0 auto',
    padding: 'max(18px, env(safe-area-inset-top)) 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    animation: 'aFade 0.3s ease 0.25s both',
  },
  esqTitulo: {
    width: '58%',
    height: 40,
    borderRadius: 15,
    marginTop: 56,
    marginBottom: 6,
  },
  esqCard: {
    width: '100%',
    borderRadius: 30,
  },
  falha: {
    height: '100%',
    maxWidth: 520,
    margin: '0 auto',
    padding: '24px 24px max(24px, env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    textAlign: 'center',
  },
  falhaIcone: {
    width: 76,
    height: 76,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  falhaTitulo: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.05,
  },
  falhaTexto: {
    fontSize: 18,
    lineHeight: 1.45,
    color: 'var(--text-2)',
    maxWidth: 360,
  },
  falhaBotao: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    padding: '0 28px',
    marginTop: 10,
    borderRadius: 'var(--r-btn)',
    background: '#000',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
  },
  falhaLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    padding: '0 18px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text)',
  },
}
