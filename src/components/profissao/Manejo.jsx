import { useState } from 'react'
import {
  Droplets,
  Leaf,
  Scissors,
  Bug,
  Syringe,
  Plus,
  Check,
  CalendarPlus,
  Trash2,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import useStorage from '../../hooks/useStorage'
import useRemocao from './useRemocao'
import { adicionarEvento, hojeISO } from '../../lib/storage'
import { Card, Rotulo, Pill, Chip, Campo, Redondo, Vazio } from './ui'
import { alvo, somarDias, diferencaDias, formatarData, relativo } from './util'
const TIPOS = [
  {
    id: 'irrigacao',
    label: 'Irrigação',
    icon: Droplets,
    cor: '#64d2ff',
    freq: 2,
  },
  {
    id: 'adubacao',
    label: 'Adubação',
    icon: Leaf,
    cor: '#30d158',
    freq: 30,
  },
  {
    id: 'poda',
    label: 'Poda',
    icon: Scissors,
    cor: '#ffd60a',
    freq: 90,
  },
  {
    id: 'pragas',
    label: 'Controle de pragas',
    icon: Bug,
    cor: '#ff9f0a',
    freq: 15,
  },
  {
    id: 'vacinacao',
    label: 'Vacinação de animais',
    icon: Syringe,
    cor: '#bf5af2',
    freq: 180,
  },
]
const FREQS = [1, 2, 7, 15, 30, 90, 180]
const tipoDe = id => TIPOS.find(t => t.id === id) || TIPOS[0]
const textoFreq = d =>
  d === 1 ? 'Todo dia' : d === 7 ? 'Toda semana' : d === 30 ? 'Todo mês' : `A cada ${d} dias`
export default function Manejo({ necessidade }) {
  const [hoje] = useState(() => hojeISO())
  const [manejo, setManejo] = useStorage('kleo_manejo', [])
  const [tipo, setTipo] = useState('irrigacao')
  const [descricao, setDescricao] = useState('')
  const [freq, setFreq] = useState(2)
  const [proxima, setProxima] = useState(hoje)
  const [agendados, setAgendados] = useState({})
  const h = alvo(necessidade)
  const lista = (Array.isArray(manejo) ? manejo : [])
    .slice()
    .sort((a, b) => a.proxima.localeCompare(b.proxima))
  const pendentes = lista.filter(m => diferencaDias(hoje, m.proxima) <= 0).length
  const escolherTipo = id => {
    setTipo(id)
    setFreq(tipoDe(id).freq)
  }
  const adicionar = () => {
    const novo = {
      id: Date.now() + Math.random(),
      tipo,
      descricao: descricao.trim(),
      frequencia: freq,
      proxima,
      ultima: null,
    }
    setManejo(atual => [...(atual || []), novo])
    setDescricao('')
  }
  const exemplos = () => {
    const base = [
      {
        tipo: 'irrigacao',
        descricao: 'Horta de folhosas',
        frequencia: 1,
        proxima: hoje,
      },
      {
        tipo: 'adubacao',
        descricao: 'Milho - cobertura com ureia',
        frequencia: 30,
        proxima: somarDias(hoje, 5),
      },
      {
        tipo: 'pragas',
        descricao: 'Vistoria de lagartas no milho',
        frequencia: 7,
        proxima: somarDias(hoje, -1),
      },
      {
        tipo: 'vacinacao',
        descricao: 'Rebanho - febre aftosa',
        frequencia: 180,
        proxima: somarDias(hoje, 40),
      },
    ]
    setManejo(atual => [
      ...(atual || []),
      ...base.map(b => ({
        ...b,
        id: Date.now() + Math.random(),
        ultima: null,
      })),
    ])
  }
  const feito = id =>
    setManejo(atual =>
      (atual || []).map(m =>
        m.id === id
          ? {
              ...m,
              ultima: hoje,
              proxima: somarDias(hoje, m.frequencia),
            }
          : m,
      ),
    )
  const agendar = m => {
    const t = tipoDe(m.tipo)
    adicionarEvento({
      titulo: `${t.label}${m.descricao ? ' - ' + m.descricao : ''}`,
      data: m.proxima,
      hora: '07:00',
      descricao: `Manejo recorrente: ${textoFreq(m.frequencia).toLowerCase()}.`,
      cor: t.cor,
    })
    setAgendados(a => ({
      ...a,
      [m.id]: m.proxima,
    }))
  }
  const { saindo, remover: excluir } = useRemocao(
    id => setManejo(atual => (atual || []).filter(m => m.id !== id)),
    220,
  )
  return (
    <div style={styles.col}>
      {lista.length > 0 && (
        <Card style={styles.resumo}>
          <div>
            <Rotulo
              style={{
                marginBottom: 4,
              }}
            >
              Para hoje
            </Rotulo>
            <p
              key={pendentes}
              className="valor-muda"
              style={{
                ...styles.resumoNum,
                color: pendentes ? 'var(--orange)' : 'var(--green)',
                transition: 'color .3s ease',
              }}
            >
              {pendentes}
            </p>
          </div>
          <p key={pendentes ? 'pend' : 'ok'} className="anim-fade" style={styles.resumoTxt}>
            {pendentes ? 'tarefas de manejo pendentes ou atrasadas' : 'Tudo em dia no campo'}
          </p>
        </Card>
      )}

      {lista.length === 0 ? (
        <Card>
          <Vazio
            icon={ClipboardList}
            titulo="Nenhum lembrete de manejo"
            texto="Cadastre irrigação, adubação, poda, pragas e vacinação. A Kleo calcula o próximo vencimento."
          />
          <Pill icon={Sparkles} variante="suave" altura={h} cheio onClick={exemplos}>
            Adicionar exemplos
          </Pill>
        </Card>
      ) : (
        <div style={styles.col} className="stagger">
          {lista.map(m => {
            const t = tipoDe(m.tipo)
            const dias = diferencaDias(hoje, m.proxima)
            const corStatus = dias < 0 ? 'var(--red)' : dias === 0 ? 'var(--orange)' : 'var(--silver)'
            return (
              <Card
                key={m.id}
                className={saindo(m.id) ? 'modal-out' : undefined}
                style={{
                  ...styles.item,
                  borderColor: dias < 0 ? 'rgba(255,59,48,0.5)' : 'var(--divider)',
                  transition: 'border-color .4s ease',
                }}
              >
                <div style={styles.itemTopo}>
                  <div
                    style={{
                      ...styles.itemIcone,
                      background: t.cor + '22',
                    }}
                  >
                    <t.icon size={20} color={t.cor} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <p style={styles.itemTitulo}>{t.label}</p>
                    {m.descricao && <p style={styles.itemDesc}>{m.descricao}</p>}
                    <p style={styles.itemFreq}>
                      {textoFreq(m.frequencia)}
                      {m.ultima ? ` · feito em ${formatarData(m.ultima)}` : ''}
                    </p>
                  </div>

                  <div
                    key={m.proxima}
                    className="anim-pop"
                    style={{
                      ...styles.venc,
                      transformOrigin: 'right center',
                    }}
                  >
                    <span
                      style={{
                        ...styles.vencTxt,
                        color: corStatus,
                      }}
                    >
                      {relativo(dias)}
                    </span>
                    <span style={styles.vencData}>{formatarData(m.proxima)}</span>
                  </div>
                </div>
                <div style={styles.itemAcoes}>
                  <Pill
                    icon={Check}
                    altura={h}
                    onClick={() => feito(m.id)}
                    style={{
                      flex: 1,
                      background: 'rgba(48,209,88,0.15)',
                      color: 'var(--green)',
                    }}
                  >
                    Marcar como feito
                  </Pill>
                  <Redondo
                    className={agendados[m.id] === m.proxima ? 'check-pop' : ''}
                    icon={agendados[m.id] === m.proxima ? Check : CalendarPlus}
                    label="Adicionar à agenda"
                    onClick={() => agendar(m)}
                    tamanho={h}
                    fundo="var(--kleo-soft)"
                    cor="var(--kleo)"
                  />
                  <Redondo
                    icon={Trash2}
                    label="Excluir lembrete"
                    onClick={() => excluir(m.id)}
                    tamanho={h}
                    cor="var(--steel)"
                    fundo="transparent"
                  />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <Rotulo>Novo lembrete</Rotulo>
        <div style={styles.tipos}>
          {TIPOS.map(t => (
            <button
              key={t.id}
              onClick={() => escolherTipo(t.id)}
              aria-pressed={tipo === t.id}
              className="prof-press"
              style={{
                ...styles.tipo,
                minHeight: h + 28,
                background: tipo === t.id ? t.cor + '22' : 'var(--control)',
                borderColor: tipo === t.id ? t.cor : 'transparent',
              }}
            >
              <span
                key={tipo === t.id ? 'on' : 'off'}
                className={tipo === t.id ? 'check-pop' : undefined}
                style={{
                  display: 'flex',
                }}
              >
                <t.icon size={20} color={t.cor} />
              </span>
              <span style={styles.tipoTxt}>{t.label}</span>
            </button>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
          }}
        >
          <Campo
            rotulo="Descrição (opcional)"
            placeholder="Ex: Talhão 2, pomar, rebanho"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            altura={h}
          />
        </div>
        <Rotulo
          style={{
            marginTop: 14,
          }}
        >
          Frequência
        </Rotulo>
        <div style={styles.freqs}>
          {FREQS.map(f => (
            <Chip key={f} altura={h - 6} ativo={freq === f} onClick={() => setFreq(f)}>
              {f === 1 ? 'Diária' : `${f} dias`}
            </Chip>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
          }}
        >
          <Campo
            rotulo="Próxima vez"
            type="date"
            value={proxima}
            onChange={e => setProxima(e.target.value || hoje)}
            altura={h}
          />
        </div>
        <Pill
          icon={Plus}
          altura={h + 4}
          cheio
          onClick={adicionar}
          style={{
            marginTop: 16,
          }}
        >
          Adicionar lembrete
        </Pill>
      </Card>
    </div>
  )
}
const styles = {
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  resumo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  resumoNum: {
    fontSize: 44,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  resumoTxt: {
    fontSize: 15,
    color: 'var(--silver)',
    flex: 1,
  },
  item: {
    padding: 16,
  },
  itemTopo: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  itemIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemTitulo: {
    fontSize: 16,
    fontWeight: 600,
  },
  itemDesc: {
    fontSize: 14,
    color: 'var(--silver)',
    marginTop: 2,
  },
  itemFreq: {
    fontSize: 12,
    color: 'var(--steel)',
    marginTop: 4,
  },
  venc: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  vencTxt: {
    fontSize: 14,
    fontWeight: 600,
  },
  vencData: {
    fontSize: 12,
    color: 'var(--steel)',
    marginTop: 2,
  },
  itemAcoes: {
    display: 'flex',
    gap: 8,
    marginTop: 14,
  },
  tipos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: 8,
  },
  tipo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 20,
    border: '1.5px solid',
    padding: 8,
  },
  tipoTxt: {
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  freqs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
}
