import { useEffect } from 'react'
import useStorage from './useStorage'
import { calcularModoSimples } from './useModoSimples'
import { necessidadesDo, sugestoesDoPerfil } from '../lib/perfil'
export default function useAcessibilidade() {
  const [profile] = useStorage('kleo_profile', null)
  const [fonte] = useStorage('kleo_fonte_grande', null)
  const [contraste] = useStorage('kleo_alto_contraste', null)
  const [simplesSalvo] = useStorage('kleo_modo_simples', null)
  const [leitura] = useStorage('kleo_leitura_voz', null)
  const [avisos] = useStorage('kleo_avisos_visuais', null)
  const [transcricao] = useStorage('kleo_transcricao_auto', null)
  const [tema] = useStorage('kleo_tema', 'claro')
  const escuro = tema === 'escuro'
  const sugerido = sugestoesDoPerfil(profile)
  const necessidades = necessidadesDo(profile)
  const nec = necessidades[0] || null
  const chaveNec = necessidades.join(' ')
  const fonteGrande = typeof fonte === 'boolean' ? fonte : sugerido.kleo_fonte_grande
  const altoContraste = typeof contraste === 'boolean' ? contraste : sugerido.kleo_alto_contraste
  const modoSimples = calcularModoSimples(simplesSalvo, profile)
  const leituraVoz = typeof leitura === 'boolean' ? leitura : sugerido.kleo_leitura_voz
  const avisosVisuais = typeof avisos === 'boolean' ? avisos : sugerido.kleo_avisos_visuais
  const transcricaoAuto = typeof transcricao === 'boolean' ? transcricao : sugerido.kleo_transcricao_auto
  useEffect(() => {
    const html = document.documentElement
    if (fonteGrande) html.setAttribute('data-fonte', 'grande')
    else html.removeAttribute('data-fonte')
    if (altoContraste) html.setAttribute('data-contraste', 'alto')
    else html.removeAttribute('data-contraste')
    if (modoSimples) html.setAttribute('data-simples', 'sim')
    else html.removeAttribute('data-simples')
    if (nec) html.setAttribute('data-necessidade', nec)
    else html.removeAttribute('data-necessidade')
    if (chaveNec) html.setAttribute('data-necessidades', chaveNec)
    else html.removeAttribute('data-necessidades')
    if (escuro) html.setAttribute('data-tema', 'escuro')
    else html.removeAttribute('data-tema')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', escuro ? '#080b0d' : '#f7f4f2')
  }, [fonteGrande, altoContraste, modoSimples, nec, chaveNec, escuro])
  return {
    fonteGrande,
    altoContraste,
    modoSimples,
    necessidade: nec,
    necessidades,
    leituraVoz,
    avisosVisuais,
    transcricaoAuto,
    escuro,
  }
}
export function piscarTela() {
  const el = document.getElementById('root')
  if (!el) return
  el.classList.remove('kleo-flash')
  void el.offsetWidth
  el.classList.add('kleo-flash')
  navigator.vibrate?.([120, 80, 120])
}
