import { useState } from 'react'
import { Minus, Plus, RotateCcw, Hash } from 'lucide-react'
import { Card, Botao, BotaoIcone, Modal } from '../components/ui'
import { useDados, useTam, hoje } from './comum'
import { Coluna, Entrada } from './pecas'
const CORES = ['var(--lavanda)', 'var(--lima)', 'var(--ceu)', 'var(--surface-2)', 'var(--lavanda-forte)']
export default function Contador({ config = {}, chave }) {
  const { simples, h } = useTam()
  const [dados, setDados] = useDados(chave, {
    contagens: {},
    extras: [],
    dia: hoje(),
  })
  const [novo, setNovo] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const d = dados && typeof dados === 'object' ? dados : {}
  const diaHoje = hoje()
  const contagens = config.diario && d.dia !== diaHoje ? {} : d.contagens || {}
  const base =
    Array.isArray(config.itens) && config.itens.length ? config.itens : [config.rotulo || 'Contagem']
  const itens = [...base, ...(Array.isArray(d.extras) ? d.extras : [])]
  const total = itens.reduce((s, i) => s + (contagens[i] || 0), 0)
  const somar = (item, delta) => {
    navigator.vibrate?.(delta > 0 ? 25 : 10)
    setDados(a => {
      const atual = a || {}
      const c =
        config.diario && atual.dia !== diaHoje
          ? {}
          : {
              ...(atual.contagens || {}),
            }
      c[item] = Math.max(0, (c[item] || 0) + delta)
      return {
        ...atual,
        contagens: c,
        dia: diaHoje,
      }
    })
  }
  const adicionar = e => {
    e.preventDefault()
    const t = novo.trim()
    if (!t || itens.includes(t)) return
    setDados(a => ({
      ...(a || {}),
      extras: [...((a || {}).extras || []), t],
    }))
    setNovo('')
  }
  const zerar = () => {
    setDados(a => ({
      ...(a || {}),
      contagens: {},
      dia: diaHoje,
    }))
    setConfirmar(false)
  }
  return (
    <Coluna>
      {itens.length > 1 && (
        <Card cor="branco">
          <div style={styles.total}>
            <span style={styles.totalRot}>
              {config.rotulo ? `Total de ${config.rotulo.toLowerCase()}` : 'Total'}
            </span>
            <span key={total} className="valor-muda" style={styles.totalNum}>
              {total}
            </span>
          </div>
        </Card>
      )}

      <div
        style={{
          ...styles.grade,
          gridTemplateColumns: simples || itens.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        {itens.map((item, i) => (
          <div
            key={item}
            style={{
              ...styles.bloco,
              background: CORES[i % CORES.length],
            }}
            className="anim-pop"
          >
            <button
              onClick={() => somar(item, 1)}
              style={{
                ...styles.toque,
                minHeight: simples ? 150 : 132,
              }}
              aria-label={`Somar 1 em ${item}. Agora: ${contagens[item] || 0}`}
            >
              <span style={styles.itemNome}>{item}</span>
              <span
                key={contagens[item] || 0}
                className="valor-muda"
                style={{
                  ...styles.num,
                  fontSize: simples ? 64 : 54,
                }}
              >
                {contagens[item] || 0}
              </span>
              <span style={styles.dica}>
                <Plus size={14} /> toque para somar
              </span>
            </button>
            <div style={styles.menos}>
              <BotaoIcone
                icone={Minus}
                label={`Tirar 1 de ${item}`}
                variante="branco"
                onClick={() => somar(item, -1)}
              />
            </div>
          </div>
        ))}
      </div>

      {!simples && (
        <form onSubmit={adicionar} style={styles.form}>
          <Entrada
            placeholder="Novo contador"
            aria-label="Nome do novo contador"
            value={novo}
            onChange={e => setNovo(e.target.value)}
            altura={h}
          />
          <Botao variante="fantasma" icone={Hash} type="submit" disabled={!novo.trim()}>
            Criar
          </Botao>
        </form>
      )}

      {total > 0 && (
        <Botao variante="fantasma" icone={RotateCcw} grande={simples} onClick={() => setConfirmar(true)}>
          Zerar tudo
        </Botao>
      )}

      <Modal
        aberto={confirmar}
        onFechar={() => setConfirmar(false)}
        titulo="Zerar contadores?"
        texto="Todos os números voltam para zero."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setConfirmar(false),
          },
          {
            label: 'Zerar',
            variante: 'perigo',
            onClick: zerar,
          },
        ]}
      />
    </Coluna>
  )
}
const styles = {
  total: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalRot: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-2)',
  },
  totalNum: {
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1,
  },
  grade: {
    display: 'grid',
    gap: 12,
  },
  bloco: {
    position: 'relative',
    borderRadius: 30,
    boxShadow: 'var(--sombra)',
    overflow: 'hidden',
  },
  toque: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    textAlign: 'left',
    color: '#000',
  },
  itemNome: {
    fontSize: 17,
    fontWeight: 700,
    paddingRight: 50,
    lineHeight: 1.2,
  },
  num: {
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    margin: '8px 0',
  },
  dica: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: 'rgba(0,0,0,0.65)',
  },
  menos: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  form: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
  },
}
