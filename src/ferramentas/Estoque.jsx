import { useState } from 'react'
import { Plus, Minus, Trash2, Package, ShoppingCart, AlertTriangle, Check } from 'lucide-react'
import { Card, Botao, BotaoIcone, Sheet, Tag, Vazio } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { adicionarItemLista } from '../lib/storage'
import { useDados, useTam, numero, novoId, fmt } from './comum'
import { Coluna, Entrada, Rotulo } from './pecas'
export default function Estoque({ config = {}, chave }) {
  const { simples, h } = useTam()
  const [dados, setDados] = useDados(chave, {
    itens: [],
  })
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    qtd: '',
    min: '',
    unidade: 'un',
  })
  const [aviso, setAviso] = useState('')
  const itens = Array.isArray(dados?.itens) ? dados.itens : []
  const faltando = itens.filter(i => i.qtd <= i.min)
  const ordenados = [...itens].sort(
    (a, b) => Number(b.qtd <= b.min) - Number(a.qtd <= a.min) || a.nome.localeCompare(b.nome),
  )
  const rotulo = config.rotulo || 'Estoque'
  const mudarQtd = (id, delta) =>
    setDados(a => ({
      ...(a || {}),
      itens: ((a || {}).itens || []).map(i =>
        i.id === id
          ? {
              ...i,
              qtd: Math.max(0, +(i.qtd + delta).toFixed(3)),
            }
          : i,
      ),
    }))
  const salvarItem = e => {
    e.preventDefault()
    if (!form.nome.trim()) return
    const novo = {
      id: novoId(),
      nome: form.nome.trim(),
      qtd: Math.max(0, numero(form.qtd) || 0),
      min: Math.max(0, numero(form.min) || 0),
      unidade: form.unidade.trim() || 'un',
    }
    setDados(a => ({
      ...(a || {}),
      itens: [...((a || {}).itens || []), novo],
    }))
    setForm({
      nome: '',
      qtd: '',
      min: '',
      unidade: form.unidade,
    })
    setAberto(false)
  }
  const enviarCompras = () => {
    let lista = 'Compras'
    faltando.forEach(i => {
      lista = adicionarItemLista('Compras', `${i.nome} (repor ${rotulo.toLowerCase()})`)
    })
    setAviso(
      `${faltando.length} ${faltando.length === 1 ? 'item enviado' : 'itens enviados'} para a lista ${lista}.`,
    )
    setTimeout(() => setAviso(''), 3500)
  }
  const { saindo, remover } = useRemocao(id =>
    setDados(a => ({
      ...(a || {}),
      itens: ((a || {}).itens || []).filter(i => i.id !== id),
    })),
  )
  return (
    <Coluna>
      <Card cor={faltando.length ? 'lima' : 'lavanda'}>
        <div style={styles.topo}>
          <span style={styles.topoIcone}>
            {faltando.length ? <AlertTriangle size={22} color="#000" /> : <Check size={22} color="#000" />}
          </span>
          <div
            style={{
              flex: 1,
            }}
          >
            <p style={styles.topoTitulo}>
              {faltando.length ? `${faltando.length} para repor` : `${rotulo} em dia`}
            </p>
            <p style={styles.topoSub}>
              {itens.length} {itens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
            </p>
          </div>
        </div>
        {faltando.length > 0 && (
          <div
            style={{
              marginTop: 14,
            }}
          >
            <Botao variante="primario" icone={ShoppingCart} grande={simples} cheio onClick={enviarCompras}>
              Mandar para a lista de compras
            </Botao>
          </div>
        )}
        {aviso && (
          <p className="anim-pop" style={styles.aviso} role="status">
            {aviso}
          </p>
        )}
      </Card>

      <Card>
        {ordenados.length === 0 ? (
          <Vazio
            icone={Package}
            titulo="Nenhum item ainda"
            texto="Cadastre o que você usa no trabalho e a Kleo avisa quando estiver acabando."
          />
        ) : (
          ordenados.map(i => {
            const baixo = i.qtd <= i.min
            return (
              <div key={i.id} className={saindo(i.id) ? 'item-out' : undefined} style={styles.item}>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <p style={styles.nome}>{i.nome}</p>
                  <div style={styles.meta}>
                    {baixo && (
                      <Tag cor="lima" icone={AlertTriangle}>
                        Repor
                      </Tag>
                    )}
                    {!simples && (
                      <span style={styles.min}>
                        mínimo {fmt(i.min)} {i.unidade}
                      </span>
                    )}
                  </div>
                </div>
                <BotaoIcone
                  icone={Minus}
                  label={`Tirar 1 de ${i.nome}`}
                  variante="branco"
                  onClick={() => mudarQtd(i.id, -1)}
                />
                <span key={i.qtd} className="valor-muda" style={styles.qtd}>
                  {fmt(i.qtd)}
                  <small style={styles.un}> {i.unidade}</small>
                </span>
                <BotaoIcone
                  icone={Plus}
                  label={`Somar 1 em ${i.nome}`}
                  variante="lavanda"
                  onClick={() => mudarQtd(i.id, 1)}
                />
                {!simples && (
                  <BotaoIcone icone={Trash2} label={`Apagar ${i.nome}`} onClick={() => remover(i.id)} />
                )}
              </div>
            )
          })
        )}
      </Card>

      <Botao variante="primario" icone={Plus} grande={simples} cheio onClick={() => setAberto(true)}>
        Novo item
      </Botao>

      <Sheet
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={`Novo item de ${rotulo.toLowerCase()}`}
      >
        <form onSubmit={salvarItem} style={styles.form}>
          <Entrada
            rotulo="Nome"
            placeholder="Ex: Luvas descartáveis"
            value={form.nome}
            onChange={e =>
              setForm(f => ({
                ...f,
                nome: e.target.value,
              }))
            }
            altura={h}
          />
          <div
            style={{
              display: 'flex',
              gap: 10,
            }}
          >
            <Entrada
              rotulo="Quantidade"
              inputMode="decimal"
              placeholder="0"
              value={form.qtd}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  qtd: e.target.value,
                }))
              }
              altura={h}
            />
            <Entrada
              rotulo="Mínimo"
              inputMode="decimal"
              placeholder="0"
              value={form.min}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  min: e.target.value,
                }))
              }
              altura={h}
            />
            <Entrada
              rotulo="Unidade"
              placeholder="un"
              value={form.unidade}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  unidade: e.target.value,
                }))
              }
              altura={h}
            />
          </div>
          <Rotulo
            style={{
              marginBottom: 0,
            }}
          >
            Quando chegar no mínimo, aparece o alerta de reposição.
          </Rotulo>
          <Botao variante="primario" icone={Check} grande cheio type="submit" disabled={!form.nome.trim()}>
            Salvar item
          </Botao>
        </form>
      </Sheet>
    </Coluna>
  )
}
const styles = {
  topo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  topoIcone: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topoTitulo: {
    fontSize: 22,
    fontWeight: 800,
    color: '#000',
    lineHeight: 1.1,
  },
  topoSub: {
    fontSize: 15,
    color: '#000',
    marginTop: 4,
  },
  aviso: {
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
    marginTop: 12,
    textAlign: 'center',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 0',
    borderTop: '1px solid var(--surface-2)',
  },
  nome: {
    fontSize: 16,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  min: {
    fontSize: 13,
    color: 'var(--text-3)',
  },
  qtd: {
    fontSize: 20,
    fontWeight: 800,
    minWidth: 44,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  un: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
}
