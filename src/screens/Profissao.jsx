import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Plus,
  PackagePlus,
  MessageCircle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Check,
  Puzzle,
  BriefcaseBusiness,
  LayoutGrid,
  UserPlus,
} from 'lucide-react'
import Tela from '../components/Tela'
import Mascote from '../components/Mascote'
import { Card, Botao, BotaoIcone, Chip, Tag, Sheet, Modal, TituloSecao, Vazio, Campo } from '../components/ui'
import { Ferramenta, infoFerramenta } from '../ferramentas'
import Especialista from '../components/profissao/Especialista'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { getProfissao, getCategoria, profissoesDoUsuario, buscarProfissoes } from '../data/profissoes'
const CORES_CARD = ['branco', 'lavanda', 'lima', 'ceu']
const QTD_SIMPLES = 3
const chaveDe = (profId, ferramentaId, indice) => `${profId}-${ferramentaId}-${indice}`
function instanciasDa(prof) {
  return (prof?.ferramentas || [])
    .map((f, i) => ({
      ref: String(i),
      id: f.id,
      config: f.config || {},
      chave: chaveDe(prof.id, f.id, i),
      origem: prof.id,
    }))
    .filter(t => infoFerramenta(t.id, t.config))
}
export default function Profissao() {
  const navigate = useNavigate()
  const { id: idRota } = useParams()
  const [params, setParams] = useSearchParams()
  const simples = useModoSimples()
  const [profile, setProfile] = useStorage('kleo_profile', null)
  const [extrasBrutas, setExtras] = useStorage('kleo_ferramentas_extras', [])
  const [verTodas, setVerTodas] = useState(false)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [remover, setRemover] = useState(null)
  const minhas = useMemo(() => profissoesDoUsuario(profile), [profile])
  const principal = minhas[0]
  const prof = idRota ? getProfissao(idRota) : principal
  const ehMinha = minhas.some(p => p.id === prof.id)
  const categoria = getCategoria(prof.categoria)
  const vendoExtras = params.get('aba') === 'extras'
  const extras = useMemo(
    () =>
      (Array.isArray(extrasBrutas) ? extrasBrutas : [])
        .filter(e => e && e.id && e.chave && infoFerramenta(e.id, e.config))
        .map(e => ({
          ref: 'x-' + e.chave,
          id: e.id,
          config: e.config || {},
          chave: e.chave,
          origem: e.origem,
          extra: true,
        })),
    [extrasBrutas],
  )
  const daProfissao = useMemo(() => instanciasDa(prof), [prof])
  const lista = vendoExtras ? extras : daProfissao
  const refAberta = params.get('f')
  const aberta = refAberta ? [...daProfissao, ...extras].find(t => t.ref === refAberta) : null
  function abrirFerramenta(t) {
    const p = new URLSearchParams(params)
    p.set('f', t.ref)
    setParams(p)
  }
  function fecharFerramenta() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else {
      const p = new URLSearchParams(params)
      p.delete('f')
      setParams(p, {
        replace: true,
      })
    }
  }
  function irPara(p) {
    setVerTodas(false)
    navigate(p.id === principal.id ? '/profissao' : `/profissao/${p.id}`, {
      replace: true,
    })
  }
  function irParaExtras() {
    setVerTodas(false)
    setParams(
      {
        aba: 'extras',
      },
      {
        replace: true,
      },
    )
  }
  function adicionarAsMinhas() {
    setProfile(p => ({
      ...(p || {}),
      profissoesExtras: [...new Set([...(p?.profissoesExtras || []), prof.id])],
    }))
  }
  function confirmarRemocao() {
    if (!remover) return
    setExtras(l => (Array.isArray(l) ? l.filter(e => e.chave !== remover.chave) : []))
    setRemover(null)
  }
  if (aberta) {
    const info = infoFerramenta(aberta.id, aberta.config)
    const Icone = info.icone
    const origem = getProfissao(aberta.origem)
    return (
      <Tela>
        <div key={aberta.ref} className="anim-right">
          <div style={styles.abertaTopo}>
            <Botao variante="fantasma" icone={ChevronLeft} onClick={fecharFerramenta} style={styles.voltar}>
              Voltar
            </Botao>
            {aberta.extra && origem && (
              <Tag cor="lavanda" icone={origem.icone}>
                {origem.label}
              </Tag>
            )}
          </div>
          <div style={styles.abertaCabecalho}>
            <span className="anim-pop" style={styles.abertaIcone}>
              <Icone size={26} color="#000" strokeWidth={2} aria-hidden="true" />
            </span>
            <h1
              style={{
                ...styles.abertaTitulo,
                fontSize: simples ? 34 : 36,
              }}
            >
              {info.nome}
            </h1>
          </div>
          {!simples && info.descricao && <p style={styles.abertaDescricao}>{info.descricao}</p>}
          <div className="anim-up" style={styles.abertaCorpo}>
            <Ferramenta
              id={aberta.id}
              config={aberta.config}
              profissao={origem || prof}
              chave={aberta.chave}
            />
          </div>
        </div>
      </Tela>
    )
  }
  const visiveis = simples && !verTodas ? lista.slice(0, QTD_SIMPLES) : lista
  const atalhos = (prof.atalhos || []).slice(0, simples ? 3 : 6)
  const mostrarAbas = !simples || minhas.length > 1 || extras.length > 0 || !ehMinha
  return (
    <Tela>
      {mostrarAbas && (
        <div style={styles.abas} role="tablist" aria-label="Minhas profissões" className="anim-fade">
          {minhas.map(p => (
            <Chip
              key={p.id}
              icone={p.icone}
              cor="branco"
              ativo={!vendoExtras && p.id === prof.id}
              onClick={() => irPara(p)}
            >
              {p.label}
            </Chip>
          ))}
          {!ehMinha && (
            <Chip
              icone={prof.icone}
              cor="branco"
              ativo={!vendoExtras}
              onClick={() =>
                setParams(
                  {},
                  {
                    replace: true,
                  },
                )
              }
            >
              {prof.label}
            </Chip>
          )}
          {(extras.length > 0 || !simples) && (
            <Chip icone={Puzzle} cor="lavanda" ativo={vendoExtras} onClick={irParaExtras}>
              Minhas extras{extras.length > 0 ? ` (${extras.length})` : ''}
            </Chip>
          )}
        </div>
      )}

      <div key={vendoExtras ? 'extras' : prof.id} className="anim-tab">
        {vendoExtras ? (
          <Card cor="lavanda" tamanho="g" style={styles.hero}>
            <div style={styles.heroLinha}>
              <div style={styles.heroMascote}>
                <Mascote tamanho={simples ? 96 : 108} />
              </div>
              <div style={styles.heroTexto}>
                <Tag cor="branco" icone={Puzzle}>
                  Coleção pessoal
                </Tag>
                <h1
                  style={{
                    ...styles.heroTitulo,
                    fontSize: simples ? 32 : 34,
                  }}
                >
                  Minhas extras
                </h1>
              </div>
            </div>
            <p style={styles.heroDica}>Ferramentas que você pegou de outras profissões.</p>
          </Card>
        ) : (
          <Card cor={categoria.cor || 'lavanda'} tamanho="g" style={styles.hero}>
            <div style={styles.heroLinha}>
              <div style={styles.heroMascote}>
                <Mascote id={prof.id} tamanho={simples ? 100 : 112} />
              </div>
              <div style={styles.heroTexto}>
                <Tag cor="branco" icone={categoria.icone}>
                  {simples ? 'Meu trabalho' : categoria.nome}
                </Tag>
                <h1
                  style={{
                    ...styles.heroTitulo,
                    fontSize: simples
                      ? prof.label.length > 22
                        ? 26
                        : 32
                      : prof.label.length > 26
                        ? 24
                        : prof.label.length > 18
                          ? 28
                          : 34,
                  }}
                >
                  {prof.label}
                </h1>
                {!simples && prof.mascote?.nome && (
                  <p style={styles.heroMascoteNome}>Com {prof.mascote.nome}</p>
                )}
              </div>
            </div>
            {prof.dica && (
              <p
                style={{
                  ...styles.heroDica,
                  fontSize: simples ? 18 : 16,
                }}
              >
                {prof.dica}
              </p>
            )}
          </Card>
        )}

        {!vendoExtras && !ehMinha && (
          <Card cor="branco" className="anim-up" style={styles.visita}>
            <p style={styles.visitaTexto}>Você está vendo as ferramentas de {prof.label}.</p>
            <Botao variante="lima" icone={UserPlus} onClick={adicionarAsMinhas}>
              Adicionar às minhas profissões
            </Botao>
          </Card>
        )}

        {!vendoExtras && <Especialista prof={prof} />}

        <TituloSecao
          acao={!simples && lista.length > 0 ? <span style={styles.contagem}>{lista.length}</span> : null}
        >
          {simples ? 'O que você precisa?' : 'Ferramentas'}
        </TituloSecao>

        {lista.length === 0 ? (
          <Vazio
            icone={vendoExtras ? Puzzle : LayoutGrid}
            titulo={vendoExtras ? 'Nenhuma extra ainda' : 'Sem ferramentas'}
            texto={
              vendoExtras
                ? 'Pegue ferramentas de outras profissões, como uma calculadora ou um checklist.'
                : 'Esta profissão ainda não tem ferramentas.'
            }
            acao={{
              label: 'Adicionar ferramentas',
              icone: PackagePlus,
              onClick: () => setSheetAberto(true),
            }}
          />
        ) : simples ? (
          <div className="stagger" style={styles.coluna}>
            {visiveis.map((t, i) => {
              const info = infoFerramenta(t.id, t.config)
              const Icone = info.icone
              return (
                <Card
                  key={t.ref}
                  cor={CORES_CARD[(i + 1) % CORES_CARD.length]}
                  onClick={() => abrirFerramenta(t)}
                  style={styles.linhaGrande}
                >
                  <span style={styles.linhaGrandeConteudo}>
                    <span style={styles.iconeGrande}>
                      <Icone size={28} color="#000" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span style={styles.linhaGrandeNome}>{info.nome}</span>
                    <ChevronRight size={26} color="#000" aria-hidden="true" />
                  </span>
                </Card>
              )
            })}
            {lista.length > QTD_SIMPLES && (
              <Botao
                variante="fantasma"
                cheio
                icone={verTodas ? undefined : LayoutGrid}
                onClick={() => setVerTodas(v => !v)}
              >
                {verTodas ? 'Mostrar menos' : `Ver todas (${lista.length})`}
              </Botao>
            )}
          </div>
        ) : (
          <div className="stagger" style={styles.grade}>
            {visiveis.map((t, i) => {
              const info = infoFerramenta(t.id, t.config)
              const Icone = info.icone
              const origem = t.extra ? getProfissao(t.origem) : null
              const cor = CORES_CARD[i % CORES_CARD.length]
              return (
                <div key={t.ref} style={styles.celula}>
                  <Card
                    cor={cor}
                    onClick={() => abrirFerramenta(t)}
                    style={styles.cardFerramenta}
                    aria-label={`Abrir ${info.nome}`}
                  >
                    <span
                      style={{
                        ...styles.iconeFerramenta,
                        background: cor === 'branco' ? 'var(--lavanda)' : 'var(--surface)',
                      }}
                    >
                      <Icone size={22} color="#000" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span style={styles.nomeFerramenta}>{info.nome}</span>
                    <span style={styles.descFerramenta}>
                      {origem ? `De ${origem.label}` : info.descricao}
                    </span>
                  </Card>
                  {t.extra && (
                    <BotaoIcone
                      icone={Trash2}
                      label={`Remover ${info.nome}`}
                      onClick={() =>
                        setRemover({
                          ...t,
                          nome: info.nome,
                        })
                      }
                      style={styles.removerExtra}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!vendoExtras && atalhos.length > 0 && (
          <>
            <TituloSecao>Perguntar à Kleo</TituloSecao>
            <Card cor="branco" style={styles.atalhos}>
              {atalhos.map((a, i) => (
                <button
                  key={a}
                  type="button"
                  className="tap"
                  onClick={() => navigate('/chat?q=' + encodeURIComponent(a))}
                  style={{
                    ...styles.atalho,
                    minHeight: simples ? 68 : 58,
                    borderTop: i ? '1px solid var(--surface-2)' : 'none',
                  }}
                >
                  <span style={styles.atalhoIcone}>
                    <MessageCircle size={18} color="#000" aria-hidden="true" />
                  </span>
                  <span
                    style={{
                      ...styles.atalhoTexto,
                      fontSize: simples ? 18 : 16,
                    }}
                  >
                    {a}
                  </span>
                  <ArrowUpRight
                    size={20}
                    color="var(--text-3)"
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                    }}
                  />
                </button>
              ))}
            </Card>
          </>
        )}

        <div style={styles.acoesFim}>
          {!simples && lista.length > 0 && (
            <Botao
              variante="fantasma"
              cheio
              icone={PackagePlus}
              onClick={() => setSheetAberto(true)}
              style={styles.botaoQuebra}
            >
              Adicionar ferramentas de outras profissões
            </Botao>
          )}
          <Botao
            variante={simples ? 'fantasma' : 'primario'}
            cheio
            icone={Plus}
            onClick={() => navigate('/configuracoes?secao=profissoes')}
          >
            Adicionar profissão
          </Botao>
        </div>
      </div>

      <SheetAdicionar
        aberto={sheetAberto}
        onFechar={() => setSheetAberto(false)}
        extras={Array.isArray(extrasBrutas) ? extrasBrutas : []}
        setExtras={setExtras}
        minhas={minhas}
      />

      <Modal
        aberto={!!remover}
        onFechar={() => setRemover(null)}
        titulo={remover ? `Remover ${remover.nome}?` : ''}
        texto="Ela sai das suas extras. Você pode adicionar de novo quando quiser."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setRemover(null),
          },
          {
            label: 'Remover',
            variante: 'perigo',
            onClick: confirmarRemocao,
          },
        ]}
      />
    </Tela>
  )
}
function SheetAdicionar({ aberto, onFechar, extras, setExtras, minhas }) {
  const [busca, setBusca] = useState('')
  const [profId, setProfId] = useState(null)
  const [recemAdicionada, setRecemAdicionada] = useState(null)
  const resultados = useMemo(() => buscarProfissoes(busca), [busca])
  const escolhida = profId ? getProfissao(profId) : null
  const fechar = () => {
    onFechar()
    setTimeout(() => {
      setProfId(null)
      setBusca('')
    }, 300)
  }
  function adicionar(t) {
    setExtras(l => {
      const atual = Array.isArray(l) ? l : []
      if (atual.some(e => e.chave === t.chave)) return atual
      return [
        ...atual,
        {
          id: t.id,
          config: t.config,
          origem: t.origem,
          chave: t.chave,
        },
      ]
    })
    setRecemAdicionada(t.chave)
  }
  function tirar(t) {
    setExtras(l => (Array.isArray(l) ? l.filter(e => e.chave !== t.chave) : []))
  }
  return (
    <Sheet
      aberto={aberto}
      onFechar={fechar}
      titulo={escolhida ? escolhida.label : 'Adicionar ferramentas'}
      altura="85vh"
    >
      {escolhida ? (
        <div key={escolhida.id} className="anim-right">
          <div style={styles.sheetTopo}>
            <Botao variante="fantasma" icone={ChevronLeft} onClick={() => setProfId(null)}>
              Outras profissões
            </Botao>
          </div>
          <div className="stagger" style={styles.coluna}>
            {instanciasDa(escolhida).map(t => {
              const info = infoFerramenta(t.id, t.config)
              const Icone = info.icone
              const ehSua = minhas.some(p => p.id === escolhida.id)
              const ja = extras.some(e => e.chave === t.chave)
              return (
                <Card key={t.chave} cor={ja ? 'lima' : 'branco'} style={styles.linhaAdd}>
                  <span style={styles.iconeAdd}>
                    <Icone size={21} color="#000" aria-hidden="true" />
                  </span>
                  <span style={styles.textoAdd}>
                    <span style={styles.nomeAdd}>{info.nome}</span>
                    <span style={styles.descAdd}>{info.descricao}</span>
                  </span>
                  {ehSua ? (
                    <Tag cor="mist">Já é sua</Tag>
                  ) : ja ? (
                    <button
                      type="button"
                      onClick={() => tirar(t)}
                      aria-label={`Tirar ${info.nome} das extras`}
                      style={styles.adicionado}
                    >
                      <span
                        key={recemAdicionada === t.chave ? 'novo' : 'ok'}
                        className="check-pop"
                        style={{
                          display: 'flex',
                        }}
                      >
                        <Check size={20} color="var(--lima)" strokeWidth={3} aria-hidden="true" />
                      </span>
                    </button>
                  ) : (
                    <BotaoIcone
                      icone={Plus}
                      variante="preto"
                      label={`Adicionar ${info.nome}`}
                      onClick={() => adicionar(t)}
                    />
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="anim-fade">
          <Campo
            icone={Search}
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar profissão (ex.: eletricista)"
            aria-label="Buscar profissão"
          />
          {resultados.length === 0 && <p style={styles.semResultado}>Nenhuma profissão encontrada.</p>}
          <div
            style={{
              ...styles.coluna,
              marginTop: 14,
            }}
          >
            {resultados.map(p => {
              const cat = getCategoria(p.categoria)
              const Icone = p.icone || BriefcaseBusiness
              return (
                <button
                  key={p.id}
                  type="button"
                  className="tap"
                  onClick={() => setProfId(p.id)}
                  style={styles.linhaProf}
                >
                  <span
                    style={{
                      ...styles.iconeProf,
                      background: cat.cor === 'mist' ? 'var(--surface-2)' : `var(--${cat.cor})`,
                    }}
                  >
                    <Icone size={20} color="#000" aria-hidden="true" />
                  </span>
                  <span style={styles.textoAdd}>
                    <span style={styles.nomeAdd}>{p.label}</span>
                    <span style={styles.descAdd}>{(p.ferramentas || []).length} ferramentas</span>
                  </span>
                  <ChevronRight size={20} color="var(--text-3)" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Sheet>
  )
}
const styles = {
  abas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    margin: '0 0 14px',
    padding: '4px 0 8px',
  },
  hero: {
    overflow: 'hidden',
  },
  heroLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  heroMascote: {
    flexShrink: 0,
    margin: '-8px 0 -12px -10px',
  },
  heroTexto: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  heroTitulo: {
    fontWeight: 800,
    lineHeight: 1.02,
    color: '#000',
    overflowWrap: 'break-word',
    hyphens: 'auto',
    WebkitHyphens: 'auto',
  },
  heroMascoteNome: {
    fontSize: 14,
    color: 'var(--text-2)',
    fontWeight: 600,
  },
  heroDica: {
    marginTop: 14,
    color: '#000',
    lineHeight: 1.4,
  },
  visita: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'flex-start',
  },
  visitaTexto: {
    fontSize: 16,
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  contagem: {
    minWidth: 32,
    height: 32,
    padding: '0 10px',
    borderRadius: 'var(--r-badge)',
    background: '#000',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
  },
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  celula: {
    position: 'relative',
    display: 'flex',
    minWidth: 0,
  },
  cardFerramenta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    minHeight: 168,
    padding: 18,
  },
  iconeFerramenta: {
    width: 46,
    height: 46,
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nomeFerramenta: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.15,
    color: '#000',
    overflowWrap: 'anywhere',
  },
  descFerramenta: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  removerExtra: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  linhaGrande: {
    padding: 18,
  },
  linhaGrandeConteudo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    minHeight: 64,
  },
  iconeGrande: {
    width: 60,
    height: 60,
    borderRadius: '30%',
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaGrandeNome: {
    flex: 1,
    minWidth: 0,
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.15,
    color: '#000',
  },
  atalhos: {
    padding: '6px 8px',
  },
  atalho: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 10px',
    textAlign: 'left',
  },
  atalhoIcone: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoTexto: {
    flex: 1,
    minWidth: 0,
    color: '#000',
    lineHeight: 1.3,
  },
  acoesFim: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 24,
  },
  botaoQuebra: {
    whiteSpace: 'normal',
    textAlign: 'center',
  },
  abertaTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  voltar: {
    paddingLeft: 14,
  },
  abertaCabecalho: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  abertaIcone: {
    width: 54,
    height: 54,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--sombra)',
  },
  abertaTitulo: {
    fontWeight: 800,
    lineHeight: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  abertaDescricao: {
    fontSize: 16,
    color: 'var(--text-2)',
    marginTop: 10,
    lineHeight: 1.4,
  },
  abertaCorpo: {
    marginTop: 18,
    animationDelay: '0.08s',
  },
  sheetTopo: {
    marginBottom: 14,
  },
  linhaAdd: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconeAdd: {
    width: 42,
    height: 42,
    borderRadius: '30%',
    background: 'var(--surface-2)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAdd: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nomeAdd: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000',
  },
  descAdd: {
    fontSize: 13,
    color: 'var(--text-2)',
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  adicionado: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaProf: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px 10px 10px',
    textAlign: 'left',
    background: 'var(--surface)',
    borderRadius: 'var(--r-nav)',
    minHeight: 60,
  },
  iconeProf: {
    width: 42,
    height: 42,
    borderRadius: '30%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semResultado: {
    fontSize: 15,
    color: 'var(--text-3)',
    textAlign: 'center',
    padding: '20px 0',
  },
}
