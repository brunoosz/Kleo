import { Accessibility, Type, Contrast, Volume2, Zap, Captions, Route } from 'lucide-react'
import { ler, salvar } from './storage'
import { getProfissao } from '../data/profissoes'
export const IDADE_IDOSO = 60
export const FAIXAS_IDADE = [
  {
    id: 'Até 17',
    rotulo: 'Menos de 18',
    min: 1,
    max: 17,
    frase: 'menos de 18 anos',
  },
  {
    id: '18–35',
    rotulo: '18 a 35',
    min: 18,
    max: 35,
    frase: 'entre 18 e 35 anos',
  },
  {
    id: '36–59',
    rotulo: '36 a 59',
    min: 36,
    max: 59,
    frase: 'entre 36 e 59 anos',
  },
  {
    id: '60+',
    rotulo: '60 ou mais',
    min: 60,
    max: 120,
    frase: '60 anos ou mais',
  },
]
const NEC_VALIDAS = ['visual', 'auditiva', 'cadeirante']
const ALIAS_NEC = {
  mobilidade: 'cadeirante',
  motora: 'cadeirante',
  surdo: 'auditiva',
  surdez: 'auditiva',
  cego: 'visual',
  baixa_visao: 'visual',
}
const CHAVE_PERFIL = 'kleo_profile'
const CHAVE_ORIGEM = 'kleo_config_origem'
const CHAVE_MEMORIA = 'kleo_memory'
const CHAVE_MEMORIA_PERFIL = 'kleo_memoria_perfil'
export const CHAVE_SOBRE_VOCE = 'Sobre você'
const ehObjeto = v => !!v && typeof v === 'object' && !Array.isArray(v)
export function idadeValida(n) {
  const v = Number(n)
  return Number.isFinite(v) && v >= 1 && v <= 120
}
export function faixaDaIdade(idade) {
  if (!idadeValida(idade)) return ''
  const v = Math.round(Number(idade))
  return (FAIXAS_IDADE.find(f => v >= f.min && v <= f.max) || FAIXAS_IDADE[FAIXAS_IDADE.length - 1]).id
}
export function idadeDo(perfil) {
  return ehObjeto(perfil) && idadeValida(perfil.idade) ? Math.round(Number(perfil.idade)) : null
}
export function faixaDo(perfil) {
  if (!ehObjeto(perfil)) return ''
  const idade = idadeDo(perfil)
  if (idade) return faixaDaIdade(idade)
  if (FAIXAS_IDADE.some(f => f.id === perfil.age)) return perfil.age
  return perfil.necessidade === 'idoso' ? '60+' : ''
}
export function textoIdade(perfil) {
  const idade = idadeDo(perfil)
  if (idade) return `${idade} ${idade === 1 ? 'ano' : 'anos'}`
  return FAIXAS_IDADE.find(f => f.id === faixaDo(perfil))?.frase || ''
}
export function ehIdoso(perfil) {
  return faixaDo(perfil) === '60+'
}
export function necessidadesDo(perfil) {
  if (!ehObjeto(perfil)) return []
  const brutas = Array.isArray(perfil.necessidades) ? perfil.necessidades : [perfil.necessidade]
  const ids = new Set(brutas.map(n => ALIAS_NEC[n] || n))
  return NEC_VALIDAS.filter(id => ids.has(id))
}
export function temNecessidade(perfil, id) {
  return necessidadesDo(perfil).includes(ALIAS_NEC[id] || id)
}
export function normalizarPerfil(bruto) {
  if (!ehObjeto(bruto)) return null
  const p = {
    ...bruto,
  }
  const idade = idadeDo(p)
  p.age = faixaDo(p)
  p.idade = idade
  p.necessidades = necessidadesDo(p)
  p.necessidade = p.necessidades[0] || 'nenhuma'
  return p
}
export function lerPerfil() {
  return normalizarPerfil(ler(CHAVE_PERFIL, null))
}
export function perfilCompleto(perfil = lerPerfil()) {
  return (
    ehObjeto(perfil) && !!(perfil.createdAt || perfil.onboardingFeito) && !!String(perfil.name || '').trim()
  )
}
export const precisaOnboarding = () => !perfilCompleto()
export function salvarPerfil(parcial = {}) {
  const atual = ler(CHAVE_PERFIL, null)
  const junto = {
    ...(ehObjeto(atual) ? atual : {}),
    ...(ehObjeto(parcial) ? parcial : {}),
  }
  if (Array.isArray(parcial?.necessidades)) delete junto.necessidade
  else if (typeof parcial?.necessidade === 'string') junto.necessidades = [parcial.necessidade]
  if (
    parcial &&
    'age' in parcial &&
    !('idade' in parcial) &&
    idadeValida(junto.idade) &&
    faixaDaIdade(junto.idade) !== parcial.age
  ) {
    junto.idade = null
  }
  const novo = normalizarPerfil(junto)
  salvar(CHAVE_PERFIL, novo)
  try {
    window.dispatchEvent(
      new CustomEvent('kleo-perfil', {
        detail: novo,
      }),
    )
  } catch {}
  return novo
}
export const AJUSTES_PERFIL = [
  {
    chave: 'kleo_modo_simples',
    rotulo: 'Modo simples',
    detalhe: 'Letras e botões maiores, só o essencial',
    icone: Accessibility,
    regra: p => ehIdoso(p),
  },
  {
    chave: 'kleo_fonte_grande',
    rotulo: 'Letras grandes',
    detalhe: 'Tudo um pouco maior',
    icone: Type,
    regra: p => ehIdoso(p) || temNecessidade(p, 'visual'),
  },
  {
    chave: 'kleo_alto_contraste',
    rotulo: 'Alto contraste',
    detalhe: 'Textos e bordas mais escuros',
    icone: Contrast,
    regra: p => temNecessidade(p, 'visual') || temNecessidade(p, 'auditiva'),
  },
  {
    chave: 'kleo_leitura_voz',
    rotulo: 'Leitura em voz alta',
    detalhe: 'A Kleo lê avisos, respostas e mensagens',
    icone: Volume2,
    regra: p => temNecessidade(p, 'visual'),
  },
  {
    chave: 'kleo_avisos_visuais',
    rotulo: 'Avisos piscando na tela',
    detalhe: 'A tela pisca nos lembretes e avisos',
    icone: Zap,
    regra: p => temNecessidade(p, 'auditiva'),
  },
  {
    chave: 'kleo_transcricao_auto',
    rotulo: 'Áudios viram texto',
    detalhe: 'Mensagens de voz aparecem escritas',
    icone: Captions,
    regra: p => temNecessidade(p, 'auditiva'),
  },
  {
    chave: 'kleo_mapa_acessivel',
    rotulo: 'Rota sem escadas',
    detalhe: 'O mapa já abre com a rota acessível',
    icone: Route,
    regra: p => temNecessidade(p, 'cadeirante'),
  },
]
const ajusteDa = chave => AJUSTES_PERFIL.find(a => a.chave === chave)
function lerOrigem() {
  const o = ler(CHAVE_ORIGEM, null)
  return ehObjeto(o) ? o : {}
}
export function origemAjuste(chave) {
  return lerOrigem()[chave] === 'manual' ? 'manual' : 'auto'
}
export const temAjusteManual = () => AJUSTES_PERFIL.some(a => origemAjuste(a.chave) === 'manual')
export function sugestoesDoPerfil(perfil) {
  const p = normalizarPerfil(perfil)
  return Object.fromEntries(AJUSTES_PERFIL.map(a => [a.chave, !!(p && a.regra(p))]))
}
export function ajusteEfetivo(chave, perfil = lerPerfil()) {
  const v = ler(chave, null)
  if (typeof v === 'boolean') return v
  const a = ajusteDa(chave)
  const p = normalizarPerfil(perfil)
  return !!(a && p && a.regra(p))
}
export const leituraVozAtiva = perfil =>
  ajusteEfetivo('kleo_leitura_voz', perfil === undefined ? lerPerfil() : perfil)
export const avisosVisuaisAtivos = perfil =>
  ajusteEfetivo('kleo_avisos_visuais', perfil === undefined ? lerPerfil() : perfil)
export const transcricaoAutoAtiva = perfil =>
  ajusteEfetivo('kleo_transcricao_auto', perfil === undefined ? lerPerfil() : perfil)
export const rotaAcessivelPadrao = perfil =>
  ajusteEfetivo('kleo_mapa_acessivel', perfil === undefined ? lerPerfil() : perfil)
export function modoSimplesEfetivo(valor, perfil) {
  if (valor === true) return true
  if (valor === false) return false
  return ehIdoso(perfil)
}
export function aplicarPerfil(perfil = lerPerfil()) {
  const p = normalizarPerfil(perfil)
  const origem = lerOrigem()
  const mudancas = []
  const mantidos = []
  for (const a of AJUSTES_PERFIL) {
    const sugerido = !!(p && a.regra(p))
    const atual = ler(a.chave, null)
    if (origem[a.chave] === 'manual' && typeof atual === 'boolean') {
      if (atual !== sugerido)
        mantidos.push({
          chave: a.chave,
          rotulo: a.rotulo,
          icone: a.icone,
          valor: atual,
          sugerido,
        })
      continue
    }
    if (atual !== sugerido) {
      salvar(a.chave, sugerido)
      mudancas.push({
        chave: a.chave,
        rotulo: a.rotulo,
        icone: a.icone,
        antes: atual,
        depois: sugerido,
      })
    }
  }
  return {
    mudancas,
    mantidos,
    ligados: ajustesLigados(p),
  }
}
export function ajustesLigados(perfil = lerPerfil()) {
  return AJUSTES_PERFIL.filter(a => ajusteEfetivo(a.chave, perfil))
}
export function definirAjusteManual(chave, valor) {
  salvar(chave, !!valor)
  salvar(CHAVE_ORIGEM, {
    ...lerOrigem(),
    [chave]: 'manual',
  })
}
export function voltarAoAutomatico(chaves = AJUSTES_PERFIL.map(a => a.chave)) {
  const origem = {
    ...lerOrigem(),
  }
  chaves.forEach(c => {
    delete origem[c]
  })
  salvar(CHAVE_ORIGEM, origem)
  return aplicarPerfil()
}
export function migrarPerfilSalvo() {
  const bruto = ler(CHAVE_PERFIL, null)
  if (
    ehObjeto(bruto) &&
    (!Array.isArray(bruto.necessidades) || !('idade' in bruto) || bruto.necessidade === 'idoso')
  ) {
    salvar(CHAVE_PERFIL, normalizarPerfil(bruto))
  }
  if (ler(CHAVE_ORIGEM, null) === null) {
    const origem = {}
    if (ehObjeto(bruto))
      AJUSTES_PERFIL.forEach(a => {
        if (typeof ler(a.chave, null) === 'boolean') origem[a.chave] = 'manual'
      })
    salvar(CHAVE_ORIGEM, origem)
    if (ehObjeto(bruto)) aplicarPerfil(normalizarPerfil(bruto))
  }
}
const FRASE_NEC = {
  visual: 'Enxerga pouco: prefere ouvir as respostas e letras grandes.',
  auditiva: 'Ouve pouco: prefere avisos na tela e tudo por escrito, sem depender de som.',
  cadeirante: 'Usa cadeira de rodas ou tem dificuldade para andar: prefere caminhos sem escadas.',
}
const primeiroNome = p =>
  String(p?.name || '')
    .trim()
    .split(/\s+/)[0] || ''
function cidadeDo(p) {
  const uf = p?.uf || p?.estado || ''
  const city = String(p?.city || '').trim()
  return city ? `${city}${uf && !city.includes(uf) ? ' - ' + uf : ''}` : uf
}
function nomeProfissao(id) {
  if (!id) return ''
  try {
    return getProfissao(id)?.label || ''
  } catch {
    return ''
  }
}
export function frasesSobreVoce(perfil = lerPerfil()) {
  const p = normalizarPerfil(perfil)
  if (!p) return []
  const nome = String(p.name || '').trim()
  const idade = textoIdade(p)
  const frases = []
  if (nome && idade) frases.push(`${nome} tem ${idade}.`)
  else if (nome) frases.push(`Se chama ${nome}.`)
  else if (idade) frases.push(`Tem ${idade}.`)
  const cidade = cidadeDo(p)
  if (cidade) frases.push(`Mora em ${cidade}.`)
  const prof = p.profissao && p.profissao !== 'outro' ? nomeProfissao(p.profissao) : ''
  if (prof) frases.push(`Profissão: ${prof}.`)
  const extras = (Array.isArray(p.profissoesExtras) ? p.profissoesExtras : [])
    .filter(id => id && id !== p.profissao)
    .map(nomeProfissao)
    .filter(Boolean)
  if (extras.length) frases.push(`Também trabalha como ${extras.join(', ')}.`)
  p.necessidades.forEach(n => {
    if (FRASE_NEC[n]) frases.push(FRASE_NEC[n])
  })
  if (modoSimplesEfetivo(ler('kleo_modo_simples', null), p))
    frases.push('Prefere o app simples, com letras e botões grandes.')
  return frases
}
export function memoriaDoPerfil(perfil = lerPerfil()) {
  const frases = frasesSobreVoce(perfil)
  const salvo = ler(CHAVE_MEMORIA, {})
  const mem = ehObjeto(salvo) ? salvo : {}
  const anterior = ler(CHAVE_MEMORIA_PERFIL, null)
  const geradasAntes = Array.isArray(anterior?.frases) ? anterior.frases : []
  let resto = typeof mem[CHAVE_SOBRE_VOCE] === 'string' ? mem[CHAVE_SOBRE_VOCE] : ''
  for (const f of [...geradasAntes, ...frases]) {
    const i = f ? resto.indexOf(f) : -1
    if (i >= 0) resto = resto.slice(0, i) + resto.slice(i + f.length)
  }
  resto = resto.replace(/\s+/g, ' ').trim()
  const texto = [...frases, resto].filter(Boolean).join(' ')
  const outras = Object.fromEntries(Object.entries(mem).filter(([k]) => k !== CHAVE_SOBRE_VOCE))
  salvar(
    CHAVE_MEMORIA,
    texto
      ? {
          [CHAVE_SOBRE_VOCE]: texto,
          ...outras,
        }
      : outras,
  )
  salvar(CHAVE_MEMORIA_PERFIL, {
    frases,
  })
  return texto
}
const NEC_IA = {
  visual: 'enxerga pouco (deficiência visual)',
  auditiva: 'ouve pouco (deficiência auditiva)',
  cadeirante: 'usa cadeira de rodas ou tem dificuldade para andar',
}
export function textoPerfilParaIA(perfil = lerPerfil(), { mascote = '' } = {}) {
  const p = normalizarPerfil(perfil) || {
    necessidades: [],
  }
  const simples = modoSimplesEfetivo(ler('kleo_modo_simples', null), p)
  const leitura = ajusteEfetivo('kleo_leitura_voz', p)
  const nome = String(p.name || '').trim()
  const genero = p.gender === 'Outro' ? p.genderCustom || 'outro' : p.gender || 'não informado'
  const extras = (Array.isArray(p.profissoesExtras) ? p.profissoesExtras : [])
    .map(nomeProfissao)
    .filter(Boolean)
  const linhas = [
    'PERFIL DA PESSOA',
    `- Nome: ${nome || 'desconhecido'}`,
    `- Gênero: ${genero}`,
    `- Idade: ${textoIdade(p) || 'não informada'}`,
    `- Cidade: ${cidadeDo(p) || 'não informada'}`,
    `- Profissão principal: ${nomeProfissao(p.profissao) || 'não informada'}`,
    extras.length ? `- Outras profissões: ${extras.join(', ')}` : null,
    `- Necessidades: ${p.necessidades.length ? p.necessidades.map(n => NEC_IA[n]).join('; ') : 'nenhuma'}`,
    mascote ? `- Mascote atual: ${mascote}` : null,
    `- Modo simples: ${simples ? 'ligado' : 'desligado'}`,
    `- Leitura em voz alta: ${leitura ? 'ligada' : 'desligada'}`,
  ]
  const adapt = []
  if (temNecessidade(p, 'visual'))
    adapt.push(
      'A pessoa enxerga pouco: respostas curtas e descritivas, sem depender de elementos visuais, pensadas para serem ouvidas.',
    )
  if (temNecessidade(p, 'auditiva'))
    adapt.push(
      'A pessoa ouve pouco: respostas claras em texto, sem referências a sons. Os avisos aparecem piscando na tela.',
    )
  if (temNecessidade(p, 'cadeirante'))
    adapt.push(
      'A pessoa usa cadeira de rodas ou tem dificuldade para andar: em lugares e trajetos priorize acessibilidade (rampas, elevadores, rota sem escadas do mapa, que já vem ligada) e use "| acessivel" no NAVEGAR.',
    )
  if (ehIdoso(p))
    adapt.push('A pessoa tem 60 anos ou mais: tenha paciência e carinho, sem tratar como criança.')
  if (simples)
    adapt.push(
      'MODO SIMPLES ligado: palavras do dia a dia, frases bem curtas, nada de termos técnicos ou em inglês. Um passo de cada vez.',
    )
  return [...linhas.filter(Boolean), ...adapt].join('\n')
}
export function perfilParaServidor(perfil = lerPerfil()) {
  const p = normalizarPerfil(perfil)
  if (!p) return null
  const origem = lerOrigem()
  const manuais = Object.fromEntries(
    AJUSTES_PERFIL.filter(a => origem[a.chave] === 'manual' && typeof ler(a.chave, null) === 'boolean').map(
      a => [a.chave, ler(a.chave, null)],
    ),
  )
  const {
    name,
    idade,
    age,
    necessidades,
    city,
    cityCoords,
    profissao,
    profissoesExtras,
    gender,
    genderCustom,
    createdAt,
  } = p
  return {
    versao: 2,
    perfil: {
      name,
      idade,
      age,
      necessidades,
      city,
      cityCoords,
      profissao,
      profissoesExtras,
      gender,
      genderCustom,
      createdAt,
    },
    manuais,
  }
}
export function perfilDoServidor(preferencias) {
  const dados = ehObjeto(preferencias?.perfil)
    ? preferencias.perfil
    : ehObjeto(preferencias)
      ? preferencias
      : null
  if (!dados) return null
  const novo = salvarPerfil(dados)
  if (ehObjeto(preferencias?.manuais)) {
    Object.entries(preferencias.manuais).forEach(([chave, valor]) => {
      if (ajusteDa(chave)) definirAjusteManual(chave, valor)
    })
  }
  aplicarPerfil(novo)
  memoriaDoPerfil(novo)
  return novo
}
export function salvarEAplicarPerfil(parcial) {
  const antes = Object.fromEntries(AJUSTES_PERFIL.map(a => [a.chave, ajusteEfetivo(a.chave)]))
  const perfil = salvarPerfil(parcial)
  const { mantidos, ligados } = aplicarPerfil(perfil)
  memoriaDoPerfil(perfil)
  const mudancas = AJUSTES_PERFIL.filter(a => antes[a.chave] !== ajusteEfetivo(a.chave, perfil)).map(a => ({
    chave: a.chave,
    rotulo: a.rotulo,
    icone: a.icone,
    antes: antes[a.chave],
    depois: ajusteEfetivo(a.chave, perfil),
  }))
  return {
    perfil,
    mudancas,
    mantidos,
    ligados,
  }
}
function aoGravarPerfil(e) {
  if (e?.detail !== CHAVE_PERFIL) return
  try {
    const p = lerPerfil()
    if (!perfilCompleto(p)) return
    aplicarPerfil(p)
    memoriaDoPerfil(p)
  } catch {}
}
if (typeof window !== 'undefined') {
  try {
    migrarPerfilSalvo()
  } catch {}
  if (window.__kleoOuvintePerfil) window.removeEventListener('kleo-storage', window.__kleoOuvintePerfil)
  window.__kleoOuvintePerfil = aoGravarPerfil
  window.addEventListener('kleo-storage', aoGravarPerfil)
}
export { primeiroNome }
