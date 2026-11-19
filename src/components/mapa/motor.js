import { acumulado, projetarNaRota, distanciaM, distanciaFalada, capitalizar, pela } from '../MapaRotas'
export function limiaresDoModo(modo) {
  if (modo === 'carro')
    return {
      avisos: [1000, 300, 100],
      agora: 35,
      chegou: 30,
      fora: 40,
      leituras: 3,
    }
  return {
    avisos: [100],
    agora: 15,
    chegou: 15,
    fora: 35,
    leituras: 3,
  }
}
export function estadoInicial(rota) {
  const ins = rota?.instrucoes || []
  const prox = Math.min(1, Math.max(0, ins.length - 1))
  const inicio = rota?.coords?.[0]
  return {
    pos: inicio
      ? {
          lat: inicio[0],
          lng: inicio[1],
        }
      : null,
    bruta: null,
    rumoRota: null,
    indice: 0,
    progresso: 0,
    prox,
    distProx: ins[prox]?.noCaminho ?? 0,
    restanteM: rota?.distancia || 0,
    restanteS: rota?.duracao || 0,
    foraDaRota: 0,
    precisao: null,
    chegou: false,
    inicial: true,
  }
}
export class MotorNavegacao {
  constructor(rota, { modo, intro = '' } = {}) {
    this.intro = intro
    this.rota = rota
    this.ins = rota.instrucoes || []
    this.coords = rota.coords
    this.acum = acumulado(this.coords)
    this.total = this.acum[this.acum.length - 1] || rota.distancia || 0
    this.lim = limiaresDoModo(modo)
    this.progresso = 0
    this.prox = Math.min(1, this.ins.length - 1)
    this.passoAnunciado = -1
    this.falados = new Set()
    this.foraCont = 0
    this.ultimoPedido = 0
    this.chegou = false
  }
  snap(p) {
    const perto = projetarNaRota(this.coords, this.acum, p, this.progresso - 40, this.progresso + 600)
    const geral = projetarNaRota(this.coords, this.acum, p)
    if (!perto) return geral
    if (!geral) return perto
    return perto.dist <= geral.dist + 15 ? perto : geral
  }
  fraseEntrada(c, distProx) {
    const atual = this.ins[c]
    const prox = this.ins[c + 1]
    if (!prox) return null
    const menorAviso = Math.min(...this.lim.avisos)
    if (distProx <= menorAviso * 1.3) {
      this.lim.avisos.forEach(l => this.falados.add(`${c + 1}:${l}`))
      return `Em ${distanciaFalada(distProx)}, ${prox.acao}`
    }
    const via = atual?.rua ? pela(atual.rua) : 'em frente'
    return `Siga ${via} por ${distanciaFalada(distProx)}`
  }
  atualizar(p, agora = Date.now()) {
    const falas = []
    let recalcular = false
    const s = this.snap(p)
    const fora = s ? s.dist : Infinity
    const precisaoRuim = p.precisao && p.precisao > 80
    if (fora > this.lim.fora && !precisaoRuim) this.foraCont++
    else if (fora <= this.lim.fora) this.foraCont = 0
    if (this.foraCont >= this.lim.leituras && agora - this.ultimoPedido > 15000 && !this.chegou) {
      recalcular = true
      this.ultimoPedido = agora
      this.foraCont = 0
    }
    if (s && fora <= this.lim.fora * 1.5) {
      this.progresso = Math.max(this.progresso - 20, s.percorrido)
    }
    let prox = this.prox
    while (prox < this.ins.length - 1 && this.ins[prox].noCaminho <= this.progresso + 3) prox++
    const mudouPasso = prox !== this.prox
    this.prox = prox
    const alvo = this.ins[prox]
    const distProx = Math.max(0, (alvo?.noCaminho ?? this.total) - this.progresso)
    const restanteM = Math.max(0, this.total - this.progresso)
    const fim = this.coords[this.coords.length - 1]
    const distFim = fim
      ? distanciaM(p, {
          lat: fim[0],
          lng: fim[1],
        })
      : Infinity
    if (
      !this.chegou &&
      (restanteM <= this.lim.chegou || (distFim <= this.lim.chegou && this.progresso > this.total * 0.5))
    ) {
      this.chegou = true
      const ultima = this.ins[this.ins.length - 1]
      falas.push({
        texto: ultima?.agora || 'Você chegou ao seu destino',
        urgente: true,
        chegada: true,
      })
    }
    if (!this.chegou && alvo) {
      const c = prox - 1
      if (c !== this.passoAnunciado && (mudouPasso || this.passoAnunciado === -1)) {
        this.passoAnunciado = c
        const frase = this.fraseEntrada(c, distProx)
        const intro = this.intro
        this.intro = ''
        const texto = [intro, frase ? capitalizar(frase) + '.' : ''].filter(Boolean).join(' ')
        if (texto)
          falas.push({
            texto,
            urgente: false,
          })
      } else {
        const tamPasso = alvo.noCaminho - (this.ins[c]?.noCaminho ?? 0)
        for (const l of this.lim.avisos) {
          const chave = `${prox}:${l}`
          if (this.falados.has(chave)) continue
          if (distProx <= l && distProx > this.lim.agora * 1.5 && tamPasso > l * 1.2) {
            this.lim.avisos.filter(x => x >= l).forEach(x => this.falados.add(`${prox}:${x}`))
            falas.push({
              texto: `Em ${distanciaFalada(distProx)}, ${alvo.acao}`,
              urgente: false,
            })
            break
          }
        }
        const chaveAgora = `${prox}:agora`
        if (
          alvo.tipo !== 'arrive' &&
          alvo.agora &&
          distProx <= this.lim.agora &&
          !this.falados.has(chaveAgora)
        ) {
          this.falados.add(chaveAgora)
          falas.push({
            texto: alvo.agora,
            urgente: true,
          })
        }
      }
    }
    const estado = {
      pos: s
        ? {
            lat: s.lat,
            lng: s.lng,
          }
        : {
            lat: p.lat,
            lng: p.lng,
          },
      bruta: {
        lat: p.lat,
        lng: p.lng,
      },
      rumoRota: s?.rumo ?? null,
      indice: s && fora <= this.lim.fora * 1.5 ? s.i : null,
      progresso: this.progresso,
      prox,
      distProx,
      restanteM,
      restanteS: this.total > 0 ? (this.rota.duracao || 0) * (restanteM / this.total) : 0,
      foraDaRota: fora,
      precisao: p.precisao ?? null,
      chegou: this.chegou,
    }
    return {
      estado,
      falas,
      recalcular,
      chegou: this.chegou && falas.some(f => f.chegada),
    }
  }
}
