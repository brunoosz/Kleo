import { useState } from 'react'
import { Play, Pause, RotateCcw, Trash2, Plus, Timer, BellRing } from 'lucide-react'
import { Card, Botao, BotaoIcone, Vazio } from '../components/ui'
import useStorage from '../hooks/useStorage'
import useAgora from '../components/profissao/useAgora'
import useRemocao from '../components/profissao/useRemocao'
import { criarTimer, formatarTempo } from '../components/profissao/util'
import { useTam, numero } from './comum'
import { Anel, Coluna, Rotulo, Entrada } from './pecas'
const PRESETS_PADRAO = [
  {
    nome: 'Rápido',
    min: 3,
  },
  {
    nome: '5 minutos',
    min: 5,
  },
  {
    nome: '10 minutos',
    min: 10,
  },
  {
    nome: 'Meia hora',
    min: 30,
  },
]
export default function Temporizadores({ config = {} }) {
  const { simples, h } = useTam()
  const [timers, setTimers] = useStorage('kleo_timers', [])
  const [nome, setNome] = useState('')
  const [minutos, setMinutos] = useState('')
  const agora = useAgora(500)
  const lista = Array.isArray(timers) ? timers : []
  const presets = (
    Array.isArray(config.presets) && config.presets.length ? config.presets : PRESETS_PADRAO
  ).slice(0, simples ? 4 : 8)
  const iniciarPreset = p => {
    criarTimer(p.nome, p.min)
    navigator.vibrate?.(20)
  }
  const iniciarManual = e => {
    e.preventDefault()
    const m = numero(minutos)
    if (!(m > 0)) return
    criarTimer(nome.trim() || `Temporizador ${lista.length + 1}`, m)
    setNome('')
    setMinutos('')
  }
  const alterar = (id, fn) => setTimers(a => (a || []).map(t => (t.id === id ? fn(t) : t)))
  const pausar = id =>
    alterar(id, t => ({
      ...t,
      estado: 'pausado',
      restante: Math.max(0, t.fim - Date.now()),
      fim: null,
    }))
  const retomar = id =>
    alterar(id, t => ({
      ...t,
      estado: 'rodando',
      fim: Date.now() + t.restante,
    }))
  const reiniciar = id =>
    alterar(id, t => ({
      ...t,
      estado: 'rodando',
      restante: t.duracao,
      fim: Date.now() + t.duracao,
    }))
  const { saindo, remover } = useRemocao(id => setTimers(a => (a || []).filter(t => t.id !== id)), 220)
  return (
    <Coluna>
      <Card cor="lavanda">
        <Rotulo
          style={{
            color: '#000',
          }}
        >
          Toque para iniciar
        </Rotulo>
        <div
          style={{
            ...styles.presets,
            gridTemplateColumns: simples ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {presets.map(p => (
            <button
              key={p.nome + p.min}
              onClick={() => iniciarPreset(p)}
              className="tap"
              style={{
                ...styles.preset,
                minHeight: simples ? 64 : 72,
              }}
            >
              <span style={styles.presetMin}>
                {p.min < 1 ? `${Math.round(p.min * 60)} s` : `${p.min} min`}
              </span>
              <span style={styles.presetNome}>{p.nome}</span>
            </button>
          ))}
        </div>
        {!simples && (
          <form onSubmit={iniciarManual} style={styles.form}>
            <Entrada
              placeholder="Nome (opcional)"
              aria-label="Nome do temporizador"
              value={nome}
              onChange={e => setNome(e.target.value)}
              altura={h}
            />
            <Entrada
              placeholder="Min"
              aria-label="Minutos"
              inputMode="decimal"
              value={minutos}
              onChange={e => setMinutos(e.target.value)}
              altura={h}
              style={{
                width: 80,
              }}
            />
            <Botao variante="primario" icone={Plus} type="submit" disabled={!(numero(minutos) > 0)}>
              Criar
            </Botao>
          </form>
        )}
      </Card>

      {lista.length === 0 ? (
        <Card>
          <Vazio
            icone={Timer}
            titulo="Nenhum temporizador"
            texto="Eles continuam contando mesmo se você trocar de tela."
          />
        </Card>
      ) : (
        <div
          style={{
            ...styles.grade,
            gridTemplateColumns: simples ? '1fr' : 'repeat(auto-fill, minmax(170px, 1fr))',
          }}
        >
          {lista.map(t => {
            const restante = t.estado === 'rodando' ? Math.max(0, t.fim - agora) : t.restante
            const terminado = t.estado === 'terminado' || restante <= 0
            return (
              <div key={t.id} className={saindo(t.id) ? 'modal-out' : 'anim-pop'}>
                <Card cor={terminado ? 'lima' : t.estado === 'pausado' ? 'mist' : 'branco'}>
                  <div style={styles.timer}>
                    <p style={styles.timerNome}>{t.nome}</p>
                    <div key={terminado ? 'fim' : 'ativo'} className={terminado ? 'shake' : undefined}>
                      <Anel
                        progresso={terminado ? 1 : 1 - restante / t.duracao}
                        tamanho={simples ? 150 : 124}
                        espessura={10}
                        cor="#000"
                      >
                        {terminado ? (
                          <BellRing size={30} color="#000" className="fer-pulsa" />
                        ) : (
                          <span
                            style={{
                              ...styles.timerTempo,
                              fontSize: simples ? 32 : 26,
                            }}
                          >
                            {formatarTempo(restante)}
                          </span>
                        )}
                        <span style={styles.timerEstado}>
                          {terminado ? 'Terminou' : t.estado === 'pausado' ? 'Pausado' : 'Rodando'}
                        </span>
                      </Anel>
                    </div>
                    <div style={styles.controles}>
                      {terminado ? (
                        <BotaoIcone
                          icone={RotateCcw}
                          label="Repetir"
                          variante="preto"
                          onClick={() => reiniciar(t.id)}
                        />
                      ) : t.estado === 'rodando' ? (
                        <BotaoIcone
                          icone={Pause}
                          label="Pausar"
                          variante="lavanda"
                          onClick={() => pausar(t.id)}
                        />
                      ) : (
                        <BotaoIcone
                          icone={Play}
                          label="Continuar"
                          variante="preto"
                          onClick={() => retomar(t.id)}
                        />
                      )}
                      <BotaoIcone
                        icone={Trash2}
                        label={terminado ? 'Fechar' : 'Excluir'}
                        variante="branco"
                        onClick={() => remover(t.id)}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </Coluna>
  )
}
const styles = {
  presets: {
    display: 'grid',
    gap: 10,
  },
  preset: {
    background: 'var(--surface)',
    borderRadius: 25,
    boxShadow: 'var(--sombra)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '10px 18px',
    textAlign: 'left',
  },
  presetMin: {
    fontSize: 22,
    fontWeight: 800,
    color: '#000',
    lineHeight: 1.1,
  },
  presetNome: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginTop: 2,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  form: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    marginTop: 14,
  },
  grade: {
    display: 'grid',
    gap: 12,
  },
  timer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  timerNome: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#000',
  },
  timerTempo: {
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    color: '#000',
  },
  timerEstado: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-2)',
    marginTop: 2,
  },
  controles: {
    display: 'flex',
    gap: 8,
  },
}
