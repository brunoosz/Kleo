import { normalizar } from '../MapaRotas'
const CHAVE = 'kleo_cidade_coords'
function lerCache() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || 'null')
  } catch {
    return null
  }
}
export function coordsCidadeSync(profile) {
  const c = profile?.cityCoords
  const lng = c?.lng ?? c?.lon
  if (c && Number.isFinite(+c.lat) && Number.isFinite(+lng))
    return {
      lat: +c.lat,
      lng: +lng,
    }
  const cidade = normalizar(profile?.city)
  if (!cidade) return null
  const cache = lerCache()
  return cache && normalizar(cache.cidade) === cidade
    ? {
        lat: cache.lat,
        lng: cache.lng,
      }
    : null
}
export async function geocodificarCidade(nome, signal) {
  if (!nome?.trim() || (typeof navigator !== 'undefined' && navigator.onLine === false)) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nome.trim())}&countrycodes=br&limit=1&accept-language=pt-BR`
    const r = await fetch(url, {
      signal,
    })
    if (!r.ok) return null
    const [lugar] = await r.json()
    if (!lugar) return null
    const p = {
      lat: parseFloat(lugar.lat),
      lng: parseFloat(lugar.lon),
    }
    try {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          cidade: nome.trim(),
          ...p,
        }),
      )
    } catch {}
    return p
  } catch {
    return null
  }
}
