import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Trash2,
  Check,
  Wrench,
  ArrowLeftRight,
  ChevronLeft,
  Star,
  LayoutGrid,
} from 'lucide-react'
import { ConfigGrupo, ConfigLinha, ConfigIcone } from './ConfigGrupo'
import { Sheet, Modal, Botao, BotaoIcone, Chip, Campo, Tag, Vazio } from './ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import useRemocao from './profissao/useRemocao'
import {
  CATEGORIAS,
  getProfissao,
  getCategoria,
  buscarProfissoes,
  profissoesDoUsuario,
} from '../data/profissoes'
import { infoFerramenta } from '../ferramentas'
const MAX_EXTRAS = 5
const corDe = p => getCategoria(p?.categoria)?.cor || 'lavanda'
export function ListaProfissoes({ onEscolher, marcados = [], bloqueados = {} }) {
  const simples = useModoSimples()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const lista = useMemo(() => {
    const achadas = buscarProfissoes(busca)
    if (busca.trim() || categoria === 'todas') return achadas
    return achadas.filter(p => p.categoria === categoria)
  }, [busca, categoria])
  return (
    <div style={styles.lista}>
      <Campo
        icone={Search}
        placeholder="Buscar profissão (ex.: enfermeiro)"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        aria-label="Buscar profissão"
        autoComplete="off"
      />
      {!busca.trim() && (
        <div style={styles.categorias} role="tablist" aria-label="Categorias">
          <Chip
            ativo={categoria === 'todas'}
            cor="branco"
            icone={LayoutGrid}
            onClick={() => setCategoria('todas')}
          >
            Todas
          </Chip>
          {CATEGORIAS.map(c => (
            <Chip
              key={c.id}
              ativo={categoria === c.id}
              cor={c.cor}
              icone={c.icone}
              onClick={() => setCategoria(c.id)}
            >
              {c.nome}
            </Chip>
          ))}
        </div>
      )}
      {lista.length === 0 ? (
        <Vazio
          icone={Search}
          titulo="Nada encontrado"
          texto="Tente outro nome. Se não achar, escolha Outro."
        />
      ) : (
        <div key={busca.trim() ? 'busca' : categoria} className="stagger" style={styles.itens}>
          {lista.map(p => {
            const marcado = marcados.includes(p.id)
            const bloqueio = bloqueados[p.id]
            return (
              <button
                key={p.id}
                type="button"
                className="tap anim-up"
                disabled={!!bloqueio}
                onClick={() => onEscolher(p)}
                aria-pressed={marcado}
                style={{
                  ...styles.item,
                  minHeight: simples ? 64 : 56,
                  background: marcado ? 'var(--lavanda)' : 'var(--surface)',
                  opacity: bloqueio ? 0.55 : 1,
                }}
              >
                <ConfigIcone icone={p.icone || p.icon} cor={marcado ? 'creme' : corDe(p)} />
                <span
                  style={{
                    ...styles.itemNome,
                    fontSize: simples ? 18 : 16,
                  }}
                >
                  {p.label}
                </span>
                {bloqueio && <Tag cor="mist">{bloqueio}</Tag>}
                {marcado && (
                  <Check size={22} strokeWidth={2.6} color="#000" className="check-pop" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default function ConfigProfissoes({ destaque, abrirAdicionar = false, avisar }) {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [profile, setProfile] = useStorage('kleo_profile', null)
  const [extrasFerr, setExtrasFerr] = useStorage('kleo_ferramentas_extras', [])
  const [folha, setFolha] = useState(abrirAdicionar ? 'extra' : null)
  const [confirmar, setConfirmar] = useState(null)
  const principal = getProfissao(profile?.profissao)
  const todas = profissoesDoUsuario(profile)
  const extras = todas.slice(1)
  const idsUsuario = todas.map(p => p.id)
  const listaFerr = Array.isArray(extrasFerr) ? extrasFerr : []
  const salvarPerfil = patch =>
    setProfile(p => ({
      ...(p || {}),
      ...patch,
    }))
  const escolherPrincipal = p => {
    const antigos = (profile?.profissoesExtras || []).filter(id => getProfissao(id).id !== p.id)
    const eraExtra = extras.some(x => x.id === p.id)
    const novosExtras = eraExtra && principal.id !== 'outro' ? [...antigos, principal.id] : antigos
    salvarPerfil({
      profissao: p.id,
      profissoesExtras: novosExtras,
    })
    setFolha(null)
    avisar?.(`Profissão principal: ${p.label}`)
  }
  const adicionarExtra = p => {
    if (idsUsuario.includes(p.id)) return
    const atuais = (profile?.profissoesExtras || []).filter(Boolean)
    if (atuais.length >= MAX_EXTRAS) return
    salvarPerfil({
      profissoesExtras: [...atuais, p.id],
    })
    setFolha(null)
    avisar?.(`${p.label} adicionada`)
  }
  const removerExtra = id => {
    salvarPerfil({
      profissoesExtras: (profile?.profissoesExtras || []).filter(x => getProfissao(x).id !== id),
    })
  }
  const { saindo: profSaindo, remover: removerProfAnim } = useRemocao(removerExtra)
  const removerFerr = chave => setExtrasFerr(l => (Array.isArray(l) ? l : []).filter(f => f.chave !== chave))
  const { saindo: ferrSaindo, remover: removerFerrAnim } = useRemocao(removerFerr)
  const confirmarRemocao = () => {
    if (!confirmar) return
    if (confirmar.tipo === 'prof') removerProfAnim(confirmar.id)
    else removerFerrAnim(confirmar.id)
    setConfirmar(null)
  }
  const bloqueados = Object.fromEntries(idsUsuario.map((id, i) => [id, i === 0 ? 'Principal' : 'Já tem']))
  const cheio = extras.length >= MAX_EXTRAS
  const botaoRemover = (rotulo, onClick) =>
    simples ? (
      <Botao
        variante="fantasma"
        onClick={onClick}
        style={{
          minHeight: 48,
          padding: '6px 16px',
        }}
      >
        Remover
      </Botao>
    ) : (
      <BotaoIcone icone={Trash2} label={rotulo} onClick={onClick} />
    )
  return (
    <>
      <ConfigGrupo id="profissoes" titulo="Profissões" destaque={destaque}>
        <ConfigLinha
          icone={principal.icone || principal.icon}
          cor={corDe(principal)}
          titulo={principal.label}
          detalhe="Profissão principal. Toque para trocar."
          direita={
            <Tag cor="lima" icone={Star}>
              Principal
            </Tag>
          }
          onClick={() => setFolha('principal')}
          semChevron
        />
        {extras.map(p => (
          <div key={p.id} className={profSaindo(p.id) ? 'item-out' : 'anim-up'}>
            <ConfigLinha
              icone={p.icone || p.icon}
              cor={corDe(p)}
              titulo={p.label}
              detalhe={simples ? undefined : 'Profissão extra'}
              direita={botaoRemover(`Remover ${p.label}`, () =>
                setConfirmar({
                  tipo: 'prof',
                  id: p.id,
                  nome: p.label,
                }),
              )}
            />
          </div>
        ))}
        <ConfigLinha
          icone={Plus}
          cor="lavanda"
          titulo="Adicionar profissão"
          detalhe={
            cheio ? `Limite de ${MAX_EXTRAS} profissões extras` : 'Tem mais de um trabalho? Adicione aqui.'
          }
          onClick={() => setFolha('extra')}
          desabilitado={cheio}
          ultima={simples}
        />
        {!simples && (
          <ConfigLinha
            icone={Wrench}
            cor="ceu"
            titulo="Ferramentas de outras profissões"
            detalhe="Pegue só a ferramenta que você precisa"
            onClick={() => setFolha('ferramentas')}
            ultima={listaFerr.length === 0}
          />
        )}
        {!simples &&
          listaFerr.map((f, i) => {
            const info = infoFerramenta(f.id, f.config)
            if (!info) return null
            const origem = getProfissao(f.origem)
            return (
              <div key={f.chave} className={ferrSaindo(f.chave) ? 'item-out' : 'anim-up'}>
                <ConfigLinha
                  icone={info.icone}
                  cor="mist"
                  titulo={info.nome}
                  detalhe={`De ${origem.label}`}
                  direita={botaoRemover(`Remover ${info.nome}`, () =>
                    setConfirmar({
                      tipo: 'ferr',
                      id: f.chave,
                      nome: info.nome,
                    }),
                  )}
                  ultima={i === listaFerr.length - 1}
                />
              </div>
            )
          })}
      </ConfigGrupo>

      <Sheet
        aberto={folha === 'principal'}
        onFechar={() => setFolha(null)}
        titulo="Profissão principal"
        altura="88vh"
      >
        <ListaProfissoes onEscolher={escolherPrincipal} marcados={[principal.id]} />
      </Sheet>

      <Sheet
        aberto={folha === 'extra'}
        onFechar={() => setFolha(null)}
        titulo="Adicionar profissão"
        altura="88vh"
      >
        {cheio ? (
          <Vazio
            icone={Check}
            titulo="Limite atingido"
            texto={`Você já tem ${MAX_EXTRAS} profissões extras. Remova uma para adicionar outra.`}
          />
        ) : (
          <ListaProfissoes onEscolher={adicionarExtra} bloqueados={bloqueados} />
        )}
      </Sheet>

      <FolhaFerramentas
        aberto={folha === 'ferramentas'}
        onFechar={() => setFolha(null)}
        bloqueados={bloqueados}
        adicionadas={listaFerr}
        onAdicionar={f => {
          setExtrasFerr(l => [...(Array.isArray(l) ? l : []), f])
          avisar?.('Ferramenta adicionada')
        }}
        onRemover={chave => removerFerr(chave)}
        abrirTrabalho={() => {
          setFolha(null)
          navigate('/profissao')
        }}
      />

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo={
          confirmar?.tipo === 'prof'
            ? `Remover ${confirmar?.nome}?`
            : `Remover ${confirmar?.nome || 'ferramenta'}?`
        }
        texto={
          confirmar?.tipo === 'prof'
            ? 'A profissão sai da sua lista. Os dados das ferramentas continuam salvos se você adicionar de novo.'
            : 'A ferramenta sai da aba Trabalho. Os dados dela continuam salvos.'
        }
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setConfirmar(null),
          },
          {
            label: 'Remover',
            variante: 'perigo',
            onClick: confirmarRemocao,
          },
        ]}
      />
    </>
  )
}
function FolhaFerramentas({
  aberto,
  onFechar,
  bloqueados,
  adicionadas,
  onAdicionar,
  onRemover,
  abrirTrabalho,
}) {
  const simples = useModoSimples()
  const [origem, setOrigem] = useState(null)
  const fechar = () => {
    onFechar()
    setTimeout(() => setOrigem(null), 320)
  }
  const prof = origem ? getProfissao(origem) : null
  return (
    <Sheet aberto={aberto} onFechar={fechar} titulo={prof ? prof.label : 'Outras ferramentas'} altura="88vh">
      {!prof ? (
        <>
          <p style={styles.ajuda}>Escolha uma profissão para ver as ferramentas dela.</p>
          <ListaProfissoes onEscolher={p => setOrigem(p.id)} bloqueados={bloqueados} />
        </>
      ) : (
        <div className="anim-right" style={styles.lista}>
          <Botao
            variante="fantasma"
            icone={ChevronLeft}
            onClick={() => setOrigem(null)}
            style={{
              alignSelf: 'flex-start',
            }}
          >
            Outras profissões
          </Botao>
          {prof.dica && <p style={styles.ajuda}>{prof.dica}</p>}
          <div className="stagger" style={styles.itens}>
            {(prof.ferramentas || []).map((f, i) => {
              const info = infoFerramenta(f.id, f.config)
              if (!info) return null
              const chave = `x_${prof.id}_${i}`
              const tem = adicionadas.some(a => a.chave === chave)
              return (
                <div
                  key={chave}
                  className="anim-up"
                  style={{
                    ...styles.ferr,
                    background: tem ? 'var(--lavanda)' : 'var(--surface)',
                  }}
                >
                  <ConfigIcone icone={info.icone} cor={tem ? 'creme' : 'ceu'} />
                  <span style={styles.ferrTextos}>
                    <span
                      style={{
                        ...styles.itemNome,
                        fontSize: simples ? 18 : 16,
                      }}
                    >
                      {info.nome}
                    </span>
                    {info.descricao && <span style={styles.ferrDesc}>{info.descricao}</span>}
                  </span>
                  {tem ? (
                    <Botao
                      variante="fantasma"
                      icone={Check}
                      onClick={() => onRemover(chave)}
                      aria-label={`Remover ${info.nome}`}
                    >
                      {simples ? 'Remover' : 'Pronto'}
                    </Botao>
                  ) : (
                    <Botao
                      variante="primario"
                      icone={Plus}
                      onClick={() =>
                        onAdicionar({
                          id: f.id,
                          config: f.config || {},
                          origem: prof.id,
                          chave,
                        })
                      }
                    >
                      Adicionar
                    </Botao>
                  )}
                </div>
              )
            })}
          </div>
          <Botao
            variante="lima"
            icone={ArrowLeftRight}
            cheio
            onClick={abrirTrabalho}
            style={{
              marginTop: 6,
            }}
          >
            Ver na aba Trabalho
          </Botao>
        </div>
      )}
    </Sheet>
  )
}
const styles = {
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingBottom: 8,
  },
  categorias: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '2px 0 8px',
  },
  itens: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 14px 8px 10px',
    width: '100%',
    borderRadius: 20,
    boxShadow: 'var(--sombra)',
    textAlign: 'left',
    color: 'var(--text)',
    transition: 'background .25s ease',
  },
  itemNome: {
    flex: 1,
    minWidth: 0,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  ajuda: {
    fontSize: 16,
    color: 'var(--text-2)',
    lineHeight: 1.45,
    marginBottom: 4,
  },
  ferr: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    boxShadow: 'var(--sombra)',
    flexWrap: 'wrap',
    transition: 'background .25s ease',
  },
  ferrTextos: {
    flex: '1 1 160px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  ferrDesc: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
}
