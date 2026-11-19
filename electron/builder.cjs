'use strict'

const fs = require('node:fs')
const path = require('node:path')
const raiz = path.join(__dirname, '..')
function lerVariavel(nome) {
  if (process.env[nome]) return String(process.env[nome]).trim()
  for (const arquivo of ['.env.production.local', '.env.production', '.env.local', '.env']) {
    let texto
    try {
      texto = fs.readFileSync(path.join(raiz, arquivo), 'utf8')
    } catch {
      continue
    }
    const linha = texto.split(/\r?\n/).find(l => new RegExp(`^\\s*${nome}\\s*=`).test(l))
    if (!linha) continue
    const valor = linha
      .slice(linha.indexOf('=') + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
    if (valor) return valor
  }
  return ''
}
const apiBase = lerVariavel('VITE_API_BASE').replace(/\/+$/, '')
if (!apiBase) {
  console.warn(
    '\n[Kleo] AVISO: VITE_API_BASE está vazia. O app do computador abre, mas a IA da Kleo e os avisos',
  )
  console.warn('[Kleo] precisam do endereço do site publicado. Coloque no .env.local, por exemplo:')
  console.warn(
    '[Kleo]   VITE_API_BASE=https://kleo-app.vercel.app   (veja kit/14-INSTALADORES-PC-ANDROID-IPHONE.txt)\n',
  )
}
const ICONE = 'build/icon.ico'
module.exports = {
  appId: 'com.kheo.kleo',
  productName: 'Kleo',
  copyright: `Copyright (c) ${new Date().getFullYear()} Kheo`,
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    '!dist/sw.js',
    'electron/main.cjs',
    'electron/preload.cjs',
    ICONE,
    'package.json',
    '!node_modules/**/*',
  ],
  extraMetadata: {
    main: 'electron/main.cjs',
    kleo: {
      apiBase,
    },
    dependencies: {},
  },
  asar: true,
  npmRebuild: false,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,
  electronLanguages: ['pt-BR', 'en-US'],
  electronFuses: {
    runAsNode: false,
    enableCookieEncryption: true,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
    grantFileProtocolExtraPrivileges: false,
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: ICONE,
    executableName: 'Kleo',
    legalTrademarks: 'Kleo e Kheo',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    selectPerMachineByDefault: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    license: 'LICENCA/TERMOS.txt',
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    menuCategory: false,
    shortcutName: 'Kleo',
    uninstallDisplayName: 'Kleo',
    installerIcon: ICONE,
    uninstallerIcon: ICONE,
    installerHeaderIcon: ICONE,
    installerSidebar: 'build/instalador-lateral.bmp',
    uninstallerSidebar: 'build/instalador-lateral.bmp',
    installerHeader: 'build/instalador-topo.bmp',
    language: '1046',
    installerLanguages: ['pt_BR'],
    multiLanguageInstaller: false,
    unicode: true,
    runAfterFinish: true,
    deleteAppDataOnUninstall: false,
    differentialPackage: false,
    artifactName: 'Kleo-Setup-${version}.${ext}',
  },
  publish: null,
}
