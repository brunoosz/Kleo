import { useEffect, useRef, useState } from 'react'
export default function useSaida(aberto, duracao = 280) {
  const [montado, setMontado] = useState(aberto)
  const [saindo, setSaindo] = useState(false)
  const timer = useRef(null)
  useEffect(() => {
    clearTimeout(timer.current)
    if (aberto) {
      timer.current = setTimeout(() => {
        setMontado(true)
        setSaindo(false)
      }, 0)
    } else {
      timer.current = setTimeout(() => setSaindo(true), 0)
      const t2 = setTimeout(() => {
        setMontado(false)
        setSaindo(false)
      }, duracao)
      return () => clearTimeout(t2)
    }
    return () => clearTimeout(timer.current)
  }, [aberto, duracao])
  return {
    montado: montado || aberto,
    saindo: saindo && !aberto,
  }
}
