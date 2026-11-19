import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Siren,
  Phone,
  MessageSquareText,
  MessageCircle,
  X,
  Check,
  LoaderCircle,
  MapPin,
  Volume2,
  VolumeX,
  ShieldCheck,
  UserPlus,
  Ambulance,
  Flame,
  Shield,
  WifiOff,
} from 'lucide-react'
import Camada from './Camada'
import Avatar from './Avatar'
import useModoSimples from '../hooks/useModoSimples'
import { piscarTela } from '../hooks/useAcessibilidade'
import { ler } from '../lib/storage'
import { falar, pararFala } from '../lib/voz'
import { sirene } from '../lib/audio'
import { obterPosicao } from '../lib/lugares'
import { notificar } from '../lib/notificacoes'
import { temNecessidade } from '../lib/perfil'
import {
  lerContatosEmergencia,
  NUMEROS_EMERGENCIA,
  linkLigar,
  linkSMS,
  linkWhatsApp,
  textoSOS,
  formatarTelefone,
  linkLocalizacao,
  linkSMSTodos,
  sosAutomatico,
  permissoesSOS,
  enviarSmsAutomatico,
  ligarAutomatico,
} from '../lib/emergencia'
import { modoRede, contaCache, enviar } from '../lib/rede'
const ICONES_NUMERO = {
  192: Ambulance,
  193: Flame,
  190: Shield,
}
const CONTAGEM = 5
export default function Emergencia() {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [estado, setEstado] = useState(null)
  const [n, setN] = useState(CONTAGEM)
  const [local, setLocal] = useState(null)
  const [avisos, setAvisos] = useState({})
  const [tocando, setTocando] = useState(false)
  const [auto, setAuto] = useState({})
  const sireneRef = useRef(null)
  const ativoRef = useRef(false)
  const estadoRef = useRef(null)
  const idsSos = useRef({})
  const posRef = useRef(null)
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const contatos = lerContatosEmergencia()
  const profile = ler('kleo_profile', {}) || {}
  const nome = String(profile.name || '').trim()
  const surdo = temNecessidade(profile, 'auditiva')
  useEffect(() => {
    estadoRef.current = estado
  })
  useEffect(() => {
    const saiu = e => {
      const uid = idsSos.current[e.detail?.id]
      if (uid)
        setAvisos(a =>
          a[uid] === 'fila'
            ? {
                ...a,
                [uid]: 'ok',
              }
            : a,
        )
    }
    window.addEventListener('kleo-rede-enviada', saiu)
    return () => window.removeEventListener('kleo-rede-enviada', saiu)
  }, [])
  useEffect(() => {
    const abrir = e => {
      if (ativoRef.current) return
      ativoRef.current = true
      pararFala()
      setEstado({
        fase: 'contagem',
        motivo: e.detail?.motivo || '',
      })
      setN(CONTAGEM)
      setLocal(null)
      posRef.current = obterPosicao().catch(() => null)
      setAvisos({})
      setAuto({})
      navigator.vibrate?.([200, 100, 200])
      if (surdo) piscarTela()
      else
        falar('Vou avisar seus contatos de emergência. Se estiver tudo bem, toque em cancelar.', {
          forcar: true,
        }).catch(() => {})
    }
    window.addEventListener('kleo-emergencia', abrir)
    return () => window.removeEventListener('kleo-emergencia', abrir)
  }, [surdo])
  const ativar = useCallback(async () => {
    setEstado(s =>
      s
        ? {
            ...s,
            fase: 'ativa',
          }
        : s,
    )
    navigator.vibrate?.([400, 150, 400])
    if (surdo) piscarTela()
    else
      falar(
        'Estou avisando seus contatos agora. Se puder, fique onde está. Você também pode ligar para o SAMU no botão vermelho.',
        {
          forcar: true,
        },
      ).catch(() => {})
    const pos = await (posRef.current || obterPosicao().catch(() => null))
    setLocal(pos || false)
    const conta = contaCache()
    const doApp = lerContatosEmergencia().filter(c => c.uid)
    if (conta && modoRede() !== 'nenhum' && doApp.length) {
      const texto = estadoRef.current?.motivo ? `Motivo: ${estadoRef.current.motivo}` : 'Preciso de ajuda.'
      for (const c of doApp) {
        setAvisos(a => ({
          ...a,
          [c.uid]: 'enviando',
        }))
        enviar(c.uid, {
          tipo: 'sos',
          texto,
          lat: pos?.lat ?? null,
          lng: pos?.lng ?? null,
        })
          .then(r => {
            idsSos.current[r.id] = c.uid
            return r.confirmado
          })
          .then(ok =>
            setAvisos(a => ({
              ...a,
              [c.uid]: ok === false ? 'fila' : 'ok',
            })),
          )
          .catch(() =>
            setAvisos(a => ({
              ...a,
              [c.uid]: 'erro',
            })),
          )
      }
    }
    const comTelefone = lerContatosEmergencia().filter(c => c.telefone)
    if (sosAutomatico() && comTelefone.length) {
      const msg = textoSOS({
        nome,
        motivo: estadoRef.current?.motivo,
        lat: pos?.lat,
        lng: pos?.lng,
        fonte: pos?.fonte,
      })
      const perm = await permissoesSOS()
      if (perm.sms) {
        setAuto(a => ({
          ...a,
          sms: 'enviando',
        }))
        const r = await enviarSmsAutomatico(
          comTelefone.map(c => c.telefone),
          msg,
        )
        setAuto(a => ({
          ...a,
          sms: r.enviados?.length ? 'ok' : 'erro',
        }))
      }
      try {
        window.location.href = linkWhatsApp(comTelefone[0].telefone, msg)
      } catch {
        void 0
      }
      const lig = await ligarAutomatico(comTelefone[0].telefone)
      if (lig)
        setAuto(a => ({
          ...a,
          ligou: comTelefone[0].id,
        }))
    }
    notificar('Emergência acionada', {
      corpo: 'Seus contatos de emergência foram avisados.',
      tag: 'kleo-sos',
      url: '/pessoas',
    }).catch(() => {})
  }, [surdo, nome])
  useEffect(() => {
    if (estado?.fase !== 'contagem') return
    if (n <= 0) {
      const t = setTimeout(ativar, 0)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setN(x => x - 1), 1000)
    return () => clearTimeout(t)
  }, [estado?.fase, n, ativar])
  const alternarSirene = () => {
    if (sireneRef.current) {
      sireneRef.current.parar()
      sireneRef.current = null
      setTocando(false)
    } else {
      pararFala()
      sireneRef.current = sirene()
      setTocando(true)
    }
  }
  const fechar = (avisarQueEstaBem = false) => {
    sireneRef.current?.parar()
    sireneRef.current = null
    setTocando(false)
    if (avisarQueEstaBem) {
      Object.entries(avisos)
        .filter(([, s]) => s === 'ok' || s === 'fila')
        .forEach(([uid]) => {
          enviar(uid, {
            tipo: 'texto',
            texto: 'Estou bem agora. Obrigado por se preocupar.',
          }).catch(() => {})
        })
    }
    pararFala()
    ativoRef.current = false
    setEstado(null)
  }
  if (!estado) return null
  const textoMensagem = textoSOS({
    nome,
    motivo: estado.motivo,
    lat: local?.lat,
    lng: local?.lng,
    fonte: local?.fonte,
  })
  const abrirComLocal = async (e, montar, novaAba = false) => {
    if (local !== null) return
    e.preventDefault()
    const destino = novaAba ? window.open('', '_blank') : null
    setBuscandoLocal(true)
    const pos = await (posRef.current || obterPosicao().catch(() => null))
    setBuscandoLocal(false)
    setLocal(pos || false)
    const url = montar(
      textoSOS({
        nome,
        motivo: estado.motivo,
        lat: pos?.lat,
        lng: pos?.lng,
        fonte: pos?.fonte,
      }),
    )
    if (destino) destino.location.href = url
    else window.location.assign(url)
  }
  const situacoes = Object.values(avisos)
  const nativo = sosAutomatico()
  const telefones = contatos.filter(c => c.telefone)
  const linkTodos = linkSMSTodos(
    telefones.map(c => c.telefone),
    textoMensagem,
  )
  const ligado = contatos.find(c => c.id === auto.ligou)
  const proximos = telefones.filter(c => c.id !== auto.ligou)
  const ligarPara = (e, tel) => {
    if (!nativo) return
    e.preventDefault()
    ligarAutomatico(tel).then(r => {
      if (!r) window.location.href = linkLigar(tel)
    })
  }
  const tituloAtivo =
    auto.sms === 'ok' || situacoes.includes('ok')
      ? 'Pedido de ajuda enviado'
      : situacoes.includes('fila')
        ? 'Sem internet: pedido na fila'
        : situacoes.includes('enviando')
          ? 'Avisando seus contatos'
          : contatos.length
            ? 'Avise seus contatos'
            : 'Peça ajuda agora'
  return (
    <Camada>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Emergência"
        className="anim-fade"
        style={styles.fundo}
      >
        {estado.fase === 'contagem' ? (
          <div style={styles.centro}>
            <span style={styles.rotulo}>
              <Siren size={22} aria-hidden="true" /> Emergência
            </span>
            <div className="pulse-ring" style={styles.contador} aria-live="assertive">
              <span style={styles.numero}>{Math.max(0, n)}</span>
            </div>
            <h1
              style={{
                ...styles.titulo,
                fontSize: simples ? 30 : 27,
              }}
            >
              Vou avisar seus contatos de emergência
            </h1>
            {estado.motivo && <p style={styles.motivo}>"{estado.motivo}"</p>}
            <div style={styles.acoesColuna}>
              <button type="button" className="tap" style={styles.botaoVermelho} onClick={() => setN(0)}>
                <Siren size={24} aria-hidden="true" /> Avisar agora
              </button>
              <button
                type="button"
                className="tap"
                style={styles.botaoCancelar}
                onClick={() => fechar(false)}
              >
                <X size={24} aria-hidden="true" /> Cancelar, estou bem
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.painel}>
            <header style={styles.topo}>
              <span style={styles.topoIcone}>
                <Siren size={26} color="#fff" aria-hidden="true" />
              </span>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <h1
                  style={{
                    ...styles.tituloAtivo,
                    fontSize: simples ? 27 : 24,
                  }}
                >
                  {tituloAtivo}
                </h1>
                <p style={styles.sub}>
                  {local === null && (
                    <>
                      <LoaderCircle size={15} className="girar" aria-hidden="true" /> Pegando sua
                      localização...
                    </>
                  )}
                  {local && (
                    <>
                      <MapPin size={15} aria-hidden="true" /> Localização{' '}
                      {local.fonte === 'gps' ? 'do GPS' : 'aproximada'} incluída
                    </>
                  )}
                  {local === false && 'Sem localização (ligue o GPS se puder)'}
                </p>
              </div>
            </header>

            {ligado && (
              <div style={styles.aviso}>
                <Phone size={20} aria-hidden="true" />
                <span>
                  Liguei para <strong>{ligado.nome}</strong>. Se não atender, ligue para outra pessoa ou para
                  o 192.
                </span>
              </div>
            )}
            {auto.sms === 'ok' && (
              <div style={styles.aviso}>
                <Check size={20} aria-hidden="true" />
                <span>
                  SMS com sua localização enviado para{' '}
                  {telefones.length === 1 ? '1 contato' : `${telefones.length} contatos`}.
                </span>
              </div>
            )}
            {linkTodos && auto.sms !== 'ok' && auto.sms !== 'enviando' && (
              <a
                href={linkTodos}
                onClick={e =>
                  abrirComLocal(e, m =>
                    linkSMSTodos(
                      telefones.map(c => c.telefone),
                      m,
                    ),
                  )
                }
                className="tap"
                style={styles.botaoTodos}
              >
                <MessageSquareText size={26} aria-hidden="true" />
                {telefones.length > 1 ? 'Enviar SMS para todos' : `Enviar SMS para ${telefones[0].nome}`}
              </a>
            )}
            {nativo && ligado && proximos.length > 0 && (
              <div style={styles.proximos}>
                {proximos.map(c => (
                  <a
                    key={c.id}
                    href={linkLigar(c.telefone)}
                    onClick={e => ligarPara(e, c.telefone)}
                    className="tap"
                    style={styles.proximo}
                  >
                    <Phone size={18} aria-hidden="true" /> Ligar para {c.nome}
                  </a>
                ))}
              </div>
            )}

            <div style={styles.numeros}>
              {NUMEROS_EMERGENCIA.map((s, i) => {
                const Icone = ICONES_NUMERO[s.numero] || Phone
                return (
                  <a
                    key={s.numero}
                    href={linkLigar(s.numero)}
                    className="tap"
                    style={{
                      ...styles.numeroBotao,
                      ...(i === 0 ? styles.numeroPrincipal : null),
                    }}
                    aria-label={`Ligar ${s.numero}, ${s.nome}`}
                  >
                    <Icone size={i === 0 ? 28 : 22} aria-hidden="true" />
                    <span style={styles.numeroTexto}>
                      <strong
                        style={{
                          fontSize: i === 0 ? 24 : 20,
                        }}
                      >
                        {s.numero}
                      </strong>
                      <span
                        style={{
                          fontSize: 13,
                          opacity: 0.9,
                        }}
                      >
                        {s.nome}
                      </span>
                    </span>
                  </a>
                )
              })}
            </div>

            <h2 style={styles.secao}>Seus contatos de emergência</h2>
            {contatos.length === 0 ? (
              <div style={styles.semContatos}>
                <p>Você ainda não cadastrou contatos de emergência.</p>
                <button
                  type="button"
                  className="tap"
                  style={styles.linkBotao}
                  onClick={() => {
                    fechar(false)
                    navigate('/pessoas?secao=emergencia')
                  }}
                >
                  <UserPlus size={18} aria-hidden="true" /> Cadastrar agora
                </button>
              </div>
            ) : (
              contatos.map(c => {
                const st = c.uid ? avisos[c.uid] : null
                return (
                  <div key={c.id} style={styles.contato}>
                    <Avatar nome={c.nome} chave={c.uid || c.id} tamanho={46} />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong style={styles.contatoNome}>{c.nome}</strong>
                      <span style={styles.contatoStatus}>
                        {st === 'enviando' && (
                          <>
                            <LoaderCircle size={13} className="girar" aria-hidden="true" /> Avisando pelo
                            app...
                          </>
                        )}
                        {st === 'ok' && (
                          <>
                            <Check size={13} aria-hidden="true" /> Avisado pelo app
                          </>
                        )}
                        {st === 'fila' && (
                          <>
                            <WifiOff size={13} aria-hidden="true" /> Sem internet: vai assim que a conexão
                            voltar
                          </>
                        )}
                        {st === 'erro' && 'Não deu pelo app: ligue ou mande SMS'}
                        {!st && c.telefone && auto.sms === 'ok' && (
                          <>
                            <Check size={13} aria-hidden="true" /> SMS enviado
                          </>
                        )}
                        {!st && auto.sms !== 'ok' && (c.telefone ? formatarTelefone(c.telefone) : '')}
                      </span>
                    </div>
                    {c.telefone && (
                      <div style={styles.contatoAcoes}>
                        <a
                          href={linkLigar(c.telefone)}
                          onClick={e => ligarPara(e, c.telefone)}
                          className="tap"
                          style={{
                            ...styles.acao,
                            background: '#000',
                            color: '#fff',
                          }}
                          aria-label={`Ligar para ${c.nome}`}
                        >
                          <Phone size={20} aria-hidden="true" />
                        </a>
                        <a
                          href={linkSMS(c.telefone, textoMensagem)}
                          onClick={e => abrirComLocal(e, m => linkSMS(c.telefone, m))}
                          className="tap"
                          style={styles.acao}
                          aria-label={`Mandar SMS para ${c.nome}`}
                        >
                          <MessageSquareText size={20} aria-hidden="true" />
                        </a>
                        <a
                          href={linkWhatsApp(c.telefone, textoMensagem)}
                          onClick={e => abrirComLocal(e, m => linkWhatsApp(c.telefone, m), true)}
                          target="_blank"
                          rel="noreferrer"
                          className="tap"
                          style={{
                            ...styles.acao,
                            background: '#25d366',
                          }}
                          aria-label={`Mandar pelo WhatsApp para ${c.nome}`}
                        >
                          <MessageCircle size={20} aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {buscandoLocal && (
              <p style={styles.localLink} role="status">
                <MapPin size={16} aria-hidden="true" /> Buscando sua localização...
              </p>
            )}
            {local && (
              <a
                href={linkLocalizacao(local.lat, local.lng)}
                target="_blank"
                rel="noreferrer"
                style={styles.localLink}
              >
                <MapPin size={16} aria-hidden="true" /> Ver minha localização
              </a>
            )}

            <div style={styles.rodape}>
              <button
                type="button"
                className="tap"
                style={{
                  ...styles.botaoSirene,
                  background: tocando ? '#000' : '#fff',
                  color: tocando ? '#fff' : '#000',
                }}
                onClick={alternarSirene}
              >
                {tocando ? (
                  <VolumeX size={20} aria-hidden="true" />
                ) : (
                  <Volume2 size={20} aria-hidden="true" />
                )}
                {tocando ? 'Parar alarme' : 'Tocar alarme alto'}
              </button>
              <button type="button" className="tap" style={styles.botaoBem} onClick={() => fechar(true)}>
                <ShieldCheck size={22} aria-hidden="true" /> Estou bem, encerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </Camada>
  )
}
const VERMELHO = '#d92d34'
const styles = {
  aviso: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 18,
    background: '#fff',
    fontSize: 15,
    lineHeight: 1.35,
    marginBottom: 10,
  },
  botaoTodos: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 64,
    borderRadius: 22,
    background: '#000',
    color: '#fff',
    fontWeight: 800,
    fontSize: 19,
    textDecoration: 'none',
    marginBottom: 12,
    padding: '0 16px',
    textAlign: 'center',
  },
  proximos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  proximo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    borderRadius: 20,
    background: '#000',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
  },
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 9700,
    background: '#fff0ee',
    color: '#000',
    overflowY: 'auto',
    padding: 'max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom))',
    display: 'flex',
    justifyContent: 'center',
  },
  centro: {
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: '100%',
  },
  rotulo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: VERMELHO,
  },
  contador: {
    width: 150,
    height: 150,
    borderRadius: '50%',
    background: VERMELHO,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px 0',
  },
  numero: {
    fontSize: 76,
    fontWeight: 800,
    color: '#fff',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  titulo: {
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  motivo: {
    fontSize: 17,
    color: 'var(--text-2)',
    fontStyle: 'italic',
  },
  acoesColuna: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 10,
  },
  botaoVermelho: {
    minHeight: 64,
    borderRadius: 'var(--r-btn)',
    background: VERMELHO,
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 10px 30px rgba(217,45,52,0.35)',
  },
  botaoCancelar: {
    minHeight: 64,
    borderRadius: 'var(--r-btn)',
    background: '#fff',
    color: '#000',
    fontSize: 20,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    border: '2px solid #000',
  },
  painel: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  topo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '6px 0 4px',
  },
  topoIcone: {
    width: 54,
    height: 54,
    borderRadius: '30%',
    background: VERMELHO,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tituloAtivo: {
    fontWeight: 800,
    lineHeight: 1.15,
  },
  sub: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 4,
  },
  numeros: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  numeroBotao: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 22,
    background: '#fff',
    color: '#000',
    textDecoration: 'none',
    boxShadow: 'var(--sombra)',
  },
  numeroPrincipal: {
    gridColumn: '1 / -1',
    background: VERMELHO,
    color: '#fff',
    minHeight: 72,
    justifyContent: 'center',
  },
  numeroTexto: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  },
  secao: {
    fontSize: 18,
    fontWeight: 800,
    marginTop: 8,
  },
  semContatos: {
    background: '#fff',
    borderRadius: 22,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 15,
  },
  linkBotao: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    padding: '0 16px',
    borderRadius: 'var(--r-btn)',
    background: '#000',
    color: '#fff',
    fontWeight: 700,
  },
  contato: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 22,
    padding: '10px 10px 10px 12px',
    boxShadow: 'var(--sombra)',
  },
  contatoNome: {
    display: 'block',
    fontSize: 17,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contatoStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 13,
    color: 'var(--text-2)',
    marginTop: 2,
  },
  contatoAcoes: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  acao: {
    width: 46,
    height: 46,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  localLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: '#000',
    padding: 8,
  },
  rodape: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 6,
  },
  botaoSirene: {
    minHeight: 54,
    borderRadius: 'var(--r-btn)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 17,
    fontWeight: 800,
    border: '2px solid #000',
  },
  botaoBem: {
    minHeight: 60,
    borderRadius: 'var(--r-btn)',
    background: 'var(--lima)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 18,
    fontWeight: 800,
  },
}
