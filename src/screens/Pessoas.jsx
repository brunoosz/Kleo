import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  UserPlus,
  Search,
  Share2,
  Pencil,
  Mic,
  Siren,
  Image as IconeImagem,
  MapPin,
  Users,
  FlaskConical,
  MessageCircle,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react'
import Tela from '../components/Tela'
import Avatar from '../components/Avatar'
import BuscarPessoa from '../components/rede/BuscarPessoa'
import PerfilForm from '../components/rede/PerfilForm'
import FotoPerfil from '../components/rede/FotoPerfil'
import EmergenciaContatos from '../components/rede/EmergenciaContatos'
import AvisosPush from '../components/rede/AvisosPush'
import PedidosAmizade from '../components/rede/PedidosAmizade'
import { Card, Botao, BotaoIcone, TituloSecao, Sheet } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { acionarEmergencia } from '../lib/emergencia'
import { modoRede, minhaConta, usarDemonstracao, nomeExibicao, horaLista } from '../lib/rede'
export default function Pessoas() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const simples = useModoSimples()
  const [modoSalvo] = useStorage('kleo_rede_modo', null)
  const [conta] = useStorage('kleo_rede_conta', null)
  const [contatosSalvos] = useStorage('kleo_rede_contatos', [])
  const [conversasSalvas] = useStorage('kleo_rede_conversas', [])
  const [amizadesSalvas] = useStorage('kleo_rede_amizades', [])
  const [profile] = useStorage('kleo_profile', null)
  const modo = modoRede()
  const [verificado, setVerificado] = useState(false)
  const [buscar, setBuscar] = useState(false)
  const [editar, setEditar] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const contatos = useMemo(() => (Array.isArray(contatosSalvos) ? contatosSalvos : []), [contatosSalvos])
  const todasConversas = Array.isArray(conversasSalvas) ? conversasSalvas : []
  useEffect(() => {
    if (modo === 'nenhum') return
    let vivo = true
    minhaConta()
      .catch(() => null)
      .finally(() => {
        if (vivo) setVerificado(true)
      })
    return () => {
      vivo = false
    }
  }, [modo, modoSalvo])
  useEffect(() => {
    if (params.get('secao') !== 'emergencia') return
    const t = setTimeout(
      () =>
        document.getElementById('pessoas-emergencia')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      350,
    )
    return () => clearTimeout(t)
  }, [params])
  const abrirConversa = uid => {
    setBuscar(false)
    navigate(`/pessoas/${uid}`)
  }
  const compartilhar = async () => {
    const texto = `Me adicione na Kleo para conversarmos: @${conta.usuario}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Kleo',
          text: texto,
        })
        return
      }
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {}
  }
  const emergencia = (
    <section id="pessoas-emergencia" style={styles.secao}>
      <TituloSecao>Emergência</TituloSecao>
      <Card cor="branco" style={styles.sosCard}>
        <button
          type="button"
          className="tap"
          onClick={() => acionarEmergencia('', 'botao')}
          style={{
            ...styles.sosBotao,
            minHeight: simples ? 84 : 72,
          }}
          aria-label="Pedir socorro: avisa seus contatos de emergência"
        >
          <span style={styles.sosIcone}>
            <Siren size={simples ? 30 : 26} color="#fff" aria-hidden="true" />
          </span>
          <span style={styles.sosTextos}>
            <strong
              style={{
                fontSize: simples ? 24 : 21,
              }}
            >
              Pedir socorro
            </strong>
            <span style={styles.sosSub}>
              Avisa seus contatos com sua localização. Ou diga: "Kleo, socorro".
            </span>
          </span>
        </button>
        <EmergenciaContatos contatosKleo={conta ? contatos : []} />
      </Card>
    </section>
  )
  if (modo === 'nenhum') {
    return (
      <Tela titulo="Pessoas" subtitulo="Família e amigos">
        <div className="stagger" style={styles.coluna}>
          <Card cor="lavanda" tamanho="g" style={styles.intro}>
            <span style={styles.introIcone}>
              <Users size={30} color="#000" aria-hidden="true" />
            </span>
            <h2
              style={{
                ...styles.introTitulo,
                fontSize: simples ? 28 : 26,
              }}
            >
              Converse com quem você gosta
            </h2>
            <p style={styles.introTexto}>Mande mensagens e áudios para quem você gosta.</p>
            <Botao
              variante="primario"
              grande
              cheio
              icone={FlaskConical}
              onClick={() => usarDemonstracao(true)}
            >
              Experimentar agora
            </Botao>
            <p style={styles.introNota}>Contatos de exemplo para treinar.</p>
          </Card>
          {emergencia}
        </div>
      </Tela>
    )
  }
  if (!conta) {
    return (
      <Tela titulo="Pessoas" subtitulo="Crie seu perfil para começar">
        <div className="stagger" style={styles.coluna}>
          {modo === 'demo' && <FaixaDemo />}
          {!verificado ? (
            <Card cor="branco" style={styles.carregando} aria-busy="true">
              <span className="skeleton" style={styles.skAvatar} />
              <span className="skeleton" style={styles.skLinha} />
              <span
                className="skeleton"
                style={{
                  ...styles.skLinha,
                  width: '60%',
                }}
              />
            </Card>
          ) : (
            <Card cor="branco" tamanho="g">
              <PerfilForm nomeSugerido={profile?.name || ''} />
            </Card>
          )}
          {emergencia}
        </div>
      </Tela>
    )
  }
  const anotacoes = todasConversas.find(c => c.outro === conta.uid) || {
    id: `${conta.uid}_${conta.uid}`,
    outro: conta.uid,
    ultima: null,
    naoLidas: 0,
  }
  const conversas = [anotacoes, ...todasConversas.filter(c => c.outro !== conta.uid)]
  const outrasConversas = conversas.length - 1
  const uidsConversa = new Set(conversas.map(c => c.outro))
  const pendentes = new Set(
    (Array.isArray(amizadesSalvas) ? amizadesSalvas : []).filter(a => a.estado !== 'amigos').map(a => a.uid),
  )
  const semConversa = contatos.filter(c => !uidsConversa.has(c.uid) && !pendentes.has(c.uid))
  const naoLidasTotal = conversas.reduce((s, c) => s + (c.ultima?.de !== conta.uid ? c.naoLidas : 0), 0)
  return (
    <Tela
      titulo="Pessoas"
      subtitulo={
        naoLidasTotal
          ? `${naoLidasTotal} mensage${naoLidasTotal > 1 ? 'ns novas' : 'm nova'}`
          : 'Família e amigos'
      }
      acoes={
        !simples && (
          <BotaoIcone
            icone={UserPlus}
            variante="preto"
            label="Adicionar pessoa"
            onClick={() => setBuscar(true)}
          />
        )
      }
    >
      <div className="stagger" style={styles.coluna}>
        {modo === 'demo' && <FaixaDemo />}

        {modo === 'supabase' && <AvisosPush variante="card" />}

        <Card cor="lavanda" style={styles.perfil}>
          <button
            type="button"
            className="tap"
            onClick={() => setEditar(true)}
            style={styles.perfilBotao}
            aria-label="Editar meu perfil"
          >
            <Avatar
              nome={conta.nome}
              foto={conta.foto}
              chave={conta.uid}
              tamanho={simples ? 64 : 58}
              style={{
                boxShadow: '0 0 0 3px var(--surface)',
              }}
            />
          </button>
          <div style={styles.perfilTextos}>
            <strong
              style={{
                ...styles.perfilNome,
                fontSize: simples ? 21 : 19,
              }}
            >
              {conta.nome}
            </strong>
            <span style={styles.perfilUsuario}>@{conta.usuario}</span>
          </div>
          <BotaoIcone
            icone={copiado ? Check : navigator.share ? Share2 : Copy}
            label="Compartilhar meu @"
            onClick={compartilhar}
          />
          {!simples && <BotaoIcone icone={Pencil} label="Editar perfil" onClick={() => setEditar(true)} />}
          <div style={styles.perfilFoto}>
            <FotoPerfil conta={conta} />
          </div>
        </Card>

        <button
          type="button"
          className="tap"
          onClick={() => setBuscar(true)}
          style={{
            ...styles.busca,
            minHeight: simples ? 60 : 54,
          }}
        >
          <Search size={20} color="var(--text-3)" aria-hidden="true" />
          <span>Adicionar alguém pelo @</span>
          <UserPlus
            size={20}
            style={{
              marginLeft: 'auto',
            }}
            aria-hidden="true"
          />
        </button>

        <PedidosAmizade />

        {conversas.length > 0 && (
          <section style={styles.secao}>
            <TituloSecao>Conversas</TituloSecao>
            <Card cor="branco" style={styles.lista}>
              {conversas.map((c, i) => {
                const eu = c.outro === conta.uid
                const contato = eu ? null : contatos.find(x => x.uid === c.outro)
                const nome = eu
                  ? `@${conta.usuario} (Você)`
                  : contato
                    ? nomeExibicao(contato)
                    : c.perfil?.nome || 'Alguém'
                const foto = eu ? conta.foto : contato?.foto || c.perfil?.foto
                const minha = !eu && c.ultima?.de === conta.uid
                const novas = !eu && !minha ? c.naoLidas : 0
                const Icone =
                  c.ultima?.tipo === 'audio'
                    ? Mic
                    : c.ultima?.tipo === 'sos'
                      ? Siren
                      : c.ultima?.tipo === 'imagem'
                        ? IconeImagem
                        : c.ultima?.tipo === 'local'
                          ? MapPin
                          : null
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="tap"
                    onClick={() => abrirConversa(c.outro)}
                    style={{
                      ...styles.item,
                      minHeight: simples ? 84 : 74,
                      borderTop: i ? '1px solid var(--surface-2)' : 'none',
                    }}
                    aria-label={`Conversa com ${nome}${novas ? `, ${novas} nova${novas > 1 ? 's' : ''}` : ''}`}
                  >
                    <Avatar
                      nome={eu ? conta.nome : contato?.nome || c.perfil?.nome || nome}
                      foto={foto}
                      chave={c.outro}
                      tamanho={simples ? 58 : 52}
                    />
                    <span style={styles.itemTextos}>
                      <span style={styles.itemTopo}>
                        <strong
                          style={{
                            ...styles.itemNome,
                            fontSize: simples ? 19 : 17,
                          }}
                        >
                          {nome}
                        </strong>
                        <span
                          style={{
                            ...styles.itemHora,
                            color: novas ? '#000' : 'var(--text-3)',
                            fontWeight: novas ? 800 : 600,
                          }}
                        >
                          {horaLista(c.ultima?.em)}
                        </span>
                      </span>
                      <span style={styles.itemBaixo}>
                        <span
                          style={{
                            ...styles.itemUltima,
                            color:
                              c.ultima?.tipo === 'sos' ? '#b4232a' : novas ? 'var(--text)' : 'var(--text-2)',
                            fontWeight: novas ? 700 : 500,
                          }}
                        >
                          {minha && 'Você: '}
                          {Icone && (
                            <Icone
                              size={15}
                              style={{
                                verticalAlign: -2,
                                marginRight: 4,
                              }}
                              aria-hidden="true"
                            />
                          )}
                          {c.ultima ? c.ultima.texto : ''}
                        </span>
                        {novas > 0 && <span style={styles.badge}>{novas > 99 ? '99+' : novas}</span>}
                      </span>
                    </span>
                  </button>
                )
              })}
            </Card>
          </section>
        )}

        {semConversa.length > 0 && (
          <section style={styles.secao}>
            <TituloSecao>{outrasConversas ? 'Outros contatos' : 'Seus contatos'}</TituloSecao>
            <div style={styles.grade}>
              {semConversa.map(c => (
                <Card
                  key={c.uid}
                  cor="branco"
                  onClick={() => abrirConversa(c.uid)}
                  style={styles.contato}
                  aria-label={`Conversar com ${nomeExibicao(c)}`}
                >
                  <Avatar nome={c.nome} foto={c.foto} chave={c.uid} tamanho={56} />
                  <strong style={styles.contatoNome}>{nomeExibicao(c)}</strong>
                  <span style={styles.contatoUsuario}>@{c.usuario}</span>
                  <span style={styles.contatoAcao}>
                    <MessageCircle size={15} aria-hidden="true" /> Conversar
                  </span>
                </Card>
              ))}
            </div>
          </section>
        )}

        {!outrasConversas && !contatos.length && (
          <Card cor="ceu" tamanho="g" style={styles.vazio}>
            <span style={styles.vazioIcone}>
              <UserPlus size={28} color="#000" aria-hidden="true" />
            </span>
            <h2 style={styles.vazioTitulo}>Adicione sua primeira pessoa</h2>
            <p style={styles.vazioTexto}>
              Peça o @ da pessoa (ela vê na aba Pessoas) ou mande o seu: <strong>@{conta.usuario}</strong>
            </p>
            <Botao variante="primario" grande cheio icone={UserPlus} onClick={() => setBuscar(true)}>
              Adicionar pessoa
            </Botao>
          </Card>
        )}

        {emergencia}

        <p style={styles.privacidade}>
          <ShieldCheck size={15} aria-hidden="true" /> Só conversa com você quem teve o pedido de amizade
          aceito.
        </p>
      </div>

      <BuscarPessoa
        aberto={buscar}
        onFechar={() => setBuscar(false)}
        contatos={contatos}
        onConversar={abrirConversa}
      />

      <Sheet aberto={editar} onFechar={() => setEditar(false)} titulo="Meu perfil">
        {editar && <PerfilForm inicial={conta} onPronto={() => setEditar(false)} />}
      </Sheet>
    </Tela>
  )
}
function FaixaDemo() {
  const navigate = useNavigate()
  return (
    <div style={styles.demo} role="note">
      <FlaskConical
        size={18}
        aria-hidden="true"
        style={{
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <strong>Demonstração.</strong> Contatos fictícios que respondem sozinhos.
      </span>
      <button
        type="button"
        className="tap"
        style={styles.demoBotao}
        onClick={() => navigate('/configuracoes?secao=conversas')}
      >
        Usar de verdade
      </button>
    </div>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  secao: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 6,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  introIcone: {
    width: 56,
    height: 56,
    borderRadius: '30%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitulo: {
    fontWeight: 800,
    lineHeight: 1.12,
    letterSpacing: '-0.02em',
  },
  introTexto: {
    fontSize: 16,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  introNota: {
    fontSize: 13,
    textAlign: 'center',
    color: 'var(--text-2)',
  },
  carregando: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 28,
  },
  skAvatar: {
    width: 96,
    height: 96,
    borderRadius: '50%',
  },
  skLinha: {
    width: '80%',
    height: 18,
    borderRadius: 9,
  },
  perfil: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    padding: '14px 14px 14px 16px',
  },
  perfilFoto: {
    flexBasis: '100%',
  },
  perfilBotao: {
    background: 'transparent',
    padding: 0,
    borderRadius: '50%',
  },
  perfilTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  perfilNome: {
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  perfilUsuario: {
    fontSize: 15,
    color: 'var(--text-2)',
    fontWeight: 600,
  },
  busca: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '0 18px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    fontSize: 16,
    color: 'var(--text-2)',
    textAlign: 'left',
  },
  lista: {
    padding: '4px 0',
    overflow: 'hidden',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '10px 16px',
    background: 'transparent',
    textAlign: 'left',
    color: 'var(--text)',
  },
  itemTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  itemTopo: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  itemNome: {
    flex: 1,
    minWidth: 0,
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemHora: {
    fontSize: 13,
    flexShrink: 0,
  },
  itemBaixo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  itemUltima: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    minWidth: 24,
    height: 24,
    padding: '0 7px',
    borderRadius: 12,
    background: '#000',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10,
  },
  contato: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 4,
    padding: '16px 10px',
  },
  contatoNome: {
    fontSize: 16,
    fontWeight: 800,
    marginTop: 6,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contatoUsuario: {
    fontSize: 13,
    color: 'var(--text-2)',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contatoAcao: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    fontSize: 13,
    fontWeight: 800,
    background: 'var(--lavanda)',
    borderRadius: 20,
    padding: '5px 12px',
  },
  vazio: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  vazioIcone: {
    width: 52,
    height: 52,
    borderRadius: '30%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTitulo: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.15,
  },
  vazioTexto: {
    fontSize: 16,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  sosCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: 16,
  },
  sosBotao: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 24,
    background: '#ffe1de',
    color: '#000',
    textAlign: 'left',
    border: '2px solid #d92d34',
  },
  sosIcone: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: '#d92d34',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sosTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  sosSub: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  demo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 10px 10px 14px',
    background: 'var(--lima)',
    borderRadius: 20,
    fontSize: 14,
    color: '#000',
  },
  demoBotao: {
    padding: '8px 12px',
    borderRadius: 16,
    background: 'rgba(0,0,0,0.08)',
    fontSize: 13,
    fontWeight: 800,
    color: '#000',
    flexShrink: 0,
  },
  privacidade: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 13,
    color: 'var(--text-3)',
    textAlign: 'center',
    marginTop: 4,
  },
}
