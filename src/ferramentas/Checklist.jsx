import { useState } from 'react'
import { Plus, RotateCcw, Trash2, PartyPopper, ListChecks } from 'lucide-react'
import { Card, Botao, BotaoIcone, Vazio } from '../components/ui'
import { useDados, useTam, novoId, hoje } from './comum'
import { Rotulo, Marca, Barra, Coluna, Entrada } from './pecas'
import useRemocao from '../components/profissao/useRemocao'
export default function Checklist({ config = {}, chave }) {
  const { simples, h, fonte } = useTam()
  const [dados, setDados] = useDados(chave, {
    extras: [],
    ocultos: [],
    feitos: {},
    dia: null,
  })
  const [texto, setTexto] = useState('')
  const d = dados && typeof dados === 'object' ? dados : {}
  const diaHoje = hoje()
  const base = (Array.isArray(config.itens) ? config.itens : []).map((t, i) => ({
    id: `p${i}`,
    texto: t,
    fixo: true,
  }))
  const itens = [...base, ...(Array.isArray(d.extras) ? d.extras : [])].filter(
    i => !(d.ocultos || []).includes(i.id),
  )
  const feitos = config.diario && d.dia !== diaHoje ? {} : d.feitos || {}
  const total = itens.length
  const prontos = itens.filter(i => feitos[i.id]).length
  const alternar = id =>
    setDados(a => {
      const atual = a || {}
      const f =
        config.diario && atual.dia !== diaHoje
          ? {}
          : {
              ...(atual.feitos || {}),
            }
      if (f[id]) delete f[id]
      else f[id] = true
      navigator.vibrate?.(15)
      return {
        ...atual,
        feitos: f,
        dia: diaHoje,
      }
    })
  const adicionar = e => {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setDados(a => ({
      ...(a || {}),
      extras: [
        ...((a || {}).extras || []),
        {
          id: 'u' + novoId(),
          texto: t,
        },
      ],
    }))
    setTexto('')
  }
  const reiniciar = () =>
    setDados(a => ({
      ...(a || {}),
      feitos: {},
      dia: diaHoje,
    }))
  const { saindo, remover } = useRemocao(id =>
    setDados(a => {
      const atual = a || {}
      if (/^p\d+$/.test(String(id)))
        return {
          ...atual,
          ocultos: [...(atual.ocultos || []), id],
        }
      return {
        ...atual,
        extras: (atual.extras || []).filter(x => x.id !== id),
      }
    }),
  )
  const restaurar = () =>
    setDados(a => ({
      ...(a || {}),
      ocultos: [],
    }))
  const completo = total > 0 && prontos === total
  return (
    <Coluna>
      <Card cor={completo ? 'lima' : 'lavanda'}>
        <div style={styles.topo}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <p style={styles.titulo}>{config.titulo || 'Checklist'}</p>
            <p style={styles.sub}>
              {completo
                ? 'Tudo pronto. Bom trabalho!'
                : `${prontos} de ${total} ${simples ? 'feitos' : 'itens concluídos'}`}
              {config.diario && !simples ? ' · reinicia todo dia' : ''}
            </p>
          </div>
          {completo && (
            <span className="anim-pop" style={styles.festa}>
              <PartyPopper size={26} color="#000" />
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 14,
          }}
        >
          <Barra progresso={total ? prontos / total : 0} cor="#000" />
        </div>
      </Card>

      <Card>
        {itens.length === 0 ? (
          <Vazio icone={ListChecks} titulo="Lista vazia" texto="Adicione o primeiro item abaixo." />
        ) : (
          <div className="stagger">
            {itens.map(i => (
              <div key={i.id} className={saindo(i.id) ? 'item-out' : undefined} style={styles.item}>
                <button
                  onClick={() => alternar(i.id)}
                  style={{
                    ...styles.itemBotao,
                    minHeight: h,
                  }}
                  aria-pressed={!!feitos[i.id]}
                >
                  <Marca feito={!!feitos[i.id]} tamanho={simples ? 32 : 26} />
                  <span
                    style={{
                      fontSize: fonte,
                      lineHeight: 1.35,
                      textDecoration: feitos[i.id] ? 'line-through' : 'none',
                      color: feitos[i.id] ? 'var(--text-3)' : 'var(--text)',
                      transition: 'color .25s ease',
                    }}
                  >
                    {i.texto}
                  </span>
                </button>
                {!simples && (
                  <BotaoIcone icone={Trash2} label={`Remover ${i.texto}`} onClick={() => remover(i.id)} />
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={adicionar} style={styles.form}>
          <Entrada
            placeholder="Adicionar item"
            aria-label="Novo item"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            altura={h}
          />
          <Botao variante="primario" icone={Plus} type="submit" disabled={!texto.trim()}>
            {simples ? 'Adicionar' : null}
          </Botao>
        </form>
      </Card>

      <div style={styles.acoes}>
        {prontos > 0 && (
          <Botao variante="fantasma" icone={RotateCcw} grande={simples} onClick={reiniciar}>
            Desmarcar tudo
          </Botao>
        )}
        {!simples && (d.ocultos || []).length > 0 && (
          <Botao variante="suave" onClick={restaurar}>
            Restaurar itens padrão
          </Botao>
        )}
      </div>
      {!simples && (
        <Rotulo
          style={{
            textAlign: 'center',
            marginBottom: 0,
          }}
        >
          Toque no item para marcar
        </Rotulo>
      )}
    </Coluna>
  )
}
const styles = {
  topo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 800,
    color: '#000',
    lineHeight: 1.1,
  },
  sub: {
    fontSize: 15,
    color: '#000',
    marginTop: 6,
  },
  festa: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderBottom: '1px solid var(--surface-2)',
  },
  itemBotao: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    textAlign: 'left',
    padding: '8px 0',
    minWidth: 0,
  },
  form: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
    marginTop: 14,
  },
  acoes: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
}
