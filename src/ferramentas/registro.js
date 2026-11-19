import {
  ChefHat,
  Timer,
  CalendarClock,
  CloudSun,
  Sprout,
  ClipboardList,
  Brain,
  TimerReset,
  Calculator,
  ListChecks,
  Sparkles,
  ScanSearch,
  Wallet,
  Users,
  Package,
  Hash,
  FileText,
  Languages,
  Dumbbell,
  Route,
  Wind,
} from 'lucide-react'
import Receitas from './Receitas'
import Temporizadores from './Temporizadores'
import Escala from './Escala'
import Clima from './Clima'
import Plantio from './Plantio'
import Manejo from './Manejo'
import Pomodoro from './Pomodoro'
import Cronometro from './Cronometro'
import Calculadora from './Calculadora'
import Checklist from './Checklist'
import Assistente from './Assistente'
import CameraIA from './CameraIA'
import Caixa from './Caixa'
import Clientes from './Clientes'
import Estoque from './Estoque'
import Contador from './Contador'
import Orcamento from './Orcamento'
import Tradutor from './Tradutor'
import Treinos from './Treinos'
import Paradas from './Paradas'
import Respiracao from './Respiracao'
import { CALCULADORAS } from './calculadoras'
export const FERRAMENTAS = {
  receitas: {
    nome: 'Receitas',
    icone: ChefHat,
    descricao: 'Receitas com IA, modo cozinhar e lista de compras.',
    componente: Receitas,
  },
  temporizadores: {
    nome: 'Temporizadores',
    icone: Timer,
    descricao: 'Vários alarmes ao mesmo tempo, que tocam em qualquer tela.',
    componente: Temporizadores,
  },
  escala: {
    nome: 'Escala',
    icone: CalendarClock,
    descricao: 'Turnos, plantões ou aulas da semana, direto na agenda.',
    componente: Escala,
  },
  clima: {
    nome: 'Clima',
    icone: CloudSun,
    descricao: 'Previsão de 7 dias com dicas para o seu trabalho.',
    componente: Clima,
  },
  plantio: {
    nome: 'Plantio',
    icone: Sprout,
    descricao: 'Calendário de plantio e previsão de colheita.',
    componente: Plantio,
  },
  manejo: {
    nome: 'Manejo',
    icone: ClipboardList,
    descricao: 'Lembretes que se repetem: irrigação, vacinas, adubação.',
    componente: Manejo,
  },
  pomodoro: {
    nome: 'Pomodoro',
    icone: Brain,
    descricao: 'Ciclos de foco e pausa com alarme.',
    componente: Pomodoro,
  },
  cronometro: {
    nome: 'Cronômetro',
    icone: TimerReset,
    descricao: 'Cronômetro com voltas que continua contando.',
    componente: Cronometro,
  },
  calculadora: {
    nome: 'Calculadora',
    icone: Calculator,
    descricao: 'Contas prontas do seu trabalho, com explicação.',
    componente: Calculadora,
  },
  checklist: {
    nome: 'Checklist',
    icone: ListChecks,
    descricao: 'Lista de verificação para não esquecer nada.',
    componente: Checklist,
  },
  assistente: {
    nome: 'Assistente',
    icone: Sparkles,
    descricao: 'A Kleo escreve, revisa e explica para você.',
    componente: Assistente,
  },
  camera_ia: {
    nome: 'Câmera inteligente',
    icone: ScanSearch,
    descricao: 'Tire uma foto e a Kleo analisa.',
    componente: CameraIA,
  },
  caixa: {
    nome: 'Caixa',
    icone: Wallet,
    descricao: 'Entradas, saídas e saldo do dia e do mês.',
    componente: Caixa,
  },
  clientes: {
    nome: 'Clientes',
    icone: Users,
    descricao: 'Contatos, anotações e próximo retorno.',
    componente: Clientes,
  },
  estoque: {
    nome: 'Estoque',
    icone: Package,
    descricao: 'Quantidades e alerta de reposição.',
    componente: Estoque,
  },
  contador: {
    nome: 'Contador',
    icone: Hash,
    descricao: 'Contagem por toque, grande e rápida.',
    componente: Contador,
  },
  orcamento: {
    nome: 'Orçamento',
    icone: FileText,
    descricao: 'Monte e envie orçamentos pelo WhatsApp.',
    componente: Orcamento,
  },
  tradutor: {
    nome: 'Tradutor',
    icone: Languages,
    descricao: 'Tradução por IA com voz.',
    componente: Tradutor,
  },
  treinos: {
    nome: 'Treinos',
    icone: Dumbbell,
    descricao: 'Fichas de treino por aluno com séries e carga.',
    componente: Treinos,
  },
  paradas: {
    nome: 'Paradas',
    icone: Route,
    descricao: 'Entregas e visitas do dia com navegação.',
    componente: Paradas,
  },
  respiracao: {
    nome: 'Respiração',
    icone: Wind,
    descricao: 'Exercício guiado para acalmar e focar.',
    componente: Respiracao,
  },
}
export const getFerramenta = id => FERRAMENTAS[id] || null
export function infoFerramenta(id, config = {}) {
  const f = getFerramenta(id)
  if (!f) return null
  const c = config || {}
  if (id === 'calculadora' && CALCULADORAS[c.tipo])
    return {
      ...f,
      nome: CALCULADORAS[c.tipo].nome,
      icone: CALCULADORAS[c.tipo].icone,
      descricao: CALCULADORAS[c.tipo].explicacao,
    }
  if ((id === 'checklist' || id === 'assistente' || id === 'camera_ia') && c.titulo)
    return {
      ...f,
      nome: c.titulo,
    }
  if (
    (id === 'clientes' || id === 'estoque' || id === 'contador' || id === 'orcamento' || id === 'escala') &&
    c.rotulo
  )
    return {
      ...f,
      nome: c.rotulo,
    }
  return f
}
export { CALCULADORAS }
