import { useEffect } from 'react'
import { Check, Map as IconeMapa, Globe } from 'lucide-react'
import { ConfigGrupo, ConfigLinha } from './ConfigGrupo'
import useStorage from '../hooks/useStorage'
import { ESTADO_GOOGLE, verificarGoogle } from '../lib/googleMapas'
export default function ConfigMapa({ destaque }) {
  const [estado] = useStorage(ESTADO_GOOGLE, null)
  const google = estado?.ok === true
  useEffect(() => {
    verificarGoogle({
      forcar: true,
    })
  }, [])
  return (
    <ConfigGrupo id="mapa" titulo="Mapa" destaque={destaque}>
      <ConfigLinha
        icone={Globe}
        cor="ceu"
        titulo="Mapa gratuito"
        semChevron
        ultima={!google && estado !== null}
      />
      {google ? (
        <ConfigLinha
          icone={Check}
          cor="lima"
          titulo="Mapa do Google disponível"
          detalhe="Escolha Google ou Google Satélite nas camadas do mapa"
          semChevron
          ultima
        />
      ) : null}
      {!google && estado === null && (
        <ConfigLinha icone={IconeMapa} cor="mist" titulo="Conferindo o mapa do Google..." semChevron ultima />
      )}
    </ConfigGrupo>
  )
}
