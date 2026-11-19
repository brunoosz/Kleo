import { Check, Clock, X, Navigation } from 'lucide-react'
import Camada from './Camada'
import { Botao } from './ui'
import useModoSimples from '../hooks/useModoSimples'
import { infoTipo } from './RotinaUtil'
export default function RotinaAlerta({ alerta, total = 1, onFeito, onAdiar, onFechar, onRota }) {
  const simples = useModoSimples()
  if (!alerta) return null
  const info = infoTipo(alerta.rotina?.tipo)
  const Icone = info.icone
  return (
    <Camada>
      <div style={styles.envoltorio}>
        <div
          key={alerta.chave}
          role="alertdialog"
          aria-live="assertive"
          aria-label={alerta.titulo}
          className="anim-pop"
          style={styles.cartao}
        >
          <div style={styles.topo}>
            <span
              className="pulse-ring"
              style={{
                ...styles.icone,
                background: info.cor,
                width: simples ? 60 : 50,
                height: simples ? 60 : 50,
              }}
            >
              <Icone size={simples ? 30 : 24} color="#000" strokeWidth={2.1} aria-hidden="true" />
            </span>
            <div style={styles.textos}>
              <span style={styles.rotulo}>
                {alerta.antecipado ? 'Lembrete' : `Agora · ${alerta.hora}`}
                {total > 1 ? ` · +${total - 1}` : ''}
              </span>
              <strong
                style={{
                  ...styles.titulo,
                  fontSize: simples ? 23 : 19,
                }}
              >
                {alerta.titulo}
              </strong>
              {alerta.texto && (
                <span
                  style={{
                    ...styles.texto,
                    fontSize: simples ? 17 : 15,
                  }}
                >
                  {alerta.texto}
                </span>
              )}
            </div>
            {!simples && (
              <button type="button" onClick={onFechar} aria-label="Fechar aviso" style={styles.fechar}>
                <X size={18} />
              </button>
            )}
          </div>
          <div
            style={{
              ...styles.acoes,
              flexDirection: simples ? 'column' : 'row',
            }}
          >
            {alerta.antecipado ? (
              <Botao
                cheio
                grande={simples}
                icone={Check}
                onClick={onFechar}
                style={{
                  flex: 1,
                }}
              >
                Entendi
              </Botao>
            ) : (
              <>
                {alerta.rotina?.tipo === 'saida' && onRota ? (
                  <Botao
                    variante="lima"
                    cheio
                    grande={simples}
                    icone={Navigation}
                    onClick={onRota}
                    style={{
                      flex: 1,
                    }}
                  >
                    Ver a rota
                  </Botao>
                ) : (
                  <Botao
                    variante="lima"
                    cheio
                    grande={simples}
                    icone={Check}
                    onClick={onFeito}
                    style={{
                      flex: 1,
                    }}
                  >
                    {info.feito}
                  </Botao>
                )}
                <Botao
                  variante="fantasma"
                  cheio
                  grande={simples}
                  icone={Clock}
                  onClick={onAdiar}
                  style={{
                    flex: 1,
                  }}
                >
                  Daqui 10 min
                </Botao>
              </>
            )}
          </div>
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  envoltorio: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 950,
    display: 'flex',
    justifyContent: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 12px 0',
    pointerEvents: 'none',
  },
  cartao: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 496,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: 18,
    boxShadow: 'var(--sombra), 0 12px 40px rgba(120, 100, 200, 0.22)',
    border: '2px solid #000',
  },
  topo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  icone: {
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-2)',
  },
  titulo: {
    fontWeight: 800,
    lineHeight: 1.15,
    color: 'var(--text)',
    overflowWrap: 'anywhere',
  },
  texto: {
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoes: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
}
