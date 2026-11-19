import { useState } from 'react'
import { Info, RotateCcw, Calculator } from 'lucide-react'
import { Card, Chip, Botao, Vazio } from '../components/ui'
import { CALCULADORAS } from './calculadoras'
import { useDados, useTam, numero, calcularSeguro } from './comum'
import { Rotulo, Entrada, Grande, Coluna } from './pecas'
export default function Calculadora({ config = {}, chave }) {
  const { simples, h } = useTam()
  const tipos = (Array.isArray(config.tipos) ? config.tipos : [config.tipo]).filter(t => CALCULADORAS[t])
  const [tipoAtivo, setTipoAtivo] = useState(tipos[0])
  const [dados, setDados] = useDados(chave, {})
  const [verExplicacao, setVerExplicacao] = useState(false)
  const tipo = tipos.includes(tipoAtivo) ? tipoAtivo : tipos[0]
  const def = CALCULADORAS[tipo]
  if (!def)
    return (
      <Card>
        <Vazio
          icone={Calculator}
          titulo="Calculadora indisponível"
          texto="Esta calculadora não foi encontrada."
        />
      </Card>
    )
  const salvos = (dados && dados[tipo]) || {}
  const texto = {}
  def.campos.forEach(c => {
    texto[c.id] = salvos[c.id] ?? c.padrao ?? ''
  })
  const valores = {}
  def.campos.forEach(c => {
    valores[c.id] = c.opcoes ? texto[c.id] : numero(texto[c.id])
  })
  const visiveis = def.campos.filter(c => !c.mostrar || c.mostrar(valores))
  const resultado = calcularSeguro(def.calcular, valores)
  const extras = resultado ? (simples ? resultado.extras.slice(0, 1) : resultado.extras) : []
  const mudar = (id, v) =>
    setDados(a => ({
      ...(a || {}),
      [tipo]: {
        ...((a || {})[tipo] || {}),
        [id]: v,
      },
    }))
  const limpar = () =>
    setDados(a => ({
      ...(a || {}),
      [tipo]: {},
    }))
  const opcoes = visiveis.filter(c => c.opcoes)
  const numericos = visiveis.filter(c => !c.opcoes)
  const Icone = def.icone
  return (
    <Coluna>
      {tipos.length > 1 && (
        <div style={styles.seletor}>
          {tipos.map(t => {
            const d = CALCULADORAS[t]
            return (
              <Chip key={t} icone={d.icone} ativo={t === tipo} onClick={() => setTipoAtivo(t)}>
                {d.nome}
              </Chip>
            )
          })}
        </div>
      )}

      <Card key={tipo} className="anim-tab">
        <div style={styles.cab}>
          <span style={styles.icone}>
            <Icone size={22} color="#000" />
          </span>
          <p
            style={{
              ...styles.nome,
              fontSize: simples ? 22 : 20,
            }}
          >
            {def.nome}
          </p>
          <button
            onClick={() => setVerExplicacao(v => !v)}
            className="tap"
            style={styles.info}
            aria-label="Como é calculado"
            aria-expanded={verExplicacao}
          >
            <Info size={20} />
          </button>
        </div>
        {(verExplicacao || simples) && (
          <p className="anim-fade" style={styles.explicacao}>
            {def.explicacao}
          </p>
        )}

        {opcoes.map(c => (
          <div
            key={c.id}
            style={{
              marginTop: 16,
            }}
          >
            <Rotulo>{c.rotulo}</Rotulo>
            <div style={styles.opcoes}>
              {c.opcoes.map(o => (
                <Chip key={o.id} cor="lavanda" ativo={texto[c.id] === o.id} onClick={() => mudar(c.id, o.id)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            ...styles.grade,
            gridTemplateColumns: simples || numericos.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {numericos.map(c => (
            <Entrada
              key={c.id}
              rotulo={c.unidade ? `${c.rotulo} (${c.unidade})` : c.rotulo}
              inputMode="decimal"
              altura={h}
              placeholder="0"
              value={texto[c.id]}
              onChange={e => mudar(c.id, e.target.value)}
              style={{
                fontSize: simples ? 20 : 17,
                fontWeight: 600,
              }}
            />
          ))}
        </div>
      </Card>

      <Card cor={resultado ? 'lima' : 'mist'} className="anim-scale">
        {resultado ? (
          <>
            <Grande
              rotulo={resultado.principal.rotulo}
              valor={resultado.principal.valor}
              tamanho={simples ? 46 : 40}
            />
            {extras.length > 0 && (
              <div style={styles.extras}>
                {extras.map(x => (
                  <div key={x.rotulo} style={styles.extra}>
                    <span style={styles.extraRot}>{x.rotulo}</span>
                    <span key={x.valor} className="valor-muda" style={styles.extraValor}>
                      {x.valor}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={styles.aguardando}>Preencha os campos para ver o resultado.</p>
        )}
      </Card>

      {!simples && Object.keys(salvos).length > 0 && (
        <Botao variante="fantasma" icone={RotateCcw} onClick={limpar}>
          Limpar valores
        </Botao>
      )}
    </Coluna>
  )
}
const styles = {
  seletor: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 2,
  },
  cab: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 15,
    background: 'var(--lavanda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nome: {
    flex: 1,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  info: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-2)',
    flexShrink: 0,
  },
  explicacao: {
    fontSize: 15,
    lineHeight: 1.45,
    color: 'var(--text-2)',
    marginTop: 12,
    background: 'var(--surface-2)',
    borderRadius: 15,
    padding: '10px 14px',
  },
  opcoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  grade: {
    display: 'grid',
    gap: 12,
    marginTop: 16,
  },
  extras: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 16,
  },
  extra: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    padding: '8px 0',
    borderTop: '1px solid rgba(0,0,0,0.12)',
  },
  extraRot: {
    fontSize: 15,
    color: '#000',
  },
  extraValor: {
    fontSize: 17,
    fontWeight: 700,
    color: '#000',
    textAlign: 'right',
  },
  aguardando: {
    fontSize: 16,
    color: 'var(--text-2)',
    textAlign: 'center',
    padding: '6px 0',
  },
}
