import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Plus, Camera, SlidersHorizontal, ChevronRight, Briefcase } from 'lucide-react'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { NAV_ITEMS, NAV_FIXOS, extrasValidos, iconeNav } from '../data/navItems'
import * as Prof from '../data/profissoes'
import { Sheet, Card, Botao, TituloSecao } from './ui'
let ultimaPos = null
const CORES_SALAS = ['lavanda', 'lima', 'ceu', 'branco', 'mist']
const casa = (pathname, rota) => pathname === rota || pathname.startsWith(rota + '/')
function listarProfissoes(profile) {
  if (!profile) return []
  let lista
  if (typeof Prof.profissoesDoUsuario === 'function') {
    lista = Prof.profissoesDoUsuario(profile) || []
  } else {
    const ids = [
      profile.profissao,
      ...(Array.isArray(profile.profissoesExtras) ? profile.profissoesExtras : []),
    ]
    lista = ids.filter(Boolean).map(id => Prof.getProfissao(id))
  }
  const vistos = new Set()
  return lista.filter(p => p && !vistos.has(p.id) && vistos.add(p.id))
}
export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [extrasSalvos] = useStorage('kleo_nav_order', null)
  const [profile] = useStorage('kleo_profile', null)
  const [naoLidas] = useStorage('kleo_rede_naolidas', 0)
  const simples = useModoSimples()
  const [tudoAberto, setTudoAberto] = useState(false)
  const extras = extrasValidos(extrasSalvos).slice(0, simples ? 1 : 2)
  const itens = [...NAV_FIXOS, ...extras].map(id => NAV_ITEMS.find(i => i.id === id)).filter(Boolean)
  const chaveItens = itens.map(i => i.id).join(',')
  let idxAtivo = itens.findIndex(i => casa(pathname, i.rota))
  const rotaInterna = NAV_ITEMS.some(i => casa(pathname, i.rota))
  if (idxAtivo < 0 && rotaInterna) idxAtivo = itens.length
  const total = itens.length + 1
  const navRef = useRef(null)
  const iconesRef = useRef([])
  const [pos, setPos] = useState(ultimaPos)
  useLayoutEffect(() => {
    const medir = () => {
      const el = iconesRef.current[idxAtivo]
      if (!el || !navRef.current) return null
      const btn = el.offsetParent
      return {
        left: btn.offsetLeft + el.offsetLeft,
        top: btn.offsetTop + el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      }
    }
    const nova = idxAtivo >= 0 ? medir() : null
    ultimaPos = nova
    let r2
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setPos(nova))
    })
    const aoRedimensionar = () => {
      const p = medir()
      ultimaPos = p
      setPos(p)
    }
    window.addEventListener('resize', aoRedimensionar)
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
      window.removeEventListener('resize', aoRedimensionar)
    }
  }, [idxAtivo, simples, chaveItens])
  const ir = rota => {
    setTudoAberto(false)
    navigate(rota)
  }
  const renderBotao = (i, Icone, label, onClick, badge = 0) => {
    const ativo = i === idxAtivo
    return (
      <button
        key={label + i}
        type="button"
        onClick={onClick}
        style={styles.item}
        aria-label={badge ? `${label}, ${badge} nova${badge > 1 ? 's' : ''}` : label}
        aria-current={ativo ? 'page' : undefined}
      >
        <span
          ref={el => {
            iconesRef.current[i] = el
          }}
          className={ativo ? 'nav-ativo' : undefined}
          style={{
            ...styles.iconeWrap,
            position: 'relative',
            padding: total > 5 ? '5px 12px' : '6px 16px',
            background: ativo && !pos ? 'var(--lavanda)' : 'transparent',
          }}
        >
          <Icone
            size={simples ? 27 : 22}
            strokeWidth={ativo ? 2.4 : 1.9}
            color={ativo ? '#000' : 'var(--text-2)'}
            aria-hidden="true"
          />
          {badge > 0 && (
            <span key={badge} className="anim-pop" style={styles.badge} aria-hidden="true">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        <span
          style={{
            ...styles.label,
            fontSize: simples ? 13 : 11,
            color: ativo ? '#000' : 'var(--text-2)',
            fontWeight: ativo ? 700 : 500,
          }}
        >
          {label}
        </span>
      </button>
    )
  }
  return (
    <>
      <div style={styles.faixa}>
        <nav
          ref={navRef}
          style={{
            ...styles.nav,
            height: simples ? 84 : 'var(--nav-h)',
          }}
          aria-label="Navegação principal"
        >
          {pos && (
            <span
              aria-hidden="true"
              style={{
                ...styles.indicador,
                left: pos.left,
                top: pos.top,
                width: pos.width,
                height: pos.height,
              }}
            />
          )}
          {itens.map((item, i) =>
            renderBotao(
              i,
              iconeNav(item, profile),
              item.label,
              () => navigate(item.rota),
              item.id === 'pessoas' ? Number(naoLidas) || 0 : 0,
            ),
          )}
          {renderBotao(
            itens.length,
            simples ? LayoutGrid : Plus,
            'Mais',
            () => setTudoAberto(true),
            itens.some(i => i.id === 'pessoas') ? 0 : Number(naoLidas) || 0,
          )}
        </nav>
      </div>

      <PainelTudo
        aberto={tudoAberto}
        onFechar={() => setTudoAberto(false)}
        ir={ir}
        profile={profile}
        simples={simples}
        pathname={pathname}
        naoLidas={Number(naoLidas) || 0}
      />
    </>
  )
}
function PainelTudo({ aberto, onFechar, ir, profile, simples, pathname, naoLidas = 0 }) {
  const profissoes = listarProfissoes(profile)
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Tudo">
      <div
        style={{
          ...styles.grade,
          gridTemplateColumns: simples ? '1fr' : '1fr 1fr',
        }}
        className="stagger"
      >
        {NAV_ITEMS.map((item, i) => {
          const Icone = iconeNav(item, profile)
          const ativo = casa(pathname, item.rota)
          const novas = item.id === 'pessoas' ? naoLidas : 0
          return (
            <Card
              key={item.id}
              cor={CORES_SALAS[i % CORES_SALAS.length]}
              onClick={() => ir(item.rota)}
              aria-current={ativo ? 'page' : undefined}
              aria-label={novas ? `${item.label}, ${novas} nova${novas > 1 ? 's' : ''}` : undefined}
              style={{
                ...styles.sala,
                ...(simples ? styles.salaLinha : null),
                ...(ativo
                  ? {
                      outline: '2px solid #000',
                    }
                  : null),
              }}
            >
              <span style={styles.salaIcone}>
                <Icone size={simples ? 26 : 22} color="#000" strokeWidth={2.1} aria-hidden="true" />
                {novas > 0 && (
                  <span style={styles.badge} aria-hidden="true">
                    {novas > 9 ? '9+' : novas}
                  </span>
                )}
              </span>
              <span
                style={{
                  ...styles.salaTexto,
                  fontSize: simples ? 20 : 17,
                }}
              >
                {item.label}
              </span>
            </Card>
          )
        })}
      </div>

      <Card
        cor="ceu"
        onClick={() => ir('/chat?camera=1')}
        style={{
          ...styles.linha,
          marginTop: 12,
        }}
      >
        <span
          style={{
            ...styles.linhaIcone,
            background: '#fff',
          }}
        >
          <Camera size={22} color="#000" aria-hidden="true" />
        </span>
        <span style={styles.linhaTextos}>
          <span style={styles.linhaTitulo}>Câmera Kleo</span>
          {!simples && <span style={styles.linhaSub}>Aponte para algo e pergunte</span>}
        </span>
        <ChevronRight size={20} color="#000" aria-hidden="true" />
      </Card>

      <TituloSecao>{profissoes.length > 1 ? 'Suas profissões' : 'Seu trabalho'}</TituloSecao>
      <div style={styles.coluna}>
        {profissoes.map((p, i) => {
          const Icone = p.icone || p.icon || Briefcase
          return (
            <Card key={p.id} onClick={() => ir('/profissao/' + p.id)} style={styles.linha}>
              <span
                style={{
                  ...styles.linhaIcone,
                  background: i === 0 ? 'var(--lavanda)' : 'var(--surface-2)',
                }}
              >
                <Icone size={22} color="#000" aria-hidden="true" />
              </span>
              <span style={styles.linhaTextos}>
                <span style={styles.linhaTitulo}>{p.label}</span>
                {!simples && (
                  <span style={styles.linhaSub}>
                    {i === 0 ? 'Profissão principal' : 'Ferramentas de trabalho'}
                  </span>
                )}
              </span>
              <ChevronRight size={20} color="var(--text-2)" aria-hidden="true" />
            </Card>
          )
        })}
        <Card
          cor="creme"
          onClick={() => ir('/configuracoes?secao=profissoes')}
          style={{
            ...styles.linha,
            ...styles.adicionar,
          }}
        >
          <span
            style={{
              ...styles.linhaIcone,
              background: 'var(--lima)',
            }}
          >
            <Plus size={22} color="#000" aria-hidden="true" />
          </span>
          <span style={styles.linhaTitulo}>Adicionar profissão</span>
        </Card>
      </div>

      <div
        style={{
          marginTop: 20,
        }}
      >
        <Botao
          variante="fantasma"
          icone={SlidersHorizontal}
          cheio
          onClick={() => ir('/configuracoes?secao=navegacao')}
        >
          Editar barra
        </Botao>
      </div>
    </Sheet>
  )
}
const styles = {
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    background: 'var(--erro)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    lineHeight: '18px',
    textAlign: 'center',
    boxShadow: '0 0 0 2px var(--surface)',
  },
  faixa: {
    flexShrink: 0,
    padding: '6px 10px calc(10px + env(safe-area-inset-bottom))',
    background: 'transparent',
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
  indicador: {
    position: 'absolute',
    borderRadius: 999,
    background: 'var(--lavanda)',
    pointerEvents: 'none',
    transition:
      'left 0.45s var(--spring), top 0.3s var(--ease-out), width 0.3s var(--ease-out), height 0.3s var(--ease-out)',
  },
  item: {
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
  label: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color 0.25s',
  },
  iconeWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    transition: 'background 0.3s',
  },
  grade: {
    display: 'grid',
    gap: 12,
  },
  sala: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    minHeight: 104,
  },
  salaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  salaIcone: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 15,
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salaTexto: {
    fontWeight: 700,
  },
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    minHeight: 68,
  },
  linhaIcone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  linhaTitulo: {
    fontSize: 17,
    fontWeight: 700,
    color: '#000',
  },
  linhaSub: {
    fontSize: 14,
    color: 'var(--text-2)',
  },
  adicionar: {
    border: '1.5px dashed var(--border)',
  },
}
