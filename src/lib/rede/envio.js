import { enviar, atualizarMensagem } from './index'
import { temTranscricao, transcreverAudio } from '../ia'
import { reduzirImagem, dataURLParaBlob } from '../imagem'
export const LIMITE_AUDIO = 5 * 1024 * 1024
export const LIMITE_IMAGEM = 5 * 1024 * 1024
export async function enviarTexto(outroUid, texto) {
  const t = String(texto || '').trim()
  if (!t) return null
  return enviar(outroUid, {
    tipo: 'texto',
    texto: t.slice(0, 4000),
  })
}
export async function enviarAudio(outroUid, { blob, duracao }) {
  if (!blob?.size) throw new Error('AUDIO_VAZIO')
  if (blob.size > LIMITE_AUDIO) throw new Error('AUDIO_GRANDE')
  const r = await enviar(outroUid, {
    tipo: 'audio',
    blob,
    duracao: Math.round(duracao),
  })
  await r.confirmado
  if (temTranscricao()) {
    transcreverAudio(blob)
      .then(t => {
        if (t)
          return atualizarMensagem(outroUid, r.id, {
            transcricao: t,
          })
      })
      .catch(() => {})
  }
  return r
}
export async function enviarImagem(outroUid, fonte) {
  const dataURL = await reduzirImagem(fonte)
  const blob = dataURLParaBlob(dataURL)
  if (!blob.size) throw new Error('IMAGEM_INVALIDA')
  if (blob.size > LIMITE_IMAGEM) throw new Error('IMAGEM_GRANDE')
  const r = await enviar(outroUid, {
    tipo: 'imagem',
    blob,
  })
  await r.confirmado
  return r
}
export async function enviarLocal(outroUid, { lat, lng, texto = '' }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('SEM_LOCAL')
  return enviar(outroUid, {
    tipo: 'local',
    lat,
    lng,
    texto: String(texto || '')
      .trim()
      .slice(0, 300),
  })
}
export function mensagemErroEnvio(e) {
  const m = e?.message
  if (m === 'IMAGEM_GRANDE') return 'A foto ficou grande demais. Tente outra foto.'
  if (m === 'IMAGEM_INVALIDA') return 'Não consegui abrir essa imagem. Escolha outra foto.'
  if (m === 'SEM_LOCAL')
    return 'Não consegui achar sua localização. Ligue o GPS e permita o acesso no cadeado ao lado do endereço.'
  if (m === 'AUDIO_GRANDE') return 'O áudio ficou grande demais. Grave até 5 minutos.'
  if (m === 'AUDIO_VAZIO') return 'Não ouvi nada. Toque no microfone e fale de novo.'
  if (m === 'AUDIO_FORMATO') return 'Este áudio não pôde ser enviado. Grave de novo, por favor.'
  if (m === 'REDE_DESLIGADA') return 'As Conversas ainda não estão ligadas. Abra Pessoas para começar.'
  if (m === 'SEM_PERFIL') return 'Crie seu perfil na aba Pessoas antes de mandar mensagens.'
  if (m === 'NAO_SAO_AMIGOS')
    return 'Vocês ainda não são amigos. Mande um pedido de amizade e espere a pessoa aceitar.'
  if (m === 'PESSOA_NAO_ENCONTRADA') return 'Essa pessoa não usa mais a Kleo.'
  if (m === 'BANCO_SEM_TABELAS')
    return 'O banco das Conversas ainda não foi preparado. Rode o arquivo supabase/schema.sql no Supabase.'
  if (m === 'CHAVE_INVALIDA') return 'Não consegui conectar às conversas agora. Tente de novo mais tarde.'
  if (m === 'SEM_PERMISSAO')
    return 'O servidor recusou a mensagem. Abra a conversa de novo e tente outra vez.'
  if (e?.name === 'NotAllowedError')
    return 'O microfone está bloqueado. Libere o microfone no cadeado ao lado do endereço.'
  if (e?.name === 'NotFoundError') return 'Não encontrei um microfone neste aparelho.'
  if (e?.name === 'NotSupportedError' || e?.name === 'NotReadableError')
    return 'Não consegui usar o microfone agora. Feche outros apps que usam o microfone e tente de novo.'
  if (e?.name === 'SecurityError') return 'O microfone só funciona em conexão segura (https).'
  return 'Não consegui enviar agora. Confira a internet e tente de novo.'
}
