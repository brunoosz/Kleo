import { Volume2, VolumeX, LocateFixed, Camera, X, Flag, Gauge, SatelliteDish, Check } from 'lucide-react'
import BannerManobra from './BannerManobra'
import { Botao, BotaoIcone, Chip, Tag } from '../ui'
import { formatarDistancia, formatarDuracao, horarioChegada } from '../MapaRotas'
const VELOCIDADES_SIM = [1, 2, 4, 8]
export default function PainelNavegacao({
  estado,
  rota,
  destino,
  simulando,
  velSim,
  onVelSim,
  mudo,
  onMudo,
  seguir,
  onCentralizar,
  onCamera,
  onSair,
  recalculando,
  simples,
  grande,
  chegou,
  semGps,
}) {
  const ins = rota?.instrucoes || []
  const proxima = estado ? ins[estado.prox] : null
  const depois = estado ? ins[estado.prox + 1] : null
  const precisaoRuim = !simulando && estado?.precisao > 60
  const restanteS = estado?.restanteS ?? rota?.duracao ?? 0
  const restanteM = estado?.restanteM ?? rota?.distancia ?? 0
  const alvo = simples || grande ? 60 : 52
  return (
    <>
      <div style={styles.topo}>
        {!chegou && (
          <BannerManobra
            instrucao={proxima}
            depois={depois}
            distancia={estado?.distProx}
            recalculando={recalculando}
            simples={simples}
            grande={grande}
          />
        )}
        <div style={styles.linha}>
          <div style={styles.esquerda}>
            {simulando && (
              <div style={styles.simulacao} className="anim-left">
                <Tag cor="lima" icone={Gauge}>
                  Simulação
                </Tag>
                {!simples &&
                  VELOCIDADES_SIM.map(v => (
                    <Chip
                      key={v}
                      cor="branco"
                      ativo={velSim === v}
                      onClick={() => onVelSim(v)}
                      aria-label={`Velocidade ${v} vezes`}
                    >
                      {v}x
                    </Chip>
                  ))}
              </div>
            )}
            {(precisaoRuim || semGps) && (
              <div style={styles.avisoGps} className="anim-fade" role="status">
                <SatelliteDish size={16} aria-hidden="true" />
                {semGps ? 'Procurando o sinal do GPS...' : 'Sinal do GPS fraco'}
              </div>
            )}
          </div>
          <div style={styles.direita}>
            <BotaoIcone
              icone={mudo ? VolumeX : Volume2}
              label={mudo ? 'Ligar a voz' : 'Silenciar a voz'}
              onClick={onMudo}
              variante={mudo ? 'lavanda' : 'branco'}
            />
            {!seguir && (
              <BotaoIcone
                icone={LocateFixed}
                label="Voltar a seguir minha posição"
                onClick={onCentralizar}
                variante="preto"
              />
            )}
          </div>
        </div>
      </div>

      <div style={styles.rodape}>
        {chegou ? (
          <div style={styles.chegada} className="anim-up" role="status" aria-live="assertive">
            <span className="anim-pop" style={styles.chegadaIcone}>
              <Flag size={30} color="#000" aria-hidden="true" />
            </span>
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <div style={styles.chegadaTitulo}>Você chegou</div>
              <div style={styles.chegadaNome}>{destino?.nome}</div>
            </div>
            <Botao icone={Check} onClick={onSair} grande={simples || grande}>
              Concluir
            </Botao>
          </div>
        ) : (
          <div style={styles.painel} className="anim-up">
            <div style={styles.infos}>
              <div style={styles.infoTexto} aria-live="off">
                <div
                  style={{
                    ...styles.tempo,
                    fontSize: simples ? 34 : 30,
                  }}
                >
                  {formatarDuracao(restanteS)}
                </div>
                <div style={styles.sub}>
                  {formatarDistancia(restanteM)} <span style={styles.ponto} /> chegada{' '}
                  {horarioChegada(restanteS)}
                </div>
              </div>
              <Botao
                variante="perigo"
                icone={X}
                onClick={onSair}
                grande={simples || grande}
                aria-label="Sair da navegação"
              >
                Sair
              </Botao>
            </div>
            <button
              type="button"
              onClick={onCamera}
              className="tap"
              style={{
                ...styles.camera,
                minHeight: alvo,
              }}
            >
              <Camera size={simples ? 24 : 21} aria-hidden="true" />
              <span>Câmera guia</span>
              {!simples && <span style={styles.cameraSub}>a IA olha o caminho com você</span>}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
const styles = {
  topo: {
    position: 'absolute',
    top: 'max(12px, env(safe-area-inset-top))',
    left: 12,
    right: 12,
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    pointerEvents: 'none',
  },
  linha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    pointerEvents: 'none',
  },
  esquerda: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
    pointerEvents: 'auto',
    minWidth: 0,
  },
  direita: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    pointerEvents: 'auto',
  },
  simulacao: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    padding: 6,
    background: 'var(--surface)',
    borderRadius: 'var(--r-badge)',
    boxShadow: 'var(--sombra)',
  },
  avisoGps: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    fontSize: 14,
    fontWeight: 600,
    background: 'var(--lavanda)',
    color: '#000',
    borderRadius: 'var(--r-badge)',
    boxShadow: 'var(--sombra)',
  },
  rodape: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 1100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  painel: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  infos: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  infoTexto: {
    flex: 1,
    minWidth: 0,
  },
  tempo: {
    fontWeight: 800,
    lineHeight: 1,
    color: 'var(--sucesso)',
  },
  sub: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    color: 'var(--text-2)',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ponto: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--text-3)',
    display: 'inline-block',
  },
  camera: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 18px',
    width: '100%',
    background: 'var(--lima)',
    color: '#000',
    borderRadius: 'var(--r-btn)',
    fontSize: 17,
    fontWeight: 700,
  },
  cameraSub: {
    fontSize: 14,
    fontWeight: 400,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chegada: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    background: 'var(--lima)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    flexWrap: 'wrap',
  },
  chegadaIcone: {
    width: 56,
    height: 56,
    borderRadius: 20,
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chegadaTitulo: {
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1.05,
    color: '#000',
  },
  chegadaNome: {
    fontSize: 16,
    color: '#000',
    marginTop: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
