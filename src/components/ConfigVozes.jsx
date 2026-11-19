import { useEffect, useRef, useState } from 'react'
import {
  Volume2,
  AudioLines,
  Play,
  Square,
  Check,
  Download,
  Sparkles,
  Smartphone,
  Gauge,
  RotateCcw,
  Users,
  UserRound,
} from 'lucide-react'
import { ConfigGrupo, ConfigLinha, ConfigBloco } from './ConfigGrupo'
import { Sheet, Botao, Campo, Tag, Toggle, Modal } from './ui'
import Mascote from './Mascote'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { salvarVozAparelho, mensagemConta } from '../lib/conta'
import {
  falar,
  pararFala,
  listarVozesEleven,
  salvarVozMascote,
  salvarVozPadrao,
  aplicarPadroesGenero,
  verificarVozNatural,
  definirVozAparelho,
  vozSemCota,
  VELOCIDADES,
  VOZES_PADRAO_ELEVEN,
} from '../lib/voz'
import { MASCOTES_ESPECIAIS, getMascoteSpec, resolverMascote, sugeridos } from '../data/mascotes'
import { temNecessidade } from '../lib/perfil'
function descreverVoz(v) {
  const l = v?.labels || {}
  const genero =
    {
      female: 'feminina',
      male: 'masculina',
      neutral: 'neutra',
    }[l.gender] || ''
  return [genero, l.accent, l.age, l.description || l['use case'] || l.use_case].filter(Boolean).join(' · ')
}
const GENERO_ROTULO = {
  f: 'Feminina',
  m: 'Masculina',
}
const PADRAO_INICIAL = {
  f: VOZES_PADRAO_ELEVEN.f[0].voice_id,
  m: VOZES_PADRAO_ELEVEN.m[0].voice_id,
}
function nomeConhecido(id, lista) {
  return (
    lista?.find(v => v.voice_id === id)?.name ||
    [...VOZES_PADRAO_ELEVEN.f, ...VOZES_PADRAO_ELEVEN.m].find(v => v.voice_id === id)?.name
  )
}
export default function ConfigVozes({ destaque, avisar }) {
  const simples = useModoSimples()
  const [voz, setVoz] = useStorage('kleo_voz', true)
  const [vel, setVel] = useStorage('kleo_voz_velocidade', 'normal')
  const [mapaVozes] = useStorage('kleo_vozes', {})
  const [profile] = useStorage('kleo_profile', null)
  const [mascoteSalvo] = useStorage('kleo_mascote', null)
  const [padraoF] = useStorage('kleo_voz_padrao_f', '')
  const [padraoM] = useStorage('kleo_voz_padrao_m', '')
  const padroes = {
    f: padraoF || PADRAO_INICIAL.f,
    m: padraoM || PADRAO_INICIAL.m,
  }
  const [aparelho] = useStorage('kleo_voz_aparelho', false)
  const [salvandoAparelho, setSalvandoAparelho] = useState(false)
  const [natural, setNatural] = useState(null)
  const [vozes, setVozes] = useState(null)
  const [folha, setFolha] = useState(null)
  const [confirmar, setConfirmar] = useState(false)
  const temChave = natural === true
  useEffect(() => {
    let vivo = true
    verificarVozNatural({
      forcar: true,
    }).then(ok => {
      if (vivo) setNatural(ok)
    })
    return () => {
      vivo = false
    }
  }, [])
  const atual = resolverMascote(profile, mascoteSalvo)
  const ids = [...new Set([atual, ...sugeridos(profile), ...MASCOTES_ESPECIAIS.map(m => m.id)])]
  const mostrados = simples ? [atual] : ids
  const mapa = mapaVozes && typeof mapaVozes === 'object' ? mapaVozes : {}
  const carregarVozes = async () => {
    setVozes(v => ({
      estado: 'carregando',
      lista: v?.lista || [],
    }))
    try {
      const lista = await listarVozesEleven()
      setVozes({
        estado: 'ok',
        lista,
      })
      avisar?.(`${lista.length} vozes carregadas`)
    } catch (e) {
      setVozes({
        estado: 'erro',
        lista: [],
        erro: e.message,
      })
    }
  }
  const trocarAparelho = async v => {
    setSalvandoAparelho(true)
    try {
      await salvarVozAparelho(v)
      definirVozAparelho(v)
      avisar?.(v ? 'Voz do aparelho liberada para todos' : 'Só a voz natural')
    } catch (e) {
      avisar?.(mensagemConta(e))
    } finally {
      setSalvandoAparelho(false)
    }
  }
  const nomeVoz = id => nomeConhecido(id, vozes?.lista) || `Voz ${String(id).slice(0, 8)}…`
  const qtdProprias = Object.keys(mapa).length
  const aplicarPadroes = () => {
    aplicarPadroesGenero()
    setConfirmar(false)
    avisar?.('Todos os mascotes usam a voz padrão do gênero')
  }
  return (
    <>
      <ConfigGrupo
        id="vozes"
        titulo="Voz"
        destaque={destaque}
        rodape={
          temNecessidade(profile, 'auditiva')
            ? 'Todas as respostas também aparecem em texto, com ou sem voz.'
            : undefined
        }
      >
        <ConfigLinha
          icone={Volume2}
          cor="lima"
          titulo="Respostas em voz"
          detalhe={voz !== false ? 'A Kleo lê as respostas em voz alta' : 'Desligada'}
          direita={
            <Toggle
              ligado={voz !== false}
              onChange={v => {
                setVoz(v)
                if (v)
                  falar('Voz ligada.', {
                    forcar: true,
                  })
              }}
              label="Respostas em voz"
            />
          }
        />

        <ConfigLinha
          icone={temChave ? Sparkles : Smartphone}
          cor={temChave ? 'lavanda' : 'mist'}
          titulo={
            natural === null
              ? 'Conferindo a voz natural...'
              : temChave
                ? 'Voz natural ligada'
                : 'Voz do aparelho'
          }
          detalhe={
            temChave && vozSemCota() ? 'A cota acabou por agora' : temChave ? 'Vozes mais humanas' : undefined
          }
          semChevron
        />

        <ConfigLinha
          icone={Smartphone}
          cor={aparelho ? 'ceu' : 'mist'}
          titulo="Voz do aparelho"
          detalhe={
            aparelho
              ? 'Entra quando a voz natural estiver sem cota'
              : 'Desligada: a Kleo só fala com a voz natural'
          }
          direita={
            <Toggle
              ligado={aparelho === true}
              onChange={trocarAparelho}
              disabled={salvandoAparelho}
              label="Voz do aparelho"
            />
          }
        />

        <ConfigBloco>
          <span style={styles.rotulo}>
            <Gauge size={16} aria-hidden="true" style={styles.rotuloIcone} /> Velocidade da fala
          </span>
          <div style={styles.modelos} role="radiogroup" aria-label="Velocidade da fala">
            {VELOCIDADES.map(v => {
              const ativo = (vel || 'normal') === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  className="tap"
                  onClick={() => {
                    setVel(v.id)
                    if (voz !== false)
                      falar('Assim fica bom?', {
                        forcar: true,
                      })
                  }}
                  style={{
                    ...styles.modelo,
                    background: ativo ? '#000' : 'var(--surface-2)',
                    color: ativo ? '#fff' : '#000',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                    }}
                  >
                    {v.rotulo}
                  </span>
                  {ativo && <Check size={20} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          {temChave && !simples && (
            <Botao
              variante="fantasma"
              icone={Download}
              cheio
              onClick={carregarVozes}
              carregando={vozes?.estado === 'carregando'}
              style={{
                marginTop: 12,
              }}
            >
              {vozes?.estado === 'ok'
                ? `Recarregar vozes (${vozes.lista.length})`
                : 'Ver mais vozes naturais'}
            </Botao>
          )}
          {vozes?.estado === 'erro' && (
            <p style={styles.erro} role="alert">
              {vozes.erro}
            </p>
          )}
        </ConfigBloco>

        {temChave && !simples && (
          <ConfigBloco
            style={{
              paddingTop: 0,
            }}
          >
            <span style={styles.rotulo}>Vozes padrão</span>
            <p style={styles.ajudaPadrao}>Usadas pelos mascotes que não têm uma voz própria escolhida.</p>
            <div style={styles.padroes}>
              {['f', 'm'].map(g => (
                <button
                  key={g}
                  type="button"
                  className="tap"
                  onClick={() => setFolha(`padrao:${g}`)}
                  aria-label={`Escolher voz ${GENERO_ROTULO[g].toLowerCase()} padrão`}
                  style={{
                    ...styles.padrao,
                    background: g === 'f' ? 'var(--lavanda)' : 'var(--ceu)',
                  }}
                >
                  <span style={styles.padraoIcone}>
                    <UserRound size={20} aria-hidden="true" />
                  </span>
                  <span style={styles.vozTextos}>
                    <span style={styles.padraoRotulo}>{GENERO_ROTULO[g]}</span>
                    <span style={styles.vozNome}>{nomeVoz(padroes[g])}</span>
                  </span>
                </button>
              ))}
            </div>
            {qtdProprias > 0 && (
              <Botao
                variante="fantasma"
                icone={Users}
                cheio
                onClick={() => setConfirmar(true)}
                style={{
                  marginTop: 12,
                }}
              >
                Aplicar padrões por gênero
              </Botao>
            )}
          </ConfigBloco>
        )}

        {mostrados.map((id, i) => {
          const m = getMascoteSpec(id)
          const genero = m.genero === 'm' ? 'm' : 'f'
          const voiceId = mapa[id]
          const detalhe = voiceId
            ? `Própria: ${nomeVoz(voiceId)}`
            : `Padrão ${GENERO_ROTULO[genero].toLowerCase()}: ${nomeVoz(padroes[genero])}`
          return (
            <ConfigLinha
              key={id}
              icone={null}
              titulo={
                <span style={styles.mascoteTitulo}>
                  <span style={styles.mascoteMini}>
                    <Mascote id={id} tamanho={44} semBrilho />
                  </span>
                  <span style={styles.mascoteTextos}>
                    <span style={styles.mascoteNomeLinha}>
                      <span>{id === atual ? `${m.nome} (seu mascote)` : m.nome}</span>
                      <Tag cor={genero === 'f' ? 'lavanda' : 'ceu'} style={styles.tagGenero}>
                        {GENERO_ROTULO[genero]}
                      </Tag>
                    </span>
                    <span style={styles.mascoteVoz}>
                      {temChave ? detalhe : `Voz ${GENERO_ROTULO[genero].toLowerCase()} do aparelho`}
                    </span>
                  </span>
                </span>
              }
              onClick={() => setFolha(id)}
              ultima={i === mostrados.length - 1}
              ariaLabel={`Voz de ${m.nome}`}
            />
          )
        })}
      </ConfigGrupo>

      <FolhaVoz
        alvo={folha}
        vozes={vozes}
        temChave={temChave}
        mapa={mapa}
        padroes={padroes}
        onCarregar={carregarVozes}
        onFechar={() => {
          setFolha(null)
          pararFala()
        }}
        avisar={avisar}
      />

      <Modal
        aberto={confirmar}
        onFechar={() => setConfirmar(false)}
        titulo="Aplicar padrões por gênero?"
        texto={`As vozes escolhidas para ${qtdProprias} ${qtdProprias === 1 ? 'mascote' : 'mascotes'} serão apagadas. Cada um passa a usar a voz feminina ou masculina padrão.`}
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setConfirmar(false),
          },
          {
            label: 'Aplicar',
            variante: 'primario',
            onClick: aplicarPadroes,
          },
        ]}
      />
    </>
  )
}
function FolhaVoz({ alvo, vozes, temChave, mapa, padroes, onCarregar, onFechar, avisar }) {
  const simples = useModoSimples()
  const [ultimo, setUltimo] = useState(alvo)
  if (alvo && alvo !== ultimo) setUltimo(alvo)
  const atualAlvo = alvo || ultimo
  const generoPadrao =
    typeof atualAlvo === 'string' && atualAlvo.startsWith('padrao:') ? atualAlvo.slice(7) : null
  const id = generoPadrao ? null : atualAlvo
  const m = id ? getMascoteSpec(id) : null
  const genero = generoPadrao || (m?.genero === 'm' ? 'm' : 'f')
  const escolhida = generoPadrao ? padroes[generoPadrao] : id ? mapa[id] : null
  const titulo = generoPadrao
    ? `Voz ${GENERO_ROTULO[generoPadrao].toLowerCase()} padrão`
    : m
      ? `Voz de ${m.nome}`
      : 'Voz'
  const mascoteTopo = generoPadrao ? (generoPadrao === 'f' ? 'kleo' : 'vo') : id
  const carregadas = vozes?.lista || []
  const prontas = VOZES_PADRAO_ELEVEN[genero].filter(v => !carregadas.some(c => c.voice_id === v.voice_id))
  const lista = [
    ...prontas.map(v => ({
      ...v,
      labels: {
        gender: genero === 'f' ? 'female' : 'male',
      },
      preview_url: '',
    })),
    ...carregadas,
  ]
  const [tocando, setTocando] = useState(null)
  const [falando, setFalando] = useState(false)
  const [manual, setManual] = useState('')
  const audio = useRef(null)
  const pararPrevia = () => {
    if (audio.current) {
      audio.current.pause()
      audio.current = null
    }
    setTocando(null)
  }
  useEffect(
    () => () => {
      audio.current?.pause()
    },
    [],
  )
  useEffect(() => {
    if (!alvo) audio.current?.pause()
  }, [alvo])
  const previa = v => {
    if (tocando === v.voice_id) {
      pararPrevia()
      return
    }
    pararPrevia()
    if (!v.preview_url) return
    const a = new Audio(v.preview_url)
    audio.current = a
    setTocando(v.voice_id)
    a.onended = () => setTocando(t => (t === v.voice_id ? null : t))
    a.play().catch(() => setTocando(null))
  }
  const escolher = voiceId => {
    if (generoPadrao) {
      salvarVozPadrao(generoPadrao, voiceId || null)
      avisar?.(
        voiceId
          ? `Voz ${GENERO_ROTULO[generoPadrao].toLowerCase()} padrão escolhida`
          : 'Voz padrão restaurada',
      )
      return
    }
    salvarVozMascote(id, voiceId || null)
    avisar?.(voiceId ? 'Voz escolhida' : `Usando a voz ${GENERO_ROTULO[genero].toLowerCase()} padrão`)
  }
  const testar = async () => {
    pararPrevia()
    setFalando(true)
    try {
      const frase = generoPadrao
        ? 'Olá! Esta é a voz padrão dos mascotes. Estou aqui para te ajudar.'
        : `Olá! Eu sou ${m?.nome || 'a Kleo'}. Estou aqui para te ajudar.`
      await falar(
        frase,
        generoPadrao
          ? {
              forcar: true,
              voiceId: escolhida,
              genero: generoPadrao,
            }
          : {
              forcar: true,
              mascote: id,
            },
      )
    } finally {
      setFalando(false)
    }
  }
  const rotuloReset = generoPadrao
    ? `Voz inicial (${VOZES_PADRAO_ELEVEN[generoPadrao][0].name})`
    : `Padrão ${GENERO_ROTULO[genero].toLowerCase()} (${nomeConhecido(padroes[genero], carregadas) || 'voz escolhida'})`
  const resetAtivo = generoPadrao ? escolhida === PADRAO_INICIAL[generoPadrao] : !escolhida
  return (
    <Sheet
      aberto={!!alvo}
      onFechar={() => {
        pararPrevia()
        onFechar()
      }}
      titulo={titulo}
      altura="88vh"
    >
      {(m || generoPadrao) && (
        <div style={styles.folha}>
          <div style={styles.folhaTopo}>
            <Mascote id={mascoteTopo} tamanho={110} estado={falando ? 'falando' : 'idle'} />
          </div>
          <div style={styles.folhaTags}>
            <Tag cor={genero === 'f' ? 'lavanda' : 'ceu'} icone={UserRound}>
              Voz {GENERO_ROTULO[genero].toLowerCase()}
            </Tag>
          </div>
          <Botao
            variante="primario"
            icone={falando ? Square : Volume2}
            grande
            cheio
            onClick={
              falando
                ? () => {
                    pararFala()
                    setFalando(false)
                  }
                : testar
            }
          >
            {falando ? 'Parar' : 'Testar com a voz'}
          </Botao>

          {temChave && (
            <>
              <button
                type="button"
                className="tap"
                onClick={() => escolher(null)}
                aria-pressed={resetAtivo}
                style={{
                  ...styles.voz,
                  background: resetAtivo ? 'var(--lavanda)' : 'var(--surface)',
                }}
              >
                <span style={styles.vozIcone}>
                  <RotateCcw size={20} aria-hidden="true" />
                </span>
                <span style={styles.vozTextos}>
                  <span style={styles.vozNome}>{rotuloReset}</span>
                </span>
                {resetAtivo && <Check size={22} className="check-pop" aria-hidden="true" />}
              </button>

              {(!vozes || vozes.estado === 'erro') && (
                <Botao variante="lima" icone={Download} cheio onClick={onCarregar}>
                  Ver mais vozes naturais
                </Botao>
              )}
              {vozes?.estado === 'erro' && <p style={styles.erro}>{vozes.erro}</p>}
              {vozes?.estado === 'carregando' &&
                [0, 1, 2].map(i => <div key={i} className="skeleton" style={styles.esqueleto} />)}

              <div className="stagger" style={styles.lista}>
                {lista.map(v => {
                  const ativa = escolhida === v.voice_id
                  return (
                    <div
                      key={v.voice_id}
                      className="anim-up"
                      style={{
                        ...styles.voz,
                        background: ativa ? 'var(--lavanda)' : 'var(--surface)',
                      }}
                    >
                      <button
                        type="button"
                        className="tap"
                        onClick={() => previa(v)}
                        disabled={!v.preview_url}
                        aria-label={
                          tocando === v.voice_id ? `Parar prévia de ${v.name}` : `Ouvir prévia de ${v.name}`
                        }
                        style={{
                          ...styles.vozIcone,
                          background: tocando === v.voice_id ? '#000' : 'var(--surface-2)',
                          color: tocando === v.voice_id ? '#fff' : '#000',
                        }}
                      >
                        {tocando === v.voice_id ? (
                          <Square size={16} fill="currentColor" />
                        ) : (
                          <Play size={18} fill="currentColor" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => escolher(v.voice_id)}
                        aria-pressed={ativa}
                        style={styles.vozEscolher}
                      >
                        <span style={styles.vozTextos}>
                          <span
                            style={{
                              ...styles.vozNome,
                              fontSize: simples ? 18 : 16,
                            }}
                          >
                            {v.name}
                          </span>
                          {descreverVoz(v) && <span style={styles.vozDesc}>{descreverVoz(v)}</span>}
                        </span>
                        {ativa ? (
                          <Check size={22} className="check-pop" aria-hidden="true" />
                        ) : (
                          <span style={styles.radio} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>

              {!simples && (
                <div style={styles.manual}>
                  <Campo
                    rotulo="Ou cole o ID de uma voz"
                    icone={AudioLines}
                    placeholder={escolhida || 'ID da voz no ElevenLabs'}
                    value={manual}
                    onChange={e => setManual(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Botao
                    variante="fantasma"
                    icone={Check}
                    cheio
                    disabled={!manual.trim()}
                    onClick={() => {
                      escolher(manual.trim())
                      setManual('')
                    }}
                  >
                    Usar este ID
                  </Botao>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}
const styles = {
  rotulo: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    paddingLeft: 6,
    marginBottom: 8,
  },
  rotuloIcone: {
    verticalAlign: '-3px',
    marginRight: 4,
  },
  erro: {
    fontSize: 14,
    color: 'var(--erro)',
    lineHeight: 1.4,
    marginTop: 10,
    overflowWrap: 'anywhere',
  },
  modelos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modelo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    minHeight: 52,
    padding: '8px 10px 8px 18px',
    borderRadius: 'var(--r-btn)',
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'left',
    transition: 'background .25s ease, color .25s ease',
  },
  mascoteTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  mascoteMini: {
    width: 48,
    height: 48,
    borderRadius: '30%',
    background: 'var(--surface-2)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascoteTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  mascoteVoz: {
    fontSize: 14,
    fontWeight: 400,
    color: 'var(--text-2)',
  },
  mascoteNomeLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagGenero: {
    fontSize: 12,
    padding: '2px 10px',
    minHeight: 0,
  },
  ajudaPadrao: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.4,
    padding: '0 6px',
    marginBottom: 10,
  },
  padroes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
  },
  padrao: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px 10px 10px',
    borderRadius: 22,
    color: '#000',
    textAlign: 'left',
    minHeight: 64,
    boxShadow: 'var(--sombra)',
    minWidth: 0,
  },
  padraoIcone: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padraoRotulo: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-2)',
  },
  folhaTags: {
    display: 'flex',
    justifyContent: 'center',
  },
  folha: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 8,
  },
  folhaTopo: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0 4px',
    background: 'var(--lavanda)',
    borderRadius: 'var(--r-card-m)',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  voz: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 14px 8px 8px',
    borderRadius: 22,
    boxShadow: 'var(--sombra)',
    width: '100%',
    color: '#000',
    textAlign: 'left',
    minHeight: 60,
    transition: 'background .25s ease',
  },
  vozIcone: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--surface-2)',
  },
  vozEscolher: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'transparent',
    textAlign: 'left',
    color: '#000',
    minHeight: 44,
  },
  vozTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  vozNome: {
    fontSize: 16,
    fontWeight: 600,
  },
  vozDesc: {
    fontSize: 13,
    color: 'var(--text-2)',
    overflowWrap: 'anywhere',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid var(--border)',
    flexShrink: 0,
  },
  manual: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  esqueleto: {
    height: 60,
    borderRadius: 22,
  },
}
