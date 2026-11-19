import { useEffect, useRef, useState } from 'react'
import { MotorNavegacao, estadoInicial } from './motor'
import { acumulado, pontoNaRota } from '../MapaRotas'
import { falar } from '../../lib/voz'
import { piscarTela } from '../../hooks/useAcessibilidade'
const VEL_SIM = {
  carro: 12,
  pe: 1.4,
  acessivel: 1.0,
}
export default function useNavegacao({
  rota,
  ativa,
  simular = false,
  velocidade = 1,
  modo,
  intro = '',
  mudo = false,
  auditiva = false,
  onRecalcular,
  onChegou,
  onGps,
}) {
  const [estado, setEstado] = useState(null)
  const cfg = useRef({})
  useEffect(() => {
    Object.assign(cfg.current, {
      mudo,
      auditiva,
      onRecalcular,
      onChegou,
      onGps,
      velocidade,
    })
  })
  useEffect(() => {
    if (ativa) cfg.current.introPendente = intro
  }, [ativa, simular, intro])
  useEffect(() => {
    if (!ativa || !rota?.coords?.length) return
    const motor = new MotorNavegacao(rota, {
      modo,
      intro: cfg.current.introPendente || '',
    })
    cfg.current.introPendente = ''
    let vivo = true
    const anunciar = f => {
      const c = cfg.current
      navigator.vibrate?.(f.urgente ? [180, 90, 180] : 120)
      if (c.auditiva) piscarTela()
      if (!c.mudo)
        falar(f.texto, {
          forcar: true,
        })
    }
    const aplicar = (pos, extra = {}) => {
      if (!vivo) return
      const r = motor.atualizar(pos)
      setEstado({
        rota,
        ...r.estado,
        rumoGps: pos.rumo ?? null,
        velocidade: pos.velocidade ?? null,
        ...extra,
      })
      r.falas.forEach(anunciar)
      if (r.recalcular) cfg.current.onRecalcular?.(pos)
      if (r.chegou) cfg.current.onChegou?.()
    }
    if (simular) {
      const acum = acumulado(rota.coords)
      const total = acum[acum.length - 1]
      const base = VEL_SIM[modo] || VEL_SIM.pe
      let d = 0
      let antes = performance.now()
      const passo = () => {
        const agora = performance.now()
        const dt = Math.min(1, (agora - antes) / 1000)
        antes = agora
        let v = base * (cfg.current.velocidade || 1)
        if (modo === 'carro' && motor.prox > 0) {
          const falta = (rota.instrucoes[motor.prox]?.noCaminho ?? total) - d
          if (falta < 60) v = Math.min(v, 6 * (cfg.current.velocidade || 1))
        }
        d = Math.min(total, d + v * dt)
        const p = pontoNaRota(rota.coords, acum, d)
        aplicar(
          {
            lat: p.lat,
            lng: p.lng,
            precisao: 5,
            rumo: p.rumo,
            velocidade: v,
          },
          {
            simulando: true,
          },
        )
        if (d >= total) clearInterval(id)
      }
      const id = setInterval(passo, 250)
      return () => {
        vivo = false
        clearInterval(id)
      }
    }
    if (!navigator.geolocation)
      return () => {
        vivo = false
      }
    const watch = navigator.geolocation.watchPosition(
      g => {
        const c = g.coords
        const pos = {
          lat: c.latitude,
          lng: c.longitude,
          precisao: c.accuracy,
          rumo: c.heading != null && !Number.isNaN(c.heading) && (c.speed ?? 0) > 0.7 ? c.heading : null,
          velocidade: c.speed,
        }
        cfg.current.onGps?.(pos)
        aplicar(pos)
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      },
    )
    return () => {
      vivo = false
      navigator.geolocation.clearWatch(watch)
    }
  }, [rota, ativa, simular, modo])
  if (!ativa || !rota) return null
  return estado && estado.rota === rota && !!estado.simulando === !!simular ? estado : estadoInicial(rota)
}
