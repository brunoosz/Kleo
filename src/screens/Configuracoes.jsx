import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  User,
  MapPin,
  Cake,
  HeartHandshake,
  Pencil,
  Sparkles,
  RotateCcw,
  Brain,
  Trash2,
  BookOpen,
  TriangleAlert,
  Check,
  Bell,
  BellRing,
  BellOff,
  Wand2,
  Accessibility,
  Save,
  Moon,
  Plus,
  Share2,
  Info,
  Smile,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react'
import Tela from '../components/Tela'
import Mascote from '../components/Mascote'
import Camada from '../components/Camada'
import { ConfigGrupo, ConfigLinha, ConfigBloco } from '../components/ConfigGrupo'
import ConfigSheet from '../components/ConfigSheet'
import ConfigProfissoes from '../components/ConfigProfissoes'
import ConfigIA from '../components/ConfigIA'
import ConfigVozes from '../components/ConfigVozes'
import ConfigNavegacao from '../components/ConfigNavegacao'
import ConfigConversas from '../components/ConfigConversas'
import ConfigConta from '../components/ConfigConta'
import PainelDono from '../components/PainelDono'
import useConta from '../hooks/useConta'
import InstalarApp from '../components/InstalarApp'
import LogoKleo from '../components/LogoKleo'
import CampoCidade from '../components/CampoCidade'
import { Card, Botao, Chip, Campo, Sheet, Tag, Toggle, Segmentado, SeloMarca } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useAcessibilidade from '../hooks/useAcessibilidade'
import useModoSimples from '../hooks/useModoSimples'
import useSaida from '../hooks/useSaida'
import useRemocao from '../components/profissao/useRemocao'
import { salvar, remover, limparTudo } from '../lib/storage'
import { falar } from '../lib/voz'
import { permissao, pedirPermissao, notificar } from '../lib/notificacoes'
import { VERSAO_APP, VERSAO_BUILD, compartilharApp } from '../lib/instalar'
import { NECESSIDADES, SEM_NECESSIDADE, getProfissao, getNecessidades } from '../data/profissoes'
import { getMascoteSpec, resolverMascote } from '../data/mascotes'
import {
  AJUSTES_PERFIL,
  FAIXAS_IDADE,
  CHAVE_SOBRE_VOCE,
  idadeValida,
  faixaDaIdade,
  textoIdade,
  normalizarPerfil,
  sugestoesDoPerfil,
  definirAjusteManual,
  voltarAoAutomatico,
  salvarEAplicarPerfil,
  memoriaDoPerfil,
} from '../lib/perfil'
const GENEROS = ['Masculino', 'Feminino', 'Outro']
const COR_AJUSTE = {
  kleo_fonte_grande: 'ceu',
  kleo_alto_contraste: 'mist',
  kleo_leitura_voz: 'lima',
  kleo_avisos_visuais: 'lavanda',
  kleo_transcricao_auto: 'ceu',
  kleo_mapa_acessivel: 'lima',
}
const SECOES = {
  perfil: 'perfil',
  apoio: 'perfil',
  apoios: 'perfil',
  profissoes: 'profissoes',
  profissao: 'profissoes',
  mascote: 'mascote',
  ia: 'ia',
  vozes: 'vozes',
  voz: 'vozes',
  acessibilidade: 'acessibilidade',
  notificacoes: 'notificacoes',
  navegacao: 'navegacao',
  barra: 'navegacao',
  nav: 'navegacao',
  memoria: 'memoria',
  conversas: 'conversas',
  pessoas: 'conversas',
  emergencia: 'conversas',
  dados: 'dados',
  sobre: 'sobre',
  instalar: 'sobre',
  app: 'sobre',
  compartilhar: 'sobre',
  versao: 'sobre',
  conta: 'conta',
  entrar: 'conta',
  dono: 'dono',
  ajuda: 'ajuda',
  tutorial: 'ajuda',
}
const SECOES_DONO = new Set(['vozes', 'dono'])
function useAjustesPerfil(profile) {
  const [simples] = useStorage('kleo_modo_simples', null)
  const [fonte] = useStorage('kleo_fonte_grande', null)
  const [contraste] = useStorage('kleo_alto_contraste', null)
  const [leitura] = useStorage('kleo_leitura_voz', null)
  const [avisos] = useStorage('kleo_avisos_visuais', null)
  const [transcricao] = useStorage('kleo_transcricao_auto', null)
  const [mapa] = useStorage('kleo_mapa_acessivel', null)
  const [origem] = useStorage('kleo_config_origem', {})
  const salvos = {
    kleo_modo_simples: simples,
    kleo_fonte_grande: fonte,
    kleo_alto_contraste: contraste,
    kleo_leitura_voz: leitura,
    kleo_avisos_visuais: avisos,
    kleo_transcricao_auto: transcricao,
    kleo_mapa_acessivel: mapa,
  }
  const sugerido = sugestoesDoPerfil(profile)
  return AJUSTES_PERFIL.map(a => ({
    ...a,
    valor: typeof salvos[a.chave] === 'boolean' ? salvos[a.chave] : sugerido[a.chave],
    manual: origem?.[a.chave] === 'manual',
  }))
}
export default function Configuracoes() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const simples = useModoSimples()
  const [profile] = useStorage('kleo_profile', null)
  const perfil = normalizarPerfil(profile)
  const [mascoteSalvo] = useStorage('kleo_mascote', null)
  const [memoria, setMemoria] = useStorage('kleo_memory', {})
  const { leituraVoz, escuro } = useAcessibilidade()
  const [, setTema] = useStorage('kleo_tema', 'claro')
  const ajustes = useAjustesPerfil(profile)
  const [editMem, setEditMem] = useState(null)
  const { ehDono } = useConta()
  const pedida = SECOES[params.get('secao')] || null
  const secao = SECOES_DONO.has(pedida) && !ehDono ? null : pedida
  const [destaque, setDestaque] = useState(secao)
  const [navAnterior, setNavAnterior] = useState(location.key)
  if (navAnterior !== location.key) {
    setNavAnterior(location.key)
    setDestaque(secao)
  }
  useEffect(() => {
    if (!secao) return
    const t1 = setTimeout(() => {
      document.getElementById(`cfg-${secao}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 380)
    const t2 = setTimeout(() => setDestaque(null), 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [secao, location.key])
  const [aviso, setAviso] = useState(null)
  const timerAviso = useRef(null)
  const avisar = useCallback(
    (texto, fala = texto) => {
      setAviso({
        texto,
        id: Date.now(),
      })
      clearTimeout(timerAviso.current)
      timerAviso.current = setTimeout(() => setAviso(null), 2400)
      if (leituraVoz)
        falar(fala, {
          forcar: true,
        })
    },
    [leituraVoz],
  )
  useEffect(() => () => clearTimeout(timerAviso.current), [])
  const [confirmar, setConfirmar] = useState(null)
  const [textoReset, setTextoReset] = useState('')
  const fecharConfirmar = () => {
    setConfirmar(null)
    setTextoReset('')
  }
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(null)
  const [mudou, setMudou] = useState(null)
  const abrirEdicao = () => {
    const p = perfil || {}
    setRascunho({
      name: p.name || '',
      gender: p.gender || '',
      genderCustom: p.genderCustom || '',
      idadeTexto: p.idade ? String(p.idade) : '',
      faixa: p.age || '',
      city: p.city || '',
      cityCoords: p.cityCoords || null,
      necessidades: p.necessidades || [],
      semApoio: !!perfil && !(p.necessidades || []).length,
    })
    setEditando(true)
  }
  const alterar = (campo, valor) =>
    setRascunho(r => ({
      ...r,
      [campo]: valor,
    }))
  const alternarApoio = id =>
    setRascunho(r => {
      const lista = r.necessidades.includes(id)
        ? r.necessidades.filter(n => n !== id)
        : [...r.necessidades, id]
      return {
        ...r,
        necessidades: lista,
        semApoio: false,
      }
    })
  const salvarEdicao = () => {
    const idade = idadeValida(rascunho.idadeTexto) ? Math.round(Number(rascunho.idadeTexto)) : null
    const r = salvarEAplicarPerfil({
      name: rascunho.name.trim(),
      gender: rascunho.gender,
      genderCustom: rascunho.gender === 'Outro' ? rascunho.genderCustom.trim() : '',
      idade,
      age: idade ? faixaDaIdade(idade) : rascunho.faixa,
      city: rascunho.city.trim(),
      cityCoords: rascunho.city.trim() ? rascunho.cityCoords || null : null,
      necessidades: rascunho.semApoio ? [] : rascunho.necessidades,
      profissao: perfil?.profissao || 'outro',
      onboardingFeito: true,
    })
    setEditando(false)
    setMudou(m =>
      r.mudancas.length || r.mantidos.length
        ? {
            ...r,
            id: (m?.id || 0) + 1,
          }
        : null,
    )
    const resumo = r.mudancas.map(m => `${m.rotulo} ${m.depois ? 'ligado' : 'desligado'}`).join(', ')
    avisar(
      r.mudancas.length ? 'Perfil salvo. O app mudou junto.' : 'Perfil salvo',
      r.mudancas.length ? `Perfil salvo. O app mudou junto: ${resumo}.` : 'Perfil salvo',
    )
  }
  const prof = getProfissao(perfil?.profissao)
  const necs = getNecessidades(perfil)
  const generoTexto = perfil?.gender === 'Outro' ? perfil?.genderCustom || 'Outro' : perfil?.gender
  const mascoteAuto = !mascoteSalvo || mascoteSalvo === 'auto'
  const mascoteId = resolverMascote(perfil, mascoteSalvo)
  const mascote = getMascoteSpec(mascoteId)
  const alternarAuto = ligar => {
    salvar('kleo_mascote', ligar ? 'auto' : mascoteId)
    avisar(ligar ? 'Mascote automático' : `Mascote fixo: ${mascote.nome}`)
  }
  const simplesAjuste = ajustes.find(a => a.chave === 'kleo_modo_simples')
  const acessManual = ajustes.some(a => a.manual)
  const modoSimplesValor = !simplesAjuste?.manual ? 'auto' : simplesAjuste.valor ? 'sim' : 'nao'
  const mudarModoSimples = v => {
    if (v === 'auto') voltarAoAutomatico(['kleo_modo_simples'])
    else definirAjusteManual('kleo_modo_simples', v === 'sim')
    avisar(
      v === 'auto'
        ? 'Modo simples automático'
        : v === 'sim'
          ? 'Modo simples ligado'
          : 'Modo simples desligado',
    )
  }
  const mudarAjuste = (a, v) => {
    definirAjusteManual(a.chave, v)
    avisar(`${a.rotulo}: ${v ? 'ligado' : 'desligado'}`)
  }
  const restaurarAuto = () => {
    voltarAoAutomatico()
    avisar('Tudo no automático pelo perfil')
  }
  const [estadoNotif, setEstadoNotif] = useState(() => permissao())
  const [pedindo, setPedindo] = useState(false)
  const ativarNotificacoes = async () => {
    setPedindo(true)
    const r = await pedirPermissao()
    setPedindo(false)
    setEstadoNotif(r)
    if (r === 'granted') {
      notificar('Notificações ativadas', {
        corpo: 'A Kleo vai avisar seus lembretes e remédios.',
        tag: 'kleo-teste',
        url: '/configuracoes',
      })
      avisar('Notificações ativadas')
    }
  }
  const testarNotificacao = () => {
    notificar('Teste da Kleo', {
      corpo: 'Assim chegam seus lembretes.',
      tag: 'kleo-teste',
      url: '/configuracoes',
    })
    avisar('Notificação enviada')
  }
  const NOTIF = {
    granted: {
      icone: BellRing,
      cor: 'lima',
      titulo: 'Notificações ativadas',
      detalhe: 'Você recebe lembretes de remédios, rotinas e agenda.',
    },
    denied: {
      icone: BellOff,
      cor: 'mist',
      titulo: 'Bloqueadas no navegador',
      detalhe: 'Libere nas configurações do navegador (cadeado ao lado do endereço).',
    },
    default: {
      icone: Bell,
      cor: 'lavanda',
      titulo: 'Notificações desligadas',
      detalhe: 'Ative para não perder remédios e compromissos.',
    },
    indisponivel: {
      icone: BellOff,
      cor: 'mist',
      titulo: 'Não disponível',
      detalhe: 'Este navegador não mostra notificações. No iPhone, adicione o app à tela de início.',
    },
  }
  const notif = NOTIF[estadoNotif] || NOTIF.default
  const memObj = memoria && typeof memoria === 'object' && !Array.isArray(memoria) ? memoria : {}
  const sobreVoce = typeof memObj[CHAVE_SOBRE_VOCE] === 'string' ? memObj[CHAVE_SOBRE_VOCE] : ''
  const memorias = Object.entries(memObj).filter(([chave]) => chave !== CHAVE_SOBRE_VOCE)
  const apagarMemoria = chave =>
    setMemoria(m => {
      const n = {
        ...(m || {}),
      }
      delete n[chave]
      return n
    })
  const { saindo: memSaindo, remover: excluirMemoria } = useRemocao(apagarMemoria)
  const limparMemoria = () => {
    remover('kleo_memory')
    remover('kleo_memoria_perfil')
    remover('kleo_chat_history')
    fecharConfirmar()
    avisar('Memória apagada')
  }
  const atualizarSobre = () => {
    if (!perfil) return
    memoriaDoPerfil(perfil)
    avisar('Sobre você atualizado pelo perfil')
  }
  const compartilhar = async () => {
    const r = await compartilharApp()
    if (r === 'copiado') avisar('Link copiado')
    else if (r === 'erro') avisar('Não consegui compartilhar agora')
  }
  const versao = `${VERSAO_APP}${VERSAO_BUILD ? ` (${VERSAO_BUILD})` : ''}`
  const reverTutorial = () => {
    remover('kleo_tutorial_done')
    fecharConfirmar()
    navigate('/tutorial')
  }
  const refazerPerguntas = () => navigate('/onboarding?refazer=1')
  const resetarApp = () => {
    limparTudo()
    navigate('/', {
      replace: true,
    })
    window.location.reload()
  }
  return (
    <Tela titulo="Ajustes" voltar>
      <div className="stagger" style={styles.conteudo}>
        <Card cor="lavanda" tamanho="g" style={styles.cabecalho}>
          <div
            className="anim-pop"
            style={{
              ...styles.mascoteWrap,
              animationDelay: '0.12s',
            }}
          >
            <Mascote id={mascoteId} tamanho={104} />
          </div>
          <div style={styles.cabecalhoTextos}>
            <h2
              style={{
                ...styles.nome,
                fontSize: simples ? 30 : 28,
              }}
            >
              {perfil?.name || 'Você'}
            </h2>
            <p style={styles.cabecalhoSub}>
              {[prof?.label, perfil?.city].filter(Boolean).join(' · ') || 'Complete seu perfil'}
            </p>
            <div style={styles.tags}>
              {necs.map(n => (
                <Tag key={n.id} cor="branco" icone={n.icone || n.icon}>
                  {n.label}
                </Tag>
              ))}
              {simples && (
                <Tag cor="lima" icone={Accessibility}>
                  Modo simples
                </Tag>
              )}
            </div>
          </div>
          <Botao
            variante="primario"
            icone={Pencil}
            cheio
            onClick={abrirEdicao}
            style={{
              marginTop: 18,
            }}
          >
            Editar perfil
          </Botao>
        </Card>

        <ConfigConta avisar={avisar} destaque={destaque === 'conta'} />

        {mudou && (
          <MudancasPerfil key={mudou.id} mudou={mudou} simples={simples} onFechar={() => setMudou(null)} />
        )}

        <ConfigGrupo id="perfil" titulo="Perfil" destaque={destaque === 'perfil'}>
          <ConfigLinha
            icone={User}
            cor="lavanda"
            titulo="Nome"
            detalhe={perfil?.name || 'Não informado'}
            onClick={abrirEdicao}
          />
          {!simples && (
            <ConfigLinha
              icone={HeartHandshake}
              cor="mist"
              titulo="Gênero"
              detalhe={generoTexto || 'Não informado'}
              onClick={abrirEdicao}
            />
          )}
          <ConfigLinha
            icone={Cake}
            cor="lima"
            titulo="Idade"
            detalhe={textoIdade(perfil) || 'Não informada'}
            onClick={abrirEdicao}
          />
          <ConfigLinha
            icone={MapPin}
            cor="ceu"
            titulo="Cidade"
            detalhe={perfil?.city || 'Não informada'}
            onClick={abrirEdicao}
          />
          <ConfigLinha
            icone={Accessibility}
            cor="lavanda"
            titulo="Apoios"
            detalhe={necs.length ? necs.map(n => n.label).join(', ') : 'Nenhum'}
            onClick={abrirEdicao}
          />
          <ConfigLinha
            icone={RefreshCw}
            cor="lima"
            titulo="Refazer as perguntas"
            detalhe="Com suas respostas atuais"
            onClick={refazerPerguntas}
            ultima
          />
        </ConfigGrupo>

        <ConfigProfissoes
          key={secao === 'profissoes' ? `prof-${location.key}` : 'prof'}
          destaque={destaque === 'profissoes'}
          abrirAdicionar={secao === 'profissoes' && params.get('acao') !== 'ver'}
          avisar={avisar}
        />

        <ConfigGrupo id="mascote" titulo="Mascote" destaque={destaque === 'mascote'}>
          <ConfigBloco style={styles.mascoteBloco}>
            <span style={styles.mascotePalco}>
              <Mascote id={mascoteId} tamanho={84} />
            </span>
            <span style={styles.mascoteTextos}>
              <span style={styles.mascoteNome}>{mascote.nome}</span>
              <span style={styles.mascoteDesc}>{mascote.descricao}</span>
              {mascoteAuto && (
                <Tag
                  cor="lima"
                  icone={Wand2}
                  style={{
                    marginTop: 6,
                    alignSelf: 'flex-start',
                  }}
                >
                  Automático
                </Tag>
              )}
            </span>
          </ConfigBloco>
          <ConfigLinha
            icone={Wand2}
            cor="lima"
            titulo="Automático pelo perfil"
            detalhe="Combina com seus apoios e sua profissão"
            direita={
              <Toggle ligado={mascoteAuto} onChange={alternarAuto} label="Mascote automático pelo perfil" />
            }
          />
          <ConfigLinha
            icone={Sparkles}
            cor="lavanda"
            titulo="Trocar mascote"
            onClick={() => navigate('/mascote?voltar=1')}
            ultima
          />
        </ConfigGrupo>

        <ConfigIA destaque={destaque === 'ia'} avisar={avisar} />

        <ConfigConversas destaque={destaque === 'conversas'} avisar={avisar} />

        <ConfigGrupo
          id="acessibilidade"
          titulo="Acessibilidade"
          destaque={destaque === 'acessibilidade'}
          rodape="No automático, a Kleo ajusta tudo pela sua idade e pelos seus apoios."
        >
          <ConfigBloco>
            <div style={styles.simplesTopo}>
              <span style={styles.simplesIcone}>
                <Accessibility size={22} color="#000" aria-hidden="true" />
              </span>
              <span style={styles.simplesTextos}>
                <span style={styles.simplesTitulo}>Modo simples</span>
                <span style={styles.simplesDesc}>
                  {modoSimplesValor === 'auto'
                    ? `Automático: ${simplesAjuste?.valor ? 'ligado pela sua idade' : 'desligado'}.`
                    : 'Menos coisas na tela, letras e botões maiores.'}
                </span>
              </span>
            </div>
            <Segmentado
              opcoes={[
                {
                  id: 'auto',
                  label: 'Automático',
                },
                {
                  id: 'sim',
                  label: 'Ligado',
                },
                {
                  id: 'nao',
                  label: 'Desligado',
                },
              ]}
              valor={modoSimplesValor}
              onChange={mudarModoSimples}
            />
          </ConfigBloco>
          {ajustes
            .filter(a => a.chave !== 'kleo_modo_simples')
            .map(a => (
              <ConfigLinha
                key={a.chave}
                icone={a.icone}
                cor={COR_AJUSTE[a.chave] || 'lavanda'}
                titulo={a.rotulo}
                detalhe={
                  simples
                    ? a.manual
                      ? 'Escolhido por você'
                      : 'Automático pelo perfil'
                    : `${a.detalhe}. ${a.manual ? 'Escolhido por você.' : 'Automático pelo perfil.'}`
                }
                direita={<Toggle ligado={a.valor} onChange={v => mudarAjuste(a, v)} label={a.rotulo} />}
              />
            ))}
          <ConfigLinha
            icone={Moon}
            cor="forte"
            titulo="Modo escuro"
            detalhe={escuro ? 'Ligado' : 'O padrão é o claro'}
            direita={
              <Toggle
                ligado={escuro}
                onChange={v => {
                  setTema(v ? 'escuro' : 'claro')
                  avisar(v ? 'Modo escuro ligado' : 'Modo claro')
                }}
                label="Modo escuro"
              />
            }
            ultima={!acessManual}
          />
          {acessManual && (
            <ConfigLinha
              className="anim-up"
              icone={RotateCcw}
              cor="lavanda"
              titulo="Voltar ao automático"
              detalhe="Seguir a idade e os apoios do perfil"
              onClick={restaurarAuto}
              semChevron
              ultima
            />
          )}
        </ConfigGrupo>

        <ConfigGrupo id="notificacoes" titulo="Notificações" destaque={destaque === 'notificacoes'}>
          <ConfigLinha
            key={estadoNotif}
            className="anim-fade"
            icone={notif.icone}
            cor={notif.cor}
            titulo={notif.titulo}
            detalhe={notif.detalhe}
          />
          <ConfigBloco style={styles.acoes}>
            {estadoNotif === 'default' && (
              <Botao
                variante="primario"
                icone={BellRing}
                cheio
                carregando={pedindo}
                onClick={ativarNotificacoes}
              >
                Ativar notificações
              </Botao>
            )}
            {estadoNotif === 'granted' && (
              <Botao variante="fantasma" icone={Bell} cheio onClick={testarNotificacao}>
                Enviar um teste
              </Botao>
            )}
            {estadoNotif === 'denied' && (
              <Botao variante="fantasma" icone={RotateCcw} cheio onClick={() => setEstadoNotif(permissao())}>
                Já liberei, verificar
              </Botao>
            )}
          </ConfigBloco>
        </ConfigGrupo>

        <ConfigNavegacao destaque={destaque === 'navegacao'} avisar={avisar} />

        <ConfigGrupo id="memoria" titulo="Memória da Kleo" destaque={destaque === 'memoria'}>
          {sobreVoce ? (
            <ConfigBloco style={styles.sobreBloco}>
              <div style={styles.sobreTopo}>
                <span style={styles.sobreIcone}>
                  <Brain size={20} color="#000" aria-hidden="true" />
                </span>
                <span
                  style={{
                    ...styles.sobreTitulo,
                    fontSize: simples ? 20 : 18,
                  }}
                >
                  {CHAVE_SOBRE_VOCE}
                </span>
                <Tag cor="lima" icone={Wand2}>
                  Do seu perfil
                </Tag>
              </div>
              <p
                key={sobreVoce}
                className="anim-fade"
                style={{
                  ...styles.sobreTexto,
                  fontSize: simples ? 18 : 16,
                }}
              >
                {sobreVoce}
              </p>
              <div style={styles.sobreAcoes}>
                <Botao
                  variante="fantasma"
                  icone={Pencil}
                  onClick={() =>
                    setEditMem({
                      chaveOriginal: CHAVE_SOBRE_VOCE,
                      chave: CHAVE_SOBRE_VOCE,
                      valor: sobreVoce,
                    })
                  }
                  style={{
                    flex: '1 1 140px',
                  }}
                >
                  Editar
                </Botao>
                <Botao
                  variante="suave"
                  icone={RefreshCw}
                  onClick={atualizarSobre}
                  style={{
                    flex: '1 1 180px',
                  }}
                >
                  Atualizar pelo perfil
                </Botao>
              </div>
            </ConfigBloco>
          ) : (
            <ConfigLinha
              icone={Brain}
              cor="lavanda"
              titulo={CHAVE_SOBRE_VOCE}
              detalhe="Ainda vazio. Toque para criar a partir do seu perfil."
              onClick={atualizarSobre}
            />
          )}
          {memorias.length === 0 ? (
            <ConfigLinha
              icone={Brain}
              cor="mist"
              titulo="Nenhuma outra memória"
              detalhe='Diga no chat: "lembre que meu remédio é às 8h".'
            />
          ) : (
            memorias.map(([chave, valor]) => (
              <div key={chave} className={memSaindo(chave) ? 'item-out' : 'anim-up'} style={styles.memLinha}>
                <button
                  type="button"
                  className="tap"
                  style={{
                    ...styles.memTextos,
                    textAlign: 'left',
                    background: 'transparent',
                    padding: 0,
                  }}
                  onClick={() =>
                    setEditMem({
                      chaveOriginal: chave,
                      chave,
                      valor: typeof valor === 'string' ? valor : JSON.stringify(valor),
                    })
                  }
                  aria-label={`Editar ${chave}`}
                >
                  <span style={styles.memChave}>{chave}</span>
                  <span style={styles.memValor}>
                    {typeof valor === 'string' ? valor : JSON.stringify(valor)}
                  </span>
                </button>
                {simples ? (
                  <Botao
                    variante="fantasma"
                    onClick={() => excluirMemoria(chave)}
                    style={{
                      minHeight: 48,
                      padding: '6px 16px',
                    }}
                  >
                    Esquecer
                  </Botao>
                ) : (
                  <button
                    type="button"
                    className="tap"
                    style={styles.lixeira}
                    onClick={() => excluirMemoria(chave)}
                    aria-label={`Esquecer ${chave}`}
                  >
                    <Trash2 size={19} color="var(--erro)" />
                  </button>
                )}
              </div>
            ))
          )}
          <ConfigLinha
            icone={Plus}
            cor="lima"
            titulo="Escrever uma memória"
            detalhe="Conte algo para a Kleo lembrar sempre"
            onClick={() =>
              setEditMem({
                chaveOriginal: null,
                chave: '',
                valor: '',
              })
            }
          />
          <ConfigLinha
            icone={Trash2}
            titulo="Limpar memória da Kleo"
            detalhe="Apaga memórias e conversa"
            destrutivo
            onClick={() => setConfirmar('memoria')}
            semChevron
            ultima
          />
        </ConfigGrupo>

        <Sheet
          aberto={!!editMem}
          onFechar={() => setEditMem(null)}
          titulo={editMem?.chaveOriginal ? 'Editar memória' : 'Nova memória'}
        >
          {editMem && (
            <form
              style={styles.memForm}
              onSubmit={e => {
                e.preventDefault()
                const chave = editMem.chave.trim() || `nota ${new Date().toLocaleDateString('pt-BR')}`
                const valor = editMem.valor.trim()
                if (!valor) return
                setMemoria(m => {
                  const n = {
                    ...(m && typeof m === 'object' && !Array.isArray(m) ? m : {}),
                  }
                  if (editMem.chaveOriginal && editMem.chaveOriginal !== chave)
                    delete n[editMem.chaveOriginal]
                  n[chave] = valor
                  return n
                })
                setEditMem(null)
                avisar('Memória salva')
              }}
            >
              <Campo
                rotulo="Assunto"
                placeholder="Ex: remédio, filha, comida favorita"
                value={editMem.chave}
                onChange={e =>
                  setEditMem(x => ({
                    ...x,
                    chave: e.target.value,
                  }))
                }
              />
              <Campo
                rotulo="O que a Kleo deve lembrar"
                multilinha
                placeholder="Ex: Tomo losartana às 8h e às 20h"
                value={editMem.valor}
                onChange={e =>
                  setEditMem(x => ({
                    ...x,
                    valor: e.target.value,
                  }))
                }
              />
              <Botao
                variante="primario"
                icone={Save}
                cheio
                grande={simples}
                type="submit"
                disabled={!editMem.valor.trim()}
              >
                Salvar memória
              </Botao>
              <p style={styles.memDica}>
                {editMem.chaveOriginal === CHAVE_SOBRE_VOCE
                  ? 'O que você acrescentar aqui continua guardado quando o perfil mudar.'
                  : 'Também dá para pedir no chat: "guarda na memória que minha filha se chama Ana".'}
              </p>
            </form>
          )}
        </Sheet>

        <PainelDono avisar={avisar} destaque={destaque === 'dono'} />

        {ehDono && <ConfigVozes destaque={destaque === 'vozes'} avisar={avisar} />}

        <ConfigGrupo id="ajuda" titulo="Ajuda" destaque={destaque === 'ajuda'}>
          <ConfigLinha
            icone={BookOpen}
            cor="ceu"
            titulo="Rever o tutorial"
            detalhe="Cada botão da barra e o resto do app"
            onClick={() => setConfirmar('tutorial')}
          />
          <ConfigLinha
            icone={RefreshCw}
            cor="lima"
            titulo="Refazer as perguntas do começo"
            detalhe="Idade, apoios, cidade, trabalho e mascote"
            onClick={refazerPerguntas}
            ultima
          />
        </ConfigGrupo>

        <ConfigGrupo
          id="dados"
          titulo="Dados"
          destaque={destaque === 'dados'}
          rodape="Seus dados ficam salvos neste aparelho."
        >
          <ConfigLinha
            icone={TriangleAlert}
            titulo="Apagar tudo e recomeçar"
            detalhe="Perfil, agenda e notas"
            destrutivo
            onClick={() => setConfirmar('reset')}
            semChevron
            ultima
          />
        </ConfigGrupo>

        <ConfigGrupo id="sobre" titulo="Sobre" destaque={destaque === 'sobre'}>
          <InstalarApp variante="linha" avisar={avisar} />
          <ConfigLinha
            icone={Share2}
            cor="lavanda"
            titulo="Compartilhar a Kleo"
            detalhe="Mande o link para família, amigos ou professores"
            onClick={compartilhar}
          />
          <ConfigLinha icone={Info} cor="mist" titulo="Versão do app" detalhe={versao} ultima />
        </ConfigGrupo>
        <section
          style={{
            marginTop: 20,
          }}
        >
          <Card cor="lima" tamanho="g" style={styles.sobre}>
            <SeloMarca tamanho={64} piscar />
            <LogoKleo
              tamanho={46}
              style={{
                marginTop: 14,
              }}
            />
            <p style={styles.sobreTag}>Mais autonomia. Mais liberdade.</p>
            <p style={styles.sobreInfo}>Versão {versao} · by Kheo</p>
            <p style={styles.sobreInfo}>FIAP · CitizenTech 2026</p>
          </Card>
        </section>
      </div>

      <Sheet aberto={editando} onFechar={() => setEditando(false)} titulo="Editar perfil" altura="88vh">
        {rascunho && (
          <div style={styles.form}>
            <Campo
              rotulo="Nome"
              icone={User}
              value={rascunho.name}
              onChange={e => alterar('name', e.target.value)}
              placeholder="Como quer ser chamado"
              autoComplete="given-name"
            />

            {!simples && (
              <>
                <span style={styles.rotulo}>Gênero</span>
                <div style={styles.chips} role="radiogroup" aria-label="Gênero">
                  {GENEROS.map(g => (
                    <Chip
                      key={g}
                      cor="branco"
                      ativo={rascunho.gender === g}
                      onClick={() => alterar('gender', g)}
                      role="radio"
                      aria-checked={rascunho.gender === g}
                    >
                      {g}
                    </Chip>
                  ))}
                </div>
                {rascunho.gender === 'Outro' && (
                  <div className="anim-up">
                    <Campo
                      value={rascunho.genderCustom}
                      onChange={e => alterar('genderCustom', e.target.value)}
                      placeholder="Como você se identifica"
                      aria-label="Gênero personalizado"
                    />
                  </div>
                )}
              </>
            )}

            <Campo
              rotulo="Idade"
              icone={Cake}
              value={rascunho.idadeTexto}
              onChange={e => {
                const t = e.target.value.replace(/\D/g, '').slice(0, 3)
                setRascunho(r => ({
                  ...r,
                  idadeTexto: t,
                  faixa: t ? '' : r.faixa,
                }))
              }}
              inputMode="numeric"
              placeholder="Ex: 72"
              aria-label="Idade em anos"
            />
            <div style={styles.chips} role="radiogroup" aria-label="Ou escolha a faixa de idade">
              {FAIXAS_IDADE.map(f => {
                const ativo = idadeValida(rascunho.idadeTexto)
                  ? faixaDaIdade(rascunho.idadeTexto) === f.id
                  : rascunho.faixa === f.id
                return (
                  <Chip
                    key={f.id}
                    cor="lima"
                    ativo={ativo}
                    role="radio"
                    aria-checked={ativo}
                    onClick={() =>
                      setRascunho(r => ({
                        ...r,
                        faixa: f.id,
                        idadeTexto:
                          idadeValida(r.idadeTexto) && faixaDaIdade(r.idadeTexto) === f.id
                            ? r.idadeTexto
                            : '',
                      }))
                    }
                  >
                    {f.rotulo}
                  </Chip>
                )
              })}
            </div>

            <CampoCidade
              rotulo="Cidade"
              valor={rascunho.city || ''}
              onChange={(texto, info) =>
                setRascunho(r => ({
                  ...r,
                  city: texto,
                  cityCoords:
                    info?.lat != null
                      ? {
                          lat: info.lat,
                          lon: info.lon,
                        }
                      : null,
                }))
              }
            />

            <span style={styles.rotulo}>Precisa de algum apoio? Pode marcar mais de um.</span>
            <div style={styles.apoios} role="group" aria-label="Apoios">
              <Chip
                cor="branco"
                icone={Smile}
                ativo={rascunho.semApoio}
                role="checkbox"
                aria-checked={rascunho.semApoio}
                onClick={() =>
                  setRascunho(r => ({
                    ...r,
                    semApoio: true,
                    necessidades: [],
                  }))
                }
              >
                {SEM_NECESSIDADE.pergunta}
              </Chip>
              {NECESSIDADES.map(n => {
                const ativo = !rascunho.semApoio && rascunho.necessidades.includes(n.id)
                return (
                  <Chip
                    key={n.id}
                    cor="lavanda"
                    icone={n.icone || n.icon}
                    ativo={ativo}
                    role="checkbox"
                    aria-checked={ativo}
                    onClick={() => alternarApoio(n.id)}
                    style={{
                      textAlign: 'left',
                    }}
                  >
                    {n.pergunta}
                  </Chip>
                )
              })}
            </div>
            <p style={styles.ajuda}>
              Ao salvar, o app muda junto (modo simples, letras, voz, avisos e mapa). A profissão fica na
              seção Profissões.
            </p>

            <div style={styles.formAcoes}>
              <Botao
                variante="primario"
                icone={Save}
                grande
                cheio
                onClick={salvarEdicao}
                disabled={!rascunho.name.trim()}
              >
                Salvar perfil
              </Botao>
              <Botao variante="fantasma" grande cheio onClick={() => setEditando(false)}>
                Cancelar
              </Botao>
            </div>
          </div>
        )}
      </Sheet>

      <ConfigSheet
        aberto={confirmar === 'memoria'}
        icon={Brain}
        titulo="Limpar a memória?"
        mensagem="A Kleo esquece o que você pediu para lembrar e a conversa. Agenda, notas e listas continuam."
        confirmarTexto="Limpar memória"
        onConfirmar={limparMemoria}
        onCancelar={fecharConfirmar}
      />
      <ConfigSheet
        aberto={confirmar === 'tutorial'}
        icon={BookOpen}
        destrutivo={false}
        titulo="Ver o tutorial de novo?"
        mensagem="Nada será apagado."
        confirmarTexto="Ver tutorial"
        onConfirmar={reverTutorial}
        onCancelar={fecharConfirmar}
      />
      <ConfigSheet
        aberto={confirmar === 'reset'}
        icon={TriangleAlert}
        titulo="Apagar tudo?"
        mensagem="Perfil, agenda, notas, listas, memória e chaves serão apagados. Não dá para desfazer."
        confirmarTexto="Apagar tudo e recomeçar"
        confirmarDesabilitado={textoReset.trim().toUpperCase() !== 'RESETAR'}
        onConfirmar={resetarApp}
        onCancelar={fecharConfirmar}
      >
        <Campo
          rotulo="Digite RESETAR para confirmar"
          value={textoReset}
          onChange={e => setTextoReset(e.target.value)}
          placeholder="RESETAR"
          autoComplete="off"
          autoCapitalize="characters"
          style={{
            textAlign: 'center',
            letterSpacing: '0.08em',
          }}
        />
      </ConfigSheet>

      <Aviso aviso={aviso} />
    </Tela>
  )
}
function MudancasPerfil({ mudou, simples, onFechar }) {
  return (
    <section className="anim-pop" style={styles.mudou} role="status" aria-live="polite">
      <div style={styles.mudouTopo}>
        <span style={styles.mudouIcone}>
          <Sparkles size={20} color="#000" aria-hidden="true" />
        </span>
        <span
          style={{
            ...styles.mudouTitulo,
            fontSize: simples ? 21 : 19,
          }}
        >
          O app mudou junto
        </span>
        <button
          type="button"
          className="tap"
          style={styles.mudouFechar}
          onClick={onFechar}
          aria-label="Fechar"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {mudou.mudancas.length > 0 && (
        <ul style={styles.mudouLista}>
          {mudou.mudancas.map((m, i) => {
            const Icone = m.icone || Check
            return (
              <li
                key={m.chave}
                className="anim-up"
                style={{
                  ...styles.mudouItem,
                  animationDelay: `${0.08 + i * 0.06}s`,
                }}
              >
                <span
                  style={{
                    ...styles.mudouItemIcone,
                    background: m.depois ? 'var(--lima)' : 'var(--surface-2)',
                  }}
                >
                  <Icone size={18} color="#000" aria-hidden="true" />
                </span>
                <span style={styles.mudouItemTexto}>{m.rotulo}</span>
                <Tag cor={m.depois ? 'lima' : 'mist'}>{m.depois ? 'Ligado' : 'Desligado'}</Tag>
              </li>
            )
          })}
        </ul>
      )}
      {mudou.mantidos.length > 0 && (
        <p style={styles.mudouMantidos}>
          <ArrowRight
            size={15}
            aria-hidden="true"
            style={{
              flexShrink: 0,
              marginTop: 3,
            }}
          />
          <span>
            Ficou como você escolheu:{' '}
            {mudou.mantidos.map(m => `${m.rotulo} ${m.valor ? 'ligado' : 'desligado'}`).join(', ')}.
          </span>
        </p>
      )}
    </section>
  )
}
function Aviso({ aviso }) {
  const [ultimo, setUltimo] = useState(aviso)
  if (aviso && aviso !== ultimo) setUltimo(aviso)
  const { montado, saindo } = useSaida(!!aviso, 220)
  if (!montado || !ultimo) return null
  return (
    <Camada>
      <div style={styles.avisoPos}>
        <div
          key={ultimo.id}
          role="status"
          aria-live="polite"
          className={saindo ? 'anim-out' : 'anim-pop'}
          style={styles.aviso}
        >
          <Check
            size={18}
            strokeWidth={2.6}
            aria-hidden="true"
            style={{
              flexShrink: 0,
            }}
          />{' '}
          <span>{ultimo.texto}</span>
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  conteudo: {
    paddingBottom: 'calc(var(--nav-h) + 40px)',
  },
  cabecalho: {
    marginTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  mascoteWrap: {
    flexShrink: 0,
    width: 104,
    height: 104,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecalhoTextos: {
    minWidth: 0,
    flex: '1 1 150px',
  },
  nome: {
    fontWeight: 800,
    lineHeight: 1,
    overflowWrap: 'anywhere',
  },
  cabecalhoSub: {
    fontSize: 16,
    color: 'var(--text-2)',
    marginTop: 6,
    lineHeight: 1.35,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  mudou: {
    marginTop: 24,
    background: 'var(--lima)',
    borderRadius: 'var(--r-card-m)',
    padding: '16px 16px 14px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: '#000',
  },
  mudouTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  mudouIcone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mudouTitulo: {
    flex: 1,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  mudouFechar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.7)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
  },
  mudouLista: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  mudouItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--surface)',
    borderRadius: 18,
    padding: '8px 10px 8px 8px',
  },
  mudouItemIcone: {
    width: 32,
    height: 32,
    borderRadius: 11,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mudouItemTexto: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: 700,
  },
  mudouMantidos: {
    display: 'flex',
    gap: 6,
    fontSize: 14,
    lineHeight: 1.4,
  },
  mascoteBloco: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  mascotePalco: {
    width: 96,
    height: 96,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascoteTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  mascoteNome: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  mascoteDesc: {
    fontSize: 15,
    color: 'var(--text-2)',
  },
  simplesTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  simplesIcone: {
    width: 40,
    height: 40,
    borderRadius: '30%',
    background: 'var(--lima)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simplesTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  simplesTitulo: {
    fontSize: 17,
    fontWeight: 700,
  },
  simplesDesc: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  acoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 4,
  },
  sobreBloco: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'var(--lavanda)',
    margin: '-6px 0 6px',
    padding: '18px 18px 16px',
  },
  sobreTopo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  sobreIcone: {
    width: 38,
    height: 38,
    borderRadius: 13,
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sobreTitulo: {
    flex: 1,
    fontWeight: 800,
    color: '#000',
  },
  sobreTexto: {
    lineHeight: 1.45,
    color: '#000',
    overflowWrap: 'anywhere',
  },
  sobreAcoes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  memForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingBottom: 8,
  },
  memDica: {
    fontSize: 14,
    color: 'var(--text-3)',
    lineHeight: 1.4,
    textAlign: 'center',
  },
  memLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px 10px 18px',
    borderBottom: '1px solid var(--surface-2)',
  },
  memTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  memChave: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-3)',
    overflowWrap: 'anywhere',
  },
  memValor: {
    fontSize: 16,
    color: 'var(--text)',
    lineHeight: 1.4,
    overflowWrap: 'anywhere',
  },
  lixeira: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(229, 72, 77, 0.1)',
  },
  sobre: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 4,
  },
  sobreTag: {
    fontSize: 17,
    fontWeight: 600,
    marginTop: 4,
  },
  sobreInfo: {
    fontSize: 14,
    color: 'var(--text-2)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 8,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    paddingLeft: 6,
    marginTop: 4,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  apoios: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  ajuda: {
    fontSize: 14,
    color: 'var(--text-3)',
    paddingLeft: 6,
    lineHeight: 1.4,
  },
  formAcoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  avisoPos: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 'calc(var(--nav-h) + 28px + env(safe-area-inset-bottom))',
    zIndex: 950,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    padding: '0 16px',
  },
  aviso: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    borderRadius: 'var(--r-btn)',
    background: '#000',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    boxShadow: 'var(--sombra)',
    maxWidth: '100%',
  },
}
