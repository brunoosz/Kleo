import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Campo } from './ui'
import useModoSimples from '../hooks/useModoSimples'
import { CIDADES_PRIORITARIAS, ESTADOS } from '../data/cidades'
const CHAVE = 'kleo_municipios'
const URL_IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado'
const URL_GEO = 'https://geocoding-api.open-meteo.com/v1/search'
const LIMITE = 8
function norm(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
const PRIORIDADE = CIDADES_PRIORITARIAS.map(([nome, uf, lat, lon]) => ({
  nome,
  uf,
  lat,
  lon,
  chave: norm(nome),
}))
const MAPA_PRIORIDADE = new Map(PRIORIDADE.map(c => [c.chave + '|' + c.uf, c]))
let municipiosMem = null
let carregando = null
const coordsMem = new Map()
function prepararLista(compacta) {
  return compacta.map(([nome, uf]) => ({
    nome,
    uf,
    chave: norm(nome),
  }))
}
function carregarMunicipios() {
  if (municipiosMem) return Promise.resolve(municipiosMem)
  if (carregando) return carregando
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null')
    if (Array.isArray(salvo) && salvo.length > 1000) {
      municipiosMem = prepararLista(salvo)
      return Promise.resolve(municipiosMem)
    }
  } catch {}
  carregando = fetch(URL_IBGE)
    .then(r => {
      if (!r.ok) throw new Error('IBGE ' + r.status)
      return r.json()
    })
    .then(dados => {
      const compacta = (Array.isArray(dados) ? dados : [])
        .map(m => [m['municipio-nome'], m['UF-sigla']])
        .filter(([nome, uf]) => nome && uf)
      try {
        localStorage.setItem(CHAVE, JSON.stringify(compacta))
      } catch {}
      municipiosMem = prepararLista(compacta)
      return municipiosMem
    })
    .catch(() => {
      carregando = null
      return null
    })
  return carregando
}
function buscarCidades(texto, lista) {
  const [parteNome, parteUf = ''] = (texto || '').split(',')
  const q = norm(parteNome)
  const uf = norm(parteUf).toUpperCase().slice(0, 2)
  if (!q) return []
  const casaUf = c => !uf || c.uf.startsWith(uf)
  const vistos = new Set()
  const saida = []
  const adicionar = c => {
    const k = c.chave + '|' + c.uf
    if (vistos.has(k)) return
    vistos.add(k)
    saida.push(MAPA_PRIORIDADE.get(k) || c)
  }
  PRIORIDADE.filter(c => c.chave.startsWith(q) && casaUf(c)).forEach(adicionar)
  if (q.length >= 2 && lista && saida.length < LIMITE) {
    const porPrefixo = []
    const porPalavra = []
    for (const c of lista) {
      if (!casaUf(c)) continue
      if (c.chave.startsWith(q)) porPrefixo.push(c)
      else if (q.length >= 3 && c.chave.includes(' ' + q)) porPalavra.push(c)
    }
    const ordenar = (a, b) =>
      (b.chave === q) - (a.chave === q) || a.chave.length - b.chave.length || a.chave.localeCompare(b.chave)
    porPrefixo.sort(ordenar).forEach(adicionar)
    porPalavra.sort(ordenar).forEach(adicionar)
  }
  return saida.slice(0, LIMITE)
}
async function geocodificar(nome, uf) {
  const k = norm(nome) + '|' + uf
  const fixa = MAPA_PRIORIDADE.get(k)
  if (fixa)
    return {
      lat: fixa.lat,
      lon: fixa.lon,
    }
  if (coordsMem.has(k)) return coordsMem.get(k)
  const url = `${URL_GEO}?name=${encodeURIComponent(nome)}&count=10&language=pt&countryCode=BR`
  const r = await fetch(url)
  if (!r.ok) return null
  const dados = await r.json()
  const res = Array.isArray(dados?.results) ? dados.results : []
  const estado = norm(ESTADOS[uf])
  const alvo =
    res.find(x => norm(x.name) === norm(nome) && norm(x.admin1) === estado) ||
    res.find(x => norm(x.admin1) === estado) ||
    (!uf ? res[0] : null)
  const coords = alvo
    ? {
        lat: alvo.latitude,
        lon: alvo.longitude,
      }
    : null
  if (coords) coordsMem.set(k, coords)
  return coords
}
export default function CampoCidade({
  valor = '',
  onChange,
  rotulo = 'Cidade',
  placeholder = 'Ex: São Paulo, SP',
  onKeyDown,
  ...resto
}) {
  const simples = useModoSimples()
  const idLista = useId()
  const [lista, setLista] = useState(municipiosMem)
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const [termo, setTermo] = useState(valor)
  const [localizando, setLocalizando] = useState(false)
  const valorRef = useRef(valor)
  const digitou = useRef(false)
  const listaRef = useRef(null)
  useEffect(() => {
    valorRef.current = valor
  })
  useEffect(() => {
    const t = setTimeout(() => {
      setTermo(valor)
      setAtivo(-1)
    }, 250)
    return () => clearTimeout(t)
  }, [valor])
  const sugestoes = useMemo(() => (aberto ? buscarCidades(termo, lista) : []), [aberto, termo, lista])
  const mostrar = aberto && sugestoes.length > 0
  useEffect(() => {
    if (mostrar)
      listaRef.current?.scrollIntoView?.({
        block: 'nearest',
        behavior: 'smooth',
      })
  }, [mostrar])
  function prepararLista() {
    if (!lista)
      carregarMunicipios().then(l => {
        if (l) setLista(l)
      })
  }
  async function escolher(c) {
    const texto = `${c.nome}, ${c.uf}`
    digitou.current = false
    valorRef.current = texto
    setAberto(false)
    setAtivo(-1)
    onChange?.(texto, {
      nome: c.nome,
      uf: c.uf,
      lat: c.lat ?? null,
      lon: c.lon ?? null,
    })
    if (c.lat != null) return
    setLocalizando(true)
    const coords = await geocodificar(c.nome, c.uf).catch(() => null)
    setLocalizando(false)
    if (coords && valorRef.current === texto)
      onChange?.(texto, {
        nome: c.nome,
        uf: c.uf,
        ...coords,
      })
  }
  function aoDigitar(e) {
    digitou.current = true
    setAberto(true)
    prepararLista()
    onChange?.(e.target.value, null)
  }
  function aoSair() {
    setAberto(false)
    if (!digitou.current) return
    const [parteNome, parteUf = ''] = (valor || '').split(',')
    const q = norm(parteNome)
    const uf = norm(parteUf).toUpperCase()
    if (!q) return
    const exatas = buscarCidades(valor, lista).filter(c => c.chave === q && (!uf || c.uf === uf))
    if (
      exatas.length === 1 ||
      (exatas.length > 1 && MAPA_PRIORIDADE.has(exatas[0].chave + '|' + exatas[0].uf))
    )
      escolher(exatas[0])
  }
  function aoTeclar(e) {
    const n = sugestoes.length
    if (mostrar) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setAtivo(i => (i + 1) % n)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setAtivo(i => (i <= 0 ? n - 1 : i - 1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        escolher(sugestoes[ativo >= 0 ? ativo : 0])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setAberto(false)
        return
      }
    } else if (e.key === 'ArrowDown' && valor) {
      e.preventDefault()
      setAberto(true)
      prepararLista()
      return
    }
    onKeyDown?.(e)
  }
  const idOpcao = i => `${idLista}-op-${i}`
  return (
    <div style={styles.wrap}>
      <Campo
        rotulo={rotulo}
        icone={MapPin}
        placeholder={placeholder}
        value={valor}
        onChange={aoDigitar}
        onFocus={prepararLista}
        onBlur={aoSair}
        onKeyDown={aoTeclar}
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={mostrar && ativo >= 0 ? idOpcao(ativo) : undefined}
        aria-busy={localizando || undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        {...resto}
      />
      {mostrar && (
        <ul
          ref={listaRef}
          id={idLista}
          role="listbox"
          aria-label="Sugestões de cidades"
          style={styles.lista}
          className="anim-up"
        >
          {sugestoes.map((c, i) => (
            <li
              key={c.chave + c.uf}
              id={idOpcao(i)}
              role="option"
              aria-selected={i === ativo}
              onMouseDown={e => e.preventDefault()}
              onClick={() => escolher(c)}
              onMouseEnter={() => setAtivo(i)}
              style={{
                ...styles.opcao,
                minHeight: simples ? 58 : 48,
                fontSize: simples ? 18 : 16,
                background: i === ativo ? 'var(--surface-2)' : 'transparent',
              }}
            >
              <MapPin
                size={simples ? 20 : 18}
                color="var(--text-3)"
                aria-hidden="true"
                style={styles.opIcone}
              />
              <span style={styles.opNome}>{c.nome}</span>
              <span style={styles.opUf}>{c.uf}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
const styles = {
  wrap: {
    position: 'relative',
    width: '100%',
  },
  lista: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 40,
    listStyle: 'none',
    margin: 0,
    padding: 6,
    background: 'var(--surface)',
    borderRadius: 25,
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--surface-2)',
    maxHeight: 320,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  opcao: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px',
    borderRadius: 19,
    cursor: 'pointer',
    color: 'var(--text)',
    transition: 'background 0.15s',
  },
  opIcone: {
    flexShrink: 0,
  },
  opNome: {
    flex: 1,
    minWidth: 0,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  opUf: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 'var(--r-badge)',
    background: 'var(--lavanda)',
    color: '#000',
  },
}
