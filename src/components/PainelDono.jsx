import { useCallback, useEffect, useState } from 'react'
import {
  Crown,
  KeyRound,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Wifi,
  ExternalLink,
  Save,
  RefreshCw,
  Check,
  TriangleAlert,
  Eye,
  EyeOff,
} from 'lucide-react'
import { ConfigGrupo, ConfigLinha, ConfigIcone } from './ConfigGrupo'
import { Sheet, Modal, Botao, BotaoIcone, Campo, Chip, Toggle, Tag } from './ui'
import useConta from '../hooks/useConta'
import useModoSimples from '../hooks/useModoSimples'
import {
  SERVICOS_COFRE,
  GRUPOS_COFRE,
  cofreListar,
  cofreAdicionar,
  cofreAtualizar,
  cofreMover,
  cofreRemover,
  cofreTestar,
  mensagemConta,
} from '../lib/conta'
export default function PainelDono({ avisar = () => {}, destaque = false }) {
  const c = useConta()
  const simples = useModoSimples()
  const [chaves, setChaves] = useState(null)
  const [erro, setErro] = useState('')
  const [sheet, setSheet] = useState(null)
  const [remover, setRemover] = useState(null)
  const [testes, setTestes] = useState({})
  const carregar = useCallback(
    () =>
      cofreListar().then(
        lista => {
          setErro('')
          setChaves(lista)
        },
        e => {
          setErro(mensagemConta(e))
          setChaves([])
        },
      ),
    [],
  )
  useEffect(() => {
    if (c.ehDono) carregar()
  }, [c.ehDono, carregar])
  if (!c.ehDono) return null
  async function agir(fn, texto) {
    setErro('')
    try {
      await fn()
      if (texto) avisar(texto)
      await carregar()
    } catch (e) {
      setErro(mensagemConta(e))
    }
  }
  async function testar(ch) {
    setTestes(t => ({
      ...t,
      [ch.id]: 'testando',
    }))
    let r
    try {
      r = await cofreTestar(ch.id)
    } catch (e) {
      r = {
        ok: false,
        mensagem: mensagemConta(e),
      }
    }
    setTestes(t => ({
      ...t,
      [ch.id]: r,
    }))
  }
  async function testarServico(lista) {
    for (const ch of lista) await testar(ch)
  }
  const porServico = SERVICOS_COFRE.map(s => ({
    ...s,
    lista: (chaves || []).filter(k => k.servico === s.id),
  })).filter(s => s.lista.length)
  const grupos = GRUPOS_COFRE.map(g => ({
    ...g,
    servicos: porServico.filter(s => s.tipo === g.id),
  })).filter(g => g.servicos.length)
  const ultimoServico = porServico.length ? grupos[grupos.length - 1].servicos.slice(-1)[0].id : ''
  const tam = simples ? 17 : 15
  return (
    <>
      <ConfigGrupo
        id="dono"
        titulo="Painel do dono"
        destaque={destaque}
        rodape="A primeira da lista é usada primeiro; se falhar, vai para a próxima."
        acao={<BotaoIcone icone={RefreshCw} label="Recarregar" onClick={carregar} />}
      >
        <ConfigLinha
          icone={Crown}
          cor="lima"
          titulo="Você é o dono do app"
          detalhe={c.email || ''}
          semChevron
        />
        <ConfigLinha
          icone={Plus}
          cor="lavanda"
          titulo="Adicionar chave"
          detalhe="IA, voz (ElevenLabs), mapa (Google Maps) ou outro serviço"
          onClick={() =>
            setSheet({
              modo: 'nova',
            })
          }
          ultima={!porServico.length && chaves !== null}
        />
        {chaves === null && (
          <ConfigLinha icone={KeyRound} cor="mist" titulo="Carregando..." semChevron ultima />
        )}
        {erro && (
          <p
            role="alert"
            style={{
              ...styles.erro,
              fontSize: tam,
            }}
          >
            {erro}
          </p>
        )}

        {grupos.map(g => (
          <div key={g.id}>
            <p
              style={{
                ...styles.grupoTitulo,
                fontSize: tam - 1,
              }}
            >
              {g.nome}
            </p>
            {g.servicos.map(s => (
              <div key={s.id} style={styles.bloco}>
                <div style={styles.blocoTopo}>
                  <span
                    style={{
                      ...styles.blocoTitulo,
                      fontSize: tam + 1,
                    }}
                  >
                    {s.nome}
                  </span>
                  <Tag cor={g.cor}>{g.nome === 'Inteligência artificial' ? 'IA' : g.nome}</Tag>
                  {s.id !== 'outro' && (
                    <Botao
                      variante="suave"
                      icone={Wifi}
                      onClick={() => testarServico(s.lista)}
                      style={styles.testarTodas}
                      disabled={s.lista.some(ch => testes[ch.id] === 'testando')}
                    >
                      {s.lista.length > 1 ? 'Testar todas' : 'Testar'}
                    </Botao>
                  )}
                </div>
                {s.lista.map((ch, i) => {
                  const t = testes[ch.id]
                  return (
                    <div
                      key={ch.id}
                      style={{
                        ...styles.linha,
                        opacity: ch.ativa ? 1 : 0.55,
                        borderBottom:
                          s.id === ultimoServico && i === s.lista.length - 1
                            ? 'none'
                            : '1px solid var(--surface-2)',
                      }}
                    >
                      <ConfigIcone icone={KeyRound} cor={ch.ativa ? 'lima' : 'mist'} />
                      <div style={styles.textos}>
                        <span
                          style={{
                            ...styles.titulo,
                            fontSize: tam + 1,
                          }}
                        >
                          {i + 1}. {ch.rotulo || `Chave ${i + 1}`}{' '}
                          <span style={styles.mascara}>{ch.mascara}</span>
                        </span>
                        <span
                          style={{
                            ...styles.detalhe,
                            fontSize: tam - 1,
                          }}
                        >
                          {ch.modelo
                            ? `Modelo: ${ch.modelo}`
                            : s.modelos.length
                              ? 'Modelo padrão'
                              : 'Chave guardada no cofre'}
                          {ch.ativa ? '' : ' · desligada'}
                        </span>
                        {t && t !== 'testando' && (
                          <span
                            style={{
                              ...styles.teste,
                              fontSize: tam - 1,
                              color: t.ok ? 'var(--sucesso)' : 'var(--erro)',
                            }}
                          >
                            {t.ok ? (
                              <Check size={16} aria-hidden="true" />
                            ) : (
                              <TriangleAlert size={16} aria-hidden="true" />
                            )}
                            {t.ok ? `Funcionou (${t.ms} ms)` : t.mensagem}
                          </span>
                        )}
                      </div>
                      <div style={styles.acoes}>
                        <Toggle
                          ligado={ch.ativa}
                          label={ch.ativa ? 'Desligar esta chave' : 'Ligar esta chave'}
                          onChange={v =>
                            agir(
                              () =>
                                cofreAtualizar(ch.id, {
                                  ativa: v,
                                }),
                              v ? 'Chave ligada' : 'Chave desligada',
                            )
                          }
                        />
                        {s.id !== 'outro' && (
                          <BotaoIcone
                            icone={Wifi}
                            label="Testar"
                            variante="lavanda"
                            onClick={() => testar(ch)}
                            disabled={t === 'testando'}
                            className={t === 'testando' ? 'pulse-ring' : undefined}
                          />
                        )}
                        <BotaoIcone
                          icone={ChevronUp}
                          label="Subir"
                          disabled={i === 0}
                          onClick={() => agir(() => cofreMover(ch.id, ch.ordem - 1))}
                        />
                        <BotaoIcone
                          icone={ChevronDown}
                          label="Descer"
                          disabled={i === s.lista.length - 1}
                          onClick={() => agir(() => cofreMover(ch.id, ch.ordem + 1))}
                        />
                        <BotaoIcone
                          icone={Pencil}
                          label="Editar"
                          onClick={() =>
                            setSheet({
                              modo: 'editar',
                              chave: ch,
                            })
                          }
                        />
                        <BotaoIcone
                          icone={Trash2}
                          label="Remover"
                          cor="var(--erro)"
                          onClick={() => setRemover(ch)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </ConfigGrupo>

      {sheet && (
        <FormChave
          modo={sheet.modo}
          chave={sheet.chave}
          simples={simples}
          onFechar={() => setSheet(null)}
          onSalvar={async dados => {
            if (sheet.modo === 'nova') await cofreAdicionar(dados)
            else
              await cofreAtualizar(sheet.chave.id, {
                rotulo: dados.rotulo,
                modelo: dados.modelo,
                valor: dados.valor || undefined,
              })
            avisar(sheet.modo === 'nova' ? 'Chave guardada no cofre' : 'Chave atualizada')
            setSheet(null)
            carregar()
          }}
        />
      )}

      <Modal
        aberto={!!remover}
        onFechar={() => setRemover(null)}
        titulo="Remover esta chave?"
        texto={
          remover
            ? `${remover.rotulo || 'Chave'} ${remover.mascara} sai do cofre. O app passa a usar as outras.`
            : ''
        }
        acoes={[
          {
            label: 'Cancelar',
            onClick: () => setRemover(null),
          },
          {
            label: 'Remover',
            variante: 'perigo',
            onClick: () => {
              const ch = remover
              setRemover(null)
              agir(() => cofreRemover(ch.id), 'Chave removida')
            },
          },
        ]}
      />
    </>
  )
}
function FormChave({ modo, chave, simples, onFechar, onSalvar }) {
  const [servico, setServico] = useState(chave?.servico || SERVICOS_COFRE[0].id)
  const [valor, setValor] = useState('')
  const [rotulo, setRotulo] = useState(chave?.rotulo || '')
  const [modelo, setModelo] = useState(chave?.modelo || '')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const s = SERVICOS_COFRE.find(x => x.id === servico) || SERVICOS_COFRE[0]
  const limpo = valor.replace(/\s+/g, '')
  const avisoFormato =
    limpo && s.comeca && !limpo.startsWith(s.comeca)
      ? `As chaves do ${s.nome} costumam começar com ${s.comeca}. Confira se é a chave certa.`
      : ''
  const enviar = async e => {
    e.preventDefault()
    setErro('')
    if (modo === 'nova' && limpo.length < 20) {
      setErro('Cole a chave inteira (ela é longa).')
      return
    }
    setOcupado(true)
    try {
      await onSalvar({
        servico,
        valor: limpo,
        rotulo,
        modelo,
      })
    } catch (er) {
      setErro(mensagemConta(er))
    } finally {
      setOcupado(false)
    }
  }
  return (
    <Sheet aberto onFechar={onFechar} titulo={modo === 'nova' ? 'Adicionar chave' : 'Editar chave'}>
      <form onSubmit={enviar} style={styles.form}>
        {modo === 'nova' && (
          <div>
            <p
              style={{
                ...styles.rotuloGrupo,
                fontSize: simples ? 16 : 14,
              }}
            >
              Serviço
            </p>
            {GRUPOS_COFRE.map(g => (
              <div key={g.id}>
                <p
                  style={{
                    ...styles.grupoForm,
                    fontSize: simples ? 14 : 12,
                  }}
                >
                  {g.nome}
                </p>
                <div style={styles.chips}>
                  {SERVICOS_COFRE.filter(x => x.tipo === g.id).map(x => (
                    <Chip
                      key={x.id}
                      ativo={servico === x.id}
                      onClick={() => {
                        setServico(x.id)
                        setModelo('')
                      }}
                    >
                      {x.nome}
                      {x.gratis || x.id === 'outro' ? '' : ' (paga)'}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
            <p
              style={{
                ...styles.dica,
                fontSize: simples ? 15 : 13,
              }}
            >
              {s.dica}{' '}
              {s.site && (
                <a href={s.site} target="_blank" rel="noreferrer" style={styles.link}>
                  Pegar a chave <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
            </p>
          </div>
        )}
        <div
          style={{
            position: 'relative',
          }}
        >
          <Campo
            rotulo={modo === 'nova' ? 'Chave' : 'Trocar a chave (deixe vazio para manter)'}
            icone={KeyRound}
            type={ver ? 'text' : 'password'}
            placeholder={s.comeca ? `${s.comeca}...` : 'Cole a chave aqui'}
            value={valor}
            onChange={e => setValor(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{
              paddingRight: 52,
            }}
          />
          <button
            type="button"
            className="tap"
            onClick={() => setVer(v => !v)}
            style={styles.olho}
            aria-label={ver ? 'Esconder a chave' : 'Mostrar a chave'}
          >
            {ver ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {avisoFormato && (
          <p
            style={{
              ...styles.aviso,
              fontSize: simples ? 15 : 13,
            }}
          >
            <TriangleAlert size={16} aria-hidden="true" /> {avisoFormato}
          </p>
        )}
        <Campo
          rotulo="Apelido (opcional)"
          placeholder="Ex: conta do Bruno"
          value={rotulo}
          onChange={e => setRotulo(e.target.value)}
          maxLength={60}
        />
        {s.modelos.length > 0 && (
          <div>
            <p
              style={{
                ...styles.rotuloGrupo,
                fontSize: simples ? 16 : 14,
              }}
            >
              Modelo (opcional)
            </p>
            <div style={styles.chips}>
              <Chip ativo={!modelo} onClick={() => setModelo('')}>
                Padrão
              </Chip>
              {s.modelos.map(m => (
                <Chip key={m} ativo={modelo === m} onClick={() => setModelo(m)}>
                  {m}
                </Chip>
              ))}
            </div>
            <Campo
              placeholder="Ou escreva o nome do modelo"
              value={modelo}
              onChange={e => setModelo(e.target.value)}
              maxLength={120}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        )}
        {erro && (
          <p role="alert" style={styles.erro}>
            {erro}
          </p>
        )}
        <Botao type="submit" variante="primario" icone={Save} cheio grande={simples} carregando={ocupado}>
          {modo === 'nova' ? 'Guardar no cofre' : 'Salvar'}
        </Botao>
      </form>
    </Sheet>
  )
}
const styles = {
  erro: {
    margin: '6px 16px 10px',
    color: 'var(--erro)',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  bloco: {
    padding: '4px 0 0',
  },
  grupoTitulo: {
    margin: '12px 16px 0',
    fontWeight: 800,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grupoForm: {
    margin: '4px 0 6px',
    fontWeight: 700,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testarTodas: {
    marginLeft: 'auto',
    minHeight: 36,
    padding: '4px 14px',
    fontSize: 14,
  },
  blocoTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px 4px',
  },
  blocoTitulo: {
    fontWeight: 800,
  },
  linha: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '10px 16px 12px',
  },
  textos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  titulo: {
    fontWeight: 700,
  },
  mascara: {
    fontFamily: 'ui-monospace, monospace',
    color: 'var(--text-3)',
    fontWeight: 500,
  },
  detalhe: {
    color: 'var(--text-2)',
  },
  teste: {
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: 4,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '4px 0 8px',
  },
  rotuloGrupo: {
    margin: '0 0 6px',
    fontWeight: 700,
    color: 'var(--text-2)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dica: {
    margin: 0,
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  link: {
    color: '#000',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },
  aviso: {
    margin: 0,
    color: 'var(--alerta)',
    fontWeight: 600,
    lineHeight: 1.4,
    display: 'flex',
    gap: 4,
    alignItems: 'flex-start',
  },
  olho: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    border: 'none',
    background: 'var(--surface-2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#000',
  },
}
