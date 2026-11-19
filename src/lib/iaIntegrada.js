import { ler, salvar } from './storage'
import { urlApi } from './api'
export const urlIaIntegrada = () => urlApi('ia')
export const urlTranscricaoIntegrada = () => urlApi('transcrever')
export const CHAVE_INTEGRADA = 'kleo_ia_integrada'
const VALIDADE = 10 * 60 * 1000
const VALIDADE_FALHA = 60 * 1000
const TEMPO_MAXIMO = 8000
let memoria = null
let pendente = null
const valido = e => !!e && typeof e === 'object' && typeof e.em === 'number'
export function estadoIntegrada() {
  if (valido(memoria)) return memoria
  const salvo = ler(CHAVE_INTEGRADA, null)
  if (valido(salvo)) memoria = salvo
  return memoria
}
export function integradaServe(funcao = 'chat') {
  const e = estadoIntegrada()
  if (!e) return null
  if (!e.ok) return false
  if (funcao === 'transcricao') return !!e.transcricao
  if (funcao === 'visao' || funcao === 'navegacao') return !!e.visao
  return !!e.chat
}
function gravar(estado) {
  memoria = estado
  salvar(CHAVE_INTEGRADA, estado)
}
export function marcarIntegrada(parcial) {
  gravar({
    ...(estadoIntegrada() || {}),
    ...parcial,
    em: Date.now(),
  })
}
export function verificarIntegrada({ forcar = false } = {}) {
  const atual = estadoIntegrada()
  const validade = atual?.falhaRede ? VALIDADE_FALHA : VALIDADE
  if (!forcar && atual && Date.now() - atual.em < validade) return Promise.resolve(atual)
  if (pendente) return pendente
  pendente = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TEMPO_MAXIMO)
    let novo
    try {
      const r = await fetch(urlIaIntegrada(), {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: ctrl.signal,
      })
      const tipo = r.headers.get('content-type') || ''
      if (r.ok && tipo.includes('json')) {
        const j = await r.json()
        novo = {
          ok: !!j?.ok,
          chat: !!j?.chat,
          visao: !!j?.visao,
          transcricao: !!j?.transcricao,
          provedores: Array.isArray(j?.provedores)
            ? j.provedores.filter(p => typeof p === 'string').slice(0, 4)
            : [],
        }
      } else {
        novo = {
          ok: false,
          chat: false,
          visao: false,
          transcricao: false,
          provedores: [],
          motivo: r.ok ? 'sem-servidor' : `http-${r.status}`,
        }
      }
    } catch {
      novo = atual
        ? {
            ...atual,
            falhaRede: true,
          }
        : {
            ok: false,
            chat: false,
            visao: false,
            transcricao: false,
            provedores: [],
            motivo: 'rede',
            falhaRede: true,
          }
    } finally {
      clearTimeout(timer)
    }
    gravar({
      ...novo,
      em: Date.now(),
    })
    return memoria
  })().finally(() => {
    pendente = null
  })
  return pendente
}
if (typeof window !== 'undefined') {
  setTimeout(() => {
    verificarIntegrada()
  }, 0)
  window.addEventListener('online', () => {
    verificarIntegrada({
      forcar: true,
    })
  })
}
