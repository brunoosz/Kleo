import { createContext, useContext } from 'react'
export const MascoteCtx = createContext('kleoM')
export function useGrad() {
  const prefixo = useContext(MascoteCtx)
  return nome => `url(#${prefixo}-${nome})`
}
