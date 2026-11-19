import { useState } from 'react'
import { AlarmClock, Plus, Trash2, Mic, Sun } from 'lucide-react'
import { Card, Botao, Toggle, Sheet, Campo, Chip, Vazio } from './ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import {
  adicionarAlarme,
  atualizarAlarme,
  removerAlarme,
  descreverAlarme,
  resumoFalado,
} from '../lib/alarmes'
import { falar } from '../lib/voz'
const DIAS = [
  {
    id: 1,
    l: 'Seg',
  },
  {
    id: 2,
    l: 'Ter',
  },
  {
    id: 3,
    l: 'Qua',
  },
  {
    id: 4,
    l: 'Qui',
  },
  {
    id: 5,
    l: 'Sex',
  },
  {
    id: 6,
    l: 'Sáb',
  },
  {
    id: 0,
    l: 'Dom',
  },
]
const ATALHOS = [
  {
    l: 'Uma vez',
    dias: [],
  },
  {
    l: 'Todo dia',
    dias: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    l: 'Dias úteis',
    dias: [1, 2, 3, 4, 5],
  },
]
export default function AlarmesSecao({ onFalarComKleo }) {
  const simples = useModoSimples()
  const [salvos] = useStorage('kleo_alarmes', [])
  const [profile] = useStorage('kleo_profile', null)
  const [criando, setCriando] = useState(false)
  const [hora, setHora] = useState('07:00')
  const [rotulo, setRotulo] = useState('')
  const [dias, setDias] = useState([])
  const lista = (Array.isArray(salvos) ? salvos : [])
    .filter(a => !a.soneca)
    .sort((a, b) => a.hora.localeCompare(b.hora))
  const abrir = () => {
    setHora('07:00')
    setRotulo('')
    setDias([])
    setCriando(true)
  }
  const salvarNovo = () => {
    adicionarAlarme({
      hora,
      rotulo,
      dias: dias.length ? dias.join(',') : null,
    })
    setCriando(false)
  }
  const alternarDia = d => setDias(l => (l.includes(d) ? l.filter(x => x !== d) : [...l, d]))
  const ouvirResumo = () => {
    const nome = String(profile?.name || '')
      .trim()
      .split(' ')[0]
    falar(resumoFalado(nome), {
      forcar: true,
    }).catch(() => {})
  }
  return (
    <div style={styles.coluna}>
      {lista.length === 0 ? (
        <Vazio
          icone={AlarmClock}
          titulo="Nenhum despertador"
          texto={'Crie aqui ou diga para a Kleo: "me acorda às 7h".'}
          acao={
            <Botao icone={Plus} grande={simples} onClick={abrir}>
              Novo despertador
            </Botao>
          }
        />
      ) : (
        <>
          {lista.map((a, i) => (
            <Card
              key={a.id}
              className="anim-up"
              style={{
                ...styles.item,
                animationDelay: `${i * 0.05}s`,
                opacity: a.ativo ? 1 : 0.6,
              }}
            >
              <div style={styles.textos}>
                <strong
                  style={{
                    ...styles.hora,
                    fontSize: simples ? 44 : 38,
                  }}
                >
                  {a.hora}
                </strong>
                <span style={styles.detalhe}>
                  {[a.rotulo, descreverAlarme(a)].filter(Boolean).join(' · ')}
                </span>
              </div>
              <Toggle
                ligado={!!a.ativo}
                onChange={v =>
                  atualizarAlarme(a.id, {
                    ativo: v,
                  })
                }
                label={`Despertador das ${a.hora}`}
              />
              <button
                type="button"
                className="tap"
                style={styles.lixo}
                onClick={() => removerAlarme(a.id)}
                aria-label={`Apagar despertador das ${a.hora}`}
              >
                <Trash2 size={19} color="var(--erro)" />
              </button>
            </Card>
          ))}
          <Botao variante="fantasma" icone={Plus} cheio onClick={abrir}>
            Novo despertador
          </Botao>
        </>
      )}

      <Card cor="lima" style={styles.resumo}>
        <span style={styles.resumoTitulo}>
          <Sun size={20} aria-hidden="true" /> Como está meu dia?
        </span>
        <p style={styles.resumoTexto}>
          A Kleo fala seus compromissos de hoje, de amanhã e dos próximos dias. Também acontece quando você
          para o despertador ou diz "bom dia" no chat.
        </p>
        <div style={styles.resumoAcoes}>
          <Botao icone={Sun} onClick={ouvirResumo}>
            Ouvir agora
          </Botao>
          {onFalarComKleo && (
            <Botao variante="fantasma" icone={Mic} onClick={onFalarComKleo}>
              Falar com a Kleo
            </Botao>
          )}
        </div>
      </Card>

      <Sheet aberto={criando} onFechar={() => setCriando(false)} titulo="Novo despertador">
        <div style={styles.form}>
          <input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            aria-label="Horário"
            style={{
              ...styles.relogio,
              fontSize: simples ? 56 : 48,
            }}
          />
          <Campo
            rotulo="Nome (opcional)"
            placeholder="Ex: Acordar, Tomar remédio"
            value={rotulo}
            onChange={e => setRotulo(e.target.value)}
          />
          <div style={styles.chips}>
            {ATALHOS.map(a => (
              <Chip
                key={a.l}
                ativo={a.dias.length === dias.length && a.dias.every(d => dias.includes(d))}
                onClick={() => setDias(a.dias)}
              >
                {a.l}
              </Chip>
            ))}
          </div>
          {!simples && (
            <div style={styles.chips}>
              {DIAS.map(d => (
                <Chip key={d.id} cor="ceu" ativo={dias.includes(d.id)} onClick={() => alternarDia(d.id)}>
                  {d.l}
                </Chip>
              ))}
            </div>
          )}
          <Botao grande cheio icone={AlarmClock} onClick={salvarNovo} disabled={!hora}>
            Salvar despertador
          </Botao>
          <p style={styles.aviso}>
            Para tocar, deixe o app aberto (pode ficar com a tela apagada no carregador).
          </p>
        </div>
      </Sheet>
    </div>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 18px',
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  hora: {
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
  },
  detalhe: {
    fontSize: 15,
    color: 'var(--text-2)',
    marginTop: 4,
    overflowWrap: 'anywhere',
  },
  lixo: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    flexShrink: 0,
  },
  resumo: {
    padding: 20,
    marginTop: 6,
  },
  resumoTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 19,
    fontWeight: 800,
  },
  resumoTexto: {
    fontSize: 15,
    lineHeight: 1.45,
    marginTop: 6,
  },
  resumoAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 8,
  },
  relogio: {
    width: '100%',
    textAlign: 'center',
    fontWeight: 800,
    fontFamily: 'var(--fonte)',
    border: 'none',
    background: 'var(--surface-2)',
    borderRadius: 'var(--r-card-m)',
    padding: '14px 10px',
    color: 'var(--text)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  aviso: {
    fontSize: 14,
    color: 'var(--text-3)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
}
