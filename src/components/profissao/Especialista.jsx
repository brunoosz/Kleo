import { useNavigate } from 'react-router-dom'
import { Briefcase, MessageCircle, ArrowUpRight, Check, RotateCcw, ClipboardCheck } from 'lucide-react'
import { Card, Botao, TituloSecao } from '../ui'
import useStorage from '../../hooks/useStorage'
import useModoSimples from '../../hooks/useModoSimples'
import { hojeISO } from '../../lib/storage'
import { trabalhoDe } from '../../data/trabalho'
export default function Especialista({ prof }) {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const [trab, setTrab] = useStorage('kleo_modo_trabalho', null)
  const [marcados, setMarcados] = useStorage(`kleo_f_esp_${prof.id}`, null)
  const dados = trabalhoDe(prof.id)
  const ativo = !!trab?.ativo && trab?.profissao === prof.id
  const hoje = hojeISO()
  const feitos = marcados?.data === hoje && Array.isArray(marcados.feitos) ? marcados.feitos : []
  const alternar = i =>
    setMarcados({
      data: hoje,
      feitos: feitos.includes(i) ? feitos.filter(x => x !== i) : [...feitos, i],
    })
  const total = dados.checklist.itens.length
  const ligar = (v = true) =>
    setTrab({
      ativo: v,
      profissao: prof.id,
    })
  const perguntar = q => {
    ligar(true)
    navigate('/chat?q=' + encodeURIComponent(q))
  }
  return (
    <>
      <Card cor={ativo ? 'lima' : 'branco'} className="anim-up" style={styles.modo}>
        <div style={styles.modoTopo}>
          <span
            style={{
              ...styles.modoIcone,
              background: ativo ? 'var(--surface)' : 'var(--lima)',
            }}
          >
            <Briefcase size={22} color="#000" aria-hidden="true" />
          </span>
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <strong
              style={{
                ...styles.modoTitulo,
                fontSize: simples ? 21 : 19,
              }}
            >
              Modo trabalho {ativo ? 'ligado' : ''}
            </strong>
            <p style={styles.modoTexto}>
              {ativo
                ? `A Kleo está respondendo como ${prof.label.toLowerCase()}.`
                : `A Kleo vira ${prof.label.toLowerCase()}: responde com termos, cálculos e cuidados da área.`}
            </p>
          </div>
        </div>
        <div style={styles.modoAcoes}>
          <Botao
            variante={ativo ? 'fantasma' : 'primario'}
            icone={Briefcase}
            onClick={() => ligar(!ativo)}
            grande={simples}
          >
            {ativo ? 'Desligar' : 'Ligar modo trabalho'}
          </Botao>
          {ativo && (
            <Botao icone={MessageCircle} onClick={() => navigate('/chat')} grande={simples}>
              Conversar
            </Botao>
          )}
        </div>
      </Card>

      <TituloSecao>Pergunte ao especialista</TituloSecao>
      <Card cor="branco" style={styles.lista}>
        {dados.perguntas.slice(0, simples ? 3 : 4).map((q, i) => (
          <button
            key={q}
            type="button"
            className="tap"
            onClick={() => perguntar(q)}
            style={{
              ...styles.pergunta,
              minHeight: simples ? 68 : 58,
              borderTop: i ? '1px solid var(--surface-2)' : 'none',
            }}
          >
            <span style={styles.perguntaIcone}>
              <Briefcase size={17} color="#000" aria-hidden="true" />
            </span>
            <span
              style={{
                flex: 1,
                fontSize: simples ? 18 : 16,
                lineHeight: 1.3,
              }}
            >
              {q}
            </span>
            <ArrowUpRight
              size={20}
              color="var(--text-3)"
              aria-hidden="true"
              style={{
                flexShrink: 0,
              }}
            />
          </button>
        ))}
      </Card>

      <TituloSecao
        acao={
          <span style={styles.contagem}>
            {feitos.length}/{total}
          </span>
        }
      >
        {dados.checklist.titulo}
      </TituloSecao>
      <Card cor="branco" style={styles.lista}>
        {dados.checklist.itens.map((item, i) => {
          const ok = feitos.includes(i)
          return (
            <button
              key={item}
              type="button"
              className="tap"
              role="checkbox"
              aria-checked={ok}
              onClick={() => alternar(i)}
              style={{
                ...styles.item,
                minHeight: simples ? 62 : 52,
                borderTop: i ? '1px solid var(--surface-2)' : 'none',
              }}
            >
              <span
                style={{
                  ...styles.caixa,
                  background: ok ? '#000' : 'transparent',
                }}
              >
                {ok && <Check size={16} color="#fff" strokeWidth={3} aria-hidden="true" />}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: simples ? 18 : 16,
                  textDecoration: ok ? 'line-through' : 'none',
                  color: ok ? 'var(--text-3)' : 'var(--text)',
                }}
              >
                {item}
              </span>
            </button>
          )
        })}
        {feitos.length === total && total > 0 && (
          <div className="anim-pop" style={styles.concluido}>
            <ClipboardCheck size={18} aria-hidden="true" /> Tudo pronto por hoje
          </div>
        )}
        {feitos.length > 0 && (
          <button type="button" className="tap" onClick={() => setMarcados(null)} style={styles.limpar}>
            <RotateCcw size={15} aria-hidden="true" /> Desmarcar tudo
          </button>
        )}
      </Card>
    </>
  )
}
const styles = {
  modo: {
    padding: 20,
  },
  modoTopo: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  modoIcone: {
    width: 46,
    height: 46,
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modoTitulo: {
    fontWeight: 800,
    display: 'block',
    lineHeight: 1.15,
  },
  modoTexto: {
    fontSize: 15,
    lineHeight: 1.4,
    marginTop: 4,
    color: 'var(--text-2)',
  },
  modoAcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  lista: {
    padding: '4px 0',
    overflow: 'hidden',
  },
  pergunta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '8px 16px',
    textAlign: 'left',
    background: 'transparent',
    color: 'var(--text)',
  },
  perguntaIcone: {
    width: 34,
    height: 34,
    borderRadius: '30%',
    background: 'var(--lima)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '8px 16px',
    textAlign: 'left',
    background: 'transparent',
  },
  caixa: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: '2px solid #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  contagem: {
    fontSize: 14,
    fontWeight: 700,
    background: 'var(--surface-2)',
    borderRadius: 'var(--r-badge)',
    padding: '4px 12px',
  },
  concluido: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    padding: '10px 16px',
    fontWeight: 700,
    background: 'var(--lima)',
    margin: '6px 12px',
    borderRadius: 18,
  },
  limpar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '4px auto 8px',
    padding: '8px 14px',
    fontSize: 14,
    color: 'var(--text-2)',
    background: 'transparent',
  },
}
