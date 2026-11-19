import { useState } from 'react'
import { TrendingUp, TrendingDown, Trash2, Wallet } from 'lucide-react'
import { Card, Botao, BotaoIcone, Segmentado, Vazio } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { useDados, useTam, numero, reais, novoId, hoje, dataCurta, agoraMs } from './comum'
import { Coluna, Entrada, Grande, Rotulo } from './pecas'
export default function Caixa({ chave }) {
  const { simples, h } = useTam()
  const [dados, setDados] = useDados(chave, {
    movs: [],
  })
  const [periodo, setPeriodo] = useState('dia')
  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const dia = hoje()
  const mes = dia.slice(0, 7)
  const movs = Array.isArray(dados?.movs) ? dados.movs : []
  const doPeriodo = movs.filter(m => (periodo === 'dia' ? m.data === dia : m.data?.startsWith(mes)))
  const entradas = doPeriodo.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0)
  const saidas = doPeriodo.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0)
  const saldo = entradas - saidas
  const ordenados = [...doPeriodo].sort((a, b) => (b.ts || 0) - (a.ts || 0))
  const lancar = tipo => {
    const v = numero(valor)
    if (!(v > 0)) return
    const novo = {
      id: novoId(),
      tipo,
      desc: desc.trim() || (tipo === 'entrada' ? 'Entrada' : 'Saída'),
      valor: v,
      data: dia,
      ts: agoraMs(),
    }
    setDados(a => ({
      ...(a || {}),
      movs: [novo, ...((a || {}).movs || [])].slice(0, 2000),
    }))
    setDesc('')
    setValor('')
    navigator.vibrate?.(20)
  }
  const { saindo, remover } = useRemocao(id =>
    setDados(a => ({
      ...(a || {}),
      movs: ((a || {}).movs || []).filter(m => m.id !== id),
    })),
  )
  return (
    <Coluna>
      {!simples && (
        <Segmentado
          opcoes={[
            {
              id: 'dia',
              label: 'Hoje',
            },
            {
              id: 'mes',
              label: 'Este mês',
            },
          ]}
          valor={periodo}
          onChange={setPeriodo}
        />
      )}

      <Card cor={saldo >= 0 ? 'lima' : 'lavanda'} tamanho="g">
        <Grande
          rotulo={periodo === 'dia' ? 'Saldo de hoje' : 'Saldo do mês'}
          valor={reais(saldo)}
          tamanho={simples ? 46 : 42}
        />
        <div style={styles.resumo}>
          <span style={styles.resumoItem}>
            <TrendingUp size={16} /> Entrou {reais(entradas)}
          </span>
          <span style={styles.resumoItem}>
            <TrendingDown size={16} /> Saiu {reais(saidas)}
          </span>
        </div>
      </Card>

      <Card>
        <Rotulo>Novo lançamento</Rotulo>
        <div
          style={{
            display: 'flex',
            flexDirection: simples ? 'column' : 'row',
            gap: 10,
          }}
        >
          <Entrada
            placeholder="Descrição (ex: venda, material)"
            aria-label="Descrição"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            altura={h}
          />
          <Entrada
            placeholder="R$ 0,00"
            aria-label="Valor em reais"
            inputMode="decimal"
            value={valor}
            onChange={e => setValor(e.target.value)}
            altura={h}
            style={
              simples
                ? {
                    fontSize: 20,
                    fontWeight: 700,
                  }
                : {
                    width: 120,
                    fontWeight: 700,
                  }
            }
          />
        </div>
        <div style={styles.botoes}>
          <div
            style={{
              flex: 1,
            }}
          >
            <Botao
              variante="lima"
              icone={TrendingUp}
              grande={simples}
              cheio
              disabled={!(numero(valor) > 0)}
              onClick={() => lancar('entrada')}
            >
              Entrou
            </Botao>
          </div>
          <div
            style={{
              flex: 1,
            }}
          >
            <Botao
              variante="fantasma"
              icone={TrendingDown}
              grande={simples}
              cheio
              disabled={!(numero(valor) > 0)}
              onClick={() => lancar('saida')}
            >
              Saiu
            </Botao>
          </div>
        </div>
      </Card>

      <Card>
        <Rotulo>{periodo === 'dia' ? 'Movimentos de hoje' : 'Movimentos do mês'}</Rotulo>
        {ordenados.length === 0 ? (
          <Vazio
            icone={Wallet}
            titulo="Nada lançado ainda"
            texto="Registre o que entra e o que sai para ver seu saldo."
          />
        ) : (
          ordenados.slice(0, simples ? 10 : 60).map(m => (
            <div key={m.id} className={saindo(m.id) ? 'item-out' : 'anim-left'} style={styles.mov}>
              <span
                style={{
                  ...styles.movTipo,
                  background: m.tipo === 'entrada' ? 'var(--lima)' : 'var(--surface-2)',
                }}
              >
                {m.tipo === 'entrada' ? (
                  <TrendingUp size={16} color="#000" />
                ) : (
                  <TrendingDown size={16} color="#000" />
                )}
              </span>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <p style={styles.movDesc}>{m.desc}</p>
                {periodo === 'mes' && <p style={styles.movData}>{dataCurta(m.data)}</p>}
              </div>
              <span
                style={{
                  ...styles.movValor,
                  color: m.tipo === 'entrada' ? 'var(--sucesso)' : 'var(--text)',
                }}
              >
                {m.tipo === 'entrada' ? '+' : '-'} {reais(m.valor)}
              </span>
              <BotaoIcone icone={Trash2} label={`Apagar ${m.desc}`} onClick={() => remover(m.id)} />
            </div>
          ))
        )}
      </Card>
    </Coluna>
  )
}
const styles = {
  resumo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px 16px',
    marginTop: 14,
  },
  resumoItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
  },
  botoes: {
    display: 'flex',
    gap: 10,
    marginTop: 12,
  },
  mov: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
    borderTop: '1px solid var(--surface-2)',
  },
  movTipo: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  movDesc: {
    fontSize: 16,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  movData: {
    fontSize: 13,
    color: 'var(--text-3)',
  },
  movValor: {
    fontSize: 16,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
}
