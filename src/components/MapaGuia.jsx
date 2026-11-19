import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import {
  X,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Hand,
  Footprints,
  TriangleAlert,
  Flag,
  Sparkles,
  CameraOff,
  Settings,
  Compass,
  LoaderCircle,
  Eye,
} from 'lucide-react'
import Camada from './Camada'
import BannerManobra from './mapa/BannerManobra'
import { RotaLinha, MarcadorNavegacao, SeguirMapa, MarcadorDestino } from './MapaCamadas'
import { TILE_URL, difAngulo, formatarDistancia } from './MapaRotas'
import useBussola from './mapa/useBussola'
import { analisarImagem, temIA, mensagemErro } from '../lib/ia'
import { falar } from '../lib/voz'
import { piscarTela } from '../hooks/useAcessibilidade'
import { avisosVisuaisAtivos } from '../lib/perfil'
const INTERVALO_IA = 1800
const ACOES = {
  seguir: {
    icone: ArrowUp,
    rotulo: 'Siga em frente',
    fala: 'Siga em frente',
    cor: 'var(--surface)',
  },
  virar_esquerda: {
    icone: CornerUpLeft,
    rotulo: 'Vire à esquerda',
    fala: 'Vire à esquerda',
    cor: 'var(--lima)',
  },
  virar_direita: {
    icone: CornerUpRight,
    rotulo: 'Vire à direita',
    fala: 'Vire à direita',
    cor: 'var(--lima)',
  },
  parar: {
    icone: Hand,
    rotulo: 'Pare',
    fala: 'Pare',
    cor: 'var(--erro)',
  },
  atravessar: {
    icone: Footprints,
    rotulo: 'Atravesse',
    fala: 'Pode atravessar com cuidado',
    cor: 'var(--ceu)',
  },
  cuidado: {
    icone: TriangleAlert,
    rotulo: 'Cuidado',
    fala: 'Cuidado',
    cor: 'var(--alerta)',
  },
  chegou: {
    icone: Flag,
    rotulo: 'Chegou',
    fala: 'Você chegou',
    cor: 'var(--lima)',
  },
}
function acaoDaManobra(ins) {
  const m = ins?.modificador || ''
  if (ins?.tipo === 'arrive') return 'chegou'
  if (m.includes('left')) return 'virar_esquerda'
  if (m.includes('right')) return 'virar_direita'
  return 'seguir'
}
function lerResposta(texto) {
  try {
    const m = String(texto).match(/\{[\s\S]*\}/)
    if (!m) return null
    const j = JSON.parse(m[0])
    const acao = ACOES[j.acao] ? j.acao : 'seguir'
    const confianca = Math.max(0, Math.min(1, Number(j.confianca) || 0.5))
    return {
      acao,
      confianca,
      alerta: String(j.alerta || '')
        .trim()
        .slice(0, 90),
      fala: String(j.fala || '')
        .trim()
        .slice(0, 120),
    }
  } catch {
    return null
  }
}
function orientacao(bussola, rumoRota) {
  if (bussola == null || rumoRota == null) return null
  const d = Math.round(difAngulo(bussola, rumoRota))
  if (Math.abs(d) < 20)
    return {
      graus: d,
      texto: 'Você está virado para o caminho certo.',
    }
  const lado = d > 0 ? 'direita' : 'esquerda'
  return {
    graus: d,
    texto: `Você está virado ${Math.abs(d)} graus para a ${lado} do caminho.`,
    girar: d > 0 ? 'esquerda' : 'direita',
  }
}
export default function MapaGuia({ estado, rota, destino, modo, necessidade, simples, mudo, onFechar }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const ocupado = useRef(false)
  const abortRef = useRef(null)
  const ultimaFala = useRef({
    acao: null,
    alerta: '',
  })
  const errosSeguidos = useRef(0)
  const esperaExtra = useRef(0)
  const [cameraOk, setCameraOk] = useState(false)
  const [erroCamera, setErroCamera] = useState(null)
  const [resposta, setResposta] = useState(null)
  const [analisando, setAnalisando] = useState(false)
  const [erroIA, setErroIA] = useState(null)
  const [pausado, setPausado] = useState(false)
  const [temVisao] = useState(() => temIA('navegacao'))
  const bussola = useBussola(true)
  const necessidades = [].concat(necessidade || [])
  const visual = necessidades.includes('visual')
  const grande = simples || visual
  const ctx = useRef({})
  useEffect(() => {
    ctx.current = {
      estado,
      rota,
      modo,
      necessidades,
      bussola,
      mudo,
    }
  })
  useEffect(() => {
    let cancelado = false
    async function abrir() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErroCamera(
          'Este aparelho ou navegador não permite usar a câmera aqui. Abra o app pelo endereço seguro (https).',
        )
        return
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment',
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        })
        if (cancelado) {
          s.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = s
        const v = videoRef.current
        if (v) {
          v.srcObject = s
          await v.play().catch(() => {})
        }
        setCameraOk(true)
      } catch (e) {
        if (cancelado) return
        setErroCamera(
          e?.name === 'NotAllowedError'
            ? 'Permita o uso da câmera nas configurações do navegador para usar a câmera guia.'
            : 'Não consegui abrir a câmera. Feche outros apps que estejam usando a câmera e tente de novo.',
        )
      }
    }
    abrir()
    return () => {
      cancelado = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      abortRef.current?.abort()
    }
  }, [])
  const dizer = useCallback((texto, urgente) => {
    if (!texto) return
    navigator.vibrate?.(urgente ? [160, 80, 160] : 90)
    if (avisosVisuaisAtivos()) piscarTela()
    if (!ctx.current.mudo)
      falar(texto, {
        forcar: true,
      })
  }, [])
  const analisar = useCallback(async () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (ocupado.current || !v || !c || !v.videoWidth) return
    ocupado.current = true
    setAnalisando(true)
    try {
      const w = 416
      const h = Math.round((v.videoHeight / v.videoWidth) * w)
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(v, 0, 0, w, h)
      const quadro = c.toDataURL('image/jpeg', 0.55)
      const { estado: est, rota: r, modo: md, necessidades: nec = [], bussola: b } = ctx.current
      const ins = r?.instrucoes?.[est?.prox]
      const dist = Math.round(est?.distProx ?? 0)
      const ori = orientacao(b, est?.rumoRota)
      const quem = nec.includes('cadeirante')
        ? 'cadeirante (cite degraus, guias sem rampa, buracos e rampas)'
        : nec.includes('visual')
          ? 'com deficiência visual (descreva perigos com clareza e direção: à frente, à esquerda, à direita)'
          : md === 'carro'
            ? 'passageiro/motorista de carro'
            : 'pedestre'
      const prompt = [
        `Você é o guia de navegação da Kleo ajudando uma pessoa ${quem}. A foto é da câmera traseira do celular, mostrando o que está à frente dela.`,
        `GPS: próxima manobra "${ins?.acao || 'siga em frente'}" em ${dist} metros${ins?.rua ? ` (${ins.rua})` : ''}.`,
        ori ? `Bússola: ${ori.texto}` : '',
        dist < 20 && ins?.tipo !== 'arrive'
          ? 'A curva está muito perto: se você vê a esquina ou a entrada, indique a ação da curva.'
          : '',
        'Responda SOMENTE com JSON, sem texto fora dele:',
        '{"acao":"seguir|virar_esquerda|virar_direita|parar|atravessar|cuidado|chegou","confianca":0.0-1.0,"alerta":"obstáculo ou perigo real em poucas palavras, ou vazio","fala":"frase curtíssima em português do Brasil"}',
        'Use "parar" para carro vindo, semáforo fechado ou perigo imediato. Use "cuidado" para obstáculo no caminho (poste, buraco, degrau, bicicleta, obra). Alerta vazio se não houver nada relevante.',
      ]
        .filter(Boolean)
        .join('\n')
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const texto = await analisarImagem(quadro, prompt, {
        funcao: 'navegacao',
        maxTokens: 90,
        signal: ctrl.signal,
        temperatura: 0.2,
        extraSystem: 'Responda apenas o JSON pedido.',
      })
      const res = lerResposta(texto)
      errosSeguidos.current = 0
      esperaExtra.current = 0
      setErroIA(null)
      if (!res) return
      setResposta({
        ...res,
        ts: Date.now(),
      })
      const gpsAcao = acaoDaManobra(ins)
      const perto = dist < 20 && (gpsAcao === 'virar_esquerda' || gpsAcao === 'virar_direita')
      const anterior = ultimaFala.current
      let fala = null
      let urgente = false
      if (perto && res.acao === gpsAcao) {
        fala = `É aqui: ${ACOES[gpsAcao].fala.toLowerCase()}`
        urgente = true
      } else if (res.alerta && res.alerta !== anterior.alerta) {
        fala = res.fala || `${ACOES[res.acao].rotulo}: ${res.alerta}`
        urgente = res.acao === 'parar' || res.acao === 'cuidado'
      } else if (res.acao !== anterior.acao && res.confianca >= 0.45) {
        fala = res.fala || ACOES[res.acao].fala
        urgente = res.acao === 'parar'
      }
      if (fala && fala !== anterior.fala) dizer(fala, urgente)
      ultimaFala.current = {
        acao: res.acao,
        alerta: res.alerta,
        fala: fala || anterior.fala,
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
      errosSeguidos.current++
      esperaExtra.current = Math.min(8000, 1500 * errosSeguidos.current)
      setErroIA(mensagemErro(e))
      if (errosSeguidos.current >= 3) setPausado(true)
    } finally {
      ocupado.current = false
      setAnalisando(false)
    }
  }, [dizer])
  useEffect(() => {
    if (!cameraOk || !temVisao || pausado) return
    let vivo = true
    let timer = null
    const ciclo = async () => {
      const inicio = Date.now()
      await analisar()
      if (!vivo) return
      const espera = Math.max(250, INTERVALO_IA - (Date.now() - inicio)) + esperaExtra.current
      timer = setTimeout(ciclo, document.visibilityState === 'visible' ? espera : 4000)
    }
    timer = setTimeout(ciclo, 500)
    return () => {
      vivo = false
      clearTimeout(timer)
    }
  }, [cameraOk, temVisao, pausado, analisar])
  useEffect(() => {
    if (!cameraOk) return
    dizer(
      temVisao
        ? 'Câmera guia ligada. Segure o celular em pé, apontando para a frente.'
        : 'Câmera ligada. Para a IA olhar o caminho, configure um modelo com visão nos ajustes.',
      false,
    )
  }, [cameraOk, temVisao, dizer])
  function retomar() {
    errosSeguidos.current = 0
    setErroIA(null)
    setPausado(false)
  }
  const ins = rota?.instrucoes || []
  const proxima = estado ? ins[estado.prox] : null
  const depois = estado ? ins[estado.prox + 1] : null
  const ori = orientacao(bussola, estado?.rumoRota)
  const acao = resposta ? ACOES[resposta.acao] : null
  const IconeAcao = acao?.icone
  return (
    <Camada>
      <div style={styles.tela} role="dialog" aria-modal="true" aria-label="Câmera guia" className="anim-fade">
        <video ref={videoRef} playsInline muted autoPlay style={styles.video} aria-hidden="true" />
        <canvas
          ref={canvasRef}
          style={{
            display: 'none',
          }}
        />

        {!cameraOk && !erroCamera && (
          <div style={styles.centro}>
            <LoaderCircle size={36} className="girar" color="#fff" aria-hidden="true" />
            <p style={styles.textoClaro}>Abrindo a câmera...</p>
          </div>
        )}

        {erroCamera && (
          <div style={styles.centro} role="alert">
            <span style={styles.erroIcone}>
              <CameraOff size={30} color="#000" aria-hidden="true" />
            </span>
            <p style={styles.textoClaro}>{erroCamera}</p>
          </div>
        )}

        <div style={styles.topo}>
          <BannerManobra
            instrucao={proxima}
            depois={depois}
            distancia={estado?.distProx}
            simples={simples}
            grande={grande}
            compacto
          />
          {ori && (
            <div style={styles.bussola} className="anim-fade" role="status">
              <Compass
                size={16}
                aria-hidden="true"
                style={{
                  transform: `rotate(${-ori.graus}deg)`,
                  transition: 'transform .3s',
                }}
              />
              {ori.girar ? `Gire um pouco para a ${ori.girar}` : 'Direção certa'}
            </div>
          )}
        </div>

        <div style={styles.baixo}>
          {temVisao && acao && (
            <div key={resposta.ts} style={styles.acaoWrap} aria-live="assertive" className="anim-pop">
              <div
                style={{
                  ...styles.acao,
                  background: acao.cor,
                }}
              >
                <IconeAcao
                  size={grande ? 44 : 36}
                  color={resposta.acao === 'parar' ? '#fff' : '#000'}
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
              </div>
              <div style={styles.acaoTextos}>
                <div style={styles.acaoRotulo}>{acao.rotulo}</div>
                {resposta.alerta && <div style={styles.acaoAlerta}>{resposta.alerta}</div>}
              </div>
            </div>
          )}

          {!temVisao && cameraOk && (
            <div style={styles.semIA} className="anim-up" role="note">
              <Eye
                size={22}
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                }}
              >
                <strong>A IA ainda não está olhando o caminho.</strong>
                <div style={styles.semIATexto}>
                  A IA da Kleo não está disponível agora. O banner e a voz do GPS continuam funcionando.
                </div>
              </div>
              <button
                type="button"
                className="tap"
                onClick={() => navigate('/configuracoes?secao=ia')}
                style={styles.botaoMini}
              >
                <Settings size={16} aria-hidden="true" /> Ajustes
              </button>
            </div>
          )}

          <div style={styles.rodape}>
            {rota?.coords && estado?.pos && (
              <div style={styles.pip} aria-hidden="true">
                <MapContainer
                  center={[estado.pos.lat, estado.pos.lng]}
                  zoom={17}
                  zoomControl={false}
                  attributionControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                  keyboard={false}
                  style={styles.pipMapa}
                >
                  <TileLayer url={TILE_URL} maxZoom={19} />
                  <RotaLinha coords={rota.coords} peso={5} />
                  {destino && <MarcadorDestino destino={destino} />}
                  <MarcadorNavegacao pos={estado.pos} rumo={estado.rumoGps ?? bussola ?? estado.rumoRota} />
                  <SeguirMapa pos={estado.pos} ativo zoom={17} deslocamento={0} />
                </MapContainer>
              </div>
            )}
            <div style={styles.rodapeDireita}>
              {temVisao && (
                <div style={styles.status} role="status">
                  {pausado ? (
                    <button type="button" className="tap" onClick={retomar} style={styles.botaoMini}>
                      <Sparkles size={16} aria-hidden="true" /> Tentar a IA de novo
                    </button>
                  ) : (
                    <>
                      <Sparkles size={16} aria-hidden="true" className={analisando ? 'girar' : undefined} />
                      {analisando ? 'Olhando o caminho...' : 'IA atenta'}
                    </>
                  )}
                </div>
              )}
              {erroIA && <div style={styles.erroIA}>{erroIA}</div>}
              {estado && (
                <div style={styles.restante}>{formatarDistancia(estado.restanteM)} até o destino</div>
              )}
              <button
                type="button"
                onClick={onFechar}
                className="tap"
                style={{
                  ...styles.fechar,
                  minHeight: grande ? 60 : 52,
                }}
              >
                <X size={22} aria-hidden="true" /> Fechar câmera
              </button>
            </div>
          </div>
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  tela: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
    background: '#000',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  centro: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
    textAlign: 'center',
  },
  textoClaro: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 1.4,
    maxWidth: 320,
  },
  erroIcone: {
    width: 64,
    height: 64,
    borderRadius: 22,
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topo: {
    position: 'absolute',
    top: 'max(12px, env(safe-area-inset-top))',
    left: 12,
    right: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'flex-start',
  },
  bussola: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    fontSize: 15,
    fontWeight: 600,
    background: 'var(--surface)',
    color: '#000',
    borderRadius: 'var(--r-badge)',
    boxShadow: 'var(--sombra)',
  },
  baixo: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 'max(12px, env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  acaoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
  },
  acao: {
    width: 64,
    height: 64,
    borderRadius: 22,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #000',
  },
  acaoTextos: {
    flex: 1,
    minWidth: 0,
  },
  acaoRotulo: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.05,
    color: '#000',
  },
  acaoAlerta: {
    fontSize: 16,
    color: 'var(--text-2)',
    marginTop: 4,
    lineHeight: 1.3,
  },
  semIA: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 16,
    background: 'var(--lavanda)',
    color: '#000',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    fontSize: 16,
  },
  semIATexto: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 4,
    lineHeight: 1.35,
  },
  botaoMini: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '0 16px',
    background: '#000',
    color: '#fff',
    borderRadius: 'var(--r-btn)',
    fontSize: 15,
    fontWeight: 600,
  },
  rodape: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
  },
  pip: {
    width: 128,
    height: 128,
    borderRadius: 'var(--r-card-m)',
    overflow: 'hidden',
    flexShrink: 0,
    border: '3px solid #fff',
    boxShadow: 'var(--sombra)',
    pointerEvents: 'none',
  },
  pipMapa: {
    width: '100%',
    height: '100%',
  },
  rodapeDireita: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'stretch',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    padding: '6px 12px',
    fontSize: 14,
    fontWeight: 600,
    background: 'var(--lima)',
    color: '#000',
    borderRadius: 'var(--r-badge)',
  },
  erroIA: {
    fontSize: 13,
    lineHeight: 1.35,
    padding: '8px 12px',
    background: 'var(--surface)',
    color: 'var(--text-2)',
    borderRadius: 15,
    maxHeight: 76,
    overflow: 'hidden',
  },
  restante: {
    alignSelf: 'flex-start',
    padding: '6px 12px',
    fontSize: 14,
    fontWeight: 600,
    background: 'var(--surface)',
    color: '#000',
    borderRadius: 'var(--r-badge)',
  },
  fechar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    background: 'var(--surface)',
    color: '#000',
    borderRadius: 'var(--r-btn)',
    fontSize: 17,
    fontWeight: 700,
    boxShadow: 'var(--sombra)',
  },
}
