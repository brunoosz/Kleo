import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  CheckCheck,
  Clock3,
  Volume2,
  CalendarPlus,
  CalendarCheck,
  Siren,
  MapPin,
  FileText,
  LoaderCircle,
  X,
  Eye,
  Map as IconeMapa,
  ExternalLink,
} from 'lucide-react'
import PlayerAudio from './PlayerAudio'
import Camada from '../Camada'
import { ler, salvar, adicionarEvento } from '../../lib/storage'
import {
  extrairCompromisso,
  pareceCompromisso,
  temTranscricao,
  transcreverAudio,
  analisarImagem,
  temIA,
} from '../../lib/ia'
import { atualizarMensagem } from '../../lib/rede'
import { fonteParaBlob } from '../../lib/audio'
import { falar } from '../../lib/voz'
const CHAVE_AGENDA = 'kleo_msg_agenda'
const CHAVE_DESCRICOES = 'kleo_msg_descricoes'
const lerCache = () => {
  const v = ler(CHAVE_AGENDA, {})
  return v && typeof v === 'object' ? v : {}
}
const lerDescricoes = () => {
  const v = ler(CHAVE_DESCRICOES, {})
  return v && typeof v === 'object' ? v : {}
}
const dataCurta = iso => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d, 12)
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace(/\./g, '')
}
export default function BolhaMensagem({
  msg,
  minha,
  lida,
  outro,
  simples = false,
  autoplay = false,
  auditiva = false,
  visual = false,
  onApagar,
  animar = false,
}) {
  const navigate = useNavigate()
  const pressao = useRef(null)
  const [aberta, setAberta] = useState(false)
  const [descricao, setDescricao] = useState(() => lerDescricoes()[msg.id] || '')
  const [descrevendo, setDescrevendo] = useState(false)
  const [compromisso, setCompromisso] = useState(() => lerCache()[msg.id] ?? null)
  const [transcrevendo, setTranscrevendo] = useState(false)
  const conteudo = msg.tipo === 'audio' ? msg.transcricao : msg.texto
  useEffect(() => {
    if (minha || !conteudo || !pareceCompromisso(conteudo)) return
    const cache = lerCache()
    if (msg.id in cache) return
    let vivo = true
    extrairCompromisso(conteudo, outro?.nomeReal || outro?.nome)
      .catch(() => null)
      .then(r => {
        const c = lerCache()
        c[msg.id] = r || 0
        salvar(CHAVE_AGENDA, Object.fromEntries(Object.entries(c).slice(-200)))
        if (vivo) setCompromisso(r || 0)
      })
    return () => {
      vivo = false
    }
  }, [msg.id, minha, conteudo, outro?.nome, outro?.nomeReal])
  useEffect(() => {
    if (!auditiva || minha || msg.tipo !== 'audio' || msg.transcricao || !msg.audio || !temTranscricao())
      return
    transcrever() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.id])
  useEffect(() => {
    if (!visual || minha || msg.tipo !== 'imagem' || !msg.imagem || descricao || !temIA('visao')) return
    descrever(true) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.id, msg.imagem])
  async function descrever(lerEmVoz = false) {
    if (descrevendo || !msg.imagem) return
    setDescrevendo(true)
    try {
      const t = (
        await analisarImagem(
          msg.imagem,
          'Descreva esta foto em uma ou duas frases para uma pessoa que não enxerga. Cite pessoas, lugares e textos visíveis.',
        )
      ).trim()
      if (t) {
        const c = lerDescricoes()
        c[msg.id] = t
        salvar(CHAVE_DESCRICOES, Object.fromEntries(Object.entries(c).slice(-100)))
        setDescricao(t)
        if (lerEmVoz || visual)
          falar(`Foto de ${outro?.nome || 'contato'}: ${t}`, {
            forcar: true,
          }).catch(() => {})
      }
    } catch {}
    setDescrevendo(false)
  }
  async function transcrever() {
    if (transcrevendo || !msg.audio) return
    setTranscrevendo(true)
    try {
      const texto = await transcreverAudio(await fonteParaBlob(msg.audio))
      if (texto)
        await atualizarMensagem(outro.uid, msg.id, {
          transcricao: texto,
        })
    } catch {}
    setTranscrevendo(false)
  }
  const salvarNaAgenda = () => {
    if (!compromisso || compromisso.adicionado) return
    adicionarEvento({
      titulo: compromisso.titulo,
      data: compromisso.data,
      hora: compromisso.hora,
      descricao: `Combinado com ${outro?.nomeReal || outro?.nome || 'contato'} pelas Conversas`,
    })
    const novo = {
      ...compromisso,
      adicionado: true,
    }
    const c = lerCache()
    c[msg.id] = novo
    salvar(CHAVE_AGENDA, c)
    setCompromisso(novo)
    navigator.vibrate?.(30)
  }
  const segurar = () => {
    if (!minha || msg.pendente || !onApagar) return
    pressao.current = setTimeout(() => {
      navigator.vibrate?.(25)
      onApagar(msg)
    }, 550)
  }
  const soltar = () => clearTimeout(pressao.current)
  const hora = new Date(msg.em).toTimeString().slice(0, 5)
  const Status = msg.pendente ? Clock3 : lida ? CheckCheck : Check
  if (msg.tipo === 'sos') {
    const temLocal = Number.isFinite(msg.lat)
    return (
      <div
        style={{
          ...styles.linha,
          justifyContent: minha ? 'flex-end' : 'flex-start',
        }}
        className={animar ? 'anim-pop' : undefined}
      >
        <div style={styles.sos} role="alert">
          <span style={styles.sosTopo}>
            <Siren size={20} aria-hidden="true" />{' '}
            {minha ? 'Você pediu ajuda' : `${outro?.nome || 'Contato'} pediu ajuda`}
          </span>
          {msg.texto && (
            <p
              style={{
                ...styles.sosTexto,
                fontSize: simples ? 18 : 16,
              }}
            >
              {msg.texto}
            </p>
          )}
          {temLocal && !minha && (
            <button
              type="button"
              className="tap"
              style={styles.sosBotao}
              onClick={() =>
                navigate(
                  `/mapa?destino=${encodeURIComponent(outro?.nome || 'Local do pedido')}&lat=${msg.lat}&lon=${msg.lng}&modo=carro`,
                )
              }
            >
              <MapPin size={18} aria-hidden="true" /> Ver onde está
            </button>
          )}
          <span style={styles.sosHora}>{hora}</span>
        </div>
      </div>
    )
  }
  return (
    <div
      style={{
        ...styles.linha,
        justifyContent: minha ? 'flex-end' : 'flex-start',
      }}
      className={animar ? (minha ? 'bolha-user' : 'bolha-kleo') : undefined}
    >
      <div
        style={{
          ...styles.coluna,
          alignItems: minha ? 'flex-end' : 'flex-start',
          maxWidth: simples ? '92%' : '82%',
        }}
      >
        <div
          onPointerDown={segurar}
          onPointerUp={soltar}
          onPointerLeave={soltar}
          onPointerCancel={soltar}
          onContextMenu={e => {
            if (minha && onApagar) {
              e.preventDefault()
              onApagar(msg)
            }
          }}
          style={{
            ...styles.bolha,
            ...(minha ? styles.minha : styles.dela),
            fontSize: simples ? 19 : 16,
            opacity: msg.pendente ? 0.85 : 1,
          }}
        >
          {msg.tipo === 'audio' && msg.audio ? (
            <PlayerAudio
              src={msg.audio}
              duracao={msg.duracao}
              escuro={minha}
              autoplay={autoplay}
              simples={simples}
              semente={msg.id}
            />
          ) : msg.tipo === 'imagem' && msg.imagem ? (
            <button
              type="button"
              className="tap"
              style={styles.fotoBotao}
              onClick={() => setAberta(true)}
              aria-label={`Abrir foto${minha ? ' que você enviou' : ` de ${outro?.nome || 'contato'}`}${descricao ? `: ${descricao}` : ''}`}
            >
              <img
                src={msg.imagem}
                alt={
                  descricao ||
                  (minha ? 'Foto que você enviou' : `Foto enviada por ${outro?.nome || 'contato'}`)
                }
                style={{
                  ...styles.foto,
                  maxWidth: simples ? 280 : 240,
                }}
                loading="lazy"
              />
            </button>
          ) : msg.tipo === 'local' && Number.isFinite(msg.lat) ? (
            <div style={styles.local}>
              <span style={styles.localTopo}>
                <MapPin size={20} aria-hidden="true" />{' '}
                {minha ? 'Sua localização' : `Localização de ${outro?.nome || 'contato'}`}
              </span>
              {msg.texto && <span style={styles.texto}>{msg.texto}</span>}
              <span
                style={{
                  fontSize: 13,
                  opacity: 0.75,
                }}
              >
                {msg.lat.toFixed(5)}, {msg.lng.toFixed(5)}
              </span>
            </div>
          ) : (
            <span style={styles.texto}>{msg.texto}</span>
          )}

          {msg.tipo === 'imagem' && descricao && (
            <span
              style={{
                ...styles.transcricao,
                borderColor: minha ? 'rgba(255,255,255,0.25)' : 'var(--surface-2)',
              }}
            >
              <Eye
                size={14}
                style={{
                  flexShrink: 0,
                  marginTop: 3,
                  opacity: 0.7,
                }}
                aria-hidden="true"
              />
              <span>{descricao}</span>
            </span>
          )}

          {msg.tipo === 'audio' && msg.transcricao && (
            <span
              style={{
                ...styles.transcricao,
                borderColor: minha ? 'rgba(255,255,255,0.25)' : 'var(--surface-2)',
              }}
            >
              <FileText
                size={14}
                style={{
                  flexShrink: 0,
                  marginTop: 3,
                  opacity: 0.7,
                }}
                aria-hidden="true"
              />
              <span>{msg.transcricao}</span>
            </span>
          )}

          <span
            style={{
              ...styles.meta,
              color: minha ? 'rgba(255,255,255,0.72)' : 'var(--text-3)',
            }}
          >
            {hora}
            {minha && (
              <Status
                size={15}
                strokeWidth={2.4}
                color={lida && !msg.pendente ? 'var(--lavanda-forte)' : 'currentColor'}
                aria-label={msg.pendente ? 'Enviando' : lida ? 'Lida' : 'Enviada'}
              />
            )}
          </span>
        </div>

        <div style={styles.acoes}>
          {msg.tipo === 'local' && Number.isFinite(msg.lat) && (
            <>
              <button
                type="button"
                className="tap"
                style={{
                  ...styles.acao,
                  ...(simples ? styles.acaoGrande : {}),
                  background: 'var(--lima)',
                  color: '#000',
                }}
                onClick={() =>
                  navigate(
                    `/mapa?lat=${msg.lat}&lon=${msg.lng}&destino=${encodeURIComponent(minha ? 'Minha localização' : outro?.nome || 'Localização')}&modo=carro`,
                  )
                }
                aria-label={`Ver no mapa a localização ${minha ? 'que você enviou' : `de ${outro?.nome || 'contato'}`}`}
              >
                <IconeMapa size={15} aria-hidden="true" /> Ver no mapa
              </button>
              <a
                className="tap"
                style={{
                  ...styles.acao,
                  ...(simples ? styles.acaoGrande : {}),
                  textDecoration: 'none',
                }}
                href={`https://maps.google.com/?q=${msg.lat},${msg.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir no Google Maps (abre outro app)"
              >
                <ExternalLink size={15} aria-hidden="true" /> Abrir no Google Maps
              </a>
            </>
          )}
          {msg.tipo === 'imagem' && msg.imagem && !descricao && temIA('visao') && (
            <button
              type="button"
              className="tap"
              style={styles.acao}
              onClick={() => descrever(visual)}
              disabled={descrevendo}
              aria-label="Descrever a foto com a Kleo"
            >
              {descrevendo ? (
                <LoaderCircle size={15} className="girar" aria-hidden="true" />
              ) : (
                <Eye size={15} aria-hidden="true" />
              )}
              {descrevendo ? 'Descrevendo' : 'Descrever foto'}
            </button>
          )}
          {msg.tipo === 'texto' && !minha && (
            <button
              type="button"
              className="tap"
              style={styles.acao}
              onClick={() =>
                falar(`${outro?.nome || ''} disse: ${msg.texto}`, {
                  forcar: true,
                })
              }
              aria-label="Ouvir esta mensagem"
            >
              <Volume2 size={15} aria-hidden="true" /> Ouvir
            </button>
          )}
          {msg.tipo === 'audio' && !msg.transcricao && msg.audio && temTranscricao() && (
            <button
              type="button"
              className="tap"
              style={styles.acao}
              onClick={transcrever}
              disabled={transcrevendo}
              aria-label="Transformar o áudio em texto"
            >
              {transcrevendo ? (
                <LoaderCircle size={15} className="girar" aria-hidden="true" />
              ) : (
                <FileText size={15} aria-hidden="true" />
              )}
              {transcrevendo ? 'Transcrevendo' : 'Ver em texto'}
            </button>
          )}
          {compromisso ? (
            <button
              type="button"
              className={compromisso.adicionado ? undefined : 'tap anim-pop'}
              style={{
                ...styles.agenda,
                background: compromisso.adicionado ? 'var(--surface-2)' : 'var(--lima)',
              }}
              onClick={salvarNaAgenda}
              disabled={compromisso.adicionado}
            >
              {compromisso.adicionado ? (
                <CalendarCheck size={16} aria-hidden="true" />
              ) : (
                <CalendarPlus size={16} aria-hidden="true" />
              )}
              <span>
                {compromisso.adicionado ? 'Na sua agenda' : 'Pôr na agenda'}: {compromisso.titulo} ·{' '}
                {dataCurta(compromisso.data)}
                {compromisso.hora ? ` às ${compromisso.hora}` : ''}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {aberta && msg.imagem && (
        <Camada>
          <div
            style={styles.telaCheia}
            role="dialog"
            aria-modal="true"
            aria-label={
              descricao ? `Foto: ${descricao}` : minha ? 'Sua foto' : `Foto de ${outro?.nome || 'contato'}`
            }
            onClick={() => setAberta(false)}
          >
            <img
              src={msg.imagem}
              alt={
                descricao || (minha ? 'Foto que você enviou' : `Foto enviada por ${outro?.nome || 'contato'}`)
              }
              style={styles.fotoCheia}
              onClick={e => e.stopPropagation()}
            />
            <button
              type="button"
              className="tap"
              style={styles.fechar}
              onClick={() => setAberta(false)}
              aria-label="Fechar foto"
              autoFocus
            >
              <X size={simples ? 30 : 26} aria-hidden="true" />
            </button>
            <div style={styles.rodapeFoto} onClick={e => e.stopPropagation()}>
              {descricao && (
                <p
                  style={{
                    ...styles.descricaoCheia,
                    fontSize: simples ? 18 : 15,
                  }}
                >
                  {descricao}
                </p>
              )}
              {temIA('visao') && (
                <button
                  type="button"
                  className="tap"
                  style={{
                    ...styles.descreverBotao,
                    minHeight: simples ? 56 : 48,
                    fontSize: simples ? 18 : 16,
                  }}
                  onClick={() => descrever(true)}
                  disabled={descrevendo}
                  aria-label={descricao ? 'Ouvir a descrição da foto' : 'Descrever a foto com a Kleo'}
                >
                  {descrevendo ? (
                    <LoaderCircle size={20} className="girar" aria-hidden="true" />
                  ) : descricao ? (
                    <Volume2 size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                  {descrevendo ? 'Descrevendo...' : descricao ? 'Ouvir descrição' : 'Descrever foto'}
                </button>
              )}
            </div>
          </div>
        </Camada>
      )}
    </div>
  )
}
const styles = {
  linha: {
    display: 'flex',
    width: '100%',
  },
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  bolha: {
    padding: '11px 15px 8px',
    borderRadius: 24,
    lineHeight: 1.42,
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    userSelect: 'text',
    WebkitTouchCallout: 'none',
  },
  minha: {
    background: '#000',
    color: '#fff',
    borderBottomRightRadius: 8,
  },
  dela: {
    background: 'var(--surface)',
    color: 'var(--text)',
    borderBottomLeftRadius: 8,
    boxShadow: 'var(--sombra)',
  },
  texto: {
    whiteSpace: 'pre-wrap',
  },
  transcricao: {
    display: 'flex',
    gap: 8,
    fontSize: 15,
    lineHeight: 1.4,
    paddingTop: 8,
    borderTop: '1px solid',
    fontStyle: 'italic',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
    marginTop: -2,
  },
  acoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  acaoGrande: {
    minHeight: 46,
    fontSize: 16,
    padding: '8px 16px',
  },
  fotoBotao: {
    display: 'block',
    padding: 0,
    margin: '-5px -9px 0',
    background: 'transparent',
    borderRadius: 18,
    overflow: 'hidden',
    lineHeight: 0,
  },
  foto: {
    display: 'block',
    width: '100%',
    maxHeight: 320,
    objectFit: 'cover',
    borderRadius: 18,
  },
  local: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 180,
  },
  localTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 800,
  },
  telaCheia: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000,
  },
  fotoCheia: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  fechar: {
    position: 'absolute',
    top: 'max(12px, env(safe-area-inset-top))',
    right: 12,
    width: 52,
    height: 52,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.92)',
    color: '#000',
  },
  rodapeFoto: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '12px 16px',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
  },
  descricaoCheia: {
    color: '#fff',
    lineHeight: 1.4,
    margin: 0,
    textAlign: 'center',
  },
  descreverBotao: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 'var(--r-btn)',
    padding: '10px 18px',
    background: 'var(--lima)',
    color: '#000',
    fontWeight: 700,
    alignSelf: 'center',
  },
  acao: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    minHeight: 34,
    borderRadius: 20,
    background: 'var(--surface)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-2)',
    boxShadow: 'var(--sombra)',
  },
  agenda: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    minHeight: 40,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
    color: '#000',
    textAlign: 'left',
    lineHeight: 1.3,
    boxShadow: 'var(--sombra)',
  },
  sos: {
    maxWidth: '88%',
    background: '#ffe1de',
    border: '2px solid var(--erro)',
    borderRadius: 24,
    padding: '14px 16px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    color: '#000',
  },
  sosTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 800,
    color: '#b4232a',
  },
  sosTexto: {
    lineHeight: 1.4,
  },
  sosBotao: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 'var(--r-btn)',
    background: 'var(--erro)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
  },
  sosHora: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-3)',
    alignSelf: 'flex-end',
  },
}
