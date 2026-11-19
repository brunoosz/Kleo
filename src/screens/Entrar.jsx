import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Mail,
  LockKeyhole,
  User,
  AtSign,
  UserRound,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  WifiOff,
  Check,
} from 'lucide-react'
import LogoKleo from '../components/LogoKleo'
import { Botao, Campo } from '../components/ui'
import useModoSimples from '../hooks/useModoSimples'
import { normalizarUsuario, validarUsuario, sugerirUsuario } from '../lib/rede/util'
import {
  contasDisponiveis,
  entrarComEmail,
  criarContaEmail,
  entrarComoConvidado,
  recuperarSenha,
  trocarSenha,
  retornoDoEmail,
  precisaCriarSenha,
  destinoDepoisDeEntrar,
  mensagemConta,
  usuarioLivre,
  SENHA_MINIMA,
} from '../lib/conta'
import { perfilCompleto } from '../lib/perfil'
const MODOS = {
  entrar: {
    titulo: 'Bem-vindo de volta',
    sub: 'Entre com seu e-mail e senha.',
  },
  criar: {
    titulo: 'Criar conta',
    sub: 'Leva um minuto. Seu @ é como as pessoas te encontram.',
  },
  recuperar: {
    titulo: 'Esqueci a senha',
    sub: 'Mandamos um link para o seu e-mail.',
  },
  novaSenha: {
    titulo: 'Crie uma senha nova',
    sub: `Pelo menos ${SENHA_MINIMA} letras ou números.`,
  },
}
export default function Entrar() {
  const navigate = useNavigate()
  const location = useLocation()
  const simples = useModoSimples()
  const temServidor = contasDisponiveis()
  const [modo, setModo] = useState(() => (precisaCriarSenha() ? 'novaSenha' : 'entrar'))
  const [dados, setDados] = useState({
    nome: '',
    usuario: '',
    email: '',
    senha: '',
    senha2: '',
  })
  const [usuarioMexido, setUsuarioMexido] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [ocupado, setOcupado] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const set = (k, v) =>
    setDados(d => ({
      ...d,
      [k]: v,
    }))
  const seguir = () => {
    const de = location.state?.de
    const destino =
      typeof de === 'string' && de.startsWith('/') && !de.startsWith('/entrar') && perfilCompleto()
        ? de
        : destinoDepoisDeEntrar()
    navigate(destino, {
      replace: true,
    })
  }
  useEffect(() => {
    let vivo = true
    retornoDoEmail()
      .then(r => {
        if (!vivo || !r) return
        if (r.erro) {
          setErro(
            mensagemConta({
              codigo: r.erro,
            }),
          )
          return
        }
        if (r.tipo === 'recovery' || precisaCriarSenha()) {
          setModo('novaSenha')
          return
        }
        setAviso('E-mail confirmado. Você já está dentro.')
        setTimeout(() => {
          if (vivo) seguir()
        }, 900)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const mudarNome = nome =>
    setDados(d => ({
      ...d,
      nome,
      usuario: usuarioMexido ? d.usuario : nome.trim() ? sugerirUsuario(nome) : '',
    }))
  const trocarModo = m => {
    setModo(m)
    setErro('')
    setAviso('')
  }
  async function rodar(fn) {
    setErro('')
    setAviso('')
    setOcupado('form')
    try {
      await fn()
    } catch (e) {
      setErro(mensagemConta(e))
    } finally {
      setOcupado('')
    }
  }
  const aoEnviar = e => {
    e.preventDefault()
    if (ocupado) return
    if (modo === 'entrar')
      return rodar(async () => {
        await entrarComEmail(dados.email, dados.senha)
        seguir()
      })
    if (modo === 'criar')
      return rodar(async () => {
        const u = normalizarUsuario(dados.usuario)
        const problema = validarUsuario(u)
        if (problema) {
          setErro(problema)
          return
        }
        if (!(await usuarioLivre(u)))
          throw {
            codigo: 'USUARIO_EM_USO',
          }
        const r = await criarContaEmail({
          nome: dados.nome,
          email: dados.email,
          senha: dados.senha,
          usuario: u,
        })
        if (r.confirmar)
          setAviso(
            `Quase lá! Abra o e-mail que mandamos para ${r.email} e toque no link para confirmar. Depois entre aqui.`,
          )
        else seguir()
      })
    if (modo === 'recuperar')
      return rodar(async () => {
        await recuperarSenha(dados.email)
        setAviso(
          `Se existir uma conta com ${dados.email.trim()}, o link para criar a senha nova chega em instantes.`,
        )
      })
    if (modo === 'novaSenha')
      return rodar(async () => {
        if (dados.senha !== dados.senha2) {
          setErro('As duas senhas precisam ser iguais.')
          return
        }
        await trocarSenha(null, dados.senha)
        setAviso('Senha criada.')
        setTimeout(seguir, 600)
      })
  }
  async function convidado() {
    if (ocupado) return
    setErro('')
    setAviso('')
    setOcupado('convidado')
    try {
      const s = await entrarComoConvidado()
      if (s?.aviso && s.aviso !== 'SEM_SERVIDOR')
        setAviso(
          'Entrou como convidado só neste aparelho. ' +
            mensagemConta({
              codigo: s.aviso,
            }),
        )
      seguir()
    } catch (e) {
      setErro(mensagemConta(e))
    } finally {
      setOcupado('')
    }
  }
  const textos = MODOS[modo]
  const tamanhoCampo = simples ? 18 : 16
  const olho = (
    <button
      type="button"
      className="tap"
      onClick={() => setVerSenha(v => !v)}
      style={styles.olho}
      aria-label={verSenha ? 'Esconder a senha' : 'Mostrar a senha'}
    >
      {verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )
  return (
    <div style={styles.root}>
      <div style={styles.topo} className="anim-up">
        <LogoKleo tamanho={simples ? 52 : 46} slogan animado />
      </div>

      <main style={styles.cartao} className="kleo-card anim-up">
        {modo !== 'entrar' && (
          <button
            type="button"
            className="tap"
            onClick={() => trocarModo(modo === 'novaSenha' ? 'entrar' : 'entrar')}
            style={styles.voltar}
          >
            <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" /> Voltar
          </button>
        )}
        <h1
          style={{
            ...styles.titulo,
            fontSize: simples ? 30 : 28,
          }}
        >
          {textos.titulo}
        </h1>
        {temServidor && (
          <p
            style={{
              ...styles.sub,
              fontSize: simples ? 18 : 16,
            }}
          >
            {textos.sub}
          </p>
        )}

        {!temServidor && (
          <div style={styles.caixaInfo} role="note">
            <WifiOff size={20} aria-hidden="true" />
            <span
              style={{
                fontSize: tamanhoCampo - 1,
              }}
            >
              Entre como convidado. Tudo fica salvo neste aparelho.
            </span>
          </div>
        )}

        {temServidor && (
          <form onSubmit={aoEnviar} style={styles.form} noValidate>
            {modo === 'criar' && (
              <>
                <Campo
                  rotulo="Seu nome"
                  icone={UserRound}
                  placeholder="Como quer ser chamado"
                  value={dados.nome}
                  onChange={e => mudarNome(e.target.value)}
                  autoComplete="name"
                  maxLength={60}
                  required
                />
                <Campo
                  rotulo="Seu @ (como as pessoas te encontram)"
                  icone={AtSign}
                  placeholder="maria.silva"
                  value={dados.usuario}
                  onChange={e => {
                    setUsuarioMexido(true)
                    set('usuario', normalizarUsuario(e.target.value))
                  }}
                  autoComplete="username"
                  maxLength={30}
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </>
            )}
            {modo !== 'novaSenha' && (
              <Campo
                rotulo="E-mail"
                icone={Mail}
                type="email"
                inputMode="email"
                placeholder="voce@exemplo.com"
                value={dados.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            )}
            {modo !== 'recuperar' && (
              <div
                style={{
                  position: 'relative',
                }}
              >
                <Campo
                  rotulo={modo === 'novaSenha' ? 'Senha nova' : 'Senha'}
                  icone={LockKeyhole}
                  type={verSenha ? 'text' : 'password'}
                  placeholder={modo === 'entrar' ? 'Sua senha' : `Pelo menos ${SENHA_MINIMA} caracteres`}
                  value={dados.senha}
                  onChange={e => set('senha', e.target.value)}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  style={{
                    paddingRight: 52,
                  }}
                  required
                  minLength={modo === 'entrar' ? undefined : SENHA_MINIMA}
                />
                {olho}
              </div>
            )}
            {modo === 'novaSenha' && (
              <Campo
                rotulo="Repita a senha nova"
                icone={LockKeyhole}
                type={verSenha ? 'text' : 'password'}
                value={dados.senha2}
                onChange={e => set('senha2', e.target.value)}
                autoComplete="new-password"
                required
              />
            )}

            {erro && (
              <p
                role="alert"
                style={{
                  ...styles.erro,
                  fontSize: tamanhoCampo - 1,
                }}
              >
                {erro}
              </p>
            )}
            {aviso && (
              <p
                role="status"
                style={{
                  ...styles.aviso,
                  fontSize: tamanhoCampo - 1,
                }}
              >
                <Check size={18} aria-hidden="true" /> {aviso}
              </p>
            )}

            <Botao
              type="submit"
              variante="primario"
              icone={ArrowRight}
              cheio
              grande={simples}
              carregando={ocupado === 'form'}
              disabled={!!ocupado}
            >
              {modo === 'entrar'
                ? 'Entrar'
                : modo === 'criar'
                  ? 'Criar minha conta'
                  : modo === 'recuperar'
                    ? 'Mandar o link'
                    : 'Salvar senha'}
            </Botao>

            {modo === 'entrar' && (
              <div style={styles.links}>
                <button
                  type="button"
                  className="tap"
                  style={{
                    ...styles.link,
                    fontSize: tamanhoCampo,
                  }}
                  onClick={() => trocarModo('criar')}
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  className="tap"
                  style={{
                    ...styles.link,
                    fontSize: tamanhoCampo,
                  }}
                  onClick={() => trocarModo('recuperar')}
                >
                  Esqueci a senha
                </button>
              </div>
            )}
            {modo === 'criar' && (
              <button
                type="button"
                className="tap"
                style={{
                  ...styles.link,
                  fontSize: tamanhoCampo,
                  alignSelf: 'center',
                }}
                onClick={() => trocarModo('entrar')}
              >
                Já tenho conta
              </button>
            )}
          </form>
        )}

        {!temServidor && erro && (
          <p
            role="alert"
            style={{
              ...styles.erro,
              fontSize: tamanhoCampo - 1,
            }}
          >
            {erro}
          </p>
        )}
        {!temServidor && aviso && (
          <p
            role="status"
            style={{
              ...styles.aviso,
              fontSize: tamanhoCampo - 1,
            }}
          >
            {aviso}
          </p>
        )}

        {modo !== 'novaSenha' && (
          <>
            {temServidor && (
              <div style={styles.ou}>
                <span>ou</span>
              </div>
            )}
            <Botao
              variante={temServidor ? 'fantasma' : 'primario'}
              icone={User}
              cheio
              grande={simples}
              onClick={convidado}
              carregando={ocupado === 'convidado'}
              disabled={!!ocupado}
              aria-label="Entrar como convidado"
            >
              Entrar como convidado
            </Botao>
            <p
              style={{
                ...styles.nota,
                fontSize: simples ? 15 : 13,
              }}
            >
              Dá para criar a conta depois, em Ajustes.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
const styles = {
  root: {
    minHeight: '100dvh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
    boxSizing: 'border-box',
  },
  topo: {
    padding: '20px 0 22px',
    display: 'flex',
    justifyContent: 'center',
  },
  cartao: {
    width: '100%',
    maxWidth: 440,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    boxShadow: 'var(--sombra)',
    padding: '24px 20px 22px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  voltar: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    background: 'none',
    border: 'none',
    padding: '4px 4px 4px 0',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--text-2)',
    cursor: 'pointer',
  },
  titulo: {
    margin: 0,
    fontWeight: 800,
    letterSpacing: -0.6,
    lineHeight: 1.1,
  },
  sub: {
    margin: '0 0 8px',
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  olho: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    border: 'none',
    background: 'var(--surface-2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#000',
  },
  links: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  link: {
    background: 'none',
    border: 'none',
    padding: '8px 2px',
    fontFamily: 'inherit',
    fontWeight: 700,
    color: '#000',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  erro: {
    margin: 0,
    color: 'var(--erro)',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  aviso: {
    margin: 0,
    color: 'var(--sucesso)',
    fontWeight: 600,
    lineHeight: 1.4,
    display: 'flex',
    gap: 6,
    alignItems: 'flex-start',
  },
  ou: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--text-3)',
    fontSize: 14,
    fontWeight: 600,
    margin: '4px 0',
  },
  nota: {
    margin: 0,
    color: 'var(--text-3)',
    lineHeight: 1.4,
    textAlign: 'center',
  },
  caixaInfo: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: 'var(--surface-2)',
    borderRadius: 18,
    padding: '12px 14px',
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
}
