import { useEffect, useState } from 'react'
import { MapPin, Search, LocateFixed, Plus, Trash2, Check } from 'lucide-react'
import { Sheet, Botao, Campo, Chip } from './ui'
import useLocais, { iconeLocal } from '../hooks/useLocais'
import useModoSimples from '../hooks/useModoSimples'
import { TIPOS_LOCAL, salvarLocal, removerLocal } from '../lib/locais'
import { obterPosicao } from '../lib/lugares'
import { geocodificar, nomeDoPonto } from './MapaRotas'
export function EditorLocal({ inicial = null, onSalvo }) {
  const simples = useModoSimples()
  const [tipo, setTipo] = useState(inicial?.tipo || 'casa')
  const [nome, setNome] = useState(inicial?.nome || 'Casa')
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [ponto, setPonto] = useState(
    inicial
      ? {
          lat: inicial.lat,
          lng: inicial.lng,
          endereco: inicial.endereco,
        }
      : null,
  )
  const [erro, setErro] = useState('')
  const [pegandoGps, setPegandoGps] = useState(false)
  useEffect(() => {
    const t = busca.trim()
    if (t.length < 3) return
    const ctrl = new AbortController()
    const id = setTimeout(async () => {
      setBuscando(true)
      try {
        const perto = await obterPosicao().catch(() => null)
        const r = await geocodificar(t, perto, ctrl.signal)
        setResultados(r.slice(0, 5))
        setErro(r.length ? '' : 'Não encontrei. Tente com o número e o bairro.')
      } catch (e) {
        if (e.name !== 'AbortError') setErro('Não consegui procurar agora. Confira a internet.')
      }
      setBuscando(false)
    }, 500)
    return () => {
      clearTimeout(id)
      ctrl.abort()
    }
  }, [busca])
  const escolherTipo = t => {
    const atual = TIPOS_LOCAL.find(x => x.id === tipo)?.nome
    setTipo(t)
    if (!nome.trim() || nome === atual) setNome(t === 'outro' ? '' : TIPOS_LOCAL.find(x => x.id === t).nome)
  }
  const usarAqui = async () => {
    setPegandoGps(true)
    setErro('')
    const p = await obterPosicao().catch(() => null)
    if (!p || p.fonte === 'cidade') {
      setErro('Não consegui sua localização exata. Ligue o GPS ou digite o endereço.')
      setPegandoGps(false)
      return
    }
    const endereco = await nomeDoPonto(p)
    setPonto({
      lat: p.lat,
      lng: p.lng,
      endereco,
    })
    setResultados([])
    setPegandoGps(false)
  }
  const salvarAgora = () => {
    if (!nome.trim()) {
      setErro('Dê um nome para o lugar.')
      return
    }
    if (!ponto) {
      setErro('Escolha o endereço.')
      return
    }
    const l = salvarLocal({
      id: inicial?.id,
      nome,
      tipo,
      ...ponto,
    })
    onSalvo?.(l)
  }
  return (
    <div style={styles.coluna}>
      <div style={styles.chips} role="radiogroup" aria-label="Tipo de lugar">
        {TIPOS_LOCAL.map(t => (
          <Chip
            key={t.id}
            icone={iconeLocal(t.id)}
            ativo={tipo === t.id}
            onClick={() => escolherTipo(t.id)}
            role="radio"
            aria-checked={tipo === t.id}
          >
            {t.nome}
          </Chip>
        ))}
      </div>
      <Campo
        rotulo="Nome"
        placeholder="Ex: Academia, Casa da minha mãe"
        value={nome}
        onChange={e => setNome(e.target.value)}
        maxLength={40}
      />
      {ponto ? (
        <div className="anim-up" style={styles.escolhido}>
          <MapPin size={20} aria-hidden="true" style={styles.escolhidoIcone} />
          <span style={styles.escolhidoTexto}>{ponto.endereco || 'Endereço escolhido'}</span>
          <Botao variante="fantasma" onClick={() => setPonto(null)}>
            Trocar
          </Botao>
        </div>
      ) : (
        <>
          <Campo
            rotulo="Endereço"
            icone={Search}
            placeholder="Rua, número, bairro"
            value={busca}
            onChange={e => {
              setBusca(e.target.value)
              if (e.target.value.trim().length < 3) setResultados([])
            }}
          />
          {buscando && <p style={styles.dica}>Procurando...</p>}
          {resultados.map(r => (
            <button
              key={r.id}
              type="button"
              className="tap"
              style={styles.resultado}
              onClick={() => {
                setPonto({
                  lat: r.lat,
                  lng: r.lng,
                  endereco: [r.nome, r.detalhe].filter(Boolean).join(', '),
                })
                setResultados([])
              }}
            >
              <MapPin size={18} aria-hidden="true" style={styles.escolhidoIcone} />
              <span style={styles.resultadoTextos}>
                <strong>{r.nome}</strong>
                <span style={styles.dica}>{r.detalhe}</span>
              </span>
            </button>
          ))}
          <Botao variante="suave" icone={LocateFixed} cheio carregando={pegandoGps} onClick={usarAqui}>
            Usar onde estou agora
          </Botao>
        </>
      )}
      {erro && (
        <p role="alert" style={styles.erro}>
          {erro}
        </p>
      )}
      <Botao variante="primario" icone={Check} cheio grande={simples} onClick={salvarAgora}>
        Salvar lugar
      </Botao>
    </div>
  )
}
export function SheetLocal({ aberto, onFechar, inicial, onSalvo }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo={inicial?.id ? 'Editar lugar' : 'Salvar um lugar'}>
      {aberto && (
        <EditorLocal
          inicial={inicial}
          onSalvo={l => {
            onSalvo?.(l)
            onFechar?.()
          }}
        />
      )}
    </Sheet>
  )
}
export function MeusLugares({ onEscolher, escolhido = null, compacto = false }) {
  const locais = useLocais()
  const [editar, setEditar] = useState(null)
  const [gerenciar, setGerenciar] = useState(false)
  return (
    <>
      <div style={styles.chips} role="list" aria-label="Meus lugares">
        {locais.map(l => (
          <Chip
            key={l.id}
            icone={iconeLocal(l.tipo)}
            ativo={escolhido === l.id}
            cor="lavanda"
            onClick={() => onEscolher?.(l)}
            role="listitem"
          >
            {l.nome}
          </Chip>
        ))}
        <Chip icone={Plus} onClick={() => setEditar('novo')}>
          {locais.length ? 'Novo lugar' : 'Salvar Casa, Trabalho...'}
        </Chip>
        {!compacto && locais.length > 0 && <Chip onClick={() => setGerenciar(true)}>Editar</Chip>}
      </div>
      <SheetLocal
        aberto={!!editar}
        inicial={editar && editar !== 'novo' ? editar : null}
        onFechar={() => setEditar(null)}
        onSalvo={l => onEscolher?.(l)}
      />
      <Sheet aberto={gerenciar} onFechar={() => setGerenciar(false)} titulo="Meus lugares">
        <div style={styles.coluna}>
          {locais.map(l => {
            const Icone = iconeLocal(l.tipo)
            return (
              <div key={l.id} style={styles.linhaLocal}>
                <button
                  type="button"
                  className="tap"
                  style={styles.linhaLocalBotao}
                  onClick={() => {
                    setGerenciar(false)
                    setEditar(l)
                  }}
                >
                  <span style={styles.linhaIcone}>
                    <Icone size={20} color="#000" aria-hidden="true" />
                  </span>
                  <span style={styles.resultadoTextos}>
                    <strong>{l.nome}</strong>
                    <span style={styles.dica}>{l.endereco}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="tap"
                  style={styles.apagar}
                  aria-label={`Apagar ${l.nome}`}
                  onClick={() => removerLocal(l.id)}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      </Sheet>
    </>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 8,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  dica: {
    fontSize: 13,
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  erro: {
    margin: 0,
    color: 'var(--erro)',
    fontWeight: 600,
    fontSize: 15,
  },
  escolhido: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface-2)',
    borderRadius: 18,
    padding: '10px 12px',
  },
  escolhidoIcone: {
    flexShrink: 0,
  },
  escolhidoTexto: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  resultado: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    background: 'var(--surface-2)',
    borderRadius: 18,
    padding: '10px 12px',
    color: 'var(--text)',
  },
  resultadoTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 15,
  },
  linhaLocal: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  linhaLocalBotao: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    background: 'var(--surface-2)',
    borderRadius: 18,
    padding: '10px 12px',
    color: 'var(--text)',
  },
  linhaIcone: {
    width: 40,
    height: 40,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  apagar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: 'var(--erro)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}
