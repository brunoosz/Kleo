import { Play, Pause, RotateCcw, Brain, Coffee, SkipForward } from 'lucide-react'
import { Card, Botao, BotaoIcone, Segmentado } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useAgora from '../components/profissao/useAgora'
import { formatarTempo } from '../components/profissao/util'
import { useTam } from './comum'
import { Anel, Coluna } from './pecas'
export default function Pomodoro({ config = {} }) {
  const { simples } = useTam()
  const focoMin = Number(config.foco) > 0 ? Number(config.foco) : 25
  const pausaMin = Number(config.pausa) > 0 ? Number(config.pausa) : 5
  const padrao = {
    fase: 'foco',
    estado: 'parado',
    fim: null,
    restante: focoMin * 60000,
    ciclos: 0,
    focoMin,
    pausaMin,
  }
  const [salvo, setPomo] = useStorage('kleo_pomodoro', padrao)
  const agora = useAgora(500)
  const base = salvo && salvo.fase ? salvo : padrao
  const p =
    base.estado === 'parado'
      ? {
          ...base,
          focoMin,
          pausaMin,
          restante: (base.fase === 'foco' ? focoMin : pausaMin) * 60000,
        }
      : base
  const min = {
    foco: p.focoMin || focoMin,
    pausa: p.pausaMin || pausaMin,
  }
  const total = min[p.fase] * 60000
  const restante = p.estado === 'rodando' ? Math.max(0, p.fim - agora) : p.restante
  const emFoco = p.fase === 'foco'
  const iniciar = () =>
    setPomo({
      ...p,
      estado: 'rodando',
      fim: Date.now() + (p.restante ?? total),
    })
  const pausar = () =>
    setPomo({
      ...p,
      estado: 'pausado',
      restante: Math.max(0, p.fim - Date.now()),
      fim: null,
    })
  const reiniciar = () =>
    setPomo({
      ...p,
      estado: 'parado',
      fim: null,
      restante: total,
    })
  const trocar = f =>
    setPomo({
      ...p,
      fase: f,
      estado: 'parado',
      fim: null,
      restante: min[f] * 60000,
    })
  return (
    <Coluna>
      <Card cor={emFoco ? 'lavanda' : 'lima'} tamanho="g">
        {!simples && (
          <Segmentado
            opcoes={[
              {
                id: 'foco',
                label: `Foco ${min.foco} min`,
                icone: Brain,
              },
              {
                id: 'pausa',
                label: `Pausa ${min.pausa} min`,
                icone: Coffee,
              },
            ]}
            valor={p.fase}
            onChange={trocar}
          />
        )}
        <div style={styles.centro}>
          <Anel
            progresso={1 - restante / total}
            tamanho={simples ? 230 : 210}
            espessura={14}
            cor="#000"
            trilho="rgba(255,255,255,0.7)"
          >
            <span
              style={{
                ...styles.tempo,
                fontSize: simples ? 56 : 50,
              }}
            >
              {formatarTempo(restante)}
            </span>
            <span key={p.fase} className="anim-fade" style={styles.fase}>
              {emFoco ? 'Hora de focar' : 'Hora da pausa'}
            </span>
          </Anel>
        </div>
        <div style={styles.botoes}>
          <div
            style={{
              flex: 1,
            }}
          >
            {p.estado === 'rodando' ? (
              <Botao key="pausar" variante="fantasma" icone={Pause} grande cheio onClick={pausar}>
                Pausar
              </Botao>
            ) : (
              <Botao key="iniciar" variante="primario" icone={Play} grande cheio onClick={iniciar}>
                {p.estado === 'pausado' ? 'Continuar' : 'Começar'}
              </Botao>
            )}
          </div>
          {!simples && (
            <BotaoIcone icone={RotateCcw} label="Reiniciar" variante="branco" onClick={reiniciar} />
          )}
          {!simples && (
            <BotaoIcone
              icone={SkipForward}
              label={emFoco ? 'Pular para a pausa' : 'Pular para o foco'}
              variante="branco"
              onClick={() => trocar(emFoco ? 'pausa' : 'foco')}
            />
          )}
        </div>
      </Card>
      <Card>
        <div style={styles.ciclos}>
          <span style={styles.ciclosNum} key={p.ciclos || 0} className="valor-muda">
            {p.ciclos || 0}
          </span>
          <span style={styles.ciclosTxt}>
            {(p.ciclos || 0) === 1 ? 'ciclo de foco concluído' : 'ciclos de foco concluídos'}.{' '}
            {simples ? '' : 'A Kleo avisa com som e vibração quando acabar.'}
          </span>
        </div>
      </Card>
    </Coluna>
  )
}
const styles = {
  centro: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 0 20px',
  },
  tempo: {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
    color: '#000',
    lineHeight: 1,
  },
  fase: {
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
    marginTop: 6,
  },
  botoes: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  ciclos: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  ciclosNum: {
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1,
    minWidth: 44,
    textAlign: 'center',
  },
  ciclosTxt: {
    fontSize: 15,
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
}
