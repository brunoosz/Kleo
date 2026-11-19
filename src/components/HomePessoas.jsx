import { useNavigate } from 'react-router-dom'
import { Users, MessageCircle, Mic, ChevronRight } from 'lucide-react'
import { Card, Botao } from './ui'
import Avatar from './Avatar'
import useStorage from '../hooks/useStorage'
import { nomeExibicao, horaLista } from '../lib/rede/util'
export default function HomePessoas({ simples = false }) {
  const navigate = useNavigate()
  const [conta] = useStorage('kleo_rede_conta', null)
  const [conversasSalvas] = useStorage('kleo_rede_conversas', [])
  const [contatosSalvos] = useStorage('kleo_rede_contatos', [])
  const conversas = Array.isArray(conversasSalvas) ? conversasSalvas : []
  const contatos = Array.isArray(contatosSalvos) ? contatosSalvos : []
  const naoLidas = conta
    ? conversas.reduce((s, c) => s + (c.ultima?.de !== conta.uid ? c.naoLidas : 0), 0)
    : 0
  const recentes = conversas.slice(0, 4)
  const nomeDe = c => {
    if (c.outro === conta?.uid) return `@${conta.usuario} (Você)`
    const k = contatos.find(x => x.uid === c.outro)
    return k ? nomeExibicao(k) : c.perfil?.nome || 'Alguém'
  }
  const ultimaNova = conta ? conversas.find(c => c.ultima?.de !== conta.uid && c.naoLidas > 0) : null
  if (simples) {
    return (
      <Card tamanho="g" style={styles.simples}>
        <h2 style={styles.simplesTitulo}>
          Minha família
          {naoLidas > 0 && (
            <span style={styles.contador} aria-label={`${naoLidas} mensagens novas`}>
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </h2>
        <p style={styles.simplesTexto}>
          {ultimaNova ? (
            <>
              <strong>{nomeDe(ultimaNova)}</strong> mandou mensagem
            </>
          ) : conta ? (
            'Nenhuma mensagem nova.'
          ) : (
            'Mande mensagens e áudios para quem você gosta.'
          )}
        </p>
        <Botao
          variante="suave"
          icone={MessageCircle}
          grande
          cheio
          onClick={() => navigate(ultimaNova ? `/pessoas/${ultimaNova.outro}` : '/pessoas')}
          style={{
            marginTop: 12,
          }}
        >
          {ultimaNova ? 'Ver mensagem' : 'Abrir conversas'}
        </Botao>
      </Card>
    )
  }
  return (
    <Card cor="branco" tamanho="g" aria-label="Pessoas">
      <div style={styles.topo}>
        <div>
          <h2 style={styles.titulo}>Pessoas</h2>
          <p style={styles.sub}>
            {naoLidas
              ? `${naoLidas} mensage${naoLidas > 1 ? 'ns novas' : 'm nova'}`
              : conta
                ? 'Tudo lido'
                : 'Família e amigos'}
          </p>
        </div>
        <span style={styles.icone} aria-hidden="true">
          <Users size={24} color="#000" />
          {naoLidas > 0 && <span style={styles.iconeSelo}>{naoLidas > 99 ? '99+' : naoLidas}</span>}
        </span>
      </div>

      {recentes.length > 0 ? (
        <div style={styles.lista}>
          {recentes.map(c => {
            const novas = c.ultima?.de !== conta?.uid ? c.naoLidas : 0
            const k = contatos.find(x => x.uid === c.outro)
            return (
              <button
                key={c.id}
                type="button"
                className="tap"
                style={styles.linha}
                onClick={() => navigate(`/pessoas/${c.outro}`)}
              >
                <Avatar
                  nome={k?.nome || c.perfil?.nome}
                  foto={k?.foto || c.perfil?.foto}
                  chave={c.outro}
                  tamanho={42}
                />
                <span style={styles.textos}>
                  <strong style={styles.nome}>{nomeDe(c)}</strong>
                  <span
                    style={{
                      ...styles.ultima,
                      fontWeight: novas ? 700 : 500,
                      color: novas ? 'var(--text)' : 'var(--text-2)',
                    }}
                  >
                    {c.ultima?.tipo === 'audio' && (
                      <Mic
                        size={13}
                        style={{
                          verticalAlign: -1,
                          marginRight: 4,
                        }}
                        aria-hidden="true"
                      />
                    )}
                    {c.ultima?.texto}
                  </span>
                </span>
                {novas > 0 ? (
                  <span style={styles.badge}>{novas}</span>
                ) : (
                  <span style={styles.hora}>{horaLista(c.ultima?.em)}</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <p style={styles.vazio}>Mande mensagens e áudios para quem você gosta.</p>
      )}

      <button type="button" className="tap" style={styles.abrir} onClick={() => navigate('/pessoas')}>
        <span>{conta ? 'Abrir conversas' : 'Começar a conversar'}</span>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </Card>
  )
}
const styles = {
  contador: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
    height: 30,
    padding: '0 8px',
    marginLeft: 10,
    borderRadius: 15,
    background: '#d92d34',
    color: '#fff',
    fontSize: 17,
    fontWeight: 800,
    verticalAlign: 4,
  },
  iconeSelo: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    padding: '0 6px',
    borderRadius: 11,
    background: '#d92d34',
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--surface)',
  },
  topo: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: 15,
    color: 'var(--text-2)',
    marginTop: 4,
    fontWeight: 600,
  },
  icone: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 14,
  },
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '8px 4px',
    background: 'transparent',
    textAlign: 'left',
    borderRadius: 16,
    color: 'var(--text)',
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  nome: {
    fontSize: 16,
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ultima: {
    fontSize: 14,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hora: {
    fontSize: 12,
    color: 'var(--text-3)',
    fontWeight: 600,
    flexShrink: 0,
  },
  badge: {
    minWidth: 22,
    height: 22,
    padding: '0 6px',
    borderRadius: 11,
    background: '#000',
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vazio: {
    fontSize: 15,
    color: 'var(--text-2)',
    lineHeight: 1.45,
    marginTop: 12,
  },
  abrir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    minHeight: 50,
    padding: '0 18px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface-2)',
    fontSize: 16,
    fontWeight: 700,
    color: '#000',
  },
  simples: {
    display: 'flex',
    flexDirection: 'column',
  },
  simplesTitulo: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  simplesTexto: {
    fontSize: 20,
    lineHeight: 1.4,
    marginTop: 8,
  },
}
