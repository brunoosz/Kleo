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
} from 'lucide-react'
import { ler, salvar } from '../../lib/storage'
import { falar } from '../../lib/voz'
import { Card, Rotulo, Pill } from './ui'
import { alvo } from './util'
const SAO_PAULO = {
  lat: -23.5505,
  lon: -46.6333,
  nome: 'São Paulo, SP',
}
const VALIDADE_CACHE = 30 * 60 * 1000
function condicao(code) {
  if (code === 0)
    return {
      texto: 'Céu limpo',
      icon: Sun,
      cor: '#ffd60a',
    }
  if (code === 1 || code === 2)
    return {
      texto: code === 1 ? 'Predominantemente limpo' : 'Parcialmente nublado',
      icon: CloudSun,
      cor: '#ffd60a',
    }
  if (code === 3)
    return {
      texto: 'Nublado',
      icon: Cloud,
      cor: 'var(--silver)',
    }
  if (code === 45 || code === 48)
    return {
      texto: 'Neblina',
      icon: CloudFog,
      cor: 'var(--silver)',
    }
  if (code >= 51 && code <= 57)
    return {
      texto: 'Garoa',
      icon: CloudDrizzle,
      cor: '#64d2ff',
    }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return {
      texto: code >= 80 ? 'Pancadas de chuva' : 'Chuva',
      icon: CloudRain,
      cor: '#64d2ff',
    }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return {
      texto: 'Neve',
      icon: CloudSnow,
      cor: 'var(--white)',
    }
  if (code >= 95)
    return {
      texto: 'Tempestade',
      icon: CloudLightning,
      cor: '#bf5af2',
    }
  return {
    texto: 'Tempo variável',
    icon: CloudSun,
    cor: 'var(--silver)',
  }
}
async function localizar(cidade) {
  const nome = (cidade || '').split(/[,/-]/)[0].trim()
  if (nome) {
    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`,
      )
      const j = await r.json()
      const g = j.results?.[0]
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
    '&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&timezone=auto'
  const r = await fetch(url)
  if (!r.ok) throw new Error('Erro ' + r.status)
  const dados = await r.json()
  return {
    local,
    dados,
    cidade: cidade || '',
    ts: Date.now(),
  }
}
function gerarDicas(d) {
  const c = d.current
  const chuvaHoje = d.daily.precipitation_sum?.[0] ?? 0
  const probHoje = d.daily.precipitation_probability_max?.[0] ?? 0
  const max = d.daily.temperature_2m_max?.[0] ?? c.temperature_2m
  const min = d.daily.temperature_2m_min?.[0] ?? c.temperature_2m
  const chuvaSemana = (d.daily.precipitation_sum || []).reduce((s, v) => s + (v || 0), 0)
  const dicas = []
  if (chuvaHoje > 10)
    dicas.push({
      icon: ShieldAlert,
      cor: 'var(--orange)',
      texto: `Chuva forte prevista (${Math.round(chuvaHoje)} mm). Evite aplicar defensivos e adubo foliar hoje.`,
    })
  else if (probHoje >= 60)
    dicas.push({
      icon: Umbrella,
      cor: '#64d2ff',
      texto: `Chance de chuva de ${probHoje}%. Adie a irrigação e aproveite para plantar mudas.`,
    })
  if (c.relative_humidity_2m < 40)
    dicas.push({
      icon: Droplets,
      cor: '#64d2ff',
      texto: `Umidade baixa (${c.relative_humidity_2m}%). Irrigue no início da manhã ou no fim da tarde.`,
    })
  if (c.wind_speed_10m > 20)
    dicas.push({
      icon: Wind,
      cor: 'var(--orange)',
      texto: `Vento forte (${Math.round(c.wind_speed_10m)} km/h). Não pulverize: o produto pode se perder pela deriva.`,
    })
  if (max >= 32)
    dicas.push({
      icon: Thermometer,
      cor: 'var(--red)',
      texto: 'Calor intenso. Proteja as mudas, reforce a água dos animais e evite trabalhar ao meio-dia.',
    })
  if (min <= 4)
    dicas.push({
      icon: Snowflake,
      cor: '#64d2ff',
      texto: 'Risco de geada. Cubra as hortaliças e irrigue o solo no fim da tarde.',
    })
  if (chuvaSemana < 2 && chuvaHoje <= 10)
    dicas.push({
      icon: Sprout,
      cor: 'var(--green)',
      texto: 'Semana seca pela frente. Planeje a irrigação e a cobertura morta do solo.',
    })
  if (!dicas.length)
    dicas.push({
      icon: Sprout,
      cor: 'var(--green)',
      texto: 'Tempo favorável para o trabalho no campo. Bom dia para aplicações e tratos culturais.',
    })
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
export default function Clima({ necessidade, cidade }) {
  const [estado, setEstado] = useState(() => {
    const cache = ler('kleo_clima_cache', null)
    return {
      carregando: true,
      erro: '',
      clima: cache && cache.cidade === (cidade || '') ? cache : null,
    }
  })
  const [recarga, setRecarga] = useState(0)
  const h = alvo(necessidade)
  useEffect(() => {
    let vivo = true
    const cache = ler('kleo_clima_cache', null)
    const valido =
      recarga === 0 && cache && cache.cidade === (cidade || '') && Date.now() - cache.ts < VALIDADE_CACHE
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
        if (necessidade === 'visual') {
          const c = clima.dados.current
          falar(
            `Em ${clima.local.nome}, ${Math.round(c.temperature_2m)} graus, ${condicao(c.weather_code).texto.toLowerCase()}. ${gerarDicas(clima.dados)[0].texto}`,
            {
              forcar: true,
            },
          )
        }
      })
      .catch(() => {
        if (vivo)
          setEstado(e => ({
            ...e,
            carregando: false,
            erro: 'Não foi possível atualizar o clima. Verifique sua conexão.',
          }))
      })
    return () => {
      vivo = false
    }
  }, [cidade, recarga, necessidade])
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
        <div style={styles.col} aria-live="polite">
          <Card
            style={{
              ...styles.agora,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <p style={styles.cinza}>Consultando a previsão do tempo...</p>
            <div
              className="skeleton"
              style={{
                height: 96,
                width: '45%',
              }}
              aria-hidden="true"
            />
            <div
              className="skeleton"
              style={{
                height: 20,
                width: '60%',
              }}
              aria-hidden="true"
            />
            <div style={styles.metricas} aria-hidden="true">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    height: 66,
                    borderRadius: 18,
                  }}
                />
              ))}
            </div>
          </Card>
          <Card
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="skeleton"
                style={{
                  height: 22,
                  width: `${92 - i * 6}%`,
                }}
              />
            ))}
          </Card>
        </div>
      )
    }
    return (
      <Card style={styles.centro}>
        <span
          className="shake"
          style={{
            display: 'flex',
          }}
        >
          <WifiOff size={26} color="var(--orange)" />
        </span>
        <p style={styles.cinza}>{erro}</p>
        <Pill icon={RefreshCw} altura={h} onClick={atualizar}>
          Tentar novamente
        </Pill>
      </Card>
    )
  }
  const c = clima.dados.current
  const d = clima.dados.daily
  const cond = condicao(c.weather_code)
  const Icone = cond.icon
  const dicas = gerarDicas(clima.dados)
  const minSemana = Math.min(...d.temperature_2m_min)
  const maxSemana = Math.max(...d.temperature_2m_max)
  const faixa = Math.max(1, maxSemana - minSemana)
  const atualizado = new Date(clima.ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <div style={styles.col}>
      <Card style={styles.agora} aria-label={`Agora: ${Math.round(c.temperature_2m)} graus, ${cond.texto}`}>
        <div style={styles.localLinha}>
          <span style={styles.local}>
            <MapPin size={15} /> {clima.local.nome}
          </span>
          <button
            onClick={atualizar}
            className="prof-press"
            style={{
              ...styles.refresh,
              width: h,
              height: h,
            }}
            aria-label="Atualizar clima"
          >
            <RefreshCw
              size={17}
              style={
                carregando
                  ? {
                      animation: 'kleoProfSpin 1s linear infinite',
                    }
                  : undefined
              }
            />
          </button>
        </div>
        <div style={styles.tempLinha}>
          <p
            key={Math.round(c.temperature_2m)}
            className="anim-scale"
            style={{
              ...styles.temp,
              transformOrigin: 'left center',
            }}
          >
            {Math.round(c.temperature_2m)}°
          </p>
          <span
            key={c.weather_code}
            className="anim-pop"
            style={{
              display: 'flex',
              animationDelay: '0.12s',
            }}
          >
            <Icone size={64} color={cond.cor} strokeWidth={1.5} aria-hidden="true" />
          </span>
        </div>
        <p key={cond.texto} className="anim-fade" style={styles.cond}>
          {cond.texto}
        </p>
        <p style={styles.maxmin}>
          Máx. {Math.round(d.temperature_2m_max[0])}° · Mín. {Math.round(d.temperature_2m_min[0])}°
        </p>
        <div style={styles.metricas} className="stagger">
          <Metrica icon={Droplets} rotulo="Umidade" valor={`${c.relative_humidity_2m}%`} />
          <Metrica icon={Wind} rotulo="Vento" valor={`${Math.round(c.wind_speed_10m)} km/h`} />
          <Metrica
            icon={Umbrella}
            rotulo="Chuva hoje"
            valor={`${(d.precipitation_sum[0] ?? 0).toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })} mm`}
          />
        </div>
        {erro && (
          <p className="anim-up" style={styles.erroPeq}>
            {erro}
          </p>
        )}
      </Card>

      <Card>
        <Rotulo>Dica agrícola de hoje</Rotulo>
        <div style={styles.dicas} className="stagger">
          {dicas.map((dc, i) => (
            <div key={i} style={styles.dica}>
              <div
                style={{
                  ...styles.dicaIcone,
                  color: dc.cor,
                }}
              >
                <dc.icon size={19} />
              </div>
              <p style={styles.dicaTexto}>{dc.texto}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Rotulo>Próximos 7 dias</Rotulo>
        <div className="stagger">
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
                  borderTop: i ? '1px solid var(--divider)' : 'none',
                }}
                aria-label={`${nomeDia(dia, i)}: ${cd.texto}, mínima ${Math.round(d.temperature_2m_min[i])}, máxima ${Math.round(d.temperature_2m_max[i])} graus`}
              >
                <span style={styles.diaNome}>{nomeDia(dia, i)}</span>
                <span style={styles.diaIcone}>
                  <Ic size={22} color={cd.cor} />
                  {prob >= 20 && <span style={styles.prob}>{prob}%</span>}
                </span>
                <span style={styles.diaMin}>{Math.round(d.temperature_2m_min[i])}°</span>
                <span style={styles.trilho}>
                  <span
                    className="prof-cresce"
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
        </div>
        <p style={styles.fonte}>Dados: Open-Meteo · atualizado às {atualizado}</p>
      </Card>
    </div>
  )
}
function Metrica({ icon: Icon, rotulo, valor }) {
  return (
    <div style={styles.metrica}>
      <Icon size={17} color="var(--steel)" />
      <span style={styles.metricaValor}>{valor}</span>
      <span style={styles.metricaRotulo}>{rotulo}</span>
    </div>
  )
}
const styles = {
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  centro: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: 36,
    textAlign: 'center',
  },
  cinza: {
    color: 'var(--silver)',
    fontSize: 15,
  },
  agora: {
    background: 'linear-gradient(160deg, rgba(94,92,230,0.22) 0%, var(--charcoal) 55%)',
    padding: 22,
  },
  localLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  local: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--silver)',
  },
  refresh: {
    borderRadius: '50%',
    background: 'var(--control)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempLinha: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  temp: {
    fontSize: 104,
    fontWeight: 200,
    letterSpacing: '-0.05em',
    lineHeight: 1,
  },
  cond: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    marginTop: 6,
  },
  maxmin: {
    fontSize: 15,
    color: 'var(--silver)',
    marginTop: 4,
  },
  metricas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginTop: 20,
  },
  metrica: {
    background: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricaValor: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: 'var(--green)',
  },
  metricaRotulo: {
    fontSize: 12,
    color: 'var(--steel)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
  },
  erroPeq: {
    fontSize: 13,
    color: 'var(--orange)',
    marginTop: 12,
  },
  dicas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  dica: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  dicaIcone: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: 'var(--control)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dicaTexto: {
    fontSize: 15,
    lineHeight: 1.45,
    paddingTop: 2,
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
    fontWeight: 500,
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
    fontWeight: 600,
    color: '#64d2ff',
  },
  diaMin: {
    width: 32,
    textAlign: 'right',
    fontSize: 16,
    color: 'var(--steel)',
    fontVariantNumeric: 'tabular-nums',
  },
  trilho: {
    flex: 1,
    height: 5,
    borderRadius: 5,
    background: 'var(--control)',
    position: 'relative',
  },
  faixa: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 5,
    background: 'linear-gradient(90deg, #64d2ff, #ffd60a, #ff9f0a)',
  },
  diaMax: {
    width: 32,
    fontSize: 16,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  fonte: {
    fontSize: 12,
    color: 'var(--steel)',
    marginTop: 12,
    textAlign: 'center',
  },
}
