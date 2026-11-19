import { useState, useSyncExternalStore } from 'react'
import { Bell, BellRing, BellOff, Check, Send, RefreshCw, Smartphone, TriangleAlert } from 'lucide-react'
import { Card, Botao, Sheet, Tag } from '../ui'
import { ConfigLinha } from '../ConfigGrupo'
import { PassosInstalar } from '../InstalarApp'
import useStorage from '../../hooks/useStorage'
import useModoSimples from '../../hooks/useModoSimples'
import useSaida from '../../hooks/useSaida'
import {
  assinarPush,
  lerPush,
  conferirPush,
  ativarPush,
  desativarPush,
  testarPush,
  MOTIVOS,
} from '../../lib/push'
import { plataforma, rodandoComoApp, abrirDownload } from '../../lib/instalar'
const TITULO = 'Avisos com o app fechado'
const EXPLICACAO = 'Mensagens e pedidos de ajuda chegam mesmo com o app fechado.'
export default function AvisosPush({ variante = 'linha', ultima = false }) {
  const { estado, motivo } = useSyncExternalStore(assinarPush, lerPush, lerPush)
  if (motivo === 'conversas') return null
  if (variante === 'card') return <CardAvisos estado={estado} motivo={motivo} />
  return <LinhaAvisos estado={estado} motivo={motivo} ultima={ultima} />
}
const LINHA = {
  ativo: {
    icone: BellRing,
    cor: 'lima',
    detalhe: 'Ligados neste aparelho',
    tag: 'Ligado',
    tagCor: 'lima',
  },
  inativo: {
    icone: Bell,
    cor: 'lavanda',
    detalhe: `${EXPLICACAO} Toque para ligar.`,
    tag: 'Desligado',
    tagCor: 'mist',
  },
  bloqueado: {
    icone: BellOff,
    cor: 'mist',
    detalhe: 'Bloqueados no navegador. Toque para ver como liberar.',
    tag: 'Bloqueado',
    tagCor: 'mist',
  },
  indisponivel: {
    icone: BellOff,
    cor: 'mist',
    detalhe: '',
    tag: '',
    tagCor: 'mist',
  },
}
function LinhaAvisos({ estado, motivo, ultima }) {
  const [aberto, setAberto] = useState(false)
  const [vez, setVez] = useState(0)
  const info = LINHA[estado] || LINHA.inativo
  const detalhe = estado === 'indisponivel' ? MOTIVOS[motivo] || MOTIVOS.navegador : info.detalhe
  const abre = estado !== 'indisponivel' || motivo === 'iphone'
  const abrir = () => {
    setVez(v => v + 1)
    setAberto(true)
  }
  return (
    <>
      <ConfigLinha
        icone={info.icone}
        cor={info.cor}
        titulo={TITULO}
        detalhe={detalhe}
        direita={
          info.tag ? (
            <Tag cor={info.tagCor} style={styles.tag}>
              {info.tag}
            </Tag>
          ) : null
        }
        onClick={abre ? abrir : undefined}
        ultima={ultima}
      />
      <Sheet aberto={aberto} onFechar={() => setAberto(false)} titulo={TITULO}>
        <PainelAvisos key={vez} estado={estado} motivo={motivo} fechar={() => setAberto(false)} />
      </Sheet>
    </>
  )
}
function passosLiberar() {
  const p = plataforma()
  if (p === 'ios')
    return [
      'Abra os Ajustes do iPhone.',
      'Toque em Notificações e depois em Kleo.',
      'Ligue "Permitir Notificações".',
    ]
  if (rodandoComoApp())
    return [
      'Abra os Ajustes do celular.',
      'Toque em Apps (ou Aplicativos) e depois em Kleo.',
      'Toque em Notificações e ligue.',
    ]
  if (p === 'android')
    return [
      'Toque no ícone ao lado do endereço do site.',
      'Toque em Permissões e depois em Notificações.',
      'Escolha Permitir.',
    ]
  return [
    'Clique no cadeado ao lado do endereço do site.',
    'Em Notificações, escolha Permitir.',
    'Volte aqui e toque em "Já liberei".',
  ]
}
function PainelAvisos({ estado, motivo, fechar }) {
  const simples = useModoSimples()
  const [ocupado, setOcupado] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [confirmarDesligar, setConfirmarDesligar] = useState(false)
  const [estadoVisto, setEstadoVisto] = useState(estado)
  if (estadoVisto !== estado) {
    setEstadoVisto(estado)
    setErro('')
    setConfirmarDesligar(false)
  }
  const texto = {
    ...styles.texto,
    fontSize: simples ? 19 : 17,
  }
  const executar = async (qual, acao, sucesso) => {
    setErro('')
    setOk('')
    setOcupado(qual)
    const r = await acao()
    setOcupado('')
    if (r.ok) setOk(sucesso)
    else setErro(r.erro || 'Não deu certo agora. Tente de novo.')
  }
  if (estado === 'indisponivel') {
    return (
      <div style={styles.painel}>
        <p style={texto}>{MOTIVOS[motivo] || MOTIVOS.navegador}</p>
        {motivo === 'iphone' && <PassosInstalar plataforma="ios" />}
        <Botao variante="primario" cheio grande={simples} icone={Check} onClick={fechar}>
          Entendi
        </Botao>
      </div>
    )
  }
  if (estado === 'bloqueado') {
    return (
      <div style={styles.painel}>
        <Destaque icone={BellOff} cor="var(--surface-2)" />
        <p style={texto}>As notificações da Kleo estão bloqueadas neste aparelho. Para liberar:</p>
        <ol style={styles.passos}>
          {passosLiberar().map((p, i) => (
            <li
              key={p}
              className="anim-up"
              style={{
                ...styles.passo,
                animationDelay: `${0.05 + i * 0.06}s`,
                fontSize: simples ? 18 : 16,
              }}
            >
              <span style={styles.numero} aria-hidden="true">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        {erro && (
          <p role="alert" style={styles.erro}>
            <TriangleAlert size={17} aria-hidden="true" /> {erro}
          </p>
        )}
        <Botao
          variante="primario"
          cheio
          grande={simples}
          icone={RefreshCw}
          onClick={() => {
            if (conferirPush().estado === 'bloqueado')
              setErro('Ainda está bloqueado. Confira os passos acima.')
          }}
        >
          Já liberei, conferir
        </Botao>
      </div>
    )
  }
  if (estado === 'ativo') {
    return (
      <div style={styles.painel}>
        <Destaque icone={BellRing} cor="var(--lima)" />
        <p style={texto}>
          Os avisos estão ligados neste aparelho. Quando alguém mandar mensagem ou pedir ajuda, o celular
          avisa na hora.
        </p>
        {ok && (
          <p role="status" className="anim-pop" style={styles.ok}>
            <Check size={18} aria-hidden="true" /> {ok}
          </p>
        )}
        {erro && (
          <p role="alert" style={styles.erro}>
            <TriangleAlert size={17} aria-hidden="true" /> {erro}
          </p>
        )}
        {!confirmarDesligar ? (
          <div style={styles.acoes}>
            <Botao
              variante="primario"
              cheio
              grande={simples}
              icone={Send}
              carregando={ocupado === 'teste'}
              onClick={() =>
                executar('teste', testarPush, 'Aviso de teste enviado. Ele chega em alguns segundos.')
              }
            >
              Enviar um aviso de teste
            </Botao>
            <Botao
              variante="fantasma"
              cheio
              grande={simples}
              icone={BellOff}
              onClick={() => setConfirmarDesligar(true)}
            >
              Desligar avisos
            </Botao>
          </div>
        ) : (
          <div className="anim-up" style={styles.confirmar}>
            <p
              style={{
                ...texto,
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              Desligar? Você deixa de receber pedidos de ajuda com o app fechado.
            </p>
            <div style={styles.acoes}>
              <Botao
                variante="perigo"
                cheio
                grande={simples}
                icone={BellOff}
                carregando={ocupado === 'desligar'}
                onClick={async () => {
                  setOcupado('desligar')
                  await desativarPush()
                  setOcupado('')
                  fechar()
                }}
              >
                Desligar
              </Botao>
              <Botao variante="fantasma" cheio grande={simples} onClick={() => setConfirmarDesligar(false)}>
                Manter ligados
              </Botao>
            </div>
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={styles.painel}>
      <Destaque icone={Bell} cor="var(--lavanda)" />
      <p style={texto}>
        Quando alguém mandar mensagem ou pedir ajuda, o celular avisa na hora, mesmo com a Kleo fechada.
      </p>
      <p
        style={{
          ...styles.dica,
          fontSize: simples ? 17 : 15,
        }}
      >
        Depois de tocar no botão, o celular pergunta se pode mostrar notificações. Toque em{' '}
        <strong>Permitir</strong>.
      </p>
      {erro && (
        <p role="alert" style={styles.erro}>
          <TriangleAlert size={17} aria-hidden="true" /> {erro}
        </p>
      )}
      <Botao
        variante="primario"
        cheio
        grande
        icone={BellRing}
        carregando={ocupado === 'ligar'}
        onClick={() => executar('ligar', ativarPush, 'Avisos ligados')}
      >
        Ligar avisos
      </Botao>
    </div>
  )
}
function Destaque({ icone: Icone, cor }) {
  return (
    <span
      className="anim-pop"
      style={{
        ...styles.destaque,
        background: cor,
      }}
      aria-hidden="true"
    >
      <Icone size={34} color="#000" strokeWidth={2} />
    </span>
  )
}
function CardAvisos({ estado, motivo }) {
  const simples = useModoSimples()
  const [dispensado, setDispensado] = useStorage('kleo_push_card_dispensado', false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)
  const [instalar, setInstalar] = useState(false)
  const iphone = estado === 'indisponivel' && motivo === 'iphone'
  const visivel = !dispensado && (estado === 'inativo' || iphone || pronto || !!erro)
  const { montado, saindo } = useSaida(visivel, 300)
  if (!montado) return null
  const ligar = async () => {
    setErro('')
    setOcupado(true)
    const r = await ativarPush()
    setOcupado(false)
    if (!r.ok) {
      setErro(r.erro || 'Não deu certo agora. Tente de novo.')
      return
    }
    setPronto(true)
    setTimeout(() => setPronto(false), 3000)
  }
  const dispensar = () => {
    setErro('')
    setDispensado(true)
  }
  if (pronto || estado === 'ativo') {
    return (
      <div className={saindo ? 'anim-out' : undefined}>
        <Card cor="lima" style={styles.card} aria-live="polite">
          <div style={styles.cardTopo}>
            <span
              className="anim-pop"
              style={{
                ...styles.cardIcone,
                background: '#000',
              }}
              aria-hidden="true"
            >
              <Check size={26} color="#fff" strokeWidth={2.6} />
            </span>
            <div style={styles.cardTextos}>
              <h2
                style={{
                  ...styles.cardTitulo,
                  fontSize: simples ? 26 : 22,
                }}
              >
                Avisos ligados
              </h2>
              <p
                style={{
                  ...styles.cardTexto,
                  fontSize: simples ? 18 : 15,
                }}
              >
                Você vai saber na hora quando alguém mandar mensagem ou pedir ajuda.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  return (
    <div className={saindo ? 'anim-out' : undefined}>
      <Card cor="lima" style={styles.card} aria-label={TITULO}>
        <div style={styles.cardTopo}>
          <span style={styles.cardIcone} aria-hidden="true">
            {iphone ? <Smartphone size={26} color="#000" /> : <BellRing size={26} color="#000" />}
          </span>
          <div style={styles.cardTextos}>
            <h2
              style={{
                ...styles.cardTitulo,
                fontSize: simples ? 26 : 22,
              }}
            >
              {simples ? 'Avisos no celular' : TITULO}
            </h2>
            <p
              style={{
                ...styles.cardTexto,
                fontSize: simples ? 18 : 15,
              }}
            >
              {simples ? 'Saiba na hora quando sua família mandar mensagem ou pedir ajuda.' : EXPLICACAO}
            </p>
            <p
              style={{
                ...styles.cardDica,
                fontSize: simples ? 17 : 14,
              }}
            >
              {iphone
                ? 'Para receber os avisos, baixe o app da Kleo.'
                : 'O celular vai perguntar: toque em Permitir.'}
            </p>
          </div>
        </div>
        {erro && (
          <p role="alert" style={styles.erro}>
            <TriangleAlert size={17} aria-hidden="true" /> {erro}
          </p>
        )}
        <div
          style={{
            ...styles.cardAcoes,
            flexDirection: simples ? 'column' : 'row',
          }}
        >
          {iphone ? (
            <Botao
              variante="primario"
              cheio
              grande={simples}
              icone={Smartphone}
              onClick={abrirDownload}
              style={{
                flex: 1,
              }}
            >
              Baixar o app
            </Botao>
          ) : (
            estado === 'inativo' && (
              <Botao
                variante="primario"
                cheio
                grande={simples}
                icone={BellRing}
                carregando={ocupado}
                onClick={ligar}
                style={{
                  flex: 1,
                }}
              >
                Ligar avisos
              </Botao>
            )
          )}
          <Botao
            variante="fantasma"
            cheio
            grande={simples}
            onClick={dispensar}
            style={{
              flex: 1,
            }}
          >
            {erro && estado !== 'inativo' ? 'Fechar' : 'Agora não'}
          </Botao>
        </div>
      </Card>
      <Sheet aberto={instalar} onFechar={() => setInstalar(false)} titulo="Instalar no iPhone">
        <PassosInstalar plataforma="ios" />
        <Botao
          variante="primario"
          cheio
          grande={simples}
          icone={Check}
          onClick={() => setInstalar(false)}
          style={{
            marginTop: 18,
          }}
        >
          Entendi
        </Botao>
      </Sheet>
    </div>
  )
}
const styles = {
  tag: {
    fontSize: 13,
    padding: '4px 10px',
    flexShrink: 0,
  },
  painel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 6,
  },
  destaque: {
    width: 72,
    height: 72,
    borderRadius: '30%',
    alignSelf: 'center',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--sombra)',
  },
  texto: {
    lineHeight: 1.45,
    color: 'var(--text-2)',
    textAlign: 'center',
  },
  dica: {
    lineHeight: 1.45,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    borderRadius: 20,
    padding: '12px 16px',
    textAlign: 'center',
  },
  acoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  confirmar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  passos: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  passo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--surface)',
    borderRadius: 20,
    padding: '12px 14px',
    lineHeight: 1.35,
    color: 'var(--text)',
    boxShadow: 'var(--sombra)',
  },
  numero: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ok: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 700,
    lineHeight: 1.35,
    background: 'var(--lima)',
    borderRadius: 20,
    padding: '12px 16px',
  },
  erro: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    color: 'var(--erro)',
    fontWeight: 600,
    lineHeight: 1.4,
    fontSize: 15,
    marginTop: 12,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTopo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIcone: {
    width: 52,
    height: 52,
    borderRadius: '30%',
    background: 'var(--surface)',
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
    lineHeight: 1.4,
    marginTop: 6,
    color: '#000',
  },
  cardDica: {
    lineHeight: 1.4,
    marginTop: 6,
    color: 'var(--text-2)',
    fontWeight: 600,
  },
  cardAcoes: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
}
