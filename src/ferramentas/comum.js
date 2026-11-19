import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { hojeISO, ler } from '../lib/storage'
export function useDados(chave, padrao) {
  return useStorage(`kleo_f_${chave || 'avulsa'}`, padrao)
}
export function useTam() {
  const simples = useModoSimples()
  return {
    simples,
    h: simples ? 60 : 48,
    fonte: simples ? 18 : 16,
    fonteMenor: simples ? 16 : 14,
  }
}
export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export function numero(t) {
  const txt = String(t ?? '')
    .trim()
    .replace(/\s/g, '')
  if (!txt) return NaN
  const n = parseFloat(txt.includes(',') ? txt.replace(/\./g, '').replace(',', '.') : txt)
  return Number.isFinite(n) ? n : NaN
}
export const fmt = (n, casas = 2) =>
  Number.isFinite(n)
    ? n.toLocaleString('pt-BR', {
        maximumFractionDigits: casas,
      })
    : '-'
export const reais = v =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
export function horasMin(h) {
  if (!Number.isFinite(h) || h < 0) return '-'
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return hh ? `${hh} h${mm ? ` ${mm} min` : ''}` : `${mm} min`
}
export const hoje = () => hojeISO()
export function dataCurta(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
    .toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
    .replace('.', '')
}
export function singular(rotulo = '') {
  const r = String(rotulo).trim()
  const especiais = {
    Plantões: 'Plantão',
    Pacientes: 'Paciente',
    Clientes: 'Cliente',
    Alunos: 'Aluno',
    Contatos: 'Contato',
    Turnos: 'Turno',
    Aulas: 'Aula',
  }
  if (especiais[r]) return especiais[r]
  if (/ões$/.test(r)) return r.replace(/ões$/, 'ão')
  if (/es$/.test(r) && /[rz]es$/.test(r)) return r.slice(0, -2)
  return r.replace(/s$/, '')
}
export const cidadeDoPerfil = () => ler('kleo_profile', {})?.city || ''
export function criarAcumulador(aoMudar) {
  let texto = ''
  return acumulado => {
    if (typeof acumulado === 'string') texto = acumulado
    aoMudar(texto)
    return texto
  }
}
export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = texto
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      return true
    } catch {
      return false
    }
  }
}
export async function compartilhar(titulo, texto) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: titulo,
        text: texto,
      })
      return 'compartilhado'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado'
    }
  }
  return (await copiar(texto)) ? 'copiado' : 'erro'
}
export function reduzirImagem(arquivo, max = 1024, qualidade = 0.82) {
  return new Promise((ok, falha) => {
    const leitor = new FileReader()
    leitor.onerror = () => falha(new Error('Não consegui ler a imagem.'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => falha(new Error('Imagem inválida.'))
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * escala)
        c.height = Math.round(img.height * escala)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        ok(c.toDataURL('image/jpeg', qualidade))
      }
      img.src = leitor.result
    }
    leitor.readAsDataURL(arquivo)
  })
}
export function nomeProfissao(p) {
  if (!p) return ''
  if (typeof p === 'object') return p.label || p.nome || ''
  return String(p)
}
export const agoraMs = () => Date.now()
export function calcularSeguro(fn, valores) {
  try {
    return fn(valores)
  } catch {
    return null
  }
}
