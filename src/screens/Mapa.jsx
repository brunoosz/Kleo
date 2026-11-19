import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer } from 'react-leaflet'
import {
  Car,
  Bus,
  TrainFront,
  Accessibility,
  Footprints,
  Volume2,
  LocateFixed,
  Search,
  X,
  Plus,
  Minus,
  MapPin,
  TriangleAlert,
  WifiOff,
  LoaderCircle,
  ExternalLink,
  ChevronDown,
  Palette,
  Mic,
  ArrowLeftRight,
  Info,
  Navigation,
  Play,
  ListOrdered,
  Check,
  BookmarkPlus,
} from 'lucide-react'
import Tela from '../components/Tela'
import { MeusLugares, SheetLocal } from '../components/LocaisSalvos'
import { acharLocal } from '../lib/locais'
import MapaGuia from '../components/MapaGuia'
import PainelNavegacao from '../components/mapa/PainelNavegacao'
import useNavegacao from '../components/mapa/useNavegacao'
import useBussola, { pedirBussola } from '../components/mapa/useBussola'
import { IconeManobra } from '../components/mapa/manobras'
import { coordsCidadeSync, geocodificarCidade } from '../components/mapa/cidade'
import {
  MapaEstilos,
  MapaAjuste,
  MarcadorUsuario,
  MarcadorDestino,
  MarcadorManobra,
  MarcadorNavegacao,
  SeguirMapa,
  RotaLinha,
  CamadaMetro,
  EstacoesAcessiveis,
  CamadaBase,
} from '../components/MapaCamadas'
import {
  estilosDisponiveis,
  estiloMapa,
  geocodificar,
  nomeDoPonto,
  rotaCarro,
  rotaAPe,
  distanciaM,
  instrucoesDaRota,
  planejarMetro,
  estacoesProximas,
  formatarDistancia,
  formatarDuracao,
  duracaoFalada,
  distanciaFalada,
  horarioChegada,
} from '../components/MapaRotas'
import { verificarGoogle } from '../lib/googleMapas'
import { CENTRO_SP, sistemaEm, pontosDoSistema } from '../data/metros'
import { lembrarPosicao, buscarLugares, categoriaDe, obterPosicao } from '../lib/lugares'
import { Botao, Chip, Sheet } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { piscarTela } from '../hooks/useAcessibilidade'
import { necessidadesDo, leituraVozAtiva, avisosVisuaisAtivos, definirAjusteManual } from '../lib/perfil'
import { falar, pararFala, ouvir, reconhecimentoDisponivel } from '../lib/voz'
const MODOS = [
  {
    id: 'pe',
    label: 'A pé',
    icone: Footprints,
    nome: 'a pé',
  },
  {
    id: 'carro',
    label: 'Carro',
    icone: Car,
    nome: 'de carro',
  },
  {
    id: 'onibus',
    label: 'Ônibus aprox.',
    icone: Bus,
    nome: 'de ônibus',
  },
  {
    id: 'metro',
    label: 'Metrô',
    icone: TrainFront,
    nome: 'de metrô',
  },
]
const M_POR_MIN_PE_TELA = 75
const NOME_ACESSIVEL = 'a pé pelo caminho acessível'
function modoInicial(necs) {
  if (necs.includes('cadeirante') || necs.includes('visual')) return 'pe'
  return 'carro'
}
const velPadrao = m => (m === 'carro' || m === 'onibus' ? 1 : 4)
async function buscarRota(o, dest, m, signal) {
  let r =
    m === 'carro' || m === 'onibus'
      ? await rotaCarro(o, dest, signal)
      : await rotaAPe(o, dest, signal, {
          cadeirante: m === 'acessivel',
        })
  if (m === 'onibus')
    r = {
      ...r,
      duracao: r.duracao * 1.6,
    }
  return {
    modo: m,
    ...r,
    instrucoes: instrucoesDaRota(r.passos, r.coords),
  }
}
export default function Mapa() {
  const [params] = useSearchParams()
  const [profile] = useStorage('kleo_profile', null)
  const simples = useModoSimples()
  const necessidades = necessidadesDo(profile)
  const mobilidade = necessidades.includes('cadeirante')
  const visual = leituraVozAtiva(profile)
  const auditiva = avisosVisuaisAtivos(profile)
  const grande = visual || simples || necessidades.includes('visual')
  const alvo = grande ? 60 : 48
  const cidadeNome = profile?.city?.trim() || ''
  const cidadeSync = useMemo(() => coordsCidadeSync(profile), [profile])
  const [cidadeGeo, setCidadeGeo] = useState(null)
  const centroCidade = cidadeSync || (cidadeGeo && cidadeGeo.nome === cidadeNome ? cidadeGeo : null)
  const centroBase = centroCidade || CENTRO_SP
  const [centroInicial] = useState(centroBase)
  const [estiloId, setEstiloId] = useStorage('kleo_mapa_estilo2', 'maps')
  const [salvarLugar, setSalvarLugar] = useState(false)
  useStorage('kleo_mapa_google', null)
  useEffect(() => {
    verificarGoogle()
  }, [])
  const estilo = estiloMapa(estiloId)
  const [menuCamadas, setMenuCamadas] = useState(false)
  const [posicao, setPosicao] = useState(null)
  const [statusLocal, setStatusLocal] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation ? 'buscando' : 'indisponivel',
  )
  const destinoParam = params.get('destino') || params.get('q') || ''
  const latParam = parseFloat(params.get('lat'))
  const lonParam = parseFloat(params.get('lon'))
  const temCoords = Number.isFinite(latParam) && Number.isFinite(lonParam)
  const modoBruto = params.get('modo') || ''
  const acessivelParam = params.get('acessivel') === '1' || modoBruto === 'acessivel'
  const modoParam = modoBruto === 'acessivel' ? 'pe' : MODOS.some(m => m.id === modoBruto) ? modoBruto : ''
  const chaveParam = [destinoParam, params.get('lat'), params.get('lon'), modoParam, acessivelParam].join('|')
  const [modoEscolhido, setModo] = useState(() => modoParam || modoInicial(necessidades))
  const [acessivelSalvo] = useStorage('kleo_mapa_acessivel', null)
  const acessivelPadrao = typeof acessivelSalvo === 'boolean' ? acessivelSalvo : mobilidade
  const [comumDestaVez, setComumDestaVez] = useState(false)
  const acessivel = (acessivelParam || acessivelPadrao) && !comumDestaVez
  const padraoFixo = (mobilidade && acessivelPadrao) || acessivelParam
  const acessivelRef = useRef(acessivel)
  useEffect(() => {
    acessivelRef.current = acessivel
  })
  const [destino, setDestino] = useState(null)
  const [rota, setRota] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [verPassos, setVerPassos] = useState(false)
  const [mostrarMetro, setMostrarMetro] = useState(false)
  const buscaDoParam = temCoords ? '' : destinoParam
  const [busca, setBusca] = useState(buscaDoParam)
  const [autoBusca, setAutoBusca] = useState(!!buscaDoParam)
  const [paramVisto, setParamVisto] = useState(chaveParam)
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState(null)
  const [focoBusca, setFocoBusca] = useState(!!buscaDoParam)
  const [ouvindo, setOuvindo] = useState(false)
  const [navegando, setNavegando] = useState(null)
  const [velSim, setVelSim] = useState(1)
  const [mudo, setMudo] = useState(false)
  const [seguir, setSeguir] = useState(true)
  const [recalculando, setRecalculando] = useState(false)
  const [chegou, setChegou] = useState(false)
  const [camera, setCamera] = useState(false)
  const mapaRef = useRef(null)
  const posRef = useRef(null)
  const abortRef = useRef(null)
  const recalcRef = useRef(null)
  const sheetRef = useRef(null)
  const recRef = useRef(null)
  const destinoRef = useRef(null)
  const centroRef = useRef(centroBase)
  const escolherRef = useRef(null)
  const origemProvisoriaRef = useRef(null)
  const retracarRef = useRef(null)
  useEffect(() => {
    destinoRef.current = destino
  }, [destino])
  useEffect(() => {
    centroRef.current = centroBase
  })
  if (chaveParam !== paramVisto) {
    setParamVisto(chaveParam)
    if (modoParam) setModo(modoParam)
    if (acessivelParam) setComumDestaVez(false)
    if (buscaDoParam) {
      setBusca(buscaDoParam)
      setFocoBusca(true)
      setAutoBusca(true)
    }
  }
  useEffect(() => {
    if (!temCoords) return
    const t = setTimeout(() => {
      escolherRef.current?.(
        {
          lat: latParam,
          lng: lonParam,
          nome: destinoParam || 'Destino',
          detalhe: 'Escolhido com a Kleo',
        },
        modoParam || undefined,
      )
    }, 60)
    return () => clearTimeout(t) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveParam])
  const sistema = sistemaEm(posicao) || sistemaEm(centroCidade)
  const modoBase =
    modoEscolhido === 'acessivel' ? 'pe' : modoEscolhido === 'metro' && !sistema ? 'pe' : modoEscolhido
  const efetivo = (m, ac = acessivel) => {
    const b = m === 'acessivel' ? 'pe' : m === 'metro' && !sistema ? 'pe' : m
    return ac && b === 'pe' ? 'acessivel' : b
  }
  const modo = efetivo(modoBase)
  const modos = MODOS.filter(m => m.id !== 'metro' || sistema).map(m =>
    m.id === 'metro'
      ? {
          ...m,
          label: sistema.nome,
        }
      : m,
  )
  useEffect(() => {
    if (!cidadeNome || cidadeSync) return
    const ctrl = new AbortController()
    geocodificarCidade(cidadeNome, ctrl.signal).then(p => {
      if (!p || ctrl.signal.aborted) return
      setCidadeGeo({
        nome: cidadeNome,
        ...p,
      })
      if (!posRef.current && !destinoRef.current) mapaRef.current?.setView([p.lat, p.lng], 14)
    })
    return () => ctrl.abort()
  }, [cidadeNome, cidadeSync])
  const gpsPlanejar = !navegando || navegando.simular
  useEffect(() => {
    if (!gpsPlanejar || !navigator.geolocation) return
    let primeira = !posRef.current
    const id = navigator.geolocation.watchPosition(
      p => {
        const pos = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          precisao: p.coords.accuracy,
        }
        posRef.current = pos
        setPosicao(pos)
        setStatusLocal('ok')
        if (primeira) {
          primeira = false
          lembrarPosicao(pos)
          const pendente = origemProvisoriaRef.current
          if (pendente) retracarRef.current?.(pendente)
          else if (!destinoRef.current) mapaRef.current?.setView([pos.lat, pos.lng], 16)
        }
      },
      e => {
        setStatusLocal(atual => (atual === 'ok' ? 'ok' : e.code === 1 ? 'negado' : 'indisponivel'))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [gpsPlanejar])
  useEffect(
    () => () => {
      abortRef.current?.abort()
      recalcRef.current?.abort()
      recRef.current?.stop?.()
      pararFala()
    },
    [],
  )
  useEffect(() => {
    if (!navegando || !navigator.wakeLock) return
    let trava = null
    let vivo = true
    const pedir = () =>
      navigator.wakeLock
        .request('screen')
        .then(t => {
          if (vivo) trava = t
          else t.release()
        })
        .catch(() => {})
    pedir()
    const voltar = () => {
      if (document.visibilityState === 'visible') pedir()
    }
    document.addEventListener('visibilitychange', voltar)
    return () => {
      vivo = false
      trava?.release?.()
      document.removeEventListener('visibilitychange', voltar)
    }
  }, [navegando])
  useEffect(() => {
    const q = busca.trim()
    if (q.length < 3) return
    const ctrl = new AbortController()
    const t = setTimeout(
      async () => {
        setBuscando(true)
        setErroBusca(null)
        const salvo = acharLocal(q)
        const itemSalvo = salvo
          ? {
              id: `local-${salvo.id}`,
              nome: salvo.nome,
              detalhe: salvo.endereco,
              lat: salvo.lat,
              lng: salvo.lng,
              metros: posRef.current ? distanciaM(posRef.current, salvo) : null,
            }
          : null
        if (itemSalvo && autoBusca) {
          setAutoBusca(false)
          setBuscando(false)
          escolherRef.current?.(itemSalvo)
          return
        }
        try {
          let r = null
          if (categoriaDe(q)) {
            const achados = await buscarLugares(q, {
              signal: ctrl.signal,
              maximo: 8,
            }).catch(e => {
              if (e?.name === 'AbortError') throw e
              return null
            })
            if (achados?.itens?.length)
              r = achados.itens.map(i => ({
                id: `perto-${i.lat},${i.lng}`,
                nome: i.nome,
                detalhe: i.endereco || `${achados.categoria} perto de você`,
                lat: i.lat,
                lng: i.lng,
                metros: i.metros,
              }))
          }
          if (!r) {
            const perto = posRef.current || (await obterPosicao().catch(() => null))
            if (ctrl.signal.aborted) return
            r = await geocodificar(q, perto, ctrl.signal, {
              centro: perto || centroRef.current,
              cidade: autoBusca && !perto ? cidadeNome : '',
            })
            if (perto)
              r = r
                .map(x => ({
                  ...x,
                  metros: distanciaM(perto, x),
                }))
                .sort((a, b) => a.metros - b.metros)
          }
          if (ctrl.signal.aborted) return
          if (autoBusca && r.length) {
            setAutoBusca(false)
            setBuscando(false)
            escolherRef.current?.(
              r[0],
              !modoParam && r[0].metros != null && r[0].metros < 1200 ? 'pe' : undefined,
            )
            return
          }
          setResultados(itemSalvo ? [itemSalvo, ...r] : r)
          if (!r.length && !itemSalvo)
            setErroBusca('Não encontrei esse lugar. Tente incluir o bairro ou a cidade.')
        } catch (e) {
          if (e.name !== 'AbortError') {
            setResultados([])
            setErroBusca(e.message)
          }
        } finally {
          if (!ctrl.signal.aborted) setBuscando(false)
        }
      },
      autoBusca ? 50 : 550,
    )
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [busca, autoBusca, cidadeNome, modoParam])
  const origem = posicao || centroBase
  function alterarBusca(v) {
    setBusca(v)
    setAutoBusca(false)
    if (v.trim().length < 3) {
      setResultados([])
      setErroBusca(null)
      setBuscando(false)
    }
  }
  function ajustarVista(pontos) {
    const mapa = mapaRef.current
    if (!mapa || !pontos.length) return
    const alturaSheet = Math.max(sheetRef.current?.offsetHeight || 0, 280)
    mapa.fitBounds(L.latLngBounds(pontos), {
      paddingTopLeft: [40, 100],
      paddingBottomRight: [40, Math.min(alturaSheet + 20, mapa.getSize().y * 0.6)],
      maxZoom: 17,
    })
  }
  function avisar(texto, { sempre = false } = {}) {
    if (auditiva) piscarTela()
    if (visual || sempre)
      falar(texto, {
        forcar: true,
      })
  }
  function resumoFalado(r) {
    if (r.modo === 'metro') {
      if (r.metro.caminharDireto)
        return `O destino está perto. Caminhando, leva cerca de ${duracaoFalada(r.duracao)}.`
      return `Rota de metrô: cerca de ${duracaoFalada(r.duracao)}. ${r.metro.segmentos.map(s => s.texto).join('. ')}.`
    }
    const nome = r.modo === 'acessivel' ? NOME_ACESSIVEL : MODOS.find(x => x.id === r.modo)?.nome || ''
    return `Rota ${nome}: ${duracaoFalada(r.duracao)}, ${distanciaFalada(r.distancia)}.`
  }
  async function tracarRota(dest, m) {
    if (!dest) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setErro(null)
    setVerPassos(false)
    pararFala()
    const o = posRef.current || centroBase
    origemProvisoriaRef.current = posRef.current ? null : dest
    if (m === 'metro') {
      const plano = planejarMetro(o, dest, {
        sistema,
        soAcessiveis: acessivelRef.current,
      })
      const nova = {
        modo: m,
        metro: plano,
        duracao: plano.minutos * 60,
        distancia: plano.distancia,
        acessivel: acessivelRef.current,
      }
      setRota(nova)
      setCarregando(false)
      const pontos = [
        [o.lat, o.lng],
        [dest.lat, dest.lng],
      ]
      plano.segmentos.forEach(s => {
        if (s.coords) pontos.push(...s.coords)
      })
      ajustarVista(pontos)
      if (auditiva) piscarTela()
      const trechosPe = plano.caminharDireto
        ? [
            {
              de: o,
              ate: dest,
            },
          ]
        : plano.segmentos.filter(x => x.tipo === 'pe')
      const cadeirante = acessivelRef.current
      Promise.all(
        trechosPe.map(x =>
          distanciaM(x.de, x.ate) < 25
            ? null
            : rotaAPe(x.de, x.ate, ctrl.signal, {
                cadeirante,
              }).catch(() => null),
        ),
      ).then(rs => {
        if (ctrl.signal.aborted || !rs.some(Boolean)) return
        let extra = 0
        const segmentos = plano.segmentos.map(x => ({
          ...x,
        }))
        const alvos = plano.caminharDireto ? [] : segmentos.filter(x => x.tipo === 'pe')
        rs.forEach((r, i) => {
          if (!r) return
          const seg = alvos[i]
          if (seg) {
            extra += r.duracao / 60 - seg.metros / M_POR_MIN_PE_TELA
            seg.coords = r.coords
            seg.metros = r.distancia
          }
        })
        const direto = plano.caminharDireto ? rs[0] : null
        const novoPlano = {
          ...plano,
          segmentos,
          coordsDireto: direto?.coords || null,
          minutos: direto ? direto.duracao / 60 : Math.max(1, plano.minutos + extra),
          distancia: direto ? direto.distancia : plano.distancia,
        }
        setRota(atual =>
          atual?.metro === plano
            ? {
                ...atual,
                metro: novoPlano,
                duracao: novoPlano.minutos * 60,
                distancia: novoPlano.distancia,
              }
            : atual,
        )
      })
      return
    }
    setRota(null)
    setCarregando(true)
    try {
      const nova = await buscarRota(o, dest, m, ctrl.signal)
      nova.acessivel = acessivelRef.current
      if (m === 'acessivel') {
        const sis = sistemaEm(o) || sistema
        const perto = [
          ...estacoesProximas(o, 3, {
            sistema: sis,
            soAcessiveis: true,
            raio: 2000,
          }).map(e => ({
            ...e,
            onde: 'origem',
          })),
          ...estacoesProximas(dest, 3, {
            sistema: sis,
            soAcessiveis: true,
            raio: 2000,
          }).map(e => ({
            ...e,
            onde: 'destino',
          })),
        ]
        const vistos = new Set()
        nova.estacoes = perto.filter(e => !vistos.has(e.nome) && vistos.add(e.nome))
      }
      if (ctrl.signal.aborted) return
      setRota(nova)
      ajustarVista(nova.coords)
      if (auditiva) piscarTela()
    } catch (e) {
      if (e.name === 'AbortError') return
      setErro({
        tipo: e.tipo || 'rede',
        mensagem: e.message || 'Não foi possível traçar a rota agora.',
      })
      avisar(e.message || 'Não foi possível traçar a rota.')
    } finally {
      if (abortRef.current === ctrl) setCarregando(false)
    }
  }
  function escolherDestino(d, pedido = modoBase) {
    const base = pedido === 'acessivel' ? 'pe' : pedido === 'metro' && !sistema ? 'pe' : pedido
    if (base !== modoEscolhido) setModo(base)
    if (comumDestaVez) {
      setComumDestaVez(false)
      acessivelRef.current = acessivelParam || acessivelPadrao
    }
    const m = efetivo(base, acessivelRef.current)
    setDestino(d)
    setBusca('')
    setResultados([])
    setErroBusca(null)
    setFocoBusca(false)
    tracarRota(d, m)
  }
  useEffect(() => {
    escolherRef.current = escolherDestino
    retracarRef.current = d => tracarRota(d, efetivo(modoBase, acessivelRef.current))
  })
  async function tocarMapa(p) {
    if (navegando) return
    if (menuCamadas) {
      setMenuCamadas(false)
      return
    }
    if (mostrarResultados) {
      setFocoBusca(false)
      setResultados([])
      return
    }
    const d = {
      ...p,
      nome: 'Ponto no mapa',
      detalhe: 'Buscando endereço...',
    }
    escolherDestino(d)
    const nome = await nomeDoPonto(p)
    setDestino(atual =>
      atual && atual.lat === p.lat && atual.lng === p.lng
        ? {
            ...atual,
            nome,
            detalhe: 'Ponto escolhido no mapa',
          }
        : atual,
    )
  }
  function trocarModo(m) {
    setModo(m)
    if (m === 'metro' && !destino && sistema) ajustarVista(pontosDoSistema(sistema))
    if (destino) tracarRota(destino, efetivo(m))
    else {
      setRota(null)
      setErro(null)
    }
  }
  function alternarAcessivel() {
    const novo = !acessivel
    if (padraoFixo) setComumDestaVez(!novo)
    else {
      setComumDestaVez(false)
      definirAjusteManual('kleo_mapa_acessivel', novo)
    }
    acessivelRef.current = novo
    if (destino) tracarRota(destino, efetivo(modoBase, novo))
  }
  function limpar() {
    abortRef.current?.abort()
    origemProvisoriaRef.current = null
    setComumDestaVez(false)
    setDestino(null)
    setRota(null)
    setErro(null)
    setCarregando(false)
    pararFala()
  }
  function recentralizar() {
    const mapa = mapaRef.current
    if (!mapa) return
    mapa.flyTo([origem.lat, origem.lng], 17, {
      duration: 0.8,
    })
    if (statusLocal !== 'ok')
      avisar(
        `Não tenho acesso à sua localização. Mostrando o centro de ${centroCidade && cidadeNome ? cidadeNome : 'São Paulo'}.`,
      )
  }
  function ouvirResumo() {
    if (!rota) return
    let texto = resumoFalado(rota)
    if (rota.instrucoes?.[0]) texto += ' ' + rota.instrucoes[0].texto + '.'
    if (rota.modo === 'acessivel') {
      texto += rota.semGarantia
        ? ' Não consegui garantir um caminho sem escadas, vá com cuidado.'
        : ' Caminho sem escadas, escolhido com menos subidas.'
      if (rota.subidas?.length)
        texto += ` Atenção: ${rota.subidas.length === 1 ? 'tem um trecho' : `tem ${rota.subidas.length} trechos`} mais inclinado${rota.subidas.length > 1 ? 's' : ''}.`
    }
    falar(texto, {
      forcar: true,
    })
  }
  function falarDestino() {
    if (ouvindo) {
      recRef.current?.stop?.()
      return
    }
    pararFala()
    setOuvindo(true)
    setFocoBusca(true)
    recRef.current = ouvir({
      onParcial: t => setBusca(t),
      onFinal: t => alterarBusca(t),
      onFim: () => setOuvindo(false),
      onErro: msg => {
        setErroBusca(msg)
        setOuvindo(false)
      },
    })
  }
  function irAteEstacao(est) {
    setModo('pe')
    escolherDestino(
      {
        lat: est.lat,
        lng: est.lng,
        nome: `Estação ${est.nome}`,
        detalhe: est.linha?.nome,
      },
      'pe',
    )
  }
  function iniciar(simular) {
    if (!rota?.coords) return
    pedirBussola()
    pararFala()
    setChegou(false)
    setRecalculando(false)
    setSeguir(true)
    setVerPassos(false)
    setVelSim(velPadrao(rota.modo))
    setNavegando({
      simular,
    })
    if (!simular && statusLocal !== 'ok') {
      avisar('Ainda não encontrei sua localização. Se estiver em local fechado, use Simular trajeto.', {
        sempre: true,
      })
    }
  }
  function sairNavegacao() {
    recalcRef.current?.abort()
    pararFala()
    setCamera(false)
    setNavegando(null)
    setChegou(false)
    setRecalculando(false)
    setSeguir(true)
    if (rota?.coords) setTimeout(() => ajustarVista(rota.coords), 80)
  }
  const aoRecalcular = useCallback(
    async pos => {
      const dest = destinoRef.current
      if (!dest || recalcRef.current) return
      const ctrl = new AbortController()
      recalcRef.current = ctrl
      setRecalculando(true)
      if (!mudo)
        falar('Recalculando', {
          forcar: true,
        })
      navigator.vibrate?.([100, 60, 100])
      try {
        const nova = await buscarRota(pos, dest, modo, ctrl.signal)
        if (!ctrl.signal.aborted) setRota(nova)
      } catch {
      } finally {
        if (recalcRef.current === ctrl) recalcRef.current = null
        setRecalculando(false)
      }
    },
    [modo, mudo],
  )
  const aoChegar = useCallback(() => setChegou(true), [])
  const aoGps = useCallback(pos => {
    posRef.current = pos
    setPosicao(pos)
    setStatusLocal('ok')
  }, [])
  const estadoNav = useNavegacao({
    rota,
    ativa: !!navegando && !!rota?.coords,
    simular: !!navegando?.simular,
    velocidade: velSim,
    modo: rota?.modo === 'onibus' ? 'carro' : rota?.modo,
    intro: destino ? `Iniciando rota para ${destino.nome}.` : '',
    mudo,
    auditiva,
    onRecalcular: aoRecalcular,
    onChegou: aoChegar,
    onGps: aoGps,
  })
  const bussola = useBussola(!!navegando && modo !== 'carro')
  const rumoSeta = estadoNav?.rumoGps ?? bussola ?? estadoNav?.rumoRota ?? 0
  const semGps = !!navegando && !navegando.simular && !estadoNav?.bruta
  const linkGoogle = destino
    ? `https://www.google.com/maps/dir/?api=1&origin=${origem.lat},${origem.lng}&destination=${destino.lat},${destino.lng}&travelmode=${modo === 'onibus' || modo === 'metro' ? 'transit' : modo === 'carro' ? 'driving' : 'walking'}`
    : null
  const mostrarResultados = !navegando && focoBusca && (resultados.length > 0 || buscando || erroBusca)
  const exibirMetro = !navegando && (modo === 'metro' || mostrarMetro)
  const podeNavegar = !!rota?.coords && !carregando
  const proxima = estadoNav ? rota?.instrucoes?.[estadoNav.prox] : null
  const idx = estadoNav?.indice
  const percorrido =
    navegando && idx != null && estadoNav?.pos
      ? [...rota.coords.slice(0, idx + 1), [estadoNav.pos.lat, estadoNav.pos.lng]]
      : null
  const restante =
    navegando && idx != null && estadoNav?.pos
      ? [[estadoNav.pos.lat, estadoNav.pos.lng], ...rota.coords.slice(idx + 1)]
      : rota?.coords
  return (
    <Tela semPadding rolavel={false} semNav={!!navegando}>
      <MapaEstilos />
      <div style={styles.area}>
        <div style={styles.mapaWrap}>
          <MapContainer
            ref={m => {
              mapaRef.current = m
            }}
            center={[centroInicial.lat, centroInicial.lng]}
            zoom={14}
            zoomControl={false}
            attributionControl={false}
            style={styles.mapa}
          >
            <CamadaBase estilo={estilo} />
            <MapaAjuste onToque={tocarMapa} />
            {exibirMetro && (
              <CamadaMetro
                sistema={sistema}
                esmaecida={rota?.modo === 'metro' && !rota.metro.caminharDireto}
              />
            )}
            {percorrido && <RotaLinha coords={percorrido} apagada peso={grande ? 8 : 6} />}
            {restante && (
              <RotaLinha
                coords={restante}
                peso={grande ? 8 : 6}
                tracejada={!navegando && rota?.modo !== 'carro' && rota?.modo !== 'onibus'}
              />
            )}
            {rota?.modo === 'metro' &&
              rota.metro.segmentos.map((s, i) =>
                s.tipo === 'trem' ? (
                  <RotaLinha key={i} coords={s.coords} cor={s.linha.cor} halo="#ffffff" peso={8} />
                ) : s.tipo === 'pe' ? (
                  <RotaLinha
                    key={i}
                    coords={
                      s.coords || [
                        [s.de.lat, s.de.lng],
                        [s.ate.lat, s.ate.lng],
                      ]
                    }
                    peso={s.coords ? 6 : 4}
                    tracejada
                  />
                ) : null,
              )}
            {rota?.modo === 'metro' && rota.metro.caminharDireto && destino && (
              <RotaLinha
                coords={
                  rota.metro.coordsDireto || [
                    [origem.lat, origem.lng],
                    [destino.lat, destino.lng],
                  ]
                }
                peso={4}
                tracejada
              />
            )}
            {!navegando && rota?.estacoes && <EstacoesAcessiveis estacoes={rota.estacoes} />}
            {navegando && proxima?.local && proxima.tipo !== 'arrive' && (
              <MarcadorManobra local={proxima.local} />
            )}
            {destino && <MarcadorDestino destino={destino} />}
            {navegando && estadoNav?.pos ? (
              <>
                <MarcadorNavegacao pos={estadoNav.pos} rumo={rumoSeta} />
                <SeguirMapa
                  pos={estadoNav.pos}
                  ativo={seguir && !camera}
                  zoom={rota?.modo === 'carro' || rota?.modo === 'onibus' ? 16 : 17}
                  deslocamento={0.18}
                  onSoltar={() => setSeguir(false)}
                />
              </>
            ) : (
              <MarcadorUsuario
                posicao={
                  posicao || {
                    ...centroBase,
                    precisao: 0,
                  }
                }
              />
            )}
          </MapContainer>
        </div>

        {navegando ? (
          <PainelNavegacao
            estado={estadoNav}
            rota={rota}
            destino={destino}
            simulando={navegando.simular}
            velSim={velSim}
            onVelSim={setVelSim}
            mudo={mudo}
            onMudo={() => {
              setMudo(v => !v)
              pararFala()
            }}
            seguir={seguir}
            onCentralizar={() => setSeguir(true)}
            onCamera={() => {
              pedirBussola()
              setCamera(true)
            }}
            onSair={sairNavegacao}
            recalculando={recalculando}
            simples={simples}
            grande={grande}
            chegou={chegou}
            semGps={semGps}
          />
        ) : (
          <>
            <div style={styles.topo}>
              <div
                style={{
                  ...styles.busca,
                  minHeight: alvo + 4,
                  borderColor: focoBusca ? '#000' : 'transparent',
                }}
              >
                <Search size={grande ? 24 : 20} color="var(--text-2)" aria-hidden="true" />
                <input
                  value={busca}
                  onChange={e => alterarBusca(e.target.value)}
                  onFocus={() => setFocoBusca(true)}
                  placeholder={destino ? destino.nome : 'Para onde vamos?'}
                  aria-label="Buscar destino"
                  style={{
                    ...styles.input,
                    fontSize: grande ? 19 : 17,
                  }}
                  enterKeyHint="search"
                />
                {buscando && (
                  <LoaderCircle size={18} color="var(--text-3)" className="girar" aria-hidden="true" />
                )}
                {busca && (
                  <button
                    type="button"
                    className="anim-pop tap"
                    onClick={() => alterarBusca('')}
                    style={{
                      ...styles.redondo,
                      width: 40,
                      height: 40,
                      background: 'var(--surface-2)',
                    }}
                    aria-label="Limpar busca"
                  >
                    <X size={18} />
                  </button>
                )}
                {reconhecimentoDisponivel() && (
                  <button
                    type="button"
                    onClick={falarDestino}
                    className={ouvindo ? 'pulse-ring tap' : 'tap'}
                    style={{
                      ...styles.redondo,
                      width: alvo,
                      height: alvo,
                      background: ouvindo ? '#000' : 'var(--lavanda)',
                    }}
                    aria-label={ouvindo ? 'Parar de ouvir' : 'Falar o destino'}
                  >
                    <Mic size={grande ? 24 : 20} color={ouvindo ? '#fff' : '#000'} />
                  </button>
                )}
              </div>

              {mostrarResultados && (
                <div
                  style={styles.resultados}
                  className="anim-scale stagger"
                  role="listbox"
                  aria-label="Lugares encontrados"
                >
                  {erroBusca && (
                    <div style={styles.erroBusca}>
                      <Info size={16} aria-hidden="true" /> {erroBusca}
                    </div>
                  )}
                  {resultados.map(r => (
                    <button
                      type="button"
                      key={r.id}
                      className="tap"
                      onClick={() => escolherDestino(r)}
                      style={{
                        ...styles.resultado,
                        minHeight: alvo + 8,
                      }}
                      role="option"
                      aria-selected="false"
                    >
                      <span style={styles.resIcone}>
                        <MapPin size={18} color="#000" aria-hidden="true" />
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            ...styles.resNome,
                            fontSize: grande ? 18 : 16,
                          }}
                        >
                          {r.nome}
                        </span>
                        {!simples && <span style={styles.resDetalhe}>{r.detalhe}</span>}
                      </span>
                      {r.metros != null && <span style={styles.resDist}>{formatarDistancia(r.metros)}</span>}
                    </button>
                  ))}
                  {buscando && !resultados.length && (
                    <div style={styles.erroBusca}>Procurando lugares...</div>
                  )}
                </div>
              )}
            </div>

            {!mostrarResultados && (
              <div
                className="stagger"
                style={{
                  ...styles.controles,
                  top: alvo + 30,
                }}
              >
                {!simples && (
                  <>
                    <BotaoRedondo
                      icone={Plus}
                      label="Aproximar"
                      onClick={() => mapaRef.current?.zoomIn()}
                      lado={alvo}
                    />
                    <BotaoRedondo
                      icone={Minus}
                      label="Afastar"
                      onClick={() => mapaRef.current?.zoomOut()}
                      lado={alvo}
                    />
                    <BotaoRedondo
                      icone={Palette}
                      label="Estilo do mapa"
                      texto="Estilo"
                      onClick={() => setMenuCamadas(v => !v)}
                      ativo={menuCamadas}
                      lado={alvo}
                    />
                  </>
                )}
                <BotaoRedondo
                  icone={LocateFixed}
                  label="Centralizar na minha localização"
                  onClick={recentralizar}
                  lado={alvo}
                  ativo={statusLocal === 'ok'}
                  cor="ceu"
                />
              </div>
            )}

            <SheetLocal
              aberto={salvarLugar && !!destino}
              onFechar={() => setSalvarLugar(false)}
              inicial={
                destino
                  ? {
                      tipo: 'outro',
                      nome: destino.nome,
                      lat: destino.lat,
                      lng: destino.lng,
                      endereco: destino.detalhe || destino.nome,
                    }
                  : null
              }
            />
            <Sheet
              aberto={menuCamadas && !mostrarResultados && !simples}
              onFechar={() => setMenuCamadas(false)}
              titulo="Estilo do mapa"
            >
              <div style={styles.menuCamadas}>
                {estilosDisponiveis().map(est => (
                  <button
                    type="button"
                    key={est.id}
                    className="tap"
                    onClick={() => {
                      setEstiloId(est.id)
                      setMenuCamadas(false)
                    }}
                    aria-pressed={estilo.id === est.id}
                    style={{
                      ...styles.menuItem,
                      background: estilo.id === est.id ? 'var(--lavanda)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                      }}
                    >
                      {est.nome}
                    </span>
                    {estilo.id === est.id && <Check size={18} aria-hidden="true" />}
                  </button>
                ))}
                {sistema && (
                  <>
                    <div
                      style={{
                        ...styles.menuTitulo,
                        marginTop: 6,
                      }}
                    >
                      Trilhos
                    </div>
                    <button
                      type="button"
                      className="tap"
                      onClick={() => setMostrarMetro(v => !v)}
                      disabled={modo === 'metro'}
                      aria-pressed={exibirMetro}
                      style={{
                        ...styles.menuItem,
                        background: exibirMetro ? 'var(--ceu)' : 'transparent',
                        opacity: modo === 'metro' ? 0.6 : 1,
                      }}
                    >
                      <TrainFront
                        size={18}
                        aria-hidden="true"
                        style={{
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                        }}
                      >
                        Linhas do {sistema.nome}
                      </span>
                      {exibirMetro && <Check size={18} aria-hidden="true" />}
                    </button>
                  </>
                )}
              </div>
            </Sheet>

            <section ref={sheetRef} style={styles.sheet} aria-label="Rota" className="anim-up">
              {!simples && (
                <div style={styles.chips} role="radiogroup" aria-label="Modo de deslocamento">
                  {modos.map(m => (
                    <Chip
                      key={m.id}
                      ativo={m.id === modoBase}
                      cor="lavanda"
                      icone={m.icone}
                      onClick={() => trocarModo(m.id)}
                      role="radio"
                      aria-checked={m.id === modoBase}
                      style={{
                        minHeight: grande ? 52 : 44,
                      }}
                    >
                      {m.label}
                    </Chip>
                  ))}
                  {modoBase !== 'carro' && (
                    <Chip
                      ativo={acessivel}
                      cor="lima"
                      icone={Accessibility}
                      onClick={alternarAcessivel}
                      role="switch"
                      aria-checked={acessivel}
                      style={{
                        minHeight: grande ? 52 : 44,
                        background: acessivel ? 'var(--lima)' : undefined,
                        color: '#000',
                        boxShadow: acessivel ? 'inset 0 0 0 2px #000' : undefined,
                      }}
                    >
                      {acessivel ? 'Acessível ligado' : 'Acessível'}
                    </Chip>
                  )}
                </div>
              )}

              <div style={styles.conteudo}>
                {!destino && (
                  <div style={styles.vazio} className="stagger">
                    <p
                      style={{
                        ...styles.vazioTitulo,
                        fontSize: simples ? 30 : 26,
                      }}
                    >
                      Para onde vamos?
                    </p>
                    <p
                      style={{
                        ...styles.vazioTexto,
                        fontSize: simples ? 18 : 16,
                      }}
                    >
                      {simples
                        ? 'Escreva ou fale o lugar lá em cima.'
                        : `Busque um lugar${reconhecimentoDisponivel() ? ', fale no microfone' : ''} ou toque no mapa para marcar o destino.`}
                    </p>
                    <div style={styles.meusLugares}>
                      <MeusLugares
                        onEscolher={l =>
                          escolherDestino({
                            nome: l.nome,
                            detalhe: l.endereco,
                            lat: l.lat,
                            lng: l.lng,
                          })
                        }
                      />
                    </div>
                    {statusLocal !== 'ok' && (
                      <p style={styles.aviso}>
                        <LocateFixed
                          size={16}
                          aria-hidden="true"
                          style={{
                            flexShrink: 0,
                          }}
                        />
                        {statusLocal === 'buscando'
                          ? 'Procurando sua localização...'
                          : `Sem acesso à localização. Usando ${centroCidade && cidadeNome ? `o centro de ${cidadeNome}` : 'a Praça da Sé'} como ponto de partida.`}
                      </p>
                    )}
                    {modo === 'metro' && sistema && !simples && (
                      <p style={styles.aviso}>
                        <TrainFront
                          size={16}
                          aria-hidden="true"
                          style={{
                            flexShrink: 0,
                          }}
                        />{' '}
                        {sistema.descricao} no mapa. Toque numa estação para ver o nome.
                      </p>
                    )}
                  </div>
                )}

                {destino && (
                  <div key={`${destino.lat},${destino.lng}`} className="anim-up" style={styles.destino}>
                    <span className="anim-pop" style={styles.destinoIcone}>
                      <MapPin size={20} color="#000" aria-hidden="true" />
                    </span>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div style={styles.label}>Destino</div>
                      <div
                        key={destino.nome}
                        className="anim-fade"
                        style={{
                          ...styles.destinoNome,
                          fontSize: grande ? 19 : 17,
                        }}
                      >
                        {destino.nome}
                      </div>
                      {destino.detalhe && !simples && (
                        <div style={styles.destinoDetalhe}>{destino.detalhe}</div>
                      )}
                    </div>
                    {!navegando && (
                      <button
                        type="button"
                        onClick={() => setSalvarLugar(true)}
                        className="tap"
                        style={{
                          ...styles.redondo,
                          width: 44,
                          height: 44,
                          background: 'var(--surface-2)',
                        }}
                        aria-label="Salvar este lugar"
                        title="Salvar este lugar"
                      >
                        <BookmarkPlus size={18} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={limpar}
                      className="tap"
                      style={{
                        ...styles.redondo,
                        width: 44,
                        height: 44,
                        background: 'var(--surface-2)',
                      }}
                      aria-label="Remover destino"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {destino && padraoFixo && modoBase !== 'carro' && (
                  <div
                    key={comumDestaVez ? 'rota-comum' : 'rota-sem-escadas'}
                    className="anim-up"
                    style={{
                      ...styles.rotaComum,
                      background: comumDestaVez ? 'var(--surface-2)' : 'var(--lima)',
                    }}
                  >
                    <span
                      style={{
                        ...styles.rotaComumTexto,
                        fontSize: grande ? 17 : 15,
                      }}
                    >
                      {comumDestaVez ? (
                        <Footprints
                          size={20}
                          style={{
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Accessibility
                          size={20}
                          style={{
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                      )}
                      {comumDestaVez ? 'Rota comum nesta viagem' : 'Rota sem escadas ligada'}
                    </span>
                    <button
                      type="button"
                      className="tap"
                      onClick={alternarAcessivel}
                      style={{
                        ...styles.rotaComumBotao,
                        minHeight: grande ? 52 : 44,
                        fontSize: grande ? 17 : 15,
                      }}
                    >
                      {comumDestaVez ? 'Voltar à rota sem escadas' : 'Rota comum só desta vez'}
                    </button>
                  </div>
                )}

                {destino && carregando && (
                  <div className="anim-fade" style={styles.carregandoWrap} aria-live="polite">
                    <div style={styles.carregando}>
                      <LoaderCircle size={22} className="girar" aria-hidden="true" />
                      Calculando a melhor rota...
                    </div>
                    <div
                      className="skeleton"
                      style={{
                        height: 38,
                        width: '46%',
                        borderRadius: 15,
                      }}
                      aria-hidden="true"
                    />
                    <div
                      className="skeleton"
                      style={{
                        height: 52,
                        width: '100%',
                        borderRadius: 25,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                )}

                {destino && erro && (
                  <div style={styles.erro} role="alert" className="anim-up">
                    <span
                      className="shake"
                      style={{
                        display: 'flex',
                      }}
                    >
                      {erro.tipo === 'offline' ? (
                        <WifiOff size={22} aria-hidden="true" />
                      ) : (
                        <TriangleAlert size={22} aria-hidden="true" />
                      )}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 180,
                      }}
                    >
                      <div style={styles.erroTitulo}>
                        {erro.tipo === 'offline'
                          ? 'Sem internet'
                          : erro.tipo === 'sem-rota'
                            ? 'Rota não encontrada'
                            : 'Algo deu errado'}
                      </div>
                      <div style={styles.erroTexto}>{erro.mensagem}</div>
                      {erro.tipo === 'offline' && sistema && (
                        <div style={styles.erroTexto}>O modo {sistema.nome} funciona mesmo sem internet.</div>
                      )}
                    </div>
                    <Botao variante="fantasma" onClick={() => tracarRota(destino, modo)}>
                      Tentar de novo
                    </Botao>
                  </div>
                )}

                {destino && rota && !carregando && (
                  <div key={rota.modo} className="stagger" style={styles.rota}>
                    <Resumo rota={rota} simples={simples} />

                    {podeNavegar && (
                      <div style={styles.acoes}>
                        <Botao
                          icone={Navigation}
                          grande
                          cheio
                          onClick={() => iniciar(false)}
                          style={{
                            flex: '2 1 160px',
                          }}
                        >
                          {simples ? 'Ir' : 'Iniciar'}
                        </Botao>
                        <Botao
                          variante="fantasma"
                          icone={Play}
                          grande
                          onClick={() => iniciar(true)}
                          style={{
                            flex: '1 1 140px',
                          }}
                        >
                          {simples ? 'Simular' : 'Simular trajeto'}
                        </Botao>
                      </div>
                    )}

                    {(rota.modo === 'onibus' || rota.modo === 'metro') && rota.acessivel && (
                      <div
                        style={{
                          ...styles.aviso,
                          background: 'var(--lima)',
                          color: '#000',
                        }}
                      >
                        <Accessibility
                          size={16}
                          style={{
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                        <span>
                          {rota.modo === 'metro'
                            ? 'Só usei estações com elevador ou rampa. Peça ajuda ao funcionário para o embarque.'
                            : 'Prefira ônibus com elevador (piso baixo) e acene para o motorista. O tempo até o ponto não considera ladeiras.'}
                        </span>
                      </div>
                    )}
                    {rota.modo === 'onibus' && !simples && (
                      <div style={styles.aviso}>
                        <Bus
                          size={16}
                          style={{
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                        <span>
                          Tempo aproximado pelo trajeto nas ruas. Linhas e horários reais: consulte{' '}
                          {sistema?.appTransporte
                            ? `o app ${sistema.appTransporte}`
                            : 'o app de transporte da sua cidade'}
                          .
                        </span>
                      </div>
                    )}

                    {rota.modo === 'acessivel' && (
                      <>
                        <div
                          style={{
                            ...styles.aviso,
                            background: 'var(--lima)',
                            color: '#000',
                          }}
                        >
                          <Accessibility
                            size={16}
                            style={{
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          />
                          <span>
                            {rota.semGarantia
                              ? 'Não consegui o caminho acessível agora; mostrei a rota a pé comum. Atenção a escadas.'
                              : `Sem escadas e com o mínimo de ladeiras${rota.alternativas > 1 ? ` (comparei ${rota.alternativas} caminhos)` : ''}. Tempo para cadeira de rodas.`}
                          </span>
                        </div>
                        {!rota.semGarantia && rota.inclinacaoMax != null && (
                          <div
                            style={{
                              ...styles.aviso,
                              background: rota.subidas?.length
                                ? 'rgba(245, 158, 11, 0.16)'
                                : 'var(--surface-2)',
                              color: '#000',
                            }}
                          >
                            <Accessibility
                              size={16}
                              style={{
                                flexShrink: 0,
                              }}
                              aria-hidden="true"
                            />
                            <span>
                              {rota.subidas?.length
                                ? `${rota.subidas.length} trecho${rota.subidas.length > 1 ? 's' : ''} com inclinação acima de 8% (máx. cerca de ${Math.round(rota.inclinacaoMax)}%). Se puder, vá com acompanhante.`
                                : `Caminho plano: inclinação máxima de cerca de ${Math.max(1, Math.round(rota.inclinacaoMax))}%.`}
                            </span>
                          </div>
                        )}
                        {rota.estacoes?.length > 0 && !simples && (
                          <div>
                            <div
                              style={{
                                ...styles.label,
                                marginBottom: 6,
                              }}
                            >
                              Estações acessíveis próximas
                            </div>
                            {rota.estacoes.map(e => (
                              <div key={`${e.linha.id}-${e.nome}`} style={styles.estacao}>
                                <span
                                  style={{
                                    ...styles.bolinha,
                                    background: e.linha.cor,
                                  }}
                                />
                                <span
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {e.nome} <span style={styles.cinza}>· {e.linha.nome}</span>
                                </span>
                                <span style={styles.cinza}>
                                  {formatarDistancia(e.metros)}{' '}
                                  {e.onde === 'origem' ? 'de você' : 'do destino'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {rota.modo === 'metro' && (
                      <>
                        <PlanoMetro plano={rota.metro} />
                        {!rota.metro.caminharDireto && rota.metro.origemEstacao && (
                          <Botao
                            icone={Navigation}
                            grande
                            cheio
                            onClick={() => irAteEstacao(rota.metro.origemEstacao)}
                          >
                            Ir a pé até a estação {rota.metro.origemEstacao.nome}
                          </Botao>
                        )}
                      </>
                    )}

                    {rota.instrucoes?.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setVerPassos(v => !v)}
                          style={{
                            ...styles.botaoLinha,
                            minHeight: 44,
                          }}
                          aria-expanded={verPassos}
                        >
                          <ListOrdered size={18} aria-hidden="true" />{' '}
                          {verPassos ? 'Ocultar passos' : `Ver passos (${rota.instrucoes.length})`}
                          <ChevronDown
                            size={16}
                            aria-hidden="true"
                            style={{
                              transition: 'transform .3s var(--ease-out)',
                              transform: verPassos ? 'rotate(180deg)' : 'none',
                            }}
                          />
                        </button>
                        {verPassos && (
                          <ol style={styles.passos} className="stagger">
                            {rota.instrucoes.map((ins, i) => (
                              <li
                                key={i}
                                style={{
                                  ...styles.passo,
                                  fontSize: grande ? 17 : 15,
                                }}
                              >
                                <span style={styles.passoIcone}>
                                  <IconeManobra ins={ins} size={16} color="#000" aria-hidden="true" />
                                </span>
                                <span
                                  style={{
                                    flex: 1,
                                  }}
                                >
                                  {ins.texto}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </>
                    )}

                    <div style={styles.acoes}>
                      <Botao
                        variante="suave"
                        icone={Volume2}
                        onClick={ouvirResumo}
                        style={{
                          flex: 1,
                          minWidth: 140,
                        }}
                      >
                        Ouvir resumo
                      </Botao>
                      {linkGoogle && !simples && (
                        <a
                          href={linkGoogle}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tap"
                          style={{
                            ...styles.link,
                            minHeight: 48,
                          }}
                        >
                          <ExternalLink size={17} aria-hidden="true" />{' '}
                          {modo === 'onibus' || modo === 'metro' ? 'Ônibus e trens' : 'Google Maps'}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p style={styles.creditos}>{estilo.atribuicao}. Rotas: OSRM e Valhalla.</p>
            </section>
          </>
        )}
      </div>

      {navegando && camera && (
        <MapaGuia
          estado={estadoNav}
          rota={rota}
          destino={destino}
          modo={rota?.modo}
          necessidade={necessidades}
          simples={simples}
          mudo={mudo}
          onFechar={() => setCamera(false)}
        />
      )}
    </Tela>
  )
}
function BotaoRedondo({ icone: Icone, label, texto, onClick, lado, ativo, disabled, cor = 'lavanda' }) {
  if (texto)
    return (
      <span style={styles.redondoComTexto}>
        <BotaoRedondo
          icone={Icone}
          label={label}
          onClick={onClick}
          lado={lado}
          ativo={ativo}
          disabled={disabled}
          cor={cor}
        />
        <span style={styles.redondoTexto} aria-hidden="true">
          {texto}
        </span>
      </span>
    )
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      aria-label={label}
      title={label}
      aria-pressed={ativo}
      disabled={disabled}
      style={{
        ...styles.redondo,
        width: lado,
        height: lado,
        boxShadow: 'var(--sombra)',
        background: ativo ? `var(--${cor})` : 'var(--surface)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icone size={lado > 50 ? 24 : 20} color="#000" aria-hidden="true" />
    </button>
  )
}
function Resumo({ rota, simples }) {
  return (
    <div style={styles.resumo} aria-live="polite">
      <div
        key={rota.duracao}
        className="valor-muda"
        style={{
          ...styles.tempo,
          fontSize: simples ? 44 : 40,
        }}
      >
        {formatarDuracao(rota.duracao)}
      </div>
      <div style={styles.resumoInfo}>
        <span>{formatarDistancia(rota.distancia)}</span>
        <span style={styles.ponto} />
        <span>chegada às {horarioChegada(rota.duracao)}</span>
      </div>
    </div>
  )
}
function PlanoMetro({ plano }) {
  if (plano.caminharDireto) {
    return (
      <div style={styles.aviso}>
        <Footprints
          size={16}
          style={{
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <span>O destino está perto. Caminhar é mais rápido do que pegar o metrô.</span>
      </div>
    )
  }
  return (
    <ol style={styles.timeline} className="stagger" aria-label="Itinerário de metrô">
      {plano.segmentos.map((s, i) => {
        const Icone = s.tipo === 'trem' ? TrainFront : s.tipo === 'baldeacao' ? ArrowLeftRight : Footprints
        return (
          <li key={i} style={styles.etapa}>
            <span
              style={{
                ...styles.etapaIcone,
                background: s.tipo === 'trem' ? s.linha.cor : 'var(--surface-2)',
              }}
            >
              <Icone size={16} color={s.tipo === 'trem' ? '#fff' : '#000'} aria-hidden="true" />
            </span>
            <div
              style={{
                flex: 1,
              }}
            >
              {s.tipo === 'trem' && <div style={styles.linhaTag}>{s.linha.nome}</div>}
              <div style={styles.etapaTexto}>{s.texto}</div>
              {s.tipo === 'pe' && <div style={styles.cinza}>{formatarDistancia(s.metros)} a pé</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
const styles = {
  area: {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    isolation: 'isolate',
    zIndex: 0,
  },
  mapaWrap: {
    position: 'absolute',
    inset: 0,
  },
  mapa: {
    height: '100%',
    width: '100%',
  },
  topo: {
    position: 'absolute',
    top: 'max(12px, env(safe-area-inset-top))',
    left: 12,
    right: 12,
    zIndex: 1100,
  },
  busca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 6px 4px 18px',
    background: 'var(--surface)',
    border: '2px solid transparent',
    borderRadius: 'var(--r-btn)',
    boxShadow: 'var(--sombra)',
    transition: 'border-color .25s ease',
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: 'none',
    border: 'none',
    outline: 'none',
    padding: '8px 0',
    color: 'var(--text)',
  },
  redondo: {
    borderRadius: '50%',
    flexShrink: 0,
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background .25s ease',
  },
  resultados: {
    marginTop: 8,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    padding: 8,
    maxHeight: 360,
    overflowY: 'auto',
  },
  resultado: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 10px',
    borderRadius: 'var(--r-nav)',
  },
  resIcone: {
    width: 38,
    height: 38,
    borderRadius: 14,
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resNome: {
    display: 'block',
    fontWeight: 600,
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resDetalhe: {
    display: 'block',
    fontSize: 13,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  resDist: {
    fontSize: 13,
    color: 'var(--text-3)',
    flexShrink: 0,
  },
  erroBusca: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '12px 10px',
    fontSize: 15,
    color: 'var(--text-2)',
  },
  controles: {
    position: 'absolute',
    right: 12,
    zIndex: 1050,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  meusLugares: {
    marginTop: 14,
  },
  menuCamadas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingBottom: 8,
  },
  redondoComTexto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  redondoTexto: {
    fontSize: 11,
    fontWeight: 800,
    color: '#000',
    background: 'var(--surface)',
    borderRadius: 8,
    padding: '1px 6px',
    boxShadow: 'var(--sombra)',
  },
  menuTitulo: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-2)',
    padding: '4px 8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: 44,
    padding: '0 12px',
    borderRadius: 'var(--r-nav)',
    fontSize: 16,
    fontWeight: 600,
    color: '#000',
    textAlign: 'left',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1080,
    maxHeight: '62%',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    borderRadius: 'var(--r-card) var(--r-card) 0 0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    paddingTop: 14,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '2px 16px 12px',
    flexShrink: 0,
  },
  conteudo: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '2px 18px 12px',
    overflowY: 'auto',
    minHeight: 0,
  },
  vazio: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '4px 2px',
  },
  vazioTitulo: {
    fontWeight: 800,
    lineHeight: 1.05,
    color: 'var(--text)',
  },
  vazioTexto: {
    color: 'var(--text-2)',
    lineHeight: 1.45,
  },
  aviso: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 14,
    lineHeight: 1.45,
    color: '#000',
    background: 'var(--surface-2)',
    borderRadius: 'var(--r-nav)',
    padding: '10px 12px',
  },
  destino: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: 'var(--surface-2)',
    borderRadius: 'var(--r-card-m)',
  },
  destinoIcone: {
    width: 42,
    height: 42,
    borderRadius: 15,
    background: 'var(--lima)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-2)',
  },
  destinoNome: {
    fontWeight: 700,
    marginTop: 2,
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rotaComum: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    padding: '10px 10px 10px 14px',
    borderRadius: 'var(--r-card-m)',
    color: '#000',
    transition: 'background 0.3s',
  },
  rotaComumTexto: {
    flex: '1 1 150px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  rotaComumBotao: {
    flex: '0 0 auto',
    padding: '0 18px',
    borderRadius: 'var(--r-btn)',
    background: '#000',
    color: '#fff',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinoDetalhe: {
    fontSize: 13,
    color: 'var(--text-2)',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  carregandoWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  carregando: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 4px',
    fontSize: 16,
    color: 'var(--text-2)',
  },
  erro: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
    padding: 16,
    color: '#000',
    background: 'var(--lavanda)',
    borderRadius: 'var(--r-card-m)',
  },
  erroTitulo: {
    fontSize: 17,
    fontWeight: 700,
  },
  erroTexto: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 3,
    lineHeight: 1.4,
  },
  rota: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  resumo: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 14,
    flexWrap: 'wrap',
  },
  tempo: {
    fontWeight: 800,
    lineHeight: 1,
    color: 'var(--sucesso)',
    transformOrigin: 'left bottom',
  },
  resumoInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    color: 'var(--text-2)',
    flexWrap: 'wrap',
  },
  ponto: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--text-3)',
  },
  estacao: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 15,
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  bolinha: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
    border: '2px solid #000',
  },
  cinza: {
    color: 'var(--text-2)',
    fontSize: 13,
  },
  timeline: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 0,
    margin: 0,
  },
  etapa: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  etapaIcone: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaTag: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
  },
  etapaTexto: {
    fontSize: 15,
    lineHeight: 1.4,
    marginTop: 1,
    color: 'var(--text)',
  },
  acoes: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  botaoLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#000',
    fontSize: 15,
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  passos: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 0,
    margin: 0,
  },
  passo: {
    display: 'flex',
    gap: 10,
    lineHeight: 1.4,
    color: 'var(--text)',
    alignItems: 'flex-start',
  },
  passoIcone: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    flex: 1,
    minWidth: 140,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: '#000',
    borderRadius: 'var(--r-btn)',
    fontSize: 16,
    fontWeight: 600,
    padding: '0 18px',
    textDecoration: 'none',
  },
  creditos: {
    fontSize: 11,
    color: 'var(--text-3)',
    textAlign: 'center',
    padding: '0 16px 8px',
    flexShrink: 0,
  },
}
