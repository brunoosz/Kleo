import {
  Laptop,
  Stethoscope,
  HardHat,
  GraduationCap,
  Briefcase,
  Scale,
  ShoppingBag,
  Palette,
  Truck,
  Hammer,
  Sprout,
  ChefHat,
  Sparkles,
  User,
  Eye,
  EarOff,
  Accessibility,
  PersonStanding,
  Check,
} from 'lucide-react'
import tecnologia from './prof/tecnologia'
import saude from './prof/saude'
import engenharia from './prof/engenharia'
import educacao from './prof/educacao'
import negocios from './prof/negocios'
import direito from './prof/direito'
import comercio from './prof/comercio'
import comunicacao from './prof/comunicacao'
import transporte from './prof/transporte'
import construcao from './prof/construcao'
import agricultura from './prof/agricultura'
import alimentacao from './prof/alimentacao'
import outras from './prof/outras'
import geral from './prof/geral'
export const CATEGORIAS = [
  {
    id: 'tecnologia',
    nome: 'Tecnologia',
    icone: Laptop,
    cor: 'lavanda',
  },
  {
    id: 'saude',
    nome: 'Saúde',
    icone: Stethoscope,
    cor: 'ceu',
  },
  {
    id: 'engenharia',
    nome: 'Engenharia e técnicos',
    icone: HardHat,
    cor: 'lima',
  },
  {
    id: 'educacao',
    nome: 'Educação',
    icone: GraduationCap,
    cor: 'mist',
  },
  {
    id: 'negocios',
    nome: 'Negócios e gestão',
    icone: Briefcase,
    cor: 'lavanda',
  },
  {
    id: 'direito',
    nome: 'Direito e segurança',
    icone: Scale,
    cor: 'ceu',
  },
  {
    id: 'comercio',
    nome: 'Comércio e atendimento',
    icone: ShoppingBag,
    cor: 'lima',
  },
  {
    id: 'comunicacao',
    nome: 'Comunicação e criatividade',
    icone: Palette,
    cor: 'mist',
  },
  {
    id: 'transporte',
    nome: 'Transporte e logística',
    icone: Truck,
    cor: 'lavanda',
  },
  {
    id: 'construcao',
    nome: 'Construção e manutenção',
    icone: Hammer,
    cor: 'ceu',
  },
  {
    id: 'agricultura',
    nome: 'Agro e meio ambiente',
    icone: Sprout,
    cor: 'lima',
  },
  {
    id: 'alimentacao',
    nome: 'Alimentação, esporte e bem-estar',
    icone: ChefHat,
    cor: 'mist',
  },
  {
    id: 'outras',
    nome: 'Beleza, cuidado e serviços',
    icone: Sparkles,
    cor: 'lavanda',
  },
  {
    id: 'geral',
    nome: 'Geral',
    icone: User,
    cor: 'ceu',
  },
]
export const PROFISSOES = [
  ...tecnologia,
  ...saude,
  ...engenharia,
  ...educacao,
  ...negocios,
  ...direito,
  ...comercio,
  ...comunicacao,
  ...transporte,
  ...construcao,
  ...agricultura,
  ...alimentacao,
  ...outras,
  ...geral,
].map(p => ({
  ...p,
  icon: p.icone,
}))
export const NECESSIDADES = [
  {
    id: 'visual',
    label: 'Visão reduzida',
    pergunta: 'Enxergo pouco',
    efeito: 'Leio as telas em voz alta e deixo as letras maiores.',
    icon: Eye,
    icone: Eye,
  },
  {
    id: 'auditiva',
    label: 'Audição reduzida',
    pergunta: 'Ouço pouco',
    efeito: 'A tela pisca nos avisos e os áudios viram texto.',
    icon: EarOff,
    icone: EarOff,
  },
  {
    id: 'cadeirante',
    label: 'Mobilidade reduzida',
    pergunta: 'Uso cadeira de rodas ou tenho dificuldade para andar',
    efeito: 'O mapa já abre com o caminho sem escadas.',
    icon: Accessibility,
    icone: Accessibility,
  },
]
export const SEM_NECESSIDADE = {
  id: 'nenhuma',
  label: 'Nenhuma',
  pergunta: 'Não preciso',
  efeito: 'Deixo tudo no jeito padrão.',
  icon: Check,
  icone: Check,
}
const NECESSIDADES_LEGADO = [
  {
    id: 'idoso',
    label: '60 anos ou mais',
    icon: PersonStanding,
    icone: PersonStanding,
  },
  SEM_NECESSIDADE,
]
const MIGRACAO = {
  saude: 'enfermeiro',
  autonomo: 'empreendedor',
}
const POR_ID = new Map(PROFISSOES.map(p => [p.id, p]))
const OUTRO = () => POR_ID.get('outro') || PROFISSOES[PROFISSOES.length - 1]
export const getProfissao = id => {
  const real = MIGRACAO[id] || id
  return POR_ID.get(real) || OUTRO()
}
export const getNecessidade = id =>
  NECESSIDADES.find(n => n.id === id) || NECESSIDADES_LEGADO.find(n => n.id === id)
export const getNecessidades = perfil => {
  const ids = Array.isArray(perfil?.necessidades) ? perfil.necessidades : [perfil?.necessidade]
  return NECESSIDADES.filter(n => ids.includes(n.id))
}
export const getCategoria = id => CATEGORIAS.find(c => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1]
const normalizar = t => (t || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
export const buscarProfissoes = texto => {
  const q = normalizar(texto)
  if (!q) return PROFISSOES
  const termos = q.split(/\s+/).filter(Boolean)
  const resultado = []
  PROFISSOES.forEach(p => {
    const nome = normalizar(p.label)
    const sinonimos = (p.sinonimos || []).map(normalizar)
    const tudo = [nome, ...sinonimos, normalizar(p.id)].join(' | ')
    if (!termos.every(t => tudo.includes(t))) return
    let pontos = 3
    if (nome.startsWith(q)) pontos = 0
    else if (nome.includes(q)) pontos = 1
    else if (sinonimos.some(s => s.startsWith(q))) pontos = 2
    resultado.push({
      p,
      pontos,
    })
  })
  return resultado
    .sort((a, b) => a.pontos - b.pontos || a.p.label.localeCompare(b.p.label, 'pt-BR'))
    .map(r => r.p)
}
export const profissoesDoUsuario = profile => {
  const principal = getProfissao(profile?.profissao)
  const lista = [principal]
  ;(profile?.profissoesExtras || []).forEach(id => {
    const p = getProfissao(id)
    if (!lista.some(x => x.id === p.id)) lista.push(p)
  })
  return lista
}
export const ATALHOS_PROFISSAO = Object.fromEntries([
  ...PROFISSOES.map(p => [p.id, p.atalhos || []]),
  ...Object.entries(MIGRACAO).map(([antigo, novo]) => [antigo, POR_ID.get(novo)?.atalhos || []]),
])
