import { useEffect, useRef, useState } from 'react'
import { Sparkles, Mic, History, Trash2 } from 'lucide-react'
import { Card, Chip, Botao, BotaoIcone } from '../components/ui'
import { perguntar, ocultarComandos, temIA, mensagemErro } from '../lib/ia'
import { ouvir, reconhecimentoDisponivel } from '../lib/voz'
import { useDados, useTam, criarAcumulador, novoId, nomeProfissao } from './comum'
import { Rotulo, Coluna, Entrada, RespostaIA, SemIA } from './pecas'
const SISTEMA =
  'Você está gerando um texto pronto para o usuário usar no trabalho. Entregue direto o resultado, sem introdução nem despedida, em português do Brasil. Não use comandos especiais (MEMORIA, AGENDA, LISTA). Use no máximo listas curtas quando ajudar.'
export default function Assistente({ config = {}, profissao, chave }) {
  const { simples, h } = useTam()
  const prompts =
    Array.isArray(config.prompts) && config.prompts.length
      ? config.prompts
      : [
          {
            rotulo: 'Pedir ajuda',
            modelo: '{entrada}',
            placeholder: 'Descreva o que você precisa',
          },
        ]
  const [indice, setIndice] = useState(0)
  const [entrada, setEntrada] = useState('')
  const [resposta, setResposta] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const [verHistorico, setVerHistorico] = useState(false)
  const [historico, setHistorico] = useDados(chave, [])
  const ctrl = useRef(null)
  const rec = useRef(null)
  const p = prompts[Math.min(indice, prompts.length - 1)]
  const lista = Array.isArray(historico) ? historico : []
  useEffect(
    () => () => {
      ctrl.current?.abort()
      rec.current?.stop?.()
    },
    [],
  )
  if (!temIA('rapido'))
    return (
      <SemIA texto="A IA da Kleo não está disponível agora. Quando ela voltar, a Kleo escreve textos, revisa e explica para você em segundos." />
    )
  const gerar = async () => {
    const t = entrada.trim()
    if (!t || carregando) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setErro('')
    setResposta('')
    setCarregando(true)
    const prof = nomeProfissao(profissao) ? ` O usuário trabalha como ${nomeProfissao(profissao)}.` : ''
    const conteudo = p.modelo.includes('{entrada}')
      ? p.modelo.split('{entrada}').join(t)
      : `${p.modelo}\n\n${t}`
    try {
      const final = await perguntar(
        [
          {
            role: 'user',
            content: conteudo,
          },
        ],
        {
          funcao: 'rapido',
          extraSystem: SISTEMA + prof + (simples ? ' Use frases curtas e palavras simples.' : ''),
          temperatura: 0.6,
          maxTokens: 900,
          signal: c.signal,
          onToken: criarAcumulador(t => setResposta(ocultarComandos(t))),
        },
      )
      const limpo = ocultarComandos(String(final || '')).trim() || String(final || '')
      setResposta(limpo)
      setHistorico(a =>
        [
          {
            id: novoId(),
            rotulo: p.rotulo,
            entrada: t,
            texto: limpo,
            ts: Date.now(),
          },
          ...(Array.isArray(a) ? a : []),
        ].slice(0, 8),
      )
    } catch (e) {
      if (e?.name !== 'AbortError') setErro(mensagemErro(e))
    } finally {
      if (ctrl.current === c) setCarregando(false)
    }
  }
  const parar = () => {
    ctrl.current?.abort()
    setCarregando(false)
  }
  const ditar = () => {
    if (ouvindo) {
      rec.current?.stop?.()
      return
    }
    setOuvindo(true)
    rec.current = ouvir({
      onParcial: t => setEntrada(t),
      onFinal: t => setEntrada(t),
      onFim: () => setOuvindo(false),
      onErro: m => setErro(m),
    })
  }
  return (
    <Coluna>
      <Card>
        {config.titulo && <p style={styles.titulo}>{config.titulo}</p>}
        {prompts.length > 1 && (
          <>
            <Rotulo
              style={{
                marginTop: config.titulo ? 14 : 0,
              }}
            >
              O que você quer?
            </Rotulo>
            <div
              style={{
                ...styles.chips,
                flexDirection: simples ? 'column' : 'row',
                flexWrap: simples ? 'nowrap' : 'wrap',
              }}
            >
              {prompts.map((x, i) =>
                simples ? (
                  <Botao
                    key={x.rotulo}
                    variante={i === indice ? 'primario' : 'fantasma'}
                    cheio
                    onClick={() => setIndice(i)}
                  >
                    {x.rotulo}
                  </Botao>
                ) : (
                  <Chip key={x.rotulo} cor="lavanda" ativo={i === indice} onClick={() => setIndice(i)}>
                    {x.rotulo}
                  </Chip>
                ),
              )}
            </div>
          </>
        )}
        <div
          style={{
            marginTop: 16,
          }}
        >
          <Entrada
            multilinha
            rows={simples ? 3 : 4}
            altura={h * 2}
            placeholder={p.placeholder || 'Escreva aqui'}
            aria-label={p.placeholder || p.rotulo}
            value={entrada}
            onChange={e => setEntrada(e.target.value)}
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
              icone={Sparkles}
              grande={simples}
              cheio
              carregando={carregando}
              disabled={!entrada.trim() || carregando}
              onClick={gerar}
            >
              {carregando ? 'Gerando' : simples ? 'Pedir para a Kleo' : p.rotulo}
            </Botao>
          </div>
          {reconhecimentoDisponivel() && (
            <span
              className={ouvindo ? 'pulse-ring' : undefined}
              style={{
                borderRadius: '50%',
                display: 'flex',
              }}
            >
              <BotaoIcone
                icone={Mic}
                label={ouvindo ? 'Parar de ouvir' : 'Falar em vez de digitar'}
                variante={ouvindo ? 'preto' : 'lavanda'}
                onClick={ditar}
              />
            </span>
          )}
        </div>
      </Card>

      <RespostaIA texto={resposta} carregando={carregando} erro={erro} onParar={parar} />

      {!simples && lista.length > 0 && (
        <div>
          <Botao variante="fantasma" icone={History} onClick={() => setVerHistorico(v => !v)}>
            {verHistorico ? 'Esconder anteriores' : `Anteriores (${lista.length})`}
          </Botao>
          {verHistorico && (
            <Coluna
              gap={10}
              className="stagger"
              style={{
                marginTop: 12,
              }}
            >
              {lista.map(x => (
                <Card
                  key={x.id}
                  cor="creme"
                  onClick={() => {
                    setResposta(x.texto)
                    setErro('')
                  }}
                >
                  <div style={styles.hist}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                      }}
                    >
                      <p style={styles.histRot}>{x.rotulo}</p>
                      <p style={styles.histTxt}>{x.entrada}</p>
                    </div>
                  </div>
                </Card>
              ))}
              <Botao
                variante="fantasma"
                icone={Trash2}
                onClick={() => {
                  setHistorico([])
                  setVerHistorico(false)
                }}
              >
                Apagar anteriores
              </Botao>
            </Coluna>
          )}
        </div>
      )}
    </Coluna>
  )
}
const styles = {
  titulo: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  chips: {
    display: 'flex',
    gap: 8,
  },
  botoes: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  hist: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  histRot: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  histTxt: {
    fontSize: 15,
    marginTop: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
