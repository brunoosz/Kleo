import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  User,
  Volume2,
  Heart,
  Smile,
  LayoutGrid,
  WandSparkles,
  Brain,
  Sparkles,
} from 'lucide-react'
import Mascote from '../components/Mascote'
import OnbProfissao from '../components/OnbProfissao'
import CampoCidade from '../components/CampoCidade'
import MascExplorar, { CardMascote } from '../components/MascExplorar'
import { Botao, BotaoIcone, Campo, SeloMarca } from '../components/ui'
import { NECESSIDADES, SEM_NECESSIDADE } from '../data/profissoes'
import { getMascoteSpec, resolverMascote, sugeridos } from '../data/mascotes'
import { ler, salvar } from '../lib/storage'
import { falar, pararFala } from '../lib/voz'
import { piscarTela } from '../hooks/useAcessibilidade'
import useModoSimples from '../hooks/useModoSimples'
import {
  FAIXAS_IDADE,
  idadeValida,
  faixaDaIdade,
  ehIdoso,
  lerPerfil,
  perfilCompleto,
  salvarPerfil,
  aplicarPerfil,
  memoriaDoPerfil,
  frasesSobreVoce,
  ajustesLigados,
  leituraVozAtiva,
  primeiroNome,
} from '../lib/perfil'
const PASSOS = ['nome', 'idade', 'apoio', 'cidade', 'profissao', 'mascote', 'resumo']
const P = Object.fromEntries(PASSOS.map((id, i) => [id, i]))
const COR_APOIO = {
  nenhuma: 'var(--surface-2)',
  visual: 'var(--lima)',
  auditiva: 'var(--ceu)',
  cadeirante: 'var(--lavanda)',
}
function montarRascunho(base, d) {
  const idade = idadeValida(d.idadeTexto) ? Math.round(Number(d.idadeTexto)) : null
  return {
    ...(base || {}),
    name: d.name.trim(),
    idade,
    age: idade ? faixaDaIdade(idade) : d.faixa,
    necessidades: d.semApoio ? [] : d.necessidades,
    city: d.city.trim(),
    cityCoords: d.city.trim() ? d.cityCoords : null,
    profissao: d.profissao,
    profissoesExtras: d.profissoesExtras.filter(id => id !== d.profissao),
  }
}
function textosDoPasso(id, nome) {
  switch (id) {
    case 'nome':
      return {
        titulo: 'Como você se chama?',
        sub: 'Seu primeiro nome já basta.',
      }
    case 'idade':
      return {
        titulo: 'Quantos anos você tem?',
        sub: 'Digite a idade ou toque numa opção.',
      }
    case 'apoio':
      return {
        titulo: 'Precisa de algum apoio?',
        sub: 'Pode marcar mais de um.',
      }
    case 'cidade':
      return {
        titulo: 'Em que cidade você mora?',
        sub: 'Ajuda no mapa e no clima. Pode pular.',
      }
    case 'profissao':
      return {
        titulo: 'Qual é o seu trabalho?',
        sub: 'Se não trabalha mais, escolha Aposentado.',
      }
    case 'mascote':
      return {
        titulo: 'Quem vai te acompanhar?',
        sub: 'Só muda o visual. Quem ajuda é sempre a Kleo.',
      }
    default:
      return {
        titulo: `Tudo pronto${nome ? `, ${nome}` : ''}!`,
        sub: 'Deixei o app do seu jeito.',
      }
  }
}
export default function Onboarding() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const refazer = params.get('refazer') === '1'
  const simples = useModoSimples()
  const [inicial] = useState(() => lerPerfil())
  const [jaTemPerfil] = useState(() => !refazer && perfilCompleto(inicial))
  const [podeSair] = useState(() => (window.history.state?.idx ?? 0) > 0)
  const [passo, setPasso] = useState(0)
  const [dir, setDir] = useState(1)
  const [tremer, setTremer] = useState(0)
  const [explorar, setExplorar] = useState(false)
  const [falando, setFalando] = useState(false)
  const [dados, setDados] = useState(() => ({
    name: inicial?.name || params.get('nome') || '',
    idadeTexto: inicial?.idade ? String(inicial.idade) : '',
    faixa: inicial?.age || '',
    necessidades: inicial?.necessidades || [],
    semApoio: !!(refazer && inicial && !inicial.necessidades?.length),
    city: inicial?.city || '',
    cityCoords: inicial?.cityCoords || null,
    profissao: inicial?.profissao || '',
    profissoesExtras: inicial?.profissoesExtras || [],
  }))
  const [mascote, setMascote] = useState(() => {
    const s = ler('kleo_mascote', null)
    return s && s !== 'auto' && typeof s === 'string' ? getMascoteSpec(s).id : 'auto'
  })
  const rascunho = useMemo(() => montarRascunho(inicial, dados), [inicial, dados])
  const nome = primeiroNome(rascunho)
  const idoso = dados.idadeTexto.length !== 1 && ehIdoso(rascunho)
  const automatico = useMemo(() => resolverMascote(rascunho, 'auto'), [rascunho])
  const exibido = mascote === 'auto' ? automatico : mascote
  const spec = getMascoteSpec(exibido)
  const opcoesMascote = useMemo(
    () =>
      sugeridos(rascunho).map(id => {
        const m = getMascoteSpec(id)
        return {
          id: m.id,
          nome: m.nome,
          sub: m.descricao,
        }
      }),
    [rascunho],
  )
  const idPasso = PASSOS[passo]
  const textos = textosDoPasso(idPasso, nome)
  const ultimo = passo === PASSOS.length - 1
  const valido = {
    nome: dados.name.trim().length >= 2,
    idade: idadeValida(dados.idadeTexto) || dados.faixa !== '',
    apoio: dados.semApoio || dados.necessidades.length > 0,
    cidade: true,
    profissao: !!dados.profissao,
    mascote: true,
    resumo: true,
  }[idPasso]
  const tokenFala = useRef(0)
  const narrar = useCallback((texto, mascoteVoz = 'kleo') => {
    const token = ++tokenFala.current
    Promise.resolve()
      .then(() =>
        falar(texto, {
          forcar: true,
          mascote: mascoteVoz,
          onInicio: () => {
            if (tokenFala.current === token) setFalando(true)
          },
        }),
      )
      .catch(() => {})
      .finally(() => {
        if (tokenFala.current === token) setFalando(false)
      })
  }, [])
  const concluido = useRef(false)
  useEffect(
    () => () => {
      tokenFala.current++
      pararFala()
      if (!concluido.current) aplicarPerfil(lerPerfil())
    },
    [],
  )
  const carinhoRef = useRef(null)
  useEffect(() => {
    if (!idoso || idPasso !== 'idade') return
    const t = setTimeout(
      () =>
        carinhoRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        }),
      300,
    )
    return () => clearTimeout(t)
  }, [idoso, idPasso])
  function textoFalado(i, rasc = rascunho) {
    const id = PASSOS[i]
    const t = textosDoPasso(id, primeiroNome(rasc))
    let extra = ''
    if (id === 'idade') extra = `Opções: ${FAIXAS_IDADE.map(f => f.rotulo).join(', ')}.`
    if (id === 'apoio')
      extra = `Opções: ${[SEM_NECESSIDADE, ...NECESSIDADES].map(n => n.pergunta).join('. ')}.`
    if (id === 'resumo') {
      const ligados = ajustesLigados(rasc)
      extra = ligados.length
        ? `Liguei: ${ligados.map(a => a.rotulo.toLowerCase()).join(', ')}. Toque em Começar.`
        : 'Deixei tudo no jeito padrão. Toque em Começar.'
    }
    return [t.titulo, t.sub, extra].filter(Boolean).join(' ')
  }
  const vozDoPasso = i => (i >= P.mascote ? exibido : 'kleo')
  const ouvirPergunta = () => narrar(textoFalado(passo), vozDoPasso(passo))
  function set(campo, valor) {
    setDados(d => ({
      ...d,
      [campo]: valor,
    }))
  }
  function mudarEAplicar(novos) {
    setDados(novos)
    aplicarPerfil(montarRascunho(inicial, novos))
  }
  function digitarIdade(texto) {
    const limpo = texto.replace(/\D/g, '').slice(0, 3)
    const novos = {
      ...dados,
      idadeTexto: limpo,
      faixa: limpo ? '' : dados.faixa,
    }
    if (limpo.length === 1) setDados(novos)
    else mudarEAplicar(novos)
  }
  function escolherFaixa(id) {
    const idade =
      idadeValida(dados.idadeTexto) && faixaDaIdade(dados.idadeTexto) === id ? dados.idadeTexto : ''
    mudarEAplicar({
      ...dados,
      faixa: id,
      idadeTexto: idade,
    })
  }
  function escolherSemApoio() {
    mudarEAplicar({
      ...dados,
      semApoio: true,
      necessidades: [],
    })
  }
  function alternarApoio(id) {
    const marcado = dados.necessidades.includes(id)
    const lista = marcado ? dados.necessidades.filter(n => n !== id) : [...dados.necessidades, id]
    const novos = {
      ...dados,
      semApoio: false,
      necessidades: lista,
    }
    mudarEAplicar(novos)
    if (marcado) return
    if (id === 'visual') narrar('Pronto. Agora eu leio as telas em voz alta e deixo as letras maiores.')
    if (id === 'auditiva') piscarTela()
  }
  function escolherMascote(id) {
    setExplorar(false)
    setMascote(id)
    const alvo = id === 'auto' ? automatico : id
    if (leituraVozAtiva(rascunho)) {
      const m = getMascoteSpec(alvo)
      narrar(`${id === 'auto' ? 'Automático. ' : ''}${m.nome}. ${m.descricao}.`, alvo)
    }
  }
  function ouvirMascote() {
    narrar(`Oi${nome ? `, ${nome}` : ''}! Eu sou ${spec.nome}. Vou te acompanhar no dia a dia.`, exibido)
  }
  function irPara(novo) {
    setDir(novo > passo ? 1 : -1)
    setPasso(novo)
    if (PASSOS[novo] === 'resumo') aplicarPerfil(rascunho)
    if (leituraVozAtiva(rascunho)) narrar(textoFalado(novo), vozDoPasso(novo))
    else {
      tokenFala.current++
      pararFala()
    }
  }
  function avancar() {
    if (!valido) {
      setTremer(t => t + 1)
      return
    }
    if (ultimo) concluir()
    else irPara(passo + 1)
  }
  function voltar() {
    if (passo > 0) irPara(passo - 1)
    else if (podeSair) navigate(-1)
  }
  function concluir() {
    concluido.current = true
    const perfil = salvarPerfil({
      ...rascunho,
      createdAt: inicial?.createdAt || new Date().toISOString(),
      onboardingFeito: true,
    })
    aplicarPerfil(perfil)
    memoriaDoPerfil(perfil)
    salvar('kleo_mascote', mascote)
    tokenFala.current++
    pararFala()
    if (refazer && podeSair) navigate(-1)
    else if (refazer || ler('kleo_tutorial_done', false) === true)
      navigate('/home', {
        replace: true,
      })
    else
      navigate('/tutorial', {
        replace: true,
      })
  }
  function aoTeclar(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      avancar()
    }
  }
  if (jaTemPerfil) return <Navigate to="/home" replace />
  const textoBotao = ultimo ? 'Começar' : idPasso === 'cidade' && !dados.city.trim() ? 'Pular' : 'Continuar'
  const mostrarVoltar = passo > 0 || podeSair
  const ligados = idPasso === 'resumo' ? ajustesLigados(rascunho) : []
  return (
    <div style={styles.container}>
      <div style={styles.topo}>
        {mostrarVoltar ? (
          <button
            type="button"
            style={{
              ...styles.voltar,
              minHeight: simples ? 56 : 48,
            }}
            className="tap anim-left"
            onClick={voltar}
          >
            <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" /> Voltar
          </button>
        ) : (
          <SeloMarca tamanho={44} piscar />
        )}
        <div
          style={styles.progresso}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={PASSOS.length}
          aria-valuenow={passo + 1}
          aria-label={`Pergunta ${passo + 1} de ${PASSOS.length}`}
        >
          {PASSOS.map((p, i) => (
            <span key={p} style={styles.seg}>
              <span
                style={{
                  ...styles.segFill,
                  transform: i <= passo ? 'scaleX(1)' : 'scaleX(0)',
                }}
              />
            </span>
          ))}
        </div>
        <span
          style={{
            ...styles.passoTxt,
            fontSize: simples ? 16 : 14,
          }}
        >
          {passo + 1}/{PASSOS.length}
        </span>
      </div>

      <div style={styles.passo} key={passo} className={dir === 1 ? 'anim-right' : 'anim-left'}>
        <div className="stagger" style={styles.pilha}>
          {idPasso === 'nome' && (
            <div style={styles.boasVindas}>
              <span style={styles.boasMascote}>
                <Mascote id="kleo" tamanho={simples ? 112 : 100} estado={falando ? 'falando' : 'idle'} />
              </span>
              <span style={styles.boasTexto}>
                <span
                  style={{
                    ...styles.boasOi,
                    fontSize: simples ? 24 : 22,
                  }}
                >
                  Oi! Eu sou a Kleo.
                </span>
                <span style={styles.boasSub}>Vou te ajudar no dia a dia.</span>
              </span>
            </div>
          )}

          <Pergunta
            titulo={textos.titulo}
            sub={textos.sub}
            simples={simples}
            falando={falando}
            onOuvir={ouvirPergunta}
          />

          {idPasso === 'nome' && (
            <Campo
              icone={User}
              placeholder="Seu nome"
              value={dados.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={aoTeclar}
              maxLength={30}
              aria-label="Seu nome"
              autoComplete="given-name"
              autoFocus
            />
          )}

          {idPasso === 'idade' && (
            <>
              <label style={styles.idadeCaixa}>
                <input
                  value={dados.idadeTexto}
                  onChange={e => digitarIdade(e.target.value)}
                  onKeyDown={aoTeclar}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  placeholder="00"
                  aria-label="Sua idade em anos"
                  style={{
                    ...styles.idadeInput,
                    fontSize: simples ? 58 : 52,
                  }}
                />
                <span style={styles.idadeAnos}>anos</span>
              </label>
              <div style={styles.faixas} role="radiogroup" aria-label="Ou escolha uma faixa de idade">
                {FAIXAS_IDADE.map(f => {
                  const ativo = dados.idadeTexto.length !== 1 && rascunho.age === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={ativo}
                      className={ativo ? 'check-pop' : 'tap'}
                      onClick={() => escolherFaixa(f.id)}
                      style={{
                        ...styles.faixa,
                        minHeight: simples ? 68 : 60,
                        fontSize: simples ? 20 : 18,
                        background: ativo ? '#000' : 'var(--surface)',
                        color: ativo ? '#fff' : 'var(--text)',
                      }}
                    >
                      {f.rotulo}
                    </button>
                  )
                })}
              </div>
              {idoso && (
                <div ref={carinhoRef} className="anim-pop" style={styles.carinho} role="status">
                  <span style={styles.carinhoIcone}>
                    <Heart size={24} color="#000" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span style={styles.carinhoTextos}>
                    <span
                      style={{
                        ...styles.carinhoTitulo,
                        fontSize: simples ? 21 : 19,
                      }}
                    >
                      Vamos deixar tudo maior e mais simples para você.
                    </span>
                    <span style={styles.carinhoSub}>
                      Letras e botões grandes. Dá para mudar depois em Ajustes.
                    </span>
                  </span>
                </div>
              )}
            </>
          )}

          {idPasso === 'apoio' && (
            <div style={styles.lista} role="group" aria-label="Apoios">
              <OpcaoApoio
                id="nenhuma"
                icone={Smile}
                titulo={SEM_NECESSIDADE.pergunta}
                efeito={SEM_NECESSIDADE.efeito}
                ativo={dados.semApoio}
                simples={simples}
                onClick={escolherSemApoio}
              />
              {NECESSIDADES.map(n => (
                <OpcaoApoio
                  key={n.id}
                  id={n.id}
                  icone={n.icone || n.icon}
                  titulo={n.pergunta}
                  efeito={n.efeito}
                  ativo={!dados.semApoio && dados.necessidades.includes(n.id)}
                  simples={simples}
                  onClick={() => alternarApoio(n.id)}
                />
              ))}
            </div>
          )}

          {idPasso === 'cidade' && (
            <CampoCidade
              rotulo="Cidade"
              valor={dados.city}
              onChange={(texto, info) =>
                setDados(d => ({
                  ...d,
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
              onKeyDown={aoTeclar}
            />
          )}

          {idPasso === 'profissao' && (
            <OnbProfissao
              principal={dados.profissao}
              extras={dados.profissoesExtras}
              onPrincipal={id => set('profissao', id)}
              onExtras={lista => set('profissoesExtras', lista)}
              simples={simples}
              rapidas={
                idoso
                  ? ['aposentado', 'lar', 'outro', 'estudante']
                  : ['estudante', 'lar', 'aposentado', 'outro']
              }
            />
          )}

          {idPasso === 'mascote' && (
            <>
              <section style={styles.palco} aria-live="polite">
                <span style={styles.palcoBola} aria-hidden="true" />
                <div key={exibido} style={styles.palcoMascote}>
                  <Mascote id={exibido} tamanho={simples ? 150 : 140} estado={falando ? 'falando' : 'idle'} />
                </div>
                <h2 style={styles.palcoNome}>{spec.nome}</h2>
                <p style={styles.palcoDesc}>
                  {mascote === 'auto' ? 'Escolhido para combinar com você' : spec.descricao}
                </p>
                <Botao
                  variante="primario"
                  icone={Volume2}
                  onClick={ouvirMascote}
                  style={{
                    marginTop: 12,
                  }}
                >
                  Ouvir a voz
                </Botao>
              </section>
              <div
                style={{
                  ...styles.gradeMascotes,
                  gridTemplateColumns: simples ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                }}
                role="group"
                aria-label="Mascotes sugeridos"
              >
                <button
                  type="button"
                  className="tap"
                  onClick={() => escolherMascote('auto')}
                  aria-pressed={mascote === 'auto'}
                  aria-label="Automático: combina com o seu perfil"
                  style={{
                    ...styles.cardAuto,
                    background: mascote === 'auto' ? 'var(--lima)' : 'var(--surface)',
                    outline: mascote === 'auto' ? '2px solid #000' : 'none',
                  }}
                >
                  {mascote === 'auto' && (
                    <span className="anim-pop" style={styles.cardCheck}>
                      <Check size={13} color="#fff" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                  <span style={styles.autoIcone}>
                    <WandSparkles size={simples ? 30 : 26} color="#000" aria-hidden="true" />
                  </span>
                  <span
                    style={{
                      ...styles.autoNome,
                      fontSize: simples ? 17 : 15,
                    }}
                  >
                    Automático
                  </span>
                </button>
                {opcoesMascote.map((m, i) => (
                  <CardMascote
                    key={m.id}
                    m={m}
                    ativo={mascote === m.id}
                    simples={simples}
                    atraso={0.04 * (i + 1)}
                    onClick={() => escolherMascote(m.id)}
                  />
                ))}
              </div>
              <Botao variante="fantasma" icone={LayoutGrid} cheio onClick={() => setExplorar(true)}>
                Ver todos os mascotes
              </Botao>
            </>
          )}

          {idPasso === 'resumo' && (
            <>
              <section style={styles.cardLigados} aria-label="O que ligamos para você">
                <span style={styles.cardRotulo}>
                  <Sparkles size={18} aria-hidden="true" /> Ligamos para você
                </span>
                {ligados.length ? (
                  <ul style={styles.ligados}>
                    {ligados.map((a, i) => {
                      const Icone = a.icone
                      return (
                        <li
                          key={a.chave}
                          className="anim-up"
                          style={{
                            ...styles.ligado,
                            animationDelay: `${0.12 + i * 0.07}s`,
                          }}
                        >
                          <span style={styles.ligadoIcone}>
                            <Icone size={20} color="#000" strokeWidth={2.2} aria-hidden="true" />
                          </span>
                          <span style={styles.ligadoTextos}>
                            <span
                              style={{
                                ...styles.ligadoTitulo,
                                fontSize: simples ? 19 : 17,
                              }}
                            >
                              {a.rotulo}
                            </span>
                            {!simples && <span style={styles.ligadoSub}>{a.detalhe}</span>}
                          </span>
                          <span
                            className="check-pop"
                            style={{
                              ...styles.ligadoCheck,
                              animationDelay: `${0.3 + i * 0.07}s`,
                            }}
                          >
                            <Check size={15} color="#fff" strokeWidth={3} aria-hidden="true" />
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p style={styles.padrao}>Deixamos tudo no jeito padrão.</p>
                )}
              </section>
              <section style={styles.cardMemoria} aria-label="O que a Kleo vai lembrar">
                <span style={styles.cardRotulo}>
                  <Brain size={18} aria-hidden="true" /> A Kleo vai lembrar
                </span>
                <p
                  style={{
                    ...styles.memoriaTexto,
                    fontSize: simples ? 18 : 16,
                  }}
                >
                  {frasesSobreVoce(rascunho).join(' ')}
                </p>
              </section>
              <p style={styles.nota}>Você pode mudar tudo depois em Ajustes.</p>
            </>
          )}
        </div>
      </div>

      <div style={styles.btnRow} key={'tremer' + tremer} className={tremer ? 'shake' : undefined}>
        <Botao
          grande
          cheio
          onClick={avancar}
          aria-disabled={!valido}
          style={{
            minHeight: simples ? 64 : 58,
            opacity: valido ? 1 : 0.4,
            transform: valido ? 'scale(1)' : 'scale(0.97)',
            transition: 'opacity 0.25s ease, transform 0.35s var(--spring)',
          }}
        >
          <span
            key={textoBotao}
            className="anim-fade"
            style={{
              display: 'inline-block',
            }}
          >
            {textoBotao}
          </span>
        </Botao>
      </div>

      <MascExplorar
        aberto={explorar}
        onFechar={() => setExplorar(false)}
        selecionado={mascote === 'auto' ? null : mascote}
        onEscolher={escolherMascote}
        simples={simples}
      />
      <style>{keyframes}</style>
    </div>
  )
}
function Pergunta({ titulo, sub, simples, falando, onOuvir }) {
  return (
    <div style={styles.pergunta}>
      <div style={styles.perguntaTopo}>
        <h1
          style={{
            ...styles.titulo,
            fontSize: simples ? 36 : 34,
          }}
        >
          {titulo}
        </h1>
        {simples ? (
          <button
            type="button"
            className="tap"
            onClick={onOuvir}
            style={styles.ouvirPill}
            aria-label="Ouvir a pergunta"
          >
            {falando ? (
              <span
                className="wave"
                style={{
                  height: 16,
                }}
              >
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
            ) : (
              <Volume2 size={22} aria-hidden="true" />
            )}
            Ouvir
          </button>
        ) : (
          <BotaoIcone
            icone={Volume2}
            label="Ouvir a pergunta"
            variante={falando ? 'preto' : 'lavanda'}
            onClick={onOuvir}
            className={falando ? 'pulse-ring' : undefined}
          />
        )}
      </div>
      {sub && (
        <p
          style={{
            ...styles.sub,
            fontSize: simples ? 19 : 17,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
function OpcaoApoio({ id, icone: Icone, titulo, efeito, ativo, simples, onClick }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ativo}
      className="tap"
      onClick={onClick}
      style={{
        ...styles.apoio,
        minHeight: simples ? 92 : 82,
        background: ativo ? COR_APOIO[id] : 'var(--surface)',
        outline: ativo ? '2px solid #000' : 'none',
      }}
    >
      <span
        className={ativo ? 'check-pop' : undefined}
        style={{
          ...styles.apoioIcone,
          background: ativo ? 'var(--surface)' : COR_APOIO[id],
        }}
      >
        <Icone size={simples ? 26 : 24} color="#000" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span style={styles.apoioTextos}>
        <span
          style={{
            ...styles.apoioTitulo,
            fontSize: simples ? 20 : 18,
          }}
        >
          {titulo}
        </span>
        <span
          style={{
            ...styles.apoioEfeito,
            fontSize: simples ? 16 : 14,
          }}
        >
          {efeito}
        </span>
      </span>
      <span
        style={{
          ...styles.apoioCaixa,
          background: ativo ? '#000' : 'transparent',
          borderColor: ativo ? '#000' : 'var(--border)',
        }}
        aria-hidden="true"
      >
        {ativo && <Check size={18} color="#fff" strokeWidth={3} className="anim-pop" />}
      </span>
    </button>
  )
}
const keyframes = `
@keyframes onbDestaque {
  0% { opacity: 0; transform: scale(0.7) translateY(14px); }
  55% { opacity: 1; transform: scale(1.06) translateY(-6px); }
  100% { opacity: 1; transform: none; }
}
`
const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    padding: '16px 16px 24px',
    paddingTop: 'max(16px, env(safe-area-inset-top))',
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    maxWidth: 520,
    margin: '0 auto',
    width: '100%',
    color: 'var(--text)',
  },
  topo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    minHeight: 56,
    flexShrink: 0,
  },
  voltar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 18px 0 12px',
    flexShrink: 0,
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    boxShadow: 'var(--sombra)',
    color: 'var(--text)',
    fontSize: 17,
    fontWeight: 700,
  },
  progresso: {
    flex: 1,
    display: 'flex',
    gap: 5,
    minWidth: 0,
  },
  seg: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    background: 'var(--surface-2)',
    overflow: 'hidden',
    display: 'block',
  },
  segFill: {
    display: 'block',
    height: '100%',
    borderRadius: 999,
    background: '#000',
    transformOrigin: 'left center',
    transition: 'transform 0.5s var(--ease-out)',
  },
  passoTxt: {
    color: 'var(--text-2)',
    fontWeight: 700,
    flexShrink: 0,
  },
  passo: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    minHeight: 0,
    padding: '6px 10px 14px',
    margin: '0 -10px',
  },
  pilha: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  boasVindas: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--lavanda)',
    borderRadius: 'var(--r-card)',
    padding: '10px 22px 10px 10px',
    boxShadow: 'var(--sombra)',
  },
  boasMascote: {
    display: 'flex',
    flexShrink: 0,
  },
  boasTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  boasOi: {
    fontWeight: 800,
    lineHeight: 1.05,
  },
  boasSub: {
    fontSize: 16,
    color: 'var(--text-2)',
  },
  pergunta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  perguntaTopo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  titulo: {
    flex: 1,
    fontWeight: 800,
    lineHeight: 1.02,
    minWidth: 0,
    overflowWrap: 'break-word',
  },
  sub: {
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  ouvirPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    padding: '0 18px',
    flexShrink: 0,
    borderRadius: 'var(--r-btn)',
    background: 'var(--lavanda)',
    color: '#000',
    fontSize: 17,
    fontWeight: 700,
  },
  idadeCaixa: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 20px',
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    cursor: 'text',
  },
  idadeInput: {
    width: '2.6ch',
    border: 'none',
    background: 'transparent',
    fontWeight: 800,
    textAlign: 'center',
    color: 'var(--text)',
    lineHeight: 1.1,
    padding: 0,
  },
  idadeAnos: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-2)',
  },
  faixas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  faixa: {
    borderRadius: 'var(--r-card-m)',
    padding: '8px 12px',
    fontWeight: 700,
    boxShadow: 'var(--sombra)',
    transition: 'background 0.2s, color 0.2s, transform 0.2s var(--ease-out)',
  },
  carinho: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '18px 18px',
    background: 'var(--lima)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
  },
  carinhoIcone: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: 'var(--surface)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carinhoTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  carinhoTitulo: {
    fontWeight: 800,
    lineHeight: 1.15,
    color: '#000',
  },
  carinhoSub: {
    fontSize: 15,
    color: '#000',
    lineHeight: 1.35,
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  apoio: {
    width: '100%',
    borderRadius: 'var(--r-card-m)',
    padding: '12px 16px 12px 12px',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    textAlign: 'left',
    boxShadow: 'var(--sombra)',
    outlineOffset: -2,
    transition: 'background 0.25s, transform 0.2s var(--ease-out)',
  },
  apoioIcone: {
    width: 50,
    height: 50,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.25s',
  },
  apoioTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  apoioTitulo: {
    fontWeight: 800,
    lineHeight: 1.15,
  },
  apoioEfeito: {
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  apoioCaixa: {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: '2px solid',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, border-color 0.2s',
  },
  palco: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 'var(--r-card)',
    background: 'var(--lavanda)',
    boxShadow: 'var(--sombra)',
    padding: '22px 18px 22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  palcoBola: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'var(--ceu)',
    opacity: 0.55,
    right: -20,
    top: 26,
  },
  palcoMascote: {
    position: 'relative',
    animation: 'onbDestaque 0.55s var(--ease-out) both',
  },
  palcoNome: {
    position: 'relative',
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1,
    marginTop: 8,
  },
  palcoDesc: {
    position: 'relative',
    fontSize: 16,
    color: 'var(--text-2)',
    marginTop: 6,
  },
  gradeMascotes: {
    display: 'grid',
    gap: 10,
  },
  cardAuto: {
    position: 'relative',
    borderRadius: 'var(--r-card-m)',
    padding: '12px 6px 14px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: 'var(--text)',
    outlineOffset: -2,
    minHeight: 120,
    transition: 'background 0.25s',
  },
  cardCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoIcone: {
    width: 60,
    height: 60,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoNome: {
    fontWeight: 700,
  },
  cardRotulo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 800,
    color: '#000',
  },
  cardLigados: {
    background: 'var(--lavanda)',
    borderRadius: 'var(--r-card)',
    padding: '20px 18px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  ligados: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: 0,
    padding: 0,
  },
  ligado: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px 10px 10px',
    background: 'var(--surface)',
    borderRadius: 22,
  },
  ligadoIcone: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: 'var(--lima)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ligadoTextos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  ligadoTitulo: {
    fontWeight: 800,
    lineHeight: 1.2,
    color: '#000',
  },
  ligadoSub: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.3,
  },
  ligadoCheck: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#000',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padrao: {
    fontSize: 17,
    fontWeight: 600,
    color: '#000',
  },
  cardMemoria: {
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: '18px 18px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  memoriaTexto: {
    lineHeight: 1.45,
    color: 'var(--text)',
  },
  nota: {
    fontSize: 15,
    color: 'var(--text-2)',
    textAlign: 'center',
  },
  btnRow: {
    display: 'flex',
    marginTop: 12,
    flexShrink: 0,
  },
}
