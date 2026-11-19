import { House, Briefcase, GraduationCap, School, MapPin } from 'lucide-react'
import useStorage from './useStorage'
const ICONES_LOCAL = {
  casa: House,
  trabalho: Briefcase,
  faculdade: GraduationCap,
  escola: School,
  outro: MapPin,
}
export const iconeLocal = tipo => ICONES_LOCAL[tipo] || MapPin
export default function useLocais() {
  const [salvos] = useStorage('kleo_locais', [])
  return Array.isArray(salvos) ? salvos.filter(l => l && l.id && Number.isFinite(l.lat)) : []
}
