import './lib/instalar'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ler } from './lib/storage'
import { registrarSW } from './lib/notificacoes'
import { iniciarPush } from './lib/push'
if (ler('kleo_tema', 'claro') === 'escuro') document.documentElement.setAttribute('data-tema', 'escuro')
registrarSW()
iniciarPush()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
