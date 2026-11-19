import { useRef, useState } from 'react'
import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { Botao, Sheet } from '../ui'
import { ConfigLinha } from '../ConfigGrupo'
import Avatar from '../Avatar'
import CameraAoVivo from '../CameraAoVivo'
import useModoSimples from '../../hooks/useModoSimples'
import { arquivoParaDataURL, recortarQuadrado } from '../../lib/imagem'
import { atualizarConta } from '../../lib/rede'
export default function FotoPerfil({ conta, variante = 'botao' }) {
  const simples = useModoSimples()
  const [opcoes, setOpcoes] = useState(false)
  const [camera, setCamera] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const galeria = useRef(null)
  if (!conta) return null
  const temFoto = !!conta.foto
  const rotulo = salvando ? 'Salvando foto...' : temFoto ? 'Trocar foto' : 'Adicionar foto'
  const guardar = async foto => {
    setOpcoes(false)
    setCamera(false)
    setSalvando(true)
    setErro('')
    try {
      await atualizarConta({
        nome: conta.nome,
        usuario: conta.usuario,
        foto,
      })
    } catch {
      setErro('Não consegui salvar a foto. Confira a internet.')
    }
    setSalvando(false)
  }
  const escolherArquivo = async e => {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    try {
      await guardar(await recortarQuadrado(await arquivoParaDataURL(arq)))
    } catch {
      setErro('Não consegui abrir essa foto.')
    }
  }
  return (
    <>
      {variante === 'linha' ? (
        <ConfigLinha
          icone={Camera}
          cor="ceu"
          titulo="Foto de perfil"
          detalhe={erro || rotulo}
          direita={<Avatar nome={conta.nome} foto={conta.foto} chave={conta.uid} tamanho={36} />}
          onClick={() => !salvando && setOpcoes(true)}
        />
      ) : (
        <div style={styles.coluna}>
          <Botao
            variante={temFoto ? 'fantasma' : 'primario'}
            icone={Camera}
            cheio
            grande={simples}
            carregando={salvando}
            onClick={() => setOpcoes(true)}
          >
            {rotulo}
          </Botao>
          {erro && (
            <p role="alert" style={styles.erro}>
              {erro}
            </p>
          )}
        </div>
      )}
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        onChange={escolherArquivo}
        style={{
          display: 'none',
        }}
      />
      <Sheet aberto={opcoes} onFechar={() => setOpcoes(false)} titulo="Foto de perfil">
        <div style={styles.coluna}>
          <Botao
            variante="primario"
            grande
            cheio
            icone={Camera}
            onClick={() => {
              setOpcoes(false)
              setCamera(true)
            }}
          >
            Tirar uma selfie
          </Botao>
          <Botao variante="fantasma" grande cheio icone={ImagePlus} onClick={() => galeria.current?.click()}>
            Escolher da galeria
          </Botao>
          {temFoto && (
            <Botao variante="fantasma" grande cheio icone={Trash2} onClick={() => guardar(null)}>
              Remover foto
            </Botao>
          )}
        </div>
      </Sheet>
      <Sheet aberto={camera} onFechar={() => setCamera(false)} titulo="Selfie">
        {camera && (
          <CameraAoVivo
            simples={simples}
            frenteInicial
            onFoto={async f => {
              try {
                await guardar(await recortarQuadrado(f))
              } catch {
                setErro('Não consegui usar essa foto.')
              }
            }}
          />
        )}
      </Sheet>
    </>
  )
}
const styles = {
  coluna: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  erro: {
    fontSize: 14,
    color: 'var(--erro)',
    fontWeight: 600,
  },
}
