import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Clock,
  Users,
  Gauge,
  ChefHat,
  ShoppingCart,
  Heart,
  Play,
  Lightbulb,
  Check,
  KeyRound,
  Trash2,
  Volume2,
  Loader2,
} from 'lucide-react'
import useStorage from '../../hooks/useStorage'
import useSaida from '../../hooks/useSaida'
import useRemocao from './useRemocao'
import { perguntarGroq, temChaveGroq, mensagemErro } from '../../lib/ia'
import { adicionarItemLista } from '../../lib/storage'
import { falar } from '../../lib/voz'
import { RECEITAS_EXEMPLO, SUGESTOES_RECEITA } from '../../data/receitasExemplo'
import { Card, Rotulo, Pill, Chip, Redondo, Vazio } from './ui'
import ModoCozinhar from './ModoCozinhar'
import { alvo } from './util'
const INSTRUCAO_JSON = `Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, sem markdown, no formato:
{"nome":"","tempo":"","porcoes":"","dificuldade":"Fácil|Média|Difícil","ingredientes":["quantidade e ingrediente"],"passos":["passo claro e curto"],"dica":""}
Use medidas caseiras brasileiras. Passos curtos e objetivos, citando o tempo em minutos quando houver. Não use comandos especiais.`
function extrairJSON(texto) {
  const inicio = texto.indexOf('{')
  if (inicio < 0) return null
  let nivel = 0
  let emString = false
  let escape = false
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i]
    if (emString) {
      if (escape) escape = false
      else if (c === '\\') escape = true
      else if (c === '"') emString = false
      continue
    }
    if (c === '"') emString = true
    else if (c === '{') nivel++
    else if (c === '}' && --nivel === 0) {
      try {
        return JSON.parse(texto.slice(inicio, i + 1))
      } catch {
        break
      }
    }
  }
  try {
    return JSON.parse(texto.slice(inicio, texto.lastIndexOf('}') + 1))
  } catch {
    return null
  }
}
function normalizar(r) {
  if (!r || typeof r !== 'object') return null
  const lista = v =>
    Array.isArray(v)
      ? v.map(x => (typeof x === 'string' ? x : x?.texto || x?.nome || JSON.stringify(x))).filter(Boolean)
      : []
  const receita = {
    nome: String(r.nome || 'Receita'),
    tempo: r.tempo ? String(r.tempo) : '',
    porcoes: r.porcoes ? String(r.porcoes) : '',
    dificuldade: r.dificuldade ? String(r.dificuldade) : '',
    ingredientes: lista(r.ingredientes),
    passos: lista(r.passos),
    dica: r.dica ? String(r.dica) : '',
  }
  return receita.passos.length ? receita : null
}
export default function Receitas({ necessidade }) {
  const navigate = useNavigate()
  const [favoritas, setFavoritas] = useStorage('kleo_receitas', [])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [receita, setReceita] = useState(null)
  const [marcados, setMarcados] = useState({})
  const [cozinhando, setCozinhando] = useState(false)
  const [aviso, setAviso] = useState('')
  const temChave = temChaveGroq()
  const h = alvo(necessidade)
  const lista = Array.isArray(favoritas) ? favoritas : []
  const ehFavorita = receita && lista.some(f => f.nome === receita.nome)
  const abrir = r => {
    setReceita(r)
    setMarcados({})
    setAviso('')
    setErro('')
    if (necessidade === 'visual') {
      falar(
        `${r.nome}. ${r.tempo ? 'Tempo: ' + r.tempo + '.' : ''} ${r.ingredientes.length} ingredientes e ${r.passos.length} passos. Toque em modo cozinhar para começar.`,
        {
          forcar: true,
        },
      )
    }
  }
  const buscar = async termo => {
    const q = (termo ?? busca).trim()
    if (!q || carregando) return
    setBusca(q)
    setErro('')
    setCarregando(true)
    setReceita(null)
    try {
      const bruto = await perguntarGroq(
        [
          {
            role: 'user',
            content: `Receita de: ${q}`,
          },
        ],
        {
          extraSystem: INSTRUCAO_JSON,
          temperatura: 0.5,
          maxTokens: 1500,
        },
      )
      const r = normalizar(extrairJSON(bruto))
      if (!r) throw new Error('FORMATO')
      abrir(r)
    } catch (e) {
      setErro(
        e.message === 'FORMATO'
          ? 'Não consegui montar essa receita. Tente descrever de outro jeito.'
          : mensagemErro(e),
      )
    } finally {
      setCarregando(false)
    }
  }
  const adicionarLista = () => {
    const itens = receita.ingredientes.filter((_, i) => !marcados[i])
    let nome = 'Mercado'
    itens.forEach(t => {
      nome = adicionarItemLista('Mercado', t)
    })
    const msg = `${itens.length} ${itens.length === 1 ? 'ingrediente adicionado' : 'ingredientes adicionados'} à lista ${nome}.`
    setAviso(msg)
    if (necessidade === 'visual')
      falar(msg, {
        forcar: true,
      })
  }
  const alternarFavorita = () => {
    setFavoritas(atual => {
      const l = Array.isArray(atual) ? atual : []
      return l.some(f => f.nome === receita.nome)
        ? l.filter(f => f.nome !== receita.nome)
        : [
            {
              ...receita,
              id: Date.now(),
              salvaEm: new Date().toISOString(),
            },
            ...l,
          ]
    })
  }
  const { saindo: favSaindo, remover: removerFavorita } = useRemocao(id =>
    setFavoritas(atual => (atual || []).filter(f => f.id !== id)),
  )
  const { montado: cozinharMontado, saindo: cozinharSaindo } = useSaida(cozinhando && !!receita)
  return (
    <div style={styles.col}>
      <form
        onSubmit={e => {
          e.preventDefault()
          buscar()
        }}
        style={{
          ...styles.busca,
          minHeight: h + 8,
        }}
        role="search"
      >
        <Search size={20} color="var(--steel)" aria-hidden="true" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="O que vamos cozinhar?"
          aria-label="O que vamos cozinhar?"
          style={styles.buscaInput}
          disabled={!temChave}
        />
        {temChave && (
          <Pill
            altura={h - 6}
            disabled={!busca.trim() || carregando}
            type="submit"
            style={{
              padding: '0 16px',
            }}
          >
            Buscar
          </Pill>
        )}
      </form>

      {temChave ? (
        <div style={styles.chips} className="prof-cascata">
          {SUGESTOES_RECEITA.map(s => (
            <Chip key={s} altura={h - 4} onClick={() => buscar(s)} ativo={busca === s && carregando}>
              {s}
            </Chip>
          ))}
        </div>
      ) : (
        <Card style={styles.semChave}>
          <div style={styles.semChaveTopo}>
            <div style={styles.iconeSoft}>
              <KeyRound size={20} color="var(--kleo)" />
            </div>
            <div
              style={{
                flex: 1,
              }}
            >
              <p style={styles.semChaveTitulo}>Ative as receitas com IA</p>
              <p style={styles.semChaveTexto}>
                A IA da Kleo não está disponível agora. Em Ajustes, ligue a IA da Kleo ou adicione uma chave
                grátis para pedir qualquer receita. Enquanto isso, experimente as receitas de exemplo abaixo.
              </p>
            </div>
          </div>
          <Pill variante="suave" altura={h} onClick={() => navigate('/configuracoes?secao=ia')} cheio>
            Abrir Ajustes
          </Pill>
        </Card>
      )}

      {carregando && (
        <Card style={styles.carregandoCard} aria-live="polite">
          <div style={styles.carregando}>
            <Loader2
              size={22}
              color="var(--kleo)"
              style={{
                animation: 'kleoProfSpin 1s linear infinite',
              }}
            />
            <span>Preparando a receita de {busca}...</span>
          </div>

          <div
            className="skeleton"
            style={{
              height: 28,
              width: '62%',
            }}
            aria-hidden="true"
          />
          <div
            className="skeleton"
            style={{
              height: 14,
              width: '40%',
            }}
            aria-hidden="true"
          />
          <div
            className="skeleton"
            style={{
              height: 44,
              width: '100%',
              borderRadius: 980,
            }}
            aria-hidden="true"
          />
          <div
            className="skeleton"
            style={{
              height: 14,
              width: '85%',
            }}
            aria-hidden="true"
          />
          <div
            className="skeleton"
            style={{
              height: 14,
              width: '70%',
            }}
            aria-hidden="true"
          />
        </Card>
      )}

      {erro && (
        <p key={erro} className="shake" style={styles.erro} role="alert">
          {erro}
        </p>
      )}

      {receita && (
        <Card
          key={receita.nome}
          style={{
            padding: 0,
            overflow: 'hidden',
          }}
          aria-label={`Receita ${receita.nome}`}
        >
          <div style={styles.receitaTopo}>
            <div
              className="anim-pop"
              style={{
                ...styles.receitaIcone,
                animationDelay: '0.1s',
              }}
            >
              <ChefHat size={26} color="var(--orange)" />
            </div>
            <h2 style={styles.receitaNome}>{receita.nome}</h2>
            <div style={styles.metas} className="stagger">
              {receita.tempo && (
                <span style={styles.meta}>
                  <Clock size={15} /> {receita.tempo}
                </span>
              )}
              {receita.porcoes && (
                <span style={styles.meta}>
                  <Users size={15} /> {receita.porcoes}
                </span>
              )}
              {receita.dificuldade && (
                <span style={styles.meta}>
                  <Gauge size={15} /> {receita.dificuldade}
                </span>
              )}
            </div>
            <div style={styles.acoesReceita}>
              <Pill
                icon={Play}
                altura={h + 4}
                onClick={() => setCozinhando(true)}
                style={{
                  flex: 1,
                }}
              >
                Modo cozinhar
              </Pill>
              <Redondo
                icon={Heart}
                className={ehFavorita ? 'check-pop' : ''}
                tamanho={h + 4}
                label={ehFavorita ? 'Remover das favoritas' : 'Salvar nas favoritas'}
                onClick={alternarFavorita}
                cor={ehFavorita ? 'var(--red)' : 'var(--polar)'}
                fundo={ehFavorita ? 'rgba(255,59,48,0.15)' : 'var(--control)'}
              />
              <Redondo
                icon={Volume2}
                tamanho={h + 4}
                label="Ouvir ingredientes"
                onClick={() =>
                  falar(`Ingredientes: ${receita.ingredientes.join('. ')}`, {
                    forcar: true,
                  })
                }
              />
            </div>
          </div>

          <div style={styles.secao}>
            <Rotulo>Ingredientes ({receita.ingredientes.length})</Rotulo>
            <p style={styles.ajuda}>Marque o que você já tem em casa.</p>

            <div className="stagger">
              {receita.ingredientes.map((ing, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setMarcados(m => ({
                      ...m,
                      [i]: !m[i],
                    }))
                  }
                  style={{
                    ...styles.ingrediente,
                    minHeight: h,
                  }}
                  aria-pressed={!!marcados[i]}
                >
                  <span
                    className={marcados[i] ? 'check-pop' : undefined}
                    style={{
                      ...styles.check,
                      background: marcados[i] ? 'var(--green)' : 'transparent',
                      borderColor: marcados[i] ? 'var(--green)' : 'var(--divider)',
                    }}
                  >
                    {marcados[i] && <Check size={14} color="#000" strokeWidth={3} />}
                  </span>
                  <span
                    style={{
                      textDecoration: marcados[i] ? 'line-through' : 'none',
                      color: marcados[i] ? 'var(--steel)' : 'var(--polar)',
                      transition: 'color .25s ease',
                    }}
                  >
                    {ing}
                  </span>
                </button>
              ))}
            </div>
            <Pill
              icon={ShoppingCart}
              variante="secundario"
              altura={h}
              cheio
              onClick={adicionarLista}
              style={{
                marginTop: 12,
              }}
            >
              Adicionar ingredientes à lista
            </Pill>
            {aviso && (
              <p key={aviso} className="anim-pop" style={styles.aviso} role="status">
                <Check size={15} /> {aviso}
              </p>
            )}
          </div>

          <div style={styles.secao}>
            <Rotulo>Modo de preparo</Rotulo>
            <div className="stagger">
              {receita.passos.map((p, i) => (
                <div key={i} style={styles.passo}>
                  <span style={styles.passoNum}>{i + 1}</span>
                  <p style={styles.passoTexto}>{p}</p>
                </div>
              ))}
            </div>
          </div>

          {receita.dica && (
            <div
              style={{
                ...styles.secao,
                paddingBottom: 22,
              }}
            >
              <div style={styles.dica} className="anim-scale">
                <Lightbulb
                  size={18}
                  color="var(--orange)"
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <p>
                  <strong
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    Dica da Kleo:{' '}
                  </strong>
                  {receita.dica}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {!temChave && !receita && (
        <div>
          <Rotulo>Receitas de exemplo</Rotulo>
          <div style={styles.col} className="prof-cascata">
            {RECEITAS_EXEMPLO.map(r => (
              <ItemReceita key={r.nome} r={r} h={h} onAbrir={() => abrir(r)} />
            ))}
          </div>
        </div>
      )}
      {!temChave && receita && (
        <Pill variante="secundario" altura={h} onClick={() => setReceita(null)}>
          Ver outras receitas de exemplo
        </Pill>
      )}

      <div>
        <Rotulo>Receitas favoritas</Rotulo>
        {lista.length === 0 ? (
          <Card>
            <Vazio
              icon={Heart}
              titulo="Nenhuma favorita ainda"
              texto="Toque no coração de uma receita para guardá-la aqui."
            />
          </Card>
        ) : (
          <div style={styles.col} className="prof-cascata">
            {lista.map(r => (
              <ItemReceita
                key={r.id}
                r={r}
                h={h}
                saindo={favSaindo(r.id)}
                onAbrir={() => abrir(r)}
                onRemover={() => removerFavorita(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {cozinharMontado && receita && (
        <ModoCozinhar
          receita={receita}
          necessidade={necessidade}
          saindo={cozinharSaindo}
          onFechar={() => setCozinhando(false)}
        />
      )}
    </div>
  )
}
function ItemReceita({ r, h, onAbrir, onRemover, saindo = false }) {
  return (
    <div
      className={saindo ? 'item-out' : undefined}
      style={{
        ...styles.item,
        minHeight: h + 20,
      }}
    >
      <button
        onClick={onAbrir}
        className="prof-press"
        style={styles.itemBotao}
        aria-label={`Abrir receita ${r.nome}`}
      >
        <div style={styles.itemIcone}>
          <ChefHat size={20} color="var(--orange)" />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
          }}
        >
          <p style={styles.itemNome}>{r.nome}</p>
          <p style={styles.itemMeta}>{[r.tempo, r.porcoes, r.dificuldade].filter(Boolean).join(' · ')}</p>
        </div>
      </button>
      {onRemover && (
        <Redondo
          icon={Trash2}
          label={`Remover ${r.nome}`}
          onClick={onRemover}
          tamanho={h}
          cor="var(--steel)"
          fundo="transparent"
        />
      )}
    </div>
  )
}
const styles = {
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  busca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--charcoal)',
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-pill)',
    padding: '4px 4px 4px 18px',
  },
  buscaInput: {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    fontSize: 17,
    height: 44,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  semChave: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  semChaveTopo: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconeSoft: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--kleo-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  semChaveTitulo: {
    fontSize: 17,
    fontWeight: 600,
  },
  semChaveTexto: {
    fontSize: 15,
    color: 'var(--silver)',
    marginTop: 4,
    lineHeight: 1.4,
  },
  carregandoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  carregando: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 15,
    color: 'var(--silver)',
  },
  erro: {
    color: 'var(--orange)',
    fontSize: 15,
    padding: '0 6px',
  },
  receitaTopo: {
    padding: 22,
    borderBottom: '1px solid var(--divider)',
    background: 'linear-gradient(180deg, rgba(255,159,10,0.10), transparent)',
  },
  receitaIcone: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: 'rgba(255,159,10,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receitaNome: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1.15,
    marginTop: 14,
  },
  metas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  meta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 14,
    color: 'var(--silver)',
  },
  acoesReceita: {
    display: 'flex',
    gap: 10,
    marginTop: 18,
  },
  secao: {
    padding: '18px 22px 6px',
  },
  ajuda: {
    fontSize: 13,
    color: 'var(--steel)',
    marginTop: -6,
    marginBottom: 6,
  },
  ingrediente: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    fontSize: 16,
    borderBottom: '1px solid var(--divider)',
    padding: '8px 0',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background .25s ease, border-color .25s ease',
  },
  aviso: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--green)',
    fontSize: 14,
    marginTop: 10,
    justifyContent: 'center',
  },
  passo: {
    display: 'flex',
    gap: 14,
    padding: '10px 0',
    alignItems: 'flex-start',
  },
  passoNum: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--kleo-soft)',
    color: 'var(--kleo)',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  passoTexto: {
    fontSize: 16,
    lineHeight: 1.45,
    paddingTop: 3,
  },
  dica: {
    display: 'flex',
    gap: 10,
    background: 'rgba(255,159,10,0.10)',
    borderRadius: 18,
    padding: 14,
    fontSize: 15,
    lineHeight: 1.45,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--charcoal)',
    border: '1px solid var(--divider)',
    borderRadius: 22,
    padding: '8px 8px 8px 12px',
  },
  itemBotao: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    minHeight: 44,
  },
  itemIcone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: 'rgba(255,159,10,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    fontSize: 13,
    color: 'var(--silver)',
    marginTop: 2,
  },
}
