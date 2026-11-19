import useStorage from './useStorage'
import { modoSimplesEfetivo } from '../lib/perfil'
export function calcularModoSimples(valor, profile) {
  return modoSimplesEfetivo(valor, profile)
}
export default function useModoSimples() {
  const [valor] = useStorage('kleo_modo_simples', null)
  const [profile] = useStorage('kleo_profile', null)
  return calcularModoSimples(valor, profile)
}
