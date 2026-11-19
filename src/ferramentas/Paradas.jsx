import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Navigation,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Eraser,
} from 'lucide-react'
import { Card, Botao, BotaoIcone, Tag, Vazio } from '../components/ui'
import useRemocao from '../components/profissao/useRemocao'
import { useDados, useTam, novoId } from './comum'
import { Coluna, Entrada, Barra } from './pecas'
const STATUS = {
  pendente: {
    rotulo: 'A fazer',
    cor: 'branco',
  },
  feita: {
    rotulo: 'Feita',
    cor: 'lima',
  },
  problema: {
    rotulo: 'Problema',
    cor: 'lavanda',
  },
}
export default function Paradas({ chave }) {
  const navigate = useNavigate()
  const { simples, h } = useTam()
  const [dados, setDados] = useDados(chave, {
    lista: [],
  })
  const [endereco, setEndereco] = useState('')
  const [nome, setNome] = useState('')
  const lista = Array.isArray(dados?.lista) ? dados.lista : []
  const feitas = lista.filter(p => p.status === 'feita').length
  const proxima = lista.find(p => p.status === 'pendente')
  const mudarLista = fn =>
    setDados(a => ({
      ...(a || {}),
      lista: fn((a || {}).lista || []),
    }))
  const adicionar = e => {
    e.preventDefault()
    if (!endereco.trim()) return
    mudarLista(l => [
      ...l,
      {
        id: novoId(),
        endereco: endereco.trim(),
        nome: nome.trim(),
        status: 'pendente',
      },
    ])
    setEndereco('')
    setNome('')
  }
  const status = (id, s) => {
    navigator.vibrate?.(20)
    mudarLista(l =>
      l.map(p =>
        p.id === id
          ? {
              ...p,
              status: s,
            }
          : p,
      ),
    )
  }
  const mover = (i, d) =>
    mudarLista(l => {
      const n = [...l]
      const j = i + d
      if (j < 0 || j >= n.length) return l
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  const navegar = p => navigate('/mapa?destino=' + encodeURIComponent(p.endereco))
  const limparFeitas = () => mudarLista(l => l.filter(p => p.status !== 'feita'))
  const { saindo, remover } = useRemocao(id => mudarLista(l => l.filter(p => p.id !== id)))
  return (
    <Coluna>
      {lista.length > 0 && (
        <Card cor={proxima ? 'ceu' : 'lima'} tamanho="g">
          <p style={styles.progTxt}>
            {feitas} de {lista.length} {simples ? 'feitas' : 'paradas concluídas'}
          </p>
          <div
            style={{
              margin: '10px 0 16px',
            }}
          >
            <Barra progresso={feitas / lista.length} cor="#000" altura={12} />
          </div>
          {proxima ? (
            <>
              <p style={styles.proxRot}>Próxima parada</p>
              <p style={styles.proxEnd}>
                {proxima.nome ? `${proxima.nome} · ` : ''}
                {proxima.endereco}
              </p>
              <div style={styles.proxAcoes}>
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <Botao variante="primario" icone={Navigation} grande cheio onClick={() => navegar(proxima)}>
                    Navegar
                  </Botao>
                </div>
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <Botao
                    variante="fantasma"
                    icone={Check}
                    grande
                    cheio
                    onClick={() => status(proxima.id, 'feita')}
                  >
                    Concluí
                  </Botao>
                </div>
              </div>
            </>
          ) : (
            <p style={styles.proxEnd}>Todas as paradas concluídas. Bom trabalho!</p>
          )}
        </Card>
      )}

      <Card>
        <form onSubmit={adicionar} style={styles.form}>
          <Entrada
            rotulo="Endereço"
            placeholder="Rua, número, bairro"
            value={endereco}
            onChange={e => setEndereco(e.target.value)}
            altura={h}
          />
          {!simples && (
            <Entrada
              rotulo="Nome ou referência (opcional)"
              placeholder="Ex: Dona Maria, pedido 123"
              value={nome}
              onChange={e => setNome(e.target.value)}
              altura={h}
            />
          )}
          <Botao
            variante="primario"
            icone={Plus}
            grande={simples}
            cheio
            type="submit"
            disabled={!endereco.trim()}
          >
            Adicionar parada
          </Botao>
        </form>
      </Card>

      {lista.length === 0 ? (
        <Card>
          <Vazio
            icone={MapPin}
            titulo="Nenhuma parada"
            texto="Adicione os endereços de entrega ou visita do dia."
          />
        </Card>
      ) : (
        <Coluna gap={10}>
          {lista.map((p, i) => (
            <div key={p.id} className={saindo(p.id) ? 'item-out' : 'anim-up'}>
              <Card cor={STATUS[p.status]?.cor || 'branco'}>
                <div style={styles.item}>
                  <span style={styles.num}>{i + 1}</span>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {p.nome && <p style={styles.nome}>{p.nome}</p>}
                    <p
                      style={{
                        ...styles.end,
                        textDecoration: p.status === 'feita' ? 'line-through' : 'none',
                      }}
                    >
                      {p.endereco}
                    </p>
                    {p.status !== 'pendente' && (
                      <div
                        style={{
                          marginTop: 6,
                        }}
                      >
                        <Tag
                          cor={p.status === 'feita' ? 'branco' : 'lima'}
                          icone={p.status === 'feita' ? Check : AlertTriangle}
                        >
                          {STATUS[p.status].rotulo}
                        </Tag>
                      </div>
                    )}
                  </div>
                  {!simples && (
                    <div style={styles.ordem}>
                      <button
                        onClick={() => mover(i, -1)}
                        disabled={i === 0}
                        style={{
                          ...styles.seta,
                          opacity: i === 0 ? 0.3 : 1,
                        }}
                        aria-label="Subir"
                      >
                        <ChevronUp size={20} />
                      </button>
                      <button
                        onClick={() => mover(i, 1)}
                        disabled={i === lista.length - 1}
                        style={{
                          ...styles.seta,
                          opacity: i === lista.length - 1 ? 0.3 : 1,
                        }}
                        aria-label="Descer"
                      >
                        <ChevronDown size={20} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={styles.acoes}>
                  <Botao variante="fantasma" icone={Navigation} onClick={() => navegar(p)}>
                    Navegar
                  </Botao>
                  {p.status === 'pendente' ? (
                    <BotaoIcone
                      icone={Check}
                      label="Marcar como feita"
                      variante="preto"
                      onClick={() => status(p.id, 'feita')}
                    />
                  ) : (
                    <BotaoIcone
                      icone={RotateCcw}
                      label="Voltar para a fazer"
                      variante="branco"
                      onClick={() => status(p.id, 'pendente')}
                    />
                  )}
                  {!simples && p.status === 'pendente' && (
                    <BotaoIcone
                      icone={AlertTriangle}
                      label="Marcar problema"
                      variante="lavanda"
                      onClick={() => status(p.id, 'problema')}
                    />
                  )}
                  {!simples && (
                    <BotaoIcone
                      icone={Trash2}
                      label="Remover parada"
                      variante="branco"
                      onClick={() => remover(p.id)}
                    />
                  )}
                </div>
              </Card>
            </div>
          ))}
          {feitas > 0 && (
            <Botao variante="fantasma" icone={Eraser} onClick={limparFeitas}>
              Tirar as concluídas
            </Botao>
          )}
        </Coluna>
      )}
    </Coluna>
  )
}
const styles = {
  progTxt: {
    fontSize: 22,
    fontWeight: 800,
    color: '#000',
  },
  proxRot: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#000',
  },
  proxEnd: {
    fontSize: 18,
    fontWeight: 600,
    color: '#000',
    marginTop: 4,
    lineHeight: 1.3,
  },
  proxAcoes: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  num: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    flexShrink: 0,
  },
  nome: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000',
  },
  end: {
    fontSize: 15,
    color: '#000',
    lineHeight: 1.35,
  },
  ordem: {
    display: 'flex',
    flexDirection: 'column',
  },
  seta: {
    width: 40,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  acoes: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
  },
}
