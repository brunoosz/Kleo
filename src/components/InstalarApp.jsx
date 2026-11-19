import { Smartphone, Download, CircleCheck, MonitorDown, ExternalLink } from 'lucide-react'
import { Card, Botao } from './ui'
import { ConfigLinha } from './ConfigGrupo'
import useInstalar from '../hooks/useInstalar'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import useSaida from '../hooks/useSaida'
import { abrirDownload } from '../lib/instalar'
export default function InstalarApp({ variante = 'linha', ultima = false }) {
  const simples = useModoSimples()
  const { plataforma, comoApp, instalado } = useInstalar()
  const [dispensado, setDispensado] = useStorage('kleo_instalar_dispensado', false)
  const pc = plataforma === 'pc'
  const cardVisivel = variante === 'card' && !instalado && !dispensado
  const { montado, saindo } = useSaida(cardVisivel, 280)
  if (variante === 'botao') {
    if (instalado) return null
    return (
      <Botao
        variante="primario"
        icone={pc ? MonitorDown : Smartphone}
        cheio
        grande={simples}
        onClick={abrirDownload}
      >
        Baixar o app
      </Botao>
    )
  }
  if (variante === 'card') {
    if (!montado) return null
    return (
      <div className={saindo ? 'anim-out' : undefined}>
        <Card cor="branco" tamanho="g" aria-label="Baixar o app">
          <div style={styles.cardTopo}>
            <span style={styles.cardIcone} aria-hidden="true">
              {pc ? <MonitorDown size={26} color="#000" /> : <Smartphone size={26} color="#000" />}
            </span>
            <div style={styles.cardTextos}>
              <h2
                style={{
                  ...styles.cardTitulo,
                  fontSize: simples ? 28 : 24,
                }}
              >
                {simples
                  ? 'Baixe o app da Kleo'
                  : pc
                    ? 'Baixe a Kleo para o computador'
                    : 'Baixe o app da Kleo'}
              </h2>
              <p
                style={{
                  ...styles.cardTexto,
                  fontSize: simples ? 19 : 16,
                }}
              >
                {simples
                  ? 'Fica mais fácil de abrir.'
                  : 'Windows e Android, direto da página oficial de downloads.'}
              </p>
            </div>
          </div>
          <div
            style={{
              ...styles.cardAcoes,
              flexDirection: simples ? 'column' : 'row',
            }}
          >
            <Botao
              variante="primario"
              icone={Download}
              cheio
              grande={simples}
              onClick={abrirDownload}
              style={{
                flex: 1,
              }}
            >
              {simples ? 'Baixar agora' : 'Baixar'}
            </Botao>
            <Botao
              variante="fantasma"
              cheio
              grande={simples}
              onClick={() => setDispensado(true)}
              style={{
                flex: 1,
              }}
            >
              Agora não
            </Botao>
          </div>
        </Card>
      </div>
    )
  }
  if (instalado) {
    return (
      <ConfigLinha
        icone={CircleCheck}
        cor="lima"
        titulo="App instalado"
        detalhe={
          comoApp
            ? 'Você está usando a Kleo instalada neste aparelho.'
            : 'A Kleo já está instalada. Abra pelo ícone do app.'
        }
        ultima={ultima}
      />
    )
  }
  return (
    <ConfigLinha
      icone={pc ? MonitorDown : Smartphone}
      cor="ceu"
      titulo="Baixar o app"
      detalhe="Windows e Android"
      onClick={abrirDownload}
      ultima={ultima}
    />
  )
}
export function PassosInstalar() {
  const simples = useModoSimples()
  return (
    <div style={styles.passos}>
      <p
        style={{
          ...styles.passoTexto,
          fontSize: simples ? 17 : 15,
        }}
      >
        Baixe o app da Kleo na página oficial de downloads.
      </p>
      <Botao variante="suave" icone={ExternalLink} cheio grande={simples} onClick={abrirDownload}>
        Abrir a página de download
      </Botao>
    </div>
  )
}
const styles = {
  cardTopo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIcone: {
    width: 52,
    height: 52,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextos: {
    flex: 1,
    minWidth: 0,
  },
  cardTitulo: {
    fontWeight: 800,
    lineHeight: 1.08,
  },
  cardTexto: {
    color: 'var(--text-2)',
    lineHeight: 1.4,
    marginTop: 6,
  },
  cardAcoes: {
    display: 'flex',
    gap: 10,
    marginTop: 18,
  },
  passos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  passoTexto: {
    color: 'var(--text-2)',
    lineHeight: 1.4,
    margin: 0,
  },
}
