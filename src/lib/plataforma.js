import { Capacitor } from '@capacitor/core'
const temJanela = typeof window !== 'undefined'
export function ponteElectron() {
  if (!temJanela) return null
  const p = window.kleoNativo
  return p && p.plataforma === 'electron' ? p : null
}
export function ehElectron() {
  if (ponteElectron()) return true
  return typeof navigator !== 'undefined' && /\bElectron\//.test(navigator.userAgent || '')
}
export function ehCapacitor() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}
export const ehAppNativo = () => ehElectron() || ehCapacitor()
export function instaladoPeloNavegador() {
  if (!temJanela) return false
  const modo = m => {
    try {
      return window.matchMedia(`(display-mode: ${m})`).matches
    } catch {
      return false
    }
  }
  return (
    modo('standalone') ||
    modo('fullscreen') ||
    modo('minimal-ui') ||
    navigator.standalone === true ||
    String(document.referrer || '').startsWith('android-app://')
  )
}
export function plataformaAtual() {
  if (ehElectron()) return 'electron'
  if (ehCapacitor()) {
    try {
      return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
    } catch {
      return 'android'
    }
  }
  return instaladoPeloNavegador() ? 'pwa' : 'web'
}
export const NOME_PLATAFORMA = {
  electron: 'app do computador',
  android: 'app do Android',
  ios: 'app do iPhone',
  pwa: 'app instalado',
  web: 'site',
}
