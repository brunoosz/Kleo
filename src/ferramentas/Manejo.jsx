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
  Pill,
  Scale,
  Milk,
} from 'lucide-react'
import { Card, Botao, BotaoIcone, Chip, Tag, Vazio } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { adicionarEvento } from '../lib/storage'
import { somarDias, diferencaDias, formatarData, relativo } from '../components/profissao/util'
import { useDados, useTam, hoje, novoId } from './comum'
import { Coluna, Rotulo, Entrada } from './pecas'
const TIPOS_BASE = [
  {
    id: 'irrigacao',
    label: 'Irrigação',
    icon: Droplets,
    freq: 2,
  },
  {
    id: 'adubacao',
    label: 'Adubação',
    icon: Leaf,
    freq: 30,
  },
  {
    id: 'poda',
    label: 'Poda',
    icon: Scissors,
    freq: 90,
  },
  {
    id: 'pragas',
    label: 'Controle de pragas',
    icon: Bug,
    freq: 15,
  },
  {
    id: 'vacinacao',
    label: 'Vacinação',
    icon: Syringe,
    freq: 180,
  },
  {
    id: 'vermifugacao',
    label: 'Vermifugação',
    icon: Pill,
    freq: 90,
  },
  {
    id: 'pesagem',
    label: 'Pesagem',
    icon: Scale,
    freq: 30,
  },
  {
    id: 'ordenha',
    label: 'Limpeza da ordenha',
    icon: Milk,
    freq: 1,
  },
]
const FREQS = [1, 2, 7, 15, 30, 90, 180]
const textoFreq = d =>
  d === 1 ? 'Todo dia' : d === 7 ? 'Toda semana' : d === 30 ? 'Todo mês' : `A cada ${d} dias`
const slug = t =>
  String(t)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
function montarTipos(itens) {
  if (!Array.isArray(itens) || !itens.length) return TIPOS_BASE.slice(0, 5)
  return itens.map(
    i =>
      TIPOS_BASE.find(t => t.id === i || t.label.toLowerCase() === String(i).toLowerCase()) || {
        id: slug(i),
        label: String(i),
        icon: ClipboardList,
        freq: 7,
      },
  )
}
export default function Manejo({ config = {}, chave }) {
  const { simples, h } = useTam()
  const tipos = montarTipos(config.itens)
  const tipoDe = id =>
    tipos.find(t => t.id === id) ||
    TIPOS_BASE.find(t => t.id === id) || {
      id,
      label: id,
      icon: ClipboardList,
      freq: 7,
    }
  const [diaHoje] = useState(() => hoje())
  const [manejo, setManejo] = useDados(chave, [])
  const [tipo, setTipo] = useState(tipos[0].id)
  const [descricao, setDescricao] = useState('')
  const [freq, setFreq] = useState(tipos[0].freq)
  const [proxima, setProxima] = useState(diaHoje)
  const [agendados, setAgendados] = useState({})
  const lista = (Array.isArray(manejo) ? manejo : [])
    .slice()
    .sort((a, b) => a.proxima.localeCompare(b.proxima))
  const pendentes = lista.filter(m => diferencaDias(diaHoje, m.proxima) <= 0).length
  const mudar = fn => setManejo(a => fn(Array.isArray(a) ? a : []))
  const escolherTipo = t => {
    setTipo(t.id)
    setFreq(t.freq)
  }
  const adicionar = () => {
    mudar(a => [
      ...a,
      {
        id: novoId(),
        tipo,
        descricao: descricao.trim(),
        frequencia: freq,
        proxima,
        ultima: null,
      },
    ])
    setDescricao('')
  }
  const exemplos = () =>
    mudar(a => [
      ...a,
      ...tipos.slice(0, 3).map((t, i) => ({
        id: novoId() + i,
        tipo: t.id,
        descricao: '',
        frequencia: t.freq,
        proxima: somarDias(diaHoje, i * 3 - 1),
        ultima: null,
      })),
    ])
  const feito = id => {
    navigator.vibrate?.(20)
    mudar(a =>
      a.map(m =>
        m.id === id
          ? {
              ...m,
              ultima: diaHoje,
              proxima: somarDias(diaHoje, m.frequencia),
            }
          : m,
      ),
    )
  }
  const agendar = m => {
    const t = tipoDe(m.tipo)
    adicionarEvento({
      titulo: `${t.label}${m.descricao ? ' - ' + m.descricao : ''}`,
      data: m.proxima,
      hora: '07:00',
      descricao: `Manejo recorrente: ${textoFreq(m.frequencia).toLowerCase()}.`,
    })
    setAgendados(a => ({
      ...a,
      [m.id]: m.proxima,
    }))
  }
  const { saindo, remover } = useRemocao(id => mudar(a => a.filter(m => m.id !== id)), 220)
  return (
    <Coluna>
      {lista.length > 0 && (
        <Card cor={pendentes ? 'lima' : 'lavanda'}>
          <div style={styles.resumo}>
            <span key={pendentes} className="valor-muda" style={styles.resumoNum}>
              {pendentes}
            </span>
            <p style={styles.resumoTxt}>
              {pendentes
                ? pendentes === 1
                  ? 'tarefa para hoje ou atrasada'
                  : 'tarefas para hoje ou atrasadas'
                : 'Tudo em dia'}
            </p>
          </div>
        </Card>
      )}

      {lista.length === 0 ? (
        <Card>
          <Vazio
            icone={ClipboardList}
            titulo="Nenhum lembrete ainda"
            texto="Cadastre as tarefas que se repetem. A Kleo calcula a próxima data."
          />
          <div
            style={{
              marginTop: 12,
            }}
          >
            <Botao variante="suave" icone={Sparkles} cheio onClick={exemplos}>
              Começar com exemplos
            </Botao>
          </div>
        </Card>
      ) : (
        <Coluna gap={10} className="stagger">
          {lista.map(m => {
            const t = tipoDe(m.tipo)
            const dias = diferencaDias(diaHoje, m.proxima)
            return (
              <div key={m.id} className={saindo(m.id) ? 'modal-out' : undefined}>
                <Card cor={dias < 0 ? 'lima' : 'branco'}>
                  <div style={styles.itemTopo}>
                    <span style={styles.itemIcone}>
                      <t.icon size={20} color="#000" />
                    </span>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <p style={styles.itemTitulo}>{t.label}</p>
                      {m.descricao && <p style={styles.itemDesc}>{m.descricao}</p>}
                      {!simples && (
                        <p style={styles.itemFreq}>
                          {textoFreq(m.frequencia)}
                          {m.ultima ? ` · feito em ${formatarData(m.ultima)}` : ''}
                        </p>
                      )}
                    </div>
                    <div key={m.proxima} className="anim-pop" style={styles.venc}>
                      <Tag cor={dias <= 0 ? 'branco' : 'ceu'}>{relativo(dias)}</Tag>
                      <span style={styles.vencData}>{formatarData(m.proxima)}</span>
                    </div>
                  </div>
                  <div style={styles.itemAcoes}>
                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <Botao
                        variante="primario"
                        icone={Check}
                        grande={simples}
                        cheio
                        onClick={() => feito(m.id)}
                      >
                        Feito
                      </Botao>
                    </div>
                    <BotaoIcone
                      icone={agendados[m.id] === m.proxima ? Check : CalendarPlus}
                      label="Pôr na agenda"
                      variante="lavanda"
                      onClick={() => agendar(m)}
                    />
                    {!simples && (
                      <BotaoIcone icone={Trash2} label="Apagar lembrete" onClick={() => remover(m.id)} />
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </Coluna>
      )}

      <Card>
        <Rotulo>Novo lembrete</Rotulo>
        <div style={styles.tipos}>
          {tipos.map(t => (
            <button
              key={t.id}
              onClick={() => escolherTipo(t)}
              aria-pressed={tipo === t.id}
              className="tap"
              style={{
                ...styles.tipo,
                minHeight: h + 30,
                background: tipo === t.id ? 'var(--lavanda)' : 'var(--surface-2)',
                outline: tipo === t.id ? '2px solid #000' : 'none',
              }}
            >
              <t.icon size={20} color="#000" />
              <span style={styles.tipoTxt}>{t.label}</span>
            </button>
          ))}
        </div>
        {!simples && (
          <>
            <div
              style={{
                marginTop: 14,
              }}
            >
              <Entrada
                rotulo="Descrição (opcional)"
                placeholder="Ex: Talhão 2, pomar, lote de bezerros"
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
              Repetir
            </Rotulo>
            <div style={styles.freqs}>
              {FREQS.map(f => (
                <Chip key={f} cor="ceu" ativo={freq === f} onClick={() => setFreq(f)}>
                  {f === 1 ? 'Todo dia' : `${f} dias`}
                </Chip>
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
              }}
            >
              <Entrada
                rotulo="Próxima vez"
                type="date"
                value={proxima}
                onChange={e => setProxima(e.target.value || diaHoje)}
                altura={h}
              />
            </div>
          </>
        )}
        <div
          style={{
            marginTop: 16,
          }}
        >
          <Botao variante="primario" icone={Plus} grande={simples} cheio onClick={adicionar}>
            Adicionar lembrete
          </Botao>
        </div>
      </Card>
    </Coluna>
  )
}
const styles = {
  resumo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  resumoNum: {
    fontSize: 46,
    fontWeight: 800,
    lineHeight: 1,
    color: '#000',
  },
  resumoTxt: {
    fontSize: 16,
    fontWeight: 600,
    color: '#000',
    flex: 1,
  },
  itemTopo: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  itemIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemTitulo: {
    fontSize: 17,
    fontWeight: 700,
    color: '#000',
  },
  itemDesc: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 2,
  },
  itemFreq: {
    fontSize: 13,
    color: 'var(--text-3)',
    marginTop: 4,
  },
  venc: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    transformOrigin: 'right center',
  },
  vencData: {
    fontSize: 12,
    color: 'var(--text-2)',
  },
  itemAcoes: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  tipos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
  },
  tipo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 20,
    padding: 8,
    color: '#000',
  },
  tipoTxt: {
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  freqs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
}
