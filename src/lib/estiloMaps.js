const COR = {
  fundo: '#f5f5f3',
  residencial: '#f1f1ef',
  agua: '#9cd2f5',
  verde: '#c6e8c0',
  mata: '#b5dfab',
  hospital: '#fbe3e3',
  escola: '#f6efdc',
  predio: '#e6e4e0',
  predioBorda: '#d9d6d1',
  rua: '#ffffff',
  ruaBorda: '#dcdad6',
  avenida: '#ffffff',
  avenidaBorda: '#d0cdc8',
  rodovia: '#fcd773',
  rodoviaBorda: '#e8b84a',
  trilho: '#bdbdbd',
  texto: '#4a4a4a',
  textoRua: '#5f5f5f',
  halo: '#ffffff',
}
function pintar(l, prop, valor) {
  l.paint = {
    ...(l.paint || {}),
    [prop]: valor,
  }
}
export function estiloMaps(style) {
  const s = JSON.parse(JSON.stringify(style))
  for (const l of s.layers) {
    const id = l.id
    if (l.type === 'background') pintar(l, 'background-color', COR.fundo)
    else if (
      id === 'natural_earth' ||
      id === 'building-3d' ||
      id.endsWith('_hatching') ||
      id === 'road_area_pattern'
    ) {
      l.layout = {
        ...(l.layout || {}),
        visibility: 'none',
      }
    } else if (id === 'water') pintar(l, 'fill-color', COR.agua)
    else if (id.startsWith('waterway') && l.type === 'line') pintar(l, 'line-color', COR.agua)
    else if (id === 'park') {
      pintar(l, 'fill-color', COR.verde)
      pintar(l, 'fill-opacity', 1)
    } else if (id === 'park_outline')
      l.layout = {
        ...(l.layout || {}),
        visibility: 'none',
      }
    else if (id === 'landcover_wood') {
      pintar(l, 'fill-color', COR.mata)
      pintar(l, 'fill-opacity', 0.9)
    } else if (id === 'landcover_grass' || id === 'landuse_pitch' || id === 'landuse_cemetery') {
      pintar(l, 'fill-color', COR.verde)
      pintar(l, 'fill-opacity', 0.9)
    } else if (id === 'landuse_residential') {
      pintar(l, 'fill-color', COR.residencial)
      pintar(l, 'fill-opacity', 1)
    } else if (id === 'landuse_hospital') pintar(l, 'fill-color', COR.hospital)
    else if (id === 'landuse_school') pintar(l, 'fill-color', COR.escola)
    else if (id === 'building') {
      pintar(l, 'fill-color', COR.predio)
      pintar(l, 'fill-outline-color', COR.predioBorda)
    } else if (l['source-layer'] === 'transportation' && l.type === 'line') {
      const borda = id.includes('casing')
      if (/rail/.test(id)) pintar(l, 'line-color', COR.trilho)
      else if (/motorway|trunk_primary/.test(id))
        pintar(l, 'line-color', borda ? COR.rodoviaBorda : COR.rodovia)
      else if (/secondary_tertiary/.test(id)) pintar(l, 'line-color', borda ? COR.avenidaBorda : COR.avenida)
      else if (!/path_pedestrian/.test(id)) pintar(l, 'line-color', borda ? COR.ruaBorda : COR.rua)
    } else if (
      l.type === 'symbol' &&
      (l['source-layer'] === 'place' || l['source-layer'] === 'transportation_name')
    ) {
      pintar(l, 'text-color', l['source-layer'] === 'place' ? COR.texto : COR.textoRua)
      pintar(l, 'text-halo-color', COR.halo)
      pintar(l, 'text-halo-width', 1.6)
    }
  }
  return s
}
const cache = new Map()
export async function carregarEstiloMaps(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error('estilo')
          return r.json()
        })
        .then(estiloMaps)
        .catch(e => {
          cache.delete(url)
          throw e
        }),
    )
  }
  return cache.get(url)
}
