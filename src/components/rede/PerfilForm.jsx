import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Trash2, AtSign, User, Check, X, LoaderCircle } from 'lucide-react'
import { Botao, Campo, Sheet } from '../ui'
import Avatar from '../Avatar'
import CameraAoVivo from '../CameraAoVivo'
import useModoSimples from '../../hooks/useModoSimples'
import { arquivoParaDataURL, recortarQuadrado } from '../../lib/imagem'
import {
  normalizarUsuario,
  validarUsuario,
  sugerirUsuario,
  usuarioDisponivel,
  criarConta,
  atualizarConta,
} from '../../lib/rede'
export default function PerfilForm({ inicial = null, nomeSugerido = '', onPronto, textoBotao }) {
  const simples = useModoSimples()
  const editando = !!inicial
  const [nome, setNome] = useState(inicial?.nome || nomeSugerido || '')
  const [usuario, setUsuario] = useState(inicial?.usuario || sugerirUsuario(nomeSugerido || ''))
  const [mexeuUsuario, setMexeuUsuario] = useState(editando)
  const [foto, setFoto] = useState(inicial?.foto || null)
  const [livre, setLivre] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [opcoesFoto, setOpcoesFoto] = useState(false)
  const [camera, setCamera] = useState(false)
  const galeria = useRef(null)
  const problema = validarUsuario(usuario)
  const igualAoAtual = editando && usuario === inicial.usuario
  const mudarNome = v => {
    setNome(v)
    if (!mexeuUsuario) setUsuario(sugerirUsuario(v))
  }
  useEffect(() => {
    if (problema || igualAoAtual) return
    let vivo = true
    const t = setTimeout(() => {
      setLivre(null)
      usuarioDisponivel(usuario)
        .then(ok => {
          if (vivo) setLivre(ok)
        })
        .catch(() => {
          if (vivo) setLivre(true)
        })
    }, 450)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [usuario, problema, igualAoAtual])
  const escolherArquivo = async e => {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    try {
      setFoto(await recortarQuadrado(await arquivoParaDataURL(arq)))
    } catch {
      setErro('Não consegui abrir essa foto.')
    }
    setOpcoesFoto(false)
  }
  const disponivel = igualAoAtual || livre === true
  const pode = nome.trim().length >= 2 && !problema && disponivel && !salvando
  const salvar = async e => {
    e?.preventDefault()
    if (!pode) return
    setSalvando(true)
    setErro('')
    try {
      const dados = {
        nome: nome.trim(),
        usuario,
        foto,
      }
      const conta = editando ? await atualizarConta(dados) : await criarConta(dados)
      onPronto?.(conta)
    } catch (err) {
      const m = String(err?.message || '')
      setErro(
        m === 'USUARIO_EM_USO'
          ? 'Esse @ acabou de ser usado. Escolha outro.'
          : m === 'ANONIMO_DESLIGADO'
            ? 'Conversas indisponíveis no momento.'
            : m === 'BANCO_SEM_TABELAS'
              ? 'Conversas indisponíveis no momento.'
              : m === 'SEM_PERMISSAO'
                ? 'Conversas indisponíveis no momento.'
                : m === 'CHAVE_INVALIDA'
                  ? 'Conversas indisponíveis no momento.'
                  : 'Não consegui salvar agora. Confira a internet e tente de novo.',
      )
    }
    setSalvando(false)
  }
  return (
    <form onSubmit={salvar} style={styles.form}>
      <div style={styles.fotoArea}>
        <button
          type="button"
          className="tap"
          onClick={() => setOpcoesFoto(true)}
          style={styles.fotoBotao}
          aria-label={foto ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
        >
          <Avatar nome={nome || 'Você'} foto={foto} chave={usuario} tamanho={simples ? 120 : 108} />
          <span style={styles.fotoSelo}>
            <Camera size={18} color="#fff" aria-hidden="true" />
          </span>
        </button>
        <span style={styles.fotoTexto}>{foto ? 'Toque para trocar a foto' : 'Foto (opcional)'}</span>
      </div>
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        onChange={escolherArquivo}
        style={{
          display: 'none',
        }}
      />

      <Campo
        rotulo="Seu nome"
        icone={User}
        placeholder="Como as pessoas te conhecem"
        value={nome}
        onChange={e => mudarNome(e.target.value)}
        maxLength={40}
        autoComplete="name"
      />

      <div>
        <Campo
          rotulo="Seu @ de usuário"
          icone={AtSign}
          placeholder="ex: maria.silva"
          value={usuario}
          onChange={e => {
            setMexeuUsuario(true)
            setUsuario(normalizarUsuario(e.target.value))
          }}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
        />
        <p
          style={{
            ...styles.status,
            color: problema
              ? 'var(--erro)'
              : disponivel
                ? 'var(--sucesso)'
                : livre === false
                  ? 'var(--erro)'
                  : 'var(--text-3)',
          }}
          aria-live="polite"
        >
          {usuario &&
            (problema ? (
              <>
                <X size={15} aria-hidden="true" /> {problema}
              </>
            ) : igualAoAtual ? (
              <>
                <Check size={15} aria-hidden="true" /> Seu @ atual
              </>
            ) : livre === null ? (
              <>
                <LoaderCircle size={15} className="girar" aria-hidden="true" /> Verificando...
              </>
            ) : livre ? (
              <>
                <Check size={15} aria-hidden="true" /> @{usuario} está livre
              </>
            ) : (
              <>
                <X size={15} aria-hidden="true" /> @{usuario} já tem dono. Tente outro.
              </>
            ))}
        </p>
        {!simples && <p style={styles.ajuda}>É assim que sua família e amigos vão te encontrar.</p>}
      </div>

      {erro && (
        <p role="alert" style={styles.erro}>
          {erro}
        </p>
      )}

      <Botao type="submit" variante="primario" grande cheio carregando={salvando} disabled={!pode}>
        {textoBotao || (editando ? 'Salvar perfil' : 'Criar meu perfil')}
      </Botao>

      <Sheet aberto={opcoesFoto} onFechar={() => setOpcoesFoto(false)} titulo="Foto de perfil">
        <div style={styles.opcoes}>
          <Botao
            variante="primario"
            grande
            cheio
            icone={Camera}
            onClick={() => {
              setOpcoesFoto(false)
              setCamera(true)
            }}
          >
            Tirar uma selfie
          </Botao>
          <Botao variante="fantasma" grande cheio icone={ImagePlus} onClick={() => galeria.current?.click()}>
            Escolher da galeria
          </Botao>
          {foto && (
            <Botao
              variante="fantasma"
              grande
              cheio
              icone={Trash2}
              onClick={() => {
                setFoto(null)
                setOpcoesFoto(false)
              }}
            >
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
              setFoto(await recortarQuadrado(f))
              setCamera(false)
            }}
          />
        )}
      </Sheet>
    </form>
  )
}
const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fotoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  fotoBotao: {
    position: 'relative',
    borderRadius: '50%',
    background: 'transparent',
    padding: 0,
  },
  fotoSelo: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid var(--surface)',
  },
  fotoTexto: {
    fontSize: 14,
    color: 'var(--text-2)',
    fontWeight: 600,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    marginTop: 8,
    minHeight: 20,
  },
  ajuda: {
    fontSize: 14,
    color: 'var(--text-3)',
    marginTop: 4,
  },
  erro: {
    fontSize: 15,
    color: 'var(--erro)',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  opcoes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 8,
  },
}
