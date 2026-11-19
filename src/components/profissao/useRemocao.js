import { useEffect, useRef, useState } from 'react'
export default function useRemocao(onRemover, duracao = 300) {
  const [ids, setIds] = useState(() => new Set())
  const timers = useRef(new Map())
  const onRemoverRef = useRef(onRemover)
  useEffect(() => {
    onRemoverRef.current = onRemover
  })
  useEffect(() => {
    const mapa = timers.current
    return () => {
      mapa.forEach((t, id) => {
        clearTimeout(t)
        onRemoverRef.current(id)
      })
      mapa.clear()
    }
  }, [])
  const remover = id => {
    if (ids.has(id) || timers.current.has(id)) return
    setIds(s => new Set(s).add(id))
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id)
        onRemoverRef.current(id)
        setIds(s => {
          const n = new Set(s)
          n.delete(id)
          return n
        })
      }, duracao),
    )
  }
  return {
    saindo: id => ids.has(id),
    remover,
  }
}
