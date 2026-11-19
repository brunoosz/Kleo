import { useEffect, useState } from 'react'
import { Plus, Phone, Pencil, Trash2, ShieldCheck, User, MessageCircle } from 'lucide-react'
import { Botao, Campo, Sheet, Chip, Modal } from '../ui'
import Avatar from '../Avatar'
import useStorage from '../../hooks/useStorage'
import useModoSimples from '../../hooks/useModoSimples'
import {
  MAX_EMERGENCIA,
  salvarContatoEmergencia,
  removerContatoEmergencia,
  mascararTelefone,
  formatarTelefone,
  telefoneValido,
  soDigitos,
  sosAutomatico,
  permissoesSOS,
  pedirPermissoesSOS,
} from '../../lib/emergencia'
import { nomeExibicao } from '../../lib/rede/util'
export default function EmergenciaContatos({ contatosKleo = [] }) {
  const simples = useModoSimples()
  const [salvos] = useStorage('kleo_emergencia', [])
  const lista = Array.isArray(salvos) ? salvos : []
  const [edicao, setEdicao] = useState(null)
  const [apagar, setApagar] = useState(null)
  const [perm, setPerm] = useState(null)
  const nativo = sosAutomatico()
  useEffect(() => {
    if (nativo) permissoesSOS().then(setPerm)
  }, [nativo])
  const pedirPermissao = () => pedirPermissoesSOS().then(setPerm)
  const faltaPermissao = nativo && perm && (!perm.sms || !perm.ligar) && lista.some(c => c.telefone)
  const abrirNovo = () =>
    setEdicao({
      nome: '',
      telefone: '',
      uid: null,
      usuario: '',
    })
  const valido = edicao && edicao.nome.trim().length >= 2 && (telefoneValido(edicao.telefone) || edicao.uid)
  const salvar = () => {
    if (!valido) return
    salvarContatoEmergencia({
      ...edicao,
      telefone: soDigitos(edicao.telefone),
    })
    setEdicao(null)
    if (nativo && edicao.telefone && perm && (!perm.sms || !perm.ligar)) pedirPermissao()
  }
  return (
    <div style={styles.coluna}>
      {lista.length === 0 && (
        <p
          style={{
            ...styles.vazio,
            fontSize: simples ? 18 : 16,
          }}
        >
          Cadastre até {MAX_EMERGENCIA} pessoas de confiança. Se você pedir socorro, a Kleo avisa todas com a
          sua localização.
        </p>
      )}
      {faltaPermissao && (
        <div style={styles.permissao}>
          <p style={styles.permissaoTexto}>
            Para avisar sozinha numa emergência, a Kleo precisa mandar SMS e ligar pelo celular.
          </p>
          <Botao variante="primario" icone={ShieldCheck} cheio onClick={pedirPermissao}>
            Permitir SMS e ligação
          </Botao>
        </div>
      )}
      {lista.map((c, i) => (
        <div
          key={c.id}
          className="anim-up"
          style={{
            ...styles.item,
            animationDelay: `${i * 0.04}s`,
          }}
        >
          <Avatar
            nome={c.nome}
            chave={c.uid || c.id}
            foto={contatosKleo.find(k => k.uid === c.uid)?.foto}
            tamanho={simples ? 54 : 46}
          />
          <span style={styles.textos}>
            <span
              style={{
                ...styles.nome,
                fontSize: simples ? 19 : 17,
              }}
            >
              {c.nome}
            </span>
            <span style={styles.detalhe}>
              {c.telefone ? formatarTelefone(c.telefone) : 'Sem telefone'}
              {c.uid && (
                <span style={styles.selo}>
                  <MessageCircle size={12} aria-hidden="true" /> Kleo
                </span>
              )}
            </span>
          </span>
          <button
            type="button"
            className="tap"
            style={styles.icone}
            onClick={() =>
              setEdicao({
                ...c,
                telefone: mascararTelefone(c.telefone),
              })
            }
            aria-label={`Editar ${c.nome}`}
          >
            <Pencil size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tap"
            style={styles.icone}
            onClick={() => setApagar(c)}
            aria-label={`Remover ${c.nome}`}
          >
            <Trash2 size={18} color="var(--erro)" aria-hidden="true" />
          </button>
        </div>
      ))}
      {lista.length < MAX_EMERGENCIA && (
        <Botao
          variante={lista.length ? 'fantasma' : 'primario'}
          icone={Plus}
          cheio
          grande={simples}
          onClick={abrirNovo}
        >
          {lista.length ? 'Adicionar outro contato' : 'Adicionar contato de emergência'}
        </Botao>
      )}

      <Sheet
        aberto={!!edicao}
        onFechar={() => setEdicao(null)}
        titulo={edicao?.id ? 'Editar contato' : 'Contato de emergência'}
      >
        {edicao && (
          <form
            style={styles.form}
            onSubmit={e => {
              e.preventDefault()
              salvar()
            }}
          >
            {contatosKleo.length > 0 && (
              <div>
                <p style={styles.rotulo}>Escolher dos seus contatos da Kleo</p>
                <div style={styles.chips}>
                  {contatosKleo.map(k => (
                    <Chip
                      key={k.uid}
                      ativo={edicao.uid === k.uid}
                      onClick={() =>
                        setEdicao(x =>
                          x.uid === k.uid
                            ? {
                                ...x,
                                uid: null,
                                usuario: '',
                              }
                            : {
                                ...x,
                                uid: k.uid,
                                usuario: k.usuario,
                                nome: x.nome || nomeExibicao(k),
                              },
                        )
                      }
                    >
                      {nomeExibicao(k)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <Campo
              rotulo="Nome"
              icone={User}
              placeholder="Ex: Ana (filha)"
              value={edicao.nome}
              onChange={e =>
                setEdicao(x => ({
                  ...x,
                  nome: e.target.value,
                }))
              }
              maxLength={40}
            />
            <Campo
              rotulo="Telefone com DDD"
              icone={Phone}
              type="tel"
              inputMode="tel"
              placeholder="(11) 98765-4321"
              value={edicao.telefone}
              onChange={e =>
                setEdicao(x => ({
                  ...x,
                  telefone: mascararTelefone(e.target.value),
                }))
              }
            />
            <p style={styles.ajuda}>
              <ShieldCheck
                size={16}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
                aria-hidden="true"
              />
              {edicao.uid
                ? 'Esta pessoa recebe o alerta direto no app. Com telefone, você também pode ligar ou mandar SMS.'
                : nativo
                  ? 'Para avisar sozinha numa emergência: a Kleo manda SMS com sua localização e liga para o primeiro contato.'
                  : 'Com o telefone, a Kleo prepara a ligação, o SMS e o WhatsApp com a sua localização.'}
            </p>
            <Botao type="submit" variante="primario" grande cheio disabled={!valido}>
              Salvar contato
            </Botao>
          </form>
        )}
      </Sheet>

      <Modal
        aberto={!!apagar}
        onFechar={() => setApagar(null)}
        titulo={`Remover ${apagar?.nome || ''}?`}
        texto="Essa pessoa não será mais avisada em uma emergência."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setApagar(null),
          },
          {
            label: 'Remover',
            variante: 'perigo',
            onClick: () => {
              removerContatoEmergencia(apagar.id)
              setApagar(null)
            },
          },
        ]}
      />
    </div>
  )
}
const styles = {
  permissao: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    borderRadius: 22,
    background: 'var(--lavanda)',
    color: '#000',
  },
  permissaoTexto: {
    fontSize: 15,
    lineHeight: 1.4,
    fontWeight: 600,
  },
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  vazio: {
    color: 'var(--text-2)',
    lineHeight: 1.45,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 8px 10px 10px',
    borderRadius: 22,
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nome: {
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detalhe: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: 'var(--text-2)',
    flexWrap: 'wrap',
  },
  selo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: 800,
    background: 'var(--lavanda)',
    color: '#000',
    borderRadius: 20,
    padding: '2px 8px',
  },
  icone: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: 'var(--text)',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingBottom: 8,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    marginBottom: 8,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  ajuda: {
    display: 'flex',
    gap: 8,
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.45,
  },
}
