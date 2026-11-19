import { useState } from 'react'
import { Check, Type, CalendarDays, Clock } from 'lucide-react'
import { CORES_EVENTO, NOMES_CORES, corEvento } from './AgendaUtil'
import { Sheet, Campo, Botao } from './ui'
export default function AgendaSheet({ aberto, evento, dataPadrao, onSalvar, onFechar, simples, chave }) {
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo={evento ? 'Editar compromisso' : 'Novo compromisso'}>
      <Formulario
        key={chave}
        evento={evento}
        dataPadrao={dataPadrao}
        onSalvar={onSalvar}
        onFechar={onFechar}
        simples={simples}
      />
    </Sheet>
  )
}
function Formulario({ evento, dataPadrao, onSalvar, onFechar, simples }) {
  const [titulo, setTitulo] = useState(evento?.titulo || '')
  const [data, setData] = useState(evento?.data || dataPadrao)
  const [hora, setHora] = useState(evento?.hora || '')
  const [descricao, setDescricao] = useState(evento?.descricao || '')
  const [cor, setCor] = useState(corEvento(evento?.cor))
  const [erro, setErro] = useState('')
  const salvar = () => {
    if (!titulo.trim()) {
      setErro(simples ? 'Escreva o nome do compromisso.' : 'Dê um nome ao compromisso.')
      return
    }
    if (!data) {
      setErro('Escolha uma data.')
      return
    }
    onSalvar({
      ...(evento || {}),
      id: evento?.id ?? Date.now(),
      titulo: titulo.trim(),
      data,
      hora,
      descricao: descricao.trim(),
      cor,
    })
  }
  return (
    <div className="stagger" style={styles.corpo}>
      <Campo
        rotulo={simples ? 'O que é?' : 'Título'}
        icone={Type}
        autoFocus={!evento}
        value={titulo}
        onChange={e => {
          setTitulo(e.target.value)
          setErro('')
        }}
        placeholder="Ex.: Consulta no cardiologista"
        onKeyDown={e => {
          if (e.key === 'Enter') salvar()
        }}
      />

      <div
        style={{
          ...styles.linha,
          flexDirection: simples ? 'column' : 'row',
        }}
      >
        <div
          style={{
            flex: 1.3,
            minWidth: 0,
          }}
        >
          <Campo
            rotulo={simples ? 'Qual dia?' : 'Data'}
            icone={CalendarDays}
            type="date"
            value={data}
            onChange={e => {
              setData(e.target.value)
              setErro('')
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Campo
            rotulo={simples ? 'Que horas?' : 'Hora'}
            icone={Clock}
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
          />
        </div>
      </div>

      {!simples && (
        <Campo
          rotulo="Descrição"
          multilinha
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Detalhes, endereço, o que levar..."
          rows={3}
        />
      )}

      {!simples && (
        <div>
          <span style={styles.rotulo}>Cor</span>
          <div style={styles.cores} role="radiogroup" aria-label="Cor do compromisso">
            {CORES_EVENTO.map((c, i) => {
              const ativa = cor === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  role="radio"
                  aria-checked={ativa}
                  aria-label={NOMES_CORES[i]}
                  style={{
                    ...styles.cor,
                    background: c,
                    boxShadow: ativa ? '0 0 0 3px var(--bg), 0 0 0 5px #000' : 'var(--sombra)',
                  }}
                >
                  {ativa && (
                    <span
                      className="anim-pop"
                      style={{
                        display: 'flex',
                      }}
                    >
                      <Check size={20} color="#000" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {erro && (
        <p key={erro} className="shake" style={styles.erro} role="alert">
          {erro}
        </p>
      )}

      <div
        style={{
          ...styles.acoes,
          flexDirection: simples ? 'column-reverse' : 'row',
        }}
      >
        <Botao
          variante="fantasma"
          cheio
          onClick={onFechar}
          style={{
            flex: 1,
          }}
        >
          Cancelar
        </Botao>
        <Botao
          variante="primario"
          cheio
          icone={Check}
          onClick={salvar}
          style={{
            flex: 1,
          }}
        >
          {simples ? 'Salvar compromisso' : 'Salvar'}
        </Botao>
      </div>
    </div>
  )
}
const styles = {
  corpo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingTop: 4,
  },
  linha: {
    display: 'flex',
    gap: 12,
  },
  rotulo: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-2)',
    padding: '0 0 8px 6px',
  },
  cores: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    padding: '2px 4px',
  },
  cor: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow .2s',
  },
  erro: {
    color: 'var(--erro)',
    fontSize: 15,
    fontWeight: 600,
    paddingLeft: 6,
  },
  acoes: {
    display: 'flex',
    gap: 10,
    marginTop: 6,
  },
}
