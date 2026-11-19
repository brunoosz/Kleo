import { useEffect, useState } from 'react'
import { Check, Footprints, Car, Bus, TrainFront, Navigation, Clock } from 'lucide-react'
import { Botao, Campo, Chip } from './ui'
import useModoSimples from '../hooks/useModoSimples'
import { MeusLugares } from './LocaisSalvos'
import useLocais from '../hooks/useLocais'
import { estimarMinutos, origemDaSaida, nomeModo } from '../lib/locais'
import { criarSaida, horaDeSair, FOLGA_PADRAO } from '../lib/saidas'
const MODOS = [
  {
    id: 'pe',
    nome: 'A pé',
    icone: Footprints,
  },
  {
    id: 'carro',
    nome: 'Carro',
    icone: Car,
  },
  {
    id: 'onibus',
    nome: 'Ônibus',
    icone: Bus,
  },
  {
    id: 'metro',
    nome: 'Metrô',
    icone: TrainFront,
  },
]
const DIAS = [
  {
    id: 'uteis',
    nome: 'Segunda a sexta',
    dias: [1, 2, 3, 4, 5],
  },
  {
    id: 'todos',
    nome: 'Todos os dias',
    dias: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'fds',
    nome: 'Fim de semana',
    dias: [0, 6],
  },
]
export default function RotinaSaida({ onSalvo }) {
  const simples = useModoSimples()
  const locais = useLocais()
  const [destinoId, setDestinoId] = useState(() => locais.find(l => l.tipo !== 'casa')?.id || null)
  const [chegada, setChegada] = useState('08:00')
  const [modo, setModo] = useState('pe')
  const [dias, setDias] = useState('uteis')
  const [estimativa, setEstimativa] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const destino = locais.find(l => l.id === destinoId) || null
  const temCasa = locais.some(l => l.tipo === 'casa')
  useEffect(() => {
    if (!destino) return
    let vivo = true
    const t = setTimeout(async () => {
      setCalculando(true)
      try {
        const origem = await origemDaSaida()
        const min = origem ? await estimarMinutos(origem, destino, modo) : null
        if (vivo) setEstimativa(min)
      } catch {
        if (vivo) setEstimativa(null)
      }
      if (vivo) setCalculando(false)
    }, 300)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [destino, modo])
  const partida = estimativa != null ? horaDeSair(chegada, estimativa, FOLGA_PADRAO) : null
  const salvar = async () => {
    if (!destino) {
      setErro('Escolha para onde você vai.')
      return
    }
    if (!/^\d{2}:\d{2}$/.test(chegada)) {
      setErro('Escolha a hora de chegada.')
      return
    }
    setSalvando(true)
    try {
      const r = await criarSaida({
        localId: destino.id,
        chegada,
        modo,
        dias: DIAS.find(d => d.id === dias).dias,
      })
      onSalvo?.(r)
    } catch {
      setErro('Não consegui salvar. Tente de novo.')
    }
    setSalvando(false)
  }
  const tamanhoRotulo = simples ? 18 : 15
  return (
    <div style={styles.coluna}>
      <span style={{ ...styles.rotulo, fontSize: tamanhoRotulo }}>Para onde você vai</span>
      <MeusLugares compacto escolhido={destinoId} onEscolher={l => setDestinoId(l.id)} />
      {!temCasa && (
        <p style={styles.dica}>Dica: salve também a sua Casa. É de lá que eu calculo o tempo do caminho.</p>
      )}
      <Campo
        rotulo="Quero chegar às"
        type="time"
        value={chegada}
        onChange={e => setChegada(e.target.value)}
      />
      <span style={{ ...styles.rotulo, fontSize: tamanhoRotulo }}>Como você vai</span>
      <div style={styles.chips} role="radiogroup" aria-label="Como você vai">
        {MODOS.map(m => (
          <Chip
            key={m.id}
            icone={m.icone}
            ativo={modo === m.id}
            onClick={() => setModo(m.id)}
            role="radio"
            aria-checked={modo === m.id}
          >
            {m.nome}
          </Chip>
        ))}
      </div>
      <span style={{ ...styles.rotulo, fontSize: tamanhoRotulo }}>Quais dias</span>
      <div style={styles.chips} role="radiogroup" aria-label="Quais dias">
        {DIAS.map(d => (
          <Chip
            key={d.id}
            cor="branco"
            ativo={dias === d.id}
            onClick={() => setDias(d.id)}
            role="radio"
            aria-checked={dias === d.id}
          >
            {d.nome}
          </Chip>
        ))}
      </div>
      {destino && (
        <div className="anim-fade" style={styles.resumo} aria-live="polite">
          <Clock size={20} aria-hidden="true" style={styles.resumoIcone} />
          <span>
            {calculando
              ? 'Calculando o tempo do caminho...'
              : partida
                ? `Vou te avisar às ${partida} para sair. O caminho ${nomeModo(modo)} leva cerca de ${estimativa} min, mais ${FOLGA_PADRAO} min de folga, e a rota já vai estar pronta.`
                : 'Não consegui calcular o caminho agora. Vou usar 30 minutos e corrigir sozinha depois.'}
          </span>
        </div>
      )}
      {erro && (
        <p role="alert" style={styles.erro}>
          {erro}
        </p>
      )}
      <Botao
        variante="primario"
        icone={destino ? Check : Navigation}
        cheio
        grande
        carregando={salvando}
        onClick={salvar}
      >
        Salvar saída
      </Botao>
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
  rotulo: {
    fontWeight: 800,
    color: 'var(--text)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  dica: {
    margin: 0,
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  resumo: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: 'var(--lima)',
    borderRadius: 20,
    padding: '12px 14px',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.4,
    color: '#000',
  },
  resumoIcone: {
    flexShrink: 0,
    marginTop: 1,
  },
  erro: {
    margin: 0,
    color: 'var(--erro)',
    fontWeight: 600,
    fontSize: 15,
  },
}
