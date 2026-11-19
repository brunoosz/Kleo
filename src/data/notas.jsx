import { ShoppingCart, Pill, ListTodo, ListChecks, Gift, Plane, House } from 'lucide-react'
export const CORES_NOTA = [
  {
    id: 'lavanda',
    nome: 'Lavanda',
    valor: 'var(--lavanda)',
  },
  {
    id: 'lima',
    nome: 'Lima',
    valor: 'var(--lima)',
  },
  {
    id: 'ceu',
    nome: 'Céu',
    valor: 'var(--ceu)',
  },
  {
    id: 'branco',
    nome: 'Branco',
    valor: 'var(--surface)',
  },
]
export function corDaNota(nota) {
  const escolhida = CORES_NOTA.find(c => c.id === nota?.cor)
  if (escolhida) return escolhida
  const n = Math.abs(Math.floor((Number(nota?.id) || 0) / 1000))
  return CORES_NOTA[n % CORES_NOTA.length]
}
export function dataRelativa(ts) {
  if (!ts) return 'agora'
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dia = new Date(d)
  dia.setHours(0, 0, 0, 0)
  const dias = Math.round((hoje - dia) / 86400000)
  if (dias === 0) return `há ${h} h`
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === hoje.getFullYear() ? undefined : 'numeric',
  })
}
export function iconeLista(nome, props) {
  const n = nome.toLowerCase()
  if (/mercad|compra|feira|supermercado/.test(n)) return <ShoppingCart {...props} />
  if (/farm[aá]cia|rem[eé]dio|medic/.test(n)) return <Pill {...props} />
  if (/tarefa|fazer|dia/.test(n)) return <ListTodo {...props} />
  if (/presente|anivers/.test(n)) return <Gift {...props} />
  if (/viagem|mala/.test(n)) return <Plane {...props} />
  if (/casa|limpeza/.test(n)) return <House {...props} />
  return <ListChecks {...props} />
}
