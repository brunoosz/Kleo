import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, X, Plus, Pencil, Trash2, Volume2, Eraser } from 'lucide-react'
import Tela from './Tela'
import { Botao, BotaoIcone, Campo, Modal } from './ui'
import { falar } from '../lib/voz'
export default function NotasLista({
  nome,
  itens,
  alvo,
  grande,
  simples,
  falarAcoes,
  onAtualizar,
  onRenomear,
  onExcluir,
}) {
  const [novo, setNovo] = useState('')
  const [editandoNome, setEditandoNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(nome)
  const [erroNome, setErroNome] = useState('')
  const [confirmarExcluir, setConfirmarExcluir] = useState(false)
  const inputRef = useRef(null)
  const [removendo, setRemovendo] = useState([])
  const [recentes, setRecentes] = useState([])
  const [adiado, setAdiado] = useState({})
  const itensRef = useRef(itens)
  const cardRef = useRef(null)
  const posicoes = useRef(new Map())
  useEffect(() => {
    itensRef.current = itens
  })
  const feitos = itens.filter(i => i.feito).length
  const pendentes = itens.filter(i => !i.feito)
  const concluidos = itens.filter(i => i.feito)
  const feitoNaOrdem = i => (i.id in adiado ? adiado[i.id] : i.feito)
  const ordenados = [...itens.filter(i => !feitoNaOrdem(i)), ...itens.filter(i => feitoNaOrdem(i))]
  const ordem = ordenados.map(i => i.id).join('|')
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const base = card.getBoundingClientRect().top
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const novas = new Map()
    const els = [...card.querySelectorAll('[data-item]')]
    const houveRemocao = [...posicoes.current.keys()].some(id => !els.some(el => el.dataset.item === id))
    els.forEach(el => {
      const id = el.dataset.item
      const topo = el.getBoundingClientRect().top - base
      const antes = posicoes.current.get(id)
      if (!houveRemocao && !reduzir && antes !== undefined && Math.abs(antes - topo) > 1 && el.animate) {
        el.animate(
          [
            {
              transform: `translateY(${antes - topo}px)`,
            },
            {
              transform: 'none',
            },
          ],
          {
            duration: 420,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          },
        )
      }
      novas.set(id, topo)
    })
    posicoes.current = novas
  }, [ordem])
  function adicionar() {
    const texto = novo.trim()
    if (!texto) return
    const id = Date.now() + Math.random()
    onAtualizar([
      ...itens,
      {
        id,
        texto,
        feito: false,
      },
    ])
    setRecentes(r => [...r, id])
    setTimeout(() => setRecentes(r => r.filter(x => x !== id)), 700)
    setNovo('')
    inputRef.current?.focus()
  }
  function alternar(id) {
    const item = itens.find(i => i.id === id)
    if (item) {
      setAdiado(a =>
        id in a
          ? a
          : {
              ...a,
              [id]: item.feito,
            },
      )
      setTimeout(
        () =>
          setAdiado(a => {
            const c = {
              ...a,
            }
            delete c[id]
            return c
          }),
        450,
      )
    }
    onAtualizar(
      itens.map(i =>
        i.id === id
          ? {
              ...i,
              feito: !i.feito,
            }
          : i,
      ),
    )
    if ((falarAcoes || simples) && item)
      falar(item.feito ? `${item.texto} desmarcado` : `${item.texto} concluído`)
  }
  function removerComAnimacao(ids) {
    setRemovendo(r => [...r, ...ids])
    setTimeout(() => {
      onAtualizar(itensRef.current.filter(i => !ids.includes(i.id)))
      setRemovendo(r => r.filter(x => !ids.includes(x)))
    }, 300)
  }
  function excluirItem(id) {
    if (!removendo.includes(id)) removerComAnimacao([id])
  }
  function salvarNome() {
    const ok = onRenomear(nomeTemp.trim())
    if (ok === true) {
      setEditandoNome(false)
      setErroNome('')
    } else setErroNome(typeof ok === 'string' ? ok : 'Não foi possível renomear.')
  }
  function lerLista() {
    if (!itens.length) {
      falar(`A lista ${nome} está vazia.`, {
        forcar: true,
      })
      return
    }
    const partes = []
    if (pendentes.length) partes.push(`Falta: ${pendentes.map(i => i.texto).join(', ')}.`)
    if (concluidos.length) partes.push(`Já concluído: ${concluidos.map(i => i.texto).join(', ')}.`)
    falar(`Lista ${nome}. ${partes.join(' ')}`, {
      forcar: true,
    })
  }
  const progresso = itens.length ? feitos / itens.length : 0
  return (
    <Tela
      voltar
      acoes={
        <>
          {!simples && <BotaoIcone icone={Volume2} label="Ler lista em voz alta" onClick={lerLista} />}
          <BotaoIcone
            icone={Pencil}
            label="Renomear lista"
            onClick={() => {
              setNomeTemp(nome)
              setEditandoNome(true)
            }}
          />
        </>
      }
    >
      <div className="anim-right">
        {editandoNome ? (
          <div className="anim-scale" style={styles.renomear}>
            <Campo
              autoFocus
              value={nomeTemp}
              onChange={e => {
                setNomeTemp(e.target.value)
                setErroNome('')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') salvarNome()
                if (e.key === 'Escape') setEditandoNome(false)
              }}
              aria-label="Novo nome da lista"
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            />
            <div style={styles.linhaBotoes}>
              <Botao
                variante="fantasma"
                cheio
                onClick={() => setEditandoNome(false)}
                style={{
                  flex: 1,
                }}
              >
                Cancelar
              </Botao>
              <Botao
                cheio
                onClick={salvarNome}
                style={{
                  flex: 1,
                }}
              >
                Salvar
              </Botao>
            </div>
            {erroNome && (
              <p key={erroNome} className="shake" style={styles.erro} role="alert">
                {erroNome}
              </p>
            )}
          </div>
        ) : (
          <h1
            className="anim-fade"
            style={{
              ...styles.titulo,
              fontSize: simples ? 36 : 40,
            }}
          >
            {nome}
          </h1>
        )}

        <div
          style={{
            ...styles.resumo,
            background: progresso === 1 ? 'var(--lima)' : 'var(--surface)',
          }}
          className="kleo-card"
        >
          <div style={styles.resumoTopo}>
            <span style={styles.contador}>
              <span key={feitos} className="valor-muda" style={styles.numero}>
                {feitos}
              </span>
              <span style={styles.contadorDe}>
                {' '}
                de {itens.length} {simples ? 'feitos' : 'concluídos'}
              </span>
            </span>
            {feitos > 0 && !simples && (
              <button
                type="button"
                className="anim-pop tap"
                onClick={() =>
                  removerComAnimacao(concluidos.map(i => i.id).filter(id => !removendo.includes(id)))
                }
                style={{
                  ...styles.limpar,
                  minHeight: 40,
                }}
              >
                <Eraser size={15} /> Limpar feitos
              </button>
            )}
          </div>
          <div
            style={{
              ...styles.trilho,
              background: progresso === 1 ? 'rgba(0,0,0,0.12)' : 'var(--surface-2)',
            }}
          >
            <div
              style={{
                ...styles.barra,
                width: `${progresso * 100}%`,
              }}
            />
          </div>
        </div>

        {simples && (
          <div
            style={{
              marginTop: 14,
            }}
          >
            <Botao variante="fantasma" icone={Volume2} cheio onClick={lerLista}>
              Ouvir a lista
            </Botao>
          </div>
        )}

        <div ref={cardRef} style={styles.card} className="kleo-card">
          {ordenados.map(item => (
            <ItemLista
              key={item.id}
              item={item}
              alvo={alvo}
              grande={grande}
              simples={simples}
              saindo={removendo.includes(item.id)}
              novo={recentes.includes(item.id)}
              onAlternar={() => alternar(item.id)}
              onExcluir={() => excluirItem(item.id)}
            />
          ))}

          <div
            style={{
              ...styles.linhaNovo,
              minHeight: alvo + 12,
            }}
          >
            <span style={styles.circuloNovo}>
              <Plus size={17} color="#000" strokeWidth={2.6} />
            </span>
            <input
              ref={inputRef}
              value={novo}
              onChange={e => setNovo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') adicionar()
              }}
              placeholder={simples ? 'Escreva um item' : 'Adicionar item'}
              aria-label="Adicionar item"
              style={{
                ...styles.inputNovo,
                fontSize: grande ? 19 : 17,
              }}
            />
            {(novo.trim() || simples) && (
              <span
                className="anim-pop"
                style={{
                  display: 'flex',
                }}
              >
                <Botao
                  variante="lima"
                  onClick={adicionar}
                  disabled={!novo.trim()}
                  style={{
                    padding: '8px 16px',
                  }}
                >
                  Adicionar
                </Botao>
              </span>
            )}
          </div>
        </div>

        {itens.length === 0 && (
          <p className="anim-fade" style={styles.dica}>
            Digite acima ou diga à Kleo: "coloca pão na lista {nome.toLowerCase()}".
          </p>
        )}

        <div
          style={{
            marginTop: 28,
          }}
        >
          <Botao
            variante="fantasma"
            icone={Trash2}
            cheio
            onClick={() => setConfirmarExcluir(true)}
            style={{
              color: 'var(--erro)',
            }}
          >
            {simples ? 'Apagar lista' : 'Excluir lista'}
          </Botao>
        </div>
      </div>

      <Modal
        aberto={confirmarExcluir}
        onFechar={() => setConfirmarExcluir(false)}
        titulo={`${simples ? 'Apagar' : 'Excluir'} a lista ${nome}?`}
        texto={itens.length ? `Os ${itens.length} itens dela também vão sumir.` : 'A lista está vazia.'}
        acoes={[
          {
            label: 'Manter',
            variante: 'fantasma',
            onClick: () => setConfirmarExcluir(false),
          },
          {
            label: simples ? 'Apagar' : 'Excluir',
            variante: 'perigo',
            onClick: () => {
              setConfirmarExcluir(false)
              onExcluir()
            },
          },
        ]}
      />
    </Tela>
  )
}
function ItemLista({ item, alvo, grande, simples, saindo, novo, onAlternar, onExcluir }) {
  const [dx, setDx] = useState(0)
  const [pulsando, setPulsando] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const inicio = useRef(null)
  const arrastou = useRef(false)
  const LIMITE = 96
  const caixa = grande ? 30 : 26
  function baixo(e) {
    inicio.current = {
      x: e.clientX,
      y: e.clientY,
      ativo: false,
    }
    arrastou.current = false
  }
  function mover(e) {
    const s = inicio.current
    if (!s) return
    const mx = e.clientX - s.x
    if (!s.ativo && Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(e.clientY - s.y)) {
      s.ativo = true
      setArrastando(true)
    }
    if (s.ativo) setDx(Math.min(0, Math.max(-160, mx)))
  }
  function soltar() {
    if (inicio.current?.ativo) arrastou.current = true
    if (dx < -LIMITE) onExcluir()
    else setDx(0)
    inicio.current = null
    setArrastando(false)
  }
  function tocar() {
    setPulsando(true)
    onAlternar()
  }
  const gestos = simples
    ? {}
    : {
        onPointerDown: baixo,
        onPointerMove: mover,
        onPointerUp: soltar,
        onPointerCancel: soltar,
        onClickCapture: e => {
          if (arrastou.current) {
            e.stopPropagation()
            arrastou.current = false
          }
        },
      }
  return (
    <div
      data-item={item.id}
      className={saindo ? 'item-out' : novo ? 'anim-up' : undefined}
      style={styles.itemWrap}
    >
      {!simples && (
        <div
          style={{
            ...styles.fundoExcluir,
            opacity: dx < -20 ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <Trash2 size={18} /> Excluir
        </div>
      )}
      <div
        style={{
          ...styles.item,
          minHeight: alvo + 10,
          transform: `translateX(${dx}px)`,
          transition: arrastando ? 'none' : 'transform 0.25s ease',
        }}
        {...gestos}
      >
        <button
          type="button"
          onClick={tocar}
          role="checkbox"
          aria-checked={item.feito}
          aria-label={item.texto}
          style={{
            ...styles.checkArea,
            width: alvo,
            height: alvo,
          }}
        >
          <span
            className={pulsando ? 'check-pop' : undefined}
            onAnimationEnd={() => setPulsando(false)}
            style={{
              ...styles.check,
              width: caixa,
              height: caixa,
            }}
          >
            <span
              style={{
                ...styles.checkFill,
                transform: item.feito ? 'scale(1)' : 'scale(0)',
              }}
            />
            <span
              style={{
                ...styles.checkIcone,
                opacity: item.feito ? 1 : 0,
                transform: item.feito ? 'scale(1)' : 'scale(0.4)',
              }}
            >
              <Check size={grande ? 18 : 16} color="var(--lima)" strokeWidth={3.2} />
            </span>
          </span>
        </button>
        <span
          onClick={tocar}
          style={{
            ...styles.textoItem,
            fontSize: grande ? 19 : 17,
            color: item.feito ? 'var(--text-3)' : '#000',
          }}
        >
          <span
            style={{
              ...styles.risco,
              backgroundSize: item.feito ? '100% 2px' : '0% 2px',
            }}
          >
            {item.texto}
          </span>
        </span>
        <button
          type="button"
          onClick={onExcluir}
          aria-label={`Excluir ${item.texto}`}
          style={{
            ...styles.btnX,
            width: alvo,
            height: alvo,
          }}
        >
          <X size={grande ? 20 : 17} color="var(--text-3)" />
        </button>
      </div>
    </div>
  )
}
const styles = {
  titulo: {
    fontWeight: 800,
    lineHeight: 1,
    marginTop: 6,
    wordBreak: 'break-word',
  },
  renomear: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
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
  resumo: {
    marginTop: 18,
    padding: '16px 18px',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    transition: 'background 0.35s ease',
  },
  resumoTopo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  contador: {
    fontSize: 16,
    color: '#000',
  },
  numero: {
    display: 'inline-block',
    fontSize: 28,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  contadorDe: {
    color: 'var(--text-2)',
    fontWeight: 600,
  },
  limpar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#000',
    fontSize: 14,
    fontWeight: 600,
    padding: '0 14px',
    borderRadius: 'var(--r-badge)',
    background: 'var(--surface-2)',
  },
  trilho: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  barra: {
    height: '100%',
    borderRadius: 8,
    background: '#000',
    transition: 'width 0.5s var(--ease-out)',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    overflow: 'hidden',
    padding: '6px 0',
    boxShadow: 'var(--sombra)',
    marginTop: 14,
  },
  itemWrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  fundoExcluir: {
    position: 'absolute',
    inset: 0,
    background: 'var(--erro)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingRight: 20,
    fontWeight: 600,
    fontSize: 15,
    transition: 'opacity 0.15s',
  },
  item: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 8px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--surface-2)',
    touchAction: 'pan-y',
  },
  checkArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  check: {
    position: 'relative',
    borderRadius: 9,
    border: '2px solid #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'var(--surface)',
  },
  checkFill: {
    position: 'absolute',
    inset: 0,
    background: '#000',
    transition: 'transform 0.3s var(--spring)',
  },
  checkIcone: {
    position: 'relative',
    display: 'flex',
    transition: 'opacity 0.2s ease 0.08s, transform 0.3s var(--spring) 0.08s',
  },
  textoItem: {
    flex: 1,
    lineHeight: 1.35,
    padding: '10px 0',
    cursor: 'pointer',
    wordBreak: 'break-word',
    transition: 'color 0.3s',
  },
  risco: {
    backgroundImage: 'linear-gradient(currentColor, currentColor)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 55%',
    transition: 'background-size 0.35s var(--ease-out)',
  },
  btnX: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '50%',
  },
  linhaNovo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 10px 6px 18px',
  },
  circuloNovo: {
    width: 28,
    height: 28,
    borderRadius: 9,
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 2,
  },
  inputNovo: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#000',
    padding: '12px 0',
    minWidth: 0,
  },
  dica: {
    color: 'var(--text-3)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 1.45,
  },
}
