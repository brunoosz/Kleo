import { ler, salvar } from './storage'
import { ehAppNativo, instaladoPeloNavegador, plataformaAtual } from './plataforma'
export const VERSAO_APP = '1.0.0'
const env = import.meta.env || {}
export const VERSAO_BUILD = String(env.VITE_VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
export const abrirDownload = () => window.open(LINK_DOWNLOAD, '_blank', 'noopener')
export function plataforma() {
  if (typeof navigator === 'undefined') return 'pc'
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'pc'
}
export function rodandoComoApp() {
  if (typeof window === 'undefined') return false
  return ehAppNativo() || instaladoPeloNavegador()
}
let convite = null
let estado = null
const ouvintes = new Set()
function calcular() {
  const comoApp = rodandoComoApp()
  return {
    plataforma: plataforma(),
    onde: plataformaAtual(),
    nativo: ehAppNativo(),
    comoApp,
    instalado: comoApp || ler('kleo_app_instalado', false) === true,
    podeInstalar: !!convite,
  }
}
function atualizar() {
  const novo = calcular()
  if (estado && Object.keys(novo).every(k => novo[k] === estado[k])) return
  estado = novo
  ouvintes.forEach(fn => fn())
}
export function lerInstalacao() {
  if (!estado) estado = calcular()
  return estado
}
export function assinarInstalacao(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}
export async function pedirInstalacao() {
  const e = convite
  if (!e) return 'sem-convite'
  convite = null
  atualizar()
  try {
    await e.prompt()
    const escolha = await e.userChoice
    if (escolha?.outcome === 'accepted') {
      salvar('kleo_app_instalado', true)
      atualizar()
      return 'aceito'
    }
    return 'recusado'
  } catch {
    return 'erro'
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    convite = e
    if (ler('kleo_app_instalado', false) === true) salvar('kleo_app_instalado', false)
    atualizar()
  })
  window.addEventListener('appinstalled', () => {
    convite = null
    salvar('kleo_app_instalado', true)
    atualizar()
  })
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', atualizar)
  } catch {}
  if (rodandoComoApp() && ler('kleo_app_instalado', false) !== true) salvar('kleo_app_instalado', true)
}
export const LINK_APP = 'https://github.com/brunoosz/Kleo'
export const LINK_DOWNLOAD = 'https://github.com/brunoosz/Kleo/releases'
export function linkDoApp() {
  return LINK_APP
}
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {}
  try {
    const campo = document.createElement('textarea')
    campo.value = texto
    campo.setAttribute('readonly', '')
    Object.assign(campo.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      opacity: '0',
    })
    document.body.appendChild(campo)
    campo.select()
    const ok = document.execCommand('copy')
    campo.remove()
    return ok
  } catch {
    return false
  }
}
export async function compartilharApp() {
  const url = linkDoApp()
  if (!url) return 'erro'
  const texto =
    'Conheça a Kleo, assistente pessoal para idosos, pessoas com deficiência e qualquer pessoa. Mais autonomia. Mais liberdade.'
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Kleo',
        text: texto,
        url,
      })
      return 'compartilhado'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado'
    }
  }
  return (await copiarTexto(url)) ? 'copiado' : 'erro'
}
