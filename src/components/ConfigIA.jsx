import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, TriangleAlert, Wifi, Check, X, MessageSquareText, Crown, RefreshCw } from 'lucide-react'
import { ConfigGrupo, ConfigLinha } from './ConfigGrupo'
import { Botao, Tag, Segmentado } from './ui'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import useConta from '../hooks/useConta'
import { TAMANHOS_RESPOSTA, testarIntegrada, estadoIntegrada, verificarIntegrada } from '../lib/ia'
const juntar = itens =>
  itens.length > 1 ? `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}` : itens[0] || ''
export default function ConfigIA({ destaque = false, avisar = () => {} }) {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const { ehDono } = useConta()
  const [respostas, setRespostas] = useStorage('kleo_ia_respostas', 'curtas')
  const [estado, setEstado] = useState(() => estadoIntegrada())
  const [teste, setTeste] = useState(null)
  useEffect(() => {
    let vivo = true
    verificarIntegrada().then(e => {
      if (vivo) setEstado(e)
    })
    return () => {
      vivo = false
    }
  }, [])
  const atualizar = async () => {
    const e = await verificarIntegrada({
      forcar: true,
    })
    setEstado(e)
  }
  const testar = async () => {
    setTeste({
      estado: 'testando',
    })
    const r = await testarIntegrada()
    setEstado(estadoIntegrada())
    setTeste(
      r.ok
        ? {
            estado: 'ok',
            ms: r.ms,
          }
        : {
            estado: 'erro',
            erro: r.erro,
          },
    )
    if (r.ok) avisar(`A IA respondeu em ${r.ms} ms`)
  }
  const ok = !!estado?.ok && !!estado?.chat
  const recursos = [
    estado?.chat && 'conversa',
    estado?.visao && 'fotos e câmera',
    estado?.transcricao && 'áudios em texto',
  ].filter(Boolean)
  let titulo = 'IA da Kleo: ligada'
  let texto = `Funciona: ${juntar(recursos)}.`
  if (!estado) {
    titulo = 'IA da Kleo: verificando...'
    texto = 'Só um instante.'
  } else if (!ok) {
    titulo = 'IA da Kleo: indisponível agora'
    texto =
      estado.motivo === 'rede' || estado.falhaRede
        ? 'Sem internet. Confira a conexão e tente de novo.'
        : ehDono
          ? 'Falta uma chave de IA no Painel do dono.'
          : 'Tente de novo mais tarde.'
  }
  return (
    <ConfigGrupo id="ia" titulo="Inteligência artificial" destaque={destaque}>
      <div
        className="anim-up"
        style={{
          ...styles.integrada,
          background: ok ? 'var(--lima)' : 'var(--surface-2)',
        }}
      >
        <div style={styles.topo}>
          <span
            style={{
              ...styles.icone,
              background: ok ? '#000' : 'var(--surface)',
            }}
            aria-hidden="true"
          >
            {ok ? <Sparkles size={22} color="var(--lima)" /> : <TriangleAlert size={22} color="#000" />}
          </span>
          <div style={styles.textos} aria-live="polite">
            <span
              style={{
                ...styles.titulo,
                fontSize: simples ? 19 : 17,
              }}
            >
              {titulo}
            </span>
            <span
              style={{
                ...styles.dica,
                fontSize: simples ? 16 : 14,
              }}
            >
              {texto}
            </span>
          </div>
        </div>
        <div style={styles.acoes}>
          {ok ? (
            <Botao
              variante="primario"
              icone={Wifi}
              onClick={testar}
              carregando={teste?.estado === 'testando'}
            >
              Testar
            </Botao>
          ) : (
            <Botao variante="primario" icone={RefreshCw} onClick={atualizar}>
              Verificar de novo
            </Botao>
          )}
          {teste?.estado === 'ok' && (
            <span className="anim-pop">
              <Tag cor={teste.ms < 1200 ? 'branco' : 'lavanda'} icone={Check}>
                {teste.ms} ms
              </Tag>
            </span>
          )}
          {teste?.estado === 'erro' && (
            <span className="anim-pop">
              <Tag cor="rgba(229, 72, 77, 0.14)" icone={X}>
                Falhou
              </Tag>
            </span>
          )}
        </div>
        {teste?.estado === 'erro' && (
          <p className="anim-up" style={styles.erro} role="alert">
            {teste.erro}
          </p>
        )}
      </div>

      <div style={styles.bloco}>
        <ConfigLinha
          icone={MessageSquareText}
          cor="lavanda"
          titulo="Tamanho das respostas"
          detalhe="No chat. Curtas são mais fáceis de ouvir."
          semChevron
          ultima={!ehDono}
        />
        <div style={styles.segmentado}>
          <Segmentado
            opcoes={TAMANHOS_RESPOSTA.map(t => ({
              id: t.id,
              label: t.rotulo,
            }))}
            valor={respostas}
            onChange={v => {
              setRespostas(v)
              avisar(v === 'detalhadas' ? 'Respostas detalhadas' : 'Respostas curtas')
            }}
          />
        </div>
      </div>
      {ehDono && (
        <ConfigLinha
          icone={Crown}
          cor="lima"
          titulo="Chaves de IA e voz"
          detalhe="No Painel do dono, mais abaixo"
          onClick={() =>
            navigate('/configuracoes?secao=dono', {
              replace: true,
            })
          }
          ultima
        />
      )}
    </ConfigGrupo>
  )
}
const styles = {
  integrada: {
    margin: '8px 12px 6px',
    borderRadius: 22,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  topo: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  icone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  titulo: {
    fontWeight: 800,
    lineHeight: 1.2,
  },
  dica: {
    color: '#000',
    lineHeight: 1.4,
  },
  acoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  erro: {
    margin: 0,
    color: '#000',
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.4,
  },
  bloco: {
    display: 'flex',
    flexDirection: 'column',
  },
  segmentado: {
    padding: '0 16px 12px',
  },
}
