export const MAX_SEGUNDOS = 300
export function gravacaoDisponivel() {
  return (
    typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined'
  )
}
function tipoAudio() {
  const tipos = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm']
  return tipos.find(t => window.MediaRecorder.isTypeSupported?.(t)) || ''
}
export async function iniciarGravacao({
  onNivel,
  onSilencio,
  silencioMs = 2600,
  maxSeg = MAX_SEGUNDOS,
  onLimite,
} = {}) {
  const fluxo = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })
  const tipo = tipoAudio()
  let rec
  try {
    rec = new MediaRecorder(fluxo, {
      ...(tipo
        ? {
            mimeType: tipo,
          }
        : {}),
      audioBitsPerSecond: 24000,
    })
  } catch {
    rec = new MediaRecorder(fluxo)
  }
  const partes = []
  rec.ondataavailable = e => {
    if (e.data?.size) partes.push(e.data)
  }
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = Ctx ? new Ctx() : null
  let analisador = null
  if (ctx) {
    const fonte = ctx.createMediaStreamSource(fluxo)
    analisador = ctx.createAnalyser()
    analisador.fftSize = 512
    fonte.connect(analisador)
  }
  const amostra = new Uint8Array(512)
  const inicio = Date.now()
  let falou = false
  let ultimoSom = Date.now()
  let avisouSilencio = false
  let avisouLimite = false
  const laco = setInterval(() => {
    if (analisador) {
      analisador.getByteTimeDomainData(amostra)
      let soma = 0
      for (let i = 0; i < amostra.length; i++) {
        const x = (amostra[i] - 128) / 128
        soma += x * x
      }
      const rms = Math.sqrt(soma / amostra.length)
      onNivel?.(Math.min(1, rms * 5))
      if (rms > 0.035) {
        falou = true
        ultimoSom = Date.now()
      }
    }
    if (onSilencio && falou && !avisouSilencio && Date.now() - ultimoSom > silencioMs) {
      avisouSilencio = true
      onSilencio()
    }
    if (!avisouLimite && (Date.now() - inicio) / 1000 >= maxSeg) {
      avisouLimite = true
      onLimite?.()
    }
  }, 100)
  rec.start(250)
  const fechar = () => {
    clearInterval(laco)
    fluxo.getTracks().forEach(t => t.stop())
    ctx?.close?.().catch(() => {})
  }
  return {
    inicio,
    parar: () =>
      new Promise(resolve => {
        const fim = () => {
          fechar()
          resolve({
            blob: new Blob(partes, {
              type: rec.mimeType || tipo || 'audio/webm',
            }),
            duracao: (Date.now() - inicio) / 1000,
            falou: falou || !analisador,
          })
        }
        if (rec.state === 'inactive') {
          fim()
          return
        }
        rec.onstop = fim
        try {
          rec.requestData?.()
        } catch {}
        rec.stop()
      }),
    cancelar: () => {
      try {
        if (rec.state !== 'inactive') rec.stop()
      } catch {}
      fechar()
    },
  }
}
export function blobParaDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Falha ao ler o áudio'))
    r.readAsDataURL(blob)
  })
}
export async function fonteParaBlob(src) {
  const r = await fetch(src)
  if (!r.ok) throw new Error('Falha ao baixar o áudio')
  return r.blob()
}
export const dataURLParaBlob = fonteParaBlob
export function tocarAudio(src, { velocidade = 1 } = {}) {
  return new Promise(resolve => {
    const a = new Audio(src)
    a.playbackRate = velocidade
    a.onended = () => resolve(true)
    a.onerror = () => resolve(false)
    a.play().catch(() => resolve(false))
  })
}
export function somMensagem() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const t0 = ctx.currentTime + 0.02
    ;[880, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t = t0 + i * 0.13
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.4)
    })
    setTimeout(() => ctx.close?.().catch(() => {}), 900)
  } catch {}
}
export function sirene() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx)
    return {
      parar() {},
    }
  const ctx = new Ctx()
  ctx.resume?.().catch(() => {})
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  g.gain.value = 0.12
  o.connect(g).connect(ctx.destination)
  const t = ctx.currentTime
  for (let i = 0; i < 400; i++) {
    o.frequency.setValueAtTime(650, t + i * 1.2)
    o.frequency.linearRampToValueAtTime(1350, t + i * 1.2 + 0.6)
    o.frequency.linearRampToValueAtTime(650, t + i * 1.2 + 1.2)
  }
  o.start()
  return {
    parar() {
      try {
        o.stop()
      } catch {}
      setTimeout(() => ctx.close?.().catch(() => {}), 200)
    },
  }
}
