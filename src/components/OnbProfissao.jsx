import { useMemo, useState } from 'react'
import { Search, ChevronDown, Check, Plus, X, RefreshCw } from 'lucide-react'
import { CATEGORIAS, PROFISSOES, buscarProfissoes, getProfissao, getCategoria } from '../data/profissoes'
import { Campo, Botao, Tag } from './ui'
const FUNDO = {
  lavanda: 'var(--lavanda)',
  lima: 'var(--lima)',
  ceu: 'var(--ceu)',
  mist: 'var(--surface-2)',
}
const LIMITE_BUSCA = 40
const RAPIDAS_PADRAO = ['aposentado', 'lar', 'estudante', 'outro']
export default function OnbProfissao({
  principal,
  extras,
  onPrincipal,
  onExtras,
  simples,
  rapidas = RAPIDAS_PADRAO,
}) {
  const [busca, setBusca] = useState('')
  const [catAberta, setCatAberta] = useState(null)
  const [modo, setModo] = useState(null)
  const seletorAberto = !principal || modo !== null
  const alvo = !principal ? 'principal' : modo
  const porCategoria = useMemo(() => {
    const mapa = {}
    PROFISSOES.forEach(p => {
      ;(mapa[p.categoria] ||= []).push(p)
    })
    return mapa
  }, [])
  const resultados = useMemo(() => (busca.trim() ? buscarProfissoes(busca) : []), [busca])
  function escolher(id) {
    if (alvo === 'extra') {
      if (id !== principal && !extras.includes(id)) onExtras([...extras, id])
    } else {
      onPrincipal(id)
      if (extras.includes(id)) onExtras(extras.filter(x => x !== id))
    }
    setModo(null)
    setBusca('')
    setCatAberta(null)
  }
  function removerExtra(id) {
    onExtras(extras.filter(x => x !== id))
  }
  const marca = id => (id === principal ? 'principal' : extras.includes(id) ? 'extra' : null)
  const linha = p => {
    const m = marca(p.id)
    const bloqueado = alvo === 'extra' && m !== null
    return (
      <ItemProfissao
        key={p.id}
        p={p}
        marca={m}
        bloqueado={bloqueado}
        simples={simples}
        onClick={() => escolher(p.id)}
      />
    )
  }
  return (
    <div>
      {principal && (
        <div className="anim-scale" style={styles.resumo}>
          <ResumoProfissao
            id={principal}
            rotulo="Principal"
            simples={simples}
            acao={
              !modo && (
                <button
                  type="button"
                  className="tap"
                  style={styles.trocar}
                  onClick={() => setModo('principal')}
                >
                  <RefreshCw size={16} aria-hidden="true" /> Trocar
                </button>
              )
            }
          />
          {extras.map(id => (
            <ResumoProfissao
              key={id}
              id={id}
              rotulo="Também"
              simples={simples}
              acao={
                <button
                  type="button"
                  className="tap"
                  style={styles.remover}
                  onClick={() => removerExtra(id)}
                  aria-label={`Remover ${getProfissao(id).label}`}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              }
            />
          ))}
          {!modo && (
            <Botao variante="fantasma" icone={Plus} cheio onClick={() => setModo('extra')}>
              Adicionar outra profissão
            </Botao>
          )}
          {!modo && !simples && <p style={styles.dicaExtra}>Opcional. Você pode ter mais de um trabalho.</p>}
        </div>
      )}

      {seletorAberto && (
        <div className="anim-up" style={styles.seletor}>
          {modo && (
            <div style={styles.seletorTopo}>
              <span style={styles.seletorTitulo}>
                {modo === 'extra' ? 'Escolha outra profissão' : 'Escolha a profissão principal'}
              </span>
              <button
                type="button"
                className="tap"
                style={styles.cancelar}
                onClick={() => {
                  setModo(null)
                  setBusca('')
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {alvo === 'principal' && !busca.trim() && rapidas.length > 0 && (
            <div style={styles.rapidas} role="group" aria-label="Escolhas mais comuns">
              {rapidas
                .map(id => getProfissao(id))
                .filter((p, i, l) => p && l.findIndex(x => x.id === p.id) === i)
                .map(p => {
                  const Icone = p.icone || p.icon
                  const ativo = p.id === principal
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="tap"
                      onClick={() => escolher(p.id)}
                      aria-pressed={ativo}
                      style={{
                        ...styles.rapida,
                        minHeight: simples ? 64 : 56,
                        fontSize: simples ? 18 : 16,
                        background: ativo ? 'var(--lavanda)' : 'var(--surface)',
                      }}
                    >
                      {Icone && (
                        <span style={styles.rapidaIcone}>
                          <Icone size={20} color="#000" strokeWidth={2.1} aria-hidden="true" />
                        </span>
                      )}
                      <span style={styles.rapidaTexto}>{p.label}</span>
                    </button>
                  )
                })}
            </div>
          )}

          <Campo
            icone={Search}
            placeholder="Buscar: ex. eletricista"
            aria-label="Buscar profissão"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            enterKeyHint="search"
          />

          {busca.trim() ? (
            <div
              style={styles.lista}
              key="busca"
              className="anim-fade"
              role="list"
              aria-label="Resultados da busca"
            >
              {resultados.length === 0 ? (
                <div style={styles.nada}>
                  <p>Nada encontrado para "{busca.trim()}".</p>
                  <Botao variante="suave" onClick={() => escolher('outro')}>
                    Usar "Outro"
                  </Botao>
                </div>
              ) : (
                <>
                  <span style={styles.contagem}>
                    {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                  {resultados.slice(0, LIMITE_BUSCA).map(linha)}
                </>
              )}
            </div>
          ) : (
            <div style={styles.lista} key="cats" className="anim-fade">
              {CATEGORIAS.map(c => {
                const itens = porCategoria[c.id] || []
                if (!itens.length) return null
                const aberta = catAberta === c.id
                const Icone = c.icone
                const escolhidas = itens.filter(p => marca(p.id)).length
                return (
                  <div key={c.id} style={styles.categoria}>
                    <button
                      type="button"
                      className="tap"
                      aria-expanded={aberta}
                      onClick={() => setCatAberta(aberta ? null : c.id)}
                      style={{
                        ...styles.catBotao,
                        minHeight: simples ? 72 : 64,
                      }}
                    >
                      <span
                        style={{
                          ...styles.catIcone,
                          background: FUNDO[c.cor] || 'var(--lavanda)',
                        }}
                      >
                        <Icone size={22} color="#000" strokeWidth={2.1} aria-hidden="true" />
                      </span>
                      <span style={styles.catTextos}>
                        <span
                          style={{
                            ...styles.catNome,
                            fontSize: simples ? 18 : 16,
                          }}
                        >
                          {c.nome}
                        </span>
                        <span style={styles.catSub}>
                          {itens.length} {itens.length === 1 ? 'opção' : 'opções'}
                          {escolhidas > 0 && ' · escolhida'}
                        </span>
                      </span>
                      <ChevronDown
                        size={22}
                        aria-hidden="true"
                        style={{
                          ...styles.catSeta,
                          transform: aberta ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </button>
                    {aberta && (
                      <div style={styles.catLista} className="stagger" role="list" aria-label={c.nome}>
                        {itens.map(linha)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
function ItemProfissao({ p, marca, bloqueado, simples, onClick }) {
  const Icone = p.icone || p.icon
  const cat = getCategoria(p.categoria)
  const ativo = marca !== null
  return (
    <button
      type="button"
      role="listitem"
      className="tap"
      onClick={bloqueado ? undefined : onClick}
      aria-disabled={bloqueado || undefined}
      aria-label={`${p.label}${marca === 'principal' ? ', profissão principal' : marca === 'extra' ? ', já adicionada' : ''}`}
      style={{
        ...styles.item,
        minHeight: simples ? 64 : 56,
        background: ativo ? 'var(--lavanda)' : 'var(--surface)',
        opacity: bloqueado ? 0.5 : 1,
      }}
    >
      <span
        style={{
          ...styles.itemIcone,
          background: ativo ? 'var(--surface)' : FUNDO[cat.cor] || 'var(--surface-2)',
        }}
      >
        {Icone && <Icone size={19} color="#000" strokeWidth={2.1} aria-hidden="true" />}
      </span>
      <span
        style={{
          ...styles.itemLabel,
          fontSize: simples ? 18 : 16,
        }}
      >
        {p.label}
      </span>
      {ativo && (
        <span className="check-pop" style={styles.itemCheck}>
          <Check size={16} color="#fff" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
    </button>
  )
}
function ResumoProfissao({ id, rotulo, acao, simples }) {
  const p = getProfissao(id)
  const Icone = p.icone || p.icon
  return (
    <div
      style={{
        ...styles.resumoItem,
        background: rotulo === 'Principal' ? 'var(--lavanda)' : 'var(--surface)',
      }}
    >
      <span style={styles.resumoIcone}>
        {Icone && <Icone size={24} color="#000" strokeWidth={2.1} aria-hidden="true" />}
      </span>
      <span style={styles.resumoTextos}>
        <Tag cor={rotulo === 'Principal' ? 'lima' : 'mist'} style={styles.resumoTag}>
          {rotulo}
        </Tag>
        <span
          style={{
            ...styles.resumoNome,
            fontSize: simples ? 21 : 19,
          }}
        >
          {p.label}
        </span>
      </span>
      {acao}
    </div>
  )
}
const styles = {
  resumo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 18,
  },
  resumoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 14px 14px 16px',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
  },
  resumoIcone: {
    width: 48,
    height: 48,
    borderRadius: 15,
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumoTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  resumoTag: {
    fontSize: 12,
    padding: '2px 10px',
    fontWeight: 600,
  },
  resumoNome: {
    fontWeight: 700,
    lineHeight: 1.15,
    color: 'var(--text)',
  },
  trocar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    minHeight: 44,
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 15,
    fontWeight: 600,
    flexShrink: 0,
  },
  remover: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dicaExtra: {
    fontSize: 14,
    color: 'var(--text-3)',
    textAlign: 'center',
  },
  seletor: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  rapidas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  rapida: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px 8px 8px',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    color: 'var(--text)',
    fontWeight: 700,
    textAlign: 'left',
    minWidth: 0,
  },
  rapidaIcone: {
    width: 40,
    height: 40,
    borderRadius: 13,
    background: 'var(--lima)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidaTexto: {
    minWidth: 0,
    lineHeight: 1.15,
    overflowWrap: 'anywhere',
  },
  seletorTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  seletorTitulo: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text)',
  },
  cancelar: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    minHeight: 44,
    padding: '0 6px',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  contagem: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-3)',
    paddingLeft: 6,
  },
  nada: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '22px 12px',
    color: 'var(--text-2)',
    fontSize: 16,
    textAlign: 'center',
  },
  categoria: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    overflow: 'hidden',
  },
  catBotao: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 18px 10px 12px',
    textAlign: 'left',
    color: 'var(--text)',
  },
  catIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  catNome: {
    fontWeight: 700,
    lineHeight: 1.2,
  },
  catSub: {
    fontSize: 13,
    color: 'var(--text-3)',
  },
  catSeta: {
    flexShrink: 0,
    color: 'var(--text-2)',
    transition: 'transform 0.3s var(--ease-out)',
  },
  catLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '4px 10px 12px',
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 14px 8px 8px',
    borderRadius: 20,
    textAlign: 'left',
    color: 'var(--text)',
    border: '1px solid var(--surface-2)',
    transition: 'background 0.2s, opacity 0.2s',
  },
  itemIcone: {
    width: 40,
    height: 40,
    borderRadius: 13,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  itemLabel: {
    flex: 1,
    minWidth: 0,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  itemCheck: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
