import { useState } from 'react'
import {
  Plus,
  Phone,
  MessageCircle,
  CalendarPlus,
  Trash2,
  Search,
  Users,
  Pencil,
  Check,
  CalendarClock,
} from 'lucide-react'
import { Card, Botao, BotaoIcone, Sheet, Tag, Vazio, Modal } from '../components/ui'
import { adicionarEvento } from '../lib/storage'
import { useDados, useTam, novoId, singular, dataCurta, hoje } from './comum'
import { Coluna, Entrada } from './pecas'
const FORM_VAZIO = {
  nome: '',
  telefone: '',
  notas: '',
  proximo: '',
  hora: '',
}
function linkWhats(tel) {
  let d = String(tel || '').replace(/\D/g, '')
  if (!d) return null
  if (!d.startsWith('55') || d.length <= 11) d = '55' + d
  return `https://wa.me/${d}`
}
export default function Clientes({ config = {}, chave }) {
  const { simples, h } = useTam()
  const rotulo = config.rotulo || 'Clientes'
  const um = singular(rotulo)
  const [dados, setDados] = useDados(chave, {
    lista: [],
  })
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState(null)
  const [aberto, setAberto] = useState(null)
  const [apagar, setApagar] = useState(null)
  const [agendado, setAgendado] = useState({})
  const lista = Array.isArray(dados?.lista) ? dados.lista : []
  const diaHoje = hoje()
  const termo = busca.trim().toLowerCase()
  const filtrados = lista
    .filter(
      c =>
        !termo ||
        c.nome.toLowerCase().includes(termo) ||
        (c.telefone || '').includes(termo) ||
        (c.notas || '').toLowerCase().includes(termo),
    )
    .sort((a, b) => (a.proximo || '9999').localeCompare(b.proximo || '9999') || a.nome.localeCompare(b.nome))
  const salvar = e => {
    e.preventDefault()
    if (!form.nome.trim()) return
    const item = {
      ...form,
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      notas: form.notas.trim(),
    }
    setDados(a => {
      const l = (a || {}).lista || []
      return {
        ...(a || {}),
        lista: item.id
          ? l.map(c => (c.id === item.id ? item : c))
          : [
              {
                ...item,
                id: novoId(),
                criado: Date.now(),
              },
              ...l,
            ],
      }
    })
    setForm(null)
  }
  const agendar = c => {
    if (!c.proximo) return
    adicionarEvento({
      titulo: `${um}: ${c.nome}`,
      data: c.proximo,
      hora: c.hora || '',
      descricao: [c.telefone && `Telefone: ${c.telefone}`, c.notas].filter(Boolean).join('\n'),
    })
    setAgendado(a => ({
      ...a,
      [c.id]: true,
    }))
  }
  const confirmarApagar = () => {
    setDados(a => ({
      ...(a || {}),
      lista: ((a || {}).lista || []).filter(c => c.id !== apagar.id),
    }))
    setApagar(null)
  }
  return (
    <Coluna>
      {!simples && lista.length > 4 && (
        <label style={styles.busca}>
          <Search size={18} color="var(--text-3)" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder={`Buscar ${rotulo.toLowerCase()}`}
            aria-label={`Buscar ${rotulo.toLowerCase()}`}
            style={styles.buscaInput}
          />
        </label>
      )}

      {filtrados.length === 0 ? (
        <Card>
          <Vazio
            icone={Users}
            titulo={busca ? 'Ninguém encontrado' : `Nenhum ${um.toLowerCase()} ainda`}
            texto={
              busca
                ? 'Tente outro nome.'
                : `Guarde telefone, anotações e o próximo contato de cada ${um.toLowerCase()}.`
            }
          />
        </Card>
      ) : (
        <Coluna gap={10} className="stagger">
          {filtrados.map(c => {
            const exp = aberto === c.id
            const atrasado = c.proximo && c.proximo < diaHoje
            const whats = linkWhats(c.telefone)
            return (
              <Card key={c.id} cor={exp ? 'lavanda' : 'branco'}>
                <button onClick={() => setAberto(exp ? null : c.id)} style={styles.cab} aria-expanded={exp}>
                  <span style={styles.avatar}>{c.nome.trim().charAt(0).toUpperCase()}</span>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textAlign: 'left',
                    }}
                  >
                    <p style={styles.nome}>{c.nome}</p>
                    {c.telefone && <p style={styles.tel}>{c.telefone}</p>}
                  </div>
                  {c.proximo && (
                    <Tag cor={atrasado ? 'lima' : 'ceu'} icone={CalendarClock}>
                      {c.proximo === diaHoje ? 'Hoje' : dataCurta(c.proximo)}
                    </Tag>
                  )}
                </button>
                {exp && (
                  <div
                    className="anim-fade"
                    style={{
                      marginTop: 14,
                    }}
                  >
                    {c.notas && <p style={styles.notas}>{c.notas}</p>}
                    <div style={styles.acoes}>
                      {c.telefone && (
                        <a href={`tel:${c.telefone.replace(/[^\d+]/g, '')}`} style={styles.link}>
                          <Phone size={18} /> Ligar
                        </a>
                      )}
                      {whats && (
                        <a href={whats} target="_blank" rel="noreferrer" style={styles.link}>
                          <MessageCircle size={18} /> WhatsApp
                        </a>
                      )}
                      {c.proximo && (
                        <button
                          onClick={() => agendar(c)}
                          style={styles.link}
                          className={agendado[c.id] ? 'check-pop' : undefined}
                        >
                          {agendado[c.id] ? <Check size={18} /> : <CalendarPlus size={18} />}{' '}
                          {agendado[c.id] ? 'Na agenda' : 'Pôr na agenda'}
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        ...styles.acoes,
                        marginTop: 10,
                      }}
                    >
                      <Botao
                        variante="fantasma"
                        icone={Pencil}
                        onClick={() =>
                          setForm({
                            ...FORM_VAZIO,
                            ...c,
                          })
                        }
                      >
                        Editar
                      </Botao>
                      <BotaoIcone
                        icone={Trash2}
                        label={`Apagar ${c.nome}`}
                        variante="branco"
                        onClick={() => setApagar(c)}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </Coluna>
      )}

      <Botao
        variante="primario"
        icone={Plus}
        grande={simples}
        cheio
        onClick={() =>
          setForm({
            ...FORM_VAZIO,
          })
        }
      >
        Novo {um.toLowerCase()}
      </Botao>

      <Sheet
        aberto={!!form}
        onFechar={() => setForm(null)}
        titulo={form?.id ? `Editar ${um.toLowerCase()}` : `Novo ${um.toLowerCase()}`}
      >
        {form && (
          <form onSubmit={salvar} style={styles.form}>
            <Entrada
              rotulo="Nome"
              placeholder="Nome completo"
              value={form.nome}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  nome: e.target.value,
                }))
              }
              altura={h}
            />
            <Entrada
              rotulo="Telefone"
              type="tel"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={form.telefone}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  telefone: e.target.value,
                }))
              }
              altura={h}
            />
            <Entrada
              rotulo="Anotações"
              multilinha
              rows={3}
              placeholder="Preferências, histórico, pendências"
              value={form.notas}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  notas: e.target.value,
                }))
              }
              altura={h * 2}
            />
            <div
              style={{
                display: 'flex',
                gap: 10,
              }}
            >
              <Entrada
                rotulo="Próximo contato"
                type="date"
                value={form.proximo}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    proximo: e.target.value,
                  }))
                }
                altura={h}
              />
              <Entrada
                rotulo="Hora"
                type="time"
                value={form.hora}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    hora: e.target.value,
                  }))
                }
                altura={h}
                style={{
                  width: 120,
                }}
              />
            </div>
            <Botao variante="primario" icone={Check} grande cheio type="submit" disabled={!form.nome.trim()}>
              Salvar
            </Botao>
          </form>
        )}
      </Sheet>

      <Modal
        aberto={!!apagar}
        onFechar={() => setApagar(null)}
        titulo={`Apagar ${apagar?.nome || ''}?`}
        texto="Os dados e anotações serão removidos."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setApagar(null),
          },
          {
            label: 'Apagar',
            variante: 'perigo',
            onClick: confirmarApagar,
          },
        ]}
      />
    </Coluna>
  )
}
const styles = {
  busca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 25,
    padding: '0 16px',
    minHeight: 48,
  },
  buscaInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    fontSize: 16,
    height: 46,
  },
  cab: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#000',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 19,
    fontWeight: 800,
    flexShrink: 0,
    color: '#000',
  },
  nome: {
    fontSize: 17,
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tel: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 2,
  },
  notas: {
    fontSize: 15,
    lineHeight: 1.45,
    color: '#000',
    whiteSpace: 'pre-wrap',
    background: 'rgba(255,255,255,0.6)',
    borderRadius: 15,
    padding: '10px 14px',
    marginBottom: 12,
  },
  acoes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    padding: '0 18px',
    borderRadius: 25,
    background: 'var(--surface)',
    color: '#000',
    fontSize: 15,
    fontWeight: 600,
    boxShadow: 'var(--sombra)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
}
