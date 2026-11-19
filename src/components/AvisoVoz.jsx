import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AudioLines, X } from 'lucide-react'
import Camada from './Camada'
import useConta from '../hooks/useConta'
import { verificarVozNatural, vozSemCota, vozAparelhoLiberada } from '../lib/voz'
export default function AvisoVoz() {
  const navigate = useNavigate()
  const { ehDono } = useConta()
  const [aviso, setAviso] = useState(null)
  const timer = useRef(null)
  const donoRef = useRef(ehDono)
  useEffect(() => {
    donoRef.current = ehDono
  })
  const mostrar = aparelho => {
    clearTimeout(timer.current)
    setAviso({
      id: Date.now(),
      dono: donoRef.current,
      aparelho,
    })
    timer.current = setTimeout(() => setAviso(null), 9000)
  }
  useEffect(() => {
    const aoAcabar = e => mostrar(!!e.detail?.aparelho)
    window.addEventListener('kleo-voz-sem-cota', aoAcabar)
    return () => {
      window.removeEventListener('kleo-voz-sem-cota', aoAcabar)
      clearTimeout(timer.current)
    }
  }, [])
  useEffect(() => {
    if (!ehDono) return
    let vivo = true
    verificarVozNatural({
      forcar: true,
    }).then(() => {
      if (vivo && vozSemCota() && !vozAparelhoLiberada()) mostrar(false)
    })
    return () => {
      vivo = false
    }
  }, [ehDono])
  if (!aviso) return null
  const titulo = aviso.dono ? 'A cota da voz natural acabou' : 'A voz da Kleo está descansando'
  const texto = aviso.dono
    ? aviso.aparelho
      ? 'A voz do aparelho já está ligada e entra no lugar.'
      : 'Toque para ligar a voz do aparelho em Ajustes.'
    : aviso.aparelho
      ? 'Por agora, a Kleo fala com a voz do aparelho.'
      : 'As respostas continuam aparecendo em texto.'
  const abrir = aviso.dono && !aviso.aparelho
  return (
    <Camada>
      <div style={styles.faixa}>
        <div key={aviso.id} role="status" aria-live="polite" className="anim-pop" style={styles.toast}>
          <button
            type="button"
            className="tap"
            style={styles.corpo}
            disabled={!abrir}
            onClick={() => {
              setAviso(null)
              navigate('/configuracoes?secao=vozes')
            }}
          >
            <span style={styles.icone} aria-hidden="true">
              <AudioLines size={22} color="#000" />
            </span>
            <span style={styles.textos}>
              <strong style={styles.titulo}>{titulo}</strong>
              <span style={styles.texto}>{texto}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAviso(null)}
            style={styles.fechar}
            aria-label="Fechar aviso"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </Camada>
  )
}
const styles = {
  faixa: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 955,
    display: 'flex',
    justifyContent: 'center',
    padding: 'max(10px, env(safe-area-inset-top)) 12px 0',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--surface)',
    borderRadius: 'var(--r-card-m)',
    padding: 8,
    boxShadow: 'var(--sombra), 0 12px 36px rgba(120, 100, 200, 0.22)',
  },
  corpo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'transparent',
    textAlign: 'left',
    padding: 4,
    color: 'var(--text)',
    cursor: 'pointer',
  },
  icone: {
    width: 46,
    height: 46,
    borderRadius: '30%',
    background: 'var(--lavanda)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 800,
  },
  texto: {
    fontSize: 14,
    color: 'var(--text-2)',
    lineHeight: 1.35,
  },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}
