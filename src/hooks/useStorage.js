import { useEffect, useState, useCallback } from 'react'
import { ler, salvar } from '../lib/storage'
export default function useStorage(chave, padrao) {
  const [valor, setValor] = useState(() => ler(chave, padrao))
  useEffect(() => {
    const sync = e => {
      if (e.detail === chave || e.detail === '*') setValor(ler(chave, padrao))
    }
    const syncAba = e => {
      if (e.key === chave || e.key === null) setValor(ler(chave, padrao))
    }
    window.addEventListener('kleo-storage', sync)
    window.addEventListener('storage', syncAba)
    return () => {
      window.removeEventListener('kleo-storage', sync)
      window.removeEventListener('storage', syncAba)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  const atualizar = useCallback(
    novo => {
      const atual = ler(chave, padrao)
      const v = typeof novo === 'function' ? novo(atual) : novo
      salvar(chave, v)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chave],
  )
  return [valor, atualizar]
}
