const MAX_LADO = 1024
export function paraDataURL(fonte, largura, altura) {
  const escala = Math.min(1, MAX_LADO / Math.max(largura, altura))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largura * escala)
  canvas.height = Math.round(altura * escala)
  canvas.getContext('2d').drawImage(fonte, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}
export function arquivoParaDataURL(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(new Error('Falha ao ler a imagem'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.onload = () => resolve(paraDataURL(img, img.width, img.height))
      img.src = leitor.result
    }
    leitor.readAsDataURL(arquivo)
  })
}
export function recortarQuadrado(dataURL, lado = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('Imagem inválida'))
    img.onload = () => {
      const menor = Math.min(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = lado
      c.height = lado
      c.getContext('2d').drawImage(
        img,
        (img.width - menor) / 2,
        (img.height - menor) / 2,
        menor,
        menor,
        0,
        0,
        lado,
        lado,
      )
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.src = dataURL
  })
}
export function reduzirImagem(fonte, { maxLado = 1280, qualidade = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const desenhar = src => {
      const img = new Image()
      img.onerror = () => reject(new Error('IMAGEM_INVALIDA'))
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width * escala))
        c.height = Math.max(1, Math.round(img.height * escala))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', qualidade))
      }
      img.src = src
    }
    if (typeof fonte === 'string') return desenhar(fonte)
    const leitor = new FileReader()
    leitor.onerror = () => reject(new Error('IMAGEM_INVALIDA'))
    leitor.onload = () => desenhar(leitor.result)
    leitor.readAsDataURL(fonte)
  })
}
export function dataURLParaBlob(dataURL) {
  const [cab, dados] = String(dataURL || '').split(',')
  const tipo = (cab.match(/^data:([^;]+)/) || [])[1] || 'image/jpeg'
  const bin = atob(dados || '')
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], {
    type: tipo,
  })
}
