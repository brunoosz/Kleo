import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Check, Sparkles } from 'lucide-react'
import Mascote from './Mascote'
import { Sheet, Campo, Chip, Botao, Vazio } from './ui'
import { MASCOTES_ESPECIAIS } from '../data/mascotes'
import { CATEGORIAS, PROFISSOES, buscarProfissoes } from '../data/profissoes'
const POR_PAGINA = 12
const normalizar = t => (t || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const ESPECIAIS = MASCOTES_ESPECIAIS.map(m => ({
  id: m.id,
  nome: m.nome,
  sub: m.descricao,
  categoria: 'especiais',
}))
const DE_PROFISSOES = PROFISSOES.map(p => ({
  id: p.id,
  nome: p.mascote?.nome || p.label,
  sub: p.label,
  categoria: p.categoria,
}))
export default function MascExplorar({ aberto, onFechar, selecionado, onEscolher, simples }) {
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const sentinela = useRef(null)
  const lista = useMemo(() => {
    const q = busca.trim()
    let profs = DE_PROFISSOES
    let esp = ESPECIAIS
    if (q) {
      const achadas = new Set(buscarProfissoes(q).map(p => p.id))
      const nq = normalizar(q)
      profs = DE_PROFISSOES.filter(m => achadas.has(m.id) || normalizar(m.nome).includes(nq))
      esp = ESPECIAIS.filter(m => normalizar(m.nome + ' ' + m.sub).includes(nq))
    }
    if (cat === 'especiais') return esp
    if (cat !== 'todos') return profs.filter(m => m.categoria === cat)
    return [...esp, ...profs]
  }, [busca, cat])
  const visiveis = lista.slice(0, pagina * POR_PAGINA)
  const temMais = visiveis.length < lista.length
  useEffect(() => {
    const el = sentinela.current
    if (!el || !temMais || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ents => {
        if (ents.some(e => e.isIntersecting)) setPagina(p => p + 1)
      },
      {
        rootMargin: '200px',
      },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [temMais, visiveis.length])
  function filtrar(id) {
    setCat(id)
    setPagina(1)
  }
  function buscar(v) {
    setBusca(v)
    setPagina(1)
  }
  const filtros = [
    {
      id: 'todos',
      nome: 'Todos',
      icone: null,
      cor: 'branco',
    },
    {
      id: 'especiais',
      nome: 'Especiais',
      icone: Sparkles,
      cor: 'lavanda',
    },
    ...CATEGORIAS,
  ]
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Todos os mascotes" altura="88vh">
      <div style={styles.topo}>
        <Campo
          icone={Search}
          placeholder="Buscar: ex. chef, piloto"
          aria-label="Buscar mascote"
          value={busca}
          onChange={e => buscar(e.target.value)}
          enterKeyHint="search"
        />
        <div style={styles.filtros} role="group" aria-label="Filtrar por categoria">
          {filtros.map(f => (
            <Chip key={f.id} ativo={cat === f.id} cor={f.cor} icone={f.icone} onClick={() => filtrar(f.id)}>
              {f.nome}
            </Chip>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <Vazio
          icone={Search}
          titulo="Nenhum mascote"
          texto="Tente outra palavra ou categoria."
          acao={{
            label: 'Limpar busca',
            onClick: () => {
              buscar('')
              filtrar('todos')
            },
          }}
        />
      ) : (
        <>
          <p style={styles.contagem}>{lista.length} mascotes</p>
          <div
            style={{
              ...styles.grade,
              gridTemplateColumns: simples ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            }}
          >
            {visiveis.map((m, i) => (
              <CardMascote
                key={m.id}
                m={m}
                ativo={m.id === selecionado}
                simples={simples}
                atraso={(i % POR_PAGINA) * 0.03}
                onClick={() => onEscolher(m.id)}
              />
            ))}
          </div>
          {temMais && (
            <div ref={sentinela} style={styles.mais}>
              <Botao variante="fantasma" onClick={() => setPagina(p => p + 1)}>
                Mostrar mais
              </Botao>
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}
export function CardMascote({ m, ativo, onClick, simples, atraso = 0, largura }) {
  return (
    <button
      type="button"
      className="tap anim-up"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={`${m.nome}, ${m.sub}`}
      style={{
        ...styles.card,
        width: largura,
        animationDelay: `${atraso}s`,
        background: ativo ? 'var(--lavanda)' : 'var(--surface)',
        outline: ativo ? '2px solid #000' : 'none',
      }}
    >
      {ativo && (
        <span className="anim-pop" style={styles.check}>
          <Check size={13} color="#fff" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
      <Mascote id={m.id} tamanho={simples ? 84 : 72} semBrilho />
      <span
        style={{
          ...styles.nome,
          fontSize: simples ? 17 : 15,
        }}
      >
        {m.nome}
      </span>
      {!simples && <span style={styles.sub}>{m.sub}</span>}
    </button>
  )
}
const styles = {
  topo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 6,
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '4px 0 10px',
  },
  contagem: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-3)',
    margin: '4px 4px 10px',
  },
  grade: {
    display: 'grid',
    gap: 10,
  },
  card: {
    position: 'relative',
    borderRadius: 'var(--r-card-m)',
    padding: '12px 6px 14px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    color: 'var(--text)',
    outlineOffset: -2,
    transition: 'background 0.25s',
    flexShrink: 0,
    minWidth: 0,
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: {
    fontWeight: 700,
    lineHeight: 1.15,
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    color: 'var(--text-3)',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 4px',
  },
  mais: {
    display: 'flex',
    justifyContent: 'center',
    padding: '18px 0 6px',
  },
}
