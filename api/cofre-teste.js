import { erroOrigem, origemPermitida, ipDe, limitar, erroLimite, testarChave } from './_ia-comum.js'
import { configSupabase, ehDono, lerCofre } from './_cofre.js'
const responder = (status, dados) =>
  Response.json(dados, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
const ehUuid = v =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
export async function POST(request) {
  if (!origemPermitida(request)) return erroOrigem()
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token)
    return responder(401, {
      ok: false,
      codigo: 'SOMENTE_DONO',
    })
  if (!configSupabase().cofre)
    return responder(503, {
      ok: false,
      codigo: 'SEM_COFRE',
    })
  const lim = limitar(ipDe(request), 'cofreTeste')
  if (!lim.ok) return erroLimite(lim)
  let corpo
  try {
    corpo = await request.json()
  } catch {
    return responder(400, {
      ok: false,
      codigo: 'PEDIDO',
    })
  }
  if (!ehUuid(corpo?.id))
    return responder(400, {
      ok: false,
      codigo: 'PEDIDO',
    })
  let dono
  try {
    dono = await ehDono(token)
  } catch {
    return responder(502, {
      ok: false,
      codigo: 'REDE',
    })
  }
  if (!dono)
    return responder(403, {
      ok: false,
      codigo: 'SOMENTE_DONO',
    })
  const linhas = await lerCofre({
    forcar: true,
  })
  if (!linhas)
    return responder(502, {
      ok: false,
      codigo: 'REDE',
    })
  const linha = linhas.find(l => l.id === corpo.id)
  if (!linha)
    return responder(404, {
      ok: false,
      codigo: 'CHAVE_NAO_ENCONTRADA',
    })
  const r = await testarChave(linha.servico, linha.valor)
  return responder(200, {
    ok: r.ok,
    ms: r.ms,
    servico: linha.servico,
    ...(r.ok
      ? {}
      : {
          codigo: r.codigo,
          motivo: r.motivo || undefined,
          detalhe: r.detalhe || undefined,
        }),
  })
}
