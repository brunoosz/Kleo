import { useEffect, useState } from 'react'
export async function pedirBussola() {
  try {
    const DO = window.DeviceOrientationEvent
    if (DO && typeof DO.requestPermission === 'function') return (await DO.requestPermission()) === 'granted'
  } catch {}
  return true
}
export default function useBussola(ativo = true) {
  const [rumo, setRumo] = useState(null)
  useEffect(() => {
    if (!ativo || typeof window === 'undefined') return
    let ultimo = 0
    let absoluto = false
    const aoMudar = e => {
      let h = null
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading
      else if (e.absolute && typeof e.alpha === 'number') h = 360 - e.alpha
      else if (!absoluto && typeof e.alpha === 'number' && e.type === 'deviceorientation') return
      if (h == null) return
      if (e.type === 'deviceorientationabsolute') absoluto = true
      const tela = window.screen?.orientation?.angle || 0
      h = (h + tela + 360) % 360
      const agora = performance.now()
      if (agora - ultimo < 150) return
      ultimo = agora
      setRumo(atual =>
        atual == null || Math.abs(((h - atual + 540) % 360) - 180) > 2 ? Math.round(h) : atual,
      )
    }
    window.addEventListener('deviceorientationabsolute', aoMudar)
    window.addEventListener('deviceorientation', aoMudar)
    return () => {
      window.removeEventListener('deviceorientationabsolute', aoMudar)
      window.removeEventListener('deviceorientation', aoMudar)
    }
  }, [ativo])
  return ativo ? rumo : null
}
