import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight, Languages, Mic, Volume2, Copy, Check, Square } from 'lucide-react'
import { Card, Botao, BotaoIcone, Chip } from '../components/ui'
import { perguntar, temIA, mensagemErro } from '../lib/ia'
import { falar } from '../lib/voz'
import { useDados, useTam, criarAcumulador, copiar, novoId } from './comum'
import { Coluna, Entrada, Rotulo, SemIA } from './pecas'
const IDIOMAS = [
  {
    id: 'pt',
    nome: 'Português',
    voz: 'pt-BR',
  },
  {
    id: 'en',
    nome: 'Inglês',
    voz: 'en-US',
  },
  {
    id: 'es',
    nome: 'Espanhol',
    voz: 'es-ES',
  },
  {
    id: 'fr',
    nome: 'Francês',
    voz: 'fr-FR',
  },
  {
    id: 'it',
    nome: 'Italiano',
    voz: 'it-IT',
  },
  {
    id: 'de',
    nome: 'Alemão',
    voz: 'de-DE',
  },
  {
    id: 'ja',
    nome: 'Japonês',
    voz: 'ja-JP',
  },
  {
    id: 'zh',
    nome: 'Chinês',
    voz: 'zh-CN',
  },
]
const idioma = id => IDIOMAS.find(i => i.id === id) || IDIOMAS[0]
function falarEm(texto, lang) {
  if (!texto) return
  if (lang.startsWith('pt')) {
    falar(texto, {
      forcar: true,
    })
    return
  }
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = lang
    const v = window.speechSynthesis
      .getVoices()
      .find(x => x.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
    if (v) u.voice = v
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  } catch {}
}
export default function Tradutor({ chave }) {
  const { simples, h } = useTam()
  const [prefs, setPrefs] = useDados(chave, {
    de: 'pt',
    para: 'en',
    recentes: [],
  })
  const de = prefs?.de || 'pt'
  const para = prefs?.para || 'en'
  const [texto, setTexto] = useState('')
  const [traducao, setTraducao] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const ctrl = useRef(null)
  const rec = useRef(null)
  const recentes = Array.isArray(prefs?.recentes) ? prefs.recentes : []
  useEffect(
    () => () => {
      ctrl.current?.abort()
      rec.current?.stop?.()
    },
    [],
  )
  if (!temIA('rapido'))
    return (
      <SemIA texto="A IA da Kleo não está disponível agora. Tente de novo mais tarde para traduzir textos e conversas." />
    )
  const mudar = patch =>
    setPrefs(a => ({
      ...(a || {}),
      ...patch,
    }))
  const inverter = () => {
    mudar({
      de: para,
      para: de,
    })
    setTexto(traducao || texto)
    setTraducao('')
  }
  const traduzir = async () => {
    const t = texto.trim()
    if (!t || carregando) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setCarregando(true)
    setErro('')
    setTraducao('')
    try {
      const final = await perguntar(
        [
          {
            role: 'user',
            content: t,
          },
        ],
        {
          funcao: 'rapido',
          temperatura: 0.2,
          maxTokens: 600,
          signal: c.signal,
          extraSystem: `Você é um tradutor. Traduza o texto do usuário de ${idioma(de).nome} para ${idioma(para).nome}, de forma natural. Responda SOMENTE com a tradução, sem aspas, sem explicações e sem comandos especiais.`,
          onToken: criarAcumulador(setTraducao),
        },
      )
      const r = String(final || '').trim()
      setTraducao(r)
      mudar({
        recentes: [
          {
            id: novoId(),
            de,
            para,
            texto: t,
            traducao: r,
          },
          ...recentes,
        ].slice(0, 6),
      })
      if (simples) falarEm(r, idioma(para).voz)
    } catch (e) {
      if (e?.name !== 'AbortError') setErro(mensagemErro(e))
    } finally {
      if (ctrl.current === c) setCarregando(false)
    }
  }
  const ditar = () => {
    if (ouvindo) {
      rec.current?.stop?.()
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setErro('Ditado não disponível neste navegador. Use o Chrome.')
      return
    }
    const r = new SR()
    r.lang = idioma(de).voz
    r.interimResults = true
    r.onresult = e =>
      setTexto(
        Array.from(e.results)
          .map(x => x[0].transcript)
          .join(''),
      )
    r.onerror = () => setErro('Não consegui ouvir. Tente de novo.')
    r.onend = () => setOuvindo(false)
    rec.current = r
    setOuvindo(true)
    setErro('')
    r.start()
  }
  const aoCopiar = async () => {
    if (await copiar(traducao)) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1600)
    }
  }
  const lista = simples ? IDIOMAS.slice(0, 4) : IDIOMAS
  return (
    <Coluna>
      <Card>
        <div style={styles.idiomas}>
          <span style={styles.idiomaAtual}>{idioma(de).nome}</span>
          <BotaoIcone icone={ArrowLeftRight} label="Inverter idiomas" variante="lavanda" onClick={inverter} />
          <span
            style={{
              ...styles.idiomaAtual,
              textAlign: 'right',
            }}
          >
            {idioma(para).nome}
          </span>
        </div>
        <Rotulo
          style={{
            marginTop: 14,
          }}
        >
          Traduzir para
        </Rotulo>
        <div style={styles.chips}>
          {lista
            .filter(i => i.id !== de)
            .map(i => (
              <Chip
                key={i.id}
                cor="ceu"
                ativo={i.id === para}
                onClick={() =>
                  mudar({
                    para: i.id,
                  })
                }
              >
                {i.nome}
              </Chip>
            ))}
        </div>
        <div
          style={{
            marginTop: 14,
          }}
        >
          <Entrada
            multilinha
            rows={3}
            altura={h * 2}
            placeholder={`Escreva ou fale em ${idioma(de).nome.toLowerCase()}`}
            aria-label="Texto para traduzir"
            value={texto}
            onChange={e => setTexto(e.target.value)}
          />
        </div>
        <div style={styles.botoes}>
          <div
            style={{
              flex: 1,
            }}
          >
            <Botao
              variante="primario"
              icone={Languages}
              grande={simples}
              cheio
              carregando={carregando}
              disabled={!texto.trim() || carregando}
              onClick={traduzir}
            >
              Traduzir
            </Botao>
          </div>
          <span
            className={ouvindo ? 'pulse-ring' : undefined}
            style={{
              borderRadius: '50%',
              display: 'flex',
            }}
          >
            <BotaoIcone
              icone={ouvindo ? Square : Mic}
              label={ouvindo ? 'Parar ditado' : 'Falar o texto'}
              variante={ouvindo ? 'preto' : 'lavanda'}
              onClick={ditar}
            />
          </span>
        </div>
        {erro && (
          <p key={erro} className="shake" style={styles.erro} role="alert">
            {erro}
          </p>
        )}
      </Card>

      {(traducao || carregando) && (
        <Card cor="ceu" tamanho="g" className="anim-scale">
          <Rotulo
            style={{
              color: '#000',
            }}
          >
            {idioma(para).nome}
          </Rotulo>
          {traducao ? (
            <p
              className={carregando ? 'fer-cursor' : undefined}
              style={{
                ...styles.traducao,
                fontSize: simples ? 26 : 22,
              }}
              lang={para}
            >
              {traducao}
            </p>
          ) : (
            <div
              className="skeleton"
              style={{
                height: 22,
                width: '70%',
              }}
            />
          )}
          {!carregando && traducao && (
            <div style={styles.botoes}>
              <Botao
                variante="primario"
                icone={Volume2}
                grande={simples}
                onClick={() => falarEm(traducao, idioma(para).voz)}
              >
                Ouvir
              </Botao>
              <Botao variante="fantasma" icone={copiado ? Check : Copy} onClick={aoCopiar}>
                {copiado ? 'Copiado' : 'Copiar'}
              </Botao>
            </div>
          )}
        </Card>
      )}

      {!simples && recentes.length > 0 && !carregando && (
        <Card>
          <Rotulo>Recentes</Rotulo>
          {recentes.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setTexto(r.texto)
                setTraducao(r.traducao)
                mudar({
                  de: r.de,
                  para: r.para,
                })
              }}
              className="tap"
              style={styles.recente}
            >
              <span style={styles.recOrig}>{r.texto}</span>
              <span style={styles.recTrad}>{r.traducao}</span>
            </button>
          ))}
        </Card>
      )}
    </Coluna>
  )
}
const styles = {
  idiomas: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  idiomaAtual: {
    flex: 1,
    fontSize: 18,
    fontWeight: 800,
  },
  chips: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  botoes: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  erro: {
    color: 'var(--erro)',
    fontSize: 15,
    fontWeight: 600,
    marginTop: 10,
  },
  traducao: {
    fontWeight: 700,
    lineHeight: 1.3,
    color: '#000',
    whiteSpace: 'pre-wrap',
  },
  recente: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    textAlign: 'left',
    padding: '10px 0',
    borderTop: '1px solid var(--surface-2)',
  },
  recOrig: {
    fontSize: 14,
    color: 'var(--text-3)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recTrad: {
    fontSize: 16,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
