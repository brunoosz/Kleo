import { useState } from 'react'
import {
  Pill,
  GlassWater,
  Stethoscope,
  Bell,
  Plus,
  X,
  Minus,
  ChevronLeft,
  Check,
  CalendarDays,
  Dumbbell,
  Navigation,
} from 'lucide-react'
import { Sheet, Botao, Chip, Campo, Segmentado, Toggle, Card } from './ui'
import useModoSimples from '../hooks/useModoSimples'
import { hojeISO } from '../lib/storage'
import { paraMinutos, descreverDias } from '../lib/rotinas'
import { pedirPermissao, permissao } from '../lib/notificacoes'
import { salvarDados, rotuloDataCurta } from './RotinaUtil'
import RotinaSaida from './RotinaSaida'
const MODELOS = [
  {
    tipo: 'remedio',
    titulo: 'Tomar remédio',
    texto: 'Dose, horários e por quantos dias',
    icone: Pill,
    cor: 'lavanda',
  },
  {
    tipo: 'agua',
    titulo: 'Beber água',
    texto: 'Lembrete a cada tempo e meta de copos',
    icone: GlassWater,
    cor: 'ceu',
  },
  {
    tipo: 'consulta',
    titulo: 'Consulta',
    texto: 'Data e hora, com aviso antes',
    icone: Stethoscope,
    cor: 'lima',
  },
  {
    tipo: 'saida',
    titulo: 'Hora de sair',
    texto: 'Aviso para sair de casa e chegar a tempo, com a rota pronta',
    icone: Navigation,
    cor: 'ceu',
  },
  {
    tipo: 'personalizado',
    titulo: 'Personalizado',
    texto: 'Qualquer coisa que se repete',
    icone: Bell,
    cor: 'mist',
  },
]
const PRESETS_HORA = [
  {
    id: '1x',
    label: '1x ao dia',
    horas: ['08:00'],
  },
  {
    id: '2x',
    label: '2x ao dia',
    horas: ['08:00', '20:00'],
  },
  {
    id: '3x',
    label: '3x ao dia',
    horas: ['08:00', '14:00', '20:00'],
  },
  {
    id: '8h',
    label: 'De 8 em 8 h',
    horas: ['06:00', '14:00', '22:00'],
  },
  {
    id: '12h',
    label: 'De 12 em 12 h',
    horas: ['09:00', '21:00'],
  },
]
const DURACOES = [
  {
    id: 0,
    label: 'Sempre',
  },
  {
    id: 5,
    label: '5 dias',
  },
  {
    id: 7,
    label: '7 dias',
  },
  {
    id: 10,
    label: '10 dias',
  },
  {
    id: 14,
    label: '14 dias',
  },
  {
    id: 30,
    label: '30 dias',
  },
]
const INTERVALOS = [30, 45, 60, 90, 120]
const DIAS = [
  {
    i: 0,
    curto: 'D',
    nome: 'Domingo',
  },
  {
    i: 1,
    curto: 'S',
    nome: 'Segunda',
  },
  {
    i: 2,
    curto: 'T',
    nome: 'Terça',
  },
  {
    i: 3,
    curto: 'Q',
    nome: 'Quarta',
  },
  {
    i: 4,
    curto: 'Q',
    nome: 'Quinta',
  },
  {
    i: 5,
    curto: 'S',
    nome: 'Sexta',
  },
  {
    i: 6,
    curto: 'S',
    nome: 'Sábado',
  },
]
const MOMENTOS = [
  {
    hora: '08:00',
    label: 'Manhã',
  },
  {
    hora: '12:00',
    label: 'Meio-dia',
  },
  {
    hora: '16:00',
    label: 'Tarde',
  },
  {
    hora: '20:00',
    label: 'Noite',
  },
  {
    hora: '22:00',
    label: 'Antes de dormir',
  },
]
const amanhaISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return hojeISO(d)
}
const textoIntervalo = min =>
  min % 60 === 0 ? `${min / 60} h` : min > 60 ? `${Math.floor(min / 60)} h ${min % 60}` : `${min} min`
const juntar = l => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}`)
function dadosIniciais(tipo) {
  return {
    tipo: tipo || null,
    titulo: '',
    detalhe: '',
    horarios: tipo === 'remedio' ? ['08:00'] : [],
    diasModo: 'todos',
    dias: [0, 1, 2, 3, 4, 5, 6],
    duracao: 0,
    duracaoOutro: '',
    intervalo: 60,
    inicio: '08:00',
    fim: '22:00',
    meta: 8,
    data: amanhaISO(),
    hora: '09:00',
    local: '',
    avisoDia: true,
    avisoHora: true,
  }
}
function resumo(d) {
  const horas = juntar([...d.horarios].sort())
  const dur = Number(d.duracao) > 0 ? `, por ${d.duracao} dias` : ''
  const dias = d.diasModo === 'todos' ? 'todos os dias' : descreverDias(d.dias).toLowerCase()
  if (d.tipo === 'remedio')
    return `Vou lembrar você de tomar ${d.titulo || 'o remédio'}${d.detalhe ? ` (${d.detalhe})` : ''} às ${horas || '...'}, ${dias}${dur}.`
  if (d.tipo === 'agua') {
    const ini = paraMinutos(d.inicio) ?? 480,
      fim = paraMinutos(d.fim) ?? 1320
    const n = fim >= ini ? Math.floor((fim - ini) / d.intervalo) + 1 : 0
    return `Vou lembrar você de beber água a cada ${textoIntervalo(d.intervalo)}, das ${d.inicio} às ${d.fim} (${n} lembretes). Meta: ${d.meta} copos.`
  }
  if (d.tipo === 'consulta') {
    const antes = [d.avisoDia && '1 dia antes', d.avisoHora && '1 hora antes'].filter(Boolean)
    return `${d.titulo || 'Consulta'}: ${rotuloDataCurta(d.data).toLowerCase()}, às ${d.hora}.${antes.length ? ` Aviso ${juntar(antes)} e na hora.` : ' Aviso na hora.'}`
  }
  return `Vou lembrar você: ${d.titulo || '...'} às ${horas || '...'}, ${dias}${dur}.`
}
function validar(d) {
  if ((d.tipo === 'remedio' || d.tipo === 'personalizado' || d.tipo === 'exercicio') && !d.titulo.trim()) {
    return d.tipo === 'remedio' ? 'Escreva o nome do remédio.' : 'Escreva o que devo lembrar.'
  }
  if ((d.tipo === 'remedio' || d.tipo === 'personalizado' || d.tipo === 'exercicio') && !d.horarios.length)
    return 'Escolha pelo menos um horário.'
  if (d.tipo === 'consulta') {
    if (!d.titulo.trim()) return 'Diga qual é a consulta.'
    if (!d.data || !d.hora) return 'Escolha o dia e a hora.'
    if (`${d.data} ${d.hora}` < `${hojeISO()} ${new Date().toTimeString().slice(0, 5)}`)
      return 'Essa data já passou.'
  }
  if (d.tipo === 'agua' && (paraMinutos(d.fim) ?? 0) <= (paraMinutos(d.inicio) ?? 0))
    return 'O fim precisa ser depois do início.'
  return ''
}
export default function RotinaCriar({ aberto, onFechar, tipoInicial = null, onSalvo }) {
  const simples = useModoSimples()
  const [d, setD] = useState(() => dadosIniciais(tipoInicial))
  const [erro, setErro] = useState('')
  const [tremer, setTremer] = useState(0)
  const [passo, setPasso] = useState(0)
  const [novaHora, setNovaHora] = useState('')
  const mudar = patch => {
    setD(v => ({
      ...v,
      ...patch,
    }))
    setErro('')
  }
  const escolherTipo = tipo => {
    setD(dadosIniciais(tipo))
    setPasso(0)
    setErro('')
  }
  const salvar = async () => {
    const final = {
      ...d,
      duracao: d.duracao === 'outro' ? Number(d.duracaoOutro) || 0 : d.duracao,
      dias: d.diasModo === 'todos' ? [0, 1, 2, 3, 4, 5, 6] : d.dias,
    }
    const msg = validar(final)
    if (msg) {
      setErro(msg)
      setTremer(t => t + 1)
      return
    }
    const r = salvarDados(final)
    if (permissao() === 'default') {
      try {
        await pedirPermissao()
      } catch {}
    }
    onSalvo?.(r)
  }
  const alternarHora = h =>
    mudar({
      horarios: d.horarios.includes(h) ? d.horarios.filter(x => x !== h) : [...d.horarios, h].sort(),
    })
  const adicionarHora = () => {
    if (paraMinutos(novaHora) === null) return
    if (!d.horarios.includes(novaHora))
      mudar({
        horarios: [...d.horarios, novaHora].sort(),
      })
    setNovaHora('')
  }
  const editorHorarios = (
    <div style={styles.bloco}>
      <span style={styles.rotulo}>Horários</span>
      <div style={styles.chips}>
        {PRESETS_HORA.map(p => (
          <Chip
            key={p.id}
            cor="branco"
            ativo={p.horas.join() === [...d.horarios].sort().join()}
            onClick={() =>
              mudar({
                horarios: p.horas,
              })
            }
          >
            {p.label}
          </Chip>
        ))}
      </div>
      <div style={styles.chips}>
        {d.horarios.map(h => (
          <span key={h} style={styles.horaPill} className="anim-pop">
            <strong style={styles.horaTexto}>{h}</strong>
            <button
              type="button"
              onClick={() => alternarHora(h)}
              aria-label={`Remover ${h}`}
              style={styles.horaRemover}
            >
              <X size={16} />
            </button>
          </span>
        ))}
      </div>
      <div style={styles.linhaAdd}>
        <div
          style={{
            flex: 1,
          }}
        >
          <Campo
            type="time"
            aria-label="Novo horário"
            value={novaHora}
            onChange={e => setNovaHora(e.target.value)}
          />
        </div>
        <Botao variante="suave" icone={Plus} onClick={adicionarHora} disabled={!novaHora}>
          Adicionar
        </Botao>
      </div>
    </div>
  )
  const editorDias = (
    <div style={styles.bloco}>
      <span style={styles.rotulo}>Quais dias</span>
      <Segmentado
        opcoes={[
          {
            id: 'todos',
            label: 'Todos os dias',
          },
          {
            id: 'escolher',
            label: 'Escolher dias',
          },
        ]}
        valor={d.diasModo}
        onChange={v =>
          mudar({
            diasModo: v,
          })
        }
      />
      {d.diasModo === 'escolher' && (
        <div style={styles.dias} className="anim-up">
          {DIAS.map(x => {
            const on = d.dias.includes(x.i)
            return (
              <button
                key={x.i}
                type="button"
                aria-pressed={on}
                aria-label={x.nome}
                className="tap"
                onClick={() =>
                  mudar({
                    dias: on ? d.dias.filter(i => i !== x.i) : [...d.dias, x.i].sort(),
                  })
                }
                style={{
                  ...styles.dia,
                  background: on ? '#000' : 'var(--surface)',
                  color: on ? '#fff' : '#000',
                  borderColor: on ? '#000' : 'var(--border)',
                }}
              >
                {x.curto}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
  const editorDuracao = (
    <div style={styles.bloco}>
      <span style={styles.rotulo}>Por quanto tempo</span>
      <div style={styles.chips}>
        {DURACOES.map(x => (
          <Chip
            key={x.id}
            cor="branco"
            ativo={d.duracao === x.id}
            onClick={() =>
              mudar({
                duracao: x.id,
              })
            }
          >
            {x.label}
          </Chip>
        ))}
        <Chip
          cor="branco"
          ativo={d.duracao === 'outro'}
          onClick={() =>
            mudar({
              duracao: 'outro',
            })
          }
        >
          Outro
        </Chip>
      </div>
      {d.duracao === 'outro' && (
        <div className="anim-up">
          <Campo
            type="number"
            inputMode="numeric"
            min="1"
            max="365"
            placeholder="Quantos dias?"
            value={d.duracaoOutro}
            onChange={e =>
              mudar({
                duracaoOutro: e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  )
  const caixaResumo = (
    <div style={styles.resumo} className="anim-fade" key={resumo(d)}>
      <Check
        size={18}
        strokeWidth={2.6}
        style={{
          flexShrink: 0,
          marginTop: 2,
        }}
        aria-hidden="true"
      />
      <span>{resumo(d)}</span>
    </div>
  )
  const caixaErro = erro && (
    <p key={tremer} role="alert" className="shake" style={styles.erro}>
      {erro}
    </p>
  )
  const telaModelos = (
    <div style={styles.modelos} className="stagger">
      {MODELOS.map(m => (
        <Card
          key={m.tipo}
          cor={m.cor}
          onClick={() => escolherTipo(m.tipo)}
          style={{
            padding: simples ? 22 : 18,
          }}
          aria-label={m.titulo}
        >
          <div style={styles.modeloLinha}>
            <span style={styles.modeloIcone}>
              <m.icone size={simples ? 28 : 24} color="#000" />
            </span>
            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  ...styles.modeloTitulo,
                  fontSize: simples ? 22 : 19,
                }}
              >
                {simples ? m.titulo.replace('Personalizado', 'Outra coisa') : m.titulo}
              </div>
              {!simples && <div style={styles.modeloTexto}>{m.texto}</div>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
  const formulario = () => {
    if (d.tipo === 'remedio')
      return (
        <>
          <Campo
            rotulo="Nome do remédio"
            icone={Pill}
            placeholder="Ex: Losartana"
            value={d.titulo}
            onChange={e =>
              mudar({
                titulo: e.target.value,
              })
            }
            autoFocus
          />
          <Campo
            rotulo="Dose (opcional)"
            placeholder="Ex: 1 comprimido de 50 mg"
            value={d.detalhe}
            onChange={e =>
              mudar({
                detalhe: e.target.value,
              })
            }
          />
          {editorHorarios}
          {editorDias}
          {editorDuracao}
        </>
      )
    if (d.tipo === 'agua')
      return (
        <>
          <div style={styles.bloco}>
            <span style={styles.rotulo}>Lembrar a cada</span>
            <div style={styles.chips}>
              {INTERVALOS.map(m => (
                <Chip
                  key={m}
                  cor="branco"
                  ativo={d.intervalo === m}
                  onClick={() =>
                    mudar({
                      intervalo: m,
                    })
                  }
                >
                  {textoIntervalo(m)}
                </Chip>
              ))}
            </div>
          </div>
          <div style={styles.duasColunas}>
            <Campo
              rotulo="Começa"
              type="time"
              value={d.inicio}
              onChange={e =>
                mudar({
                  inicio: e.target.value,
                })
              }
            />
            <Campo
              rotulo="Termina"
              type="time"
              value={d.fim}
              onChange={e =>
                mudar({
                  fim: e.target.value,
                })
              }
            />
          </div>
          <div style={styles.bloco}>
            <span style={styles.rotulo}>Meta do dia</span>
            <div style={styles.stepper}>
              <button
                type="button"
                className="tap"
                style={styles.stepBotao}
                aria-label="Menos um copo"
                onClick={() =>
                  mudar({
                    meta: Math.max(1, d.meta - 1),
                  })
                }
              >
                <Minus size={20} />
              </button>
              <span style={styles.stepValor}>
                <strong
                  key={d.meta}
                  className="valor-muda"
                  style={{
                    fontSize: 30,
                  }}
                >
                  {d.meta}
                </strong>{' '}
                copos
              </span>
              <button
                type="button"
                className="tap"
                style={styles.stepBotao}
                aria-label="Mais um copo"
                onClick={() =>
                  mudar({
                    meta: Math.min(20, d.meta + 1),
                  })
                }
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </>
      )
    if (d.tipo === 'consulta')
      return (
        <>
          <Campo
            rotulo="Qual consulta"
            icone={Stethoscope}
            placeholder="Ex: Cardiologista, Dra. Ana"
            value={d.titulo}
            onChange={e =>
              mudar({
                titulo: e.target.value,
              })
            }
            autoFocus
          />
          <Campo
            rotulo="Local (opcional)"
            placeholder="Ex: Clínica Vida, sala 3"
            value={d.local}
            onChange={e =>
              mudar({
                local: e.target.value,
              })
            }
          />
          <div style={styles.duasColunas}>
            <Campo
              rotulo="Dia"
              type="date"
              min={hojeISO()}
              value={d.data}
              onChange={e =>
                mudar({
                  data: e.target.value,
                })
              }
            />
            <Campo
              rotulo="Hora"
              type="time"
              value={d.hora}
              onChange={e =>
                mudar({
                  hora: e.target.value,
                })
              }
            />
          </div>
          <div style={styles.toggles}>
            <div style={styles.toggleLinha}>
              <span>Avisar 1 dia antes</span>
              <Toggle
                ligado={d.avisoDia}
                onChange={v =>
                  mudar({
                    avisoDia: v,
                  })
                }
                label="Avisar 1 dia antes"
              />
            </div>
            <div style={styles.toggleLinha}>
              <span>Avisar 1 hora antes</span>
              <Toggle
                ligado={d.avisoHora}
                onChange={v =>
                  mudar({
                    avisoHora: v,
                  })
                }
                label="Avisar 1 hora antes"
              />
            </div>
          </div>
          <p style={styles.nota}>
            <CalendarDays
              size={15}
              style={{
                verticalAlign: '-3px',
                marginRight: 6,
              }}
              aria-hidden="true"
            />
            A consulta também entra na sua Agenda.
          </p>
        </>
      )
    return (
      <>
        <div style={styles.chips}>
          <Chip
            icone={Bell}
            ativo={d.tipo === 'personalizado'}
            onClick={() =>
              mudar({
                tipo: 'personalizado',
              })
            }
          >
            Lembrete
          </Chip>
          <Chip
            icone={Dumbbell}
            ativo={d.tipo === 'exercicio'}
            onClick={() =>
              mudar({
                tipo: 'exercicio',
              })
            }
          >
            Exercício
          </Chip>
        </div>
        <Campo
          rotulo="O que lembrar"
          placeholder={d.tipo === 'exercicio' ? 'Ex: Caminhada de 20 minutos' : 'Ex: Regar as plantas'}
          value={d.titulo}
          onChange={e =>
            mudar({
              titulo: e.target.value,
            })
          }
          autoFocus
        />
        <Campo
          rotulo="Detalhe (opcional)"
          placeholder="Ex: na praça"
          value={d.detalhe}
          onChange={e =>
            mudar({
              detalhe: e.target.value,
            })
          }
        />
        {editorHorarios}
        {editorDias}
        {editorDuracao}
      </>
    )
  }
  const PASSOS = {
    remedio: ['nome', 'horas', 'duracao', 'confirmar'],
    agua: ['intervalo', 'confirmar'],
    consulta: ['nome', 'data', 'hora', 'confirmar'],
    personalizado: ['nome', 'horas', 'confirmar'],
  }
  const passos = PASSOS[d.tipo] || []
  const etapa = passos[passo]
  const opcaoGrande = (ativo, onClick, texto, sub, key) => (
    <button
      key={key || texto}
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className="tap"
      style={{
        ...styles.opcao,
        background: ativo ? '#000' : 'var(--surface)',
        color: ativo ? '#fff' : '#000',
        borderColor: ativo ? '#000' : 'var(--border)',
      }}
    >
      <span
        style={{
          flex: 1,
          textAlign: 'left',
        }}
      >
        {texto}
        {sub && (
          <span
            style={{
              ...styles.opcaoSub,
              color: ativo ? '#fff' : 'var(--text-2)',
            }}
          >
            {sub}
          </span>
        )}
      </span>
      {ativo && <Check size={24} strokeWidth={3} className="check-pop" aria-hidden="true" />}
    </button>
  )
  const conteudoPasso = () => {
    switch (etapa) {
      case 'nome':
        return (
          <>
            <h3 style={styles.pergunta}>
              {d.tipo === 'remedio'
                ? 'Qual é o remédio?'
                : d.tipo === 'consulta'
                  ? 'Consulta com quem?'
                  : 'O que devo lembrar?'}
            </h3>
            <Campo
              placeholder={
                d.tipo === 'remedio'
                  ? 'Ex: Losartana'
                  : d.tipo === 'consulta'
                    ? 'Ex: Cardiologista'
                    : 'Ex: Ligar para a filha'
              }
              value={d.titulo}
              onChange={e =>
                mudar({
                  titulo: e.target.value,
                })
              }
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') avancar()
              }}
            />
            {d.tipo === 'remedio' && (
              <Campo
                placeholder="Quanto tomar? (opcional)"
                value={d.detalhe}
                onChange={e =>
                  mudar({
                    detalhe: e.target.value,
                  })
                }
              />
            )}
          </>
        )
      case 'horas':
        return (
          <>
            <h3 style={styles.pergunta}>Em quais horários?</h3>
            <p style={styles.ajuda}>Pode escolher mais de um.</p>
            <div style={styles.opcoes}>
              {MOMENTOS.map(m =>
                opcaoGrande(d.horarios.includes(m.hora), () => alternarHora(m.hora), m.label, m.hora, m.hora),
              )}
              {d.horarios
                .filter(h => !MOMENTOS.some(m => m.hora === h))
                .map(h => opcaoGrande(true, () => alternarHora(h), 'Outro horário', h, h))}
            </div>
            <div style={styles.linhaAdd}>
              <div
                style={{
                  flex: 1,
                }}
              >
                <Campo
                  type="time"
                  aria-label="Outro horário"
                  value={novaHora}
                  onChange={e => setNovaHora(e.target.value)}
                />
              </div>
              <Botao variante="suave" icone={Plus} onClick={adicionarHora} disabled={!novaHora}>
                Outro
              </Botao>
            </div>
          </>
        )
      case 'duracao':
        return (
          <>
            <h3 style={styles.pergunta}>Por quantos dias?</h3>
            <div style={styles.opcoes}>
              {opcaoGrande(
                d.duracao === 0,
                () =>
                  mudar({
                    duracao: 0,
                  }),
                'Todos os dias, sem parar',
              )}
              {[7, 10, 30].map(n =>
                opcaoGrande(
                  d.duracao === n,
                  () =>
                    mudar({
                      duracao: n,
                    }),
                  `Só por ${n} dias`,
                  null,
                  n,
                ),
              )}
            </div>
          </>
        )
      case 'intervalo':
        return (
          <>
            <h3 style={styles.pergunta}>De quanto em quanto tempo?</h3>
            <div style={styles.opcoes}>
              {[60, 120, 180].map(m =>
                opcaoGrande(
                  d.intervalo === m,
                  () =>
                    mudar({
                      intervalo: m,
                    }),
                  `A cada ${m / 60} hora${m > 60 ? 's' : ''}`,
                  'Das 8h às 22h',
                  m,
                ),
              )}
            </div>
          </>
        )
      case 'data':
        return (
          <>
            <h3 style={styles.pergunta}>Qual dia?</h3>
            <div style={styles.opcoes}>
              {opcaoGrande(
                d.data === hojeISO(),
                () =>
                  mudar({
                    data: hojeISO(),
                  }),
                'Hoje',
              )}
              {opcaoGrande(
                d.data === amanhaISO(),
                () =>
                  mudar({
                    data: amanhaISO(),
                  }),
                'Amanhã',
              )}
            </div>
            <Campo
              rotulo="Outro dia"
              type="date"
              min={hojeISO()}
              value={d.data}
              onChange={e =>
                mudar({
                  data: e.target.value,
                })
              }
            />
          </>
        )
      case 'hora':
        return (
          <>
            <h3 style={styles.pergunta}>Que horas?</h3>
            <div style={styles.chips}>
              {['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'].map(h => (
                <Chip
                  key={h}
                  cor="branco"
                  ativo={d.hora === h}
                  onClick={() =>
                    mudar({
                      hora: h,
                    })
                  }
                >
                  {h}
                </Chip>
              ))}
            </div>
            <Campo
              rotulo="Ou escolha"
              type="time"
              value={d.hora}
              onChange={e =>
                mudar({
                  hora: e.target.value,
                })
              }
            />
          </>
        )
      case 'confirmar':
        return (
          <>
            <h3 style={styles.pergunta}>Está certo?</h3>
            <Card
              cor="lavanda"
              style={{
                fontSize: 20,
                lineHeight: 1.4,
                fontWeight: 600,
              }}
            >
              {resumo(d)}
            </Card>
          </>
        )
      default:
        return null
    }
  }
  function avancar() {
    if (etapa === 'nome' && !d.titulo.trim()) {
      setErro('Escreva para continuar.')
      setTremer(t => t + 1)
      return
    }
    if (etapa === 'horas' && !d.horarios.length) {
      setErro('Escolha um horário.')
      setTremer(t => t + 1)
      return
    }
    if (etapa === 'confirmar') {
      salvar()
      return
    }
    setErro('')
    setPasso(p => Math.min(passos.length - 1, p + 1))
  }
  const voltarPasso = () => {
    setErro('')
    if (passo === 0) setD(dadosIniciais(null))
    else setPasso(p => p - 1)
  }
  const modelo = MODELOS.find(m => m.tipo === d.tipo) || (d.tipo === 'exercicio' ? MODELOS[3] : null)
  const titulo = !d.tipo ? (simples ? 'O que lembrar?' : 'Novo lembrete') : modelo?.titulo || 'Novo lembrete'
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo={titulo}>
      {!d.tipo ? (
        telaModelos
      ) : d.tipo === 'saida' ? (
        <div style={styles.form} className="anim-up">
          <button type="button" onClick={() => escolherTipo(null)} style={styles.trocar}>
            <ChevronLeft size={16} aria-hidden="true" /> Trocar modelo
          </button>
          <RotinaSaida
            onSalvo={async r => {
              if (permissao() === 'default') {
                try {
                  await pedirPermissao()
                } catch {}
              }
              onSalvo?.(r)
            }}
          />
        </div>
      ) : simples ? (
        <div style={styles.form}>
          <div style={styles.progresso} aria-label={`Passo ${passo + 1} de ${passos.length}`}>
            {passos.map((p, i) => (
              <span
                key={p}
                style={{
                  ...styles.progPonto,
                  background: i <= passo ? '#000' : 'var(--border)',
                }}
              />
            ))}
          </div>
          <div key={etapa} className="anim-right" style={styles.form}>
            {conteudoPasso()}
          </div>
          {caixaErro}
          <div style={styles.navPassos}>
            <Botao variante="fantasma" icone={ChevronLeft} grande onClick={voltarPasso}>
              Voltar
            </Botao>
            <Botao
              variante={etapa === 'confirmar' ? 'lima' : 'primario'}
              icone={etapa === 'confirmar' ? Check : undefined}
              grande
              cheio
              onClick={avancar}
              style={{
                flex: 1,
              }}
            >
              {etapa === 'confirmar' ? 'Sim, salvar' : 'Continuar'}
            </Botao>
          </div>
        </div>
      ) : (
        <div style={styles.form} className="anim-up">
          <button type="button" onClick={() => escolherTipo(null)} style={styles.trocar}>
            <ChevronLeft size={16} aria-hidden="true" /> Trocar modelo
          </button>
          {formulario()}
          {caixaResumo}
          {caixaErro}
          <Botao grande cheio icone={Check} onClick={salvar}>
            Salvar lembrete
          </Botao>
        </div>
      )}
    </Sheet>
  )
}
const styles = {
  modelos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  modeloLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  modeloIcone: {
    width: 52,
    height: 52,
    borderRadius: '30%',
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeloTitulo: {
    fontWeight: 800,
    lineHeight: 1.1,
  },
  modeloTexto: {
    fontSize: 15,
    color: 'var(--text-2)',
    marginTop: 3,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  trocar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-2)',
    alignSelf: 'flex-start',
    minHeight: 36,
  },
  bloco: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    paddingLeft: 6,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  horaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'var(--lavanda)',
    borderRadius: 'var(--r-badge)',
    padding: '4px 4px 4px 14px',
  },
  horaTexto: {
    fontSize: 17,
    fontVariantNumeric: 'tabular-nums',
  },
  horaRemover: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--surface)',
    color: '#000',
  },
  linhaAdd: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  dias: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 6,
  },
  dia: {
    flex: 1,
    maxWidth: 48,
    aspectRatio: '1',
    borderRadius: '50%',
    border: '1px solid',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, color 0.2s',
  },
  duasColunas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    padding: 6,
    boxShadow: 'var(--sombra)',
  },
  stepBotao: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'var(--ceu)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValor: {
    fontSize: 17,
    color: 'var(--text-2)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  toggles: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: '6px 18px',
    boxShadow: 'var(--sombra)',
  },
  toggleLinha: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 56,
    fontSize: 16,
    fontWeight: 600,
  },
  nota: {
    fontSize: 14,
    color: 'var(--text-2)',
    paddingLeft: 6,
  },
  resumo: {
    display: 'flex',
    gap: 10,
    background: 'var(--surface-2)',
    borderRadius: 20,
    padding: '14px 16px',
    fontSize: 15,
    lineHeight: 1.45,
    color: 'var(--text)',
  },
  erro: {
    background: 'var(--surface)',
    border: '1px solid var(--erro)',
    color: 'var(--erro)',
    fontWeight: 600,
    borderRadius: 'var(--r-btn)',
    padding: '10px 16px',
    fontSize: 15,
  },
  progresso: {
    display: 'flex',
    gap: 6,
  },
  progPonto: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    transition: 'background 0.3s',
  },
  pergunta: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.05,
  },
  ajuda: {
    fontSize: 17,
    color: 'var(--text-2)',
    marginTop: -8,
  },
  opcoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  opcao: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    padding: '10px 20px',
    borderRadius: 'var(--r-btn)',
    border: '1px solid',
    fontSize: 20,
    fontWeight: 700,
    transition: 'background 0.2s, color 0.2s',
    boxShadow: 'var(--sombra)',
  },
  opcaoSub: {
    display: 'block',
    fontSize: 15,
    fontWeight: 500,
    marginTop: 2,
  },
  navPassos: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
}
