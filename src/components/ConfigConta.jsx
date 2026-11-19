import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserRound,
  LogIn,
  LogOut,
  Mail,
  LockKeyhole,
  Trash2,
  Crown,
  Cloud,
  CloudOff,
  Save,
} from 'lucide-react'
import { ConfigGrupo, ConfigLinha } from './ConfigGrupo'
import { Sheet, Modal, Botao, Campo } from './ui'
import FotoPerfil from './rede/FotoPerfil'
import useConta from '../hooks/useConta'
import useStorage from '../hooks/useStorage'
import useModoSimples from '../hooks/useModoSimples'
import {
  contasDisponiveis,
  sair,
  excluirConta,
  trocarSenha,
  converterConvidado,
  precisaCriarSenha,
  mensagemConta,
  SENHA_MINIMA,
} from '../lib/conta'
export default function ConfigConta({ avisar = () => {}, destaque = false }) {
  const navigate = useNavigate()
  const simples = useModoSimples()
  const c = useConta()
  const [contaRede] = useStorage('kleo_rede_conta', null)
  const [sheet, setSheet] = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [form, setForm] = useState({
    email: '',
    atual: '',
    senha: '',
    senha2: '',
  })
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const set = (k, v) =>
    setForm(f => ({
      ...f,
      [k]: v,
    }))
  const abrir = qual => {
    setForm({
      email: '',
      atual: '',
      senha: '',
      senha2: '',
    })
    setErro('')
    setSheet(qual)
  }
  const semSenha = precisaCriarSenha()
  async function rodar(fn, depois) {
    setErro('')
    setOcupado(true)
    try {
      await fn()
      depois?.()
    } catch (e) {
      setErro(mensagemConta(e))
    } finally {
      setOcupado(false)
    }
  }
  const converter = e => {
    e.preventDefault()
    if (form.senha !== form.senha2) {
      setErro('As duas senhas precisam ser iguais.')
      return
    }
    rodar(
      async () => {
        const r = await converterConvidado({
          email: form.email,
          senha: form.senha,
        })
        avisar(
          r.confirmar
            ? 'Abra o e-mail que mandamos e toque no link para terminar.'
            : 'Pronto! Agora você tem uma conta.',
        )
      },
      () => setSheet(null),
    )
  }
  const mudarSenha = e => {
    e.preventDefault()
    if (form.senha !== form.senha2) {
      setErro('As duas senhas precisam ser iguais.')
      return
    }
    rodar(
      async () => {
        await trocarSenha(semSenha ? null : form.atual, form.senha)
        avisar('Senha salva')
      },
      () => setSheet(null),
    )
  }
  const sairAgora = () =>
    rodar(
      async () => {
        await sair()
        navigate('/entrar', {
          replace: true,
        })
      },
      () => setConfirmar(null),
    )
  const excluirAgora = () =>
    rodar(
      async () => {
        await excluirConta()
        navigate('/entrar', {
          replace: true,
        })
      },
      () => setConfirmar(null),
    )
  const quem = c.ehLocal
    ? 'Convidado neste aparelho'
    : c.ehConvidado
      ? 'Convidado'
      : c.email || 'Conta com e-mail'
  const estado = c.carregando
    ? 'Conferindo...'
    : c.ehLocal
      ? 'Só neste aparelho'
      : c.ehDono
        ? 'Dono do app'
        : c.ehConvidado
          ? 'Sem e-mail'
          : 'Conta sincronizada'
  const temServidor = contasDisponiveis()
  return (
    <>
      <ConfigGrupo id="conta" titulo="Conta" destaque={destaque}>
        <ConfigLinha
          icone={c.ehDono ? Crown : UserRound}
          cor={c.ehDono ? 'lima' : 'lavanda'}
          titulo={quem}
          detalhe={estado}
          semChevron
          direita={
            c.ehConta ? (
              <Cloud size={20} aria-hidden="true" />
            ) : (
              <CloudOff size={20} color="var(--text-3)" aria-hidden="true" />
            )
          }
        />
        {contaRede && <FotoPerfil conta={contaRede} variante="linha" />}
        {!c.logado && (
          <ConfigLinha
            icone={LogIn}
            cor="lima"
            titulo="Entrar ou criar conta"
            onClick={() => navigate('/entrar')}
          />
        )}
        {c.logado && c.ehLocal && temServidor && (
          <ConfigLinha
            icone={LogIn}
            cor="lima"
            titulo="Entrar ou criar conta"
            detalhe="Com e-mail e senha"
            onClick={() => navigate('/entrar')}
          />
        )}
        {c.logado && c.ehConvidado && (
          <ConfigLinha
            icone={Mail}
            cor="lima"
            titulo="Transformar em conta"
            detalhe="Mantém seu @, contatos e conversas"
            onClick={() => abrir('converter')}
          />
        )}
        {c.logado && c.ehConta && (
          <ConfigLinha
            icone={LockKeyhole}
            cor="ceu"
            titulo={semSenha ? 'Criar senha' : 'Trocar senha'}
            detalhe={semSenha ? 'Sua conta ainda não tem senha' : undefined}
            onClick={() => abrir('senha')}
          />
        )}
        {c.logado && (
          <ConfigLinha icone={LogOut} cor="mist" titulo="Sair" onClick={() => setConfirmar('sair')} />
        )}
        {c.logado && !c.ehLocal && (
          <ConfigLinha
            icone={Trash2}
            destrutivo
            titulo="Excluir conta"
            detalhe="Apaga seu @, contatos e conversas"
            onClick={() => setConfirmar('excluir')}
            ultima
          />
        )}
      </ConfigGrupo>

      <Sheet aberto={sheet === 'converter'} onFechar={() => setSheet(null)} titulo="Transformar em conta">
        <form onSubmit={converter} style={styles.form}>
          <p
            style={{
              ...styles.texto,
              fontSize: simples ? 17 : 15,
            }}
          >
            Seu @, seus contatos e suas conversas continuam os mesmos.
          </p>
          <Campo
            rotulo="E-mail"
            icone={Mail}
            type="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            autoComplete="email"
            required
          />
          <Campo
            rotulo="Senha"
            icone={LockKeyhole}
            type="password"
            placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
            value={form.senha}
            onChange={e => set('senha', e.target.value)}
            autoComplete="new-password"
            required
          />
          <Campo
            rotulo="Repita a senha"
            icone={LockKeyhole}
            type="password"
            value={form.senha2}
            onChange={e => set('senha2', e.target.value)}
            autoComplete="new-password"
            required
          />
          {erro && (
            <p role="alert" style={styles.erro}>
              {erro}
            </p>
          )}
          <Botao type="submit" variante="primario" icone={Save} cheio grande={simples} carregando={ocupado}>
            Criar minha conta
          </Botao>
        </form>
      </Sheet>

      <Sheet
        aberto={sheet === 'senha'}
        onFechar={() => setSheet(null)}
        titulo={semSenha ? 'Criar senha' : 'Trocar senha'}
      >
        <form onSubmit={mudarSenha} style={styles.form}>
          {!semSenha && (
            <Campo
              rotulo="Senha atual"
              icone={LockKeyhole}
              type="password"
              value={form.atual}
              onChange={e => set('atual', e.target.value)}
              autoComplete="current-password"
              required
            />
          )}
          <Campo
            rotulo="Senha nova"
            icone={LockKeyhole}
            type="password"
            placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
            value={form.senha}
            onChange={e => set('senha', e.target.value)}
            autoComplete="new-password"
            required
          />
          <Campo
            rotulo="Repita a senha nova"
            icone={LockKeyhole}
            type="password"
            value={form.senha2}
            onChange={e => set('senha2', e.target.value)}
            autoComplete="new-password"
            required
          />
          {erro && (
            <p role="alert" style={styles.erro}>
              {erro}
            </p>
          )}
          <Botao type="submit" variante="primario" icone={Save} cheio grande={simples} carregando={ocupado}>
            Salvar senha
          </Botao>
        </form>
      </Sheet>

      <Modal
        aberto={confirmar === 'sair'}
        onFechar={() => setConfirmar(null)}
        titulo="Sair da conta?"
        texto={
          c.ehConvidado
            ? 'Você entrou como convidado. Ao sair, seu @ e suas conversas não voltam. Crie uma conta antes para guardar tudo.'
            : 'Sua agenda, notas e perfil continuam neste aparelho. Para as Conversas, é só entrar de novo.'
        }
        acoes={[
          {
            label: 'Ficar',
            onClick: () => setConfirmar(null),
          },
          ...(c.ehConvidado
            ? [
                {
                  label: 'Criar conta',
                  variante: 'primario',
                  onClick: () => {
                    setConfirmar(null)
                    setSheet('converter')
                  },
                },
              ]
            : []),
          {
            label: 'Sair',
            variante: 'primario',
            onClick: sairAgora,
          },
        ]}
      />
      <Modal
        aberto={confirmar === 'excluir'}
        onFechar={() => setConfirmar(null)}
        titulo="Excluir a conta?"
        texto="Apaga seu @, contatos e avisos. Não tem volta."
        acoes={[
          {
            label: 'Cancelar',
            onClick: () => setConfirmar(null),
          },
          {
            label: 'Excluir',
            variante: 'perigo',
            onClick: excluirAgora,
          },
        ]}
      >
        {erro && (
          <p role="alert" style={styles.erro}>
            {erro}
          </p>
        )}
      </Modal>
    </>
  )
}
const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '4px 0 8px',
  },
  texto: {
    margin: 0,
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  erro: {
    margin: 0,
    color: 'var(--erro)',
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.4,
  },
}
