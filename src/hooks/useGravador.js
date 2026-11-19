import { useCallback, useEffect, useRef, useState } from 'react'
import { iniciarGravacao } from '../lib/audio'
import { pararFala } from '../lib/voz'
export default function useGravador() {
  const [estado, setEstado] = useState('parado')
  const [nivel, setNivel] = useState(0)
  const [segundos, setSegundos] = useState(0)
  const rec = useRef(null)
  const relogio = useRef(null)
  const aoParar = useRef(null)
  const limpar = () => {
    clearInterval(relogio.current)
    rec.current = null
    setEstado('parado')
    setNivel(0)
  }
  const parar = useCallback(async () => {
    const r = rec.current
    if (!r) return null
    rec.current = null
    clearInterval(relogio.current)
    const res = await r.parar()
    setEstado('parado')
    setNivel(0)
    return res
  }, [])
  const iniciar = useCallback(
    async ({ silencio = false, onFim } = {}) => {
      if (rec.current) return
      pararFala()
      aoParar.current = onFim || null
      const disparar = async () => {
        const res = await parar()
        if (res) aoParar.current?.(res)
      }
      rec.current = await iniciarGravacao({
        onNivel: n => setNivel(v => v * 0.5 + n * 0.5),
        onSilencio: silencio ? disparar : undefined,
        onLimite: disparar,
      })
      navigator.vibrate?.(20)
      setSegundos(0)
      setEstado('gravando')
      const t0 = Date.now()
      relogio.current = setInterval(() => setSegundos((Date.now() - t0) / 1000), 200)
    },
    [parar],
  )
  const cancelar = useCallback(() => {
    rec.current?.cancelar()
    limpar()
  }, [])
  useEffect(
    () => () => {
      rec.current?.cancelar()
      clearInterval(relogio.current)
    },
    [],
  )
  return {
    estado,
    nivel,
    segundos,
    iniciar,
    parar,
    cancelar,
  }
}
