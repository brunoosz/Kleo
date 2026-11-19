import { createElement } from 'react'
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  MoveUpLeft,
  MoveUpRight,
  Undo2,
  RotateCcw,
  Flag,
  Merge,
  LogOut,
} from 'lucide-react'
export function iconeDaManobra(ins) {
  if (!ins) return ArrowUp
  const { tipo, modificador } = ins
  if (tipo === 'arrive') return Flag
  if (tipo === 'roundabout' || tipo === 'rotary' || tipo === 'roundabout turn') return RotateCcw
  if (tipo === 'exit roundabout' || tipo === 'exit rotary' || tipo === 'off ramp') return LogOut
  if (tipo === 'merge') return Merge
  switch (modificador) {
    case 'right':
    case 'sharp right':
      return CornerUpRight
    case 'left':
    case 'sharp left':
      return CornerUpLeft
    case 'slight right':
      return MoveUpRight
    case 'slight left':
      return MoveUpLeft
    case 'uturn':
      return Undo2
    default:
      return ArrowUp
  }
}
export function IconeManobra({ ins, ...props }) {
  return createElement(iconeDaManobra(ins), props)
}
