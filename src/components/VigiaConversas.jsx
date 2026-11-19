import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, MapPin, MessageCircle, Phone, X } from 'lucide-react'
import Camada from './Camada'
import Avatar from './Avatar'
import useStorage from '../hooks/useStorage'
import { piscarTela } from '../hooks/useAcessibilidade'
import { calcularModoSimples } from '../hooks/useModoSimples'
import { temNecessidade, avisosVisuaisAtivos, leituraVozAtiva } from '../lib/perfil'
import { ler, salvar } from '../lib/storage'
import { falar } from '../lib/voz'
import { notificar } from '../lib/notificacoes'
import { somMensagem, sirene } from '../lib/audio'
import { linkLigar } from '../lib/emergencia'
import {
  modoRede,
  ouvirContatos,
  ouvirAmizades,
  ouvirConversas,
  conversaAberta,
  contatosCache,
  nomeExibicao,
  resumoMensagem,
  minhaConta,
} from '../lib/rede'
const SOS_RECENTE = 30 * 60000
function seloDoApp(n) {
  try {
    if (n > 0) navigator.setAppBadge?.(n)?.catch?.(() => {})
    else navigator.clearAppBadge?.()?.catch?.(() => {})
  } catch {
    void 0
  }
  try {
    window.kleoNativo?.selo?.(n)
  } catch {
    void 0
  }
}
export default function VigiaConversas() {
  const navigate = useNavigate()
  const [modo] = useStorage('kleo_rede_modo', null)
  const [conta] = useStorage('kleo_rede_conta', null)
  const [toast, setToast] = useState(null)
  const [sos, setSos] = useState(null)
  const toastTimer = useRef(null)
  const avisarRef = useRef(null)
  const avisarAmizadeRef = useRef(null)
  const ativo = modoRede() !== 'nenhum'
  useEffect(() => {
    if (!ativo || conta?.uid) return
    minhaConta().catch(() => {})
  }, [ativo, modo, conta?.uid])
  useEffect(() => {
    if (!ativo || !conta?.uid) return
    const eu = conta.uid
    const pararContatos = ouvirContatos(
      lista => salvar('kleo_rede_contatos', lista),
      () => {},
    )
    let primeiraAmizade = true
    const pararAmizades = ouvirAmizades(
      lista => {
        salvar('kleo_rede_amizades', lista)
        const vistas = {
          ...(ler('kleo_rede_amizades_vistas', {}) || {}),
        }
        const novidades = []
        for (const a of lista) {
          const antes = vistas[a.uid]
          if (antes !== a.estado && !primeiraAmizade) {
            if (a.estado === 'recebido') novidades.push(a)
            if (a.estado === 'amigos' && antes === 'enviado') novidades.push(a)
          }
          if (primeiraAmizade && !antes && a.estado === 'recebido' && Date.now() - (a.em || 0) < 864e5)
            novidades.push(a)
          vistas[a.uid] = a.estado
        }
        salvar('kleo_rede_amizades_vistas', vistas)
        primeiraAmizade = false
        novidades.forEach(a => avisarAmizadeRef.current?.(a))
      },
      () => {},
    )
    let primeira = true
    const pararConversas = ouvirConversas(
      lista => {
        const visiveis = lista
          .filter(c => c.ultima)
          .sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0))
        salvar('kleo_rede_conversas', visiveis)
        const total = visiveis.reduce(
          (s, c) => s + (c.ultima.de !== eu && c.outro !== eu ? c.naoLidas : 0),
          0,
        )
        salvar('kleo_rede_naolidas', total)
        seloDoApp(total)
        const avisados = {
          ...(ler('kleo_rede_avisados', {}) || {}),
        }
        const novas = []
        for (const c of visiveis) {
          const u = c.ultima
          const visto = avisados[c.id] || 0
          if (u.de === eu || c.outro === eu || u.em <= visto) {
            avisados[c.id] = Math.max(visto, u.em || 0)
            continue
          }
          avisados[c.id] = u.em
          if (primeira && !(u.tipo === 'sos' && c.naoLidas > 0 && Date.now() - u.em < SOS_RECENTE)) continue
          novas.push(c)
        }
        salvar('kleo_rede_avisados', avisados)
        primeira = false
        novas.forEach(c => avisarRef.current?.(c))
      },
      () => {},
    )
    return () => {
      pararContatos()
      pararAmizades()
      pararConversas()
    }
  }, [ativo, modo, conta?.uid])
  function avisarAmizade(a) {
    const nome = a.nome || (a.usuario ? `@${a.usuario}` : 'Alguém')
    const novo = a.estado === 'recebido'
    const texto = novo ? 'quer conversar com você. Toque para aceitar.' : 'aceitou seu pedido de amizade.'
    const url = novo ? '/pessoas' : `/pessoas/${a.uid}`
    notificar(novo ? 'Pedido de amizade · Kleo Pessoas' : 'Pedido aceito · Kleo Pessoas', {
      corpo: `${nome} ${texto}`,
      tag: `amizade-${a.uid}`,
      url,
    }).catch(() => {})
    if (document.visibilityState !== 'visible') return
    setToast({
      uid: a.uid,
      nome,
      foto: a.foto || null,
      texto,
      quantas: 0,
      id: `amizade-${a.uid}-${a.estado}`,
      url,
      origem: novo ? 'Pedido de amizade' : 'Pessoas',
    })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 7000)
    navigator.vibrate?.([60, 40, 60])
    const profile = ler('kleo_profile', {}) || {}
    if (avisosVisuaisAtivos(profile)) piscarTela()
    if (temNecessidade(profile, 'auditiva')) return
    somMensagem()
    if (leituraVozAtiva(profile) || calcularModoSimples(ler('kleo_modo_simples', null), profile))
      setTimeout(() => falar(`${nome} ${texto}`, { forcar: true }).catch(() => {}), 600)
  }
  function avisar(c) {
    const contato = contatosCache().find(x => x.uid === c.outro)
    const nome = contato ? nomeExibicao(contato) : c.perfil?.nome || 'Alguém'
    const foto = contato?.foto || c.perfil?.foto || null
    const u = c.ultima
    const profile = ler('kleo_profile', {}) || {}
    const surdo = temNecessidade(profile, 'auditiva')
    const simples = calcularModoSimples(ler('kleo_modo_simples', null), profile)
    if (u.tipo === 'sos') {
      setSos({
        uid: c.outro,
        nome,
        foto,
        texto: u.texto,
        em: u.em,
        minutos: Math.max(0, Math.round((Date.now() - u.em) / 60000)),
      })
      notificar(`${nome} pediu ajuda`, {
        corpo: 'Toque para ver onde está.',
        tag: `sos-${c.id}`,
        url: `/pessoas/${c.outro}`,
        urgente: true,
      }).catch(() => {})
      return
    }
    if (conversaAberta() === c.outro && document.visibilityState === 'visible') return
    const texto = resumoMensagem(u)
    const quantas = Math.max(1, Number(c.naoLidas) || 1)
    const contagem = quantas > 1 ? `${quantas} mensagens novas` : ''
    notificar(`${nome} · Kleo Pessoas`, {
      corpo: contagem ? `${contagem} · ${texto}` : texto,
      tag: `msg-${c.id}`,
      url: `/pessoas/${c.outro}`,
    }).catch(() => {})
    if (document.visibilityState !== 'visible') return
    setToast({
      uid: c.outro,
      nome,
      foto,
      texto,
      quantas,
      id: u.em,
    })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 6000)
    navigator.vibrate?.([60, 40, 60])
    if (avisosVisuaisAtivos(profile)) piscarTela()
    if (surdo) return
    somMensagem()
    if (leituraVozAtiva(profile) || simples) {
      const fala =
        u.tipo === 'audio'
          ? `${nome} mandou um áudio.`
          : u.tipo === 'imagem'
            ? `${nome} mandou uma foto.`
            : u.tipo === 'local'
              ? `${nome} mandou a localização.`
              : `Mensagem de ${nome}: ${String(u.texto || '').slice(0, 160)}`
      setTimeout(
        () =>
          falar(fala, {
            forcar: true,
          }).catch(() => {}),
        600,
      )
    }
  }
  useEffect(() => {
    avisarRef.current = avisar
    avisarAmizadeRef.current = avisarAmizade
  })
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  return (
    <>
      {toast && (
        <Camada>
          <div style={styles.toastFaixa}>
            <div key={toast.id} role="status" aria-live="polite" className="anim-pop" style={styles.toast}>
              <button
                type="button"
                className="tap"
                style={styles.toastCorpo}
                onClick={() => {
                  setToast(null)
                  navigate(toast.url || `/pessoas/${toast.uid}`)
                }}
              >
                <Avatar nome={toast.nome} foto={toast.foto} chave={toast.uid} tamanho={46} />
                <span style={styles.toastTextos}>
                  <span style={styles.toastOrigem}>
                    <MessageCircle size={13} aria-hidden="true" /> {toast.origem || 'Pessoas'}
                    {toast.quantas > 1 && ` · ${toast.quantas} mensagens novas`}
                  </span>
                  <strong style={styles.toastNome}>{toast.nome}</strong>
                  <span style={styles.toastTexto}>{toast.texto}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setToast(null)}
                style={styles.toastFechar}
                aria-label="Fechar aviso"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </Camada>
      )}
      {sos && <AlertaSOS dados={sos} onFechar={() => setSos(null)} />}
    </>
  )
}
function AlertaSOS({ dados, onFechar }) {
  const navigate = useNavigate()
  const surdo = temNecessidade(ler('kleo_profile', {}), 'auditiva')
  const som = useRef(null)
  useEffect(() => {
    navigator.vibrate?.([500, 200, 500, 200, 500])
    if (surdo) {
      piscarTela()
      const t = setInterval(piscarTela, 1500)
      return () => clearInterval(t)
    }
    som.current = sirene()
    falar(`Atenção: ${dados.nome} pediu ajuda.`, {
      forcar: true,
    }).catch(() => {})
    return () => som.current?.parar()
  }, [dados, surdo])
  const sair = destino => {
    som.current?.parar()
    som.current = null
    onFechar()
    if (destino) navigate(destino)
  }
  const minutos = dados.minutos || 0
  return (
    <Camada>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`${dados.nome} pediu ajuda`}
        className="anim-fade"
        style={styles.sosFundo}
      >
        <div className="anim-pop" style={styles.sosCaixa}>
          <span className="pulse-ring" style={styles.sosIcone}>
            <Siren size={40} color="#fff" aria-hidden="true" />
          </span>
          <Avatar nome={dados.nome} foto={dados.foto} chave={dados.uid} tamanho={84} anel />
          <h1 style={styles.sosTitulo}>{dados.nome} pediu ajuda</h1>
          <p style={styles.sosTexto}>{dados.texto || 'Pedido de emergência pela Kleo.'}</p>
          <p style={styles.sosQuando}>{minutos < 1 ? 'Agora mesmo' : `Há ${minutos} min`}</p>
          <div style={styles.sosAcoes}>
            <button
              type="button"
              className="tap"
              style={styles.sosPrincipal}
              onClick={() => sair(`/pessoas/${dados.uid}`)}
            >
              <MapPin size={22} aria-hidden="true" /> Ver onde está e responder
            </button>
            <a
              href={linkLigar('192')}
              className="tap"
              style={styles.sosLigar}
              onClick={() => som.current?.parar()}
            >
              <Phone size={20} aria-hidden="true" /> Ligar para o SAMU (192)
            </a>
            <button type="button" className="tap" style={styles.sosSecundario} onClick={() => sair(null)}>
              <MessageCircle size={20} aria-hidden="true" /> Já vi, fechar alarme
            </button>
          </div>
        </div>
      </div>
    </Camada>
  )
}
const VERMELHO = '#d92d34'
const styles = {
  toastOrigem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  toastFaixa: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 960,
    display: 'flex',
    justifyContent: 'center',
    padding: 'max(10px, env(safe-area-inset-top)) 12px 0',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: 8,
    boxShadow: 'var(--sombra), 0 12px 36px rgba(120, 100, 200, 0.22)',
  },
  toastCorpo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'transparent',
    textAlign: 'left',
    padding: 4,
  },
  toastTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  toastNome: {
    fontSize: 16,
    fontWeight: 800,
    color: 'var(--text)',
  },
  toastTexto: {
    fontSize: 15,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  toastFechar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sosFundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 9650,
    background: '#fff0ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom))',
    overflowY: 'auto',
  },
  sosCaixa: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    color: '#000',
  },
  sosIcone: {
    width: 84,
    height: 84,
    borderRadius: '50%',
    background: VERMELHO,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sosTitulo: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    marginTop: 4,
  },
  sosTexto: {
    fontSize: 18,
    lineHeight: 1.4,
  },
  sosQuando: {
    fontSize: 15,
    color: 'var(--text-2)',
    fontWeight: 600,
  },
  sosAcoes: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 10,
  },
  sosPrincipal: {
    minHeight: 62,
    borderRadius: 'var(--r-btn)',
    background: VERMELHO,
    color: '#fff',
    fontSize: 18,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sosLigar: {
    minHeight: 56,
    borderRadius: 'var(--r-btn)',
    background: '#000',
    color: '#fff',
    fontSize: 17,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  sosSecundario: {
    minHeight: 54,
    borderRadius: 'var(--r-btn)',
    background: '#fff',
    color: '#000',
    fontSize: 17,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    border: '2px solid #000',
  },
}
