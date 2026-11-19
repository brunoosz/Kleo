import {
  House,
  MessageCircle,
  Map,
  Calendar,
  FileText,
  AlarmClock,
  Settings,
  Briefcase,
  Users,
} from 'lucide-react'
import { getProfissao } from './profissoes'
export const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Início',
    icone: House,
    rota: '/home',
  },
  {
    id: 'chat',
    label: 'Kleo',
    icone: MessageCircle,
    rota: '/chat',
  },
  {
    id: 'mapa',
    label: 'Mapa',
    icone: Map,
    rota: '/mapa',
  },
  {
    id: 'pessoas',
    label: 'Pessoas',
    icone: Users,
    rota: '/pessoas',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    icone: Calendar,
    rota: '/agenda',
  },
  {
    id: 'notas',
    label: 'Notas',
    icone: FileText,
    rota: '/notas',
  },
  {
    id: 'rotinas',
    label: 'Rotinas',
    icone: AlarmClock,
    rota: '/rotinas',
  },
  {
    id: 'profissao',
    label: 'Trabalho',
    icone: null,
    rota: '/profissao',
  },
  {
    id: 'configuracoes',
    label: 'Ajustes',
    icone: Settings,
    rota: '/configuracoes',
  },
].map(i => ({
  ...i,
  icon: i.icone,
}))
export const NAV_FIXOS = ['home', 'chat', 'mapa']
export const NAV_EXTRAS_PADRAO = ['pessoas', 'rotinas']
export const NAV_MAX_EXTRAS = 2
export const NAV_PADRAO = ['home', 'chat', 'agenda', 'notas', 'profissao']
export const NAV_MAX = 5
export function extrasValidos(salvo) {
  if (!Array.isArray(salvo)) return NAV_EXTRAS_PADRAO
  const vistos = new Set()
  return salvo
    .filter(
      id => NAV_ITEMS.some(i => i.id === id) && !NAV_FIXOS.includes(id) && !vistos.has(id) && vistos.add(id),
    )
    .slice(0, NAV_MAX_EXTRAS)
}
export function iconeNav(item, profile) {
  if (item?.icone || item?.icon) return item.icone || item.icon
  const prof = getProfissao(profile?.profissao)
  return prof?.icone || prof?.icon || Briefcase
}
