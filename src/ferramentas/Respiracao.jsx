import { useEffect, useState } from 'react'
import { Play, Square, Wind } from 'lucide-react'
import { Card, Botao, Chip } from '../components/ui'
import { falar, pararFala } from '../lib/voz'
import { useDados, useTam } from './comum'
import { Coluna } from './pecas'
const TECNICAS = {
  calma: {
    nome: 'Acalmar (4-6)',
    desc: 'Expirar mais longo acalma o corpo.',
    fases: [
      ['Inspire', 4, 1],
      ['Expire', 6, 0.5],
    ],
  },
  quadrada: {
    nome: 'Quadrada (4-4-4-4)',
    desc: 'Foco e controle, usada por pilotos e bombeiros.',
    fases: [
      ['Inspire', 4, 1],
      ['Segure', 4, 1],
      ['Expire', 4, 0.5],
      ['Segure', 4, 0.5],
    ],
  },
  sono: {
    nome: 'Relaxar (4-7-8)',
    desc: 'Ajuda a desacelerar antes de dormir.',
    fases: [
      ['Inspire', 4, 1],
      ['Segure', 7, 1],
      ['Expire', 8, 0.5],
    ],
  },
}
export default function Respiracao({ config = {}, chave }) {
  const { simples } = useTam()
  const [prefs, setPrefs] = useDados(chave, {
    tecnica: config.tecnica || 'calma',
    sessoes: 0,
  })
  const tecId = simples ? config.tecnica || 'calma' : prefs?.tecnica || 'calma'
  const tec = TECNICAS[tecId] || TECNICAS.calma
  const meta = Number(config.ciclos) || (simples ? 4 : 6)
  const [sessao, setSessao] = useState({
    rodando: false,
    fase: 0,
    ciclo: 0,
  })
  const [rotacao, setRotacao] = useState(0)
  const fase = tec.fases[sessao.fase] || tec.fases[0]
  useEffect(() => {
    if (!sessao.rodando) return
    const [rotulo, seg] = tec.fases[sessao.fase]
    falar(rotulo)
    navigator.vibrate?.(40)
    const t = setTimeout(() => {
      const prox = (sessao.fase + 1) % tec.fases.length
      const ciclo = prox === 0 ? sessao.ciclo + 1 : sessao.ciclo
      if (ciclo >= meta) {
        setPrefs(a => ({
          ...(a || {}),
          sessoes: ((a || {}).sessoes || 0) + 1,
        }))
        falar('Muito bem. Exercício concluído.')
        setSessao({
          rodando: false,
          fase: 0,
          ciclo,
        })
      } else {
        setSessao({
          rodando: true,
          fase: prox,
          ciclo,
        })
      }
      setRotacao(r => r + 1)
    }, seg * 1000)
    return () => clearTimeout(t)
  }, [sessao.rodando, sessao.fase, sessao.ciclo, tec, meta, setPrefs])
  useEffect(() => () => pararFala(), [])
  const iniciar = () => {
    setSessao({
      rodando: true,
      fase: 0,
      ciclo: 0,
    })
    setRotacao(0)
  }
  const parar = () => {
    pararFala()
    setSessao({
      rodando: false,
      fase: 0,
      ciclo: 0,
    })
  }
  const escala = sessao.rodando ? fase[2] : 0.62
  const concluido = !sessao.rodando && sessao.ciclo >= meta
  return (
    <Coluna>
      {!simples && (
        <div style={styles.chips}>
          {Object.entries(TECNICAS).map(([id, t]) => (
            <Chip
              key={id}
              cor="ceu"
              ativo={id === tecId}
              onClick={() => {
                if (!sessao.rodando)
                  setPrefs(a => ({
                    ...(a || {}),
                    tecnica: id,
                  }))
              }}
            >
              {t.nome}
            </Chip>
          ))}
        </div>
      )}
      <Card cor="ceu" tamanho="g">
        <div style={styles.palco}>
          <div style={styles.halo} />
          <div
            style={{
              ...styles.bolha,
              transform: `scale(${escala})`,
              transitionDuration: sessao.rodando ? `${fase[1]}s` : '.8s',
            }}
          />
          <div style={styles.texto} aria-live="polite">
            <span
              key={rotacao + fase[0]}
              className="anim-fade"
              style={{
                ...styles.fase,
                fontSize: simples ? 34 : 30,
              }}
            >
              {sessao.rodando ? fase[0] : concluido ? 'Pronto' : 'Respire'}
            </span>
            {sessao.rodando && (
              <span style={styles.ciclo}>
                {sessao.ciclo + 1} de {meta}
              </span>
            )}
          </div>
        </div>
        <p style={styles.desc}>{concluido ? 'Você completou o exercício. Como se sente?' : tec.desc}</p>
        <div
          style={{
            marginTop: 16,
          }}
        >
          {sessao.rodando ? (
            <Botao variante="fantasma" icone={Square} grande cheio onClick={parar}>
              Parar
            </Botao>
          ) : (
            <Botao variante="primario" icone={Play} grande cheio onClick={iniciar}>
              {concluido ? 'Fazer de novo' : 'Começar'}
            </Botao>
          )}
        </div>
      </Card>
      {!simples && (prefs?.sessoes || 0) > 0 && (
        <p style={styles.sessoes}>
          <Wind size={16} /> {prefs.sessoes} {prefs.sessoes === 1 ? 'sessão concluída' : 'sessões concluídas'}
        </p>
      )}
    </Coluna>
  )
}
const styles = {
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  palco: {
    position: 'relative',
    height: 260,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: '50%',
    border: '2px dashed rgba(0,0,0,0.25)',
  },
  bolha: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-in-out',
  },
  texto: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  fase: {
    fontWeight: 800,
    color: '#000',
  },
  ciclo: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
  },
  desc: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    lineHeight: 1.4,
    marginTop: 4,
  },
  sessoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 14,
    color: 'var(--text-2)',
  },
}
