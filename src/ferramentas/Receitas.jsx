import { useEffect, useRef, useState } from 'react'
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
  Trash2,
  Volume2,
  Flame,
} from 'lucide-react'
import { Card, Botao, BotaoIcone, Chip, Tag, Vazio } from '../components/ui'
import useSaida from '../hooks/useSaida'
import useRemocao from '../components/profissao/useRemocao'
import { perguntar, temIA, mensagemErro } from '../lib/ia'
import { adicionarItemLista } from '../lib/storage'
import { falar } from '../lib/voz'
import { RECEITAS_EXEMPLO, SUGESTOES_RECEITA } from '../data/receitasExemplo'
import { useDados, useTam } from './comum'
import { Coluna, Rotulo, Marca } from './pecas'
import ModoCozinhar from './ModoCozinhar'
const ESTILOS = {
  geral: {
    placeholder: 'O que vamos cozinhar?',
    sugestoes: SUGESTOES_RECEITA,
    extra: '',
  },
  doces: {
    placeholder: 'Qual doce vamos fazer?',
    sugestoes: [
      'Bolo de cenoura com chocolate',
      'Brigadeiro gourmet',
      'Pudim de leite',
      'Torta de limão',
      'Brownie',
    ],
    extra:
      'Foque em confeitaria: dê pesos em gramas além das medidas caseiras, temperatura do forno e ponto da massa.',
  },
  paes: {
    placeholder: 'Qual pão vamos assar?',
    sugestoes: [
      'Pão francês',
      'Pão de forma caseiro',
      'Pão de queijo',
      'Focaccia',
      'Pão de fermentação natural',
    ],
    extra:
      'Foque em panificação: use porcentagem de padeiro quando útil, tempos de sova, fermentação e forno.',
  },
  bebidas: {
    placeholder: 'Qual bebida vamos preparar?',
    sugestoes: [
      'Café coado perfeito',
      'Cappuccino cremoso',
      'Latte gelado',
      'Chocolate quente',
      'Chá gelado de hibisco',
    ],
    extra: 'Foque em bebidas e cafeteria: proporções, temperatura da água, moagem e tempo de extração.',
  },
  nutricao: {
    placeholder: 'Qual refeição saudável?',
    sugestoes: [
      'Marmita fit de frango',
      'Café da manhã proteico',
      'Salada completa',
      'Lanche com pouco açúcar',
      'Sopa leve de legumes',
    ],
    extra:
      'Foque em nutrição: inclua no campo "nutricao" calorias por porção e gramas de proteína, carboidrato e gordura. Prefira preparos saudáveis.',
  },
}
const INSTRUCAO_JSON = `Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, sem markdown, no formato:
{"nome":"","tempo":"","porcoes":"","dificuldade":"Fácil|Média|Difícil","ingredientes":["quantidade e ingrediente"],"passos":["passo claro e curto"],"dica":"","nutricao":""}
Use medidas caseiras brasileiras. Passos curtos e objetivos, citando o tempo em minutos quando houver. Não use comandos especiais.`
function extrairJSON(texto) {
  const inicio = texto.indexOf('{')
  if (inicio < 0) return null
  let nivel = 0,
    emString = false,
    escape = false
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
    nutricao: r.nutricao
      ? typeof r.nutricao === 'string'
        ? r.nutricao
        : Object.entries(r.nutricao)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · ')
      : '',
  }
  return receita.passos.length ? receita : null
}
export default function Receitas({ config = {}, chave }) {
  const { simples, h } = useTam()
  const estilo = ESTILOS[config.estilo] || ESTILOS.geral
  const [favoritas, setFavoritas] = useDados(chave, [])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [receita, setReceita] = useState(null)
  const [marcados, setMarcados] = useState({})
  const [cozinhando, setCozinhando] = useState(false)
  const [aviso, setAviso] = useState('')
  const ctrl = useRef(null)
  const comIA = temIA('json')
  const lista = Array.isArray(favoritas) ? favoritas : []
  const ehFavorita = receita && lista.some(f => f.nome === receita.nome)
  useEffect(() => () => ctrl.current?.abort(), [])
  const abrir = r => {
    setReceita(r)
    setMarcados({})
    setAviso('')
    setErro('')
    if (simples) falar(`${r.nome}. ${r.ingredientes.length} ingredientes e ${r.passos.length} passos.`)
  }
  const buscar = async termo => {
    const q = (termo ?? busca).trim()
    if (!q || carregando) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setBusca(q)
    setErro('')
    setCarregando(true)
    setReceita(null)
    try {
      const bruto = await perguntar(
        [
          {
            role: 'user',
            content: `Receita de: ${q}`,
          },
        ],
        {
          funcao: 'json',
          json: true,
          signal: c.signal,
          extraSystem: `${INSTRUCAO_JSON} ${estilo.extra}`,
          temperatura: 0.5,
          maxTokens: 1500,
        },
      )
      const r = normalizar(extrairJSON(String(bruto || '')))
      if (!r) throw new Error('FORMATO')
      abrir(r)
    } catch (e) {
      if (e?.name === 'AbortError') return
      setErro(
        e.message === 'FORMATO'
          ? 'Não consegui montar essa receita. Tente descrever de outro jeito.'
          : mensagemErro(e),
      )
    } finally {
      if (ctrl.current === c) setCarregando(false)
    }
  }
  const adicionarLista = () => {
    const itens = receita.ingredientes.filter((_, i) => !marcados[i])
    let nome = 'Mercado'
    itens.forEach(t => {
      nome = adicionarItemLista('Mercado', t)
    })
    const msg = `${itens.length} ${itens.length === 1 ? 'ingrediente foi' : 'ingredientes foram'} para a lista ${nome}.`
    setAviso(msg)
    if (simples) falar(msg)
  }
  const alternarFavorita = () =>
    setFavoritas(atual => {
      const l = Array.isArray(atual) ? atual : []
      return l.some(f => f.nome === receita.nome)
        ? l.filter(f => f.nome !== receita.nome)
        : [
            {
              ...receita,
              id: Date.now(),
            },
            ...l,
          ].slice(0, 40)
    })
  const { saindo: favSaindo, remover: removerFavorita } = useRemocao(id =>
    setFavoritas(atual => (atual || []).filter(f => f.id !== id)),
  )
  const { montado: cozinharMontado, saindo: cozinharSaindo } = useSaida(cozinhando && !!receita)
  return (
    <Coluna>
      {comIA ? (
        <>
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
            <Search size={20} color="var(--text-3)" aria-hidden="true" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={estilo.placeholder}
              aria-label={estilo.placeholder}
              style={styles.buscaInput}
            />
            <Botao
              variante="primario"
              type="submit"
              disabled={!busca.trim() || carregando}
              carregando={carregando}
            >
              Buscar
            </Botao>
          </form>
          <div style={styles.chips}>
            {estilo.sugestoes.slice(0, simples ? 3 : 6).map(s => (
              <Chip key={s} cor="lima" onClick={() => buscar(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </>
      ) : (
        <Card cor="lavanda">
          <p style={styles.semIATitulo}>Receitas de exemplo</p>
          <p style={styles.semIATexto}>
            A IA da Kleo não está disponível agora. Em Ajustes, ligue a IA da Kleo ou adicione uma chave
            grátis para pedir qualquer receita. Enquanto isso, experimente estas.
          </p>
        </Card>
      )}

      {carregando && (
        <Card aria-live="polite">
          <p style={styles.cinza}>Preparando a receita de {busca}...</p>
          <Coluna
            gap={10}
            style={{
              marginTop: 12,
            }}
          >
            <div
              className="skeleton"
              style={{
                height: 28,
                width: '62%',
              }}
            />
            <div
              className="skeleton"
              style={{
                height: 14,
                width: '40%',
              }}
            />
            <div
              className="skeleton"
              style={{
                height: 48,
                width: '100%',
                borderRadius: 25,
              }}
            />
            <div
              className="skeleton"
              style={{
                height: 14,
                width: '85%',
              }}
            />
          </Coluna>
        </Card>
      )}

      {erro && (
        <p key={erro} className="shake" style={styles.erro} role="alert">
          {erro}
        </p>
      )}

      {receita && (
        <Card key={receita.nome} tamanho="g" className="anim-scale">
          <span className="anim-pop" style={styles.receitaIcone}>
            <ChefHat size={26} color="#000" />
          </span>
          <h2 style={styles.receitaNome}>{receita.nome}</h2>
          <div style={styles.metas}>
            {receita.tempo && (
              <Tag cor="lavanda" icone={Clock}>
                {receita.tempo}
              </Tag>
            )}
            {receita.porcoes && (
              <Tag cor="ceu" icone={Users}>
                {receita.porcoes}
              </Tag>
            )}
            {receita.dificuldade && !simples && (
              <Tag cor="lima" icone={Gauge}>
                {receita.dificuldade}
              </Tag>
            )}
          </div>
          <div style={styles.acoes}>
            <div
              style={{
                flex: 1,
              }}
            >
              <Botao variante="primario" icone={Play} grande cheio onClick={() => setCozinhando(true)}>
                Modo cozinhar
              </Botao>
            </div>
            <BotaoIcone
              icone={Heart}
              label={ehFavorita ? 'Tirar das favoritas' : 'Guardar nas favoritas'}
              variante={ehFavorita ? 'preto' : 'lavanda'}
              onClick={alternarFavorita}
            />
            {!simples && (
              <BotaoIcone
                icone={Volume2}
                label="Ouvir ingredientes"
                variante="branco"
                onClick={() =>
                  falar(`Ingredientes: ${receita.ingredientes.join('. ')}`, {
                    forcar: true,
                  })
                }
              />
            )}
          </div>

          {receita.nutricao && (
            <p style={styles.nutricao}>
              <Flame size={16} /> {receita.nutricao}
            </p>
          )}

          <Rotulo
            style={{
              marginTop: 22,
            }}
          >
            Ingredientes ({receita.ingredientes.length})
          </Rotulo>
          {!simples && <p style={styles.ajuda}>Marque o que você já tem.</p>}
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
                <Marca feito={!!marcados[i]} />
                <span
                  style={{
                    textDecoration: marcados[i] ? 'line-through' : 'none',
                    color: marcados[i] ? 'var(--text-3)' : 'var(--text)',
                  }}
                >
                  {ing}
                </span>
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
            }}
          >
            <Botao variante="fantasma" icone={ShoppingCart} cheio onClick={adicionarLista}>
              Pôr o que falta na lista de compras
            </Botao>
          </div>
          {aviso && (
            <p key={aviso} className="anim-pop" style={styles.aviso} role="status">
              <Check size={15} /> {aviso}
            </p>
          )}

          {!simples && (
            <>
              <Rotulo
                style={{
                  marginTop: 22,
                }}
              >
                Modo de preparo
              </Rotulo>
              <div className="stagger">
                {receita.passos.map((p, i) => (
                  <div key={i} style={styles.passo}>
                    <span style={styles.passoNum}>{i + 1}</span>
                    <p style={styles.passoTexto}>{p}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {receita.dica && (
            <div style={styles.dica}>
              <Lightbulb
                size={18}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <p>
                <strong
                  style={{
                    fontWeight: 700,
                  }}
                >
                  Dica da Kleo:{' '}
                </strong>
                {receita.dica}
              </p>
            </div>
          )}
        </Card>
      )}

      {!comIA && !receita && (
        <Coluna gap={10} className="stagger">
          {RECEITAS_EXEMPLO.map(r => (
            <ItemReceita key={r.nome} r={r} onAbrir={() => abrir(r)} />
          ))}
        </Coluna>
      )}
      {!comIA && receita && (
        <Botao variante="fantasma" onClick={() => setReceita(null)}>
          Ver outras receitas
        </Botao>
      )}

      <div>
        <Rotulo>Favoritas</Rotulo>
        {lista.length === 0 ? (
          <Card>
            <Vazio
              icone={Heart}
              titulo="Nenhuma favorita ainda"
              texto="Toque no coração de uma receita para guardar aqui."
            />
          </Card>
        ) : (
          <Coluna gap={10}>
            {lista.map(r => (
              <ItemReceita
                key={r.id}
                r={r}
                saindo={favSaindo(r.id)}
                onAbrir={() => abrir(r)}
                onRemover={simples ? null : () => removerFavorita(r.id)}
              />
            ))}
          </Coluna>
        )}
      </div>

      {cozinharMontado && receita && (
        <ModoCozinhar
          receita={receita}
          forcarVoz={simples}
          saindo={cozinharSaindo}
          onFechar={() => setCozinhando(false)}
        />
      )}
    </Coluna>
  )
}
function ItemReceita({ r, onAbrir, onRemover, saindo = false }) {
  return (
    <div className={saindo ? 'item-out' : undefined} style={styles.item}>
      <button
        onClick={onAbrir}
        className="tap"
        style={styles.itemBotao}
        aria-label={`Abrir receita ${r.nome}`}
      >
        <span style={styles.itemIcone}>
          <ChefHat size={20} color="#000" />
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
          }}
        >
          <span style={styles.itemNome}>{r.nome}</span>
          <span style={styles.itemMeta}>{[r.tempo, r.porcoes].filter(Boolean).join(' · ')}</span>
        </span>
      </button>
      {onRemover && <BotaoIcone icone={Trash2} label={`Remover ${r.nome}`} onClick={onRemover} />}
    </div>
  )
}
const styles = {
  busca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    borderRadius: 25,
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
    paddingBottom: 2,
  },
  semIATitulo: {
    fontSize: 20,
    fontWeight: 800,
    color: '#000',
  },
  semIATexto: {
    fontSize: 15,
    color: '#000',
    marginTop: 6,
    lineHeight: 1.4,
  },
  cinza: {
    color: 'var(--text-2)',
    fontSize: 15,
  },
  erro: {
    color: 'var(--erro)',
    fontSize: 15,
    fontWeight: 600,
    padding: '0 6px',
  },
  receitaIcone: {
    width: 56,
    height: 56,
    borderRadius: 18,
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receitaNome: {
    fontSize: 32,
    fontWeight: 800,
    lineHeight: 1.02,
    marginTop: 14,
  },
  metas: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  acoes: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  nutricao: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    marginTop: 14,
    background: 'var(--surface-2)',
    borderRadius: 15,
    padding: '10px 14px',
  },
  ajuda: {
    fontSize: 14,
    color: 'var(--text-3)',
    marginTop: -6,
    marginBottom: 4,
  },
  ingrediente: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    fontSize: 16,
    borderBottom: '1px solid var(--surface-2)',
    padding: '8px 0',
  },
  aviso: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    color: 'var(--sucesso)',
    fontSize: 15,
    fontWeight: 600,
    marginTop: 10,
  },
  passo: {
    display: 'flex',
    gap: 14,
    padding: '10px 0',
    alignItems: 'flex-start',
  },
  passoNum: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--lavanda)',
    color: '#000',
    fontSize: 14,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  passoTexto: {
    fontSize: 16,
    lineHeight: 1.5,
    paddingTop: 3,
  },
  dica: {
    display: 'flex',
    gap: 10,
    background: 'var(--lima)',
    color: '#000',
    borderRadius: 25,
    padding: 16,
    fontSize: 15,
    lineHeight: 1.45,
    marginTop: 20,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    borderRadius: 30,
    padding: '8px 8px 8px 12px',
  },
  itemBotao: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    minHeight: 52,
  },
  itemIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemNome: {
    display: 'block',
    fontSize: 16,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    display: 'block',
    fontSize: 13,
    color: 'var(--text-3)',
    marginTop: 2,
  },
}
