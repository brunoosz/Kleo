import { ler, salvar } from './storage'
import {
  distanciaM,
  formatarDistancia,
  distanciaFalada,
  duracaoFalada,
  formatarDuracao,
  rotaAPe,
  rotaCarro,
  planejarMetro,
  geocodificar,
} from '../components/MapaRotas'
import { coordsCidadeSync } from '../components/mapa/cidade'
import { sistemaEm } from '../data/metros'
import { rotaAcessivelPadrao } from './perfil'
const semAcento = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
const CATEGORIAS = [
  {
    chaves: ['farmacia', 'drogaria', 'remedio'],
    nome: 'farmácia',
    filtros: ['amenity=pharmacy', 'shop=chemist'],
  },
  {
    chaves: ['hospital', 'pronto socorro', 'pronto-socorro', 'upa', 'emergencia'],
    nome: 'hospital',
    filtros: ['amenity=hospital'],
  },
  {
    chaves: ['posto de saude', 'ubs', 'clinica', 'medico', 'consultorio'],
    nome: 'clínica',
    filtros: ['amenity=clinic', 'amenity=doctors'],
  },
  {
    chaves: ['dentista', 'odonto'],
    nome: 'dentista',
    filtros: ['amenity=dentist'],
  },
  {
    chaves: ['supermercado', 'mercado', 'mercadinho', 'atacadao', 'atacado'],
    nome: 'mercado',
    filtros: ['shop=supermarket', 'shop=convenience'],
  },
  {
    chaves: ['padaria', 'pao'],
    nome: 'padaria',
    filtros: ['shop=bakery'],
  },
  {
    chaves: ['hortifruti', 'sacolao', 'feira', 'verdura', 'fruta'],
    nome: 'hortifruti',
    filtros: ['shop=greengrocer', 'amenity=marketplace'],
  },
  {
    chaves: ['acougue', 'carne'],
    nome: 'açougue',
    filtros: ['shop=butcher'],
  },
  {
    chaves: ['caixa eletronico', 'caixa 24', 'atm', 'sacar'],
    nome: 'caixa eletrônico',
    filtros: ['amenity=atm'],
  },
  {
    chaves: ['banco', 'agencia'],
    nome: 'banco',
    filtros: ['amenity=bank'],
  },
  {
    chaves: ['lotérica', 'loterica'],
    nome: 'lotérica',
    filtros: ['shop=lottery'],
  },
  {
    chaves: ['posto de gasolina', 'posto', 'gasolina', 'combustivel', 'abastecer'],
    nome: 'posto de combustível',
    filtros: ['amenity=fuel'],
  },
  {
    chaves: ['restaurante', 'almocar', 'jantar', 'comer'],
    nome: 'restaurante',
    filtros: ['amenity=restaurant'],
  },
  {
    chaves: ['lanchonete', 'lanche', 'hamburguer', 'pizzaria', 'pizza'],
    nome: 'lanchonete',
    filtros: ['amenity=fast_food'],
  },
  {
    chaves: ['cafe', 'cafeteria'],
    nome: 'café',
    filtros: ['amenity=cafe'],
  },
  {
    chaves: ['bar', 'boteco'],
    nome: 'bar',
    filtros: ['amenity=bar', 'amenity=pub'],
  },
  {
    chaves: ['correio', 'correios'],
    nome: 'correios',
    filtros: ['amenity=post_office'],
  },
  {
    chaves: ['delegacia', 'policia'],
    nome: 'delegacia',
    filtros: ['amenity=police'],
  },
  {
    chaves: ['bombeiro'],
    nome: 'bombeiros',
    filtros: ['amenity=fire_station'],
  },
  {
    chaves: ['igreja', 'templo', 'paroquia'],
    nome: 'igreja',
    filtros: ['amenity=place_of_worship'],
  },
  {
    chaves: ['escola', 'colegio'],
    nome: 'escola',
    filtros: ['amenity=school'],
  },
  {
    chaves: ['faculdade', 'universidade'],
    nome: 'faculdade',
    filtros: ['amenity=university', 'amenity=college'],
  },
  {
    chaves: ['parque', 'praca'],
    nome: 'parque',
    filtros: ['leisure=park'],
  },
  {
    chaves: ['academia'],
    nome: 'academia',
    filtros: ['leisure=fitness_centre'],
  },
  {
    chaves: ['pet shop', 'petshop', 'racao'],
    nome: 'pet shop',
    filtros: ['shop=pet'],
  },
  {
    chaves: ['veterinario', 'veterinaria'],
    nome: 'veterinário',
    filtros: ['amenity=veterinary'],
  },
  {
    chaves: ['otica'],
    nome: 'ótica',
    filtros: ['shop=optician'],
  },
  {
    chaves: ['shopping'],
    nome: 'shopping',
    filtros: ['shop=mall'],
  },
  {
    chaves: ['estacionamento'],
    nome: 'estacionamento',
    filtros: ['amenity=parking'],
  },
  {
    chaves: ['banheiro'],
    nome: 'banheiro público',
    filtros: ['amenity=toilets'],
  },
  {
    chaves: ['ponto de onibus', 'parada de onibus', 'onibus'],
    nome: 'ponto de ônibus',
    filtros: ['highway=bus_stop'],
  },
  {
    chaves: ['estacao de metro', 'metro', 'estacao de trem', 'trem'],
    nome: 'estação',
    filtros: ['railway=station', 'station=subway'],
  },
  {
    chaves: ['hotel', 'pousada'],
    nome: 'hotel',
    filtros: ['tourism=hotel', 'tourism=guest_house'],
  },
  {
    chaves: ['cabeleireiro', 'salao', 'barbearia', 'barbeiro'],
    nome: 'salão',
    filtros: ['shop=hairdresser', 'shop=beauty'],
  },
  {
    chaves: ['lavanderia'],
    nome: 'lavanderia',
    filtros: ['shop=laundry', 'shop=dry_cleaning'],
  },
  {
    chaves: ['papelaria'],
    nome: 'papelaria',
    filtros: ['shop=stationery'],
  },
  {
    chaves: ['material de construcao', 'ferragens', 'ferragem', 'construcao'],
    nome: 'material de construção',
    filtros: ['shop=hardware', 'shop=doityourself'],
  },
  {
    chaves: ['oficina', 'mecanico', 'borracharia'],
    nome: 'oficina',
    filtros: ['shop=car_repair', 'shop=tyres'],
  },
  {
    chaves: ['biblioteca'],
    nome: 'biblioteca',
    filtros: ['amenity=library'],
  },
  {
    chaves: ['cinema'],
    nome: 'cinema',
    filtros: ['amenity=cinema'],
  },
]
export function categoriaDe(termo) {
  const t = semAcento(termo)
  return CATEGORIAS.find(c => c.chaves.some(k => t.includes(k))) || null
}
const CHAVE_POS = 'kleo_ultima_pos'
export function lembrarPosicao(p) {
  if (!p || !Number.isFinite(p.lat)) return
  try {
    localStorage.setItem(
      CHAVE_POS,
      JSON.stringify({
        lat: p.lat,
        lng: p.lng,
        ts: Date.now(),
      }),
    )
  } catch {}
}
function gps(timeout = 7000) {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    const limite = setTimeout(() => resolve(null), timeout + 8000)
    navigator.geolocation.getCurrentPosition(
      p => {
        clearTimeout(limite)
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        })
      },
      () => {
        clearTimeout(limite)
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 60000,
      },
    )
  })
}
export async function obterPosicao() {
  const p = await gps()
  if (p) {
    lembrarPosicao(p)
    return {
      ...p,
      fonte: 'gps',
    }
  }
  try {
    const u = JSON.parse(localStorage.getItem(CHAVE_POS) || 'null')
    if (u && Date.now() - u.ts < 2 * 3600 * 1000)
      return {
        lat: u.lat,
        lng: u.lng,
        fonte: 'recente',
      }
  } catch {}
  const c = coordsCidadeSync(ler('kleo_profile', null))
  return c
    ? {
        ...c,
        fonte: 'cidade',
      }
    : null
}
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
async function nominatimPerto(termo, p, signal) {
  const d = 0.045
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(termo)}&countrycodes=br&limit=15&bounded=1&viewbox=${p.lng - d},${p.lat + d},${p.lng + d},${p.lat - d}&addressdetails=1&accept-language=pt-BR`
  const r = await fetch(url, {
    signal,
  })
  if (!r.ok) throw new Error('nominatim')
  const j = await r.json()
  return (j || []).map(x => {
    const a = x.address || {}
    return {
      nome: x.name || String(x.display_name || '').split(',')[0],
      endereco: [[a.road, a.house_number].filter(Boolean).join(', '), a.suburb].filter(Boolean).join(' - '),
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }
  })
}
async function nominatimPorTipo(filtros, p, d, signal) {
  const validos = new Set(filtros)
  const umTipo = async filtro => {
    const frase = filtro.split('=')[1].replace(/_/g, ' ')
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(frase)}&countrycodes=br&limit=25&bounded=1&viewbox=${p.lng - d},${p.lat + d},${p.lng + d},${p.lat - d}&addressdetails=1&extratags=1&accept-language=pt-BR`
    try {
      const r = await fetch(url, {
        signal,
      })
      if (!r.ok) return []
      const j = await r.json()
      return (Array.isArray(j) ? j : [])
        .filter(x => validos.has(`${x.category}=${x.type}`))
        .map(x => {
          const a = x.address || {}
          return {
            nome: x.name || '',
            endereco: [[a.road, a.house_number].filter(Boolean).join(', '), a.suburb]
              .filter(Boolean)
              .join(' - '),
            lat: parseFloat(x.lat),
            lng: parseFloat(x.lon),
            horario: x.extratags?.opening_hours,
            acessivel: x.extratags?.wheelchair === 'yes',
          }
        })
    } catch (e) {
      if (e?.name === 'AbortError') throw e
      return []
    }
  }
  const listas = await Promise.all(filtros.slice(0, 3).map(umTipo))
  return listas.flat()
}
async function overpass(filtros, p, raio, signal) {
  const partes = filtros
    .map(f => {
      const [k, v] = f.split('=')
      return `nwr["${k}"="${v}"](around:${raio},${p.lat},${p.lng});`
    })
    .join('')
  const q = `[out:json][timeout:4];(${partes});out center tags 60;`
  const ctrls = OVERPASS.map(() => new AbortController())
  const cancelarTodos = () => ctrls.forEach(c => c.abort())
  signal?.addEventListener('abort', cancelarTodos, {
    once: true,
  })
  const tentar = async (url, i) => {
    const timer = setTimeout(() => ctrls[i].abort(), 4000)
    try {
      const r = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: ctrls[i].signal,
      })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      if (j.remark && !j.elements?.length) throw new Error('overpass ocupado')
      return j
    } finally {
      clearTimeout(timer)
    }
  }
  let j
  try {
    j = await Promise.any(
      OVERPASS.map(
        (url, i) => new Promise((ok, falha) => setTimeout(() => tentar(url, i).then(ok, falha), i * 350)),
      ),
    )
  } catch {
    if (signal?.aborted) throw new DOMException('Abortado', 'AbortError')
    throw new Error('overpass')
  } finally {
    cancelarTodos()
  }
  return (j.elements || [])
    .map(e => {
      const t = e.tags || {}
      const lat = e.lat ?? e.center?.lat
      const lng = e.lon ?? e.center?.lon
      const rua = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ')
      return {
        nome: t.name || t.brand || t.operator || '',
        endereco: [rua, t['addr:suburb']].filter(Boolean).join(' - '),
        lat,
        lng,
        horario: t.opening_hours || '',
        acessivel: t.wheelchair === 'yes',
        telefone: t.phone || t['contact:phone'] || '',
      }
    })
    .filter(x => Number.isFinite(x.lat))
}
function abertoAgora(h) {
  if (!h) return null
  if (/24\/7/.test(h)) return true
  const dias = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const agora = new Date()
  const hoje = dias[agora.getDay()]
  const min = agora.getHours() * 60 + agora.getMinutes()
  for (const regra of h.split(';').map(s => s.trim())) {
    const m = regra.match(/^([A-Za-z,\- ]+)?\s*(\d{2}):(\d{2})-(\d{2}):(\d{2})/)
    if (!m) continue
    const faixa = (m[1] || 'Mo-Su').trim()
    const valeHoje = faixa.split(',').some(parte => {
      const [a, b] = parte.trim().split('-')
      const ia = dias.indexOf(a)
      const ib = dias.indexOf(b || a)
      const ih = dias.indexOf(hoje)
      if (ia < 0 || ib < 0) return false
      return ia <= ib ? ih >= ia && ih <= ib : ih >= ia || ih <= ib
    })
    if (!valeHoje) continue
    const ini = +m[2] * 60 + +m[3]
    let fim = +m[4] * 60 + +m[5]
    if (fim <= ini) fim += 24 * 60
    if (min >= ini && min < fim) return true
    return false
  }
  return null
}
function posicaoRecente() {
  try {
    const u = JSON.parse(localStorage.getItem(CHAVE_POS) || 'null')
    if (u && Date.now() - u.ts < 3 * 60 * 1000)
      return {
        lat: u.lat,
        lng: u.lng,
        fonte: 'recente',
      }
  } catch {}
  return null
}
export async function buscarLugares(termo, { signal, maximo = 5 } = {}) {
  const origem = posicaoRecente() || (await obterPosicao())
  if (!origem) throw new Error('SEM_LOCAL')
  const cat = categoriaDe(termo)
  let brutos = []
  if (cat) {
    const ctrlOverpass = new AbortController()
    signal?.addEventListener('abort', () => ctrlOverpass.abort(), {
      once: true,
    })
    const pedidoOverpass = overpass(cat.filtros, origem, 3000, ctrlOverpass.signal).catch(() => [])
    for (const d of [0.015, 0.05, 0.15]) {
      const achados = await nominatimPorTipo(cat.filtros, origem, d, signal)
      if (achados.length > brutos.length) brutos = achados
      if (brutos.length >= 3) break
    }
    if (brutos.length < 3) {
      const extras = await Promise.race([pedidoOverpass, new Promise(ok => setTimeout(() => ok([]), 2500))])
      if (extras.length) brutos = [...brutos, ...extras]
    }
    ctrlOverpass.abort()
    if (!brutos.length) brutos = await nominatimPerto(cat.nome, origem, signal).catch(() => [])
  }
  if (!brutos.length) {
    const r = await geocodificar(termo, origem, signal, {
      centro: origem,
    })
    brutos = (r || []).map(x => ({
      nome: x.nome,
      endereco: x.detalhe || '',
      lat: x.lat,
      lng: x.lng,
    }))
  }
  const nomeCat = cat?.nome || termo
  const vistos = new Set()
  const itens = brutos
    .map(b => ({
      ...b,
      metros: distanciaM(origem, b),
    }))
    .sort((a, b) => (b.nome ? 1 : 0) - (a.nome ? 1 : 0) || a.metros - b.metros)
    .filter(b => {
      const k = semAcento(b.nome) + Math.round(b.lat * 2000)
      if (vistos.has(k)) return false
      vistos.add(k)
      return true
    })
    .sort((a, b) => a.metros - b.metros)
    .slice(0, maximo)
    .map((b, i) => ({
      n: i + 1,
      nome: b.nome || `${nomeCat[0].toUpperCase()}${nomeCat.slice(1)} sem nome`,
      endereco: b.endereco || '',
      lat: +b.lat.toFixed(6),
      lng: +b.lng.toFixed(6),
      metros: Math.round(b.metros),
      aberto: abertoAgora(b.horario),
      acessivel: !!b.acessivel,
    }))
  const busca = {
    termo,
    categoria: nomeCat,
    origem,
    itens,
    ts: Date.now(),
  }
  salvar('kleo_lugares', busca)
  return busca
}
export function ultimaBusca() {
  const b = ler('kleo_lugares', null)
  if (!b || !Array.isArray(b.itens) || Date.now() - (b.ts || 0) > 3 * 3600 * 1000) return null
  return b
}
export function lugaresParaIA(b) {
  if (!b) return ''
  if (!b.itens.length) return `Nenhum lugar encontrado para "${b.termo}" perto da pessoa.`
  const onde =
    b.origem.fonte === 'cidade' ? ' (sem GPS: distâncias contadas a partir do centro da cidade)' : ''
  return (
    `Opções de ${b.categoria} mais perto da pessoa${onde}:\n` +
    b.itens
      .map(
        i =>
          `${i.n}. ${i.nome}${i.endereco ? ' - ' + i.endereco : ''} | ${formatarDistancia(i.metros)}${i.aberto === true ? ' | aberto agora' : i.aberto === false ? ' | fechado agora' : ''}${i.acessivel ? ' | acessível' : ''} | coordenadas ${i.lat},${i.lng}`,
      )
      .join('\n')
  )
}
export const MODOS_ROTA = {
  pe: 'a pé',
  carro: 'de carro',
  acessivel: 'pelo caminho acessível',
  onibus: 'de ônibus',
  metro: 'de metrô',
}
export function modoDe(t) {
  const n = semAcento(t)
  if (!n) return ''
  if (/acessiv|cadeira|rampa/.test(n)) return 'acessivel'
  if (/metro|trem|cptm|subway/.test(n)) return 'metro'
  if (/onibus|bus|coletivo/.test(n)) return 'onibus'
  if (/carro|uber|taxi|99|dirig|moto|carona/.test(n)) return 'carro'
  if (/pe\b|^pe$|a pe|andando|caminh|pedestre/.test(n)) return 'pe'
  return ''
}
export async function resumoRota(destino, modoPedido, { signal, acessivel = false } = {}) {
  const cadeirante = rotaAcessivelPadrao()
  const ac = acessivel || cadeirante || modoPedido === 'acessivel'
  const modo = modoPedido === 'acessivel' || (ac && modoPedido === 'pe') ? 'acessivel' : modoPedido
  const origem = await obterPosicao()
  if (!origem) return null
  const nome = destino.nome || 'o destino'
  if (modo === 'metro') {
    const sistema = sistemaEm(origem)
    const plano = planejarMetro(origem, destino, {
      sistema,
      soAcessiveis: ac,
    })
    if (!sistema || plano.caminharDireto) {
      return {
        texto: `Não compensa pegar metrô até ${nome}: a pé são cerca de ${duracaoFalada(plano.minutos * 60)}.`,
        modo: 'pe',
      }
    }
    const passos = plano.segmentos
      .filter(s => s.texto)
      .map(s => s.texto)
      .join('. ')
    const extraMetro = ac ? ' Escolhi só estações com elevador ou rampa.' : ''
    return {
      texto: `De metrô leva cerca de ${duracaoFalada(plano.minutos * 60)}. ${passos}.${extraMetro}`,
      curto: `Metrô · ${formatarDuracao(plano.minutos * 60)}`,
      modo,
      acessivel: ac,
    }
  }
  const r =
    modo === 'carro' || modo === 'onibus'
      ? await rotaCarro(origem, destino, signal)
      : await rotaAPe(origem, destino, signal, {
          cadeirante: modo === 'acessivel',
        })
  const dur = modo === 'onibus' ? r.duracao * 1.6 : r.duracao
  let extra = ''
  if (modo === 'onibus')
    extra = ac
      ? ' Esse tempo é aproximado. Prefira ônibus com elevador e acene para o motorista.'
      : ' Esse tempo de ônibus é aproximado.'
  if (modo === 'acessivel') {
    extra = r.semGarantia
      ? ' Não consegui garantir um caminho sem escadas, vá com cuidado.'
      : ' É um caminho sem escadas, escolhido com menos ladeiras.'
    if (r.subidas?.length)
      extra += ` Tem ${r.subidas.length === 1 ? 'um trecho mais inclinado' : r.subidas.length + ' trechos mais inclinados'}; se puder, vá com alguém.`
  }
  const desde =
    origem.fonte === 'cidade' ? ' (contando do centro da cidade, ligue o GPS para mais precisão)' : ''
  return {
    texto: `Até ${nome}, ${MODOS_ROTA[modo] || 'a pé'}: ${distanciaFalada(r.distancia)}, cerca de ${duracaoFalada(dur)}${desde}.${extra} No mapa é só tocar em Iniciar.`,
    curto: `${formatarDistancia(r.distancia)} · ${formatarDuracao(dur)}`,
    modo: modo === 'acessivel' ? 'pe' : modo,
    acessivel: ac,
  }
}
