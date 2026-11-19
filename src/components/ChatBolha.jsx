import { useState } from 'react'
import {
  Brain,
  CalendarPlus,
  ListPlus,
  AlarmClock,
  Volume2,
  ChevronRight,
  Camera,
  Copy,
  Check,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  ArrowUpRight,
  Search,
  Briefcase,
  Accessibility,
} from 'lucide-react'
const ACOES = {
  memoria: {
    icone: Brain,
    cor: 'var(--surface-2)',
    rota: null,
    rotulo: 'Memória',
  },
  agenda: {
    icone: CalendarPlus,
    cor: 'var(--lavanda)',
    rota: '/agenda',
    rotulo: 'Agenda',
  },
  lista: {
    icone: ListPlus,
    cor: 'var(--lima)',
    rota: '/notas',
    rotulo: 'Lista',
  },
  rotina: {
    icone: AlarmClock,
    cor: 'var(--ceu)',
    rota: '/rotinas',
    rotulo: 'Rotina',
  },
  navegar: {
    icone: MapPin,
    cor: 'var(--ceu)',
    rota: '/mapa',
    rotulo: 'Mapa',
  },
  abrir: {
    icone: ArrowUpRight,
    cor: 'var(--lavanda)',
    rota: '/home',
    rotulo: 'Abrir',
  },
  buscar: {
    icone: Search,
    cor: 'var(--surface-2)',
    rota: null,
    rotulo: 'Busca',
  },
  despertador: {
    icone: AlarmClock,
    cor: 'var(--lima)',
    rota: '/rotinas?aba=despertador',
    rotulo: 'Despertador',
  },
  trabalho: {
    icone: Briefcase,
    cor: 'var(--lima)',
    rota: null,
    rotulo: 'Modo trabalho',
  },
}
const distTexto = m =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`
function ListaLugares({ lugares, onLugar, simples }) {
  return (
    <div style={styles.lugares}>
      {lugares.map((l, i) => {
        const conteudo = (
          <>
            <span
              style={{
                ...styles.lugarNum,
                width: simples ? 40 : 34,
                height: simples ? 40 : 34,
              }}
            >
              {l.n}
            </span>
            <span style={styles.lugarTextos}>
              <span
                style={{
                  ...styles.lugarNome,
                  fontSize: simples ? 18 : 16,
                }}
              >
                {l.nome}
              </span>
              <span style={styles.lugarInfo}>
                {[
                  distTexto(l.metros),
                  l.aberto === true ? 'Aberto agora' : l.aberto === false ? 'Fechado agora' : '',
                  l.endereco,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                {l.acessivel && (
                  <Accessibility
                    size={14}
                    style={{
                      marginLeft: 6,
                      verticalAlign: -2,
                    }}
                    aria-label="acessível"
                  />
                )}
              </span>
            </span>
            {onLugar && <ChevronRight size={18} aria-hidden="true" />}
          </>
        )
        return onLugar ? (
          <button
            key={l.n}
            type="button"
            className="tap anim-up"
            onClick={() => onLugar(l)}
            style={{
              ...styles.lugar,
              animationDelay: `${0.05 + i * 0.05}s`,
              minHeight: simples ? 64 : 54,
            }}
            aria-label={`Escolher opção ${l.n}: ${l.nome}, a ${distTexto(l.metros)}`}
          >
            {conteudo}
          </button>
        ) : (
          <div key={l.n} style={styles.lugar}>
            {conteudo}
          </div>
        )
      })}
    </div>
  )
}
function TextoRico({ texto }) {
  const linhas = String(texto || '').split('\n')
  return linhas.map((linha, i) => {
    const partes = linha.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={i}>
        {partes.map((p, j) =>
          p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
            <strong key={j} style={styles.negrito}>
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        )}
        {i < linhas.length - 1 && <br />}
      </span>
    )
  })
}
export default function ChatBolha({
  role,
  texto,
  acoes = [],
  lugares,
  onLugar,
  imagem,
  erro = false,
  config = false,
  onConfig,
  onRepetir,
  onOuvir,
  onAcao,
  simples = false,
  digitando = false,
  interrompida = false,
  animar = false,
  entrada,
}) {
  const [copiado, setCopiado] = useState(false)
  const doUsuario = role === 'user'
  const comFoto = doUsuario && /^\[Imagem\]/.test(texto || '')
  const textoVisivel = comFoto ? texto.replace(/^\[Imagem\]\s*/, '') : texto
  const classeBolha = animar ? (doUsuario ? 'bolha-user' : 'bolha-kleo') : undefined
  const classeLinha = !animar && entrada != null ? 'anim-up' : undefined
  const base = animar ? 0.2 : (entrada ?? 0) + 0.12
  const extras = animar || entrada != null
  const alvo = simples ? 52 : 40
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(texto || ''))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1600)
    } catch {}
  }
  const mostrarRodape = !doUsuario && !erro && !digitando && (onOuvir || !simples)
  return (
    <div
      className={classeLinha}
      style={{
        ...styles.linha,
        justifyContent: doUsuario ? 'flex-end' : 'flex-start',
        animationDelay: classeLinha ? `${entrada}s` : undefined,
      }}
    >
      <div
        style={{
          ...styles.coluna,
          alignItems: doUsuario ? 'flex-end' : 'flex-start',
          maxWidth: simples ? '92%' : '84%',
        }}
      >
        <div
          className={classeBolha}
          style={{
            ...styles.bolha,
            ...(doUsuario ? styles.bolhaUsuario : styles.bolhaKleo),
            ...(erro ? styles.bolhaErro : null),
            fontSize: simples ? 19 : 16.5,
          }}
        >
          <span style={styles.oculto}>{doUsuario ? 'Você disse: ' : 'Kleo disse: '}</span>
          {comFoto && !imagem && (
            <span style={styles.rotuloFoto}>
              <Camera size={15} aria-hidden="true" /> Foto enviada
            </span>
          )}
          {imagem && (
            <img
              src={imagem}
              alt="Foto enviada para a Kleo"
              className={animar ? 'anim-scale' : undefined}
              style={{
                ...styles.miniatura,
                animationDelay: '0.08s',
              }}
            />
          )}
          {textoVisivel && (
            <div>
              <TextoRico texto={textoVisivel} />
              {digitando && <span className="chat-cursor" style={styles.cursor} aria-hidden="true" />}
            </div>
          )}
          {interrompida && <span style={styles.interrompida}>Resposta interrompida</span>}
          {(config || onRepetir) && (
            <div style={styles.botoesErro}>
              {config && (
                <button
                  type="button"
                  onClick={onConfig}
                  className="tap"
                  style={{
                    ...styles.botaoConfig,
                    minHeight: simples ? 56 : 46,
                  }}
                >
                  <SlidersHorizontal size={17} aria-hidden="true" /> Configurar IA
                </button>
              )}
              {onRepetir && (
                <button
                  type="button"
                  onClick={onRepetir}
                  className="tap"
                  style={{
                    ...styles.botaoRepetir,
                    minHeight: simples ? 56 : 46,
                  }}
                >
                  <RotateCcw size={17} aria-hidden="true" /> Tentar de novo
                </button>
              )}
            </div>
          )}
        </div>

        {!doUsuario && Array.isArray(lugares) && lugares.length > 0 && (
          <ListaLugares lugares={lugares} onLugar={onLugar} simples={simples} />
        )}

        {!doUsuario && acoes.length > 0 && (
          <div style={styles.acoes}>
            {acoes.map((a, i) => {
              const info = ACOES[a.tipo] || ACOES.memoria
              const Icone = info.icone
              const clicavel = !!info.rota && !!onAcao
              const rota =
                a.rota || (a.tipo === 'agenda' && a.data ? `${info.rota}?data=${a.data}` : info.rota)
              const conteudo = (
                <>
                  <span style={styles.chipIcone}>
                    <Icone size={simples ? 17 : 15} color="#000" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span style={styles.chipTexto}>{a.texto}</span>
                  {clicavel && <ChevronRight size={15} color="#000" aria-hidden="true" />}
                </>
              )
              const estilo = {
                ...styles.chipAcao,
                background: info.cor,
                minHeight: simples ? 52 : 40,
                fontSize: simples ? 16 : 14,
                animationDelay: extras ? `${base + 0.1 + i * 0.07}s` : undefined,
              }
              return clicavel ? (
                <button
                  key={i}
                  type="button"
                  className={'tap' + (extras ? ' anim-pop' : '')}
                  onClick={() => onAcao(rota)}
                  style={estilo}
                  aria-label={`${info.rotulo}: ${a.texto}. Abrir`}
                >
                  {conteudo}
                </button>
              ) : (
                <span
                  key={i}
                  className={extras ? 'anim-pop' : undefined}
                  style={estilo}
                  aria-label={`${info.rotulo}: ${a.texto}`}
                >
                  {conteudo}
                </span>
              )
            })}
          </div>
        )}

        {mostrarRodape && (
          <div
            className={extras ? 'anim-fade' : undefined}
            style={{
              ...styles.rodape,
              animationDelay: extras ? `${base + 0.15 + acoes.length * 0.07}s` : undefined,
            }}
          >
            {onOuvir && (
              <button
                type="button"
                onClick={onOuvir}
                className="tap"
                style={{
                  ...styles.miniBotao,
                  minHeight: alvo,
                  fontSize: simples ? 16 : 13.5,
                }}
                aria-label="Ouvir esta resposta"
              >
                <Volume2 size={simples ? 18 : 15} aria-hidden="true" /> Ouvir
              </button>
            )}
            {!simples && (
              <button
                type="button"
                onClick={copiar}
                className="tap"
                style={{
                  ...styles.miniBotao,
                  minHeight: alvo,
                }}
                aria-label="Copiar esta resposta"
              >
                <span key={String(copiado)} className="anim-pop" style={styles.centro}>
                  {copiado ? (
                    <Check size={15} color="var(--sucesso)" aria-hidden="true" />
                  ) : (
                    <Copy size={15} aria-hidden="true" />
                  )}
                </span>
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
const styles = {
  lugares: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    maxWidth: 420,
  },
  lugar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px 10px 10px',
    background: 'var(--surface)',
    borderRadius: 22,
    boxShadow: 'var(--sombra)',
    color: 'var(--text)',
  },
  lugarNum: {
    borderRadius: '50%',
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
    flexShrink: 0,
    color: '#000',
  },
  lugarTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  lugarNome: {
    fontWeight: 800,
    lineHeight: 1.2,
    overflowWrap: 'anywhere',
  },
  lugarInfo: {
    fontSize: 13,
    color: 'var(--text-2)',
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },
  linha: {
    display: 'flex',
    width: '100%',
  },
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  bolha: {
    padding: '13px 18px',
    borderRadius: 25,
    lineHeight: 1.45,
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  bolhaUsuario: {
    background: '#000',
    color: '#fff',
    borderBottomRightRadius: 8,
  },
  bolhaKleo: {
    background: 'var(--surface)',
    color: 'var(--text)',
    borderBottomLeftRadius: 8,
    boxShadow: 'var(--sombra)',
  },
  bolhaErro: {
    boxShadow: 'var(--sombra), inset 0 0 0 1.5px var(--erro)',
  },
  negrito: {
    fontWeight: 700,
  },
  miniatura: {
    width: 210,
    maxWidth: '100%',
    borderRadius: 15,
    display: 'block',
    objectFit: 'cover',
    maxHeight: 230,
  },
  rotuloFoto: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    opacity: 0.85,
  },
  cursor: {
    display: 'inline-block',
    width: 9,
    height: '1em',
    marginLeft: 3,
    verticalAlign: '-0.12em',
    borderRadius: 3,
    background: 'var(--lavanda-forte)',
  },
  interrompida: {
    fontSize: 13,
    color: 'var(--text-3)',
  },
  botoesErro: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  botaoConfig: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#000',
    color: '#fff',
    borderRadius: 'var(--r-btn)',
    padding: '0 18px',
    fontSize: 15,
    fontWeight: 600,
  },
  botaoRepetir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-btn)',
    padding: '0 18px',
    fontSize: 15,
    fontWeight: 600,
  },
  acoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipAcao: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 14px 4px 5px',
    borderRadius: 'var(--r-badge)',
    color: '#000',
    fontWeight: 500,
    maxWidth: '100%',
    boxShadow: 'var(--sombra)',
    textAlign: 'left',
  },
  chipIcone: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.7)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTexto: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rodape: {
    display: 'flex',
    gap: 4,
    paddingLeft: 4,
  },
  miniBotao: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--text-2)',
    fontSize: 13.5,
    padding: '0 10px',
    fontWeight: 600,
    borderRadius: 'var(--r-btn)',
  },
  centro: {
    display: 'flex',
  },
  oculto: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
}
