import { Play, Pause, RotateCcw, Flag } from 'lucide-react'
import { Card, Botao, BotaoIcone } from '../components/ui'
import useAgora from '../components/profissao/useAgora'
import { useDados, useTam } from './comum'
import { Coluna, Rotulo } from './pecas'
function formatar(ms) {
  const t = Math.max(0, Math.floor(ms / 100))
  const d = t % 10
  const s = Math.floor(t / 10) % 60
  const m = Math.floor(t / 600) % 60
  const h = Math.floor(t / 36000)
  const p = n => String(n).padStart(2, '0')
  return `${h ? h + ':' : ''}${p(m)}:${p(s)},${d}`
}
export default function Cronometro({ config = {}, chave }) {
  const { simples } = useTam()
  const [dados, setDados] = useDados(chave, {
    inicio: null,
    acumulado: 0,
    voltas: [],
  })
  const agora = useAgora(100)
  const d =
    dados && typeof dados === 'object'
      ? dados
      : {
          inicio: null,
          acumulado: 0,
          voltas: [],
        }
  const rodando = !!d.inicio
  const decorrido = (d.acumulado || 0) + (rodando ? agora - d.inicio : 0)
  const voltas = Array.isArray(d.voltas) ? d.voltas : []
  const comVoltas = config.voltas !== false && !simples
  const iniciar = () =>
    setDados(a => ({
      ...a,
      inicio: Date.now(),
    }))
  const pausar = () =>
    setDados(a => ({
      ...a,
      inicio: null,
      acumulado: (a.acumulado || 0) + (Date.now() - a.inicio),
    }))
  const zerar = () =>
    setDados({
      inicio: null,
      acumulado: 0,
      voltas: [],
    })
  const volta = () =>
    setDados(a => {
      const total = (a.acumulado || 0) + (a.inicio ? Date.now() - a.inicio : 0)
      const anterior = (a.voltas || [])[0]?.total || 0
      return {
        ...a,
        voltas: [
          {
            n: (a.voltas || []).length + 1,
            total,
            parcial: total - anterior,
          },
          ...(a.voltas || []),
        ].slice(0, 50),
      }
    })
  const parciais = voltas.map(v => v.parcial)
  const melhor = parciais.length > 1 ? Math.min(...parciais) : null
  const pior = parciais.length > 1 ? Math.max(...parciais) : null
  return (
    <Coluna>
      <Card cor={rodando ? 'lima' : 'branco'} tamanho="g">
        <p
          style={{
            ...styles.tempo,
            fontSize: simples ? 60 : 56,
          }}
          aria-live="off"
        >
          {formatar(decorrido)}
        </p>
        <p style={styles.estado}>{rodando ? 'Contando' : decorrido ? 'Pausado' : 'Pronto para começar'}</p>
        <div style={styles.botoes}>
          <div
            style={{
              flex: 1,
            }}
          >
            {rodando ? (
              <Botao key="p" variante="fantasma" icone={Pause} grande cheio onClick={pausar}>
                Pausar
              </Botao>
            ) : (
              <Botao key="i" variante="primario" icone={Play} grande cheio onClick={iniciar}>
                {decorrido ? 'Continuar' : 'Iniciar'}
              </Botao>
            )}
          </div>
          {comVoltas && rodando && (
            <BotaoIcone icone={Flag} label="Marcar volta" variante="lavanda" onClick={volta} />
          )}
          {!rodando && decorrido > 0 && (
            <BotaoIcone icone={RotateCcw} label="Zerar" variante="branco" onClick={zerar} />
          )}
        </div>
      </Card>

      {comVoltas && voltas.length > 0 && (
        <Card>
          <Rotulo>Voltas</Rotulo>
          {voltas.map(v => (
            <div key={v.n} className="anim-left" style={styles.volta}>
              <span style={styles.voltaN}>Volta {v.n}</span>
              <span
                style={{
                  ...styles.voltaP,
                  background:
                    v.parcial === melhor
                      ? 'var(--lima)'
                      : v.parcial === pior
                        ? 'var(--surface-2)'
                        : 'transparent',
                }}
              >
                {formatar(v.parcial)}
              </span>
              <span style={styles.voltaT}>{formatar(v.total)}</span>
            </div>
          ))}
        </Card>
      )}
    </Coluna>
  )
}
const styles = {
  tempo: {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
    lineHeight: 1,
    padding: '18px 0 6px',
    color: '#000',
  },
  estado: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-2)',
    marginBottom: 18,
  },
  botoes: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  volta: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderTop: '1px solid var(--surface-2)',
    fontVariantNumeric: 'tabular-nums',
  },
  voltaN: {
    flex: 1,
    fontSize: 15,
    fontWeight: 600,
  },
  voltaP: {
    fontSize: 16,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 30,
  },
  voltaT: {
    fontSize: 14,
    color: 'var(--text-3)',
    minWidth: 80,
    textAlign: 'right',
  },
}
