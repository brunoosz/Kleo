import { next } from '@vercel/functions'

export const config = { matcher: '/api/:path*' }

const ORIGENS_APPS = ['https://localhost', 'capacitor://localhost']

function origemLiberada(origem) {
  if (!origem) return false
  if (ORIGENS_APPS.includes(origem)) return true
  const extras = String(globalThis.process?.env?.KLEO_ORIGENS || '')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean)
  return extras.includes(origem.toLowerCase())
}

export default function middleware(request) {
  const origem = request.headers.get('origin') || ''
  if (!origemLiberada(origem)) return undefined
  const cors = {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  return next({ headers: cors })
}
