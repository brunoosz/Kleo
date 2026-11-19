import { useEffect, useState } from 'react'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  CloudSun,
  CloudDrizzle,
  Droplets,
  Wind,
  Umbrella,
  MapPin,
  RefreshCw,
  Sprout,
  ShieldAlert,
  Thermometer,
  Snowflake,
  WifiOff,
  HardHat,
  Bike,
  Plane,
  Eye,
  Shirt,
  GlassWater,
  Paintbrush,
} from 'lucide-react'
import { Card, Botao, BotaoIcone } from '../components/ui'
import { ler, salvar } from '../lib/storage'
import { falar } from '../lib/voz'
import { useTam, cidadeDoPerfil } from './comum'
import { Coluna, Rotulo } from './pecas'
const SAO_PAULO = {
  lat: -23.5505,
  lon: -46.6333,
  nome: 'São Paulo, SP',
}
const VALIDADE_CACHE = 30 * 60 * 1000
const VERSAO_CACHE = 2
function condicao(code) {
  if (code === 0)
    return {
      texto: 'Céu limpo',
      icon: Sun,
    }
  if (code === 1 || code === 2)
    return {
      texto: code === 1 ? 'Quase sem nuvens' : 'Parcialmente nublado',
      icon: CloudSun,
    }
  if (code === 3)
    return {
      texto: 'Nublado',
      icon: Cloud,
    }
  if (code === 45 || code === 48)
    return {
      texto: 'Neblina',
      icon: CloudFog,
    }
  if (code >= 51 && code <= 57)
    return {
      texto: 'Garoa',
      icon: CloudDrizzle,
    }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return {
      texto: code >= 80 ? 'Pancadas de chuva' : 'Chuva',
      icon: CloudRain,
    }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return {
      texto: 'Neve',
      icon: CloudSnow,
    }
  if (code >= 95)
    return {
      texto: 'Tempestade',
      icon: CloudLightning,
    }
  return {
    texto: 'Tempo variável',
    icon: CloudSun,
  }
}
async function localizar(cidade) {
  const nome = (cidade || '').split(/[,/-]/)[0].trim()
  if (nome) {
    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`,
      )
      const g = (await r.json()).results?.[0]
      if (g)
        return {
          lat: g.latitude,
          lon: g.longitude,
          nome: [g.name, g.admin1].filter(Boolean).join(', '),
        }
    } catch {}
  }
  try {
    const pos = await new Promise((ok, falha) => {
      if (!navigator.geolocation) return falha(new Error('sem gps'))
      navigator.geolocation.getCurrentPosition(ok, falha, {
        timeout: 6000,
        maximumAge: 600000,
      })
    })
    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      nome: 'Sua localização',
    }
  } catch {
    return SAO_PAULO
  }
}
async function buscarPrevisao(cidade) {
  const local = await localizar(cidade)
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${local.lat}&longitude=${local.lon}` +
    '&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,cloud_cover,visibility,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,weather_code&timezone=auto'
  const r = await fetch(url)
  if (!r.ok) throw new Error('Erro ' + r.status)
  return {
    v: VERSAO_CACHE,
    local,
    dados: await r.json(),
    cidade: cidade || '',
    ts: Date.now(),
  }
}
function leitura(d) {
  const c = d.current
  return {
    c,
    chuvaHoje: d.daily.precipitation_sum?.[0] ?? 0,
    prob: d.daily.precipitation_probability_max?.[0] ?? 0,
    max: d.daily.temperature_2m_max?.[0] ?? c.temperature_2m,
    min: d.daily.temperature_2m_min?.[0] ?? c.temperature_2m,
    uv: d.daily.uv_index_max?.[0] ?? 0,
    vento: c.wind_speed_10m ?? 0,
    rajada: c.wind_gusts_10m ?? c.wind_speed_10m ?? 0,
    visKm: Number.isFinite(c.visibility) ? c.visibility / 1000 : null,
    nuvens: c.cloud_cover ?? 0,
    chuvaSemana: (d.daily.precipitation_sum || []).reduce((s, v) => s + (v || 0), 0),
    tempestade: c.weather_code >= 95 || (d.daily.weather_code?.[0] ?? 0) >= 95,
  }
}
function gerarDicas(d, foco) {
  const x = leitura(d)
  const dicas = []
  const add = (icon, texto) =>
    dicas.push({
      icon,
      texto,
    })
  if (foco === 'agro') {
    if (x.chuvaHoje > 10)
      add(
        ShieldAlert,
        `Chuva forte prevista (${Math.round(x.chuvaHoje)} mm). Evite aplicar defensivos e adubo foliar hoje.`,
      )
    else if (x.prob >= 60)
      add(Umbrella, `Chance de chuva de ${x.prob}%. Adie a irrigação e aproveite para plantar mudas.`)
    if (x.c.relative_humidity_2m < 40)
      add(Droplets, `Umidade baixa (${x.c.relative_humidity_2m}%). Irrigue cedo ou no fim da tarde.`)
    if (x.vento > 20)
      add(Wind, `Vento forte (${Math.round(x.vento)} km/h). Não pulverize: o produto se perde pela deriva.`)
    if (x.max >= 32) add(Thermometer, 'Calor intenso. Proteja as mudas e reforce a água dos animais.')
    if (x.min <= 4) add(Snowflake, 'Risco de geada. Cubra as hortaliças e irrigue o solo no fim da tarde.')
    if (x.chuvaSemana < 2 && x.chuvaHoje <= 10)
      add(Sprout, 'Semana seca pela frente. Planeje irrigação e cobertura morta do solo.')
    if (!dicas.length) add(Sprout, 'Tempo bom para o trabalho no campo e para aplicações.')
  } else if (foco === 'obra') {
    if (x.tempestade)
      add(
        CloudLightning,
        'Tempestade prevista. Suspenda trabalho em altura e com equipamentos elétricos ao ar livre.',
      )
    if (x.prob >= 60 || x.chuvaHoje > 5)
      add(
        Umbrella,
        `Chance de chuva de ${x.prob}%. Evite concretar, rebocar ou pintar áreas externas; proteja cimento e materiais.`,
      )
    if (x.rajada > 40)
      add(
        Wind,
        `Rajadas de ${Math.round(x.rajada)} km/h. Cuidado com andaimes, telhado e içamento de cargas.`,
      )
    if (x.max >= 30)
      add(
        GlassWater,
        'Calor forte. Hidratação a cada 30 minutos e pausas na sombra. Molhe o concreto fresco para a cura.',
      )
    if (x.uv >= 8)
      add(Sun, `Índice UV ${Math.round(x.uv)}. Use protetor solar, manga longa e chapéu sob o capacete.`)
    if (x.c.relative_humidity_2m > 85 && x.prob < 60)
      add(Paintbrush, 'Umidade alta: tinta e massa demoram mais para secar.')
    if (!dicas.length) add(HardHat, 'Tempo firme. Bom dia para concretagem e serviços externos.')
  } else if (foco === 'rua') {
    if (x.tempestade) add(CloudLightning, 'Tempestade prevista. Se puder, espere passar em local coberto.')
    if (x.prob >= 50 || x.chuvaHoje > 2)
      add(
        Umbrella,
        `Chance de chuva de ${x.prob}%. Leve capa, proteja os pedidos e redobre a distância de frenagem.`,
      )
    if (x.rajada > 35)
      add(
        Wind,
        `Rajadas de ${Math.round(x.rajada)} km/h. Atenção em pontes, viadutos e ao passar por caminhões.`,
      )
    if (x.max >= 30) add(GlassWater, 'Calor forte. Beba água entre as corridas e evite ficar parado ao sol.')
    if (x.min <= 12) add(Shirt, 'Manhã fria. Use segunda pele e luvas para não perder firmeza nas mãos.')
    if (x.visKm !== null && x.visKm < 2) add(Eye, 'Visibilidade baixa. Farol aceso e velocidade reduzida.')
    if (!dicas.length) add(Bike, 'Tempo bom para rodar. Boas entregas!')
  } else if (foco === 'voo') {
    if (x.tempestade)
      add(
        CloudLightning,
        'Trovoadas previstas na região. Avalie alternativas e consulte o METAR/TAF oficial.',
      )
    if (x.visKm !== null)
      add(
        Eye,
        x.visKm < 5
          ? `Visibilidade de ${x.visKm.toFixed(1)} km: abaixo dos mínimos VFR (5 km).`
          : `Visibilidade de ${Math.round(x.visKm)} km.`,
      )
    add(Wind, `Vento de ${Math.round(x.vento / 1.852)} kt com rajadas de ${Math.round(x.rajada / 1.852)} kt.`)
    if (x.nuvens >= 75)
      add(
        Cloud,
        `Céu ${x.nuvens >= 90 ? 'encoberto' : 'com muitas nuvens'} (${x.nuvens}%). Confira o teto antes de decolar.`,
      )
    if (x.max >= 32)
      add(Thermometer, 'Temperatura alta reduz a performance: considere pista mais longa na decolagem.')
    add(Plane, 'Informação de apoio. Sempre confirme com fontes aeronáuticas oficiais.')
  } else {
    if (x.prob >= 50) add(Umbrella, `Chance de chuva de ${x.prob}%. Leve guarda-chuva.`)
    if (x.max >= 30) add(GlassWater, 'Dia quente. Beba água ao longo do dia.')
    if (x.min <= 12) add(Shirt, 'Vai esfriar. Leve um agasalho.')
    if (x.uv >= 8) add(Sun, 'Sol forte. Use protetor solar.')
    if (x.vento > 30) add(Wind, `Vento forte (${Math.round(x.vento)} km/h).`)
    if (!dicas.length) add(CloudSun, 'Tempo tranquilo hoje. Aproveite o dia!')
  }
  return dicas
}
const nomeDia = (iso, i) => {
  if (i === 0) return 'Hoje'
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
    })
    .replace('.', '')
}
const TITULO_DICAS = {
  agro: 'Dicas para o campo',
  obra: 'Dicas para a obra',
  rua: 'Dicas para quem roda',
  voo: 'Condições para voo',
  geral: 'Dicas para hoje',
}
export default function Clima({ config = {} }) {
  const { simples } = useTam()
  const foco = TITULO_DICAS[config.foco] ? config.foco : 'geral'
  const cidade = cidadeDoPerfil()
  const [estado, setEstado] = useState(() => {
    const cache = ler('kleo_clima_cache', null)
    const ok = cache && cache.v === VERSAO_CACHE && cache.cidade === cidade
    return {
      carregando: true,
      erro: '',
      clima: ok ? cache : null,
    }
  })
  const [recarga, setRecarga] = useState(0)
  useEffect(() => {
    let vivo = true
    const cache = ler('kleo_clima_cache', null)
    const valido =
      recarga === 0 &&
      cache &&
      cache.v === VERSAO_CACHE &&
      cache.cidade === cidade &&
      Date.now() - cache.ts < VALIDADE_CACHE
    const promessa = valido ? Promise.resolve(cache) : buscarPrevisao(cidade)
    promessa
      .then(clima => {
        if (!vivo) return
        if (!valido) salvar('kleo_clima_cache', clima)
        setEstado({
          carregando: false,
          erro: '',
          clima,
        })
        if (simples) {
          const c = clima.dados.current
          falar(
            `Agora, ${Math.round(c.temperature_2m)} graus, ${condicao(c.weather_code).texto.toLowerCase()}. ${gerarDicas(clima.dados, foco)[0].texto}`,
          )
        }
      })
      .catch(() => {
        if (vivo)
          setEstado(e => ({
            ...e,
            carregando: false,
            erro: 'Não foi possível atualizar o clima. Verifique a internet.',
          }))
      })
    return () => {
      vivo = false
    }
  }, [cidade, recarga, simples, foco])
  const atualizar = () => {
    setEstado(e => ({
      ...e,
      carregando: true,
      erro: '',
    }))
    setRecarga(r => r + 1)
  }
  const { clima, carregando, erro } = estado
  if (!clima) {
    if (carregando) {
      return (
        <Card cor="ceu" tamanho="g" aria-live="polite">
          <p style={styles.preto}>Consultando a previsão...</p>
          <div
            className="skeleton"
            style={{
              height: 90,
              width: '45%',
              marginTop: 14,
            }}
          />
          <div
            className="skeleton"
            style={{
              height: 20,
              width: '60%',
              marginTop: 12,
            }}
          />
        </Card>
      )
    }
    return (
      <Card>
        <div style={styles.centro}>
          <span
            className="shake"
            style={{
              display: 'flex',
            }}
          >
            <WifiOff size={28} />
          </span>
          <p
            style={{
              color: 'var(--text-2)',
            }}
          >
            {erro}
          </p>
          <Botao variante="primario" icone={RefreshCw} onClick={atualizar}>
            Tentar de novo
          </Botao>
        </div>
      </Card>
    )
  }
  const c = clima.dados.current
  const d = clima.dados.daily
  const cond = condicao(c.weather_code)
  const Icone = cond.icon
  const dicas = gerarDicas(clima.dados, foco)
  const minSemana = Math.min(...d.temperature_2m_min)
  const maxSemana = Math.max(...d.temperature_2m_max)
  const faixa = Math.max(1, maxSemana - minSemana)
  const atualizado = new Date(clima.ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const metricas =
    foco === 'voo'
      ? [
          ['Vento', `${Math.round(c.wind_speed_10m / 1.852)} kt`, Wind],
          ['Rajadas', `${Math.round((c.wind_gusts_10m ?? c.wind_speed_10m) / 1.852)} kt`, Wind],
          ['Visib.', Number.isFinite(c.visibility) ? `${Math.round(c.visibility / 1000)} km` : '-', Eye],
        ]
      : [
          ['Umidade', `${c.relative_humidity_2m}%`, Droplets],
          ['Vento', `${Math.round(c.wind_speed_10m)} km/h`, Wind],
          ['Chuva', `${d.precipitation_probability_max?.[0] ?? 0}%`, Umbrella],
        ]
  return (
    <Coluna>
      <Card cor="ceu" tamanho="g">
        <div style={styles.localLinha}>
          <span style={styles.local}>
            <MapPin size={16} /> {clima.local.nome}
          </span>
          <BotaoIcone icone={RefreshCw} label="Atualizar clima" variante="branco" onClick={atualizar} />
        </div>
        <div style={styles.tempLinha}>
          <p
            key={Math.round(c.temperature_2m)}
            className="anim-scale"
            style={{
              ...styles.temp,
              fontSize: simples ? 96 : 88,
            }}
          >
            {Math.round(c.temperature_2m)}°
          </p>
          <span className="anim-pop" style={styles.condIcone}>
            <Icone size={52} color="#000" strokeWidth={1.6} />
          </span>
        </div>
        <p style={styles.cond}>{cond.texto}</p>
        <p style={styles.maxmin}>
          Máx. {Math.round(d.temperature_2m_max[0])}° · Mín. {Math.round(d.temperature_2m_min[0])}°
        </p>
        {!simples && (
          <div style={styles.metricas}>
            {metricas.map(([rot, val, Ic]) => (
              <div key={rot} style={styles.metrica}>
                <Ic size={17} color="#000" />
                <span style={styles.metricaValor}>{val}</span>
                <span style={styles.metricaRot}>{rot}</span>
              </div>
            ))}
          </div>
        )}
        {erro && <p style={styles.erroPeq}>{erro}</p>}
      </Card>

      <Card cor="lima">
        <Rotulo
          style={{
            color: '#000',
          }}
        >
          {TITULO_DICAS[foco]}
        </Rotulo>
        <Coluna gap={12} className="stagger">
          {dicas.slice(0, simples ? 2 : 6).map((dc, i) => (
            <div key={i} style={styles.dica}>
              <span style={styles.dicaIcone}>
                <dc.icon size={19} color="#000" />
              </span>
              <p
                style={{
                  ...styles.dicaTexto,
                  fontSize: simples ? 17 : 15,
                }}
              >
                {dc.texto}
              </p>
            </div>
          ))}
        </Coluna>
      </Card>

      {!simples && (
        <Card>
          <Rotulo>Próximos 7 dias</Rotulo>
          {d.time.map((dia, i) => {
            const cd = condicao(d.weather_code[i])
            const Ic = cd.icon
            const ini = ((d.temperature_2m_min[i] - minSemana) / faixa) * 100
            const larg = ((d.temperature_2m_max[i] - d.temperature_2m_min[i]) / faixa) * 100
            const prob = d.precipitation_probability_max?.[i]
            return (
              <div
                key={dia}
                style={{
                  ...styles.diaLinha,
                  borderTop: i ? '1px solid var(--surface-2)' : 'none',
                }}
                aria-label={`${nomeDia(dia, i)}: ${cd.texto}, mínima ${Math.round(d.temperature_2m_min[i])}, máxima ${Math.round(d.temperature_2m_max[i])} graus`}
              >
                <span style={styles.diaNome}>{nomeDia(dia, i)}</span>
                <span style={styles.diaIcone}>
                  <Ic size={22} />
                  {prob >= 20 && <span style={styles.prob}>{prob}%</span>}
                </span>
                <span style={styles.diaMin}>{Math.round(d.temperature_2m_min[i])}°</span>
                <span style={styles.trilho}>
                  <span
                    className="fer-cresce"
                    style={{
                      ...styles.faixa,
                      left: `${ini}%`,
                      width: `${Math.max(larg, 6)}%`,
                      animationDelay: `${0.2 + i * 0.05}s`,
                    }}
                  />
                </span>
                <span style={styles.diaMax}>{Math.round(d.temperature_2m_max[i])}°</span>
              </div>
            )
          })}
          <p style={styles.fonte}>Dados: Open-Meteo · atualizado às {atualizado}</p>
        </Card>
      )}
    </Coluna>
  )
}
const styles = {
  preto: {
    color: '#000',
    fontSize: 15,
  },
  centro: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    textAlign: 'center',
  },
  localLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  local: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 15,
    fontWeight: 600,
    color: '#000',
  },
  tempLinha: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  temp: {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    color: '#000',
    transformOrigin: 'left center',
  },
  condIcone: {
    width: 84,
    height: 84,
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cond: {
    fontSize: 22,
    fontWeight: 700,
    color: '#000',
    marginTop: 6,
  },
  maxmin: {
    fontSize: 15,
    color: '#000',
    marginTop: 4,
  },
  metricas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginTop: 18,
  },
  metrica: {
    background: 'rgba(255,255,255,0.65)',
    borderRadius: 20,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricaValor: {
    fontSize: 17,
    fontWeight: 800,
    color: '#000',
  },
  metricaRot: {
    fontSize: 12,
    fontWeight: 600,
    color: '#000',
  },
  erroPeq: {
    fontSize: 13,
    color: '#000',
    marginTop: 12,
  },
  dica: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  dicaIcone: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dicaTexto: {
    lineHeight: 1.45,
    paddingTop: 2,
    color: '#000',
  },
  diaLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
  },
  diaNome: {
    width: 48,
    fontSize: 16,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  diaIcone: {
    width: 38,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  prob: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-2)',
  },
  diaMin: {
    width: 32,
    textAlign: 'right',
    fontSize: 16,
    color: 'var(--text-3)',
    fontVariantNumeric: 'tabular-nums',
  },
  trilho: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    background: 'var(--surface-2)',
    position: 'relative',
  },
  faixa: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 8,
    background: 'var(--ceu)',
  },
  diaMax: {
    width: 32,
    fontSize: 16,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  fonte: {
    fontSize: 12,
    color: 'var(--text-3)',
    marginTop: 12,
    textAlign: 'center',
  },
}
