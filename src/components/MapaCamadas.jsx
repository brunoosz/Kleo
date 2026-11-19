import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { verificarGoogle, urlTilesGoogle } from '../lib/googleMapas'
import { carregarEstiloMaps } from '../lib/estiloMaps'
import {
  Marker,
  TileLayer,
  Polyline,
  CircleMarker,
  Circle,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
const iconeUsuario = L.divIcon({
  className: 'kleo-mapa-icone',
  html: '<div class="kleo-mapa-usuario"><span></span></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})
const iconeDestino = L.divIcon({
  className: 'kleo-mapa-icone',
  html: '<div class="kleo-mapa-destino"><span></span></div>',
  iconSize: [36, 46],
  iconAnchor: [18, 44],
})
const iconeManobra = L.divIcon({
  className: 'kleo-mapa-icone',
  html: '<div class="kleo-mapa-manobra"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})
function iconeSeta(graus) {
  return L.divIcon({
    className: 'kleo-mapa-icone',
    html: `<div class="kleo-mapa-seta"><div class="kleo-mapa-seta-giro" style="transform: rotate(${graus}deg)">
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" fill="#ffffff"/>
        <circle cx="24" cy="24" r="17" fill="#000000"/>
        <path d="M24 11 L33 33 L24 28 L15 33 Z" fill="#d2e534" stroke="#d2e534" stroke-width="1.5" stroke-linejoin="round"/>
      </svg></div></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}
export function MapaEstilos() {
  return <style>{css}</style>
}
export function MapaAjuste({ onToque }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null
    ro?.observe(map.getContainer())
    return () => {
      clearTimeout(t)
      ro?.disconnect()
    }
  }, [map])
  useMapEvents({
    click: e =>
      onToque?.({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      }),
  })
  return null
}
export function SeguirMapa({ pos, ativo, zoom = 17, deslocamento = 0.2, onSoltar }) {
  const map = useMap()
  const iniciado = useRef(false)
  const soltar = useRef(onSoltar)
  useEffect(() => {
    soltar.current = onSoltar
  })
  useMapEvents({
    dragstart: () => soltar.current?.(),
  })
  const lat = pos?.lat
  const lng = pos?.lng
  useEffect(() => {
    if (!ativo) {
      iniciado.current = false
      return
    }
    if (lat == null || lng == null) return
    const z = iniciado.current ? map.getZoom() : zoom
    const alturaDesloc = map.getSize().y * deslocamento
    const centro = map.unproject(map.project([lat, lng], z).subtract(L.point(0, alturaDesloc)), z)
    if (!iniciado.current || Math.abs(map.getZoom() - z) > 0.01) {
      map.setView(centro, z, {
        animate: true,
        duration: 0.6,
      })
      iniciado.current = true
    } else {
      map.panTo(centro, {
        animate: true,
        duration: 0.4,
        easeLinearity: 1,
        noMoveStart: true,
      })
    }
  }, [map, lat, lng, ativo, zoom, deslocamento])
  return null
}
export function MarcadorUsuario({ posicao }) {
  return (
    <>
      {posicao.precisao > 25 && posicao.precisao < 1500 && (
        <Circle
          center={[posicao.lat, posicao.lng]}
          radius={posicao.precisao}
          pathOptions={{
            color: '#b7b2ff',
            weight: 1,
            opacity: 0.8,
            fillColor: '#b7b2ff',
            fillOpacity: 0.18,
          }}
          interactive={false}
        />
      )}
      <Marker
        position={[posicao.lat, posicao.lng]}
        icon={iconeUsuario}
        keyboard={false}
        interactive={false}
        zIndexOffset={1000}
      />
    </>
  )
}
const ICONE_SETA = iconeSeta(0)
export function MarcadorNavegacao({ pos, rumo }) {
  const ref = useRef(null)
  const graus = Math.round(rumo || 0)
  useEffect(() => {
    const el = ref.current?.getElement?.()?.querySelector('.kleo-mapa-seta-giro')
    if (el) el.style.transform = `rotate(${graus}deg)`
  }, [graus, pos.lat, pos.lng])
  return (
    <Marker
      ref={ref}
      position={[pos.lat, pos.lng]}
      icon={ICONE_SETA}
      keyboard={false}
      interactive={false}
      zIndexOffset={1200}
    />
  )
}
export function MarcadorDestino({ destino }) {
  return (
    <Marker position={[destino.lat, destino.lng]} icon={iconeDestino} zIndexOffset={900}>
      <Tooltip direction="top" offset={[0, -42]}>
        {destino.nome}
      </Tooltip>
    </Marker>
  )
}
export function MarcadorManobra({ local }) {
  return (
    <Marker position={[local.lat, local.lng]} icon={iconeManobra} interactive={false} zIndexOffset={800} />
  )
}
export function RotaLinha({
  coords,
  cor = '#000',
  halo = '#b7b2ff',
  tracejada = false,
  peso = 6,
  apagada = false,
}) {
  if (!coords?.length) return null
  return (
    <>
      <Polyline
        positions={coords}
        pathOptions={{
          color: apagada ? '#ffffff' : halo,
          weight: peso + 8,
          opacity: apagada ? 0.9 : 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }}
        interactive={false}
      />
      <Polyline
        positions={coords}
        pathOptions={{
          color: apagada ? '#a9a7b0' : cor,
          weight: tracejada ? peso + 1 : peso,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: tracejada ? `0.1 ${peso * 2}` : null,
        }}
        interactive={false}
      />
    </>
  )
}
export function CamadaMetro({ sistema, esmaecida = false }) {
  if (!sistema) return null
  const opacidade = esmaecida ? 0.35 : 0.9
  const tracejada = l => l.tipo === 'cptm' || l.tipo === 'trem'
  return (
    <>
      {sistema.linhas.map(linha => (
        <Polyline
          key={linha.id}
          positions={linha.estacoes.map(e => [e.lat, e.lng])}
          pathOptions={{
            color: linha.cor,
            weight: tracejada(linha) ? 4 : 5,
            opacity: opacidade,
            dashArray: tracejada(linha) ? '8 6' : null,
          }}
        >
          <Tooltip sticky>{linha.nome}</Tooltip>
        </Polyline>
      ))}
      {sistema.linhas.flatMap(linha =>
        linha.estacoes.map(e => (
          <CircleMarker
            key={`${linha.id}-${e.nome}`}
            center={[e.lat, e.lng]}
            radius={5}
            pathOptions={{
              color: linha.cor,
              weight: 2.5,
              fillColor: '#ffffff',
              fillOpacity: 1,
              opacity: esmaecida ? 0.6 : 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{e.nome}</strong>
              <br />
              {linha.nome}
              {e.acessivel ? ' · Acessível' : ''}
            </Tooltip>
          </CircleMarker>
        )),
      )}
    </>
  )
}
export function EstacoesAcessiveis({ estacoes }) {
  return estacoes.map(e => (
    <CircleMarker
      key={`ac-${e.linha.id}-${e.nome}`}
      center={[e.lat, e.lng]}
      radius={10}
      pathOptions={{
        color: '#000',
        weight: 3,
        fillColor: e.linha.cor,
        fillOpacity: 0.95,
      }}
    >
      <Tooltip direction="top" offset={[0, -10]}>
        <strong>{e.nome}</strong>
        <br />
        {e.linha.nome} · Estação acessível
      </Tooltip>
    </CircleMarker>
  ))
}
const css = `
.kleo-mapa-icone { background: none; border: none; }
.kleo-mapa-usuario { position: relative; width: 30px; height: 30px; }
.kleo-mapa-usuario span {
  position: absolute; inset: 6px; border-radius: 50%;
  background: #000; border: 3px solid #fff; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.kleo-mapa-usuario::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: rgba(183, 178, 255, 0.7); animation: kleoMapaPulso 1.8s ease-out infinite;
}
@keyframes kleoMapaPulso { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(2.4); opacity: 0; } }
.kleo-mapa-seta { width: 48px; height: 48px; filter: drop-shadow(0 4px 10px rgba(120,100,200,0.35)); }
.kleo-mapa-seta-giro { width: 48px; height: 48px; transition: transform .35s ease-out; }
.kleo-mapa-destino {
  width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  background: #000; border: 3px solid #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.kleo-mapa-destino span { width: 12px; height: 12px; border-radius: 50%; background: #d2e534; }
.kleo-mapa-manobra { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 5px solid #000; }
.leaflet-tooltip {
  background: #fff; color: #000; border: none; border-radius: 15px;
  box-shadow: rgba(198,185,237,0.5) 3px 3px 14px 0px; font-size: 13px; padding: 6px 10px; font-family: inherit;
}
.leaflet-tooltip-top::before { border-top-color: #fff; }
.leaflet-tooltip-bottom::before { border-bottom-color: #fff; }
.leaflet-tooltip-left::before { border-left-color: #fff; }
.leaflet-tooltip-right::before { border-right-color: #fff; }
.kleo-tiles { filter: saturate(0.75) brightness(1.03); }
@media (prefers-reduced-motion: reduce) {
  .kleo-mapa-usuario::after { animation: none; }
  .kleo-mapa-seta-giro { transition: none; }
}
`
export function CamadaBase({ estilo }) {
  const [falhou, setFalhou] = useState(null)
  if (estilo.tipo === 'google' && falhou !== estilo.id)
    return <CamadaGoogle key={estilo.id} tipo={estilo.mapType} onFalha={() => setFalhou(estilo.id)} />
  const usarVetor = estilo.tipo === 'vetor' && falhou !== estilo.id && webglDisponivel()
  if (usarVetor)
    return (
      <CamadaVetorial
        key={estilo.id}
        url={estilo.url}
        recolorir={!!estilo.recolorir}
        onFalha={() => setFalhou(estilo.id)}
      />
    )
  const base = estilo.tipo === 'vetor' ? ESTILO_RESERVA : estilo
  return (
    <>
      <TileLayer
        key={base.url}
        url={base.url}
        subdomains={base.subdominios || 'abc'}
        maxZoom={20}
        maxNativeZoom={base.maxZoom}
        className="kleo-tiles"
      />
      {base.rotulos && (
        <TileLayer key={base.rotulos} url={base.rotulos} maxZoom={20} maxNativeZoom={base.maxZoom} />
      )}
    </>
  )
}
function CamadaGoogle({ tipo, onFalha }) {
  const [pronto, setPronto] = useState(false)
  const falhaRef = useRef(onFalha)
  const erros = useRef(0)
  useEffect(() => {
    falhaRef.current = onFalha
  })
  useEffect(() => {
    let vivo = true
    verificarGoogle().then(ok => {
      if (!vivo) return
      if (ok) setPronto(true)
      else falhaRef.current?.()
    })
    return () => {
      vivo = false
    }
  }, [tipo])
  if (!pronto)
    return <TileLayer url={ESTILO_RESERVA.url} maxZoom={20} maxNativeZoom={19} className="kleo-tiles" />
  const eventos = {
    tileload: () => {
      erros.current = 0
    },
    tileerror: () => {
      erros.current += 1
      if (erros.current >= 6) falhaRef.current?.()
    },
  }
  return (
    <TileLayer
      key={tipo}
      url={urlTilesGoogle(tipo)}
      maxZoom={22}
      maxNativeZoom={22}
      eventHandlers={eventos}
    />
  )
}
const ESTILO_RESERVA = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
}
function webglDisponivel() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
function CamadaVetorial({ url, recolorir = false, onFalha }) {
  const map = useMap()
  const falhaRef = useRef(onFalha)
  useEffect(() => {
    falhaRef.current = onFalha
  })
  useEffect(() => {
    let camada = null
    let vivo = true
    Promise.all([
      import('maplibre-gl'),
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl/dist/maplibre-gl.css'),
      recolorir ? carregarEstiloMaps(url).catch(() => url) : Promise.resolve(url),
    ])
      .then(([, plugin, , estiloFinal]) => {
        if (!vivo) return
        const criar = plugin.maplibreGL || plugin.default || L.maplibreGL
        camada = criar({
          style: estiloFinal,
          attributionControl: false,
          interactive: false,
        })
        camada.addTo(map)
        const gl = camada.getMaplibreMap?.()
        gl?.on('error', e => {
          if (
            vivo &&
            e?.error &&
            /style|Failed to fetch|NetworkError/i.test(String(e.error.message || e.error))
          )
            falhaRef.current?.()
        })
        const el = camada.getContainer?.()
        if (el) el.style.zIndex = '1'
      })
      .catch(() => {
        if (vivo) falhaRef.current?.()
      })
    return () => {
      vivo = false
      if (camada) map.removeLayer(camada)
    }
  }, [map, url, recolorir])
  return null
}
