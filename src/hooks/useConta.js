import { useSyncExternalStore } from 'react'
import { assinarConta, estadoConta } from '../lib/conta'
export default function useConta() {
  const e = useSyncExternalStore(assinarConta, estadoConta, estadoConta)
  return {
    ...e,
    ehDono: e.papel === 'dono',
    ehConta: e.tipo === 'conta',
    ehConvidado: e.tipo === 'convidado',
    ehLocal: e.tipo === 'local',
  }
}
