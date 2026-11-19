const semAcento = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const PREP = String.raw`(?:ate (?:o |a |os |as )?|pr[ao]s? |pra (?:o |a )?|para (?:o |a |os |as )?|ao |aos |a |as |na |no |nas |nos |num |numa |em )`
const PADROES = [
  new RegExp(
    String.raw`^(?:eu )?(?:quero|qro|qero|qr|queria|quer|preciso|precisava|vou|vamos|bora|gostaria de|tenho que|tenho de)(?: (?:ir|chegar|passar|dar uma passada|dar um pulo))+ ${PREP}(.+)$`,
  ),
  new RegExp(String.raw`^(?:eu )?(?:vou|vamos|bora) ${PREP}(.+)$`),
  new RegExp(String.raw`^(?:me |nos )?(?:leva|levar|leve|guia|guie|guiar)(?: me)? ${PREP}(.+)$`),
  new RegExp(String.raw`^como (?:eu )?(?:chego|faco para chegar|faco pra chegar|vou) ${PREP}(.+)$`),
  /^(?:onde|aonde|cade) (?:tem|fica|acho|encontro|e|eh|ha|existe)(?: um| uma| o| a)? (.+)$/,
  /^(?:procura|procure|procurar|busca|busque|buscar|ache|acha|achar|encontra|encontre|encontrar)(?: pra mim| para mim)?(?: um| uma| o| a| os| as)? (.+)$/,
  /^(?:tem|existe)(?: um| uma| algum| alguma)? (.+?) (?:aqui )?(?:perto|proximo|por aqui).*$/,
  /^(?:o |a |um |uma )?(.+?) mais (?:perto|proxim[oa]).*$/,
]
const NAO_LUGAR =
  /^(dormir|embora|trabalhar|comer|almocar|jantar|tomar banho|descansar|deitar|sair|la|ali|aqui|casa dela|casa dele)$/
function limpar(x) {
  return x
    .replace(/[?!.,;]+$/g, '')
    .replace(
      /\s+(?:mais )?(?:perto|proxim[oa])(?: (?:daqui|de mim|de casa|de onde estou))?(?: por favor)?$/,
      '',
    )
    .replace(/\s+(?:aqui )?(?:perto|por aqui|daqui)$/, '')
    .replace(/\s+(?:por favor|pf|pfv|agora|hoje)$/, '')
    .replace(/\s+aqui$/, '')
    .replace(/^(?:o|a|os|as|um|uma|algum|alguma) /, '')
    .trim()
}
export function pedidoDeLugar(texto) {
  const original = String(texto || '').trim()
  if (!original || original.length > 90 || original.includes('\n')) return null
  const t = semAcento(original)
    .replace(/[?!.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  for (const re of PADROES) {
    const m = t.match(re)
    if (!m) continue
    const alvo = limpar(m[1])
    if (alvo.length < 2 || alvo.split(' ').length > 7 || NAO_LUGAR.test(alvo)) return null
    const inicio = semAcento(original).lastIndexOf(alvo)
    return inicio >= 0 ? original.slice(inicio, inicio + alvo.length).trim() : alvo
  }
  return null
}
const ORDINAIS = [
  ['primeir', 'um', 'uma', '1'],
  ['segund', 'dois', 'duas', '2'],
  ['terceir', 'tres', '3'],
  ['quart', 'quatro', '4'],
  ['quint', 'cinco', '5'],
]
export function escolhaDeOpcao(texto, lugares) {
  if (!Array.isArray(lugares) || !lugares.length) return null
  const t = semAcento(texto)
    .replace(/[?!.,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length > 50) return null
  const m = t.match(
    /^(?:(?:quero|qro|vou|vamos|escolho|prefiro|pode ser|manda|me leva(?: na| no| pra| para)?|leva(?: na| no)?)\s+)?(?:(?:a|o|na|no|pela|pelo)\s+)?(?:opcao\s+|numero\s+|n\s*)?(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|um|uma|dois|duas|tres|quatro|cinco|[1-5])(?:\s+opcao)?$/,
  )
  if (m) {
    const i = ORDINAIS.findIndex(o => o.some(p => m[1].startsWith(p)))
    return lugares[i] || null
  }
  const porNome = lugares.filter(l => {
    const n = semAcento(l.nome)
    return n.length >= 3 && (t === n || t.endsWith(' ' + n) || (t.length >= 4 && n.startsWith(t)))
  })
  return porNome.length === 1 ? porNome[0] : null
}
