import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ferramentas = path.resolve(process.env.KLEO_FERRAMENTAS || path.join(raiz, '..', 'ferramentas'))
const pastaAndroid = path.join(raiz, 'android')
const pastaSaida = path.join(raiz, 'release')
const windows = process.platform === 'win32'
const soTeste = process.argv.includes('--so-teste')
const semBuild = process.argv.includes('--sem-build')
const versao = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')).version
const parar = msg => {
  console.error(`\n[Kleo] ${msg}\n`)
  process.exit(1)
}
function rodar(comando, argumentos, opcoes = {}) {
  return new Promise((resolve, reject) => {
    const bat = windows && /\.(bat|cmd)$/i.test(comando)
    const filho = bat
      ? spawn(`"${comando}" ${argumentos.join(' ')}`, {
          stdio: 'inherit',
          shell: true,
          ...opcoes,
        })
      : spawn(comando, argumentos, {
          stdio: 'inherit',
          ...opcoes,
        })
    filho.on('error', reject)
    filho.on('close', codigo =>
      codigo === 0 ? resolve() : reject(new Error(`${path.basename(comando)} terminou com erro (${codigo})`)),
    )
  })
}
function versaoJava(pasta) {
  try {
    const texto = fs.readFileSync(path.join(pasta, 'release'), 'utf8')
    const m = /JAVA_VERSION="(\d+)/.exec(texto)
    return m ? Number(m[1]) : 0
  } catch {
    return 0
  }
}
function acharJdk() {
  const candidatos = [process.env.KLEO_JDK, process.env.JAVA_HOME, path.join(ferramentas, 'jdk-21')]
  try {
    for (const nome of fs.readdirSync(ferramentas))
      if (/^jdk-?2\d/i.test(nome)) candidatos.push(path.join(ferramentas, nome))
  } catch {}
  return candidatos.filter(Boolean).find(p => versaoJava(p) >= 21) || null
}
function acharSdk() {
  const candidatos = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(ferramentas, 'android-sdk'),
  ]
  return candidatos.filter(Boolean).find(p => fs.existsSync(path.join(p, 'platforms'))) || null
}
function acharChave() {
  const doAmbiente = {
    KLEO_KEYSTORE: process.env.KLEO_KEYSTORE,
    KLEO_KEYSTORE_SENHA: process.env.KLEO_KEYSTORE_SENHA,
    KLEO_KEY_ALIAS: process.env.KLEO_KEY_ALIAS,
    KLEO_KEY_SENHA: process.env.KLEO_KEY_SENHA,
  }
  if (doAmbiente.KLEO_KEYSTORE && doAmbiente.KLEO_KEYSTORE_SENHA) return doAmbiente
  const arquivo =
    process.env.KLEO_ASSINATURA || path.join(ferramentas, 'chaves', 'assinatura-android.properties')
  if (!fs.existsSync(arquivo)) return null
  const valores = {}
  for (const linha of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_]+)\s*=\s*(.*?)\s*$/.exec(linha)
    if (m && !linha.trim().startsWith('#')) valores[m[1]] = m[2]
  }
  let keystore = valores.arquivo || ''
  if (keystore && !path.isAbsolute(keystore)) keystore = path.resolve(path.dirname(arquivo), keystore)
  if (!keystore || !fs.existsSync(keystore) || !valores.senhaArquivo) return null
  return {
    KLEO_KEYSTORE: keystore,
    KLEO_KEYSTORE_SENHA: valores.senhaArquivo,
    KLEO_KEY_ALIAS: valores.apelido || 'kleo',
    KLEO_KEY_SENHA: valores.senhaChave || valores.senhaArquivo,
  }
}
if (!fs.existsSync(path.join(pastaAndroid, 'gradlew')))
  parar('Pasta android/ não encontrada. Rode uma vez: npx cap add android')
const jdk = acharJdk()
if (!jdk)
  parar(
    `JDK 21 não encontrado. Baixe o Temurin 21 (zip) e extraia em ${path.join(ferramentas, 'jdk-21')} (kit/14, Parte 3).`,
  )
const sdk = acharSdk()
if (!sdk)
  parar(`Android SDK não encontrado. Instale em ${path.join(ferramentas, 'android-sdk')} (kit/14, Parte 3).`)
const chave = soTeste ? null : acharChave()
const env = {
  ...process.env,
  JAVA_HOME: jdk,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  PATH: `${path.join(jdk, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
  ...(chave || {}),
}
console.log(`[Kleo] JDK: ${jdk}\n[Kleo] Android SDK: ${sdk}`)
console.log(
  chave
    ? '[Kleo] Chave de assinatura encontrada: gera o APK final (release).'
    : '[Kleo] Sem chave de assinatura: gera só o APK de teste (debug).',
)
if (!semBuild) {
  await rodar(process.execPath, [path.join(raiz, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], {
    cwd: raiz,
  })
}
await rodar(
  process.execPath,
  [path.join(raiz, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor'), 'sync', 'android'],
  {
    cwd: raiz,
    env,
  },
)
const tarefas = ['assembleDebug', ...(chave ? ['assembleRelease'] : []), '--console=plain']
if (process.env.CI) tarefas.push('--no-daemon')
if (windows)
  await rodar(path.join(pastaAndroid, 'gradlew.bat'), tarefas, {
    cwd: pastaAndroid,
    env,
  })
else
  await rodar('sh', [path.join(pastaAndroid, 'gradlew'), ...tarefas], {
    cwd: pastaAndroid,
    env,
  })
fs.mkdirSync(pastaSaida, {
  recursive: true,
})
const saidas = []
const copiar = (origem, nome) => {
  if (!fs.existsSync(origem)) return
  const destino = path.join(pastaSaida, nome)
  fs.copyFileSync(origem, destino)
  saidas.push(`${destino} (${(fs.statSync(destino).size / 1048576).toFixed(1)} MB)`)
}
const apks = path.join(pastaAndroid, 'app', 'build', 'outputs', 'apk')
copiar(path.join(apks, 'debug', 'app-debug.apk'), `Kleo-${versao}-teste.apk`)
if (chave) copiar(path.join(apks, 'release', 'app-release.apk'), `Kleo-${versao}.apk`)
console.log(`\n[Kleo] Pronto:\n  ${saidas.join('\n  ')}\n`)
