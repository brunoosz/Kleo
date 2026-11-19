import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Mic,
  MessageCircle,
  Calendar,
  FileText,
  Camera,
  ChevronRight,
  KeyRound,
  Search,
  MapPin,
  Plus,
  GlassWater,
  Accessibility,
  Sparkles,
  Siren,
} from 'lucide-react'
import Tela from '../components/Tela'
import { Card, Botao, BotaoIcone, Chip, Tag, TituloSecao } from '../components/ui'
import LogoKleo from '../components/LogoKleo'
import Mascote from '../components/Mascote'
import RotinaItem from '../components/RotinaItem'
import HomeDispositivo from '../components/HomeDispositivo'
import HomePessoas from '../components/HomePessoas'
import InstalarApp from '../components/InstalarApp'
import { acionarEmergencia } from '../lib/emergencia'
import { somarCopo, coposDoDia, metaCopos, relativo, minutosAte } from '../components/RotinaUtil'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import useAgora from '../components/profissao/useAgora'
import { hojeISO } from '../lib/storage'
import { temIA } from '../lib/ia'
import { ocorrenciasDoDia, marcarFeito, rotinaAtivaEm, paraMinutos } from '../lib/rotinas'
import { profissoesDoUsuario } from '../data/profissoes'
import { rotaAcessivelPadrao } from '../lib/perfil'
import { infoFerramenta } from '../ferramentas'
function saudacao(d) {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}
function dataExtenso(d) {
  const t = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function rotuloData(iso, agora) {
  const amanha = new Date(agora)
  amanha.setDate(amanha.getDate() + 1)
  if (iso === hojeISO(agora)) return 'Hoje'
  if (iso === hojeISO(amanha)) return 'Amanhã'
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
    .replace('.', '')
}
const CORES_FERRAMENTA = ['lavanda', 'mist', 'lima', 'ceu']
function ferramentasFavoritas(profile) {
  const profs = profissoesDoUsuario(profile)
  const saida = []
  for (let i = 0; i < 6 && saida.length < 4; i++) {
    for (const p of profs) {
      const f = p.ferramentas?.[i]
      if (!f || saida.length >= 4) continue
      const info = infoFerramenta(f.id, f.config)
      if (info)
        saida.push({
          chave: `${p.id}_${f.id}_${i}`,
          nome: info.nome,
          icone: info.icone,
          prof: p,
        })
    }
  }
  return saida
}
export default function Home() {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [profile] = useStorage('kleo_profile', null)
  useStorage('kleo_ia_integrada', null)
  const [eventos] = useStorage('kleo_events', [])
  const [rotinasSalvas] = useStorage('kleo_rotinas', [])
  useStorage('kleo_agua', {})
  const agoraMs = useAgora(30000)
  const agora = new Date(agoraMs)
  const hoje = hojeISO(agora)
  const minAgora = agora.getHours() * 60 + agora.getMinutes()
  const [concluindo, setConcluindo] = useState([])
  const timers = useRef([])
  const nome = (profile?.name || '').trim().split(' ')[0]
  const iaOk = temIA('chat')
  const rotinas = Array.isArray(rotinasSalvas) ? rotinasSalvas : []
  const ocorrencias = ocorrenciasDoDia(hoje).filter(o => o.rotina.tipo !== 'agua')
  const feitosHoje = ocorrencias.filter(o => o.feito).length
  const pendentes = ocorrencias.filter(o => !o.feito && paraMinutos(o.hora) >= minAgora - 180)
  const agua = rotinas.find(r => r.tipo === 'agua' && rotinaAtivaEm(r, hoje))
  const copos = coposDoDia(hoje)
  const meta = metaCopos(rotinas)
  const proximosEventos = (Array.isArray(eventos) ? eventos : [])
    .filter(
      e =>
        e?.data &&
        (e.data > hoje || (e.data === hoje && (!e.hora || (paraMinutos(e.hora) ?? 0) >= minAgora - 30))),
    )
    .sort((a, b) => (a.data + (a.hora || '99:99')).localeCompare(b.data + (b.hora || '99:99')))
  const chaveOc = o => o.rotina.id + '@' + o.hora
  const tocarItem = o => {
    const k = chaveOc(o)
    if (concluindo.includes(k)) return
    setConcluindo(c => [...c, k])
    timers.current.push(
      setTimeout(() => {
        marcarFeito(o.rotina.id, hoje, o.hora, true)
        setConcluindo(c => c.filter(x => x !== k))
      }, 520),
    )
  }
  const linhaRotina = (o, extra = {}) => {
    const k = chaveOc(o)
    const saindo = concluindo.includes(k)
    const diff = minutosAte(o.hora, agora)
    return (
      <li
        key={k}
        className={saindo ? 'item-out' : undefined}
        style={
          saindo
            ? {
                animationDelay: '0.25s',
              }
            : undefined
        }
      >
        <RotinaItem
          ocorrencia={
            saindo
              ? {
                  ...o,
                  feito: true,
                }
              : o
          }
          onMarcar={tocarItem}
          atrasado={diff < 0}
          quando={Math.abs(diff) <= 180 ? relativo(diff) : ''}
          compacto
          {...extra}
        />
      </li>
    )
  }
  const topo = (
    <header style={styles.topo}>
      <div style={styles.marca}>
        <LogoKleo tamanho={34} />
      </div>
      <div style={styles.topoAcoes}>
        <button
          type="button"
          className="tap"
          onClick={() => acionarEmergencia('', 'inicio')}
          style={{
            ...styles.sos,
            minHeight: simples ? 56 : 44,
            padding: simples ? '0 16px' : '0 14px',
            fontSize: simples ? 18 : 15,
          }}
          aria-label="SOS: pedir ajuda aos contatos de emergência"
        >
          <Siren size={simples ? 22 : 18} aria-hidden="true" /> SOS
        </button>
        {simples ? (
          <Botao variante="fantasma" icone={Settings} onClick={() => navigate('/configuracoes')}>
            Ajustes
          </Botao>
        ) : (
          <BotaoIcone icone={Settings} label="Ajustes" onClick={() => navigate('/configuracoes')} />
        )}
      </div>
    </header>
  )
  const saudacaoBloco = (
    <div style={styles.saudacaoBloco}>
      <h1
        style={{
          ...styles.saudacao,
          fontSize: simples ? 40 : 44,
        }}
      >
        {saudacao(agora)}
        {nome ? ',' : ''}
        {nome && (
          <>
            <br />
            <span style={styles.nome}>{nome}</span>
          </>
        )}
      </h1>
      <p
        style={{
          ...styles.data,
          fontSize: simples ? 19 : 17,
        }}
      >
        {dataExtenso(agora)}
      </p>
    </div>
  )
  if (simples) {
    const proximoRemedio = pendentes[0]
    const proximoEvento = proximosEventos[0]
    return (
      <Tela>
        <div className="stagger" style={styles.coluna}>
          {topo}
          {saudacaoBloco}

          <Card cor="lavanda" tamanho="g" style={styles.simplesCard}>
            <div style={styles.simplesLinha}>
              <Mascote estado="idle" tamanho={96} />
              <h2 style={styles.simplesTitulo}>Fale comigo</h2>
            </div>
            <Botao icone={Mic} grande cheio onClick={() => navigate('/chat?voz=1')} className="pulse-ring">
              Falar com a Kleo
            </Botao>
            <Botao
              variante="fantasma"
              icone={MessageCircle}
              grande
              cheio
              onClick={() => navigate('/chat')}
              style={{
                marginTop: 10,
              }}
            >
              Escrever
            </Botao>
          </Card>

          <InstalarApp variante="card" />

          <Card cor="lima" tamanho="g" style={styles.simplesCard}>
            <h2 style={styles.simplesTitulo}>Meus lembretes</h2>
            {proximoRemedio ? (
              <ul style={styles.lista}>{linhaRotina(proximoRemedio)}</ul>
            ) : (
              <p style={styles.simplesTexto}>
                {ocorrencias.length ? 'Tudo feito hoje. Muito bem!' : 'Nada para hoje.'}
              </p>
            )}
            {pendentes.length > 1 && <p style={styles.simplesTexto}>Mais {pendentes.length - 1} hoje</p>}
            <Botao
              variante="fantasma"
              grande
              cheio
              onClick={() => navigate(ocorrencias.length ? '/rotinas' : '/rotinas?novo=1')}
              style={{
                marginTop: 12,
              }}
            >
              {ocorrencias.length ? 'Ver lembretes' : 'Criar lembrete'}
            </Botao>
          </Card>

          <Card cor="ceu" tamanho="g" style={styles.simplesCard}>
            <h2 style={styles.simplesTitulo}>Para onde vamos?</h2>
            <Botao
              icone={MapPin}
              grande
              cheio
              onClick={() => navigate('/mapa')}
              style={{
                marginTop: 12,
              }}
            >
              Abrir o mapa
            </Botao>
          </Card>

          <Card tamanho="g" style={styles.simplesCard}>
            <h2 style={styles.simplesTitulo}>Minha agenda</h2>
            <p style={styles.simplesTexto}>
              {proximoEvento ? (
                <>
                  <strong>{proximoEvento.titulo}</strong>
                  <br />
                  {rotuloData(proximoEvento.data, agora)}
                  {proximoEvento.hora ? ` às ${proximoEvento.hora}` : ''}
                </>
              ) : (
                'Nada marcado.'
              )}
            </p>
            <Botao
              variante="suave"
              icone={Calendar}
              grande
              cheio
              onClick={() => navigate('/agenda')}
              style={{
                marginTop: 12,
              }}
            >
              Ver agenda
            </Botao>
          </Card>

          <HomePessoas simples />
        </div>
      </Tela>
    )
  }
  const favoritas = ferramentasFavoritas(profile)
  const listaHoje = pendentes.slice(0, 3)
  return (
    <Tela>
      <div className="stagger" style={styles.coluna}>
        {topo}
        {saudacaoBloco}

        <Card cor="lavanda" tamanho="g" style={styles.hero} aria-label="Assistente Kleo">
          <div style={styles.heroMascote} className="anim-pop">
            <Mascote estado="idle" tamanho={132} />
          </div>
          <Tag cor="var(--surface)" icone={Sparkles}>
            Sua assistente
          </Tag>
          <h2 style={styles.heroTitulo}>
            Como posso
            <br />
            ajudar?
          </h2>
          <div style={styles.heroAcoes}>
            <Botao
              icone={MessageCircle}
              onClick={() => navigate('/chat')}
              style={{
                flex: 1,
              }}
            >
              Falar com a Kleo
            </Botao>
            <span
              className="pulse-ring"
              style={{
                borderRadius: '50%',
                display: 'inline-flex',
              }}
            >
              <BotaoIcone
                icone={Mic}
                label="Falar por voz com a Kleo"
                onClick={() => navigate('/chat?voz=1')}
              />
            </span>
          </div>
          {!iaOk && (
            <button
              type="button"
              onClick={() => navigate('/configuracoes?secao=ia')}
              style={styles.avisoIA}
              className="anim-fade tap"
            >
              <KeyRound size={15} aria-hidden="true" />
              <span>Kleo indisponível agora</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          )}
        </Card>

        <InstalarApp variante="card" />

        <Card cor="lima" tamanho="g" aria-label="Hoje">
          <div style={styles.cardTopo}>
            <div>
              <h2 style={styles.cardTitulo}>Hoje</h2>
              {ocorrencias.length > 0 && (
                <span style={styles.cardSub}>
                  {feitosHoje} de {ocorrencias.length} feitos
                </span>
              )}
            </div>
            <button type="button" onClick={() => navigate('/rotinas')} style={styles.link}>
              Ver tudo <ChevronRight size={16} />
            </button>
          </div>
          {ocorrencias.length > 0 && (
            <div style={styles.trilho} aria-hidden="true">
              <span
                style={{
                  ...styles.barra,
                  width: `${(feitosHoje / ocorrencias.length) * 100}%`,
                }}
              />
            </div>
          )}

          {listaHoje.length > 0 ? (
            <ul
              style={{
                ...styles.lista,
                ...styles.listaBranca,
              }}
            >
              {listaHoje.map(o => linhaRotina(o))}
            </ul>
          ) : (
            <div style={styles.vazioHoje} className="anim-fade">
              <p style={styles.vazioTexto}>
                {ocorrencias.length ? 'Tudo feito por agora.' : 'Sem lembretes para hoje.'}
              </p>
              <Chip cor="branco" icone={Plus} onClick={() => navigate('/rotinas?novo=1')}>
                Novo lembrete
              </Chip>
            </div>
          )}

          {agua && (
            <div style={styles.agua}>
              <GlassWater size={20} aria-hidden="true" />
              <span
                style={{
                  flex: 1,
                }}
              >
                Água:{' '}
                <strong
                  key={copos}
                  className="valor-muda"
                  style={{
                    display: 'inline-block',
                  }}
                >
                  {copos}
                </strong>{' '}
                de {meta} copos
              </span>
              <Chip cor="branco" icone={Plus} onClick={() => somarCopo(1, hoje)}>
                Copo
              </Chip>
            </div>
          )}

          {proximosEventos.length > 0 && (
            <ul style={styles.eventos}>
              {proximosEventos.slice(0, 2).map(ev => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => navigate('/agenda')}
                    style={styles.evento}
                    className="tap"
                  >
                    <Calendar size={18} aria-hidden="true" />
                    <span style={styles.eventoTitulo}>{ev.titulo}</span>
                    <span style={styles.eventoQuando}>
                      {rotuloData(ev.data, agora)}
                      {ev.hora ? ` · ${ev.hora}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card cor="ceu" tamanho="g" aria-label="Mapa">
          <div style={styles.cardTopo}>
            <h2 style={styles.cardTitulo}>
              Para onde
              <br />
              vamos?
            </h2>
            <span style={styles.mapaPino} aria-hidden="true">
              <MapPin size={26} color="#000" />
            </span>
          </div>
          <button type="button" onClick={() => navigate('/mapa')} style={styles.buscaFalsa} className="tap">
            <Search size={19} color="var(--text-3)" aria-hidden="true" />
            <span>Buscar um lugar</span>
          </button>
          <div style={styles.chips}>
            {['Farmácia', 'Hospital', 'Mercado'].map(l => (
              <Chip key={l} cor="branco" onClick={() => navigate(`/mapa?q=${encodeURIComponent(l)}`)}>
                {l}
              </Chip>
            ))}
            {rotaAcessivelPadrao(profile) && (
              <Tag cor="lima" icone={Accessibility}>
                Rotas acessíveis
              </Tag>
            )}
          </div>
        </Card>

        <HomePessoas />

        {favoritas.length > 0 && (
          <section aria-label="Seu trabalho">
            <TituloSecao
              acao={{
                label: 'Ver tudo',
                onClick: () => navigate('/profissao'),
              }}
              style={{
                margin: '10px 2px 12px',
              }}
            >
              Seu trabalho
            </TituloSecao>
            <div style={styles.grade}>
              {favoritas.map((f, i) => {
                const Icone = f.icone
                return (
                  <Card
                    key={f.chave}
                    cor={CORES_FERRAMENTA[i % 4]}
                    onClick={() => navigate(`/profissao/${f.prof.id}`)}
                    style={styles.ferramenta}
                    aria-label={`${f.nome}, ${f.prof.label}`}
                  >
                    <span style={styles.ferrIcone}>{Icone && <Icone size={22} color="#000" />}</span>
                    <span style={styles.ferrNome}>{f.nome}</span>
                    <span style={styles.ferrProf}>{f.prof.label}</span>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        <div style={styles.atalhos}>
          {[
            {
              id: 'agenda',
              label: 'Agenda',
              icone: Calendar,
              rota: '/agenda',
            },
            {
              id: 'notas',
              label: 'Notas',
              icone: FileText,
              rota: '/notas',
            },
            {
              id: 'camera',
              label: 'Câmera',
              icone: Camera,
              rota: '/chat?camera=1',
            },
          ].map(a => (
            <Card key={a.id} onClick={() => navigate(a.rota)} style={styles.atalho} aria-label={a.label}>
              <a.icone size={24} color="#000" aria-hidden="true" />
              <span style={styles.atalhoNome}>{a.label}</span>
            </Card>
          ))}
        </div>

        <HomeDispositivo />
      </div>
    </Tela>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    rowGap: 10,
    paddingTop: 'max(8px, env(safe-area-inset-top))',
  },
  marca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  topoAcoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 'auto',
  },
  sos: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 'var(--r-btn)',
    background: '#d92d34',
    color: '#fff',
    fontWeight: 800,
    letterSpacing: '0.04em',
    boxShadow: '0 6px 18px rgba(217,45,52,0.28)',
  },
  saudacaoBloco: {
    padding: '6px 2px 4px',
  },
  saudacao: {
    fontWeight: 800,
    lineHeight: 0.98,
    color: 'var(--text)',
  },
  nome: {
    overflowWrap: 'anywhere',
  },
  data: {
    color: 'var(--text-2)',
    marginTop: 10,
  },
  hero: {
    overflow: 'hidden',
    paddingTop: 24,
  },
  heroMascote: {
    position: 'absolute',
    right: 4,
    top: 6,
    pointerEvents: 'none',
  },
  heroTitulo: {
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1,
    marginTop: 14,
    maxWidth: '62%',
  },
  heroAcoes: {
    display: 'flex',
    gap: 10,
    marginTop: 22,
    alignItems: 'center',
  },
  avisoIA: {
    marginTop: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    background: 'var(--surface)',
    borderRadius: 'var(--r-badge)',
    padding: '8px 14px',
    color: '#000',
    minHeight: 40,
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitulo: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1,
  },
  cardSub: {
    fontSize: 15,
    fontWeight: 600,
    display: 'block',
    marginTop: 6,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 15,
    fontWeight: 600,
    minHeight: 40,
    color: '#000',
  },
  trilho: {
    height: 8,
    borderRadius: 4,
    background: 'var(--surface)',
    margin: '14px 0 4px',
    overflow: 'hidden',
  },
  barra: {
    display: 'block',
    height: '100%',
    borderRadius: 4,
    background: '#000',
    transition: 'width 0.6s var(--spring)',
  },
  lista: {
    listStyle: 'none',
    margin: '12px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  listaBranca: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: '6px 14px',
  },
  vazioHoje: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  vazioTexto: {
    fontSize: 17,
  },
  agua: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: '8px 8px 8px 16px',
    fontSize: 16,
  },
  eventos: {
    listStyle: 'none',
    margin: '10px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  evento: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    padding: '0 14px',
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    textAlign: 'left',
    color: '#000',
  },
  eventoTitulo: {
    flex: 1,
    minWidth: 0,
    fontWeight: 700,
    fontSize: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  eventoQuando: {
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    textTransform: 'capitalize',
  },
  mapaPino: {
    width: 52,
    height: 52,
    borderRadius: '30%',
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buscaFalsa: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    marginTop: 18,
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    padding: '0 18px',
    fontSize: 16,
    color: 'var(--text-3)',
    boxShadow: 'var(--sombra)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  grade: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  ferramenta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    minHeight: 138,
    padding: 18,
  },
  ferrIcone: {
    width: 44,
    height: 44,
    borderRadius: '30%',
    background: 'var(--surface)',
    marginBottom: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ferrNome: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.15,
    marginTop: 12,
  },
  ferrProf: {
    fontSize: 13,
    color: 'var(--text-2)',
  },
  atalhos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  atalho: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '18px 8px',
    textAlign: 'center',
  },
  atalhoNome: {
    fontSize: 15,
    fontWeight: 600,
  },
  simplesCard: {
    padding: 24,
  },
  simplesLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  simplesTitulo: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.05,
  },
  simplesTexto: {
    fontSize: 19,
    lineHeight: 1.4,
    marginTop: 10,
  },
}
