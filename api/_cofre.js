import process from 'node:process'
export const SERVICOS = ['groq', 'gemini', 'openrouter', 'openai', 'elevenlabs', 'google_maps', 'outro']
const VARIAVEIS = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY',
  google_maps: 'GOOGLE_MAPS_API_KEY',
}
const VALIDADE_MS = 15 * 1000
const RESERVA_MS = 10 * 60 * 1000
const ESPERA_FALHA_MS = 30 * 1000
const TEMPO_MS = 4000
export const limparChave = v =>
  String(v || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim()
export function origemSupabase(u) {
  try {
    return new URL(String(u || '').trim()).origin
  } catch {
    return ''
  }
}
export function configSupabase() {
  const env = process.env
  const url = origemSupabase(limparChave(env.SUPABASE_URL || env.VITE_SUPABASE_URL))
  const secreta = limparChave(env.SUPABASE_SERVICE_ROLE_KEY)
  const publica = limparChave(
    env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
  )
  return {
    url,
    secreta,
    publica,
    cofre: !!(url && secreta),
  }
}
export function cabecalhos(chave, token) {
  const h = {
    apikey: chave,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  else if (!/^sb_(secret|publishable)_/.test(chave)) h.Authorization = `Bearer ${chave}`
  return h
}
async function postar(url, headers, corpo = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TEMPO_MS)
  try {
    return await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}
const memoria =
  globalThis.__kleoCofre ||
  (globalThis.__kleoCofre = {
    linhas: null,
    em: 0,
    falhaEm: 0,
    pendente: null,
    avisou: 0,
  })
async function buscarCofre(cfg) {
  const r = await postar(`${cfg.url}/rest/v1/rpc/cofre_valores`, cabecalhos(cfg.secreta))
  if (!r.ok) {
    const txt = await r.text().catch(() => '')
    throw Object.assign(
      new Error(`cofre_valores respondeu HTTP ${r.status}: ${txt.replace(/\s+/g, ' ').slice(0, 160)}`),
      {
        status: r.status,
      },
    )
  }
  const j = await r.json()
  if (!Array.isArray(j)) throw new Error('cofre_valores devolveu algo que não é uma lista')
  return j
    .filter(l => l && SERVICOS.includes(l.servico) && typeof l.valor === 'string' && limparChave(l.valor))
    .map(l => ({
      id: String(l.id),
      servico: l.servico,
      valor: limparChave(l.valor),
      modelo: l.modelo ? String(l.modelo).trim().slice(0, 120) : null,
      ordem: Number(l.ordem) || 1,
      ativa: l.ativa !== false,
    }))
}
export async function lerCofre({ forcar = false } = {}) {
  const cfg = configSupabase()
  if (!cfg.cofre) return null
  const agora = Date.now()
  const copiaRecente = memoria.linhas && agora - memoria.em < RESERVA_MS ? memoria.linhas : null
  if (!forcar && memoria.linhas && agora - memoria.em < VALIDADE_MS) return memoria.linhas
  if (!forcar && memoria.falhaEm && agora - memoria.falhaEm < ESPERA_FALHA_MS) return copiaRecente
  if (memoria.pendente) return memoria.pendente
  memoria.pendente = buscarCofre(cfg)
    .then(linhas => {
      memoria.linhas = linhas
      memoria.em = Date.now()
      memoria.falhaEm = 0
      return linhas
    })
    .catch(e => {
      if (Date.now() - memoria.avisou > 60000) {
        memoria.avisou = Date.now()
        console.warn('[Kleo cofre] não consegui ler o cofre:', e.message)
      }
      if (e.status === 404) {
        memoria.linhas = []
        memoria.em = Date.now()
        return []
      }
      memoria.falhaEm = Date.now()
      return copiaRecente
    })
    .finally(() => {
      memoria.pendente = null
    })
  return memoria.pendente
}
export function limparCacheCofre() {
  memoria.linhas = null
  memoria.em = 0
  memoria.falhaEm = 0
}
const saude = globalThis.__kleoSaudeChaves || (globalThis.__kleoSaudeChaves = new Map())
const PENALIDADE = {
  chave: 10 * 60 * 1000,
  limite: 60 * 1000,
}
export function penalizar(id, tipo) {
  const ms = PENALIDADE[tipo]
  if (id && ms) saude.set(id, Date.now() + ms)
  if (saude.size > 500) for (const [k, ate] of saude) if (ate < Date.now()) saude.delete(k)
}
const boa = id => !(saude.get(id) > Date.now())
export async function chavesServidor({ forcar = false } = {}) {
  const linhas = await lerCofre({
    forcar,
  })
  const saida = {}
  for (const s of SERVICOS) {
    const lista = (linhas || [])
      .filter(l => l.servico === s && l.ativa)
      .sort((a, b) => a.ordem - b.ordem)
      .map(l => ({
        id: `${l.id}:${l.valor.slice(-6)}`,
        valor: l.valor,
        modelo: l.modelo,
        origem: 'cofre',
      }))
    const reserva = VARIAVEIS[s] ? limparChave(process.env[VARIAVEIS[s]]) : ''
    if (reserva && !lista.some(k => k.valor === reserva))
      lista.push({
        id: `ambiente:${s}`,
        valor: reserva,
        modelo: null,
        origem: 'ambiente',
      })
    saida[s] = [...lista.filter(k => boa(k.id)), ...lista.filter(k => !boa(k.id))]
  }
  return saida
}
export async function ehDono(token) {
  const cfg = configSupabase()
  const chave = cfg.publica || cfg.secreta
  if (!cfg.url || !chave || !token) return false
  const r = await postar(`${cfg.url}/rest/v1/rpc/meu_papel`, cabecalhos(chave, token))
  if (!r.ok) return false
  return (await r.json().catch(() => null)) === 'dono'
}
const ajustes =
  globalThis.__kleoAjustes ||
  (globalThis.__kleoAjustes = {
    valor: null,
    em: 0,
    pendente: null,
    marcado: null,
  })
const AJUSTES_MS = 30 * 1000
export async function ajustesApp({ forcar = false } = {}) {
  const cfg = configSupabase()
  const chave = cfg.secreta || cfg.publica
  const padrao = {
    vozAparelho: false,
    vozSemCotaEm: 0,
  }
  if (!cfg.url || !chave) return padrao
  if (!forcar && ajustes.valor && Date.now() - ajustes.em < AJUSTES_MS) return ajustes.valor
  if (ajustes.pendente) return ajustes.pendente
  ajustes.pendente = postar(`${cfg.url}/rest/v1/rpc/ajustes_app`, cabecalhos(chave))
    .then(r => (r.ok ? r.json() : null))
    .then(j => {
      const v = {
        vozAparelho: j?.voz_aparelho === true,
        vozSemCotaEm: Date.parse(j?.voz_sem_cota_em || '') || 0,
      }
      ajustes.valor = v
      ajustes.em = Date.now()
      return v
    })
    .catch(() => ajustes.valor || padrao)
    .finally(() => {
      ajustes.pendente = null
    })
  return ajustes.pendente
}
export async function marcarVozSemCota(acabou) {
  const cfg = configSupabase()
  if (!cfg.url || !cfg.secreta) return
  if (ajustes.marcado === acabou) return
  if (!acabou && ajustes.valor && !ajustes.valor.vozSemCotaEm && Date.now() - ajustes.em < AJUSTES_MS) {
    ajustes.marcado = false
    return
  }
  ajustes.marcado = acabou
  if (ajustes.valor) ajustes.valor = { ...ajustes.valor, vozSemCotaEm: acabou ? Date.now() : 0 }
  await postar(`${cfg.url}/rest/v1/rpc/marcar_voz_sem_cota`, cabecalhos(cfg.secreta), { acabou }).catch(
    () => {},
  )
}
