import { useState } from 'react'
import { Plus, Minus, Trash2, Dumbbell, UserPlus, Check } from 'lucide-react'
import { Card, Botao, BotaoIcone, Chip, Segmentado, Vazio, Sheet } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { useDados, useTam, novoId, numero, fmt, hoje } from './comum'
import { Coluna, Entrada, Marca, Rotulo } from './pecas'
const DIAS = ['A', 'B', 'C', 'D']
const SUGESTOES = [
  'Agachamento',
  'Supino reto',
  'Remada curvada',
  'Leg press',
  'Puxada frontal',
  'Desenvolvimento',
  'Rosca direta',
  'Tríceps corda',
  'Prancha',
  'Stiff',
]
const PADRAO = {
  alunos: [
    {
      id: 'eu',
      nome: 'Eu',
    },
  ],
  fichas: {},
  feitos: {},
}
export default function Treinos({ chave }) {
  const { simples, h } = useTam()
  const [dados, setDados] = useDados(chave, PADRAO)
  const d = {
    ...PADRAO,
    ...(dados || {}),
  }
  const [alunoId, setAlunoId] = useState(d.alunos[0]?.id)
  const [dia, setDia] = useState('A')
  const [form, setForm] = useState({
    exercicio: '',
    series: '3',
    reps: '12',
    carga: '',
  })
  const [novoAluno, setNovoAluno] = useState(null)
  const aluno = d.alunos.find(a => a.id === alunoId) || d.alunos[0]
  const ficha = (d.fichas[aluno?.id] || {})[dia] || []
  const diaHoje = hoje()
  const feitosHoje = (d.feitos || {})[diaHoje] || {}
  const feitosFicha = ficha.filter(e => feitosHoje[e.id]).length
  const mudarFicha = fn =>
    setDados(a => {
      const x = {
        ...PADRAO,
        ...(a || {}),
      }
      const doAluno = {
        ...(x.fichas[aluno.id] || {}),
      }
      doAluno[dia] = fn(doAluno[dia] || [])
      return {
        ...x,
        fichas: {
          ...x.fichas,
          [aluno.id]: doAluno,
        },
      }
    })
  const adicionar = e => {
    e?.preventDefault()
    if (!form.exercicio.trim()) return
    mudarFicha(l => [
      ...l,
      {
        id: novoId(),
        exercicio: form.exercicio.trim(),
        series: numero(form.series) || 3,
        reps: form.reps.trim() || '12',
        carga: numero(form.carga) || 0,
      },
    ])
    setForm(f => ({
      ...f,
      exercicio: '',
      carga: '',
    }))
  }
  const carga = (id, delta) =>
    mudarFicha(l =>
      l.map(x =>
        x.id === id
          ? {
              ...x,
              carga: Math.max(0, +(x.carga + delta).toFixed(1)),
            }
          : x,
      ),
    )
  const marcar = id =>
    setDados(a => {
      const x = {
        ...PADRAO,
        ...(a || {}),
      }
      const doDia = {
        ...((x.feitos || {})[diaHoje] || {}),
      }
      if (doDia[id]) delete doDia[id]
      else doDia[id] = true
      return {
        ...x,
        feitos: {
          [diaHoje]: doDia,
        },
      }
    })
  const { saindo, remover } = useRemocao(id => mudarFicha(l => l.filter(x => x.id !== id)))
  const criarAluno = e => {
    e.preventDefault()
    if (!novoAluno?.trim()) return
    const id = novoId()
    setDados(a => ({
      ...PADRAO,
      ...(a || {}),
      alunos: [
        ...((a || {}).alunos || PADRAO.alunos),
        {
          id,
          nome: novoAluno.trim(),
        },
      ],
    }))
    setAlunoId(id)
    setNovoAluno(null)
  }
  return (
    <Coluna>
      {!simples && (
        <div style={styles.alunos}>
          {d.alunos.map(a => (
            <Chip key={a.id} cor="lavanda" ativo={a.id === aluno?.id} onClick={() => setAlunoId(a.id)}>
              {a.nome}
            </Chip>
          ))}
          <Chip cor="branco" icone={UserPlus} onClick={() => setNovoAluno('')}>
            Aluno
          </Chip>
        </div>
      )}

      <Segmentado
        opcoes={DIAS.map(x => ({
          id: x,
          label: `Treino ${x}`,
        }))}
        valor={dia}
        onChange={setDia}
      />

      <Card cor={ficha.length && feitosFicha === ficha.length ? 'lima' : 'branco'}>
        <div style={styles.cab}>
          <p style={styles.titulo}>
            Treino {dia}
            {aluno && aluno.id !== 'eu' ? ` · ${aluno.nome}` : ''}
          </p>
          {ficha.length > 0 && (
            <span style={styles.contagem}>
              {feitosFicha}/{ficha.length} hoje
            </span>
          )}
        </div>
        {ficha.length === 0 ? (
          <Vazio icone={Dumbbell} titulo="Ficha vazia" texto="Adicione os exercícios deste treino." />
        ) : (
          ficha.map(x => (
            <div key={x.id} className={saindo(x.id) ? 'item-out' : undefined} style={styles.ex}>
              <button
                onClick={() => marcar(x.id)}
                style={styles.exMarca}
                aria-pressed={!!feitosHoje[x.id]}
                aria-label={`Marcar ${x.exercicio} como feito`}
              >
                <Marca feito={!!feitosHoje[x.id]} tamanho={simples ? 32 : 28} />
              </button>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    ...styles.exNome,
                    textDecoration: feitosHoje[x.id] ? 'line-through' : 'none',
                  }}
                >
                  {x.exercicio}
                </p>
                <p style={styles.exMeta}>
                  {x.series} x {x.reps}
                </p>
              </div>
              <BotaoIcone
                icone={Minus}
                label="Menos carga"
                variante="branco"
                onClick={() => carga(x.id, -2.5)}
              />
              <span key={x.carga} className="valor-muda" style={styles.carga}>
                {fmt(x.carga, 1)}
                <small style={styles.kg}> kg</small>
              </span>
              <BotaoIcone
                icone={Plus}
                label="Mais carga"
                variante="lavanda"
                onClick={() => carga(x.id, 2.5)}
              />
              {!simples && (
                <BotaoIcone icone={Trash2} label={`Remover ${x.exercicio}`} onClick={() => remover(x.id)} />
              )}
            </div>
          ))
        )}
      </Card>

      <Card cor="mist">
        <Rotulo>Adicionar exercício</Rotulo>
        <form onSubmit={adicionar} style={styles.form}>
          <Entrada
            placeholder="Exercício"
            aria-label="Nome do exercício"
            value={form.exercicio}
            onChange={e =>
              setForm(f => ({
                ...f,
                exercicio: e.target.value,
              }))
            }
            altura={h}
          />
          {!simples && (
            <div style={styles.sugestoes}>
              {SUGESTOES.filter(s => !ficha.some(x => x.exercicio === s))
                .slice(0, 6)
                .map(s => (
                  <Chip
                    key={s}
                    cor="branco"
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        exercicio: s,
                      }))
                    }
                  >
                    {s}
                  </Chip>
                ))}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: 10,
            }}
          >
            <Entrada
              rotulo="Séries"
              inputMode="numeric"
              value={form.series}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  series: e.target.value,
                }))
              }
              altura={h}
            />
            <Entrada
              rotulo="Repetições"
              value={form.reps}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  reps: e.target.value,
                }))
              }
              altura={h}
            />
            <Entrada
              rotulo="Carga (kg)"
              inputMode="decimal"
              value={form.carga}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  carga: e.target.value,
                }))
              }
              altura={h}
            />
          </div>
          <Botao
            variante="primario"
            icone={Plus}
            grande={simples}
            cheio
            type="submit"
            disabled={!form.exercicio.trim()}
          >
            Adicionar ao treino {dia}
          </Botao>
        </form>
      </Card>

      <Sheet aberto={novoAluno !== null} onFechar={() => setNovoAluno(null)} titulo="Novo aluno">
        <form onSubmit={criarAluno} style={styles.form}>
          <Entrada
            rotulo="Nome do aluno"
            placeholder="Ex: Carla"
            value={novoAluno || ''}
            onChange={e => setNovoAluno(e.target.value)}
            altura={h}
          />
          <Botao variante="primario" icone={Check} grande cheio type="submit" disabled={!novoAluno?.trim()}>
            Criar ficha
          </Botao>
        </form>
      </Sheet>
    </Coluna>
  )
}
const styles = {
  alunos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  cab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 800,
  },
  contagem: {
    fontSize: 14,
    fontWeight: 700,
    background: 'var(--surface-2)',
    borderRadius: 30,
    padding: '4px 12px',
  },
  ex: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 0',
    borderTop: '1px solid var(--surface-2)',
  },
  exMarca: {
    display: 'flex',
    padding: 4,
  },
  exNome: {
    fontSize: 16,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  exMeta: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 2,
  },
  carga: {
    fontSize: 18,
    fontWeight: 800,
    minWidth: 54,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  kg: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sugestoes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
}
