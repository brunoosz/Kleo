import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const servidor = await createServer({
  root: raiz,
  server: {
    strictPort: false,
  },
})
await servidor.listen()
const endereco = (servidor.resolvedUrls?.local?.[0] || 'http://localhost:5173/').replace(/\/+$/, '')
console.log(`\n[Kleo] Vite em ${endereco}. Abrindo o app do computador...\n`)
const env = {
  ...process.env,
  KLEO_DEV_URL: endereco,
}
delete env.ELECTRON_RUN_AS_NODE
const executavel = require('electron')
const filho = spawn(executavel, [raiz], {
  stdio: 'inherit',
  env,
  windowsHide: false,
})
const encerrar = async codigo => {
  await servidor.close().catch(() => {})
  process.exit(codigo ?? 0)
}
filho.on('close', codigo => {
  encerrar(codigo)
})
process.on('SIGINT', () => {
  filho.kill()
  encerrar(0)
})
process.on('SIGTERM', () => {
  filho.kill()
  encerrar(0)
})
