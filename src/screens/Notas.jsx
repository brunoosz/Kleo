import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, MessageCircle, StickyNote, ListPlus, ListChecks, X } from 'lucide-react'
import Tela from '../components/Tela'
import Mascote from '../components/Mascote'
import NotasLista from '../components/NotasLista'
import NotasEditor from '../components/NotasEditor'
import { ListaCard, NotaCard } from '../components/NotasCard'
import { Botao, BotaoIcone, Card, Campo, Chip, Segmentado } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useSaida from '../hooks/useSaida'
import useModoSimples from '../hooks/useModoSimples'
import { ler, salvar } from '../lib/storage'
import { temNecessidade, leituraVozAtiva, avisosVisuaisAtivos } from '../lib/perfil'
const SUGESTOES = ['Mercado', 'Farmácia', 'Tarefas do dia']
export default function Notas() {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [params, setParams] = useSearchParams()
  const [aba, setAba] = useStorage('kleo_notas_aba', 'listas')
  const [listas, setListas] = useStorage('kleo_listas', {})
  const [notas, setNotas] = useStorage('kleo_notas', [])
  const [profile] = useStorage('kleo_profile', null)
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [nomeNova, setNomeNova] = useState('')
  const [erroNova, setErroNova] = useState('')
  const grande = simples || temNecessidade(profile, 'visual')
  const alvo = grande ? 56 : 44
  const listaAberta = params.get('lista')
  const notaAberta = params.get('nota')
  const { montado: novaMontada, saindo: novaSaindo } = useSaida(criando, 220)
  const emDetalhe = !!(
    (listaAberta && listas && listas[listaAberta]) ||
    (notaAberta && (notas || []).some(n => String(n.id) === notaAberta))
  )
  const [estavaEmDetalhe, setEstavaEmDetalhe] = useState(emDetalhe)
  const [voltouDoDetalhe, setVoltouDoDetalhe] = useState(false)
  if (estavaEmDetalhe !== emDetalhe) {
    setEstavaEmDetalhe(emDetalhe)
    setVoltouDoDetalhe(!emDetalhe)
  }
  useEffect(() => {
    const atuais = ler('kleo_notas', [])
    if (!Array.isArray(atuais)) return
    const vazia = n => String(n.id) !== notaAberta && !n.titulo?.trim() && !n.corpo?.trim()
    if (atuais.some(vazia))
      salvar(
        'kleo_notas',
        atuais.filter(n => !vazia(n)),
      )
  }, [notaAberta])
  const listaNomes = Object.keys(listas || {})
  const notasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return [...(notas || [])]
      .filter(n => !termo || `${n.titulo} ${n.corpo}`.toLowerCase().includes(termo))
      .sort((a, b) => (b.atualizado || 0) - (a.atualizado || 0))
  }, [notas, busca])
  function fecharDetalhe() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else
      setParams(
        {},
        {
          replace: true,
        },
      )
  }
  function nomeExiste(nome, exceto) {
    return listaNomes.some(k => k !== exceto && k.toLowerCase() === nome.toLowerCase())
  }
  function criarLista(nome) {
    const n = nome.trim()
    if (!n) {
      setErroNova('Dê um nome para a lista.')
      return
    }
    if (nomeExiste(n)) {
      setErroNova('Já existe uma lista com esse nome.')
      return
    }
    const formatado = n.charAt(0).toUpperCase() + n.slice(1)
    setListas(ls => ({
      ...ls,
      [formatado]: [],
    }))
    setCriando(false)
    setNomeNova('')
    setErroNova('')
    setParams({
      lista: formatado,
    })
  }
  function atualizarItens(nome, itens) {
    setListas(ls => ({
      ...ls,
      [nome]: itens,
    }))
  }
  function renomearLista(antigo, novo) {
    if (!novo) return 'Dê um nome para a lista.'
    if (novo === antigo) return true
    if (nomeExiste(novo, antigo)) return 'Já existe uma lista com esse nome.'
    setListas(ls => Object.fromEntries(Object.entries(ls).map(([k, v]) => [k === antigo ? novo : k, v])))
    setParams(
      {
        lista: novo,
      },
      {
        replace: true,
      },
    )
    return true
  }
  function excluirLista(nome) {
    setListas(ls => {
      const c = {
        ...ls,
      }
      delete c[nome]
      return c
    })
    fecharDetalhe()
  }
  function novaNota() {
    const id = Date.now()
    setNotas(ns => [
      {
        id,
        titulo: '',
        corpo: '',
        atualizado: id,
      },
      ...(ns || []),
    ])
    setParams({
      nota: String(id),
    })
  }
  function salvarNota(id, campos) {
    setNotas(ns =>
      (ns || []).map(n =>
        n.id === id
          ? {
              ...n,
              ...campos,
              atualizado: Date.now(),
            }
          : n,
      ),
    )
  }
  function excluirNota(id) {
    setNotas(ns => (ns || []).filter(n => n.id !== id))
    fecharDetalhe()
  }
  if (listaAberta && listas && listas[listaAberta]) {
    return (
      <NotasLista
        key={listaAberta}
        nome={listaAberta}
        itens={listas[listaAberta]}
        alvo={alvo}
        grande={grande}
        simples={simples}
        falarAcoes={leituraVozAtiva(profile)}
        onAtualizar={itens => atualizarItens(listaAberta, itens)}
        onRenomear={novo => renomearLista(listaAberta, novo)}
        onExcluir={() => excluirLista(listaAberta)}
      />
    )
  }
  const nota = notaAberta && (notas || []).find(n => String(n.id) === notaAberta)
  if (nota) {
    return (
      <NotasEditor
        key={nota.id}
        nota={nota}
        alvo={alvo}
        simples={simples}
        auditiva={avisosVisuaisAtivos(profile)}
        onSalvar={campos => salvarNota(nota.id, campos)}
        onExcluir={() => excluirNota(nota.id)}
      />
    )
  }
  const emListas = aba !== 'notas'
  const qtdNotas = (notas || []).length
  return (
    <Tela
      titulo="Notas"
      subtitulo={simples ? undefined : 'Listas de compras, tarefas e lembretes'}
      acoes={
        !simples && (
          <BotaoIcone
            icone={Plus}
            variante="preto"
            label={emListas ? 'Nova lista' : 'Nova nota'}
            onClick={() => (emListas ? setCriando(true) : novaNota())}
          />
        )
      }
    >
      <div className={voltouDoDetalhe ? 'anim-left' : undefined}>
        <Segmentado
          opcoes={[
            {
              id: 'listas',
              label: `Listas${listaNomes.length ? ` (${listaNomes.length})` : ''}`,
              icone: ListChecks,
            },
            {
              id: 'notas',
              label: `Notas${qtdNotas ? ` (${qtdNotas})` : ''}`,
              icone: StickyNote,
            },
          ]}
          valor={emListas ? 'listas' : 'notas'}
          onChange={setAba}
          style={{
            marginBottom: 18,
          }}
        />

        {emListas ? (
          <div key="listas" className="anim-tab" style={styles.coluna}>
            {simples && !novaMontada && (
              <Botao icone={ListPlus} cheio grande onClick={() => setCriando(true)}>
                Nova lista
              </Botao>
            )}

            {novaMontada && (
              <Card cor="lavanda" className={novaSaindo ? 'anim-out' : 'anim-scale'} style={styles.cardNova}>
                <p style={styles.cardNovaTitulo}>Nova lista</p>
                <Campo
                  autoFocus
                  value={nomeNova}
                  onChange={e => {
                    setNomeNova(e.target.value)
                    setErroNova('')
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') criarLista(nomeNova)
                    if (e.key === 'Escape') setCriando(false)
                  }}
                  placeholder="Nome da lista"
                  aria-label="Nome da nova lista"
                />
                <div style={styles.chips}>
                  {SUGESTOES.filter(s => !nomeExiste(s)).map((s, i) => (
                    <span
                      key={s}
                      className="anim-pop"
                      style={{
                        animationDelay: `${120 + i * 50}ms`,
                      }}
                    >
                      <Chip cor="branco" icone={Plus} onClick={() => criarLista(s)}>
                        {s}
                      </Chip>
                    </span>
                  ))}
                </div>
                {erroNova && (
                  <p key={erroNova} className="shake" style={styles.erro} role="alert">
                    {erroNova}
                  </p>
                )}
                <div
                  style={{
                    ...styles.linhaBotoes,
                    flexDirection: simples ? 'column-reverse' : 'row',
                  }}
                >
                  <Botao
                    variante="fantasma"
                    cheio
                    onClick={() => {
                      setCriando(false)
                      setErroNova('')
                    }}
                    style={{
                      flex: 1,
                    }}
                  >
                    Cancelar
                  </Botao>
                  <Botao
                    cheio
                    onClick={() => criarLista(nomeNova)}
                    style={{
                      flex: 1,
                    }}
                  >
                    Criar lista
                  </Botao>
                </div>
              </Card>
            )}

            {listaNomes.length === 0 && !novaMontada && (
              <Card cor="branco" tamanho="g" className="anim-scale" style={styles.vazio}>
                <Mascote tamanho={grande ? 120 : 104} />
                <h2 style={styles.vazioTitulo}>Nenhuma lista ainda</h2>
                <p style={styles.vazioTexto}>
                  Diga à Kleo:{' '}
                  <strong style={styles.citacao}>"acabou o leite, coloca na lista do mercado"</strong>
                </p>
                <Botao icone={MessageCircle} cheio onClick={() => navigate('/chat')}>
                  Falar com a Kleo
                </Botao>
                {!simples && (
                  <Botao variante="fantasma" icone={ListPlus} cheio onClick={() => setCriando(true)}>
                    Criar lista
                  </Botao>
                )}
              </Card>
            )}

            {listaNomes.length > 0 && (
              <div className="stagger" style={styles.coluna}>
                {listaNomes.map((nome, i) => (
                  <ListaCard
                    key={nome}
                    nome={nome}
                    indice={i}
                    itens={listas[nome] || []}
                    alvo={alvo}
                    onClick={() =>
                      setParams({
                        lista: nome,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {!simples && listaNomes.length > 0 && !novaMontada && (
              <button
                type="button"
                className="anim-fade tap"
                onClick={() => setCriando(true)}
                style={{
                  ...styles.btnNovaLista,
                  minHeight: alvo + 4,
                }}
              >
                <Plus size={19} /> Nova lista
              </button>
            )}
          </div>
        ) : (
          <div key="notas" className="anim-tab">
            {simples && (
              <div
                style={{
                  marginBottom: 14,
                }}
              >
                <Botao icone={Plus} cheio grande onClick={novaNota}>
                  Nova nota
                </Botao>
              </div>
            )}

            {!simples && qtdNotas > 0 && (
              <div style={styles.busca}>
                <Campo
                  icone={Search}
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar nas notas"
                  aria-label="Buscar nas notas"
                  style={{
                    paddingRight: 52,
                  }}
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="anim-pop"
                    aria-label="Limpar busca"
                    style={styles.buscaLimpar}
                  >
                    <X size={16} color="#000" />
                  </button>
                )}
              </div>
            )}

            {qtdNotas === 0 && (
              <Card cor="branco" tamanho="g" className="anim-scale" style={styles.vazio}>
                <span
                  className="anim-pop"
                  style={{
                    ...styles.vazioIcone,
                    animationDelay: '80ms',
                  }}
                >
                  <StickyNote size={34} color="#000" />
                </span>
                <h2 style={styles.vazioTitulo}>Nenhuma nota ainda</h2>
                <p style={styles.vazioTexto}>
                  {simples
                    ? 'Guarde recados e ideias aqui.'
                    : 'Anote ideias, recados ou receitas. Você também pode ditar em vez de digitar.'}
                </p>
                {!simples && (
                  <Botao icone={Plus} cheio onClick={novaNota}>
                    Nova nota
                  </Botao>
                )}
              </Card>
            )}

            {qtdNotas > 0 && notasFiltradas.length === 0 && (
              <p className="anim-fade" style={styles.semResultado}>
                Nenhuma nota encontrada para "{busca}".
              </p>
            )}

            <div
              key={busca.trim() ? `b:${busca.trim().toLowerCase()}` : 'todas'}
              className={busca.trim() ? 'anim-fade' : 'stagger'}
              style={grande ? styles.colunaNotas : styles.grid}
            >
              {notasFiltradas.map(n => (
                <NotaCard
                  key={n.id}
                  nota={n}
                  busca={busca.trim()}
                  reto={grande}
                  onClick={() =>
                    setParams({
                      nota: String(n.id),
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Tela>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  colunaNotas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    padding: '2px 2px 8px',
  },
  cardNova: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardNovaTitulo: {
    fontSize: 22,
    fontWeight: 800,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  linhaBotoes: {
    display: 'flex',
    gap: 10,
  },
  erro: {
    color: 'var(--erro)',
    fontSize: 15,
    fontWeight: 600,
    paddingLeft: 6,
  },
  vazio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },
  vazioIcone: {
    width: 76,
    height: 76,
    borderRadius: '30%',
    background: 'var(--lima)',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTitulo: {
    fontSize: 24,
    fontWeight: 800,
  },
  vazioTexto: {
    fontSize: 16,
    color: 'var(--text-2)',
    lineHeight: 1.5,
    maxWidth: 340,
    marginBottom: 4,
  },
  citacao: {
    color: '#000',
    fontWeight: 600,
  },
  btnNovaLista: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    border: '1.5px dashed var(--border)',
    borderRadius: 'var(--r-btn)',
    color: '#000',
    fontSize: 16,
    fontWeight: 600,
  },
  busca: {
    position: 'relative',
    marginBottom: 16,
  },
  buscaLimpar: {
    position: 'absolute',
    right: 6,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semResultado: {
    color: 'var(--text-3)',
    fontSize: 15,
    textAlign: 'center',
    padding: '24px 0',
  },
}
