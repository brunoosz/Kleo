import { useState } from 'react'
import { Plus, Trash2, Share2, Save, FileText, FilePlus2, Check } from 'lucide-react'
import { Card, Botao, BotaoIcone, Vazio } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { ler } from '../lib/storage'
import {
  useDados,
  useTam,
  numero,
  reais,
  novoId,
  fmt,
  compartilhar,
  dataCurta,
  hoje,
  nomeProfissao,
} from './comum'
import { Coluna, Entrada, Rotulo, Grande } from './pecas'
const VAZIO = {
  cliente: '',
  itens: [],
  desconto: '',
  obs: '',
}
export default function Orcamento({ config = {}, profissao, chave }) {
  const { simples, h } = useTam()
  const [dados, setDados] = useDados(chave, {
    atual: VAZIO,
    salvos: [],
  })
  const [item, setItem] = useState({
    desc: '',
    qtd: '1',
    preco: '',
  })
  const [aviso, setAviso] = useState('')
  const rotulo = config.rotulo || 'Orçamento'
  const atual = {
    ...VAZIO,
    ...(dados?.atual || {}),
  }
  const salvos = Array.isArray(dados?.salvos) ? dados.salvos : []
  const subtotal = atual.itens.reduce((s, i) => s + i.qtd * i.preco, 0)
  const desconto = Math.min(100, Math.max(0, numero(atual.desconto) || 0))
  const total = subtotal * (1 - desconto / 100)
  const mudarAtual = patch =>
    setDados(a => ({
      ...(a || {}),
      atual: {
        ...VAZIO,
        ...((a || {}).atual || {}),
        ...patch,
      },
    }))
  const adicionar = e => {
    e.preventDefault()
    const preco = numero(item.preco)
    if (!item.desc.trim() || !(preco >= 0)) return
    const novo = {
      id: novoId(),
      desc: item.desc.trim(),
      qtd: numero(item.qtd) > 0 ? numero(item.qtd) : 1,
      preco,
    }
    mudarAtual({
      itens: [...atual.itens, novo],
    })
    setItem({
      desc: '',
      qtd: '1',
      preco: '',
    })
  }
  const { saindo, remover } = useRemocao(id =>
    setDados(a => {
      const at = {
        ...VAZIO,
        ...((a || {}).atual || {}),
      }
      return {
        ...(a || {}),
        atual: {
          ...at,
          itens: at.itens.filter(i => i.id !== id),
        },
      }
    }),
  )
  const texto = () => {
    const nomeUsuario = ler('kleo_profile', {})?.name || ''
    const prof = nomeProfissao(profissao)
    const linhas = [
      `*${rotulo}*${atual.cliente ? ` para ${atual.cliente}` : ''}`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      ...atual.itens.map(i => `- ${i.desc}: ${fmt(i.qtd)} x ${reais(i.preco)} = ${reais(i.qtd * i.preco)}`),
      '',
      desconto ? `Subtotal: ${reais(subtotal)}\nDesconto: ${fmt(desconto)}%` : null,
      `*Total: ${reais(total)}*`,
      atual.obs ? `\nObservações: ${atual.obs}` : null,
      nomeUsuario ? `\n${nomeUsuario}${prof ? ` - ${prof}` : ''}` : null,
    ].filter(l => l !== null)
    return linhas.join('\n')
  }
  const enviar = async () => {
    const r = await compartilhar(rotulo, texto())
    if (r === 'copiado') {
      setAviso('Texto copiado. É só colar no WhatsApp.')
      setTimeout(() => setAviso(''), 3000)
    }
  }
  const salvar = () => {
    if (!atual.itens.length) return
    setDados(a => ({
      ...(a || {}),
      salvos: [
        {
          ...atual,
          id: novoId(),
          total,
          data: hoje(),
        },
        ...((a || {}).salvos || []),
      ].slice(0, 30),
    }))
    setAviso(`${rotulo} salvo.`)
    setTimeout(() => setAviso(''), 2500)
  }
  const novo = () =>
    mudarAtual({
      ...VAZIO,
    })
  const abrir = s =>
    setDados(a => ({
      ...(a || {}),
      atual: {
        cliente: s.cliente,
        itens: s.itens,
        desconto: s.desconto,
        obs: s.obs,
      },
    }))
  const apagarSalvo = id =>
    setDados(a => ({
      ...(a || {}),
      salvos: ((a || {}).salvos || []).filter(s => s.id !== id),
    }))
  return (
    <Coluna>
      <Card>
        <Entrada
          rotulo="Para quem"
          placeholder="Nome do cliente"
          value={atual.cliente}
          onChange={e =>
            mudarAtual({
              cliente: e.target.value,
            })
          }
          altura={h}
        />

        <div
          style={{
            marginTop: 16,
          }}
        >
          {atual.itens.length === 0 ? (
            <Vazio icone={FileText} titulo="Sem itens ainda" texto="Adicione serviços ou produtos abaixo." />
          ) : (
            atual.itens.map(i => (
              <div key={i.id} className={saindo(i.id) ? 'item-out' : 'anim-left'} style={styles.item}>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <p style={styles.itemDesc}>{i.desc}</p>
                  <p style={styles.itemConta}>
                    {fmt(i.qtd)} x {reais(i.preco)}
                  </p>
                </div>
                <span style={styles.itemTotal}>{reais(i.qtd * i.preco)}</span>
                <BotaoIcone icone={Trash2} label={`Remover ${i.desc}`} onClick={() => remover(i.id)} />
              </div>
            ))
          )}
        </div>

        <form onSubmit={adicionar} style={styles.form}>
          <Rotulo
            style={{
              marginBottom: 0,
            }}
          >
            Adicionar item
          </Rotulo>
          <Entrada
            placeholder="Serviço ou produto"
            aria-label="Descrição do item"
            value={item.desc}
            onChange={e =>
              setItem(x => ({
                ...x,
                desc: e.target.value,
              }))
            }
            altura={h}
          />
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
            }}
          >
            <Entrada
              rotulo="Qtd."
              inputMode="decimal"
              value={item.qtd}
              onChange={e =>
                setItem(x => ({
                  ...x,
                  qtd: e.target.value,
                }))
              }
              altura={h}
              style={{
                width: 80,
              }}
            />
            <Entrada
              rotulo="Preço (R$)"
              inputMode="decimal"
              placeholder="0,00"
              value={item.preco}
              onChange={e =>
                setItem(x => ({
                  ...x,
                  preco: e.target.value,
                }))
              }
              altura={h}
            />
            <Botao variante="primario" icone={Plus} type="submit" disabled={!item.desc.trim() || !item.preco}>
              {simples ? 'Pôr' : null}
            </Botao>
          </div>
        </form>

        {!simples && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 14,
            }}
          >
            <Entrada
              rotulo="Desconto (%)"
              inputMode="decimal"
              placeholder="0"
              value={atual.desconto}
              onChange={e =>
                mudarAtual({
                  desconto: e.target.value,
                })
              }
              altura={h}
              style={{
                width: 110,
              }}
            />
            <Entrada
              rotulo="Observações"
              placeholder="Prazo, garantia, forma de pagamento"
              value={atual.obs}
              onChange={e =>
                mudarAtual({
                  obs: e.target.value,
                })
              }
              altura={h}
            />
          </div>
        )}
      </Card>

      <Card cor="lima" tamanho="g">
        <Grande
          rotulo={`Total do ${rotulo.toLowerCase()}`}
          valor={reais(total)}
          tamanho={simples ? 46 : 42}
        />
        {desconto > 0 && (
          <p style={styles.sub}>
            Subtotal {reais(subtotal)} com {fmt(desconto)}% de desconto
          </p>
        )}
        <div style={styles.acoes}>
          <div
            style={{
              flex: 1,
            }}
          >
            <Botao
              variante="primario"
              icone={Share2}
              grande={simples}
              cheio
              disabled={!atual.itens.length}
              onClick={enviar}
            >
              Enviar
            </Botao>
          </div>
          {!simples && (
            <BotaoIcone
              icone={Save}
              label={`Salvar ${rotulo.toLowerCase()}`}
              variante="branco"
              onClick={salvar}
            />
          )}
          {!simples && (
            <BotaoIcone
              icone={FilePlus2}
              label={`Novo ${rotulo.toLowerCase()}`}
              variante="branco"
              onClick={novo}
            />
          )}
        </div>
        {aviso && (
          <p className="anim-pop" style={styles.aviso} role="status">
            <Check size={16} /> {aviso}
          </p>
        )}
      </Card>

      {!simples && salvos.length > 0 && (
        <Card>
          <Rotulo>Salvos</Rotulo>
          {salvos.map(s => (
            <div key={s.id} style={styles.item}>
              <button onClick={() => abrir(s)} className="tap" style={styles.salvo}>
                <p style={styles.itemDesc}>{s.cliente || 'Sem nome'}</p>
                <p style={styles.itemConta}>
                  {dataCurta(s.data)} · {s.itens.length} {s.itens.length === 1 ? 'item' : 'itens'}
                </p>
              </button>
              <span style={styles.itemTotal}>{reais(s.total)}</span>
              <BotaoIcone icone={Trash2} label="Apagar salvo" onClick={() => apagarSalvo(s.id)} />
            </div>
          ))}
        </Card>
      )}
    </Coluna>
  )
}
const styles = {
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderTop: '1px solid var(--surface-2)',
  },
  itemDesc: {
    fontSize: 16,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemConta: {
    fontSize: 13,
    color: 'var(--text-3)',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 16,
    padding: 16,
    borderRadius: 25,
    background: 'var(--surface-2)',
  },
  sub: {
    fontSize: 15,
    color: '#000',
    marginTop: 6,
  },
  acoes: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  aviso: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
    marginTop: 12,
  },
  salvo: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    padding: '4px 0',
  },
}
