import { ler, salvar } from './storage'
import { urlApi, servidorConfigurado } from './api'
import { resolverMascote, generoDoMascote } from '../data/mascotes'
try {
  for (const k of ['kleo_eleven_key', 'kleo_eleven_modelo'])
    if (localStorage.getItem(k) !== null) localStorage.removeItem(k)
} catch {}
let audioAtual = null
let geracao = 0
const ctrls = new Set()
let utterAtual = null
export const VELOCIDADES = [
  {
    id: 'devagar',
    rotulo: 'Devagar',
    nativa: 0.85,
    natural: 0.85,
  },
  {
    id: 'normal',
    rotulo: 'Normal',
    nativa: 1.05,
    natural: 1,
  },
  {
    id: 'rapida',
    rotulo: 'Rápida',
    nativa: 1.25,
    natural: 1.15,
  },
]
const velocidade = () =>
  VELOCIDADES.find(v => v.id === ler('kleo_voz_velocidade', 'normal')) || VELOCIDADES[1]
const estadoServidor = {
  ok: null,
  em: 0,
  pendente: null,
  desligada: false,
  semCotaEm: 0,
}
const RECHECAR_MS = 5 * 60 * 1000
const COTA_MS = 10 * 60 * 1000
const CHAVE_APARELHO = 'kleo_voz_aparelho'
export const vozAparelhoLiberada = () => ler(CHAVE_APARELHO, false) === true
export function definirVozAparelho(ligada) {
  salvar(CHAVE_APARELHO, !!ligada)
}
export const vozSemCota = () => !!estadoServidor.semCotaEm && Date.now() - estadoServidor.semCotaEm < COTA_MS
let avisoCotaEm = 0
function avisarSemCota() {
  if (Date.now() - avisoCotaEm < COTA_MS) return
  avisoCotaEm = Date.now()
  window.dispatchEvent(
    new CustomEvent('kleo-voz-sem-cota', {
      detail: {
        aparelho: vozAparelhoLiberada(),
      },
    }),
  )
}
function lerAparelho(v) {
  if (typeof v === 'boolean') definirVozAparelho(v)
}
const marcarServidor = ok => {
  estadoServidor.ok = ok
  estadoServidor.em = Date.now()
}
export function vozNaturalProvavel() {
  if (!servidorConfigurado()) return false
  return estadoServidor.ok !== false || Date.now() - estadoServidor.em > RECHECAR_MS
}
export function verificarVozNatural({ forcar = false } = {}) {
  if (!servidorConfigurado()) return Promise.resolve(false)
  if (!forcar && estadoServidor.ok !== null && Date.now() - estadoServidor.em < RECHECAR_MS)
    return Promise.resolve(estadoServidor.ok)
  if (estadoServidor.pendente) return estadoServidor.pendente
  estadoServidor.pendente = fetch(urlApi('/api/voz'), {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(r => ((r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .then(j => {
      marcarServidor(!!j?.ok)
      lerAparelho(j?.aparelho)
      if (j?.semCota && !estadoServidor.semCotaEm) estadoServidor.semCotaEm = Date.now()
      if (j && !j.semCota) estadoServidor.semCotaEm = 0
      return !!j?.ok
    })
    .catch(() => {
      marcarServidor(false)
      return false
    })
    .finally(() => {
      estadoServidor.pendente = null
    })
  return estadoServidor.pendente
}
export const VOZES_PADRAO_ELEVEN = {
  f: [
    {
      voice_id: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Sarah',
    },
  ],
  m: [
    {
      voice_id: 'TX3LPaxmHKxFdv7VOQHJ',
      name: 'Liam',
    },
    {
      voice_id: 'nPczCjzI2devNBz1zQrb',
      name: 'Brian',
    },
  ],
}
const CHAVE_PADRAO = {
  f: 'kleo_voz_padrao_f',
  m: 'kleo_voz_padrao_m',
}
function semGrupos(t) {
  let antes
  do {
    antes = t
    t = t.replace(/\([^()]*\)|\[[^[\]]*\]|\{[^{}]*\}/g, ' ')
  } while (t !== antes)
  return t.replace(/[([{][^\n]*/g, ' ').replace(/[)\]}]/g, ' ')
}
function limparLinha(linha) {
  let l = linha
  if (/^[\s|:-]+$/.test(l) && l.includes('-') && l.includes('|')) return ''
  if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) return ''
  l = l.replace(/^\s{0,3}#{1,6}\s+/, '')
  l = l.replace(/^\s*>+\s?/, '')
  l = l.replace(/^\s*(?:[-*+•]|\d{1,3}[.)])\s+/, '')
  if (l.includes('|'))
    l = l
      .replace(/^\s*\||\|\s*$/g, '')
      .split('|')
      .map(c => c.trim())
      .filter(Boolean)
      .join(', ')
  return l
}
export function limparParaFala(texto) {
  let t = String(texto || '')
  t = t.replace(/```[\s\S]*?(?:```|$)/g, '\n')
  t = t.replace(/`[^`\n]*`?/g, ' ')
  t = t.replace(/\b(R|US)\$\s?(\d+(?:[.,]\d+)*)/g, (_, m, v) => `${v} ${m === 'R' ? 'reais' : 'dólares'}`)
  t = t.replace(/\$\$[\s\S]*?(?:\$\$|$)/g, ' ')
  t = t.replace(/\\\([\s\S]*?(?:\\\)|$)/g, ' ').replace(/\\\[[\s\S]*?(?:\\\]|$)/g, ' ')
  t = t.replace(/(^|[^\w$])\$[^$\n]+\$/g, '$1 ')
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  t = t.replace(/\[([^\]]+)\]\((?:https?:|www\.|\/|#)[^)]*\)/g, '$1')
  t = t.replace(/\b(?:https?:\/\/|www\.)\S+/gi, ' ')
  t = t.split('\n').map(limparLinha).join('\n')
  t = semGrupos(t)
  t = t
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => (/[.!?…:;,]$/.test(l) ? l : l + '.'))
    .join(' ')
  t = t.replace(/\*+|~~/g, ' ').replace(/[#>_]/g, ' ')
  t = t.replace(/->|=>|<-|→|←|⇒/g, ' ')
  t = t.replace(/(\D)\/|\/(\D)/g, '$1 $2')
  t = t.replace(/[=^×÷\\|<>≤≥≠≈∑√π∞]/g, ' ')
  t = t.replace(/\p{Extended_Pictographic}/gu, ' ')
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/\s+([.,!?;:…])/g, '$1')
  t = t.replace(/[,;:](?=[.!?…])/g, '')
  t = t.replace(/([.!?…])(?:\s*[.,;:])+/g, '$1')
  t = t.replace(/,(?:\s*,)+/g, ',')
  t = t.replace(/^[\s.,;:!?…-]+/, '').trim()
  return /[\p{L}\p{N}]/u.test(t) ? t : ''
}
export function mascoteAtual() {
  return resolverMascote(ler('kleo_profile', null), ler('kleo_mascote', null))
}
export function generoVoz(mascote) {
  return generoDoMascote(mascote || mascoteAtual())
}
export function vozPadraoGenero(genero) {
  const g = genero === 'm' ? 'm' : 'f'
  return ler(CHAVE_PADRAO[g], '') || VOZES_PADRAO_ELEVEN[g][0].voice_id
}
export function salvarVozPadrao(genero, voiceId) {
  const g = genero === 'm' ? 'm' : 'f'
  salvar(CHAVE_PADRAO[g], voiceId || VOZES_PADRAO_ELEVEN[g][0].voice_id)
}
export function aplicarPadroesGenero() {
  salvar('kleo_vozes', {})
}
const NOMES_F = [
  'Francisca',
  'Thalita',
  'Luciana',
  'Maria',
  'Vitoria',
  'Vitória',
  'Leticia',
  'Letícia',
  'Yara',
  'Brenda',
  'Giovanna',
  'Manuela',
  'Elza',
  'Raquel',
  'Fernanda',
  'Joana',
  'Catarina',
  'Helena',
  'Female',
  'Feminina',
  'Google português do Brasil',
]
const NOMES_M = [
  'Antonio',
  'Antônio',
  'Daniel',
  'Donato',
  'Fabio',
  'Fábio',
  'Julio',
  'Júlio',
  'Humberto',
  'Nicolau',
  'Valerio',
  'Valério',
  'Duarte',
  'Felipe',
  'Male',
  'Masculino',
]
function melhorVozNativa(genero = 'f') {
  const vozes = window.speechSynthesis?.getVoices() || []
  const pt = vozes.filter(v => v.lang?.toLowerCase().startsWith('pt'))
  const br = pt.filter(v => /pt[-_]br/i.test(v.lang))
  const nomes = genero === 'm' ? NOMES_M : NOMES_F
  for (const lista of [br, pt]) {
    const doGenero = lista.filter(v => nomes.some(n => v.name.includes(n)))
    const natural = doGenero.find(v => /natural|online|neural/i.test(v.name))
    if (natural || doGenero[0])
      return {
        voz: natural || doGenero[0],
        casou: true,
      }
  }
  return {
    voz: br[0] || pt[0] || null,
    casou: false,
  }
}
export function vozAtiva() {
  return ler('kleo_voz', true) !== false
}
export function lerVozes() {
  const v = ler('kleo_vozes', {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}
export function salvarVozMascote(idMascote, voiceId) {
  const mapa = {
    ...lerVozes(),
  }
  if (voiceId) mapa[idMascote] = voiceId
  else delete mapa[idMascote]
  salvar('kleo_vozes', mapa)
}
export function vozUsada(mascote) {
  const id = mascote || mascoteAtual()
  const genero = generoDoMascote(id)
  const propria = lerVozes()[id]
  if (propria)
    return {
      voiceId: propria,
      origem: 'propria',
      genero,
    }
  return {
    voiceId: vozPadraoGenero(genero),
    origem: 'padrao',
    genero,
  }
}
export function vozDoMascote(mascote) {
  return vozUsada(mascote).voiceId
}
export function pararFala() {
  geracao++
  ctrls.forEach(c => c.abort())
  ctrls.clear()
  if (audioAtual) {
    audioAtual.pause()
    audioAtual = null
  }
  window.speechSynthesis?.cancel()
}
async function baixarEleven(fala, minha, mascote, vozForcada, insistir = false) {
  if (!fala || (!insistir && !vozNaturalProvavel())) return null
  const voiceId = vozForcada || vozDoMascote(mascote)
  const ctrl = new AbortController()
  ctrls.add(ctrl)
  try {
    const r = await fetch(urlApi('/api/voz'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        texto: fala,
        voz: voiceId,
        velocidade: velocidade().natural,
      }),
      signal: ctrl.signal,
    })
    if (minha !== geracao) {
      ctrl.abort()
      ctrls.delete(ctrl)
      return null
    }
    const tipo = r.headers.get('content-type') || ''
    if (!r.ok || !tipo.includes('audio')) {
      ctrls.delete(ctrl)
      let j = null
      try {
        j = tipo.includes('json') ? await r.json() : null
      } catch {}
      const codigo = j?.error?.code || ''
      lerAparelho(j?.error?.aparelho)
      if (codigo === 'VOZ_DESLIGADA' || codigo === 'VOZ_CHAVE' || !j) marcarServidor(false)
      estadoServidor.desligada = codigo === 'VOZ_DESLIGADA'
      if (codigo === 'VOZ_COTA') {
        estadoServidor.semCotaEm = Date.now()
        avisarSemCota()
      } else if (codigo !== 'VOZ_DESLIGADA')
        console.warn(`[Kleo voz] servidor ${r.status}${codigo ? ' ' + codigo : ''}`)
      return null
    }
    marcarServidor(true)
    estadoServidor.desligada = false
    estadoServidor.semCotaEm = 0
    return {
      resposta: r,
      ctrl,
    }
  } catch (e) {
    ctrls.delete(ctrl)
    if (e?.name !== 'AbortError') {
      marcarServidor(false)
      console.warn('[Kleo voz] servidor de voz fora do ar', e)
    }
    return null
  }
}
const podeMSE = () =>
  typeof window !== 'undefined' && window.MediaSource && MediaSource.isTypeSupported?.('audio/mpeg')
function tocarAudio(audio, { onInicio, aoFalhar }) {
  return new Promise(resolve => {
    let iniciou = false
    audioAtual = audio
    audio.onplaying = () => {
      if (!iniciou) {
        iniciou = true
        onInicio?.()
      }
    }
    const fim = ok => {
      aoFalhar?.()
      if (audioAtual === audio) audioAtual = null
      resolve(ok)
    }
    audio.onended = () => fim(true)
    audio.onpause = () => {
      if (!audio.ended) fim(true)
    }
    audio.onerror = () => fim(iniciou)
    audio.play().catch(() => fim(false))
  })
}
async function tocarEleven({ resposta, ctrl }, minha, onInicio) {
  try {
    if (podeMSE() && resposta.body) {
      const ms = new MediaSource()
      const url = URL.createObjectURL(ms)
      const audio = new Audio()
      audio.src = url
      await new Promise((res, rej) => {
        ms.addEventListener('sourceopen', res, {
          once: true,
        })
        setTimeout(() => rej(new Error('sourceopen')), 3000)
      })
      if (minha !== geracao) {
        URL.revokeObjectURL(url)
        return true
      }
      const sb = ms.addSourceBuffer('audio/mpeg')
      const reader = resposta.body.getReader()
      const anexar = pedaco =>
        new Promise((res, rej) => {
          sb.addEventListener('updateend', res, {
            once: true,
          })
          sb.addEventListener('error', rej, {
            once: true,
          })
          sb.appendBuffer(pedaco)
        })
      const primeiro = await reader.read()
      if (primeiro.done || minha !== geracao) {
        URL.revokeObjectURL(url)
        return minha !== geracao
      }
      await anexar(primeiro.value)
      const bombear = (async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done || minha !== geracao) break
            await anexar(value)
          }
          if (ms.readyState === 'open' && !sb.updating) ms.endOfStream()
        } catch {
          try {
            if (ms.readyState === 'open' && !sb.updating) ms.endOfStream()
          } catch {}
        }
      })()
      const ok = await tocarAudio(audio, {
        onInicio,
        aoFalhar: () => {
          reader.cancel().catch(() => {})
          URL.revokeObjectURL(url)
        },
      })
      bombear.catch(() => {})
      return ok
    }
    const blob = await resposta.blob()
    if (minha !== geracao) return true
    const url = URL.createObjectURL(blob)
    return await tocarAudio(new Audio(url), {
      onInicio,
      aoFalhar: () => URL.revokeObjectURL(url),
    })
  } catch (e) {
    if (e?.name === 'AbortError' || minha !== geracao) return true
    console.warn('[Kleo voz] Falha ao tocar áudio do ElevenLabs', e)
    return false
  } finally {
    ctrls.delete(ctrl)
  }
}
function falarNativo(fala, minha, onInicio, mascote, generoForcado) {
  if (!window.speechSynthesis || minha !== geracao || !fala) return Promise.resolve()
  const genero = generoForcado || generoVoz(mascote)
  const { voz, casou } = melhorVozNativa(genero)
  return new Promise(resolve => {
    let seguranca = null
    const terminar = () => {
      clearTimeout(seguranca)
      if (utterAtual === u) utterAtual = null
      resolve()
    }
    const u = new SpeechSynthesisUtterance(fala)
    u.lang = 'pt-BR'
    u.rate = velocidade().nativa
    u.pitch = genero === 'm' ? (casou ? 0.9 : 0.75) : 1.1
    if (voz) u.voice = voz
    u.onstart = () => onInicio?.()
    u.onend = u.onerror = terminar
    utterAtual = u
    seguranca = setTimeout(terminar, Math.max(4000, fala.length * 90))
    window.speechSynthesis.speak(u)
  })
}
const vozDaGeracao = new Map()
const pausa = ms => new Promise(r => setTimeout(r, ms))
async function falarFrase(fala, minha, { onInicio, mascote, preparo, voiceId, genero } = {}) {
  if (minha !== geracao || !fala) return
  const aparelho = vozAparelhoLiberada()
  const indisponivel =
    !servidorConfigurado() ||
    (estadoServidor.desligada && Date.now() - estadoServidor.em < RECHECAR_MS) ||
    vozSemCota()
  if (servidorConfigurado() && !(indisponivel && aparelho && vozDaGeracao.get(minha) !== 'eleven')) {
    for (let tentativa = 0; tentativa < 3 && minha === geracao; tentativa++) {
      if (tentativa > 0 && (vozSemCota() || estadoServidor.desligada)) break
      const baixado = await (tentativa === 0 && preparo
        ? preparo
        : baixarEleven(fala, minha, mascote, voiceId, true))
      if (minha !== geracao) return
      if (baixado) {
        const tocou = await tocarEleven(baixado, minha, onInicio)
        if (tocou) {
          vozDaGeracao.set(minha, 'eleven')
          return
        }
      }
      if (minha !== geracao) return
      await pausa(600 * (tentativa + 1))
    }
    if (!aparelho || !(vozSemCota() || estadoServidor.desligada)) return
  }
  if (!aparelho || minha !== geracao) return
  vozDaGeracao.set(minha, 'nativa')
  await falarNativo(fala, minha, onInicio, mascote, genero)
}
export async function falar(texto, { forcar = false, onInicio, mascote, voiceId, genero } = {}) {
  if (!texto || (!forcar && !vozAtiva())) return
  pararFala()
  const minha = ++geracao
  const fala = limparParaFala(texto)
  if (!fala) return
  await falarFrase(fala, minha, {
    onInicio,
    mascote: mascote || mascoteAtual(),
    voiceId,
    genero,
  })
}
export function criarFalaIncremental({ mascote: mascoteDado, forcar = false, onInicio } = {}) {
  const ativa = forcar || vozAtiva()
  const mascote = mascoteDado || mascoteAtual()
  if (!ativa) {
    return {
      adicionar() {},
      finalizar: () => Promise.resolve(),
      parar() {},
      ativa: false,
    }
  }
  pararFala()
  const minha = ++geracao
  const fila = []
  let consumido = 0
  let rodando = false
  let finalizado = false
  let iniciou = false
  let resolverFim = null
  const fim = new Promise(r => {
    resolverFim = r
  })
  const temEleven = vozNaturalProvavel()
  const aoIniciar = () => {
    if (!iniciou) {
      iniciou = true
      onInicio?.()
    }
  }
  const enfileirar = fala => {
    const limpa = limparParaFala(fala)
    if (limpa)
      fila.push({
        fala: limpa,
        preparo: null,
      })
  }
  const preparar = item => {
    if (item && temEleven && !item.preparo) item.preparo = baixarEleven(item.fala, minha, mascote)
  }
  const trabalhar = async () => {
    if (rodando) return
    rodando = true
    try {
      while (fila.length && minha === geracao) {
        const item = fila.shift()
        preparar(item)
        await falarFrase(item.fala, minha, {
          mascote,
          preparo: item.preparo || Promise.resolve(null),
          onInicio: () => {
            aoIniciar()
            preparar(fila[0])
          },
        })
      }
    } finally {
      rodando = false
      if (minha !== geracao) resolverFim()
      else if (finalizado && !fila.length) resolverFim()
      else if (fila.length) trabalhar()
    }
  }
  const ESTADO_INICIAL = {
    prof: 0,
    bloco: false,
    inline: false,
    mat: false,
  }
  let estado = {
    ...ESTADO_INICIAL,
  }
  const acharCorte = (texto, inicio) => {
    const e = {
      ...estado,
    }
    let corte = -1
    let estadoCorte = null
    for (let i = inicio; i < texto.length; i++) {
      const c = texto[i]
      if (c === '`') {
        if (texto.startsWith('```', i)) {
          e.bloco = !e.bloco
          i += 2
          continue
        }
        if (/^`{1,2}$/.test(texto.slice(i))) break
        if (!e.bloco) e.inline = !e.inline
        continue
      }
      if (e.bloco || e.inline) continue
      if (c === '$') {
        if (/[A-Za-z]/.test(texto[i - 1] || '')) continue
        if (texto[i + 1] === '$') i++
        e.mat = !e.mat
        continue
      }
      if (e.mat) continue
      if (c === '(' || c === '[' || c === '{') {
        e.prof++
        continue
      }
      if (c === ')' || c === ']' || c === '}') {
        if (e.prof > 0) e.prof--
        continue
      }
      if (e.prof > 0) continue
      const fimLinha = c === '\n'
      const fimFrase = '.!?…:;'.includes(c) && /\s/.test(texto[i + 1] || '')
      if (!fimLinha && !fimFrase) continue
      if (c === '.' && /(^|\n)\s*\d{1,3}$/.test(texto.slice(Math.max(0, i - 8), i))) continue
      corte = i + 1
      estadoCorte = {
        ...e,
      }
    }
    return {
      corte,
      estadoCorte,
    }
  }
  const adicionar = acumulado => {
    if (minha !== geracao || finalizado) return
    const texto = String(acumulado || '')
    if (texto.length < consumido) {
      consumido = 0
      estado = {
        ...ESTADO_INICIAL,
      }
    }
    const { corte, estadoCorte } = acharCorte(texto, consumido)
    if (corte <= consumido) return
    const trecho = texto.slice(consumido, corte)
    if (iniciou || fila.length || rodando ? trecho.trim().length >= 25 : trecho.trim().length >= 2) {
      consumido = corte
      estado = estadoCorte
      enfileirar(trecho)
      trabalhar()
    }
  }
  const finalizar = textoFinal => {
    if (minha !== geracao) return Promise.resolve()
    if (typeof textoFinal === 'string') {
      if (textoFinal.length < consumido) consumido = 0
      enfileirar(textoFinal.slice(consumido))
      consumido = textoFinal.length
    }
    finalizado = true
    if (!rodando && !fila.length) resolverFim()
    else trabalhar()
    return fim
  }
  let ultimo = ''
  return {
    ativa: true,
    adicionar: t => {
      ultimo = String(t || '')
      adicionar(ultimo)
    },
    finalizar: t => finalizar(typeof t === 'string' ? t : ultimo),
    parar: () => {
      if (minha === geracao) pararFala()
      resolverFim()
    },
  }
}
export async function listarVozesEleven() {
  if (!servidorConfigurado()) throw new Error('Voz natural indisponível no momento.')
  let r
  try {
    r = await fetch(urlApi('/api/voz?vozes=1'), {
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new Error('Sem conexão. Verifique a internet.')
  }
  const j = (r.headers.get('content-type') || '').includes('json') ? await r.json().catch(() => null) : null
  if (!j) throw new Error('Voz natural indisponível no momento.')
  if (j.error?.code === 'VOZ_DESLIGADA') {
    marcarServidor(false)
    throw new Error('Voz natural indisponível no momento.')
  }
  if (!r.ok) throw new Error(j.error?.message || `O servidor respondeu com erro ${r.status}. Tente de novo.`)
  return (Array.isArray(j?.voices) ? j.voices : []).map(v => ({
    voice_id: v.voice_id,
    name: v.name,
    labels: v.labels || {},
    preview_url: v.preview_url || '',
    categoria: v.category || '',
  }))
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}
export const reconhecimentoDisponivel = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
export function ouvir({ onParcial, onFinal, onFim, onErro }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onErro?.('Reconhecimento de voz não suportado neste navegador. Use o Chrome.')
    onFim?.()
    return null
  }
  const rec = new SR()
  rec.lang = 'pt-BR'
  rec.interimResults = true
  rec.continuous = false
  let final = ''
  rec.onresult = e => {
    let parcial = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) final += t
      else parcial += t
    }
    onParcial?.(final + parcial)
  }
  rec.onerror = e =>
    onErro?.(e.error === 'not-allowed' ? 'Permita o uso do microfone.' : 'Não consegui ouvir. Tente de novo.')
  rec.onend = () => {
    if (final.trim()) onFinal?.(final.trim())
    onFim?.()
  }
  rec.start()
  return rec
}
