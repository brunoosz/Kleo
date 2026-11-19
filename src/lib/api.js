import { ehCapacitor } from './plataforma'
const env = import.meta.env || {}
export const API_BASE = String(env.VITE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '')
export function caminhoApi(caminho = '') {
  let c = String(caminho || '')
    .trim()
    .replace(/^\/+/, '')
  if (!/^api(\/|\?|$)/i.test(c)) c = `api/${c}`
  return `/${c}`
}
export function urlApi(caminho) {
  const c = caminhoApi(caminho)
  if (ehCapacitor()) return API_BASE ? `${API_BASE}${c}` : c
  const base = String(env.BASE_URL || '/').replace(/\/+$/, '')
  return `${base}${c}`
}
export const servidorConfigurado = () => !ehCapacitor() || !!API_BASE
