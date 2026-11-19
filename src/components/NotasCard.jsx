import { ChevronRight, Check } from 'lucide-react'
import { dataRelativa, iconeLista, corDaNota } from '../data/notas'
const inclinacao = id => [-1.2, 0.8, -0.6, 1.1][Math.abs(Math.floor(Number(id) || 0)) % 4]
export function ListaCard({ nome, itens, alvo, onClick, indice = 0 }) {
  const feitos = itens.filter(i => i.feito).length
  const total = itens.length
  const completa = total > 0 && feitos === total
  const proximos = itens
    .filter(i => !i.feito)
    .slice(0, 3)
    .map(i => i.texto)
    .join(', ')
  const fundoIcone = ['var(--lavanda)', 'var(--ceu)', 'var(--surface-2)'][indice % 3]
  return (
    <div>
      <button
        type="button"
        className="tap kleo-card"
        onClick={onClick}
        aria-label={`Lista ${nome}, ${feitos} de ${total} concluídos`}
        style={{
          ...styles.lista,
          minHeight: alvo + 44,
          background: completa ? 'var(--lima)' : 'var(--surface)',
        }}
      >
        <span
          style={{
            ...styles.iconeLista,
            background: completa ? '#000' : fundoIcone,
          }}
        >
          <span
            key={completa ? 'ok' : 'ic'}
            className={completa ? 'anim-pop' : undefined}
            style={{
              display: 'flex',
            }}
          >
            {completa ? (
              <Check size={22} color="var(--lima)" strokeWidth={3} />
            ) : (
              iconeLista(nome, {
                size: 22,
                color: '#000',
              })
            )}
          </span>
        </span>
        <span style={styles.listaInfo}>
          <span style={styles.listaTopo}>
            <span style={styles.listaNome}>{nome}</span>
            <span style={styles.listaContador}>
              {feitos}/{total}
            </span>
          </span>
          <span style={styles.listaPrevia}>
            {total === 0 ? 'Lista vazia' : completa ? 'Tudo concluído' : proximos}
          </span>
          <span
            style={{
              ...styles.trilho,
              background: completa ? 'rgba(0,0,0,0.12)' : 'var(--surface-2)',
            }}
          >
            <span
              style={{
                ...styles.barra,
                width: `${total ? (feitos / total) * 100 : 0}%`,
              }}
            />
          </span>
        </span>
        <ChevronRight
          size={22}
          color="#000"
          style={{
            flexShrink: 0,
          }}
        />
      </button>
    </div>
  )
}
export function NotaCard({ nota, onClick, busca = '', reto = false }) {
  const titulo = nota.titulo?.trim() || primeiraLinha(nota.corpo) || 'Nova nota'
  const previa = nota.titulo?.trim() ? nota.corpo : restoCorpo(nota.corpo)
  const cor = corDaNota(nota)
  return (
    <div style={styles.notaWrap}>
      <div
        style={{
          ...styles.notaGiro,
          transform: reto ? 'none' : `rotate(${inclinacao(nota.id)}deg)`,
        }}
      >
        <button
          type="button"
          className="tap kleo-card"
          onClick={onClick}
          aria-label={`Nota ${titulo}`}
          style={{
            ...styles.nota,
            background: cor.valor,
          }}
        >
          <span style={styles.notaTitulo}>{destacar(titulo, busca)}</span>
          <span style={styles.notaPrevia}>
            {previa?.trim() ? destacar(previa, busca) : 'Sem texto adicional'}
          </span>
          <span style={styles.notaData}>{dataRelativa(nota.atualizado)}</span>
        </button>
      </div>
    </div>
  )
}
function primeiraLinha(t = '') {
  return t.trim().split('\n')[0].slice(0, 60)
}
function restoCorpo(t = '') {
  return t.trim().split('\n').slice(1).join('\n')
}
function destacar(texto, termo) {
  if (!termo) return texto
  const i = texto.toLowerCase().indexOf(termo.toLowerCase())
  if (i < 0) return texto
  return (
    <>
      {texto.slice(0, i)}
      <mark style={styles.mark}>{texto.slice(i, i + termo.length)}</mark>
      {texto.slice(i + termo.length)}
    </>
  )
}
const styles = {
  lista: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    textAlign: 'left',
    borderRadius: 'var(--r-card-m)',
    padding: '16px 18px 16px 16px',
    color: '#000',
    boxShadow: 'var(--sombra)',
  },
  iconeLista: {
    width: 48,
    height: 48,
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.3s',
  },
  listaInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  listaTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  listaNome: {
    fontSize: 18,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listaContador: {
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  listaPrevia: {
    fontSize: 14,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trilho: {
    display: 'block',
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
  barra: {
    display: 'block',
    height: '100%',
    borderRadius: 6,
    background: '#000',
    transition: 'width 0.5s var(--ease-out)',
  },
  notaWrap: {
    display: 'flex',
    minWidth: 0,
  },
  notaGiro: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
  },
  nota: {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'left',
    minHeight: 160,
    borderRadius: 'var(--r-card-m)',
    padding: 20,
    color: '#000',
    boxShadow: 'var(--sombra)',
  },
  notaTitulo: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.15,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  notaPrevia: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.4,
    flex: 1,
    whiteSpace: 'pre-line',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  notaData: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-2)',
  },
  mark: {
    background: '#000',
    color: '#fff',
    borderRadius: 4,
    padding: '0 3px',
  },
}
