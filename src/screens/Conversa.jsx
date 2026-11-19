import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ArrowUp,
  Mic,
  AudioLines,
  EllipsisVertical,
  UserPlus,
  Phone,
  Tag as IconeTag,
  ShieldPlus,
  UserMinus,
  Volume2,
  MessageCircle,
  LoaderCircle,
  Plus,
  Camera,
  Image as IconeImagem,
  MapPin,
  Send,
} from 'lucide-react'
import Tela from '../components/Tela'
import Avatar from '../components/Avatar'
import BolhaMensagem from '../components/rede/BolhaMensagem'
import CameraAoVivo from '../components/CameraAoVivo'
import { BarraGravacao } from '../components/rede/Gravador'
import { AvisoAmizade } from '../components/rede/PedidosAmizade'
import { Sheet, Botao, Campo, Modal, Toggle } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import useGravador from '../hooks/useGravador'
import { temNecessidade, leituraVozAtiva, transcricaoAutoAtiva } from '../lib/perfil'
import { ouvir, reconhecimentoDisponivel, falar } from '../lib/voz'
import { gravacaoDisponivel } from '../lib/audio'
import { enviarTexto, enviarAudio, enviarImagem, enviarLocal, mensagemErroEnvio } from '../lib/rede/envio'
import { reduzirImagem } from '../lib/imagem'
import { obterPosicao } from '../lib/lugares'
import { lerContatosEmergencia, salvarContatoEmergencia, linkLigar, MAX_EMERGENCIA } from '../lib/emergencia'
import {
  ouvirMensagens,
  marcarLida,
  apagarMensagem,
  adicionarContato,
  removerContato,
  renomearContato,
  perfilDe,
  pedirAmizade,
  responderAmizade,
  modoRede,
  definirConversaAberta,
  nomeExibicao,
  rotuloDia,
  mesmoDia,
} from '../lib/rede'
export default function Conversa() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [conta] = useStorage('kleo_rede_conta', null)
  const [contatosSalvos] = useStorage('kleo_rede_contatos', [])
  const [conversasSalvas] = useStorage('kleo_rede_conversas', [])
  const [amizadesSalvas] = useStorage('kleo_rede_amizades', null)
  const [profile] = useStorage('kleo_profile', null)
  const [autoSalvo, setAuto] = useStorage('kleo_rede_autoplay', null)
  useStorage('kleo_emergencia', [])
  const auditiva = temNecessidade(profile, 'auditiva')
  const visual = temNecessidade(profile, 'visual')
  const transcrever = transcricaoAutoAtiva(profile)
  const autoplay = !auditiva && (autoSalvo ?? (simples || leituraVozAtiva(profile)))
  const contatos = Array.isArray(contatosSalvos) ? contatosSalvos : []
  const eu = !!conta && conta.uid === uid
  const contato = eu ? null : contatos.find(c => c.uid === uid) || null
  const conversa = (Array.isArray(conversasSalvas) ? conversasSalvas : []).find(c => c.outro === uid) || null
  const [perfilBuscado, setPerfilBuscado] = useState(null)
  const perfil = eu ? conta : contato || conversa?.perfil || perfilBuscado
  const nome = eu ? `@${conta.usuario} (Você)` : contato ? nomeExibicao(contato) : perfil?.nome || 'Conversa'
  const outro = {
    uid,
    nome,
    nomeReal: perfil?.nome || nome,
    foto: perfil?.foto || null,
  }
  const emergencia = eu ? null : lerContatosEmergencia().find(c => c.uid === uid)
  const estadoAmizade = Array.isArray(amizadesSalvas)
    ? amizadesSalvas.find(a => a.uid === uid)?.estado || 'nenhum'
    : 'amigos'
  const bloqueada = !eu && modoRede() === 'supabase' && estadoAmizade !== 'amigos'
  const [pedindoAmizade, setPedindoAmizade] = useState(false)
  const agirAmizade = async aceitar => {
    setPedindoAmizade(true)
    try {
      if (estadoAmizade === 'recebido') await responderAmizade(uid, aceitar)
      else await pedirAmizade(uid)
      if (aceitar !== false && perfil)
        await adicionarContato({
          uid,
          ...perfil,
        }).catch(() => {})
    } catch {
      mostrarAviso('Não consegui agora. Confira a internet e tente de novo.')
    }
    setPedindoAmizade(false)
  }
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [texto, setTexto] = useState('')
  const [ditando, setDitando] = useState(false)
  const [apagar, setApagar] = useState(null)
  const [menu, setMenu] = useState(false)
  const [apelido, setApelido] = useState(null)
  const [remover, setRemover] = useState(false)
  const [aviso, setAviso] = useState('')
  const gravador = useGravador()
  const [enviandoAudio, setEnviandoAudio] = useState(false)
  const [anexo, setAnexo] = useState(null)
  const [foto, setFoto] = useState(null)
  const [posicao, setPosicao] = useState(null)
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const [enviandoAnexo, setEnviandoAnexo] = useState(false)
  const arquivoRef = useRef(null)
  const listaRef = useRef(null)
  const fimRef = useRef(null)
  const rec = useRef(null)
  const [iniciais, setIniciais] = useState(null)
  const faladas = useRef(new Set())
  const alvo = simples ? 56 : 48
  useEffect(() => {
    if (eu || contato || conversa?.perfil) return
    perfilDe(uid)
      .then(p => p && setPerfilBuscado(p))
      .catch(() => {})
  }, [uid, eu, contato, conversa?.perfil])
  useEffect(() => {
    definirConversaAberta(uid)
    const parar = ouvirMensagens(
      uid,
      lista => {
        setMensagens(lista)
        setCarregando(false)
        setErro('')
        setIniciais(atual => atual || new Set(lista.map(m => m.id)))
      },
      () => {
        setErro('Não consegui carregar a conversa. Confira a internet.')
        setCarregando(false)
      },
    )
    return () => {
      parar()
      definirConversaAberta(null)
      rec.current?.abort?.()
    }
  }, [uid])
  const ultimaDela = [...mensagens].reverse().find(m => m.de !== conta?.uid)
  useEffect(() => {
    if (!ultimaDela || document.visibilityState !== 'visible') return
    marcarLida(uid).catch(() => {})
  }, [ultimaDela?.id, uid]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ultimaDela || !iniciais || iniciais.has(ultimaDela.id) || faladas.current.has(ultimaDela.id)) return
    faladas.current.add(ultimaDela.id)
    if (!autoplay) return
    if (ultimaDela.tipo === 'texto')
      falar(`${nome} disse: ${ultimaDela.texto}`, {
        forcar: true,
      }).catch(() => {})
    else if (ultimaDela.tipo === 'imagem' && !visual)
      falar(`${nome} mandou uma foto.`, {
        forcar: true,
      }).catch(() => {})
    else if (ultimaDela.tipo === 'local')
      falar(`${nome} mandou a localização.`, {
        forcar: true,
      }).catch(() => {})
  }, [ultimaDela?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fimRef.current?.scrollIntoView({
      behavior: mensagens.length > 30 ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [mensagens.length])
  const lidoAteOutro = eu ? 0 : conversa?.lidoAteOutro || 0
  const mostrarAviso = t => {
    setAviso(t)
    setTimeout(() => setAviso(''), 3500)
  }
  const enviar = async () => {
    const t = texto.trim()
    if (!t) return
    setTexto('')
    try {
      const r = await enviarTexto(uid, t)
      r?.confirmado
        ?.then(ok => {
          if (ok === false)
            mostrarAviso('Sem internet agora. A mensagem vai sozinha quando a conexão voltar.')
        })
        .catch(e => {
          setTexto(atual => atual || t)
          mostrarAviso(mensagemErroEnvio(e))
        })
    } catch (e) {
      setTexto(t)
      mostrarAviso(mensagemErroEnvio(e))
    }
  }
  const gravar = async () => {
    try {
      await gravador.iniciar()
    } catch (e) {
      mostrarAviso(mensagemErroEnvio(e))
    }
  }
  const enviarGravacao = async () => {
    const r = await gravador.parar()
    if (!r?.blob?.size || r.duracao < 0.8) {
      mostrarAviso('Áudio muito curto. Toque no microfone e fale.')
      return
    }
    setEnviandoAudio(true)
    try {
      await enviarAudio(uid, r)
    } catch (e) {
      mostrarAviso(mensagemErroEnvio(e))
    }
    setEnviandoAudio(false)
  }
  const escolherArquivo = async e => {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    try {
      setFoto(await reduzirImagem(arq))
      setAnexo('foto')
    } catch (err) {
      setAnexo(null)
      mostrarAviso(mensagemErroEnvio(err))
    }
  }
  const enviarFoto = async () => {
    if (!foto || enviandoAnexo) return
    setEnviandoAnexo(true)
    try {
      await enviarImagem(uid, foto)
      setFoto(null)
      setAnexo(null)
    } catch (e) {
      mostrarAviso(mensagemErroEnvio(e))
    }
    setEnviandoAnexo(false)
  }
  const pedirLocal = async () => {
    setAnexo('local')
    setPosicao(null)
    setBuscandoLocal(true)
    try {
      const p = await obterPosicao()
      if (!p) throw new Error('SEM_LOCAL')
      setPosicao(p)
    } catch (e) {
      setAnexo(null)
      mostrarAviso(
        e?.code === 1 || e?.name === 'NotAllowedError'
          ? 'O GPS está bloqueado. Libere a localização no cadeado ao lado do endereço.'
          : mensagemErroEnvio(e?.message ? e : new Error('SEM_LOCAL')),
      )
    }
    setBuscandoLocal(false)
  }
  const enviarPosicao = async () => {
    if (!posicao || enviandoAnexo) return
    setEnviandoAnexo(true)
    try {
      const r = await enviarLocal(uid, posicao)
      r?.confirmado
        ?.then(ok => {
          if (ok === false)
            mostrarAviso('Sem internet agora. A localização vai sozinha quando a conexão voltar.')
        })
        .catch(e => mostrarAviso(mensagemErroEnvio(e)))
      setPosicao(null)
      setAnexo(null)
    } catch (e) {
      mostrarAviso(mensagemErroEnvio(e))
    }
    setEnviandoAnexo(false)
  }
  const fecharAnexo = () => {
    if (!enviandoAnexo) {
      setAnexo(null)
      setFoto(null)
      setPosicao(null)
    }
  }
  const fonteLocal =
    posicao?.fonte === 'gps'
      ? 'Posição do GPS agora'
      : posicao?.fonte === 'recente'
        ? 'Última posição conhecida (GPS indisponível)'
        : posicao
          ? 'Posição aproximada pela sua cidade (GPS indisponível)'
          : ''
  const ditar = () => {
    if (rec.current) {
      rec.current.stop()
      return
    }
    setDitando(true)
    rec.current = ouvir({
      onParcial: t => setTexto(t),
      onFinal: t => {
        setTexto(t)
        rec.current = null
        setDitando(false)
      },
      onFim: () => {
        rec.current = null
        setDitando(false)
      },
      onErro: m => mostrarAviso(m),
    })
    if (!rec.current) setDitando(false)
  }
  const confirmarApagar = async () => {
    const m = apagar
    setApagar(null)
    const ultima = mensagens[mensagens.length - 1]?.id === m.id
    try {
      await apagarMensagem(uid, m.id, ultima)
    } catch {
      mostrarAviso('Não consegui apagar agora.')
    }
  }
  const virarEmergencia = () => {
    salvarContatoEmergencia({
      nome: contato ? nomeExibicao(contato) : nome,
      telefone: '',
      uid,
      usuario: perfil?.usuario || '',
    })
    setMenu(false)
    mostrarAviso(`${nome} agora é contato de emergência.`)
  }
  const itens = useMemo(
    () =>
      mensagens.map((m, i) => ({
        m,
        dia: i === 0 || !mesmoDia(mensagens[i - 1].em, m.em),
      })),
    [mensagens],
  )
  const temTexto = !!texto.trim()
  const gravando = gravador.estado === 'gravando'
  return (
    <Tela semPadding semNav rolavel={false}>
      <div style={styles.root}>
        <header style={styles.header}>
          <button
            type="button"
            className="tap"
            onClick={() => navigate(-1)}
            style={styles.voltar}
            aria-label="Voltar"
          >
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
          <Avatar nome={perfil?.nome || nome} foto={perfil?.foto} chave={uid} tamanho={simples ? 50 : 44} />
          <div style={styles.titulo}>
            <strong
              style={{
                ...styles.nome,
                fontSize: simples ? 21 : 18,
              }}
            >
              {nome}
            </strong>
            {perfil?.usuario && (
              <span style={styles.usuario}>
                @{perfil.usuario}
                {contato?.apelido && perfil?.nome ? ` · ${perfil.nome}` : ''}
              </span>
            )}
          </div>
          {emergencia?.telefone && (
            <a
              href={linkLigar(emergencia.telefone)}
              className="tap"
              style={styles.iconeTopo}
              aria-label={`Ligar para ${nome}`}
            >
              <Phone size={21} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            className="tap"
            style={styles.iconeTopo}
            onClick={() => setMenu(true)}
            aria-label="Mais opções da conversa"
          >
            <EllipsisVertical size={21} aria-hidden="true" />
          </button>
        </header>

        {!eu && !contato && !bloqueada && conta && perfil && (
          <div className="anim-up" style={styles.faixa}>
            <span
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              {nome} não está nos seus contatos.
            </span>
            <Botao
              variante="lima"
              icone={UserPlus}
              onClick={() =>
                adicionarContato({
                  uid,
                  ...perfil,
                })
              }
              style={{
                padding: '6px 14px',
                minHeight: 40,
              }}
            >
              Adicionar
            </Botao>
          </div>
        )}

        <div
          ref={listaRef}
          style={styles.mensagens}
          role="log"
          aria-live="polite"
          aria-label={`Mensagens com ${nome}`}
        >
          {carregando ? (
            <div style={styles.centro}>
              <LoaderCircle size={28} className="girar" aria-hidden="true" />
            </div>
          ) : erro ? (
            <div style={styles.centro}>
              <p style={styles.erro}>{erro}</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div style={styles.vazio} className="anim-up">
              <Avatar nome={perfil?.nome || nome} foto={perfil?.foto} chave={uid} tamanho={96} />
              <h2 style={styles.vazioTitulo}>
                {eu ? 'Suas anotações' : `Diga oi para ${nome.split(' ')[0]}`}
              </h2>
              <p style={styles.vazioTexto}>
                {eu
                  ? 'Guarde textos, áudios, fotos e lugares só para você.'
                  : simples
                    ? 'Toque no microfone e fale. Eu envio sua voz.'
                    : 'Escreva, dite ou grave um áudio. Você também pode pedir: "Kleo, manda um áudio pra ' +
                      nome.split(' ')[0] +
                      '".'}
              </p>
            </div>
          ) : (
            <div style={styles.lista}>
              {itens.map(({ m, dia }) => (
                <Fragment key={m.id}>
                  {dia && (
                    <div style={styles.dia}>
                      <span style={styles.diaRotulo}>{rotuloDia(m.em)}</span>
                    </div>
                  )}
                  <BolhaMensagem
                    msg={m}
                    minha={m.de === conta?.uid}
                    lida={m.de === conta?.uid && lidoAteOutro >= m.em}
                    outro={outro}
                    simples={simples}
                    auditiva={transcrever}
                    autoplay={
                      autoplay &&
                      m.tipo === 'audio' &&
                      m.de !== conta?.uid &&
                      !!iniciais &&
                      !iniciais.has(m.id)
                    }
                    visual={visual}
                    animar={!!iniciais && !iniciais.has(m.id)}
                    onApagar={setApagar}
                  />
                </Fragment>
              ))}
            </div>
          )}
          <div
            ref={fimRef}
            style={{
              height: 1,
            }}
          />
        </div>

        {aviso && (
          <div key={aviso} role="alert" className="anim-up" style={styles.aviso}>
            {aviso}
          </div>
        )}

        {bloqueada ? (
          <div style={styles.entrada}>
            <AvisoAmizade
              estado={estadoAmizade}
              nome={(perfil?.nome || nome).split(' ')[0]}
              ocupado={pedindoAmizade}
              onPedir={() => agirAmizade()}
              onAceitar={() => agirAmizade(true)}
              onRecusar={() => agirAmizade(false)}
            />
          </div>
        ) : (
          <div style={styles.entrada}>
            {gravando ? (
              <BarraGravacao
                gravador={gravador}
                simples={simples}
                onCancelar={() => gravador.cancelar()}
                onEnviar={enviarGravacao}
              />
            ) : (
              <form
                style={styles.linha}
                onSubmit={e => {
                  e.preventDefault()
                  enviar()
                }}
              >
                <button
                  type="button"
                  className="tap"
                  onClick={() => setAnexo('menu')}
                  style={{
                    ...styles.redondo,
                    width: alvo + 4,
                    height: alvo + 4,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  aria-label="Enviar foto ou localização"
                >
                  <Plus size={24} aria-hidden="true" />
                </button>
                <div
                  style={{
                    ...styles.campo,
                    minHeight: alvo + 8,
                    boxShadow: ditando ? 'var(--sombra), inset 0 0 0 2px var(--erro)' : 'var(--sombra)',
                  }}
                >
                  {reconhecimentoDisponivel() && (
                    <button
                      type="button"
                      className="tap"
                      onClick={ditar}
                      style={{
                        ...styles.botaoCampo,
                        width: alvo - 6,
                        height: alvo - 6,
                        background: ditando ? 'var(--erro)' : 'var(--surface-2)',
                        color: ditando ? '#fff' : '#000',
                      }}
                      aria-label={ditando ? 'Parar de ditar' : 'Ditar mensagem (sua fala vira texto)'}
                    >
                      <AudioLines size={20} aria-hidden="true" />
                    </button>
                  )}
                  <textarea
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && !simples) {
                        e.preventDefault()
                        enviar()
                      }
                    }}
                    placeholder={ditando ? 'Pode falar...' : 'Mensagem'}
                    rows={1}
                    aria-label={`Mensagem para ${nome}`}
                    style={{
                      ...styles.input,
                      fontSize: simples ? 19 : 16,
                    }}
                  />
                </div>
                {temTexto ? (
                  <button
                    type="submit"
                    className="tap anim-pop"
                    style={{
                      ...styles.redondo,
                      width: alvo + 4,
                      height: alvo + 4,
                      background: '#000',
                    }}
                    aria-label="Enviar mensagem"
                  >
                    <ArrowUp size={23} color="#fff" aria-hidden="true" />
                  </button>
                ) : (
                  gravacaoDisponivel() && (
                    <button
                      type="button"
                      className="tap anim-pop"
                      onClick={gravar}
                      disabled={enviandoAudio}
                      style={{
                        ...styles.redondo,
                        width: alvo + 4,
                        height: alvo + 4,
                        background: 'var(--erro)',
                        opacity: enviandoAudio ? 0.5 : 1,
                      }}
                      aria-label="Gravar mensagem de voz"
                    >
                      {enviandoAudio ? (
                        <LoaderCircle size={22} color="#fff" className="girar" aria-hidden="true" />
                      ) : (
                        <Mic size={23} color="#fff" aria-hidden="true" />
                      )}
                    </button>
                  )
                )}
              </form>
            )}
            {simples && !gravando && !temTexto && gravacaoDisponivel() && (
              <Botao
                variante="perigo"
                grande
                cheio
                icone={Mic}
                onClick={gravar}
                style={{
                  marginTop: 10,
                }}
              >
                Gravar áudio
              </Botao>
            )}
          </div>
        )}
      </div>

      <input
        ref={arquivoRef}
        type="file"
        accept="image/*"
        onChange={escolherArquivo}
        style={{
          display: 'none',
        }}
        aria-label="Escolher foto da galeria"
        data-teste="galeria"
      />
      <Sheet aberto={anexo === 'menu'} onFechar={fecharAnexo} titulo="Enviar">
        <div style={styles.menu}>
          <Botao variante="primario" cheio grande={simples} icone={Camera} onClick={() => setAnexo('camera')}>
            Tirar foto
          </Botao>
          <Botao
            variante="suave"
            cheio
            grande={simples}
            icone={IconeImagem}
            onClick={() => arquivoRef.current?.click()}
          >
            Escolher da galeria
          </Botao>
          <Botao variante="lima" cheio grande={simples} icone={MapPin} onClick={pedirLocal}>
            Enviar minha localização
          </Botao>
        </div>
      </Sheet>
      <Sheet aberto={anexo === 'camera'} onFechar={fecharAnexo} titulo="Tirar foto">
        {anexo === 'camera' && (
          <CameraAoVivo
            simples={simples}
            onFoto={f => {
              setFoto(f)
              setAnexo('foto')
            }}
          />
        )}
      </Sheet>
      <Sheet
        aberto={anexo === 'foto'}
        onFechar={fecharAnexo}
        titulo={`Enviar foto para ${nome.split(' ')[0]}?`}
      >
        {foto && (
          <div style={styles.menu}>
            <img src={foto} alt="Prévia da foto que vai ser enviada" style={styles.previa} />
            <div style={styles.duplo}>
              <Botao
                variante="fantasma"
                grande={simples}
                onClick={fecharAnexo}
                disabled={enviandoAnexo}
                style={{
                  flex: 1,
                }}
              >
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                grande={simples}
                icone={Send}
                onClick={enviarFoto}
                carregando={enviandoAnexo}
                style={{
                  flex: 1,
                }}
              >
                Enviar
              </Botao>
            </div>
          </div>
        )}
      </Sheet>
      <Sheet aberto={anexo === 'local'} onFechar={fecharAnexo} titulo="Enviar localização atual?">
        <div style={styles.menu}>
          {buscandoLocal ? (
            <p style={styles.localTexto}>
              <LoaderCircle size={20} className="girar" aria-hidden="true" /> Procurando onde você está...
            </p>
          ) : (
            posicao && (
              <div style={styles.localCartao} aria-live="polite">
                <MapPin size={simples ? 34 : 28} color="var(--erro)" aria-hidden="true" />
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      fontSize: simples ? 19 : 16,
                    }}
                  >
                    {fonteLocal}
                  </strong>
                  <div
                    style={{
                      fontSize: simples ? 16 : 14,
                      color: 'var(--text-2)',
                    }}
                  >
                    {posicao.lat.toFixed(5)}, {posicao.lng.toFixed(5)}
                  </div>
                  <div
                    style={{
                      fontSize: simples ? 16 : 14,
                      color: 'var(--text-2)',
                      marginTop: 4,
                    }}
                  >
                    {nome.split(' ')[0]} vai ver um ponto no mapa com o lugar onde você está.
                  </div>
                </div>
              </div>
            )
          )}
          <div style={styles.duplo}>
            <Botao
              variante="fantasma"
              grande={simples}
              onClick={fecharAnexo}
              disabled={enviandoAnexo}
              style={{
                flex: 1,
              }}
            >
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              grande={simples}
              icone={Send}
              onClick={enviarPosicao}
              disabled={!posicao}
              carregando={enviandoAnexo}
              style={{
                flex: 1,
              }}
            >
              Enviar
            </Botao>
          </div>
        </div>
      </Sheet>

      <Sheet aberto={menu} onFechar={() => setMenu(false)} titulo={nome}>
        <div style={styles.menu}>
          {contato && (
            <Botao
              variante="fantasma"
              cheio
              grande={simples}
              icone={IconeTag}
              onClick={() => {
                setMenu(false)
                setApelido(contato.apelido || '')
              }}
            >
              {contato.apelido ? 'Trocar apelido' : 'Dar um apelido'}
            </Botao>
          )}
          {!eu && !emergencia && lerContatosEmergencia().length < MAX_EMERGENCIA && (
            <Botao variante="fantasma" cheio grande={simples} icone={ShieldPlus} onClick={virarEmergencia}>
              Tornar contato de emergência
            </Botao>
          )}
          {!auditiva && (
            <div style={styles.toggleLinha}>
              <Volume2 size={20} aria-hidden="true" />
              <span
                style={{
                  flex: 1,
                }}
              >
                Tocar áudios e ler mensagens sozinho
              </span>
              <Toggle
                ligado={autoplay}
                onChange={v => setAuto(v)}
                label="Tocar áudios e ler mensagens sozinho"
              />
            </div>
          )}
          {contato ? (
            <Botao
              variante="fantasma"
              cheio
              grande={simples}
              icone={UserMinus}
              onClick={() => {
                setMenu(false)
                setRemover(true)
              }}
              style={{
                color: 'var(--erro)',
              }}
            >
              Remover dos contatos
            </Botao>
          ) : (
            !eu &&
            perfil && (
              <Botao
                variante="lima"
                cheio
                grande={simples}
                icone={UserPlus}
                onClick={() => {
                  adicionarContato({
                    uid,
                    ...perfil,
                  })
                  setMenu(false)
                }}
              >
                Adicionar aos contatos
              </Botao>
            )
          )}
          <Botao
            variante="suave"
            cheio
            grande={simples}
            icone={MessageCircle}
            onClick={() => {
              setMenu(false)
              navigate('/chat?q=' + encodeURIComponent(`Lê as últimas mensagens de ${nome}`))
            }}
          >
            Pedir para a Kleo ler
          </Botao>
        </div>
      </Sheet>

      <Sheet aberto={apelido !== null} onFechar={() => setApelido(null)} titulo="Apelido">
        {apelido !== null && (
          <form
            style={styles.menu}
            onSubmit={async e => {
              e.preventDefault()
              await renomearContato(uid, apelido.trim()).catch(() => {})
              setApelido(null)
            }}
          >
            <Campo
              rotulo={`Como você chama ${perfil?.nome?.split(' ')[0] || 'essa pessoa'}?`}
              icone={IconeTag}
              placeholder="Ex: Filha, Mãe, Vizinho"
              value={apelido}
              onChange={e => setApelido(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <Botao type="submit" variante="primario" grande cheio>
              Salvar
            </Botao>
          </form>
        )}
      </Sheet>

      <Modal
        aberto={!!apagar}
        onFechar={() => setApagar(null)}
        titulo="Apagar mensagem?"
        texto="Ela some para você e para a outra pessoa."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setApagar(null),
          },
          {
            label: 'Apagar',
            variante: 'perigo',
            onClick: confirmarApagar,
          },
        ]}
      />
      <Modal
        aberto={remover}
        onFechar={() => setRemover(false)}
        titulo={`Remover ${nome}?`}
        texto="A conversa continua aqui, mas a pessoa sai da sua lista de contatos."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setRemover(false),
          },
          {
            label: 'Remover',
            variante: 'perigo',
            onClick: async () => {
              setRemover(false)
              await removerContato(uid).catch(() => {})
            },
          },
        ]}
      />
    </Tela>
  )
}
const styles = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px 10px 6px',
    paddingTop: 'max(10px, env(safe-area-inset-top))',
    flexShrink: 0,
    borderBottom: '1px solid var(--surface-2)',
    background: 'var(--bg)',
  },
  voltar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: 'var(--text)',
    flexShrink: 0,
  },
  titulo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  nome: {
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  usuario: {
    fontSize: 13,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconeTopo: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--surface)',
    color: 'var(--text)',
    boxShadow: 'var(--sombra)',
    flexShrink: 0,
  },
  faixa: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '10px 14px 0',
    padding: '8px 8px 8px 14px',
    background: 'var(--surface)',
    borderRadius: 20,
    fontSize: 14,
    boxShadow: 'var(--sombra)',
  },
  mensagens: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '12px 14px 8px',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  centro: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: {
    color: 'var(--erro)',
    fontWeight: 600,
    textAlign: 'center',
  },
  vazio: {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 10,
    padding: 20,
  },
  vazioTitulo: {
    fontSize: 24,
    fontWeight: 800,
    marginTop: 6,
  },
  vazioTexto: {
    fontSize: 15,
    color: 'var(--text-2)',
    lineHeight: 1.45,
    maxWidth: 320,
  },
  dia: {
    display: 'flex',
    justifyContent: 'center',
    margin: '6px 0 2px',
  },
  diaRotulo: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-2)',
    background: 'var(--surface-2)',
    borderRadius: 20,
    padding: '5px 12px',
  },
  aviso: {
    margin: '0 14px 6px',
    padding: '10px 14px',
    borderRadius: 18,
    background: '#000',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
  },
  entrada: {
    padding: '6px 12px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    flexShrink: 0,
  },
  linha: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
  },
  campo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    padding: '4px 6px',
    transition: 'box-shadow 0.25s',
  },
  botaoCampo: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    resize: 'none',
    outline: 'none',
    fontFamily: 'var(--fonte)',
    color: 'var(--text)',
    padding: '10px 6px',
    maxHeight: 120,
    lineHeight: 1.35,
  },
  redondo: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: 'var(--sombra)',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 8,
  },
  duplo: {
    display: 'flex',
    gap: 10,
  },
  previa: {
    display: 'block',
    width: '100%',
    maxHeight: '50vh',
    objectFit: 'contain',
    borderRadius: 20,
    background: 'var(--surface-2)',
  },
  localTexto: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 16,
    fontWeight: 600,
    padding: '10px 4px',
  },
  localCartao: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
  },
  toggleLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 6px',
    fontSize: 16,
    fontWeight: 600,
  },
}
