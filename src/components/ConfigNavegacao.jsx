import { Lock, Check, Plus, LayoutGrid, RotateCcw, ArrowLeftRight } from 'lucide-react'
import { ConfigGrupo, ConfigLinha, ConfigBloco } from './ConfigGrupo'
import { Botao, Tag } from './ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import {
  NAV_ITEMS,
  NAV_FIXOS,
  NAV_EXTRAS_PADRAO,
  NAV_MAX_EXTRAS,
  extrasValidos,
  iconeNav,
} from '../data/navItems'
const CORES = ['lavanda', 'ceu', 'lima', 'mist', 'lavanda']
export default function ConfigNavegacao({ destaque, avisar }) {
  const simples = useModoSimples()
  const [salvo, setSalvo] = useStorage('kleo_nav_order', NAV_EXTRAS_PADRAO)
  const [profile] = useStorage('kleo_profile', null)
  const extras = extrasValidos(salvo)
  const visiveis = simples ? extras.slice(0, 1) : extras
  const fixos = NAV_FIXOS.map(id => NAV_ITEMS.find(i => i.id === id)).filter(Boolean)
  const opcoes = NAV_ITEMS.filter(i => !NAV_FIXOS.includes(i.id))
  const cheia = extras.length >= NAV_MAX_EXTRAS
  const padrao = extras.join(',') === NAV_EXTRAS_PADRAO.join(',')
  const alternar = item => {
    if (extras.includes(item.id)) {
      setSalvo(extras.filter(id => id !== item.id))
      avisar?.(`${item.label} saiu da barra`)
    } else if (!cheia) {
      setSalvo([...extras, item.id])
      avisar?.(`${item.label} está na barra`)
    }
  }
  const trocarOrdem = () => setSalvo([...extras].reverse())
  const previa = [...fixos, ...visiveis.map(id => NAV_ITEMS.find(i => i.id === id)).filter(Boolean)]
  return (
    <ConfigGrupo
      id="navegacao"
      titulo="Barra inferior"
      destaque={destaque}
      rodape={
        simples
          ? 'A barra mostra só o primeiro atalho extra.'
          : `Escolha até ${NAV_MAX_EXTRAS} atalhos extras.`
      }
    >
      <ConfigBloco
        style={{
          background: 'var(--surface-2)',
          padding: '18px 14px',
        }}
      >
        <div style={styles.previa} aria-label="Prévia da barra inferior">
          {previa.map((item, i) => {
            const Icone = iconeNav(item, profile)
            return (
              <span key={item.id} className="anim-pop" style={styles.previaItem}>
                <span
                  style={{
                    ...styles.previaIcone,
                    background: i === 0 ? '#000' : 'transparent',
                  }}
                >
                  <Icone size={20} color={i === 0 ? '#fff' : '#000'} strokeWidth={2} aria-hidden="true" />
                </span>
                <span style={styles.previaLabel}>{item.label}</span>
              </span>
            )
          })}
          <span style={styles.previaItem}>
            <span
              style={{
                ...styles.previaIcone,
                background: 'var(--lavanda)',
              }}
            >
              {simples ? (
                <LayoutGrid size={20} color="#000" aria-hidden="true" />
              ) : (
                <Plus size={20} color="#000" aria-hidden="true" />
              )}
            </span>
            <span style={styles.previaLabel}>Mais</span>
          </span>
        </div>
      </ConfigBloco>

      {fixos.map(item => {
        const Icone = iconeNav(item, profile)
        return (
          <ConfigLinha
            key={item.id}
            icone={Icone}
            cor="mist"
            titulo={item.label}
            detalhe="Sempre na barra"
            direita={<Lock size={18} color="var(--text-3)" aria-label="Fixo" />}
          />
        )
      })}

      {opcoes.map((item, i) => {
        const Icone = iconeNav(item, profile)
        const ativo = extras.includes(item.id)
        const posicao = extras.indexOf(item.id) + 1
        return (
          <ConfigLinha
            key={item.id}
            icone={Icone}
            cor={CORES[i % CORES.length]}
            titulo={item.label}
            detalhe={
              ativo
                ? `Atalho ${posicao} na barra`
                : cheia
                  ? 'Barra cheia: tire um para trocar'
                  : 'Toque para pôr na barra'
            }
            onClick={() => alternar(item)}
            desabilitado={!ativo && cheia}
            semChevron
            ariaLabel={ativo ? `Tirar ${item.label} da barra` : `Pôr ${item.label} na barra`}
            direita={
              ativo ? (
                <span key="sim" className="check-pop" style={styles.marcado}>
                  <Check size={18} color="#fff" strokeWidth={3} />
                </span>
              ) : (
                <span key="nao" style={styles.desmarcado} aria-hidden="true" />
              )
            }
          />
        )
      })}

      <ConfigBloco style={styles.acoes}>
        {extras.length === 2 && (
          <Botao variante="fantasma" icone={ArrowLeftRight} onClick={trocarOrdem}>
            Trocar ordem
          </Botao>
        )}
        {!padrao && (
          <Botao
            variante="fantasma"
            icone={RotateCcw}
            onClick={() => {
              setSalvo(NAV_EXTRAS_PADRAO)
              avisar?.('Barra restaurada')
            }}
          >
            Restaurar padrão
          </Botao>
        )}
        {padrao && extras.length === 2 && <Tag cor="mist">Barra padrão</Tag>}
      </ConfigBloco>
    </ConfigGrupo>
  )
}
const styles = {
  previa: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 2,
    background: 'var(--surface)',
    borderRadius: 22,
    padding: '8px 4px',
    boxShadow: 'var(--sombra)',
    minHeight: 64,
  },
  previaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  previaIcone: {
    width: 40,
    height: 30,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previaLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-2)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  marcado: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desmarcado: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '2px solid var(--border)',
    flexShrink: 0,
  },
  acoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
}
