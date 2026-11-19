import { ler, salvar } from './storage'
import { urlApi, servidorConfigurado } from './api'
try {
  for (const k of ['kleo_google_maps_key', 'kleo_google_sessao_roadmap', 'kleo_google_sessao_satellite']) {
    if (localStorage.getItem(k) !== null) localStorage.removeItem(k)
  }
} catch {}
export const ESTADO_GOOGLE = 'kleo_mapa_google'
const VALIDADE_MS = 10 * 60 * 1000
let pendente = null
export const temGoogle = () => servidorConfigurado() && ler(ESTADO_GOOGLE, null)?.ok === true
export function verificarGoogle({ forcar = false } = {}) {
  if (!servidorConfigurado()) {
    if (ler(ESTADO_GOOGLE, null) === null)
      salvar(ESTADO_GOOGLE, {
        ok: false,
        em: 0,
      })
    return Promise.resolve(false)
  }
  const guardado = ler(ESTADO_GOOGLE, null)
  if (!forcar && guardado && Date.now() - Number(guardado.em || 0) < VALIDADE_MS)
    return Promise.resolve(guardado.ok === true)
  if (pendente) return pendente
  pendente = fetch(urlApi('/api/mapa?status'), {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(r => ((r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .then(j => {
      const ok = j?.ok === true
      salvar(ESTADO_GOOGLE, {
        ok,
        em: Date.now(),
      })
      return ok
    })
    .catch(() => {
      if (!guardado)
        salvar(ESTADO_GOOGLE, {
          ok: false,
          em: 0,
        })
      return guardado?.ok === true
    })
    .finally(() => {
      pendente = null
    })
  return pendente
}
export const urlTilesGoogle = (tipo = 'roadmap') =>
  `${urlApi('/api/mapa')}?z={z}&x={x}&y={y}&tipo=${tipo === 'satellite' ? 'satellite' : 'roadmap'}`
