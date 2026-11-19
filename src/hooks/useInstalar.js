import { useSyncExternalStore } from 'react'
import { assinarInstalacao, lerInstalacao, pedirInstalacao } from '../lib/instalar'
export default function useInstalar() {
  const estado = useSyncExternalStore(assinarInstalacao, lerInstalacao, lerInstalacao)
  return {
    ...estado,
    instalar: pedirInstalacao,
  }
}
