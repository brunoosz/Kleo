import { useCallback, useEffect, useState } from 'react'
const LIMIAR_ARRASTE = 6
export default function useRolagemHorizontal(ref) {
  const [lados, setLados] = useState({
    esq: false,
    dir: false,
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const atualizar = () => {
      const max = el.scrollWidth - el.clientWidth
      const esq = el.scrollLeft > 2
      const dir = el.scrollLeft < max - 2
      setLados(prev =>
        prev.esq === esq && prev.dir === dir
          ? prev
          : {
              esq,
              dir,
            },
      )
    }
    const aoRodar = e => {
      if (e.ctrlKey) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const fator = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientWidth : 1
      const d = e.deltaY * fator
      if ((d < 0 && el.scrollLeft <= 0) || (d > 0 && el.scrollLeft >= max - 1)) return
      e.preventDefault()
      el.scrollLeft += d
    }
    let inicio = null
    let arrastou = false
    const aoPressionar = e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      inicio = {
        x: e.clientX,
        scroll: el.scrollLeft,
        id: e.pointerId,
      }
      arrastou = false
    }
    const aoMover = e => {
      if (!inicio) return
      const dx = e.clientX - inicio.x
      if (!arrastou && Math.abs(dx) > LIMIAR_ARRASTE) {
        arrastou = true
        try {
          el.setPointerCapture(inicio.id)
        } catch {}
        el.style.cursor = 'grabbing'
        el.style.userSelect = 'none'
      }
      if (arrastou) el.scrollLeft = inicio.scroll - dx
    }
    const aoSoltar = () => {
      if (!inicio) return
      try {
        el.releasePointerCapture(inicio.id)
      } catch {}
      inicio = null
      el.style.cursor = ''
      el.style.userSelect = ''
    }
    const aoClicar = e => {
      if (!arrastou) return
      e.preventDefault()
      e.stopPropagation()
      arrastou = false
    }
    const aoArrastarNativo = e => e.preventDefault()
    el.addEventListener('scroll', atualizar, {
      passive: true,
    })
    el.addEventListener('wheel', aoRodar, {
      passive: false,
    })
    el.addEventListener('pointerdown', aoPressionar)
    el.addEventListener('pointermove', aoMover)
    el.addEventListener('pointerup', aoSoltar)
    el.addEventListener('pointercancel', aoSoltar)
    el.addEventListener('click', aoClicar, true)
    el.addEventListener('dragstart', aoArrastarNativo)
    let obs = null
    if (typeof ResizeObserver !== 'undefined') {
      obs = new ResizeObserver(atualizar)
      obs.observe(el)
      Array.from(el.children).forEach(c => obs.observe(c))
    }
    window.addEventListener('resize', atualizar)
    atualizar()
    return () => {
      el.removeEventListener('scroll', atualizar)
      el.removeEventListener('wheel', aoRodar)
      el.removeEventListener('pointerdown', aoPressionar)
      el.removeEventListener('pointermove', aoMover)
      el.removeEventListener('pointerup', aoSoltar)
      el.removeEventListener('pointercancel', aoSoltar)
      el.removeEventListener('click', aoClicar, true)
      el.removeEventListener('dragstart', aoArrastarNativo)
      window.removeEventListener('resize', atualizar)
      obs?.disconnect()
    }
  }, [ref])
  const rolar = useCallback(
    sentido => {
      const el = ref.current
      if (!el) return
      el.scrollBy({
        left: sentido * Math.max(120, el.clientWidth * 0.8),
        behavior: 'smooth',
      })
    },
    [ref],
  )
  return {
    podeEsq: lados.esq,
    podeDir: lados.dir,
    rolar,
  }
}
