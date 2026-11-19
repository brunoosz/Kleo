import { Component } from 'react'
import { Wrench, RotateCcw } from 'lucide-react'
import { Card, Botao, Vazio } from '../components/ui'
import useStorage from '../hooks/useStorage'
import { getFerramenta } from './registro'
class Protecao extends Component {
  constructor(props) {
    super(props)
    this.state = {
      erro: null,
    }
  }
  static getDerivedStateFromError(erro) {
    return {
      erro,
    }
  }
  componentDidCatch(erro) {
    console.error('Ferramenta falhou:', erro)
  }
  render() {
    if (this.state.erro) {
      return (
        <Card>
          <Vazio
            icone={Wrench}
            titulo="Esta ferramenta teve um problema"
            texto="Tente abrir de novo. Seus dados continuam salvos."
          />
          <div
            style={{
              marginTop: 12,
            }}
          >
            <Botao
              variante="fantasma"
              icone={RotateCcw}
              cheio
              onClick={() =>
                this.setState({
                  erro: null,
                })
              }
            >
              Tentar de novo
            </Botao>
          </div>
        </Card>
      )
    }
    return this.props.children
  }
}
export default function Ferramenta({ id, config, profissao, chave }) {
  useStorage('kleo_ia', null)
  useStorage('kleo_ia_integrada', null)
  const f = getFerramenta(id)
  if (!f) return null
  const C = f.componente
  const ch = chave || `${typeof profissao === 'object' ? profissao?.id : profissao || 'geral'}_${id}`
  return (
    <Protecao key={ch}>
      <C config={config || {}} profissao={profissao} chave={ch} />
    </Protecao>
  )
}
