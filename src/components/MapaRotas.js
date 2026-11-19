import { todasEstacoes } from '../data/metros'
import { temGoogle } from '../lib/googleMapas'
export const ESTILOS_MAPA = [
  {
    id: 'google',
    nome: 'Google',
    tipo: 'google',
    mapType: 'roadmap',
    atribuicao: 'Dados do mapa © Google',
    maxZoom: 22,
    precisaGoogle: true,
  },
  {
    id: 'google-sat',
    nome: 'Google Satélite',
    tipo: 'google',
    mapType: 'satellite',
    atribuicao: 'Imagens e dados © Google',
    maxZoom: 21,
    precisaGoogle: true,
  },
  {
    id: 'maps',
    nome: 'Estilo Maps',
    tipo: 'vetor',
    recolorir: true,
    url: 'https://tiles.openfreemap.org/styles/liberty',
    atribuicao: '© OpenStreetMap, OpenFreeMap',
    maxZoom: 20,
  },
  {
    id: 'moderno',
    nome: 'Moderno',
    tipo: 'vetor',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    atribuicao: '© OpenStreetMap, OpenFreeMap',
    maxZoom: 20,
  },
  {
    id: 'claro',
    nome: 'Claro',
    tipo: 'vetor',
    url: 'https://tiles.openfreemap.org/styles/positron',
    atribuicao: '© OpenStreetMap, OpenFreeMap',
    maxZoom: 20,
  },
  {
    id: 'satelite',
    nome: 'Satélite',
    tipo: 'raster',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdominios: '',
    rotulos:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    atribuicao: 'Imagens © Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  {
    id: 'padrao',
    nome: 'Clássico',
    tipo: 'raster',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdominios: '',
    atribuicao: '© OpenStreetMap',
    maxZoom: 19,
  },
  {
    id: 'transporte',
    nome: 'Transporte',
    tipo: 'raster',
    url: 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
    subdominios: '',
    atribuicao: '© OpenStreetMap, ÖPNVKarte (memomaps.de)',
    maxZoom: 18,
  },
]
export function estilosDisponiveis() {
  return ESTILOS_MAPA.filter(e => !e.precisaGoogle || temGoogle())
}
export function estiloMapa(id) {
  const lista = estilosDisponiveis()
  return lista.find(e => e.id === id) || lista.find(e => e.id === 'maps')
}
export const TILE_URL = estiloMapa('padrao').url
export const TILE_ATRIBUICAO = estiloMapa('padrao').atribuicao
export function distanciaM(a, b) {
  const R = 6371000
  const rad = x => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export function formatarDistancia(m) {
  if (m < 100) return `${Math.max(5, Math.round(m / 5) * 5)} m`
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`
}
export function distanciaFalada(m) {
  if (m < 100) return `${Math.max(10, Math.round(m / 10) * 10)} metros`
  if (m < 1000) return `${Math.round(m / 50) * 50} metros`
  const km = (m / 1000).toFixed(1).replace('.', ',').replace(',0', '')
  return `${km} ${km === '1' ? 'quilômetro' : 'quilômetros'}`
}
export function formatarDuracao(seg) {
  const min = Math.max(1, Math.round(seg / 60))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r ? `${h} h ${r} min` : `${h} h`
}
export function duracaoFalada(seg) {
  const min = Math.max(1, Math.round(seg / 60))
  if (min < 60) return `${min} ${min === 1 ? 'minuto' : 'minutos'}`
  const h = Math.floor(min / 60)
  const r = min % 60
  return `${h} ${h === 1 ? 'hora' : 'horas'}${r ? ` e ${r} minutos` : ''}`
}
export function horarioChegada(seg) {
  const d = new Date(Date.now() + seg * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export class ErroMapa extends Error {
  constructor(tipo, mensagem) {
    super(mensagem)
    this.tipo = tipo
  }
}
function semInternet() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}
async function buscarJSON(url, signal) {
  if (semInternet()) throw new ErroMapa('offline', 'Você está sem internet. Conecte-se para traçar rotas.')
  let r
  try {
    r = await fetch(url, {
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ErroMapa(
      'rede',
      'Não consegui falar com o serviço de mapas. Verifique sua internet e tente de novo.',
    )
  }
  if (!r.ok)
    throw new ErroMapa('servico', 'O serviço de mapas está ocupado agora. Tente novamente em instantes.')
  return r.json()
}
export function normalizar(t) {
  return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
export async function geocodificar(texto, perto, signal, { centro = null, cidade = '' } = {}) {
  const ref = perto || centro
  const consulta = async q => {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=br&limit=6&accept-language=pt-BR`
    if (ref) {
      const d = 0.4
      url += `&viewbox=${ref.lng - d},${ref.lat + d},${ref.lng + d},${ref.lat - d}`
    }
    return buscarJSON(url, signal)
  }
  let dados = []
  const cidadeNorm = normalizar(cidade)
  if (cidadeNorm && !normalizar(texto).includes(cidadeNorm)) dados = await consulta(`${texto}, ${cidade}`)
  if (!dados.length) dados = await consulta(texto)
  return dados.map(r => {
    const partes = r.display_name.split(',').map(s => s.trim())
    const p = {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }
    return {
      id: r.place_id,
      nome: partes[0],
      detalhe: partes.slice(1, 4).join(', '),
      ...p,
      metros: perto ? distanciaM(perto, p) : null,
    }
  })
}
export async function nomeDoPonto(p, signal) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lng}&zoom=18&accept-language=pt-BR`
    const r = await buscarJSON(url, signal)
    const a = r.address || {}
    const rua = a.road || a.pedestrian || a.footway || a.neighbourhood
    if (rua) return a.house_number ? `${rua}, ${a.house_number}` : rua
    return r.display_name?.split(',')[0] || 'Ponto no mapa'
  } catch {
    return 'Ponto no mapa'
  }
}
const OSRM_CARRO = 'https://router.project-osrm.org/route/v1/driving'
const OSRM_PE = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving'
const OSRM_PE_ALT = 'https://router.project-osrm.org/route/v1/foot'
async function osrm(base, a, b, signal) {
  const url = `${base}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true`
  const dados = await buscarJSON(url, signal)
  if (dados.code !== 'Ok' || !dados.routes?.length) {
    throw new ErroMapa('sem-rota', 'Não encontrei um caminho até esse destino. Tente um ponto próximo.')
  }
  const rota = dados.routes[0]
  const passos = rota.legs.flatMap(l => l.steps)
  return {
    coords: rota.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distancia: rota.distance,
    duracao: rota.duration,
    passos,
  }
}
export function rotaCarro(a, b, signal) {
  return osrm(OSRM_CARRO, a, b, signal)
}
export async function rotaAPe(a, b, signal, { cadeirante = false } = {}) {
  if (cadeirante) return rotaAcessivel(a, b, signal)
  const velocidade = cadeirante ? 0.95 : 1.25
  try {
    const r = await osrm(OSRM_PE, a, b, signal)
    return cadeirante
      ? {
          ...r,
          duracao: r.distancia / velocidade,
        }
      : r
  } catch (e) {
    if (e.name === 'AbortError' || e.tipo === 'offline') throw e
    const r = await osrm(OSRM_PE_ALT, a, b, signal)
    return {
      ...r,
      duracao: r.distancia / velocidade,
    }
  }
}
const VALHALLA = 'https://valhalla1.openstreetmap.de'
function decodificar6(str) {
  const pts = []
  let i = 0,
    lat = 0,
    lng = 0
  while (i < str.length) {
    for (const eixo of [0, 1]) {
      let b,
        shift = 0,
        res = 0
      do {
        b = str.charCodeAt(i++) - 63
        res |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const d = res & 1 ? ~(res >> 1) : res >> 1
      if (eixo === 0) lat += d
      else lng += d
    }
    pts.push([lat / 1e6, lng / 1e6])
  }
  return pts
}
const TIPO_VALHALLA = {
  1: ['depart'],
  2: ['depart', 'right'],
  3: ['depart', 'left'],
  4: ['arrive'],
  5: ['arrive', 'right'],
  6: ['arrive', 'left'],
  7: ['new name', 'straight'],
  8: ['continue', 'straight'],
  22: ['continue', 'straight'],
  9: ['turn', 'slight right'],
  10: ['turn', 'right'],
  11: ['turn', 'sharp right'],
  12: ['turn', 'uturn'],
  13: ['turn', 'uturn'],
  14: ['turn', 'sharp left'],
  15: ['turn', 'left'],
  16: ['turn', 'slight left'],
  23: ['fork', 'slight right'],
  24: ['fork', 'slight left'],
  25: ['merge', 'straight'],
  26: ['roundabout', 'right'],
  27: ['exit roundabout', 'right'],
}
function passosValhalla(manobras, coords) {
  return manobras.map(m => {
    const [type, modifier] = TIPO_VALHALLA[m.type] || ['continue', 'straight']
    const c = coords[Math.min(m.begin_shape_index || 0, coords.length - 1)]
    return {
      maneuver: {
        type,
        modifier,
        exit: m.roundabout_exit_count,
        location: [c[1], c[0]],
      },
      name: (m.street_names || [])[0] || '',
      distance: (m.length || 0) * 1000,
      elevador: m.type === 39,
    }
  })
}
async function relevo(shape, signal) {
  try {
    const r = await fetch(`${VALHALLA}/height`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encoded_polyline: shape,
        shape_format: 'polyline6',
        range: true,
        resample_distance: 30,
      }),
    })
    if (!r.ok) return null
    const bruto = ((await r.json()).range_height || []).filter(x => x[1] != null)
    if (bruto.length < 4) return []
    const h = bruto.map((p, i) => {
      const viz = bruto.slice(Math.max(0, i - 2), i + 3)
      return [p[0], viz.reduce((t, v) => t + v[1], 0) / viz.length]
    })
    const janelas = []
    for (let i = 0, j = 0; i < h.length; i++) {
      while (j < h.length && h[j][0] - h[i][0] < 90) j++
      if (j >= h.length) break
      const dz = h[j][1] - h[i][1]
      janelas.push({
        noCaminho: h[i][0],
        fim: h[j][0],
        grau: (Math.abs(dz) / (h[j][0] - h[i][0])) * 100,
        sobe: dz > 0,
      })
    }
    const trechos = []
    for (const w of janelas) {
      const ult = trechos[trechos.length - 1]
      if (w.grau >= 8 && ult && ult.grau >= 8 && w.noCaminho <= ult.fim) {
        ult.fim = w.fim
        ult.grau = Math.max(ult.grau, w.grau)
        ult.sobe = ult.sobe || w.sobe
      } else
        trechos.push({
          ...w,
        })
    }
    return trechos
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    return null
  }
}
async function valhallaCadeirante(a, b, signal) {
  const q = {
    locations: [
      {
        lat: a.lat,
        lon: a.lng,
      },
      {
        lat: b.lat,
        lon: b.lng,
      },
    ],
    costing: 'pedestrian',
    costing_options: {
      pedestrian: {
        type: 'wheelchair',
        step_penalty: 3600,
        max_grade: 6,
        walkway_factor: 0.8,
        sidewalk_factor: 0.8,
        alley_factor: 3,
        driveway_factor: 3,
      },
    },
    alternates: 2,
    language: 'pt-BR',
    units: 'kilometers',
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    throw new ErroMapa('offline', 'Sem internet para calcular a rota.')
  const r = await fetch(`${VALHALLA}/route?json=${encodeURIComponent(JSON.stringify(q))}`, {
    signal,
  })
  if (!r.ok) throw new ErroMapa('sem-rota', 'Não encontrei um caminho acessível até esse destino.')
  const j = await r.json()
  return [j.trip, ...(j.alternates || []).map(x => x.trip)].filter(Boolean)
}
export async function rotaAcessivel(a, b, signal) {
  let viagens
  try {
    viagens = await valhallaCadeirante(a, b, signal)
  } catch (e) {
    if (e.name === 'AbortError' || e.tipo === 'offline') throw e
    viagens = []
  }
  if (!viagens.length) {
    const r = await rotaAPe(a, b, signal)
    return {
      ...r,
      duracao: r.distancia / 0.95,
      semGarantia: true,
      subidas: [],
      inclinacaoMax: null,
    }
  }
  const opcoes = await Promise.all(
    viagens.map(async t => {
      const leg = t.legs[0]
      const coords = decodificar6(leg.shape)
      const trechos = await relevo(leg.shape, signal)
      const ingremes = (trechos || []).filter(x => x.grau >= 8)
      const max = trechos?.length ? Math.max(...trechos.map(x => x.grau)) : null
      const pena = ingremes.reduce((s, x) => s + (x.grau >= 12 ? 300 : 120) * (x.sobe ? 1.5 : 1), 0)
      return {
        coords,
        distancia: t.summary.length * 1000,
        duracao: t.summary.time,
        passos: passosValhalla(leg.maneuvers, coords),
        inclinacaoMax: max,
        subidas: ingremes,
        nota: t.summary.time + pena,
        elevadores: leg.maneuvers.filter(m => m.type === 39).length,
      }
    }),
  )
  opcoes.sort((x, y) => x.nota - y.nota)
  const melhor = opcoes[0]
  return {
    ...melhor,
    alternativas: opcoes.length,
    trocouPorRelevo: opcoes.length > 1 && melhor !== opcoes.slice().sort((x, y) => x.duracao - y.duracao)[0],
  }
}
const RAD = Math.PI / 180
const pt = c => ({
  lat: c[0],
  lng: c[1],
})
function paraXY(p, ref) {
  return {
    x: (p.lng - ref.lng) * Math.cos(ref.lat * RAD) * 111320,
    y: (p.lat - ref.lat) * 110540,
  }
}
export function rumo(a, b) {
  const y = Math.sin((b.lng - a.lng) * RAD) * Math.cos(b.lat * RAD)
  const x =
    Math.cos(a.lat * RAD) * Math.sin(b.lat * RAD) -
    Math.sin(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((b.lng - a.lng) * RAD)
  return (Math.atan2(y, x) / RAD + 360) % 360
}
export function difAngulo(a, b) {
  return ((a - b + 540) % 360) - 180
}
export function acumulado(coords) {
  const acc = [0]
  for (let i = 1; i < coords.length; i++) acc.push(acc[i - 1] + distanciaM(pt(coords[i - 1]), pt(coords[i])))
  return acc
}
function rumoTrecho(coords, i) {
  const a = pt(coords[i])
  for (let j = i + 1; j < coords.length; j++) {
    const b = pt(coords[j])
    if (distanciaM(a, b) > 0.5) return rumo(a, b)
  }
  return i > 0 ? rumo(pt(coords[i - 1]), a) : 0
}
export function projetarNaRota(coords, acum, p, de = -Infinity, ate = Infinity) {
  let melhor = null
  for (let i = 0; i < coords.length - 1; i++) {
    if (acum[i + 1] < de || acum[i] > ate) continue
    const A = paraXY(pt(coords[i]), p)
    const B = paraXY(pt(coords[i + 1]), p)
    const dx = B.x - A.x
    const dy = B.y - A.y
    const len2 = dx * dx + dy * dy
    const t = len2 ? Math.max(0, Math.min(1, -(A.x * dx + A.y * dy) / len2)) : 0
    const d = Math.hypot(A.x + t * dx, A.y + t * dy)
    if (!melhor || d < melhor.dist)
      melhor = {
        dist: d,
        i,
        t,
      }
  }
  if (!melhor) return null
  const { i, t } = melhor
  const a = pt(coords[i])
  const b = pt(coords[i + 1])
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    dist: melhor.dist,
    i,
    percorrido: acum[i] + (acum[i + 1] - acum[i]) * t,
    rumo: rumoTrecho(coords, i),
  }
}
export function pontoNaRota(coords, acum, d) {
  const total = acum[acum.length - 1]
  const alvo = Math.max(0, Math.min(d, total))
  let lo = 0
  let hi = acum.length - 1
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1
    if (acum[m] <= alvo) lo = m
    else hi = m
  }
  const a = pt(coords[lo])
  const b = pt(coords[Math.min(hi, coords.length - 1)])
  const seg = acum[hi] - acum[lo]
  const t = seg > 0 ? (alvo - acum[lo]) / seg : 0
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    rumo: rumoTrecho(coords, lo),
    i: lo,
  }
}
const LADO = {
  uturn: 'faça o retorno',
  'sharp right': 'faça a curva fechada à direita',
  right: 'vire à direita',
  'slight right': 'mantenha-se à direita',
  straight: 'siga em frente',
  'slight left': 'mantenha-se à esquerda',
  left: 'vire à esquerda',
  'sharp left': 'faça a curva fechada à esquerda',
}
const FEMININOS = [
  'rua',
  'r.',
  'avenida',
  'av.',
  'av',
  'alameda',
  'al.',
  'travessa',
  'praça',
  'estrada',
  'rodovia',
  'ladeira',
  'passarela',
  'marginal',
  'via',
  'ponte',
  'galeria',
  'vila',
  'passagem',
  'calçada',
  'viela',
  'rampa',
  'escadaria',
  'ciclovia',
]
const MASCULINOS = [
  'viaduto',
  'largo',
  'parque',
  'túnel',
  'caminho',
  'elevado',
  'acesso',
  'beco',
  'pátio',
  'calçadão',
  'complexo',
  'anel',
  'corredor',
  'boulevard',
]
export function preposicao(nome) {
  const p = nome.split(' ')[0].toLowerCase()
  if (FEMININOS.includes(p)) return `na ${nome}`
  if (MASCULINOS.includes(p)) return `no ${nome}`
  return `em ${nome}`
}
export function pela(nome) {
  const p = nome.split(' ')[0].toLowerCase()
  if (FEMININOS.includes(p)) return `pela ${nome}`
  if (MASCULINOS.includes(p)) return `pelo ${nome}`
  return `por ${nome}`
}
export function capitalizar(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
function ladoChegada(mod) {
  if (mod?.includes('right')) return 'direita'
  if (mod?.includes('left')) return 'esquerda'
  return null
}
const ROTATORIA = ['roundabout', 'rotary', 'roundabout turn']
function acaoFrase(ins) {
  const { tipo, modificador, saida, rua } = ins
  const verbo = LADO[modificador] || 'siga em frente'
  if (tipo === 'depart') return rua ? `siga ${pela(rua)}` : 'siga em frente'
  if (tipo === 'arrive') {
    const lado = ladoChegada(modificador)
    return `você chegará ao destino${lado ? `, que fica à sua ${lado}` : ''}`
  }
  if (ROTATORIA.includes(tipo))
    return `na rotatória, pegue a ${saida || 1}ª saída${rua ? ` para ${rua}` : ''}`
  if (tipo === 'exit roundabout' || tipo === 'exit rotary')
    return `saia da rotatória${rua ? ` ${pela(rua)}` : ''}`
  if (tipo === 'fork')
    return `na bifurcação, mantenha-se à ${modificador?.includes('left') ? 'esquerda' : 'direita'}${rua ? ` ${pela(rua)}` : ''}`
  if (tipo === 'end of road') return `no fim da via, ${verbo}${rua ? ` ${preposicao(rua)}` : ''}`
  if (tipo === 'merge') return `entre ${rua ? preposicao(rua) : 'na via'}`
  if (tipo === 'on ramp') return `pegue o acesso${rua ? ` para ${rua}` : ''}`
  if (tipo === 'off ramp') return `pegue a saída${rua ? ` para ${rua}` : ''}`
  if (modificador === 'straight' || !modificador) return `siga em frente${rua ? ` ${pela(rua)}` : ''}`
  if (modificador === 'uturn') return `faça o retorno${rua ? ` ${preposicao(rua)}` : ''}`
  return `${verbo}${rua ? ` ${preposicao(rua)}` : ''}`
}
function acaoCurta(ins) {
  const { tipo, modificador, saida } = ins
  if (tipo === 'depart') return 'Siga em frente'
  if (tipo === 'arrive') return 'Chegada'
  if (ROTATORIA.includes(tipo)) return `Rotatória, ${saida || 1}ª saída`
  if (tipo === 'exit roundabout' || tipo === 'exit rotary') return 'Saia da rotatória'
  if (tipo === 'fork') return `Mantenha-se à ${modificador?.includes('left') ? 'esquerda' : 'direita'}`
  if (tipo === 'merge') return 'Entre na via'
  if (tipo === 'on ramp') return 'Pegue o acesso'
  if (tipo === 'off ramp') return 'Pegue a saída'
  return capitalizar(LADO[modificador] || 'siga em frente')
}
function agoraFrase(ins) {
  const { tipo, modificador, saida } = ins
  if (tipo === 'depart') return null
  if (tipo === 'arrive') {
    const lado = ladoChegada(modificador)
    return `Você chegou ao seu destino${lado ? `. Ele fica à sua ${lado}` : ''}`
  }
  if (ROTATORIA.includes(tipo)) return `Entre na rotatória e pegue a ${saida || 1}ª saída`
  if (!modificador || modificador === 'straight') return null
  return `${acaoCurta(ins)} agora`
}
function textoLista(ins) {
  const siga = ins.distancia >= 15 ? ` por ${formatarDistancia(ins.distancia)}` : ''
  if (ins.tipo === 'depart') return `${capitalizar(acaoFrase(ins))}${siga}`
  if (ins.tipo === 'arrive') return agoraFrase(ins)
  return `${capitalizar(acaoFrase(ins))}${siga ? ` e siga${siga}` : ''}`
}
const SEM_MANOBRA = new Set(['new name', 'continue', 'notification', 'use lane'])
export function instrucoesDaRota(passos, coords) {
  const acum = coords?.length > 1 ? acumulado(coords) : null
  const totalPassos = passos.reduce((s, p) => s + (p.distance || 0), 0)
  const total = acum ? acum[acum.length - 1] : totalPassos
  const lista = []
  let soma = 0
  passos.forEach((p, i) => {
    const m = p.maneuver || {}
    const noSoma = soma
    soma += p.distance || 0
    const rua = (p.name || p.ref || '').trim()
    const reto = !m.modifier || m.modifier === 'straight'
    if (i > 0 && m.type !== 'arrive' && SEM_MANOBRA.has(m.type) && reto) {
      const ant = lista[lista.length - 1]
      if (ant && !ant.rua && rua) ant.rua = rua
      return
    }
    const local = m.location
      ? {
          lat: m.location[1],
          lng: m.location[0],
        }
      : null
    const anterior = lista.length ? lista[lista.length - 1].noCaminho : 0
    let noCaminho = acum ? (noSoma / (totalPassos || 1)) * total : noSoma
    if (m.type === 'depart') noCaminho = 0
    else if (m.type === 'arrive') noCaminho = total
    else if (acum && local) {
      const pr = projetarNaRota(coords, acum, local, anterior - 1, noCaminho + 300)
      if (pr && pr.dist < 30) noCaminho = pr.percorrido
    }
    lista.push({
      tipo: m.type,
      modificador: m.modifier,
      saida: m.exit,
      rua,
      local,
      noCaminho: Math.max(anterior, noCaminho),
    })
  })
  if (lista.length && lista[lista.length - 1].tipo !== 'arrive') {
    const ultimo = coords?.[coords.length - 1]
    lista.push({
      tipo: 'arrive',
      rua: '',
      local: ultimo ? pt(ultimo) : null,
      noCaminho: total,
    })
  }
  lista.forEach((ins, k) => {
    ins.distancia = k < lista.length - 1 ? Math.max(0, lista[k + 1].noCaminho - ins.noCaminho) : 0
    ins.acao = acaoFrase(ins)
    ins.curta = acaoCurta(ins)
    ins.agora = agoraFrase(ins)
    ins.texto = textoLista(ins)
  })
  return lista
}
const MIN_POR_KM_TREM = 1.7
const MIN_PARADA = 0.6
const MIN_BALDEACAO = 5
const M_POR_MIN_PE = 75
function chaveNo(linhaId, idx) {
  return `${linhaId}:${idx}`
}
function montarGrafo(sistema) {
  const nos = new Map()
  const estacoes = todasEstacoes(sistema)
  estacoes.forEach(e =>
    nos.set(chaveNo(e.linha.id, e.idx), {
      ...e,
      vizinhos: [],
    }),
  )
  sistema.linhas.forEach(linha => {
    for (let i = 0; i < linha.estacoes.length - 1; i++) {
      const a = nos.get(chaveNo(linha.id, i))
      const b = nos.get(chaveNo(linha.id, i + 1))
      const custo = (distanciaM(a, b) / 1000) * MIN_POR_KM_TREM + MIN_PARADA
      a.vizinhos.push({
        no: chaveNo(linha.id, i + 1),
        custo,
        tipo: 'trem',
      })
      b.vizinhos.push({
        no: chaveNo(linha.id, i),
        custo,
        tipo: 'trem',
      })
    }
  })
  const pares = new Set((sistema.baldeacoes || []).map(([a, b]) => `${a}|${b}`))
  const lista = [...nos.entries()]
  for (const [ka, a] of lista) {
    for (const [kb, b] of lista) {
      if (ka === kb || a.linha.id === b.linha.id) continue
      if (a.nome === b.nome || pares.has(`${a.nome}|${b.nome}`) || pares.has(`${b.nome}|${a.nome}`)) {
        a.vizinhos.push({
          no: kb,
          custo: MIN_BALDEACAO,
          tipo: 'baldeacao',
        })
      }
    }
  }
  return nos
}
const grafos = new Map()
function grafo(sistema) {
  if (!grafos.has(sistema.id)) grafos.set(sistema.id, montarGrafo(sistema))
  return grafos.get(sistema.id)
}
function menorCaminho(g, origem, destino) {
  const dist = new Map([[origem, 0]])
  const ant = new Map()
  const abertos = new Set([origem])
  const fechados = new Set()
  while (abertos.size) {
    let atual = null
    for (const n of abertos) if (atual === null || dist.get(n) < dist.get(atual)) atual = n
    abertos.delete(atual)
    if (atual === destino) break
    fechados.add(atual)
    for (const v of g.get(atual).vizinhos) {
      if (fechados.has(v.no)) continue
      const d = dist.get(atual) + v.custo
      if (d < (dist.get(v.no) ?? Infinity)) {
        dist.set(v.no, d)
        ant.set(v.no, atual)
        abertos.add(v.no)
      }
    }
  }
  if (!dist.has(destino)) return null
  const caminho = [destino]
  while (caminho[0] !== origem) caminho.unshift(ant.get(caminho[0]))
  return {
    minutos: dist.get(destino),
    caminho: caminho.map(k => g.get(k)),
  }
}
export function estacoesProximas(p, n = 3, { sistema = null, soAcessiveis = false, raio = Infinity } = {}) {
  if (!sistema) return []
  const vistas = new Set()
  return todasEstacoes(sistema)
    .filter(e => !soAcessiveis || e.acessivel)
    .map(e => ({
      ...e,
      metros: distanciaM(p, e),
    }))
    .filter(e => e.metros <= raio)
    .sort((a, b) => a.metros - b.metros)
    .filter(e => {
      const k = e.nome
      if (vistas.has(k)) return false
      vistas.add(k)
      return true
    })
    .slice(0, n)
}
export function planejarMetro(origem, destino, { sistema, soAcessiveis = false } = {}) {
  const fatorPe = 1.3
  const minutosPe = m => (m * fatorPe) / M_POR_MIN_PE
  const direto = distanciaM(origem, destino)
  if (!sistema)
    return {
      caminharDireto: true,
      minutos: minutosPe(direto),
      distancia: direto * fatorPe,
      segmentos: [],
    }
  const g = grafo(sistema)
  const cand = p =>
    [...g.entries()]
      .filter(([, e]) => !soAcessiveis || e.acessivel)
      .map(([k, e]) => ({
        k,
        e,
        m: distanciaM(p, e),
      }))
      .sort((a, b) => a.m - b.m)
      .slice(0, 6)
  let melhor = null
  for (const o of cand(origem)) {
    for (const d of cand(destino)) {
      if (o.e.nome === d.e.nome) continue
      const r = menorCaminho(g, o.k, d.k)
      if (!r) continue
      const total = minutosPe(o.m) + r.minutos + minutosPe(d.m)
      if (!melhor || total < melhor.total)
        melhor = {
          total,
          o,
          d,
          r,
        }
    }
  }
  const andarDireto = minutosPe(direto)
  if (!melhor || andarDireto <= melhor.total) {
    return {
      caminharDireto: true,
      minutos: andarDireto,
      distancia: direto * fatorPe,
      segmentos: [],
    }
  }
  const segmentos = [
    {
      tipo: 'pe',
      de: origem,
      ate: melhor.o.e,
      metros: melhor.o.m * fatorPe,
      texto: `Caminhe até a estação ${melhor.o.e.nome} (${melhor.o.e.linha.nome})`,
    },
  ]
  let trecho = null
  const caminho = melhor.r.caminho
  for (let i = 0; i < caminho.length; i++) {
    const e = caminho[i]
    if (!trecho || trecho.linha.id !== e.linha.id) {
      if (trecho) {
        segmentos.push(fecharTrecho(trecho))
        segmentos.push({
          tipo: 'baldeacao',
          em: e,
          texto: `Faça baldeação para a ${e.linha.nome} em ${e.nome}`,
        })
      }
      trecho = {
        linha: e.linha,
        estacoes: [e],
      }
    } else {
      trecho.estacoes.push(e)
    }
  }
  segmentos.push(fecharTrecho(trecho))
  segmentos.push({
    tipo: 'pe',
    de: melhor.d.e,
    ate: destino,
    metros: melhor.d.m * fatorPe,
    texto: `Saia da estação ${melhor.d.e.nome} e caminhe ${distanciaFalada(melhor.d.m * fatorPe)} até o destino`,
  })
  const distTrem = caminho.reduce((s, e, i) => (i ? s + distanciaM(caminho[i - 1], e) : 0), 0)
  return {
    caminharDireto: false,
    minutos: melhor.total,
    distancia: (melhor.o.m + melhor.d.m) * fatorPe + distTrem,
    segmentos,
    origemEstacao: melhor.o.e,
    destinoEstacao: melhor.d.e,
  }
}
function fecharTrecho(t) {
  const { linha, estacoes } = t
  const primeiro = estacoes[0]
  const ultimo = estacoes[estacoes.length - 1]
  const sentido =
    ultimo.idx > primeiro.idx ? linha.estacoes[linha.estacoes.length - 1].nome : linha.estacoes[0].nome
  const paradas = estacoes.length - 1
  return {
    tipo: 'trem',
    linha,
    de: primeiro,
    ate: ultimo,
    paradas,
    sentido,
    coords: estacoes.map(e => [e.lat, e.lng]),
    texto: `Pegue a ${linha.nome} sentido ${sentido} e desça em ${ultimo.nome} (${paradas} ${paradas === 1 ? 'parada' : 'paradas'})`,
  }
}
