import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  ArrowUp,
  Mic,
  Camera,
  LoaderCircle,
  Trash2,
  Volume2,
  VolumeX,
  Square,
  Pill,
  Brain,
  Sparkles,
  Briefcase,
  X,
  MapPin,
  AlarmClock,
  Send,
  Users,
} from 'lucide-react'
import Tela from '../components/Tela'
import Mascote from '../components/Mascote'
import ChatBolha from '../components/ChatBolha'
import ChatCamera from '../components/ChatCamera'
import { BotaoIcone, Modal } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import { piscarTela } from '../hooks/useAcessibilidade'
import { temNecessidade, leituraVozAtiva, avisosVisuaisAtivos } from '../lib/perfil'
import { getMascoteSpec, resolverMascote } from '../data/mascotes'
import { getProfissao } from '../data/profissoes'
import { ler, salvar } from '../lib/storage'
import {
  conversar,
  analisarImagem,
  mensagemErro,
  ehErroDeConfiguracao,
  processarComandos,
  ocultarComandos,
  modoTrabalho,
} from '../lib/ia'
import { buscarLugares, resumoRota, obterPosicao } from '../lib/lugares'
import { pedidoDeLugar, escolhaDeOpcao } from '../lib/pedidoLugar'
import { acharLocal } from '../lib/locais'
import { geocodificar, distanciaM } from '../components/MapaRotas'
import { trabalhoDe } from '../data/trabalho'
import Avatar from '../components/Avatar'
import { GravadorSheet } from '../components/rede/Gravador'
import { PADRAO_SOS, acionarEmergencia } from '../lib/emergencia'
import {
  modoRede,
  contaCache,
  resolverContato,
  nomeExibicao,
  conversasCache,
  contatosCache,
  mensagensRecentes,
  marcarLida,
} from '../lib/rede'
import { enviarTexto, mensagemErroEnvio } from '../lib/rede/envio'
import { tocarAudio } from '../lib/audio'
import { falar, pararFala, criarFalaIncremental, ouvir, reconhecimentoDisponivel } from '../lib/voz'
const SUGESTOES_BASE = [
  {
    texto: 'Me lembra do remédio às 8h todo dia',
    icone: Pill,
    cor: 'var(--lima)',
  },
  {
    texto: 'Quero ir na farmácia mais perto',
    icone: MapPin,
    cor: 'var(--ceu)',
  },
  {
    texto: 'Manda um áudio pra minha família',
    icone: Users,
    cor: 'var(--lavanda)',
  },
  {
    texto: 'Me acorda amanhã às 7h',
    icone: AlarmClock,
    cor: 'var(--surface)',
  },
  {
    texto: 'Bom dia! Como está meu dia?',
    icone: Brain,
    cor: 'var(--surface-2)',
    longa: true,
  },
]
const COR_STATUS = {
  idle: 'var(--sucesso)',
  ouvindo: 'var(--erro)',
  pensando: 'var(--ceu)',
  escrevendo: 'var(--lavanda-forte)',
  falando: 'var(--lavanda-forte)',
}
function chavesDoHistorico(lista) {
  const usadas = new Set()
  return lista.map((m, i) => {
    let k = m.ts ? `h-${m.ts}-${m.role}` : `h-i${i}`
    if (usadas.has(k)) k += `-${i}`
    usadas.add(k)
    return k
  })
}
const CASCATA_INICIAL = 4
export default function Chat() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const simples = useModoSimples()
  const [historico] = useStorage('kleo_chat_history', [])
  const [profile] = useStorage('kleo_profile', null)
  const [mascoteSalvo] = useStorage('kleo_mascote', 'auto')
  const [voz, setVoz] = useStorage('kleo_voz', true)
  const [trabalhoSalvo, setTrabalho] = useStorage('kleo_modo_trabalho', null)
  const [texto, setTexto] = useState('')
  const [fase, setFase] = useState('idle')
  const [gerando, setGerando] = useState(false)
  const [pendente, setPendente] = useState(null)
  const [stream, setStream] = useState(null)
  const [locais, setLocais] = useState([])
  const [miniaturas, setMiniaturas] = useState({})
  const [cameraAberta, setCameraAberta] = useState(params.get('camera') === '1')
  const [confirmarLimpar, setConfirmarLimpar] = useState(false)
  const [aviso, setAviso] = useState('')
  const [focado, setFocado] = useState(false)
  const [envioPendente, setEnvioPendente] = useState(null)
  const [audioPara, setAudioPara] = useState(null)
  const [procurando, setProcurando] = useState('')
  const [inicio] = useState(() => {
    const h = Array.isArray(historico) ? historico : []
    const chaves = chavesDoHistorico(h)
    const entrada = new Map()
    const desde = Math.max(0, h.length - CASCATA_INICIAL)
    for (let i = desde; i < h.length; i++) entrada.set(chaves[i], 0.04 + (i - desde) * 0.06)
    return {
      entrada,
    }
  })
  const reconhecedor = useRef(null)
  const fimRef = useRef(null)
  const listaRef = useRef(null)
  const montado = useRef(true)
  const ctrlRef = useRef(null)
  const falaRef = useRef(null)
  const parcialRef = useRef('')
  const paramsVistos = useRef(null)
  const autoNavRef = useRef(null)
  const enviarRef = useRef(null)
  const lerMensagensRef = useRef(null)
  const cadeiaRef = useRef(null)
  const auditiva = temNecessidade(profile, 'auditiva')
  const visual = leituraVozAtiva(profile)
  const avisos = avisosVisuaisAtivos(profile)
  const alvo = simples ? 56 : 48
  void trabalhoSalvo
  const trab = modoTrabalho()
  const mascoteId = trab.ativo ? trab.profissao : resolverMascote(profile, mascoteSalvo)
  const mascote = getMascoteSpec(mascoteId)
  const ocupado = gerando
  const ouvindo = fase === 'ouvindo'
  const vozLigada = voz !== false
  const profId = profile?.profissao
  const profTrabalho = trab.ativo ? trab.profissao : null
  const sugestoes = useMemo(() => {
    if (profTrabalho) {
      const cores = ['var(--lavanda)', 'var(--lima)', 'var(--ceu)', 'var(--surface)']
      return trabalhoDe(profTrabalho)
        .perguntas.slice(0, simples ? 3 : 4)
        .map((t, i) => ({
          texto: t,
          icone: Briefcase,
          cor: cores[i % 4],
          longa: true,
        }))
    }
    if (simples) return SUGESTOES_BASE.slice(0, 3)
    let prof = null
    try {
      prof = profId ? getProfissao(profId) : null
    } catch {
      prof = null
    }
    const daProf = (prof?.atalhos || []).slice(0, 1).map(t => ({
      texto: t,
      icone: prof.icone || Sparkles,
      cor: 'var(--surface-2)',
      longa: true,
    }))
    return [...SUGESTOES_BASE, ...daProf]
  }, [profId, simples, profTrabalho])
  const mensagens = useMemo(() => {
    const lista = Array.isArray(historico) ? historico : []
    const chaves = chavesDoHistorico(lista)
    const salvas = lista
      .map((m, i) => ({
        ...m,
        chave: chaves[i],
      }))
      .filter(m => !m.oculta)
    const extras = locais.map(e => ({
      ...e,
      chave: `l-${e.ts}-${e.role}`,
    }))
    return [...salvas, ...extras].sort((a, b) => (a.ts || 0) - (b.ts || 0))
  }, [historico, locais])
  const salvoDesde = (role, desde) => mensagens.some(m => m.role === role && !m.local && (m.ts || 0) >= desde)
  const mostrarPendente = pendente && !salvoDesde('user', pendente.desde)
  const mostrarStream = stream && stream.texto && !salvoDesde('assistant', stream.desde)
  const vazio = mensagens.length === 0 && !pendente
  const mostrarAviso = useCallback(
    msg => {
      setAviso(msg)
      if (avisos) piscarTela()
      setTimeout(() => {
        if (montado.current) setAviso('')
      }, 3800)
    },
    [avisos],
  )
  const novaFala = useCallback(() => {
    if (auditiva) return null
    const f = criarFalaIncremental({
      mascote: mascoteId,
      forcar: visual,
      onInicio: () => {
        if (montado.current) setFase('falando')
      },
    })
    falaRef.current = f
    return f
  }, [auditiva, visual, mascoteId])
  const aoToken = useCallback(
    (desde, fala) => acumulado => {
      if (!montado.current) return
      parcialRef.current = acumulado
      setStream({
        texto: acumulado,
        desde,
      })
      setFase(f => (f === 'pensando' ? 'escrevendo' : f))
      fala?.adicionar(acumulado)
    },
    [],
  )
  const concluir = useCallback(
    async fala => {
      if (avisos) piscarTela()
      if (montado.current) setGerando(false)
      if (fala?.ativa) {
        await fala.finalizar()
      }
      if (montado.current) {
        setFase(f => (f === 'ouvindo' ? f : 'idle'))
        setStream(null)
      }
    },
    [avisos],
  )
  const irDepois = useCallback(
    async (acoes, espera) => {
      const alvo = (acoes || []).find(a => (a.tipo === 'navegar' || a.tipo === 'abrir') && a.rota)
      if (!alvo) {
        await espera
        return
      }
      const marca = {}
      autoNavRef.current = marca
      const t0 = Date.now()
      await Promise.race([espera, new Promise(r => setTimeout(r, 7000))])
      const resto = 1500 - (Date.now() - t0)
      if (resto > 0) await new Promise(r => setTimeout(r, resto))
      if (!montado.current || autoNavRef.current !== marca) return
      autoNavRef.current = null
      navigate(alvo.rota)
    },
    [navigate],
  )
  const anexarKleo = useCallback((conteudo, extras = {}) => {
    const atual = ler('kleo_chat_history', [])
    salvar(
      'kleo_chat_history',
      [
        ...(Array.isArray(atual) ? atual : []),
        {
          role: 'assistant',
          content: conteudo,
          ts: Date.now(),
          ...extras,
        },
      ].slice(-20),
    )
  }, [])
  const prepararRota = useCallback(
    async nav => {
      let destino =
        nav.lat !== null && nav.lat !== undefined
          ? {
              lat: nav.lat,
              lng: nav.lon,
              nome: nav.destino,
            }
          : null
      if (!destino) {
        const pos = await obterPosicao()
        const r = await geocodificar(nav.destino, pos, undefined, {
          centro: pos,
          cidade: profile?.city || '',
        })
        if (!r?.length) return null
        destino = {
          lat: r[0].lat,
          lng: r[0].lng,
          nome: nav.destino.split(',')[0] || r[0].nome,
        }
      }
      let modo = nav.modo
      if (!modo) {
        const pos = await obterPosicao()
        const longe = pos ? distanciaM(pos, destino) > 1500 : true
        modo = longe ? 'carro' : 'pe'
      }
      const resumo = await resumoRota(destino, modo, {
        acessivel: !!nav.acessivel,
      }).catch(() => null)
      const q = new URLSearchParams({
        destino: destino.nome,
        lat: destino.lat,
        lon: destino.lng,
        modo: resumo?.modo || (modo === 'acessivel' ? 'pe' : modo),
      })
      if (resumo?.acessivel || nav.acessivel) q.set('acessivel', '1')
      return {
        resumo,
        rota: `/mapa?${q}`,
      }
    },
    [profile?.city],
  )
  const seguirAcoes = useCallback(
    async (acoes, fala, profundidade = 0) => {
      const marca = {}
      cadeiaRef.current = marca
      const vivo = () => montado.current && cadeiaRef.current === marca
      const busca = (acoes || []).find(a => a.tipo === 'buscar')
      const nav = (acoes || []).find(a => a.tipo === 'navegar')
      const sos = (acoes || []).find(a => a.tipo === 'emergencia')
      const msgAcao = (acoes || []).find(a => a.tipo === 'mensagem')
      const audioAcao = (acoes || []).find(a => a.tipo === 'audio')
      const lerAcao = (acoes || []).find(a => a.tipo === 'ler')
      if (sos) acionarEmergencia(sos.motivo, 'ia')
      if (msgAcao || audioAcao || lerAcao) {
        const pedido = msgAcao || audioAcao
        const semRede = modoRede() === 'nenhum' || !contaCache()
        let alvo = null
        let problema = ''
        if (semRede) problema = 'Para mandar mensagens, primeiro crie seu perfil na aba Pessoas.'
        else if (pedido) {
          const r = resolverContato(pedido.contato)
          const amizades = ler('kleo_rede_amizades', null)
          const estado =
            r.contato && Array.isArray(amizades) && r.contato.uid !== contaCache()?.uid
              ? amizades.find(a => a.uid === r.contato.uid)?.estado || 'nenhum'
              : 'amigos'
          if (r.contato && modoRede() === 'supabase' && estado !== 'amigos')
            problema =
              estado === 'enviado'
                ? `${nomeExibicao(r.contato)} ainda não aceitou seu pedido de amizade. Quando aceitar, eu mando.`
                : `Você e ${nomeExibicao(r.contato)} ainda não são amigos. Mande um pedido de amizade na aba Pessoas.`
          else if (r.contato) alvo = r.contato
          else if (r.ambiguos.length)
            problema = `Encontrei mais de uma pessoa: ${r.ambiguos.slice(0, 3).map(nomeExibicao).join(', ')}. Qual delas?`
          else
            problema = `Não encontrei "${pedido.contato}" nos seus contatos. Você pode adicionar a pessoa na aba Pessoas.`
        }
        await concluir(fala)
        if (!vivo()) return
        if (problema) {
          anexarKleo(problema, {
            acoes: [
              {
                tipo: 'abrir',
                rota: '/pessoas',
                texto: 'Abrir Pessoas',
              },
            ],
          })
          if (!auditiva)
            falar(problema, {
              forcar: visual,
              mascote: mascoteId,
            }).catch(() => {})
          return
        }
        if (msgAcao && alvo)
          setEnvioPendente({
            contato: alvo,
            conteudo: msgAcao.conteudo,
            ate: Date.now() + 4000,
          })
        if (audioAcao && alvo) setAudioPara(alvo)
        if (lerAcao) await lerMensagensRef.current?.(lerAcao.contato)
        return
      }
      if (busca && profundidade < 2) {
        setProcurando(busca.termo)
        const pedidoBusca = buscarLugares(busca.termo).catch(e => ({
          erro: e?.message === 'SEM_LOCAL' ? 'local' : 'rede',
        }))
        await concluir(fala)
        if (vivo()) setGerando(true)
        const res = await pedidoBusca
        setProcurando('')
        setGerando(false)
        if (!vivo()) return
        let texto
        let lugares = null
        if (res.erro === 'local')
          texto = 'Não consegui sua localização. Ligue o GPS ou me diga o bairro, por favor.'
        else if (res.erro) texto = 'Não consegui procurar agora. Confira a internet e tente de novo.'
        else if (!res.itens.length)
          texto = `Não achei ${res.categoria} aqui perto. Quer que eu procure outra coisa?`
        else {
          lugares = res.itens
          const p = res.itens[0]
          const dist =
            p.metros < 1000
              ? `${Math.round(p.metros / 10) * 10} metros`
              : `${(p.metros / 1000).toFixed(1).replace('.', ',')} km`
          texto = `Achei ${res.itens.length === 1 ? 'uma opção' : `${res.itens.length} opções`} perto de você. A mais perto é ${p.nome}, a ${dist}. Toque em uma opção para ver no mapa, ou diga o número.`
        }
        anexarKleo(
          texto,
          lugares
            ? {
                lugares,
                paraIA: `${texto}\n[RESULTADOS DA BUSCA: ${res.categoria}]\n${lugares
                  .map(l => `${l.n}. ${l.nome} | ${l.lat},${l.lng} | ${l.metros} m`)
                  .join('\n')}`,
              }
            : {},
        )
        if (!auditiva)
          falar(texto, {
            forcar: visual,
            mascote: mascoteId,
          }).catch(() => {})
        return
      }
      if (nav) {
        setGerando(true)
        const preparo = prepararRota(nav).catch(() => null)
        await concluir(fala)
        const pronto = await preparo
        if (!vivo()) {
          setGerando(false)
          return
        }
        const rota = pronto?.rota || nav.rota
        const acaoMapa = [
          {
            tipo: 'navegar',
            rota,
            texto: 'Ver rota no mapa',
          },
        ]
        if (pronto?.resumo?.texto) {
          anexarKleo(pronto.resumo.texto, {
            acoes: acaoMapa,
          })
          const f2 = novaFala()
          f2?.adicionar(pronto.resumo.texto)
          await irDepois(acaoMapa, concluir(f2))
        } else {
          setGerando(false)
          await irDepois(acaoMapa, Promise.resolve())
        }
        return
      }
      await irDepois(acoes, concluir(fala))
    },
    [concluir, irDepois, novaFala, anexarKleo, prepararRota, auditiva, visual, mascoteId],
  )
  const lerMensagens = useCallback(
    async alvoTexto => {
      const marca = cadeiaRef.current
      const eu = contaCache()?.uid
      const todas = !alvoTexto || /^tod|^as mensagens|^mensagens/i.test(alvoTexto)
      let lista = conversasCache().filter(c => c.ultima && c.ultima.de !== eu && c.naoLidas > 0)
      if (!todas) {
        const r = resolverContato(alvoTexto)
        lista = r.contato ? conversasCache().filter(c => c.outro === r.contato.uid) : []
      }
      const nomeDe = uid => {
        const k = contatosCache().find(x => x.uid === uid)
        return k ? nomeExibicao(k) : 'Alguém'
      }
      if (!lista.length) {
        const t = todas ? 'Você não tem mensagens novas.' : 'Não achei mensagens dessa pessoa.'
        anexarKleo(t)
        if (!auditiva)
          await falar(t, {
            forcar: true,
            mascote: mascoteId,
          }).catch(() => {})
        return
      }
      setFase('falando')
      for (const c of lista.slice(0, 4)) {
        if (cadeiaRef.current !== marca || !montado.current) break
        const nome =
          c.perfil?.nome && !contatosCache().some(k => k.uid === c.outro) ? c.perfil.nome : nomeDe(c.outro)
        let msgs
        try {
          msgs = (await mensagensRecentes(c.outro, Math.min(8, Math.max(1, c.naoLidas)))).filter(
            m => m.de !== eu,
          )
        } catch {
          msgs = []
        }
        for (const m of msgs) {
          if (cadeiaRef.current !== marca || !montado.current) break
          if (m.tipo === 'audio' && m.audio) {
            if (!auditiva) {
              await falar(`Áudio de ${nome}.`, {
                forcar: true,
                mascote: mascoteId,
              }).catch(() => {})
              await tocarAudio(m.audio)
            }
            if (m.transcricao) anexarKleo(`${nome} (áudio): ${m.transcricao}`)
          } else if (m.tipo === 'sos') {
            await falar(`${nome} pediu ajuda.`, {
              forcar: true,
              mascote: mascoteId,
            }).catch(() => {})
          } else if (m.tipo === 'imagem') {
            anexarKleo(`${nome} mandou uma foto.`)
            if (!auditiva)
              await falar(`${nome} mandou uma foto.`, {
                forcar: true,
                mascote: mascoteId,
              }).catch(() => {})
          } else if (m.tipo === 'local') {
            anexarKleo(`${nome} mandou a localização.`)
            if (!auditiva)
              await falar(`${nome} mandou a localização.`, {
                forcar: true,
                mascote: mascoteId,
              }).catch(() => {})
          } else {
            anexarKleo(`${nome}: ${m.texto}`)
            if (!auditiva)
              await falar(`${nome} disse: ${m.texto}`, {
                forcar: true,
                mascote: mascoteId,
              }).catch(() => {})
          }
        }
        marcarLida(c.outro).catch(() => {})
      }
      if (montado.current) setFase('idle')
    },
    [anexarKleo, auditiva, mascoteId],
  )
  useEffect(() => {
    lerMensagensRef.current = lerMensagens
  }, [lerMensagens])
  useEffect(() => {
    if (!envioPendente) return
    const t = setTimeout(
      async () => {
        const p = envioPendente
        setEnvioPendente(null)
        try {
          const r = await enviarTexto(p.contato.uid, p.conteudo)
          const ok = await r?.confirmado
          anexarKleo(
            ok === false
              ? `Sem internet agora. A mensagem para ${nomeExibicao(p.contato)} vai sozinha quando a conexão voltar.`
              : `Enviado para ${nomeExibicao(p.contato)}: "${p.conteudo}"`,
            {
              acoes: [
                {
                  tipo: 'abrir',
                  rota: `/pessoas/${p.contato.uid}`,
                  texto: `Conversa com ${nomeExibicao(p.contato)}`,
                },
              ],
            },
          )
        } catch (e) {
          anexarKleo(mensagemErroEnvio(e))
        }
      },
      Math.max(0, envioPendente.ate - Date.now()),
    )
    return () => clearTimeout(t)
  }, [envioPendente, anexarKleo])
  const registrarFalha = useCallback(
    (e, { conteudo, desde, repetir }) => {
      const abortado = e?.name === 'AbortError' || ctrlRef.current?.signal.aborted
      const parcial = parcialRef.current
      const extras = [
        {
          role: 'user',
          content: conteudo,
          ts: desde,
          local: true,
        },
      ]
      if (abortado) {
        if (parcial)
          extras.push({
            role: 'assistant',
            content: parcial,
            ts: desde + 1,
            local: true,
            interrompida: true,
          })
      } else {
        const msg = mensagemErro(e)
        extras.push({
          role: 'assistant',
          content: msg,
          ts: desde + 1,
          local: true,
          erro: true,
          config: ehErroDeConfiguracao(e),
          repetir,
        })
        if (avisos) piscarTela()
        if (visual && !auditiva)
          falar(msg, {
            forcar: true,
            mascote: mascoteId,
          })
      }
      setLocais(atual => [...atual, ...extras])
      setPendente(null)
      setStream(null)
      setGerando(false)
      setFase('idle')
    },
    [auditiva, avisos, visual, mascoteId],
  )
  const agirLocal = useCallback(
    async msg => {
      const historico = ler('kleo_chat_history', [])
      const lista = Array.isArray(historico) ? historico : []
      const ultima = [...lista].reverse().find(m => m.role === 'assistant' && !m.erro)
      const escolhido = ultima?.lugares ? escolhaDeOpcao(msg, ultima.lugares) : null
      const termo = escolhido ? null : pedidoDeLugar(msg)
      if (!escolhido && !termo) return false
      const salvo = termo ? acharLocal(termo) : null
      const lugarPessoal =
        termo && !salvo && /^(?:minha |meu |a |o )?(casa|trabalho|faculdade|escola)$/i.exec(termo)
      salvar(
        'kleo_chat_history',
        [
          ...lista,
          {
            role: 'user',
            content: msg,
            ts: Date.now(),
          },
        ].slice(-20),
      )
      setTexto('')
      const responder = (texto, extras = {}) => {
        anexarKleo(texto, extras)
        return auditiva
          ? Promise.resolve()
          : falar(texto, {
              forcar: visual,
              mascote: mascoteId,
            }).catch(() => {})
      }
      if (escolhido) {
        const q = new URLSearchParams({
          destino: escolhido.nome,
          lat: String(escolhido.lat),
          lon: String(escolhido.lng),
        })
        if (escolhido.metros != null && escolhido.metros < 1200) q.set('modo', 'pe')
        const acoes = [
          {
            tipo: 'navegar',
            rota: `/mapa?${q}`,
            texto: 'Ver no mapa',
          },
        ]
        await irDepois(acoes, responder(`Abrindo ${escolhido.nome} no mapa.`, { acoes }))
        return true
      }
      if (lugarPessoal) {
        const nome = lugarPessoal[1].toLowerCase()
        await responder(
          `Ainda não sei onde fica ${nome === 'casa' ? 'a sua casa' : `o seu ${nome}`}. Abra o Mapa, procure o endereço e salve em Meus lugares. Depois é só pedir.`,
          {
            acoes: [
              {
                tipo: 'abrir',
                rota: '/mapa',
                texto: 'Abrir o mapa',
              },
            ],
          },
        )
        return true
      }
      if (salvo) {
        await seguirAcoes(
          [
            {
              tipo: 'navegar',
              destino: salvo.nome,
              lat: salvo.lat,
              lon: salvo.lng,
              modo: '',
              acessivel: false,
            },
          ],
          null,
        )
        return true
      }
      await seguirAcoes(
        [
          {
            tipo: 'buscar',
            termo,
          },
        ],
        null,
      )
      return true
    },
    [anexarKleo, auditiva, visual, mascoteId, irDepois, seguirAcoes],
  )
  const enviar = useCallback(
    async (bruto, { oculta = false, lugares = null, profundidade = 0 } = {}) => {
      const msg = String(bruto ?? '').trim()
      if (!msg || ctrlRef.current) return
      pararFala()
      autoNavRef.current = null
      if (!oculta) cadeiaRef.current = null
      if (!oculta && PADRAO_SOS.test(msg)) acionarEmergencia(msg, 'chat')
      else if (!oculta && !lugares && (await agirLocal(msg))) return
      const ctrl = new AbortController()
      ctrlRef.current = ctrl
      parcialRef.current = ''
      const desde = Date.now()
      if (!oculta) {
        setTexto('')
        setPendente({
          role: 'user',
          content: msg,
          desde,
        })
      }
      setStream(null)
      setGerando(true)
      setFase('pensando')
      const fala = novaFala()
      try {
        const { acoes } = await conversar(msg, {
          signal: ctrl.signal,
          onToken: aoToken(desde, fala),
          oculta,
        })
        ctrlRef.current = null
        if (!montado.current) return
        setPendente(null)
        if (lugares?.length) {
          const h = ler('kleo_chat_history', [])
          if (Array.isArray(h) && h.length) {
            h[h.length - 1] = {
              ...h[h.length - 1],
              lugares,
            }
            salvar('kleo_chat_history', h)
          }
        }
        await seguirAcoes(acoes, fala, profundidade)
      } catch (e) {
        fala?.parar()
        if (montado.current) {
          if (oculta) {
            setGerando(false)
            setFase('idle')
            setStream(null)
          } else
            registrarFalha(e, {
              conteudo: msg,
              desde,
              repetir: msg,
            })
        }
        ctrlRef.current = null
      }
    },
    [novaFala, aoToken, registrarFalha, seguirAcoes, agirLocal],
  )
  useEffect(() => {
    enviarRef.current = enviar
  }, [enviar])
  const enviarImagem = useCallback(
    async (dataURL, pergunta) => {
      setCameraAberta(false)
      if (ctrlRef.current) return
      pararFala()
      autoNavRef.current = null
      const ctrl = new AbortController()
      ctrlRef.current = ctrl
      parcialRef.current = ''
      const desde = Date.now()
      const conteudo = '[Imagem]' + (pergunta ? ' ' + pergunta : '')
      setMiniaturas(m => ({
        ...m,
        [desde]: dataURL,
      }))
      setPendente({
        role: 'user',
        content: conteudo,
        imagem: dataURL,
        desde,
      })
      setStream(null)
      setGerando(true)
      setFase('pensando')
      const fala = novaFala()
      const tok = aoToken(desde, fala)
      try {
        const bruto = await analisarImagem(dataURL, pergunta, {
          signal: ctrl.signal,
          completo: true,
          onToken: acum => tok(ocultarComandos(acum)),
        })
        ctrlRef.current = null
        const { texto: resposta, acoes } = processarComandos(bruto)
        const atual = ler('kleo_chat_history', [])
        salvar(
          'kleo_chat_history',
          [
            ...(Array.isArray(atual) ? atual : []),
            {
              role: 'user',
              content: conteudo,
              ts: desde,
            },
            {
              role: 'assistant',
              content: resposta,
              acoes,
              ts: Math.max(Date.now(), desde + 1),
            },
          ].slice(-20),
        )
        if (!montado.current) return
        setPendente(null)
        await irDepois(acoes, concluir(fala))
      } catch (e) {
        fala?.parar()
        if (montado.current)
          registrarFalha(e, {
            conteudo,
            desde,
          })
        ctrlRef.current = null
      }
    },
    [novaFala, aoToken, concluir, registrarFalha, irDepois],
  )
  const alternarEscuta = useCallback(() => {
    if (reconhecedor.current) {
      reconhecedor.current.stop()
      return
    }
    if (ctrlRef.current) return
    if (!reconhecimentoDisponivel()) {
      mostrarAviso('Seu navegador não reconhece voz. Use o Chrome ou escreva sua mensagem.')
      return
    }
    pararFala()
    setTexto('')
    setFase('ouvindo')
    reconhecedor.current = ouvir({
      onParcial: t => setTexto(t),
      onFinal: t => {
        reconhecedor.current = null
        if (!montado.current) return
        setFase('idle')
        enviarRef.current(t)
      },
      onFim: () => {
        reconhecedor.current = null
        setFase(f => (f === 'ouvindo' ? 'idle' : f))
      },
      onErro: m => mostrarAviso(m),
    })
    if (!reconhecedor.current) setFase('idle')
  }, [mostrarAviso])
  const pararTudo = useCallback(() => {
    autoNavRef.current = null
    cadeiaRef.current = null
    setGerando(false)
    document.querySelectorAll('audio').forEach(a => a.pause())
    ctrlRef.current?.abort()
    falaRef.current?.parar()
    pararFala()
    reconhecedor.current?.stop()
    setFase(f => (f === 'falando' || f === 'escrevendo' ? 'idle' : f))
  }, [])
  const alternarVoz = () => {
    if (vozLigada) {
      falaRef.current?.parar()
      pararFala()
    }
    setVoz(!vozLigada)
    setFase(f => (f === 'falando' ? 'idle' : f))
  }
  const alternarTrabalho = () => {
    const prof = trab.profissao || profile?.profissao
    if (!prof) {
      navigate('/configuracoes?secao=profissoes')
      return
    }
    const ligar = !trab.ativo
    setTrabalho({
      ativo: ligar,
      profissao: prof,
    })
    mostrarAviso(
      ligar ? `Modo trabalho: ${getProfissao(prof)?.label || 'profissão'}` : 'Modo trabalho desligado',
    )
  }
  const limpar = () => {
    pararTudo()
    salvar('kleo_chat_history', [])
    setLocais([])
    setMiniaturas({})
    setConfirmarLimpar(false)
    setFase('idle')
  }
  const ouvirDeNovo = conteudo => {
    pararFala()
    falar(conteudo, {
      forcar: true,
      mascote: mascoteId,
      onInicio: () => {
        if (montado.current) setFase('falando')
      },
    }).then(() => {
      if (montado.current) setFase(f => (f === 'falando' ? 'idle' : f))
    })
  }
  useEffect(() => {
    if (paramsVistos.current === location.key) return
    paramsVistos.current = location.key
    const querVoz = params.get('voz') === '1'
    const querCamera = params.get('camera') === '1'
    const pergunta = (params.get('q') || location.state?.pergunta || '').trim()
    if (!querVoz && !querCamera && !pergunta) return
    setParams(
      {},
      {
        replace: true,
        state: null,
      },
    )
    if (querCamera)
      setTimeout(() => {
        if (montado.current) setCameraAberta(true)
      }, 0)
    if (pergunta)
      setTimeout(() => {
        if (montado.current) enviarRef.current(pergunta)
      }, 300)
    else if (querVoz)
      setTimeout(() => {
        if (montado.current) alternarEscuta()
      }, 350)
  }, [params, setParams, alternarEscuta, location.key, location.state])
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
      cadeiaRef.current = null
      ctrlRef.current?.abort()
      ctrlRef.current = null
      falaRef.current?.parar()
      pararFala()
      const rec = reconhecedor.current
      if (rec) {
        if (rec.abort) rec.abort()
        else rec.stop()
      }
      reconhecedor.current = null
    }
  }, [])
  const jaRolou = useRef(false)
  useEffect(() => {
    fimRef.current?.scrollIntoView({
      behavior: jaRolou.current ? 'smooth' : 'auto',
      block: 'end',
    })
    jaRolou.current = true
  }, [mensagens.length, pendente, gerando])
  useEffect(() => {
    const el = listaRef.current
    if (!el || !stream?.texto) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight
  }, [stream?.texto])
  const rotuloStatus = {
    idle: 'Online',
    ouvindo: 'Ouvindo você...',
    pensando: 'Pensando...',
    escrevendo: 'Escrevendo...',
    falando: 'Falando...',
  }[fase]
  const estadoMascote = fase === 'escrevendo' ? 'falando' : fase === 'idle' ? 'idle' : fase
  const primeiroNome = profile?.name ? profile.name.trim().split(' ')[0] : ''
  const temTexto = !!texto.trim()
  return (
    <Tela semPadding rolavel={false}>
      <div style={styles.root}>
        <header style={styles.header}>
          <div style={styles.identidade}>
            <div style={styles.mascoteCaixa}>
              <Mascote id={mascoteId} estado={estadoMascote} tamanho={simples ? 56 : 50} semBrilho />
            </div>
            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  ...styles.nome,
                  fontSize: simples ? 24 : 21,
                }}
              >
                {mascote.nome}
              </div>
              <div
                style={{
                  ...styles.status,
                  fontSize: simples ? 16 : 14,
                }}
                aria-live="polite"
              >
                <span
                  className={fase !== 'idle' ? 'chat-ponto-vivo' : undefined}
                  style={{
                    ...styles.ponto,
                    background: COR_STATUS[fase],
                    color: COR_STATUS[fase],
                  }}
                />
                <span key={fase} className="anim-fade">
                  {rotuloStatus}
                </span>
              </div>
            </div>
          </div>
          <div style={styles.acoesTopo}>
            {(fase === 'falando' || (gerando && fase === 'escrevendo')) && (
              <span className="anim-pop" style={styles.centro}>
                <BotaoIcone icone={Square} fundo="var(--lima)" onClick={pararTudo} label="Parar a Kleo" />
              </span>
            )}
            {profile?.profissao && !(simples && fase === 'falando') && (
              <BotaoIcone
                icone={Briefcase}
                label={trab.ativo ? 'Desligar modo trabalho' : 'Ligar modo trabalho'}
                onClick={alternarTrabalho}
                variante={trab.ativo ? 'lima' : 'branco'}
                aria-pressed={trab.ativo}
              />
            )}
            {!auditiva && !(simples && fase === 'falando') && (
              <BotaoIcone
                icone={vozLigada ? Volume2 : VolumeX}
                label={vozLigada ? 'Desligar voz da Kleo' : 'Ligar voz da Kleo'}
                onClick={alternarVoz}
                variante={vozLigada ? 'lavanda' : 'branco'}
                aria-pressed={vozLigada}
              />
            )}
            {!vazio && !simples && (
              <span className="anim-pop" style={styles.centro}>
                <BotaoIcone icone={Trash2} label="Limpar conversa" onClick={() => setConfirmarLimpar(true)} />
              </span>
            )}
          </div>
        </header>

        {trab.ativo && (
          <div className="anim-up" style={styles.faixaTrabalho} role="status">
            <Briefcase size={17} aria-hidden="true" />
            <span
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              Modo trabalho · <strong>{getProfissao(trab.profissao)?.label || 'Profissão'}</strong>
            </span>
            <button
              type="button"
              className="tap"
              onClick={alternarTrabalho}
              style={styles.faixaFechar}
              aria-label="Sair do modo trabalho"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div ref={listaRef} style={styles.mensagens}>
          {vazio ? (
            <div style={styles.vazio}>
              <div
                className="anim-scale"
                style={{
                  ...styles.palco,
                  animationDuration: '0.55s',
                }}
              >
                <span style={styles.disco} aria-hidden="true" />
                <Mascote id={mascoteId} estado={estadoMascote} tamanho={simples ? 150 : 140} />
              </div>
              <h2
                className="anim-up"
                style={{
                  ...styles.saudacao,
                  fontSize: simples ? 36 : 38,
                  animationDelay: '0.1s',
                }}
              >
                {primeiroNome ? `Oi, ${primeiroNome}.` : 'Oi.'}
                <br />
                Como posso ajudar?
              </h2>
              <p
                className="anim-up"
                style={{
                  ...styles.dica,
                  fontSize: simples ? 19 : 16,
                  animationDelay: '0.16s',
                }}
              >
                {simples
                  ? 'Toque no botão preto e fale comigo.'
                  : auditiva
                    ? 'Escreva ou mostre algo pela câmera. Eu respondo sempre em texto.'
                    : 'Fale, escreva ou mostre algo pela câmera.'}
              </p>
              <div style={simples ? styles.sugestoesSimples : styles.sugestoes}>
                {sugestoes.map((s, i) => {
                  const Icone = s.icone
                  return (
                    <span
                      key={s.texto}
                      className="anim-up"
                      style={{
                        display: 'flex',
                        gridColumn: s.longa ? '1 / -1' : undefined,
                        animationDelay: `${0.22 + i * 0.05}s`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => enviar(s.texto)}
                        className="tap"
                        style={{
                          ...styles.sugestao,
                          background: s.cor,
                          flexDirection: simples || s.longa ? 'row' : 'column',
                          alignItems: simples || s.longa ? 'center' : 'flex-start',
                          minHeight: simples ? 64 : s.longa ? 56 : 104,
                          fontSize: simples ? 19 : 15,
                        }}
                      >
                        <span style={styles.sugestaoIcone}>
                          <Icone size={simples ? 22 : 18} color="#000" strokeWidth={2.2} aria-hidden="true" />
                        </span>
                        <span>{s.texto}</span>
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          ) : (
            <div
              style={styles.listaMsgs}
              role="log"
              aria-live={visual || (vozLigada && !auditiva) ? 'off' : 'polite'}
            >
              {mensagens.map(m => (
                <ChatBolha
                  key={m.chave}
                  role={m.role}
                  texto={m.content}
                  acoes={m.acoes || []}
                  lugares={m.lugares}
                  onLugar={l => {
                    pararTudo()
                    const q = new URLSearchParams({
                      destino: l.nome,
                      lat: String(l.lat),
                      lon: String(l.lng),
                    })
                    if (l.metros != null && l.metros < 1200) q.set('modo', 'pe')
                    navigate(`/mapa?${q}`)
                  }}
                  imagem={m.role === 'user' ? miniaturas[m.ts] : undefined}
                  erro={!!m.erro}
                  config={!!m.config}
                  interrompida={!!m.interrompida}
                  onConfig={() => navigate('/configuracoes?secao=ia')}
                  onRepetir={
                    m.repetir && !ocupado
                      ? () => {
                          setLocais(l => l.filter(x => x.ts !== m.ts && x.ts !== m.ts - 1))
                          enviar(m.repetir)
                        }
                      : undefined
                  }
                  onOuvir={
                    !auditiva && m.role === 'assistant' && !m.erro ? () => ouvirDeNovo(m.content) : undefined
                  }
                  onAcao={rota => navigate(rota)}
                  simples={simples}
                  animar={!!m.local && m.role === 'assistant'}
                  entrada={inicio.entrada.get(m.chave)}
                />
              ))}
              {mostrarPendente && (
                <ChatBolha
                  role="user"
                  texto={pendente.content}
                  imagem={pendente.imagem}
                  simples={simples}
                  animar
                />
              )}
              {mostrarStream ? (
                <ChatBolha
                  role="assistant"
                  texto={stream.texto}
                  simples={simples}
                  digitando={gerando}
                  animar
                />
              ) : procurando ? (
                <div className="bolha-kleo anim-up" style={styles.procurando} role="status">
                  <LoaderCircle size={20} className="girar" aria-hidden="true" />
                  Procurando {procurando} perto de você...
                </div>
              ) : (
                gerando &&
                fase === 'pensando' && (
                  <div className="bolha-kleo" style={styles.digitando} aria-label="Kleo está pensando">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        style={{
                          ...styles.pontinho,
                          animation: `chatDot 1.2s ${i * 0.16}s var(--ease-in-out) infinite`,
                        }}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          )}
          <div
            ref={fimRef}
            style={{
              height: 1,
            }}
          />
        </div>

        {envioPendente && (
          <div className="anim-up" style={styles.pendente} role="status" aria-live="polite">
            <Avatar
              nome={envioPendente.contato.nome}
              foto={envioPendente.contato.foto}
              chave={envioPendente.contato.uid}
              tamanho={40}
            />
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <span style={styles.pendenteTitulo}>
                Enviando para {nomeExibicao(envioPendente.contato)}...
              </span>
              <span style={styles.pendenteTexto}>"{envioPendente.conteudo}"</span>
              <span style={styles.pendenteTrilho}>
                <span key={envioPendente.ate} className="chat-pendente-barra" style={styles.pendenteBarra} />
              </span>
            </div>
            <button
              type="button"
              className="tap"
              style={styles.pendenteBotao}
              onClick={() => setEnvioPendente(null)}
              aria-label="Cancelar envio"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="tap"
              style={{
                ...styles.pendenteBotao,
                background: '#000',
                color: '#fff',
              }}
              onClick={() =>
                setEnvioPendente(p =>
                  p
                    ? {
                        ...p,
                        ate: Date.now(),
                      }
                    : p,
                )
              }
              aria-label="Enviar agora"
            >
              <Send size={17} aria-hidden="true" />
            </button>
          </div>
        )}

        {aviso && (
          <div key={aviso} className="anim-up" style={styles.aviso} role="alert">
            {aviso}
          </div>
        )}

        <form
          style={styles.entrada}
          onSubmit={e => {
            e.preventDefault()
            if (!ouvindo) enviar(texto)
          }}
        >
          <div style={styles.linhaEntrada}>
            <div
              style={{
                ...styles.campo,
                height: alvo + 8,
                boxShadow: ouvindo
                  ? 'var(--sombra), inset 0 0 0 2px var(--erro)'
                  : focado
                    ? 'var(--sombra), inset 0 0 0 2px #000'
                    : 'var(--sombra)',
              }}
            >
              {!simples && (
                <button
                  type="button"
                  onClick={() => setCameraAberta(true)}
                  className="tap"
                  style={{
                    ...styles.botaoCampo,
                    width: alvo - 4,
                    height: alvo - 4,
                    opacity: ocupado ? 0.45 : 1,
                  }}
                  aria-label="Abrir Câmera Kleo"
                  disabled={ocupado}
                >
                  <Camera size={21} aria-hidden="true" />
                </button>
              )}
              <input
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onFocus={() => setFocado(true)}
                onBlur={() => setFocado(false)}
                placeholder={ouvindo ? 'Ouvindo...' : simples ? 'Escreva aqui' : 'Mensagem para a Kleo'}
                aria-label="Mensagem para a Kleo"
                readOnly={ouvindo}
                enterKeyHint="send"
                style={{
                  ...styles.input,
                  paddingLeft: simples ? 20 : 4,
                  fontSize: simples ? 19 : 16,
                  fontStyle: ouvindo && texto ? 'italic' : 'normal',
                }}
              />

              {ouvindo && (
                <span className="wave anim-fade" style={styles.onda} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              )}
              {ocupado ? (
                <span className="anim-pop" style={styles.centro}>
                  <button
                    type="button"
                    onClick={pararTudo}
                    className="tap"
                    style={{
                      ...styles.enviar,
                      width: alvo - 4,
                      height: alvo - 4,
                    }}
                    aria-label="Parar resposta"
                  >
                    <Square size={16} color="#fff" fill="#fff" aria-hidden="true" />
                  </button>
                </span>
              ) : (
                temTexto &&
                !ouvindo && (
                  <span className="anim-pop" style={styles.centro}>
                    <button
                      type="submit"
                      className="tap"
                      style={{
                        ...styles.enviar,
                        width: alvo - 4,
                        height: alvo - 4,
                      }}
                      aria-label="Enviar mensagem"
                    >
                      <ArrowUp size={21} color="#fff" aria-hidden="true" />
                    </button>
                  </span>
                )
              )}
            </div>

            {!simples && (
              <BotaoMic ouvindo={ouvindo} ocupado={ocupado} onClick={alternarEscuta} tamanho={alvo + 8} />
            )}
          </div>

          {simples && (
            <div style={styles.linhaSimples}>
              <button
                type="button"
                onClick={alternarEscuta}
                disabled={ocupado}
                className={'tap' + (ouvindo ? ' pulse-ring' : '')}
                style={{
                  ...styles.micGrande,
                  background: ouvindo ? 'var(--erro)' : '#000',
                  opacity: ocupado ? 0.45 : 1,
                }}
                aria-pressed={ouvindo}
              >
                <span key={ouvindo ? 'o' : 'm'} className="anim-pop" style={styles.centro}>
                  {ouvindo ? (
                    <span
                      className="wave"
                      style={{
                        color: '#fff',
                        height: 24,
                      }}
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    <Mic size={28} color="#fff" aria-hidden="true" />
                  )}
                </span>
                <span>{ouvindo ? 'Parar' : 'Toque e fale'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCameraAberta(true)}
                disabled={ocupado}
                className="tap"
                style={{
                  ...styles.camGrande,
                  opacity: ocupado ? 0.45 : 1,
                }}
              >
                <Camera size={26} color="#000" aria-hidden="true" />
                <span>Foto</span>
              </button>
            </div>
          )}
        </form>
      </div>

      <Modal
        aberto={confirmarLimpar}
        onFechar={() => setConfirmarLimpar(false)}
        titulo="Limpar conversa?"
        texto="As mensagens serão apagadas. O que a Kleo lembra sobre você continua salvo."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setConfirmarLimpar(false),
          },
          {
            label: 'Apagar',
            variante: 'perigo',
            onClick: limpar,
          },
        ]}
      />

      <ChatCamera
        aberto={cameraAberta}
        onFechar={() => setCameraAberta(false)}
        onEnviar={enviarImagem}
        simples={simples}
      />

      <GravadorSheet aberto={!!audioPara} contato={audioPara} onFechar={() => setAudioPara(null)} />

      <style>{keyframes}</style>
    </Tela>
  )
}
function BotaoMic({ ouvindo, ocupado, onClick, tamanho }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={ocupado}
      className={'tap' + (ouvindo ? ' pulse-ring' : '')}
      style={{
        ...styles.mic,
        width: tamanho,
        height: tamanho,
        background: ouvindo ? 'var(--erro)' : '#000',
        animation: ouvindo ? 'chatMic 1.2s ease-in-out infinite' : 'none',
        opacity: ocupado ? 0.45 : 1,
      }}
      aria-label={ouvindo ? 'Parar de ouvir' : 'Falar com a Kleo'}
      aria-pressed={ouvindo}
    >
      <span key={ouvindo ? 'parar' : 'mic'} className="anim-pop" style={styles.centro}>
        {ouvindo ? (
          <span
            className="wave"
            style={{
              color: '#fff',
            }}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        ) : (
          <Mic size={24} color="#fff" aria-hidden="true" />
        )}
      </span>
    </button>
  )
}
const keyframes = `
@keyframes chatDot { 0%,80%,100% { opacity: 0.35; transform: translateY(0) scale(0.85) } 40% { opacity: 1; transform: translateY(-4px) scale(1) } }
@keyframes chatMic { 0%,100% { box-shadow: 0 0 0 0 rgba(229,72,77,0.4), var(--sombra) } 50% { box-shadow: 0 0 0 12px rgba(229,72,77,0), var(--sombra) } }
@keyframes chatPonto { from { box-shadow: 0 0 0 0 currentColor } to { box-shadow: 0 0 0 6px transparent } }
@keyframes chatCursor { 0%,100% { opacity: 1 } 50% { opacity: 0.2 } }
.chat-ponto-vivo { animation: chatPonto 1.3s var(--ease-out) infinite; }
.chat-cursor { animation: chatCursor 0.9s ease-in-out infinite; }
.chat-pendente-barra { animation: chatPendente 4s linear both; }
@keyframes chatPendente { from { width: 0% } to { width: 100% } }
`
const styles = {
  procurando: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    padding: '12px 16px',
    background: 'var(--surface)',
    borderRadius: 22,
    boxShadow: 'var(--sombra)',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text)',
  },
  pendente: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '0 14px 8px',
    padding: '10px 10px 10px 12px',
    background: 'var(--surface)',
    borderRadius: 22,
    boxShadow: 'var(--sombra)',
  },
  pendenteTitulo: {
    display: 'block',
    fontSize: 14,
    fontWeight: 800,
  },
  pendenteTexto: {
    display: 'block',
    fontSize: 14,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pendenteTrilho: {
    display: 'block',
    height: 4,
    borderRadius: 2,
    background: 'var(--surface-2)',
    marginTop: 6,
    overflow: 'hidden',
  },
  pendenteBarra: {
    display: 'block',
    height: '100%',
    background: '#000',
    borderRadius: 2,
  },
  pendenteBotao: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  faixaTrabalho: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 16px 6px',
    padding: '8px 8px 8px 14px',
    background: 'var(--lima)',
    borderRadius: 'var(--r-btn)',
    fontSize: 15,
    color: '#000',
  },
  faixaFechar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    flexShrink: 0,
  },
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '10px 16px 10px',
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    flexShrink: 0,
  },
  identidade: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  mascoteCaixa: {
    width: 60,
    height: 60,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--sombra)',
    overflow: 'hidden',
  },
  nome: {
    fontWeight: 800,
    lineHeight: 1.05,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: 'var(--text-2)',
    marginTop: 3,
    fontWeight: 500,
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.35s, color 0.35s',
  },
  centro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  acoesTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  mensagens: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '8px 16px 12px',
  },
  vazio: {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'safe center',
    textAlign: 'center',
    padding: '8px 0 8px',
  },
  palco: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 190,
    height: 170,
  },
  disco: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: '50%',
    background: 'var(--lavanda)',
    opacity: 0.55,
  },
  saudacao: {
    fontWeight: 800,
    lineHeight: 1,
    marginTop: 16,
    color: 'var(--text)',
  },
  dica: {
    color: 'var(--text-2)',
    marginTop: 12,
    maxWidth: 340,
    lineHeight: 1.4,
  },
  sugestoes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginTop: 24,
    width: '100%',
    textAlign: 'left',
  },
  sugestoesSimples: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 22,
    width: '100%',
    textAlign: 'left',
  },
  sugestao: {
    flex: 1,
    display: 'flex',
    gap: 10,
    padding: '14px 16px',
    justifyContent: 'flex-start',
    borderRadius: 'var(--r-card-m)',
    color: '#000',
    fontWeight: 600,
    lineHeight: 1.25,
    boxShadow: 'var(--sombra)',
    textAlign: 'left',
  },
  sugestaoIcone: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.65)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listaMsgs: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingTop: 4,
  },
  digitando: {
    alignSelf: 'flex-start',
    display: 'flex',
    gap: 6,
    padding: '16px 20px',
    background: 'var(--surface)',
    borderRadius: 25,
    borderBottomLeftRadius: 8,
    boxShadow: 'var(--sombra)',
  },
  pontinho: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--lavanda-forte)',
  },
  aviso: {
    margin: '0 16px 8px',
    padding: '12px 16px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--lima)',
    color: '#000',
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'center',
    boxShadow: 'var(--sombra)',
  },
  entrada: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '6px 14px 12px',
    flexShrink: 0,
  },
  linhaEntrada: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  campo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'var(--surface)',
    borderRadius: 'var(--r-btn)',
    padding: '0 6px',
    transition: 'box-shadow 0.25s',
  },
  botaoCampo: {
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
  },
  onda: {
    color: 'var(--erro)',
    marginRight: 10,
    flexShrink: 0,
  },
  enviar: {
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mic: {
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: 'var(--sombra)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.25s, opacity 0.2s',
  },
  linhaSimples: {
    display: 'flex',
    gap: 10,
  },
  micGrande: {
    flex: 1,
    minHeight: 72,
    borderRadius: 'var(--r-btn)',
    color: '#fff',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    fontSize: 22,
    fontWeight: 700,
    transition: 'background 0.25s, opacity 0.2s',
  },
  camGrande: {
    width: 104,
    minHeight: 72,
    borderRadius: 'var(--r-btn)',
    background: 'var(--lavanda)',
    color: '#000',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    fontSize: 16,
    fontWeight: 700,
  },
}
