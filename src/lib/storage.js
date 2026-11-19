export function ler(chave, padrao = null) {
  try {
    const v = localStorage.getItem(chave)
    if (v === null) return padrao
    try {
      return JSON.parse(v)
    } catch {
      return v
    }
  } catch {
    return padrao
  }
}
export function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {}
  window.dispatchEvent(
    new CustomEvent('kleo-storage', {
      detail: chave,
    }),
  )
}
export function remover(chave) {
  try {
    localStorage.removeItem(chave)
  } catch {}
  window.dispatchEvent(
    new CustomEvent('kleo-storage', {
      detail: chave,
    }),
  )
}
export function limparTudo() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('kleo_'))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
  window.dispatchEvent(
    new CustomEvent('kleo-storage', {
      detail: '*',
    }),
  )
}
export function hojeISO(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export function adicionarEvento(ev) {
  const salvos = ler('kleo_events', [])
  const eventos = Array.isArray(salvos) ? salvos : []
  eventos.push({
    id: Date.now() + Math.random(),
    cor: '#5e5ce6',
    descricao: '',
    hora: '',
    ...ev,
  })
  salvar('kleo_events', eventos)
}
export function adicionarItemLista(nome, texto) {
  const salvas = ler('kleo_listas', {})
  const listas = salvas && typeof salvas === 'object' && !Array.isArray(salvas) ? salvas : {}
  const limpo = String(nome || '').trim() || 'Lista'
  const alvo = limpo.toLowerCase()
  const nomes = Object.keys(listas)
  const existente =
    nomes.find(k => k.toLowerCase() === alvo) ||
    nomes.find(k => {
      const kk = k.toLowerCase()
      return Math.min(kk.length, alvo.length) >= 4 && (kk.includes(alvo) || alvo.includes(kk))
    })
  const chave = existente || limpo.charAt(0).toUpperCase() + limpo.slice(1)
  if (!Array.isArray(listas[chave])) listas[chave] = []
  listas[chave].push({
    id: Date.now() + Math.random(),
    texto,
    feito: false,
  })
  salvar('kleo_listas', listas)
  return chave
}
