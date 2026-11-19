import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  Camera,
  Siren,
  Users,
  Calendar,
  FileText,
  AlarmClock,
  Settings,
  Check,
  Sparkles,
} from 'lucide-react'
import Mascote from '../components/Mascote'
import { Botao, Tag } from '../components/ui'
import { getMascoteSpec, resolverMascote } from '../data/mascotes'
import { NAV_ITEMS, NAV_FIXOS, extrasValidos, iconeNav } from '../data/navItems'
import { ler, salvar } from '../lib/storage'
import { falar, pararFala } from '../lib/voz'
import { lerPerfil, leituraVozAtiva, temNecessidade, rotaAcessivelPadrao, primeiroNome } from '../lib/perfil'
import useModoSimples from '../hooks/useModoSimples'
const TEXTO_BARRA = {
  home: {
    n: 'No Início você vê o seu dia: lembretes, agenda e atalhos. O botão SOS também fica aqui.',
    s: 'Aqui fica o seu dia. O botão SOS também.',
  },
  chat: {
    n: 'Aqui você conversa comigo, falando ou escrevendo. Eu também enxergo pela câmera.',
    s: 'Aqui você fala comigo.',
  },
  mapa: {
    n: 'No Mapa eu te levo aonde você quiser: a pé, de carro, de ônibus ou de metrô.',
    s: 'Aqui eu te levo aonde você quiser.',
  },
  pessoas: {
    n: 'Em Pessoas você conversa com a família e os amigos, por texto ou por áudio.',
    s: 'Aqui você fala com a família.',
  },
  agenda: {
    n: 'Na Agenda ficam suas consultas, compromissos e aniversários.',
    s: 'Aqui ficam suas consultas.',
  },
  notas: {
    n: 'Em Notas você anota o que quiser e faz listas, como a do mercado.',
    s: 'Aqui você anota e faz listas.',
  },
  rotinas: {
    n: 'Nas Rotinas eu te lembro do remédio, da água e das consultas.',
    s: 'Eu lembro do remédio e da água.',
  },
  profissao: {
    n: 'Em Trabalho ficam as ferramentas da sua profissão.',
    s: 'Aqui ficam as coisas do seu trabalho.',
  },
  configuracoes: {
    n: 'Em Ajustes você muda letras, voz, cores e o seu perfil.',
    s: 'Aqui você muda letras e voz.',
  },
  mais: {
    n: 'No Mais está todo o resto do app. Toque nele quando não achar alguma coisa.',
    s: 'No Mais tem todo o resto.',
  },
}
const RESTO = [
  {
    id: 'pessoas',
    icone: Users,
    cor: 'var(--lavanda)',
    titulo: 'Pessoas',
    onde: 'No Mais',
    texto: 'Converse com a família e os amigos por texto ou áudio.',
  },
  {
    id: 'rotinas',
    icone: AlarmClock,
    cor: 'var(--lima)',
    titulo: 'Rotinas',
    onde: 'No Mais',
    texto: 'Lembretes de remédio, água e consultas. Tem despertador.',
  },
  {
    id: 'agenda',
    icone: Calendar,
    cor: 'var(--ceu)',
    titulo: 'Agenda',
    onde: 'No Mais',
    texto: 'Consultas, compromissos e aniversários.',
  },
  {
    id: 'notas',
    icone: FileText,
    cor: 'var(--surface-2)',
    titulo: 'Notas',
    onde: 'No Mais',
    texto: 'Anotações e listas, como a do mercado.',
  },
  {
    id: 'profissao',
    icone: null,
    cor: 'var(--lavanda)',
    titulo: 'Trabalho',
    onde: 'No Mais',
    texto: 'As ferramentas da sua profissão.',
  },
  {
    id: 'camera',
    icone: Camera,
    cor: 'var(--ceu)',
    titulo: 'Câmera',
    onde: 'No Mais e no chat',
    texto: 'Aponte o celular e eu leio ou descrevo o que aparece.',
  },
  {
    id: 'configuracoes',
    icone: Settings,
    cor: 'var(--surface-2)',
    titulo: 'Ajustes',
    onde: 'No Mais',
    texto: 'Letras, voz, cores, seu perfil e o que eu sei sobre você.',
  },
  {
    id: 'sos',
    icone: Siren,
    cor: 'rgba(229, 72, 77, 0.16)',
    titulo: 'SOS',
    onde: 'No Início',
    texto: 'Pede ajuda: avisa seus contatos de emergência com a sua localização.',
  },
]
function posicaoNo(el, raiz) {
  let x = 0
  let y = 0
  let n = el
  while (n && n !== raiz) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent
  }
  if (n !== raiz) return null
  return {
    left: x,
    top: y,
    width: el.offsetWidth,
    height: el.offsetHeight,
  }
}
export default function Tutorial() {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const profile = useMemo(() => lerPerfil(), [])
  const mascoteId = useMemo(() => resolverMascote(profile, ler('kleo_mascote', 'auto')), [profile])
  const mascote = getMascoteSpec(mascoteId)
  const nome = primeiroNome(profile)
  const leitura = useMemo(() => leituraVozAtiva(profile), [profile])
  const surdo = useMemo(() => temNecessidade(profile, 'auditiva'), [profile])
  const semEscadas = useMemo(() => rotaAcessivelPadrao(profile), [profile])
  const itensNav = useMemo(() => {
    const extras = extrasValidos(ler('kleo_nav_order', null)).slice(0, simples ? 1 : 2)
    const itens = [...NAV_FIXOS, ...extras].map(id => NAV_ITEMS.find(i => i.id === id)).filter(Boolean)
    return [
      ...itens,
      {
        id: 'mais',
        label: 'Mais',
        icone: simples ? LayoutGrid : Plus,
      },
    ]
  }, [simples])
  const chaveItens = itensNav.map(i => i.id).join(',')
  const resto = useMemo(
    () =>
      RESTO.filter(r => !itensNav.some(i => i.id === r.id)).map(r =>
        r.icone
          ? r
          : {
              ...r,
              icone: iconeNav(
                NAV_ITEMS.find(i => i.id === r.id),
                profile,
              ),
            },
      ),
    [itensNav, profile],
  )
  const passos = useMemo(() => {
    const oi = simples
      ? `Oi${nome ? `, ${nome}` : ''}! Eu sou ${mascote.nome}. Vou te mostrar o app.`
      : `Olá${nome ? `, ${nome}` : ''}! Eu sou ${mascote.nome}. Vou te mostrar cada botão da barra lá embaixo.`
    const barra = itensNav.map(item => {
      const t = TEXTO_BARRA[item.id] || {
        n: item.label,
        s: item.label,
      }
      let texto = simples ? t.s : t.n
      if (item.id === 'mapa' && semEscadas) texto += ' A rota sem escadas já vem ligada.'
      return {
        tipo: 'barra',
        alvo: item.id,
        titulo: item.label,
        texto,
        icone: iconeNav(item, profile),
      }
    })
    const fim = simples
      ? 'Estas telas ficam no botão Mais. Toque num cartão para ouvir.'
      : 'Estas telas não estão na barra: ficam no botão Mais. Toque num cartão para ouvir o que cada uma faz.'
    return [
      {
        tipo: 'oi',
        alvo: null,
        titulo: 'Oi!',
        texto: oi,
        icone: Sparkles,
      },
      ...barra,
      {
        tipo: 'resto',
        alvo: null,
        titulo: 'Conheça o resto do app',
        texto: fim,
        icone: LayoutGrid,
      },
    ]
  }, [simples, nome, mascote.nome, itensNav, semEscadas, profile])
  const [passo, setPasso] = useState(0)
  const [falando, setFalando] = useState(false)
  const [dir, setDir] = useState(1)
  const [vistos, setVistos] = useState(() => new Set())
  const tokenFala = useRef(0)
  const total = passos.length
  const indice = Math.min(passo, total - 1)
  const atual = passos[indice]
  const ultimo = indice === total - 1
  const narrar = useCallback(
    (texto, forcar = false) => {
      const token = ++tokenFala.current
      Promise.resolve()
        .then(() =>
          falar(texto, {
            forcar,
            mascote: mascoteId,
            onInicio: () => {
              if (tokenFala.current === token) setFalando(true)
            },
          }),
        )
        .catch(() => {})
        .finally(() => {
          if (tokenFala.current === token) setFalando(false)
        })
    },
    [mascoteId],
  )
  const falouInicio = useRef(false)
  useEffect(() => {
    if (!leitura || falouInicio.current) return
    falouInicio.current = true
    narrar(passos[0].texto, true)
  }, [leitura, narrar, passos])
  useEffect(
    () => () => {
      tokenFala.current++
      pararFala()
    },
    [],
  )
  const concluir = useCallback(() => {
    tokenFala.current++
    pararFala()
    salvar('kleo_tutorial_done', true)
    navigate('/home', {
      replace: true,
    })
  }, [navigate])
  const irPara = useCallback(
    novo => {
      setDir(novo > indice ? 1 : -1)
      setPasso(novo)
      if (!surdo || leitura) narrar(passos[novo].texto, leitura)
    },
    [indice, surdo, leitura, narrar, passos],
  )
  const avancar = useCallback(() => {
    if (ultimo) concluir()
    else irPara(indice + 1)
  }, [ultimo, concluir, irPara, indice])
  const voltar = useCallback(() => {
    if (indice > 0) irPara(indice - 1)
  }, [indice, irPara])
  useEffect(() => {
    function tecla(e) {
      if (e.key === 'ArrowRight') avancar()
      else if (e.key === 'ArrowLeft') voltar()
      else if (e.key === 'Escape') concluir()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [avancar, voltar, concluir])
  function ouvirCartao(r) {
    setVistos(v => new Set(v).add(r.id))
    narrar(`${r.titulo}. ${r.texto} Fica: ${r.onde.replace(/^No /, 'no ')}.`, true)
  }
  const raizRef = useRef(null)
  const itensRef = useRef({})
  const [foco, setFoco] = useState(null)
  const comFoco = atual.tipo === 'barra'
  useLayoutEffect(() => {
    const medir = () => {
      const el = atual.alvo ? itensRef.current[atual.alvo] : null
      const p = el && raizRef.current ? posicaoNo(el, raizRef.current) : null
      if (!p) return null
      const folga = 5
      return {
        left: p.left - folga,
        top: p.top - folga,
        width: p.width + folga * 2,
        height: p.height + folga * 2,
      }
    }
    const r = requestAnimationFrame(() => {
      const p = medir()
      if (p) setFoco(p)
    })
    const aoRedimensionar = () => {
      const p = medir()
      if (p) setFoco(p)
    }
    window.addEventListener('resize', aoRedimensionar)
    return () => {
      cancelAnimationFrame(r)
      window.removeEventListener('resize', aoRedimensionar)
    }
  }, [atual.alvo, simples, chaveItens])
  const IconeAtual = atual.icone
  return (
    <div ref={raizRef} style={styles.root}>
      <header style={styles.header}>
        <div
          style={styles.progresso}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={indice + 1}
          aria-label={`Passo ${indice + 1} de ${total}`}
        >
          {passos.map((p, i) => (
            <span key={p.tipo + (p.alvo || i)} style={styles.seg}>
              <span
                style={{
                  ...styles.segFill,
                  transform: i <= indice ? 'scaleX(1)' : 'scaleX(0)',
                }}
              />
            </span>
          ))}
        </div>
        <button
          type="button"
          className="tap anim-fade"
          style={{
            ...styles.pular,
            minHeight: simples ? 52 : 44,
            fontSize: simples ? 18 : 16,
          }}
          onClick={concluir}
          aria-label="Pular tutorial"
        >
          Pular
        </button>
      </header>

      <main style={styles.main}>
        {atual.tipo !== 'resto' ? (
          <div style={styles.centro}>
            <div style={styles.mascoteBox} className="anim-pop">
              <span style={styles.mascoteChao} aria-hidden="true" />
              <Mascote id={mascote.id} estado={falando ? 'falando' : 'idle'} tamanho={simples ? 160 : 150} />
            </div>

            <div
              key={indice}
              className={`${dir === 1 ? 'anim-right' : 'anim-left'} stagger`}
              style={{
                ...styles.balao,
                background: atual.tipo === 'oi' ? 'var(--lavanda)' : 'var(--surface)',
              }}
              aria-live="polite"
            >
              <span style={styles.balaoPonta} aria-hidden="true">
                <svg width="28" height="14" viewBox="0 0 28 14">
                  <path d="M0 14 L14 0 L28 14 Z" fill={atual.tipo === 'oi' ? '#d8d1ff' : '#ffffff'} />
                </svg>
              </span>
              <div style={styles.balaoTopo}>
                <span style={styles.balaoIcone}>
                  <IconeAtual size={simples ? 24 : 22} color="#000" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span
                  style={{
                    ...styles.balaoTitulo,
                    fontSize: simples ? 26 : 24,
                  }}
                >
                  {atual.titulo}
                </span>
                <Tag cor={atual.tipo === 'oi' ? 'lima' : 'mist'} style={styles.etapa}>
                  {indice + 1} de {total}
                </Tag>
              </div>

              <p
                style={{
                  ...styles.legenda,
                  fontSize: simples ? 25 : 22,
                }}
              >
                {atual.texto}
              </p>
              <button
                type="button"
                className="tap"
                style={{
                  ...styles.ouvir,
                  minHeight: simples ? 52 : 44,
                }}
                onClick={() => narrar(atual.texto, true)}
                aria-label="Ouvir este passo"
              >
                {falando ? (
                  <span
                    className="wave"
                    style={{
                      height: 16,
                    }}
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <Volume2 size={19} aria-hidden="true" />
                )}
                {falando ? 'Falando...' : 'Ouvir'}
              </button>
            </div>
          </div>
        ) : (
          <div key="resto" className="anim-right" style={styles.resto}>
            <div style={styles.restoTopo}>
              <span style={styles.restoMascote}>
                <Mascote id={mascote.id} estado={falando ? 'falando' : 'idle'} tamanho={78} />
              </span>
              <span style={styles.restoTextos}>
                <h1
                  style={{
                    ...styles.restoTitulo,
                    fontSize: simples ? 30 : 28,
                  }}
                >
                  {atual.titulo}
                </h1>
                <p
                  style={{
                    ...styles.restoSub,
                    fontSize: simples ? 18 : 16,
                  }}
                >
                  {atual.texto}
                </p>
              </span>
            </div>
            <div
              className="stagger"
              style={{
                ...styles.grade,
                gridTemplateColumns: simples ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              }}
            >
              {resto.map(r => {
                const Icone = r.icone
                const visto = vistos.has(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="tap"
                    onClick={() => ouvirCartao(r)}
                    aria-label={`${r.titulo}: ${r.texto} ${r.onde}.`}
                    style={{
                      ...styles.cartao,
                      ...(simples ? styles.cartaoLinha : null),
                      outline: visto ? '2px solid #000' : 'none',
                    }}
                  >
                    <span
                      style={{
                        ...styles.cartaoIcone,
                        background: r.cor,
                      }}
                    >
                      <Icone
                        size={simples ? 26 : 22}
                        color={r.id === 'sos' ? 'var(--erro)' : '#000'}
                        strokeWidth={2.2}
                        aria-hidden="true"
                      />
                    </span>
                    <span style={styles.cartaoTextos}>
                      <span
                        style={{
                          ...styles.cartaoTitulo,
                          fontSize: simples ? 20 : 17,
                        }}
                      >
                        {r.titulo}
                      </span>
                      <span
                        style={{
                          ...styles.cartaoTexto,
                          fontSize: simples ? 16 : 14,
                        }}
                      >
                        {r.texto}
                      </span>
                      <span style={styles.cartaoOnde}>{r.onde}</span>
                    </span>
                    <span
                      style={{
                        ...styles.cartaoOuvir,
                        background: visto ? '#000' : 'var(--surface-2)',
                      }}
                      aria-hidden="true"
                    >
                      {visto ? (
                        <Check size={16} color="#fff" strokeWidth={3} className="anim-pop" />
                      ) : (
                        <Volume2 size={16} color="#000" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {!simples && (
              <p style={styles.dica}>
                Dá para trocar os botões da barra em Ajustes, na parte Barra inferior.
              </p>
            )}
          </div>
        )}
      </main>

      <div style={styles.controles}>
        <Botao
          variante="fantasma"
          icone={ChevronLeft}
          onClick={voltar}
          disabled={indice === 0}
          style={{
            flex: 1,
          }}
          aria-label="Passo anterior"
        >
          Voltar
        </Botao>
        <Botao
          onClick={avancar}
          style={{
            flex: 2,
          }}
          grande={simples}
        >
          <span key={ultimo ? 'fim' : 'prox'} className="anim-fade" style={styles.btnPriTxt}>
            {ultimo ? 'Começar' : 'Próximo'} {!ultimo && <ChevronRight size={20} aria-hidden="true" />}
          </span>
        </Botao>
      </div>

      <div style={styles.faixa} aria-hidden="true">
        <nav
          style={{
            ...styles.nav,
            height: simples ? 84 : 'var(--nav-h)',
          }}
        >
          {itensNav.map(item => {
            const Icon = iconeNav(item, profile)
            const ativo = comFoco && item.id === atual.alvo
            return (
              <div
                key={item.id}
                ref={el => {
                  itensRef.current[item.id] = el
                }}
                style={styles.navItem}
              >
                <span
                  style={{
                    ...styles.navIcone,
                    padding: itensNav.length > 5 ? '5px 12px' : '6px 16px',
                    background: ativo ? 'var(--lavanda)' : 'transparent',
                  }}
                >
                  <Icon
                    size={simples ? 27 : 22}
                    strokeWidth={ativo ? 2.4 : 1.9}
                    color={ativo ? '#000' : 'var(--text-2)'}
                  />
                </span>
                <span
                  style={{
                    ...styles.navLabel,
                    fontSize: simples ? 13 : 11,
                    color: ativo ? '#000' : 'var(--text-2)',
                    fontWeight: ativo ? 700 : 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </nav>
      </div>

      <div
        aria-hidden="true"
        style={{
          ...styles.veu,
          opacity: comFoco && foco ? 1 : 0,
        }}
      >
        {foco && (
          <span
            style={{
              ...styles.furo,
              left: foco.left,
              top: foco.top,
              width: foco.width,
              height: foco.height,
            }}
          >
            <span style={styles.furoAnel} />
          </span>
        )}
      </div>
      <style>{keyframes}</style>
    </div>
  )
}
const keyframes = `
@keyframes tutAnel {
  0%,100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.07); opacity: 0.55; }
}
`
const styles = {
  root: {
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    color: 'var(--text)',
    maxWidth: 520,
    margin: '0 auto',
    width: '100%',
  },
  header: {
    position: 'relative',
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 16px 0',
    paddingTop: 'max(14px, env(safe-area-inset-top))',
    flexShrink: 0,
  },
  progresso: {
    flex: 1,
    display: 'flex',
    gap: 5,
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    background: 'var(--surface-2)',
    overflow: 'hidden',
    display: 'block',
  },
  segFill: {
    display: 'block',
    height: '100%',
    borderRadius: 999,
    background: '#000',
    transformOrigin: 'left center',
    transition: 'transform 0.45s var(--ease-out)',
  },
  pular: {
    padding: '6px 18px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontWeight: 600,
  },
  main: {
    position: 'relative',
    zIndex: 30,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 16px',
  },
  centro: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  mascoteBox: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 8,
  },
  mascoteChao: {
    position: 'absolute',
    width: '86%',
    aspectRatio: '1',
    borderRadius: '50%',
    background: 'var(--surface-2)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -46%)',
  },
  balao: {
    position: 'relative',
    width: '100%',
    borderRadius: 'var(--r-card)',
    boxShadow: 'var(--sombra)',
    padding: '20px 20px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    transition: 'background 0.3s',
  },
  balaoPonta: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
  },
  balaoTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  balaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    background: 'var(--lima)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balaoTitulo: {
    flex: 1,
    minWidth: 0,
    fontWeight: 800,
    lineHeight: 1.05,
  },
  etapa: {
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  legenda: {
    fontWeight: 700,
    lineHeight: 1.2,
    color: 'var(--text)',
  },
  ouvir: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px',
    borderRadius: 'var(--r-btn)',
    background: '#000',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
  },
  resto: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingBottom: 8,
  },
  restoTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  restoMascote: {
    width: 86,
    height: 86,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  restoTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  restoTitulo: {
    fontWeight: 800,
    lineHeight: 1.02,
  },
  restoSub: {
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  grade: {
    display: 'grid',
    gap: 10,
  },
  cartao: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    padding: '16px 46px 16px 16px',
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    textAlign: 'left',
    color: 'var(--text)',
    outlineOffset: -2,
    minWidth: 0,
  },
  cartaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cartaoIcone: {
    width: 46,
    height: 46,
    borderRadius: 15,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
  },
  cartaoTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cartaoTitulo: {
    fontWeight: 800,
    lineHeight: 1.15,
  },
  cartaoTexto: {
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  cartaoOnde: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: 2,
  },
  cartaoOuvir: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.25s',
  },
  dica: {
    fontSize: 14,
    color: 'var(--text-3)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  controles: {
    position: 'relative',
    zIndex: 30,
    display: 'flex',
    gap: 10,
    padding: '8px 16px 10px',
    flexShrink: 0,
  },
  btnPriTxt: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  faixa: {
    position: 'relative',
    zIndex: 10,
    flexShrink: 0,
    padding: '18px 10px calc(10px + env(safe-area-inset-bottom))',
  },
  nav: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    background: 'var(--surface)',
    borderRadius: 24,
    boxShadow: 'var(--sombra)',
    padding: '0 4px',
  },
  navItem: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navIcone: {
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s',
  },
  navLabel: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color 0.3s',
  },
  veu: {
    position: 'absolute',
    inset: 0,
    zIndex: 20,
    pointerEvents: 'none',
    overflow: 'hidden',
    transition: 'opacity 0.35s ease',
  },
  furo: {
    position: 'absolute',
    borderRadius: 22,
    boxShadow: '0 0 0 2000px rgba(35, 28, 66, 0.3)',
    transition:
      'left 0.5s var(--spring), top 0.4s var(--ease-out), width 0.4s var(--ease-out), height 0.4s var(--ease-out)',
  },
  furoAnel: {
    position: 'absolute',
    inset: -5,
    borderRadius: 27,
    border: '3px solid var(--lima)',
    boxShadow: '0 0 0 3px #000',
    animation: 'tutAnel 1.4s ease-in-out infinite',
  },
}
