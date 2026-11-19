import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Clock, UserPlus } from 'lucide-react'
import { Card, Botao, TituloSecao } from '../ui'
import Avatar from '../Avatar'
import useStorage from '../../hooks/useStorage'
import useModoSimples from '../../hooks/useModoSimples'
import { responderAmizade, desfazerAmizade, adicionarContato } from '../../lib/rede'
export default function PedidosAmizade() {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [salvas] = useStorage('kleo_rede_amizades', [])
  const [ocupado, setOcupado] = useState(null)
  const [erro, setErro] = useState('')
  const lista = Array.isArray(salvas) ? salvas : []
  const recebidos = lista.filter(a => a.estado === 'recebido').sort((a, b) => (b.em || 0) - (a.em || 0))
  const enviados = lista.filter(a => a.estado === 'enviado').sort((a, b) => (b.em || 0) - (a.em || 0))
  if (!recebidos.length && !enviados.length) return null
  const nomeDe = a => a.nome || (a.usuario ? `@${a.usuario}` : 'Alguém')
  const agir = async (a, acao) => {
    setOcupado(`${a.uid}:${acao}`)
    setErro('')
    try {
      if (acao === 'aceitar') {
        await responderAmizade(a.uid, true)
        await adicionarContato(a).catch(() => {})
        navigator.vibrate?.(30)
        navigate(`/pessoas/${a.uid}`)
      } else if (acao === 'recusar') await responderAmizade(a.uid, false)
      else await desfazerAmizade(a.uid)
    } catch {
      setErro('Não consegui agora. Confira a internet e tente de novo.')
    }
    setOcupado(null)
  }
  return (
    <section style={styles.secao} aria-label="Pedidos de amizade">
      {recebidos.length > 0 && (
        <>
          <TituloSecao>
            Pedidos de amizade <span style={styles.contador}>{recebidos.length}</span>
          </TituloSecao>
          <Card cor="lima" style={styles.lista}>
            {recebidos.map((a, i) => (
              <div
                key={a.uid}
                className="anim-up"
                style={{
                  ...styles.item,
                  flexDirection: simples ? 'column' : 'row',
                  alignItems: simples ? 'stretch' : 'center',
                  borderTop: i ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <span style={styles.pessoa}>
                  <Avatar nome={a.nome} foto={a.foto} chave={a.uid} tamanho={simples ? 58 : 50} />
                  <span style={styles.textos}>
                    <strong
                      style={{
                        ...styles.nome,
                        fontSize: simples ? 19 : 17,
                      }}
                    >
                      {nomeDe(a)}
                    </strong>
                    <span style={styles.sub}>
                      {a.usuario ? `@${a.usuario} · ` : ''}quer conversar com você
                    </span>
                  </span>
                </span>
                <span style={styles.acoes}>
                  <Botao
                    variante="primario"
                    icone={Check}
                    grande={simples}
                    cheio={simples}
                    carregando={ocupado === `${a.uid}:aceitar`}
                    onClick={() => agir(a, 'aceitar')}
                    style={{
                      flex: 1,
                    }}
                  >
                    Aceitar
                  </Botao>
                  <Botao
                    variante="fantasma"
                    icone={X}
                    grande={simples}
                    cheio={simples}
                    carregando={ocupado === `${a.uid}:recusar`}
                    onClick={() => agir(a, 'recusar')}
                    style={{
                      flex: 1,
                    }}
                  >
                    Recusar
                  </Botao>
                </span>
              </div>
            ))}
          </Card>
        </>
      )}
      {enviados.length > 0 && (
        <>
          <TituloSecao>Pedidos enviados</TituloSecao>
          <Card cor="branco" style={styles.lista}>
            {enviados.map((a, i) => (
              <div
                key={a.uid}
                style={{
                  ...styles.item,
                  borderTop: i ? '1px solid var(--surface-2)' : 'none',
                }}
              >
                <span style={styles.pessoa}>
                  <Avatar nome={a.nome} foto={a.foto} chave={a.uid} tamanho={simples ? 54 : 46} />
                  <span style={styles.textos}>
                    <strong
                      style={{
                        ...styles.nome,
                        fontSize: simples ? 18 : 16,
                      }}
                    >
                      {nomeDe(a)}
                    </strong>
                    <span style={styles.sub}>
                      <Clock size={13} aria-hidden="true" style={styles.subIcone} />
                      Esperando aceitar
                    </span>
                  </span>
                </span>
                <Botao
                  variante="fantasma"
                  carregando={ocupado === `${a.uid}:cancelar`}
                  onClick={() => agir(a, 'cancelar')}
                >
                  Cancelar
                </Botao>
              </div>
            ))}
          </Card>
        </>
      )}
      {erro && (
        <p role="alert" style={styles.erro}>
          {erro}
        </p>
      )}
    </section>
  )
}
export function AvisoAmizade({ estado, nome, onPedir, onAceitar, onRecusar, ocupado }) {
  const simples = useModoSimples()
  const textos = {
    enviado: {
      titulo: 'Pedido enviado',
      texto: `Quando ${nome} aceitar, vocês podem conversar.`,
    },
    recebido: {
      titulo: `${nome} quer conversar com você`,
      texto: 'Aceite o pedido para começar a conversar.',
    },
    nenhum: {
      titulo: 'Vocês ainda não são amigos',
      texto: `Mande um pedido de amizade. Quando ${nome} aceitar, vocês podem conversar.`,
    },
  }
  const t = textos[estado] || textos.nenhum
  return (
    <div className="anim-up" style={styles.aviso} role="status">
      <span style={styles.avisoIcone} aria-hidden="true">
        {estado === 'enviado' ? <Clock size={22} color="#000" /> : <UserPlus size={22} color="#000" />}
      </span>
      <strong
        style={{
          ...styles.avisoTitulo,
          fontSize: simples ? 20 : 17,
        }}
      >
        {t.titulo}
      </strong>
      <span
        style={{
          ...styles.avisoTexto,
          fontSize: simples ? 17 : 15,
        }}
      >
        {t.texto}
      </span>
      {estado === 'recebido' && (
        <span style={styles.avisoAcoes}>
          <Botao variante="primario" icone={Check} grande={simples} carregando={ocupado} onClick={onAceitar}>
            Aceitar
          </Botao>
          <Botao variante="fantasma" icone={X} grande={simples} onClick={onRecusar}>
            Recusar
          </Botao>
        </span>
      )}
      {estado !== 'recebido' && estado !== 'enviado' && (
        <Botao variante="primario" icone={UserPlus} grande={simples} carregando={ocupado} onClick={onPedir}>
          Mandar pedido de amizade
        </Botao>
      )}
    </div>
  )
}
const styles = {
  secao: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  contador: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    height: 24,
    padding: '0 7px',
    marginLeft: 6,
    borderRadius: 12,
    background: '#d92d34',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    verticalAlign: 2,
  },
  lista: {
    padding: '6px 14px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
  },
  pessoa: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
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
    color: '#000',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sub: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.65)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  subIcone: {
    flexShrink: 0,
  },
  acoes: {
    display: 'flex',
    gap: 8,
  },
  erro: {
    margin: 0,
    color: 'var(--erro)',
    fontWeight: 600,
    fontSize: 15,
  },
  aviso: {
    margin: '0 auto',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: '20px 18px',
    boxShadow: 'var(--sombra)',
  },
  avisoIcone: {
    width: 48,
    height: 48,
    borderRadius: '30%',
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoTitulo: {
    fontWeight: 800,
    lineHeight: 1.2,
    color: 'var(--text)',
  },
  avisoTexto: {
    color: 'var(--text-2)',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  avisoAcoes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
}
