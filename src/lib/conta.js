import { ler, salvar, remover } from './storage'
import {
  configSupabase,
  clienteSupabase,
  limparCaches,
  contaCache,
  normalizarUsuario,
  validarUsuario,
  modoRede,
  minhaConta,
} from './rede'
import { urlApi, API_BASE } from './api'
import { ehAppNativo } from './plataforma'
import { desativarPush } from './push'
import { perfilCompleto, perfilParaServidor, perfilDoServidor } from './perfil'
const CHAVE_LOCAL = 'kleo_conta_local'
const CHAVE_SESSAO = 'kleo_conta_sessao'
const CHAVE_FOTO = 'kleo_conta_foto_pendente'
const CHAVE_SEM_SENHA = 'kleo_conta_sem_senha'
export const SENHA_MINIMA = 6
const esperar = ms => new Promise(r => setTimeout(r, ms))
export const contasDisponiveis = () => !!configSupabase()
export const limparEmail = e =>
  String(e || '')
    .trim()
    .toLowerCase()
export const emailValido = e =>
  /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(limparEmail(e)) && limparEmail(e).length <= 254
function erro(codigo, extra = {}) {
  const e = new Error(codigo)
  e.codigo = codigo
  return Object.assign(e, extra)
}
function erroConta(error) {
  if (!error) return null
  if (error.codigo) return error
  const msg = String(error.message || error.msg || error.error_description || '')
  const cod = String(error.code || error.error_code || '')
  const st = Number(error.status) || 0
  const tem = (...lista) => lista.includes(cod)
  let codigo = 'ERRO_CONTA'
  if (
    error.name === 'AuthRetryableFetchError' ||
    /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg)
  )
    codigo = 'SEM_INTERNET'
  else if (tem('invalid_credentials') || /invalid login credentials/i.test(msg))
    codigo = 'CREDENCIAIS_INVALIDAS'
  else if (tem('email_not_confirmed') || /email not confirmed/i.test(msg)) codigo = 'EMAIL_NAO_CONFIRMADO'
  else if (tem('user_already_exists', 'email_exists') || /already (been )?registered/i.test(msg))
    codigo = 'EMAIL_EM_USO'
  else if (tem('weak_password') || /password should|password is too/i.test(msg)) codigo = 'SENHA_FRACA'
  else if (tem('same_password') || /different from the old/i.test(msg)) codigo = 'SENHA_IGUAL'
  else if (
    tem('email_address_invalid', 'email_address_not_authorized') ||
    /invalid format|is invalid|unable to validate email/i.test(msg)
  )
    codigo = 'EMAIL_INVALIDO'
  else if (tem('email_provider_disabled') || /email (signups|logins) are disabled/i.test(msg))
    codigo = 'EMAIL_DESLIGADO'
  else if (tem('signup_disabled') || /signups? not allowed/i.test(msg)) codigo = 'CADASTRO_DESLIGADO'
  else if (tem('anonymous_provider_disabled') || /anonymous sign-ins are disabled/i.test(msg))
    codigo = 'ANONIMO_DESLIGADO'
  else if (
    tem('over_request_rate_limit', 'over_email_send_rate_limit') ||
    st === 429 ||
    /rate limit|too many/i.test(msg)
  )
    codigo = 'MUITAS_TENTATIVAS'
  else if (tem('reauthentication_needed', 'reauthentication_not_valid')) codigo = 'REAUTENTICAR'
  else if (
    tem('session_not_found', 'bad_jwt', 'no_authorization', 'refresh_token_not_found') ||
    error.name === 'AuthSessionMissingError' ||
    /session (missing|not found)|jwt expired/i.test(msg)
  )
    codigo = 'SESSAO_EXPIRADA'
  else if (/invalid api key|no api key/i.test(msg)) codigo = 'CHAVE_INVALIDA'
  else if (st >= 500 || /database error/i.test(msg)) codigo = 'ERRO_SERVIDOR'
  return erro(codigo, {
    status: st,
    cause: error,
  })
}
const CODIGOS_BANCO = [
  'SOMENTE_DONO',
  'CHAVE_REPETIDA',
  'SERVICO_INVALIDO',
  'VALOR_INVALIDO',
  'CHAVE_NAO_ENCONTRADA',
  'NAO_ENTROU',
  'PREFERENCIAS_INVALIDAS',
]
function erroBanco(error) {
  if (error?.codigo) return error
  const msg = String(error?.message || '')
  const cod = String(error?.code || '')
  const conhecido = CODIGOS_BANCO.find(c => msg.includes(c))
  if (conhecido) return erro(conhecido)
  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg))
    return erro('SEM_INTERNET')
  if (cod === 'PGRST202' || cod === '42883' || /could not find the function|schema cache/i.test(msg))
    return erro('BANCO_DESATUALIZADO')
  if (cod === 'PGRST303' || /jwt expired/i.test(msg)) return erro('SESSAO_EXPIRADA')
  if (cod === '42501' || /permission denied/i.test(msg)) return erro('SEM_PERMISSAO')
  return erro('ERRO_SERVIDOR', {
    cause: error,
  })
}
const MENSAGENS = {
  SEM_SERVIDOR: 'Contas com e-mail indisponíveis. Entre como convidado.',
  SEM_INTERNET: 'Sem internet agora. Confira o Wi-Fi ou os dados móveis e tente de novo.',
  CREDENCIAIS_INVALIDAS: 'E-mail ou senha não conferem. Confira e tente de novo.',
  EMAIL_NAO_CONFIRMADO:
    'Falta confirmar o e-mail. Abra a mensagem que enviamos, toque no link e depois entre de novo.',
  EMAIL_EM_USO: 'Já existe uma conta com esse e-mail. Toque em "Entrar" ou em "Esqueci a senha".',
  SENHA_FRACA: `A senha precisa ter pelo menos ${SENHA_MINIMA} letras ou números.`,
  SENHA_IGUAL: 'A nova senha precisa ser diferente da atual.',
  SENHA_ATUAL_ERRADA: 'A senha atual não confere.',
  EMAIL_INVALIDO: 'Esse e-mail não parece certo. Confira se tem o @ e o ponto (exemplo: maria@gmail.com).',
  EMAIL_DESLIGADO: 'Entrada com e-mail indisponível. Entre como convidado por enquanto.',
  CADASTRO_DESLIGADO: 'Contas novas indisponíveis. Entre como convidado por enquanto.',
  ANONIMO_DESLIGADO: 'Entrada como convidado indisponível. Crie uma conta com e-mail.',
  MUITAS_TENTATIVAS: 'Muitas tentativas seguidas. Espere um minuto e tente de novo.',
  REAUTENTICAR: 'Por segurança, saia e entre de novo antes de trocar a senha.',
  SESSAO_EXPIRADA: 'Sua entrada expirou. Entre de novo.',
  CHAVE_INVALIDA: 'Contas indisponíveis no momento. Tente mais tarde.',
  USUARIO_EM_USO: 'Esse @ já tem dono. Escolha outro.',
  USUARIO_INVALIDO: 'Escolha um @ com pelo menos 3 letras ou números.',
  NOME_CURTO: 'Escreva seu nome (pelo menos 2 letras).',
  CONVIDADO: 'Convidado não tem senha. Transforme o convidado em conta para criar uma.',
  JA_TEM_CONTA: 'Você já está numa conta com e-mail.',
  NAO_ENTROU: 'Entre na sua conta primeiro.',
  SEM_PERMISSAO: 'Não deu certo. Entre de novo e tente outra vez.',
  SOMENTE_DONO: 'Só o dono do app pode mexer nas chaves.',
  CHAVE_REPETIDA: 'Essa chave já está no cofre.',
  SERVICO_INVALIDO:
    'O banco ainda não aceita esse serviço. Rode o supabase.sql novo no SQL Editor e tente de novo.',
  VALOR_INVALIDO: 'Essa chave parece incompleta. Copie de novo, inteira.',
  CHAVE_NAO_ENCONTRADA: 'Essa chave não está mais no cofre.',
  BANCO_DESATUALIZADO:
    'O banco precisa ser atualizado: rode o arquivo supabase.sql de novo no SQL Editor do Supabase.',
  ERRO_SERVIDOR: 'Indisponível no momento. Tente de novo em instantes.',
  LINK_EXPIRADO: 'O link do e-mail expirou ou já foi usado. Peça outro.',
  LINK_INVALIDO: 'Esse link do e-mail não funcionou. Peça outro.',
}
export function mensagemConta(e) {
  const c = e?.codigo || e?.message
  return MENSAGENS[c] || 'Não deu certo agora. Tente de novo.'
}
async function cliente() {
  if (!contasDisponiveis()) throw erro('SEM_SERVIDOR')
  const sb = await clienteSupabase()
  if (!sb) throw erro('SEM_SERVIDOR')
  return sb
}
function enderecoDoApp() {
  try {
    if (ehAppNativo()) return API_BASE || ''
    if (/^https?:$/.test(location.protocol)) return location.origin
  } catch {}
  return API_BASE || ''
}
const voltarPara = rota => (enderecoDoApp() ? `${enderecoDoApp()}${rota}` : undefined)
let retorno = null
let processandoRetorno = null
;(function lerRetornoDaUrl() {
  if (typeof window === 'undefined' || typeof location === 'undefined') return
  try {
    const hash = new URLSearchParams(String(location.hash || '').replace(/^#/, ''))
    const busca = new URLSearchParams(location.search)
    const tipo = hash.get('type') || busca.get('type') || ''
    const acesso = hash.get('access_token')
    const renovar = hash.get('refresh_token')
    const falha =
      hash.get('error_code') ||
      busca.get('error_code') ||
      (hash.get('error_description') || busca.get('error_description')
        ? hash.get('error') || busca.get('error') || 'erro'
        : '')
    if (acesso && renovar)
      retorno = {
        acesso,
        renovar,
        tipo,
      }
    else if (falha)
      retorno = {
        tipo,
        erro: /expired|otp/i.test(falha) ? 'LINK_EXPIRADO' : 'LINK_INVALIDO',
      }
    else return
    history.replaceState(history.state, '', location.pathname + (falha ? '' : location.search))
  } catch {}
})()
async function processarRetorno(sb) {
  if (!retorno) return null
  if (!processandoRetorno) {
    processandoRetorno = (async () => {
      if (retorno.erro)
        return {
          tipo: retorno.tipo,
          erro: retorno.erro,
        }
      const { error } = await sb.auth.setSession({
        access_token: retorno.acesso,
        refresh_token: retorno.renovar,
      })
      if (error)
        return {
          tipo: retorno.tipo,
          erro: erroConta(error).codigo === 'SEM_INTERNET' ? 'SEM_INTERNET' : 'LINK_EXPIRADO',
        }
      remover(CHAVE_LOCAL)
      return {
        tipo: retorno.tipo,
        erro: null,
      }
    })().catch(() => ({
      tipo: retorno?.tipo || '',
      erro: 'LINK_INVALIDO',
    }))
  }
  return processandoRetorno
}
export async function retornoDoEmail() {
  if (!retorno) return null
  if (!contasDisponiveis())
    return {
      tipo: retorno.tipo,
      erro: 'SEM_SERVIDOR',
    }
  try {
    return await processarRetorno(await cliente())
  } catch (e) {
    return {
      tipo: retorno.tipo,
      erro: e.codigo || 'LINK_INVALIDO',
    }
  }
}
const resumoDe = user => ({
  logado: true,
  tipo: user.is_anonymous ? 'convidado' : 'conta',
  email: user.is_anonymous ? null : user.email || null,
  uid: user.id,
  supabase: true,
})
function resumoLocal() {
  const local = !!ler(CHAVE_LOCAL, null)
  return {
    logado: local,
    tipo: local ? 'local' : null,
    email: null,
    uid: null,
    supabase: contasDisponiveis(),
  }
}
function resumoGuardado() {
  const c = ler(CHAVE_SESSAO, null)
  if (c?.uid && (c.tipo === 'conta' || c.tipo === 'convidado')) {
    return {
      logado: true,
      tipo: c.tipo,
      email: c.email || null,
      uid: c.uid,
      supabase: true,
      semInternet: true,
    }
  }
  return resumoLocal()
}
export async function sessaoAtual() {
  if (!contasDisponiveis()) return resumoLocal()
  let sb
  try {
    sb = await cliente()
  } catch {
    return resumoGuardado()
  }
  await processarRetorno(sb).catch(() => null)
  let resposta
  try {
    resposta = await sb.auth.getSession()
  } catch (e) {
    resposta = {
      data: {},
      error: e,
    }
  }
  const { data, error } = resposta
  if (data?.session?.user) return resumoDe(data.session.user)
  if (error && erroConta(error).codigo === 'SEM_INTERNET') return resumoGuardado()
  return resumoLocal()
}
const papeis = new Map()
async function papelDe(s, { forcar = false } = {}) {
  if (!s?.logado || !s.supabase || s.tipo === 'local' || !s.uid) return 'local'
  if (s.tipo === 'convidado') return 'convidado'
  if (!forcar && papeis.has(s.uid)) return papeis.get(s.uid)
  try {
    const sb = await cliente()
    const { data, error } = await sb.rpc('meu_papel')
    if (error) throw error
    const papel = ['dono', 'usuario', 'convidado'].includes(data) ? data : 'usuario'
    papeis.set(s.uid, papel)
    return papel
  } catch {
    const c = ler(CHAVE_SESSAO, null)
    return c?.uid === s.uid && c.papel ? c.papel : 'usuario'
  }
}
export async function meuPapel({ forcar = false } = {}) {
  return papelDe(await sessaoAtual(), {
    forcar,
  })
}
function estadoInicial() {
  const c = ler(CHAVE_SESSAO, null)
  if (contasDisponiveis() && c?.uid && (c.tipo === 'conta' || c.tipo === 'convidado')) {
    return {
      carregando: true,
      logado: true,
      tipo: c.tipo,
      email: c.email || null,
      uid: c.uid,
      supabase: true,
      papel: c.papel || null,
    }
  }
  return {
    carregando: true,
    ...resumoLocal(),
    papel: ler(CHAVE_LOCAL, null) ? 'local' : null,
  }
}
let estado = estadoInicial()
const ouvintes = new Set()
function definir(novo) {
  estado = {
    ...estado,
    ...novo,
  }
  ouvintes.forEach(fn => {
    try {
      fn()
    } catch {}
  })
}
export const estadoConta = () => estado
function guardarSessao(s, papel) {
  if (s.semInternet) return
  if (s.logado && s.supabase && (s.tipo === 'conta' || s.tipo === 'convidado')) {
    const novo = {
      tipo: s.tipo,
      email: s.email,
      uid: s.uid,
      papel,
    }
    if (JSON.stringify(ler(CHAVE_SESSAO, null)) !== JSON.stringify(novo)) salvar(CHAVE_SESSAO, novo)
  } else if (ler(CHAVE_SESSAO, null)) {
    remover(CHAVE_SESSAO)
  }
}
let geracao = 0
async function atualizar({ forcarPapel = false } = {}) {
  const minha = ++geracao
  try {
    await garantirOuvinte()
    const s = await sessaoAtual()
    const papel = s.logado
      ? await papelDe(s, {
          forcar: forcarPapel,
        })
      : null
    if (minha !== geracao) return
    guardarSessao(s, papel)
    definir({
      carregando: false,
      ...s,
      papel,
    })
  } catch {
    if (minha === geracao)
      definir({
        carregando: false,
      })
  }
}
let clienteOuvido = null
let pararOuvinte = null
async function garantirOuvinte() {
  if (!contasDisponiveis()) return
  const sb = await clienteSupabase().catch(() => null)
  if (!sb || sb === clienteOuvido) return
  pararOuvinte?.()
  clienteOuvido = sb
  const { data } = sb.auth.onAuthStateChange(evento => {
    if (evento === 'INITIAL_SESSION') return
    setTimeout(
      () =>
        atualizar({
          forcarPapel: evento === 'SIGNED_IN' || evento === 'USER_UPDATED',
        }),
      0,
    )
  })
  pararOuvinte = () => data.subscription.unsubscribe()
}
let ligado = false
function ligar() {
  if (ligado || typeof window === 'undefined') return
  ligado = true
  atualizar()
  window.addEventListener('kleo-storage', e => {
    if (e.detail === '*')
      atualizar({
        forcarPapel: true,
      })
  })
  window.addEventListener('storage', e => {
    if (e.key === null || e.key === CHAVE_LOCAL || /^sb-.+-auth-token$/.test(e.key || '')) atualizar()
  })
  window.addEventListener('kleo-perfil', agendarSincronia)
}
export function assinarConta(fn) {
  ouvintes.add(fn)
  ligar()
  return () => {
    ouvintes.delete(fn)
  }
}
const resumoDoEstado = () => ({
  logado: estado.logado,
  tipo: estado.tipo,
  email: estado.email,
  uid: estado.uid,
  supabase: estado.supabase,
})
export function ouvirSessao(cb) {
  let ultima = null
  const avisar = () => {
    if (estado.carregando) return
    const s = resumoDoEstado()
    const chave = JSON.stringify(s)
    if (chave === ultima) return
    ultima = chave
    cb(s)
  }
  const parar = assinarConta(avisar)
  queueMicrotask(avisar)
  return parar
}
async function garantirPerfil(sb, user) {
  const pendente = ler(CHAVE_FOTO, null)
  const foto = pendente && pendente.email === limparEmail(user.email) ? pendente.foto : null
  const { data: atual, error } = await sb.from('perfis').select('uid, foto').eq('uid', user.id).maybeSingle()
  if (error) return
  if (!atual) {
    const meta = user.user_metadata || {}
    const usuario = normalizarUsuario(meta.usuario || '')
    if (!usuario || validarUsuario(usuario)) return
    const nome =
      String(meta.nome || '')
        .trim()
        .slice(0, 60) || usuario
    const r = await sb
      .from('perfis')
      .upsert(
        {
          uid: user.id,
          nome,
          usuario,
          foto: foto || null,
        },
        {
          onConflict: 'uid',
        },
      )
      .select('uid')
      .maybeSingle()
    if (!r.error && foto) remover(CHAVE_FOTO)
  } else if (foto) {
    const r = await sb
      .from('perfis')
      .update({
        foto,
      })
      .eq('uid', user.id)
      .select('uid')
      .maybeSingle()
    if (!r.error) remover(CHAVE_FOTO)
  }
}
async function trazerPreferencias() {
  if (perfilCompleto()) return
  const prefs = await lerPreferencias()
  if (prefs) perfilDoServidor(prefs)
}
async function depoisDeEntrar(sb, user) {
  remover(CHAVE_LOCAL)
  const antes = contaCache()
  if (antes?.uid && antes.uid !== user.id) limparCaches()
  if (!user.is_anonymous) {
    await garantirPerfil(sb, user).catch(() => {})
    await trazerPreferencias().catch(() => {})
  }
  await atualizar({
    forcarPapel: true,
  })
  if (modoRede() === 'supabase') await minhaConta().catch(() => null)
}
let timerSincronia = null
function agendarSincronia() {
  clearTimeout(timerSincronia)
  timerSincronia = setTimeout(() => {
    if (!estado.logado || !estado.supabase || estado.tipo === 'local') return
    let dados
    try {
      dados = perfilParaServidor()
    } catch {
      dados = null
    }
    if (dados) salvarPreferencias(dados).catch(() => {})
  }, 1500)
}
export async function entrarComEmail(email, senha) {
  const e = limparEmail(email)
  if (!emailValido(e)) throw erro('EMAIL_INVALIDO')
  if (!senha) throw erro('CREDENCIAIS_INVALIDAS')
  const sb = await cliente()
  const { data, error } = await sb.auth.signInWithPassword({
    email: e,
    password: String(senha),
  })
  if (error) throw erroConta(error)
  await depoisDeEntrar(sb, data.user)
  return sessaoAtual()
}
export async function usuarioLivre(usuario) {
  const u = normalizarUsuario(usuario)
  if (validarUsuario(u)) return false
  const sb = await cliente()
  const { data, error } = await sb.rpc('usuario_livre', {
    usuario: u,
  })
  if (error) {
    const e = erroBanco(error)
    if (e.codigo === 'BANCO_DESATUALIZADO') return true
    throw e
  }
  return data !== false
}
export async function criarContaEmail({ nome, email, senha, usuario, foto } = {}) {
  const n = String(nome || '').trim()
  const e = limparEmail(email)
  const u = normalizarUsuario(usuario || '')
  if (n.length < 2) throw erro('NOME_CURTO')
  if (!emailValido(e)) throw erro('EMAIL_INVALIDO')
  if (String(senha || '').length < SENHA_MINIMA) throw erro('SENHA_FRACA')
  if (validarUsuario(u)) throw erro('USUARIO_INVALIDO')
  const sb = await cliente()
  if (!(await usuarioLivre(u))) throw erro('USUARIO_EM_USO')
  const { data, error } = await sb.auth.signUp({
    email: e,
    password: String(senha),
    options: {
      data: {
        nome: n.slice(0, 60),
        usuario: u,
      },
      emailRedirectTo: voltarPara('/entrar'),
    },
  })
  if (error) {
    const c = erroConta(error)
    if (c.codigo === 'ERRO_SERVIDOR' && !(await usuarioLivre(u).catch(() => true)))
      throw erro('USUARIO_EM_USO')
    throw c
  }
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
    throw erro('EMAIL_EM_USO')
  if (foto)
    salvar(CHAVE_FOTO, {
      email: e,
      foto,
    })
  if (!data.session)
    return {
      confirmar: true,
      email: e,
    }
  await depoisDeEntrar(sb, data.session.user)
  return {
    confirmar: false,
    email: e,
    sessao: await sessaoAtual(),
  }
}
function entrarLocal(aviso) {
  salvar(CHAVE_LOCAL, {
    em: Date.now(),
  })
  const s = {
    logado: true,
    tipo: 'local',
    email: null,
    uid: null,
    supabase: contasDisponiveis(),
  }
  definir({
    carregando: false,
    ...s,
    papel: 'local',
  })
  return aviso
    ? {
        ...s,
        aviso,
      }
    : s
}
export async function entrarComoConvidado() {
  if (!contasDisponiveis()) return entrarLocal()
  let sb
  try {
    sb = await cliente()
  } catch {
    return entrarLocal('SEM_SERVIDOR')
  }
  const atual = (await sb.auth.getSession().catch(() => null))?.data?.session
  if (atual?.user?.is_anonymous) {
    await depoisDeEntrar(sb, atual.user)
    return sessaoAtual()
  }
  if (atual)
    await sb.auth
      .signOut({
        scope: 'local',
      })
      .catch(() => apagarSessaoGuardada())
  const { data, error } = await sb.auth.signInAnonymously()
  if (error) {
    const c = erroConta(error)
    if (c.codigo === 'SEM_INTERNET' || c.codigo === 'ANONIMO_DESLIGADO') return entrarLocal(c.codigo)
    throw c
  }
  await depoisDeEntrar(sb, data.user)
  return sessaoAtual()
}
function apagarSessaoGuardada() {
  try {
    Object.keys(localStorage)
      .filter(k => /^sb-.+-auth-token(-code-verifier)?$/.test(k))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}
async function desligarAvisos() {
  if (!ler('kleo_push_ativo', null)) return
  await Promise.race([desativarPush().catch(() => {}), esperar(2500)])
}
function esquecerConta() {
  remover(CHAVE_SESSAO)
  remover(CHAVE_LOCAL)
  remover(CHAVE_SEM_SENHA)
  limparCaches()
  papeis.clear()
  definir({
    carregando: false,
    logado: false,
    tipo: null,
    email: null,
    uid: null,
    papel: null,
  })
}
export async function sair() {
  if (contasDisponiveis()) {
    await desligarAvisos()
    try {
      const sb = await cliente()
      const { error } = await sb.auth.signOut({
        scope: 'local',
      })
      if (error) apagarSessaoGuardada()
    } catch {
      apagarSessaoGuardada()
    }
  }
  esquecerConta()
}
export async function excluirConta() {
  if (!contasDisponiveis() || estado.tipo === 'local') {
    await sair()
    return
  }
  const sb = await cliente()
  const s = (await sb.auth.getSession()).data?.session
  if (!s) {
    await sair()
    return
  }
  await desligarAvisos()
  const { error } = await sb.rpc('apagar_minha_conta')
  if (error) throw erroBanco(error)
  const r = await sb.auth
    .signOut({
      scope: 'local',
    })
    .catch(() => ({
      error: true,
    }))
  if (r?.error) apagarSessaoGuardada()
  remover(CHAVE_FOTO)
  esquecerConta()
}
export async function trocarSenha(atual, nova) {
  if (String(nova || '').length < SENHA_MINIMA) throw erro('SENHA_FRACA')
  const sb = await cliente()
  const user = (await sb.auth.getSession()).data?.session?.user
  if (!user) throw erro('SESSAO_EXPIRADA')
  if (user.is_anonymous) throw erro('CONVIDADO')
  if (atual) {
    if (String(atual) === String(nova)) throw erro('SENHA_IGUAL')
    const r = await sb.auth.signInWithPassword({
      email: user.email,
      password: String(atual),
    })
    if (r.error) {
      const c = erroConta(r.error)
      throw c.codigo === 'CREDENCIAIS_INVALIDAS' ? erro('SENHA_ATUAL_ERRADA') : c
    }
  }
  const { error } = await sb.auth.updateUser({
    password: String(nova),
  })
  if (error) throw erroConta(error)
  remover(CHAVE_SEM_SENHA)
  return true
}
export async function recuperarSenha(email) {
  const e = limparEmail(email)
  if (!emailValido(e)) throw erro('EMAIL_INVALIDO')
  const sb = await cliente()
  const { error } = await sb.auth.resetPasswordForEmail(e, {
    redirectTo: voltarPara('/entrar'),
  })
  if (error) throw erroConta(error)
  return true
}
export const precisaCriarSenha = () => !!ler(CHAVE_SEM_SENHA, null)
export async function converterConvidado({ email, senha } = {}) {
  const e = limparEmail(email)
  if (!emailValido(e)) throw erro('EMAIL_INVALIDO')
  if (String(senha || '').length < SENHA_MINIMA) throw erro('SENHA_FRACA')
  const sb = await cliente()
  const user = (await sb.auth.getSession()).data?.session?.user
  if (!user) throw erro('SESSAO_EXPIRADA')
  if (!user.is_anonymous) throw erro('JA_TEM_CONTA')
  const r1 = await sb.auth.updateUser(
    {
      email: e,
    },
    {
      emailRedirectTo: voltarPara('/entrar'),
    },
  )
  if (r1.error) throw erroConta(r1.error)
  if (r1.data?.user && r1.data.user.is_anonymous === false) {
    const r2 = await sb.auth.updateUser({
      password: String(senha),
    })
    if (r2.error) {
      salvar(CHAVE_SEM_SENHA, {
        email: e,
      })
      await atualizar({
        forcarPapel: true,
      })
      throw erroConta(r2.error)
    }
    await sb.auth.refreshSession().catch(() => {})
    await atualizar({
      forcarPapel: true,
    })
    agendarSincronia()
    return {
      confirmar: false,
      email: e,
    }
  }
  salvar(CHAVE_SEM_SENHA, {
    email: e,
  })
  return {
    confirmar: true,
    email: e,
  }
}
export function destinoDepoisDeEntrar() {
  let completo
  try {
    completo = perfilCompleto()
  } catch {
    completo = !!ler('kleo_profile', null)
  }
  return completo ? '/home' : '/onboarding'
}
async function sessaoDoServidor(sb) {
  return (await sb.auth.getSession().catch(() => null))?.data?.session || null
}
export async function lerPreferencias() {
  if (!contasDisponiveis()) return null
  const sb = await cliente()
  if (!(await sessaoDoServidor(sb))) return null
  const { data, error } = await sb.rpc('minhas_preferencias')
  if (error) throw erroBanco(error)
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null
}
export async function salvarPreferencias(preferencias) {
  if (!contasDisponiveis()) return false
  const sb = await cliente()
  if (!(await sessaoDoServidor(sb))) return false
  const { data, error } = await sb.rpc('salvar_minhas_preferencias', {
    preferencias: preferencias ?? null,
  })
  if (error) throw erroBanco(error)
  return data === true
}
export const GRUPOS_COFRE = [
  {
    id: 'ia',
    nome: 'Inteligência artificial',
    cor: 'lavanda',
  },
  {
    id: 'voz',
    nome: 'Voz',
    cor: 'ceu',
  },
  {
    id: 'mapa',
    nome: 'Mapa',
    cor: 'lima',
  },
  {
    id: 'outros',
    nome: 'Outros',
    cor: 'mist',
  },
]
export const SERVICOS_COFRE = [
  {
    id: 'groq',
    nome: 'Groq',
    tipo: 'ia',
    gratis: true,
    comeca: 'gsk_',
    site: 'https://console.groq.com/keys',
    dica: 'Conversa rápida e áudio em texto. Grátis.',
    modelos: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
  },
  {
    id: 'gemini',
    nome: 'Google Gemini',
    tipo: 'ia',
    gratis: true,
    comeca: 'AIza',
    site: 'https://aistudio.google.com/app/apikey',
    dica: 'Enxerga fotos e a câmera. Grátis.',
    modelos: ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'],
  },
  {
    id: 'openrouter',
    nome: 'OpenRouter',
    tipo: 'ia',
    gratis: false,
    comeca: 'sk-or-',
    site: 'https://openrouter.ai/keys',
    dica: 'Vários modelos numa chave só. Reserva.',
    modelos: ['openai/gpt-4o-mini', 'google/gemini-2.5-flash'],
  },
  {
    id: 'openai',
    nome: 'OpenAI',
    tipo: 'ia',
    gratis: false,
    comeca: 'sk-',
    site: 'https://platform.openai.com/api-keys',
    dica: 'Paga. Reserva opcional.',
    modelos: ['gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini'],
  },
  {
    id: 'elevenlabs',
    nome: 'ElevenLabs',
    tipo: 'voz',
    gratis: true,
    comeca: 'sk_',
    site: 'https://elevenlabs.io/app/settings/api-keys',
    dica: 'Vozes naturais. Cerca de 10 mil letras grátis por mês.',
    modelos: ['eleven_flash_v2_5', 'eleven_turbo_v2_5', 'eleven_multilingual_v2'],
  },
  {
    id: 'google_maps',
    nome: 'Google Maps',
    tipo: 'mapa',
    gratis: false,
    comeca: 'AIza',
    site: 'https://console.cloud.google.com/apis/library/tile.googleapis.com',
    dica: 'Mapa oficial do Google (Map Tiles API). Pago: exige faturamento no Google Cloud. Sem restrição de site na chave (quem usa é o servidor).',
    modelos: [],
  },
  {
    id: 'outro',
    nome: 'Outro serviço',
    tipo: 'outros',
    gratis: false,
    comeca: '',
    site: '',
    dica: 'Guarde aqui a chave de um serviço futuro. Use o apelido para dizer de qual serviço é.',
    modelos: [],
  },
]
const linhaCofre = l => ({
  id: l.id,
  servico: l.servico,
  rotulo: l.rotulo || '',
  mascara: l.mascara || '••••',
  modelo: l.modelo || '',
  ordem: Number(l.ordem) || 1,
  ativa: l.ativa !== false,
  criadoEm: Date.parse(l.criado_em || '') || 0,
  atualizadoEm: Date.parse(l.atualizado_em || '') || 0,
})
async function rpcCofre(nome, args) {
  const sb = await cliente()
  const { data, error } = await sb.rpc(nome, args)
  if (error) throw erroBanco(error)
  return data
}
export async function salvarVozAparelho(ligada) {
  await rpcCofre('salvar_voz_aparelho', {
    ligada: !!ligada,
  })
}
export async function cofreListar() {
  const linhas = await rpcCofre('cofre_listar')
  return (Array.isArray(linhas) ? linhas : []).map(linhaCofre)
}
export async function cofreAdicionar({ servico, valor, rotulo = '', modelo = '' } = {}) {
  const v = String(valor || '').replace(/\s+/g, '')
  if (v.length < 20) throw erro('VALOR_INVALIDO')
  return rpcCofre('cofre_adicionar', {
    servico,
    valor: v,
    rotulo: String(rotulo || ''),
    modelo: String(modelo || '') || null,
  })
}
export async function cofreAtualizar(id, { rotulo, modelo, ativa, valor } = {}) {
  const args = {
    id,
  }
  if (rotulo !== undefined) args.rotulo = String(rotulo)
  if (modelo !== undefined) args.modelo = String(modelo ?? '')
  if (ativa !== undefined) args.ativa = !!ativa
  if (valor !== undefined && valor !== '') {
    const v = String(valor).replace(/\s+/g, '')
    if (v.length < 20) throw erro('VALOR_INVALIDO')
    args.valor = v
  }
  await rpcCofre('cofre_atualizar', args)
  return true
}
export async function cofreMover(id, novaOrdem) {
  await rpcCofre('cofre_mover', {
    id,
    nova_ordem: Math.round(Number(novaOrdem) || 1),
  })
  return true
}
export async function cofreRemover(id) {
  await rpcCofre('cofre_remover', {
    id,
  })
  return true
}
export async function cofreTestar(id) {
  const sb = await cliente()
  const token = (await sessaoDoServidor(sb))?.access_token
  if (!token) throw erro('SESSAO_EXPIRADA')
  let r
  try {
    r = await fetch(urlApi('cofre-teste'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
      }),
    })
  } catch {
    return {
      ok: false,
      codigo: 'SEM_INTERNET',
      mensagem: MENSAGENS.SEM_INTERNET,
    }
  }
  const tipo = r.headers.get('content-type') || ''
  const j = tipo.includes('json') ? await r.json().catch(() => null) : null
  if (!j)
    return {
      ok: false,
      codigo: 'SEM_SERVIDOR',
      mensagem: 'O teste precisa do servidor do app (funciona no site publicado e no npm run dev).',
    }
  const codigo = j.codigo || j.error?.code || (r.ok ? '' : `HTTP_${r.status}`)
  return {
    ok: !!j.ok,
    ms: Number(j.ms) || 0,
    codigo,
    mensagem: j.ok ? '' : mensagemTeste(codigo, j),
  }
}
export function mensagemTeste(codigo, j = {}) {
  switch (codigo) {
    case 'CHAVE_RECUSADA':
      return 'O serviço recusou a chave. Confira se ela foi copiada inteira ou crie outra.'
    case 'SEM_COTA':
      return 'A chave funciona, mas a cota grátis acabou por agora. Ela volta sozinha; deixe uma reserva.'
    case 'API_DESATIVADA':
      return j?.servico === 'google_maps'
        ? 'A Map Tiles API está desligada no projeto dessa chave. Ative a Map Tiles API no Google Cloud e teste de novo.'
        : 'A API do Gemini está desligada no projeto dessa chave. Crie a chave pelo Google AI Studio.'
    case 'SEM_FATURAMENTO':
      return 'O projeto dessa chave não tem faturamento (cartão) ou não liberou a Map Tiles API no Google Cloud.'
    case 'CHAVE_RESTRITA':
      return 'A chave tem restrição que bloqueia o servidor. No Google Cloud, libere a Map Tiles API e tire a restrição de site (HTTP referrer) dessa chave.'
    case 'SEM_TESTE':
      return 'Este serviço não tem teste automático. A chave está guardada no cofre.'
    case 'SEM_PERMISSAO_VOZ':
      return 'A chave do ElevenLabs não tem permissão para transformar texto em voz. Crie uma chave com essa permissão.'
    case 'TEMPO':
    case 'REDE':
      return 'O serviço não respondeu agora. Tente de novo em instantes.'
    case 'SOMENTE_DONO':
      return MENSAGENS.SOMENTE_DONO
    case 'SEM_COFRE':
      return 'O servidor ainda não lê o cofre: falta a SUPABASE_SERVICE_ROLE_KEY no .env.local ou na Vercel.'
    case 'CHAVE_NAO_ENCONTRADA':
      return MENSAGENS.CHAVE_NAO_ENCONTRADA
    case 'IA_INTEGRADA_LIMITE':
      return 'Muitos testes seguidos. Espere um minuto.'
    default:
      return j?.detalhe
        ? `O serviço respondeu com erro: ${String(j.detalhe).slice(0, 140)}`
        : 'Não consegui testar agora. Tente de novo.'
  }
}
