import { useEffect, useRef, useState } from 'react'
import { Bluetooth, BluetoothSearching, Camera, Check, Settings2, Unlink } from 'lucide-react'
import { Card, Botao, Sheet } from './ui'
import SeloMarca from './SeloMarca'
const INTENT_BLUETOOTH = 'intent:#Intent;action=android.settings.BLUETOOTH_SETTINGS;end'
const PREFIXO_NOME = 'Kleo'
let aparelhoAtual = null
let bateriaAtual = null
function ambiente() {
  const nav = typeof navigator === 'undefined' ? {} : navigator
  const ua = nav.userAgent || ''
  return {
    android: /Android/i.test(ua),
    ios: /iPhone|iPad|iPod/i.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1),
    webBluetooth: !!nav.bluetooth?.requestDevice,
  }
}
const conexaoAtual = () =>
  aparelhoAtual?.gatt?.connected
    ? {
        nome: aparelhoAtual.name || 'Kleo Device',
        bateria: bateriaAtual,
      }
    : null
function useContagem(alvo, duracao = 1100) {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf
    let inicio = null
    const passo = t => {
      if (inicio === null) inicio = t
      const p = reduzir ? 1 : Math.min(1, (t - inicio) / duracao)
      setValor(Math.round(alvo * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [alvo, duracao])
  return valor
}
function mensagemErro(e) {
  const nome = e?.name || ''
  if (nome === 'NotFoundError')
    return 'Nenhum aparelho escolhido. Confira se o Kleo Device está ligado e perto, e procure de novo.'
  if (nome === 'SecurityError')
    return 'O navegador não deixou procurar agora. Abra a Kleo pelo endereço seguro (https) e tente de novo.'
  if (nome === 'NotAllowedError')
    return 'A permissão de Bluetooth foi negada. Libere nos ajustes do navegador e tente de novo.'
  return 'Não consegui conectar. Confira se o aparelho está ligado, perto e com o Bluetooth do celular ligado.'
}
export default function HomeDispositivo() {
  const [conexao, setConexao] = useState(conexaoAtual)
  const [folha, setFolha] = useState(false)
  const [busca, setBusca] = useState({
    fase: 'parado',
    msg: '',
  })
  const [semBluetooth, setSemBluetooth] = useState(false)
  const [amb] = useState(ambiente)
  const montado = useRef(true)
  const bateria = useContagem(conexao?.bateria ?? 0)
  useEffect(() => {
    montado.current = true
    const aparelho = aparelhoAtual
    const caiu = () => {
      if (montado.current) setConexao(null)
    }
    aparelho?.addEventListener('gattserverdisconnected', caiu)
    return () => {
      montado.current = false
      aparelho?.removeEventListener('gattserverdisconnected', caiu)
    }
  }, [conexao?.nome])
  useEffect(() => {
    if (!folha || !amb.webBluetooth || !navigator.bluetooth.getAvailability) return
    let vivo = true
    navigator.bluetooth.getAvailability().then(
      ok => {
        if (vivo) setSemBluetooth(!ok)
      },
      () => {},
    )
    return () => {
      vivo = false
    }
  }, [folha, amb.webBluetooth])
  async function procurar() {
    setBusca({
      fase: 'procurando',
      msg: 'Procurando o Kleo Device…',
    })
    try {
      const aparelho = await navigator.bluetooth.requestDevice({
        filters: [
          {
            namePrefix: PREFIXO_NOME,
          },
        ],
        optionalServices: ['battery_service'],
      })
      setBusca({
        fase: 'conectando',
        msg: `Conectando ao ${aparelho.name || 'Kleo Device'}…`,
      })
      const servidor = await aparelho.gatt.connect()
      let nivel = null
      try {
        const servico = await servidor.getPrimaryService('battery_service')
        const carac = await servico.getCharacteristic('battery_level')
        nivel = (await carac.readValue()).getUint8(0)
        carac.addEventListener('characteristicvaluechanged', ev => {
          bateriaAtual = ev.target.value.getUint8(0)
          if (montado.current) setConexao(conexaoAtual())
        })
        await carac.startNotifications().catch(() => {})
      } catch {}
      aparelhoAtual = aparelho
      bateriaAtual = nivel
      if (!montado.current) return
      setConexao(conexaoAtual())
      setBusca({
        fase: 'ok',
        msg: 'Conectado!',
      })
      setTimeout(() => {
        if (montado.current) setFolha(false)
      }, 1200)
    } catch (e) {
      if (montado.current)
        setBusca({
          fase: 'erro',
          msg: mensagemErro(e),
        })
    }
  }
  function desconectar() {
    try {
      aparelhoAtual?.gatt?.disconnect()
    } catch {}
    aparelhoAtual = null
    bateriaAtual = null
    setConexao(null)
    setBusca({
      fase: 'parado',
      msg: '',
    })
  }
  function abrirPasso() {
    setBusca({
      fase: 'parado',
      msg: '',
    })
    setFolha(true)
  }
  const ligado = !!conexao
  const ocupado = busca.fase === 'procurando' || busca.fase === 'conectando'
  const passoFinal = amb.webBluetooth
    ? 'Toque em "Procurar o aparelho" e escolha Kleo Device na lista.'
    : amb.android
      ? 'Toque em "Abrir o Bluetooth do celular" e escolha Kleo Device na lista de aparelhos.'
      : amb.ios
        ? 'Abra Ajustes > Bluetooth e toque em Kleo Device.'
        : 'Abra as configurações de Bluetooth deste aparelho e escolha Kleo Device.'
  return (
    <Card
      aria-label="Kleo Device"
      style={{
        padding: '10px 20px 18px',
      }}
    >
      <div style={styles.linha}>
        <SeloMarca
          tamanho={46}
          style={{
            boxShadow: 'none',
            opacity: ligado ? 1 : 0.85,
            transition: 'opacity 0.25s',
          }}
        />
        <span style={styles.texto}>
          <span style={styles.nome}>Kleo Device</span>
          <span style={styles.sub}>
            {ligado ? (
              <>
                <Bluetooth size={13} aria-hidden="true" /> {conexao.nome}
                {conexao.bateria != null ? ` · bateria ${bateria}%` : ''}
              </>
            ) : (
              'Nenhum aparelho conectado'
            )}
          </span>
          {ligado && conexao.bateria != null && (
            <span style={styles.trilho} aria-hidden="true">
              <span
                style={{
                  ...styles.barra,
                  width: `${bateria}%`,
                }}
              />
            </span>
          )}
        </span>
        <Status ligado={ligado} rotulo={ligado ? 'Conectado' : 'Desconectado'} />
      </div>

      <div style={styles.divisor} />

      <div style={styles.linha}>
        <span
          style={{
            ...styles.icone,
            background: ligado ? 'var(--lima)' : 'var(--surface-2)',
          }}
        >
          <Camera size={22} color="#000" aria-hidden="true" />
        </span>
        <span style={styles.texto}>
          <span style={styles.nome}>Câmera Kleo</span>
          <span style={styles.sub}>Módulo clipe do aparelho</span>
        </span>
        <Status ligado={ligado} rotulo={ligado ? 'Conectada' : 'Desconectada'} />
      </div>

      {ligado ? (
        <Botao
          variante="fantasma"
          icone={Unlink}
          cheio
          onClick={desconectar}
          style={{
            marginTop: 12,
          }}
        >
          Desconectar
        </Botao>
      ) : (
        <Botao
          icone={Bluetooth}
          cheio
          onClick={abrirPasso}
          style={{
            marginTop: 12,
          }}
        >
          Conectar
        </Botao>
      )}

      <Sheet aberto={folha} onFechar={() => setFolha(false)} titulo="Conectar o Kleo Device">
        <p style={styles.intro}>O Kleo Device conversa com o celular por Bluetooth. É assim:</p>
        <ol style={styles.passos}>
          <li style={styles.passo}>
            <span style={styles.num}>1</span>
            <span>Ligue o Kleo Device e deixe perto do celular.</span>
          </li>
          <li style={styles.passo}>
            <span style={styles.num}>2</span>
            <span>Ligue o Bluetooth do celular.</span>
          </li>
          <li style={styles.passo}>
            <span style={styles.num}>3</span>
            <span>{passoFinal}</span>
          </li>
        </ol>

        {amb.webBluetooth && semBluetooth && (
          <p style={styles.aviso}>
            Este aparelho está sem Bluetooth disponível agora. Ligue o Bluetooth e tente de novo.
          </p>
        )}

        <div style={styles.acoes}>
          {amb.webBluetooth && (
            <Botao
              icone={busca.fase === 'ok' ? Check : BluetoothSearching}
              grande
              cheio
              carregando={ocupado}
              onClick={procurar}
            >
              {busca.fase === 'ok' ? 'Conectado' : 'Procurar o aparelho'}
            </Botao>
          )}
          {amb.android && (
            <a href={INTENT_BLUETOOTH} className="tap" style={styles.linkAjustes}>
              <Settings2 size={20} aria-hidden="true" /> Abrir o Bluetooth do celular
            </a>
          )}
        </div>

        <p
          role="status"
          aria-live="polite"
          style={{
            ...styles.msg,
            color: busca.fase === 'erro' ? '#b3261e' : 'var(--text-2)',
          }}
        >
          {busca.msg}
        </p>
        <p style={styles.nota}>Sem o aparelho, tudo da Kleo continua funcionando pelo celular.</p>
      </Sheet>
      <style>{keyframes}</style>
    </Card>
  )
}
function Status({ ligado, rotulo }) {
  return (
    <span
      style={{
        ...styles.status,
        background: ligado ? '#000' : 'var(--surface-2)',
        color: ligado ? '#fff' : 'var(--text-2)',
      }}
    >
      <span
        style={{
          ...styles.ponto,
          background: ligado ? 'var(--lima)' : 'var(--text-3)',
          animation: ligado ? 'homePontoVivo 1.4s ease-in-out infinite' : 'none',
        }}
        aria-hidden="true"
      />
      <span key={rotulo} className="anim-pop">
        {rotulo}
      </span>
    </span>
  )
}
const keyframes = `
@keyframes homePontoVivo { 0%,100% { box-shadow: 0 0 0 0 rgba(210,229,52,0.8) } 70% { box-shadow: 0 0 0 6px rgba(210,229,52,0) } }
`
const styles = {
  linha: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    textAlign: 'left',
    color: 'var(--text)',
  },
  icone: {
    width: 46,
    height: 46,
    borderRadius: '30%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.25s',
  },
  texto: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nome: {
    fontSize: 17,
    fontWeight: 700,
  },
  sub: {
    fontSize: 14,
    color: 'var(--text-2)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    overflowWrap: 'anywhere',
  },
  trilho: {
    display: 'block',
    height: 6,
    width: '70%',
    maxWidth: 160,
    borderRadius: 3,
    background: 'var(--surface-2)',
    marginTop: 6,
    overflow: 'hidden',
  },
  barra: {
    display: 'block',
    height: '100%',
    borderRadius: 3,
    background: 'var(--sucesso)',
  },
  divisor: {
    height: 1,
    background: 'var(--border)',
    margin: '2px 0 2px 60px',
    opacity: 0.6,
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    padding: '6px 12px',
    flexShrink: 0,
    borderRadius: 'var(--r-badge)',
    transition: 'background 0.25s, color 0.25s',
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  intro: {
    fontSize: 17,
    lineHeight: 1.45,
    color: 'var(--text-2)',
  },
  passos: {
    listStyle: 'none',
    margin: '14px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  passo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    fontSize: 17,
    lineHeight: 1.4,
    background: 'var(--surface-2)',
    borderRadius: 20,
    padding: '12px 14px',
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#000',
    color: '#fff',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 800,
  },
  aviso: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.4,
    color: '#b3261e',
    fontWeight: 600,
  },
  acoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 18,
  },
  linkAjustes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    padding: '10px 26px',
    borderRadius: 'var(--r-btn)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 18,
    fontWeight: 600,
  },
  msg: {
    minHeight: 22,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.4,
    fontWeight: 600,
    textAlign: 'center',
  },
  nota: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.4,
    color: 'var(--text-3)',
    textAlign: 'center',
  },
}
