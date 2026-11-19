import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Users, ShieldCheck, Trash2, CircleCheck, CircleOff } from 'lucide-react'
import { ConfigGrupo, ConfigLinha } from './ConfigGrupo'
import { Modal } from './ui'
import AvisosPush from './rede/AvisosPush'
import useStorage from '../hooks/useStorage'
import { modoRede, usarDemonstracao, apagarConta } from '../lib/rede'
export default function ConfigConversas({ destaque, avisar }) {
  const navigate = useNavigate()
  useStorage('kleo_rede_modo', null)
  const [conta] = useStorage('kleo_rede_conta', null)
  const [emergencia] = useStorage('kleo_emergencia', [])
  const [apagar, setApagar] = useState(false)
  const [apagando, setApagando] = useState(false)
  const modo = modoRede()
  const totalEmergencia = Array.isArray(emergencia) ? emergencia.length : 0
  const confirmarApagar = async () => {
    setApagando(true)
    try {
      await apagarConta()
      avisar?.('Conta das Conversas apagada')
    } catch {
      avisar?.('Não consegui apagar agora. Tente com internet.')
    }
    setApagando(false)
    setApagar(false)
  }
  const STATUS = {
    supabase: {
      icone: CircleCheck,
      cor: 'lima',
      titulo: 'Conversas ligadas',
    },
    demo: {
      icone: FlaskConical,
      cor: 'lavanda',
      titulo: 'Modo demonstração',
      detalhe: 'Contatos de exemplo',
    },
    nenhum: {
      icone: CircleOff,
      cor: 'mist',
      titulo: 'Indisponível no momento',
      detalhe: 'Experimente a demonstração',
    },
  }
  const st = STATUS[modo]
  return (
    <ConfigGrupo id="conversas" titulo="Conversas" destaque={destaque}>
      <ConfigLinha icone={st.icone} cor={st.cor} titulo={st.titulo} detalhe={st.detalhe} />
      {conta && (
        <ConfigLinha
          icone={Users}
          cor="ceu"
          titulo={`@${conta.usuario}`}
          detalhe="Seu perfil, contatos e conversas"
          onClick={() => navigate('/pessoas')}
        />
      )}
      {modo === 'supabase' && <AvisosPush variante="linha" />}
      <ConfigLinha
        icone={ShieldCheck}
        cor="lima"
        titulo="Contatos de emergência"
        detalhe={
          totalEmergencia
            ? `${totalEmergencia} cadastrado${totalEmergencia > 1 ? 's' : ''}`
            : 'Nenhum ainda: cadastre pelo menos um'
        }
        onClick={() => navigate('/pessoas?secao=emergencia')}
      />

      {modo === 'demo' ? (
        <ConfigLinha
          icone={FlaskConical}
          cor="mist"
          titulo="Sair da demonstração"
          detalhe="Apaga os contatos de exemplo"
          onClick={() => {
            usarDemonstracao(false)
            avisar?.('Demonstração desligada')
          }}
          semChevron
        />
      ) : (
        modo === 'nenhum' && (
          <ConfigLinha
            icone={FlaskConical}
            cor="lavanda"
            titulo="Experimentar a demonstração"
            onClick={() => {
              usarDemonstracao(true)
              navigate('/pessoas')
            }}
          />
        )
      )}

      {conta && (
        <ConfigLinha
          icone={Trash2}
          titulo="Apagar minha conta das Conversas"
          detalhe="Remove seu perfil e seu @"
          destrutivo
          onClick={() => setApagar(true)}
          semChevron
          ultima
        />
      )}

      <Modal
        aberto={apagar}
        onFechar={() => setApagar(false)}
        titulo="Apagar sua conta?"
        texto="Seu perfil, seu @ e seus contatos somem. As pessoas não vão mais conseguir te encontrar."
        acoes={[
          {
            label: 'Cancelar',
            variante: 'fantasma',
            onClick: () => setApagar(false),
          },
          {
            label: apagando ? 'Apagando...' : 'Apagar',
            variante: 'perigo',
            onClick: confirmarApagar,
          },
        ]}
      />
    </ConfigGrupo>
  )
}
