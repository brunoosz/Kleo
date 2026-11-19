import { useEffect, useState } from 'react'
import { AtSign, UserPlus, Check, MessageCircle, Search, Clock, Tag as IconeTag } from 'lucide-react'
import { Sheet, Botao, Campo, Vazio } from '../ui'
import Avatar from '../Avatar'
import useModoSimples from '../../hooks/useModoSimples'
import useStorage from '../../hooks/useStorage'
import {
  normalizarUsuario,
  buscarPessoas,
  adicionarContato,
  renomearContato,
  pedirAmizade,
  modoRede,
} from '../../lib/rede'
export default function BuscarPessoa({ aberto, onFechar, contatos = [], onConversar }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Adicionar pessoa" altura="85vh">
      {aberto && <Conteudo contatos={contatos} onConversar={onConversar} onFechar={onFechar} />}
    </Sheet>
  )
}
function Conteudo({ contatos, onConversar, onFechar }) {
  const simples = useModoSimples()
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [adicionado, setAdicionado] = useState(null)
  const [apelido, setApelido] = useState('')
  const [estadoPedido, setEstadoPedido] = useState('amigos')
  const [pedindo, setPedindo] = useState(null)
  const [amizadesSalvas] = useStorage('kleo_rede_amizades', [])
  const amizades = Array.isArray(amizadesSalvas) ? amizadesSalvas : []
  const estadoDe = uid => amizades.find(a => a.uid === uid)?.estado || null
  const termo = normalizarUsuario(texto)
  const demo = modoRede() === 'demo'
  useEffect(() => {
    if (termo.length < 2) return
    let vivo = true
    const t = setTimeout(async () => {
      setBuscando(true)
      setErro('')
      try {
        const r = await buscarPessoas(termo)
        if (vivo) setResultados(r)
      } catch {
        if (vivo) setErro('Não consegui procurar agora. Confira a internet.')
      }
      if (vivo) setBuscando(false)
    }, 400)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [termo])
  const jaE = uid => estadoDe(uid) === 'amigos' || (demo && contatos.some(c => c.uid === uid))
  const adicionar = async p => {
    setPedindo(p.uid)
    setErro('')
    try {
      const estado = await pedirAmizade(p.uid)
      await adicionarContato(p)
      setEstadoPedido(estado)
      setAdicionado(p)
      setApelido('')
      navigator.vibrate?.(30)
    } catch {
      setErro('Não consegui mandar o pedido. Tente de novo.')
    }
    setPedindo(null)
  }
  const salvarApelido = async () => {
    if (apelido.trim()) await renomearContato(adicionado.uid, apelido.trim()).catch(() => {})
    if (estadoPedido === 'amigos') onConversar?.(adicionado.uid)
    else onFechar?.()
  }
  const amigos = estadoPedido === 'amigos'
  if (adicionado) {
    return (
      <div className="anim-up" style={styles.pronto}>
        <Avatar nome={adicionado.nome} foto={adicionado.foto} chave={adicionado.uid} tamanho={96} />
        <h3 style={styles.prontoTitulo}>
          {amigos ? `Você e ${adicionado.nome} já são amigos` : 'Pedido de amizade enviado'}
        </h3>
        <p style={styles.prontoTexto}>
          {amigos
            ? 'Quer dar um apelido? Assim você pode dizer para a Kleo "manda mensagem para a minha filha".'
            : `Quando ${adicionado.nome} aceitar, vocês podem conversar. Enquanto isso, dê um apelido se quiser.`}
        </p>
        <Campo
          rotulo="Apelido (opcional)"
          icone={IconeTag}
          placeholder="Ex: Filha, Mãe, Vizinho"
          value={apelido}
          onChange={e => setApelido(e.target.value)}
          maxLength={30}
        />
        <div
          style={{
            height: 6,
          }}
        />
        <Botao
          variante="primario"
          grande
          cheio
          icone={amigos ? MessageCircle : Check}
          onClick={salvarApelido}
        >
          {amigos ? 'Começar a conversar' : 'Pronto'}
        </Botao>
      </div>
    )
  }
  return (
    <div style={styles.coluna}>
      <Campo
        rotulo="Procure pelo @ ou pelo nome"
        icone={AtSign}
        placeholder="ex: ana.souza"
        value={texto}
        onChange={e => {
          setTexto(e.target.value)
          if (normalizarUsuario(e.target.value).length < 2) setResultados([])
        }}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
      />
      {!simples && (
        <p style={styles.dica}>
          Peça para a pessoa ver o @ dela na aba Pessoas do app Kleo.
          {demo ? ' No modo demonstração, tente "ana", "carlos", "dona" ou "pedro".' : ''}
        </p>
      )}

      {erro && (
        <p role="alert" style={styles.erro}>
          {erro}
        </p>
      )}

      <div style={styles.lista} aria-live="polite">
        {termo.length >= 2 && !buscando && !resultados.length && !erro && (
          <Vazio
            icone={Search}
            titulo="Ninguém encontrado"
            texto="Confira se está escrito igual ao da pessoa."
            cor="mist"
          />
        )}
        {resultados.map((p, i) => {
          const ja = jaE(p.uid)
          const estado = estadoDe(p.uid)
          return (
            <div
              key={p.uid}
              className="anim-up"
              style={{
                ...styles.item,
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <Avatar nome={p.nome} foto={p.foto} chave={p.uid} tamanho={simples ? 56 : 48} />
              <span style={styles.textos}>
                <span
                  style={{
                    ...styles.nome,
                    fontSize: simples ? 19 : 17,
                  }}
                >
                  {p.nome}
                </span>
                <span style={styles.usuario}>@{p.usuario}</span>
              </span>
              {ja ? (
                <Botao
                  variante="fantasma"
                  icone={MessageCircle}
                  onClick={() => onConversar?.(p.uid)}
                  style={{
                    padding: '8px 14px',
                  }}
                >
                  Conversar
                </Botao>
              ) : estado === 'enviado' ? (
                <span style={styles.esperando}>
                  <Clock size={15} aria-hidden="true" /> Pedido enviado
                </span>
              ) : (
                <Botao
                  variante="lima"
                  icone={estado === 'recebido' ? Check : UserPlus}
                  carregando={pedindo === p.uid}
                  onClick={() => adicionar(p)}
                  style={{
                    padding: '8px 14px',
                  }}
                >
                  {estado === 'recebido' ? 'Aceitar' : 'Mandar pedido'}
                </Botao>
              )}
            </div>
          )
        })}
        {buscando && <p style={styles.dica}>Procurando...</p>}
      </div>
      {contatos.length > 0 && !termo && (
        <p
          style={{
            ...styles.dica,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Check size={15} aria-hidden="true" /> Você tem {contatos.length} contato
          {contatos.length > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 8,
  },
  dica: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.45,
  },
  erro: {
    fontSize: 15,
    color: 'var(--erro)',
    fontWeight: 600,
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 22,
    background: 'var(--surface-2)',
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  nome: {
    fontWeight: 800,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  usuario: {
    fontSize: 14,
    color: 'var(--text-2)',
  },
  esperando: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-2)',
    padding: '0 6px',
    flexShrink: 0,
  },
  pronto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  prontoTitulo: {
    fontSize: 22,
    fontWeight: 800,
  },
  prontoTexto: {
    fontSize: 15,
    color: 'var(--text-2)',
    lineHeight: 1.45,
    marginBottom: 6,
  },
}
