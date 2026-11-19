import { createPortal } from 'react-dom'
function alvo() {
  let el = document.getElementById('kleo-camada')
  if (!el) {
    el = document.createElement('div')
    el.id = 'kleo-camada'
    ;(document.getElementById('root') || document.body).appendChild(el)
  }
  if (el.dataset.camada !== '1') {
    el.dataset.camada = '1'
    Object.assign(el.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      zIndex: '9000',
      isolation: 'isolate',
    })
  }
  return el
}
export default function Camada({ children }) {
  return createPortal(children, alvo())
}
