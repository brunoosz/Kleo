import { ler, salvar, adicionarEvento, adicionarItemLista, hojeISO } from './storage'
import { adicionarRotina, lerRotinas, interpretarDias } from './rotinas'
import { getProfissao, getNecessidade } from '../data/profissoes'
import { getMascoteSpec, resolverMascote } from '../data/mascotes'
import { adicionarAlarme, agendaParaIA } from './alarmes'
import { ultimaBusca, lugaresParaIA, modoDe } from './lugares'
import { acharLocal, locaisParaIA } from './locais'
import { trabalhoDe } from '../data/trabalho'
import { redeParaIA } from './rede'
import { lerContatosEmergencia, formatarTelefone } from './emergencia'
import { compromissoLocal } from './compromisso'
import { textoPerfilParaIA } from './perfil'
import {
  integradaServe,
  verificarIntegrada,
  marcarIntegrada,
  estadoIntegrada,
  urlIaIntegrada,
  urlTranscricaoIntegrada,
} from './iaIntegrada'
;(function apagarChavesAntigas() {
  try {
    for (const k of ['kleo_ia', 'kleo_groq_key'])
      if (localStorage.getItem(k) !== null) localStorage.removeItem(k)
  } catch {}
})()
export const PROVEDOR_KLEO = {
  nome: 'IA da Kleo',
  rotulo: 'IA da Kleo (grátis, já incluída)',
}
const FUNCOES = ['chat', 'rapido', 'visao', 'navegacao', 'json']
const funcaoValida = funcao => (FUNCOES.includes(funcao) ? funcao : 'chat')
const TIMEOUT_INTEGRADA = 35000
export const TAMANHOS_RESPOSTA = [
  {
    id: 'curtas',
    rotulo: 'Curtas',
  },
  {
    id: 'detalhadas',
    rotulo: 'Detalhadas',
  },
]
export const tamanhoRespostas = () =>
  ler('kleo_ia_respostas', 'curtas') === 'detalhadas' ? 'detalhadas' : 'curtas'
export const temIA = (funcao = 'chat') => integradaServe(funcaoValida(funcao)) !== false
export const usandoIntegrada = (funcao = 'chat') => integradaServe(funcaoValida(funcao)) === true
export const temChaveGroq = () => temIA('chat')
export const temChavePropria = () => false
function modoSimplesAtivo(p) {
  const v = ler('kleo_modo_simples', null)
  if (v === true) return true
  if (v === false) return false
  return p?.necessidade === 'idoso' || p?.age === '60+'
}
function nomeProfissao(id) {
  try {
    return getProfissao(id)?.label || 'não informada'
  } catch {
    return 'não informada'
  }
}
export function modoTrabalho() {
  const v = ler('kleo_modo_trabalho', null)
  const p = ler('kleo_profile', {}) || {}
  const prof = v?.profissao || p.profissao
  return {
    ativo: !!v?.ativo && !!prof,
    profissao: prof || null,
  }
}
const GUIA_APP = `GUIA DO APP (você conhece o app por dentro e faz as coisas por ele)
A Kleo é a assistente da Kheo ("Mais autonomia. Mais liberdade."), feita para idosos, pessoas com deficiência e qualquer pessoa.
O DISPOSITIVO KHEO: aparelho de bolso com telinha onde aparece o mascote; módulo câmera em clipe (prende na roupa e enxerga pela pessoa); acessórios para o mascote; dock para carregar e deixar a Kleo em pé na mesa. O app no celular faz tudo isso também.
FUNÇÕES DO APP:
- Início (/home): resumo do dia, próximos lembretes e atalhos.
- Chat (/chat): conversa por texto ou voz (botão do microfone). Câmera no chat (/chat?camera=1): tira uma foto e você descreve, lê textos, rótulos, remédios, placas e valores.
- Mapa (/mapa): mapa moderno, busca de lugares e rotas nos modos A pé, Carro, Acessível (para cadeirantes), Ônibus e Metrô. O botão "Iniciar" começa a navegação com avisos de curva por voz. Tem simulação do trajeto e a Câmera guia (GPS + câmera descrevendo o caminho e obstáculos). Você mesma procura lugares perto da pessoa (BUSCAR) e monta a rota (NAVEGAR).
- Agenda (/agenda): compromissos por dia, consultas, aniversários.
- Pessoas (/pessoas): conversas com família e amigos por texto e mensagens de voz. Cada pessoa tem um @usuário para ser encontrada. Também guarda os contatos de emergência e tem o botão SOS.
- Notas e Listas (/notas): anotações e listas (mercado, farmácia, tarefas).
- Rotinas (/rotinas): lembretes que se repetem: remédios (horários e duração do tratamento), beber água, consultas e exercícios, com notificações. Aba Despertador (/rotinas?aba=despertador): despertadores que tocam com som na hora marcada; ao parar, você fala o resumo do dia.
- Trabalho / Profissão (/profissao): ferramentas, checklists e perguntas de especialista da profissão; dá para misturar profissões. MODO TRABALHO (botão de maleta no chat ou comando TRABALHO): você passa a agir como profissional daquela área.
- Ajustes (/configuracoes): conta (e-mail, senha, sair), tamanho das respostas, a voz de cada mascote, acessibilidade (fonte grande, alto contraste, modo escuro), modo simples, a barra inferior e a Memória da Kleo (/configuracoes?secao=memoria), onde a pessoa vê, escreve e apaga o que você sabe dela. A IA e as vozes já vêm prontas: ninguém precisa de chave.
REGRA DE OURO: NUNCA mande a pessoa usar outro aplicativo (Google Maps, Waze, WhatsApp, agenda do celular, despertador, bloco de notas...) quando o próprio app faz a tarefa. Faça você mesma com os comandos abaixo.`
export function systemPrompt(extra = '', { completo = true } = {}) {
  const p = ler('kleo_profile', {}) || {}
  const memoria = ler('kleo_memory', {}) || {}
  let nec
  try {
    nec = getNecessidade(p.necessidade)
  } catch {
    nec = null
  }
  const agora = new Date()
  const memTxt =
    Object.entries(memoria)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n') || '(nada ainda)'
  const listas = Object.keys(ler('kleo_listas', {}) || {}).join(', ') || '(nenhuma)'
  const extras = Array.isArray(p.profissoesExtras)
    ? p.profissoesExtras.map(nomeProfissao).filter(Boolean)
    : []
  let rotinasTxt = '(nenhuma)'
  try {
    const r = lerRotinas().filter(x => x.ativo)
    if (r.length)
      rotinasTxt = r
        .slice(0, 12)
        .map(x => `${x.titulo}${x.detalhe ? ' (' + x.detalhe + ')' : ''}`)
        .join(', ')
  } catch {}
  const simples = modoSimplesAtivo(p)
  let mascote = 'Kleo'
  try {
    mascote = getMascoteSpec(resolverMascote(p, ler('kleo_mascote', 'auto')))?.nome || 'Kleo'
  } catch {}
  const nome = String(p.name || '').trim()
  const primeiro = nome.split(' ')[0] || ''
  const uf = p.uf || p.estado || ''
  const cidade = p.city ? `${p.city}${uf ? ' - ' + uf : ''}` : uf || 'não informada'
  const adapt = []
  if (p.necessidade === 'visual')
    adapt.push(
      'A pessoa tem deficiência visual: respostas curtas e descritivas, sem depender de elementos visuais, pensadas para serem ouvidas.',
    )
  if (p.necessidade === 'auditiva')
    adapt.push('A pessoa tem deficiência auditiva: respostas claras em texto, sem referências a sons.')
  if (p.necessidade === 'cadeirante')
    adapt.push(
      'A pessoa é cadeirante: em lugares e trajetos priorize acessibilidade (rampas, elevadores, modo Acessível do mapa).',
    )
  if (p.necessidade === 'idoso' || p.age === '60+') adapt.push('A pessoa é idosa: tenha paciência e carinho.')
  if (simples)
    adapt.push(
      'MODO SIMPLES ligado: palavras do dia a dia, frases bem curtas, nada de termos técnicos ou em inglês. Um passo de cada vez.',
    )
  const busca = completo ? ultimaBusca() : null
  let redeTxt
  try {
    redeTxt = completo ? redeParaIA() : ''
  } catch {
    redeTxt = ''
  }
  const emergencia = lerContatosEmergencia()
  const pessoas = completo
    ? `
PESSOAS E MENSAGENS (aba Pessoas do app)
${redeTxt || '(a pessoa ainda não criou o perfil nas Conversas: para mandar mensagens, abra /pessoas)'}
Contatos de emergência: ${emergencia.length ? emergencia.map(c => `${c.nome}${c.telefone ? ' ' + formatarTelefone(c.telefone) : ''}${c.usuario ? ' @' + c.usuario : ''}`).join('; ') : 'nenhum cadastrado (sugira cadastrar em Pessoas)'}
MENSAGEM: contato | texto   -> manda uma mensagem de texto para um contato (o app dá 4 segundos para cancelar). Escreva o texto em primeira pessoa, como a própria pessoa escreveria, sem "ela disse".
AUDIO: contato              -> grava uma mensagem de voz para o contato (quando pedir "manda um áudio", "quero falar com", "liga pra"). Diga só "Pode falar, estou gravando para a Ana." e espere.
LER: contato ou todas       -> lê em voz alta as mensagens novas e toca os áudios.
EMERGENCIA: motivo          -> aciona a emergência: avisa os contatos de emergência com a localização e mostra os botões para ligar 192, 193 e 190.
Use EMERGENCIA quando a pessoa pedir socorro, disser que está passando mal, caiu, sente dor no peito, falta de ar ou está em perigo. Nesses casos fale pouco, com calma, e diga que já está avisando.
Se o contato não estiver na lista, diga que não encontrou e ofereça abrir Pessoas para adicionar (ABRIR: /pessoas). Se não souber o que escrever, pergunte antes de mandar.
EXEMPLOS:
- "manda mensagem pra Ana dizendo que chego às 8" -> "Mandando para a Ana: chego às 8." e: MENSAGEM: Ana | Chego às 8!
- "manda um áudio pro Carlos" -> "Pode falar, estou gravando para o Carlos." e: AUDIO: Carlos
- "tenho mensagem?" -> conte quem mandou e o resumo; se pedir para ouvir: LER: todas
- "socorro, estou passando mal" -> "Calma, já estou avisando seus contatos de emergência." e: EMERGENCIA: passando mal`
    : ''
  const navegacao = completo
    ? `
BUSCAR: tipo de lugar  -> procura os lugares desse tipo mais perto da pessoa (farmácia, mercado, hospital, padaria, banco, posto...). O app te devolve a lista.
NAVEGAR: nome | lat,lon | modo | acessivel   -> calcula o melhor trajeto, fala o tempo e abre o MAPA. Sem coordenadas: NAVEGAR: endereço ou lugar, cidade | modo
   modo: pe, carro, onibus ou metro. Acrescente "| acessivel" quando a pessoa usa cadeira de rodas, andador, tem dificuldade para andar ou pedir rota acessível: vale para qualquer meio (a pé: caminho sem escadas e com menos ladeiras; metrô: só estações com elevador; ônibus: ônibus com elevador).
ABRIR: rota           -> abre uma tela do app. Rotas: /home /agenda /notas /rotinas /rotinas?aba=despertador /pessoas /profissao /configuracoes /configuracoes?secao=memoria /mapa /chat?camera=1
COMO LEVAR A PESSOA A UM LUGAR (como um GPS que conversa, um passo por vez):
1. Pediu um TIPO de lugar ("farmácia mais perto", "quero ir no mercado"): diga só "Vou procurar as farmácias mais perto de você." e na última linha BUSCAR: farmácia. Não abra o mapa ainda. NUNCA invente nomes, endereços ou distâncias de lugares: você só sabe o que existe perto da pessoa depois de [RESULTADOS DA BUSCA]. Cada comando vai SOZINHO numa linha nova, nunca no meio de uma frase.
2. Ao receber [RESULTADOS DA BUSCA]: diga as opções numeradas, curtas, com nome e distância (ex: "1, Drogasil, a 300 metros. 2, Pague Menos, a 650 metros."), avise se está aberta ou fechada quando souber e diga que ela pode tocar numa opção ou dizer o número. As opções já aparecem na tela como botões.
3. Escolheu (ex: "a 1", "opção dois", "a Drogasil"): diga "Abrindo a Drogasil no mapa." e use NAVEGAR com o nome e as coordenadas da lista, SEM modo (se ela já disse o meio, inclua o modo). O mapa mostra o lugar e ela escolhe ali se vai e como vai. Se a pessoa é cadeirante ou pediu rota acessível, acrescente "| acessivel".
- Endereço ou lugar com nome ("avenida paulista", "shopping Ibirapuera"): pergunte o meio se não souber e use NAVEGAR: Avenida Paulista, São Paulo | metro
EXEMPLOS:
- "quero ir na farmácia" -> "Vou procurar as farmácias mais perto de você." e: BUSCAR: farmácia
- "a primeira" -> "Abrindo a Drogasil no mapa." e: NAVEGAR: Drogasil | -23.5612,-46.6558
- "me leva na Drogasil a pé" -> "Certo, vou montar a rota a pé até a Drogasil." e: NAVEGAR: Drogasil | -23.5612,-46.6558 | pe
- "abre minha agenda" -> "Abrindo sua agenda." e: ABRIR: /agenda
- "lê esse rótulo pra mim" -> "Abrindo a câmera. Aponte para o rótulo." e: ABRIR: /chat?camera=1${
        busca
          ? `

ÚLTIMA BUSCA DE LUGARES (use as coordenadas daqui quando ela escolher):
${lugaresParaIA(busca)}`
          : ''
      }${
        locaisParaIA()
          ? `

${locaisParaIA()}`
          : ''
      }`
    : ''
  const trab = modoTrabalho()
  let blocoTrabalho = ''
  if (trab.ativo) {
    const t = trabalhoDe(trab.profissao)
    blocoTrabalho = `
MODO TRABALHO ATIVO — profissão: ${nomeProfissao(trab.profissao)}.
${t.persona}
Fale como um(a) colega experiente dessa área: use o vocabulário da profissão, dê respostas técnicas, práticas e diretas, cite normas, protocolos, cálculos e boas práticas da área quando ajudar. Continue curto (o texto é falado); detalhe só se pedirem. ${simples ? 'Mesmo no modo trabalho, explique com palavras simples.' : ''}
Em saúde, direito, finanças e segurança: oriente com responsabilidade, não invente dados e diga quando é preciso um atendimento ou documento oficial.
Para sair do modo trabalho a pessoa pode pedir "sair do modo trabalho" (use TRABALHO: desligar).
`
  }
  let agendaTxt
  try {
    agendaTxt = agendaParaIA(7)
  } catch {
    agendaTxt = ''
  }
  const estilo =
    tamanhoRespostas() === 'detalhadas'
      ? 'ESTILO: suas respostas são FALADAS em voz alta. A pessoa prefere respostas DETALHADAS: explique com calma e por completo, em parágrafos curtos, com passos numerados quando ajudar, sem enrolar. Nada de markdown pesado.'
      : 'ESTILO: suas respostas são FALADAS em voz alta. Responda CURTO e natural (1 a 3 frases), como numa conversa. Sem listas longas nem markdown pesado. Só se estenda quando pedirem detalhes, passo a passo ou receitas.'
  let blocoPerfil
  try {
    blocoPerfil = textoPerfilParaIA(p, {
      mascote,
    })
  } catch {
    blocoPerfil = ''
  }
  if (!blocoPerfil) {
    blocoPerfil = `PERFIL DA PESSOA
- Nome: ${nome || 'desconhecido'}
- Gênero: ${p.gender === 'Outro' ? p.genderCustom || 'outro' : p.gender || 'não informado'}
- Faixa etária: ${p.age || 'não informada'}
- Cidade: ${cidade}
- Profissão principal: ${nomeProfissao(p.profissao)}${extras.length ? `\n- Outras profissões: ${extras.join(', ')}` : ''}
- Necessidade: ${nec ? nec.label : 'nenhuma'}
- Mascote atual: ${mascote}
- Modo simples: ${simples ? 'ligado' : 'desligado'}
${adapt.join('\n')}`
  }
  return `Você é a Kleo, assistente pessoal da Kheo${mascote !== 'Kleo' ? ` (agora com a aparência do mascote ${mascote}; pode se apresentar como ${mascote})` : ''}. Calorosa, direta, fala português do Brasil. Nunca use emojis.
${estilo}
Fórmulas, códigos, números longos, links e detalhes técnicos vão entre parênteses ou em bloco de código: a voz pula o que estiver entre ( ), [ ] ou em blocos de código, então a frase principal precisa fazer sentido sozinha.
${primeiro ? `Chame a pessoa pelo nome (${primeiro}) de vez em quando, sem exagero.` : 'Se ainda não souber o nome, pergunte com naturalidade.'} Adapte o jeito de falar ao perfil.
${completo ? '\n' + GUIA_APP + '\n' : ''}${blocoTrabalho}
${blocoPerfil}

O QUE VOCÊ JÁ SABE SOBRE A PESSOA (memória)
${memTxt}

Listas existentes: ${listas}
Rotinas ativas: ${rotinasTxt}
Agora: ${hojeISO(agora)} (${agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
  })}), ${agora.toTimeString().slice(0, 5)}

O QUE VEM POR AÍ
${agendaTxt || '(nada marcado)'}
LEMBRAR SEMPRE: quando a pessoa cumprimentar (bom dia, boa tarde, boa noite, oi, olá, tudo bem) ou perguntar do dia ou da semana, responda o cumprimento e JÁ lembre o que tem hoje e amanhã e qualquer consulta ou compromisso importante dos próximos dias, para ela se preparar (ex: "Bom dia! Lembrando que amanhã às 10h você tem médico."). Se houver mensagens novas, diga também quem mandou. Se não tiver nada, diga que o dia está livre. Não repita o mesmo lembrete em toda mensagem.

MEMÓRIA: quando a pessoa pedir para lembrar, guardar, salvar ou anotar algo, ou contar algo duradouro sobre ela (gostos, remédios que toma, nomes de familiares, médico, endereço, rotina do dia a dia), salve com MEMORIA. Coisa com data vai para AGENDA; coisa que se repete vai para ROTINA; pode usar vários comandos juntos.

COMANDOS ESPECIAIS — escreva cada um sozinho em uma linha no FINAL da resposta, só quando fizer sentido:
MEMORIA: chave: valor        -> quando aprender algo duradouro sobre a pessoa (ex: MEMORIA: remedio: losartana 8h)
AGENDA: titulo|YYYY-MM-DD|HH:MM|descricao   -> compromisso com data (consulta, reunião, aniversário)
LISTA: nome_da_lista|item    -> adicionar item a uma lista (ex: LISTA: mercado|leite). Um item por linha.
ROTINA: tipo|titulo|HH:MM,HH:MM|dias|duracaoDias|detalhe   -> lembrete que se repete (remédio, água, exercício).
  tipo: remedio, agua, consulta, exercicio ou personalizado. dias: todos, seg-sex, sab-dom ou lista como seg,qua,sex.
  duracaoDias é opcional (ex: 7 para um antibiótico de 7 dias; vazio = sem fim). detalhe é opcional (ex: 1 comprimido de 500mg).
  Para água use horários "cada 60" (a cada 60 minutos durante o dia). Ex: ROTINA: remedio|Amoxicilina|08:00,16:00,00:00|todos|7|1 cápsula
DESPERTADOR: HH:MM|rotulo|dias   -> despertador que TOCA com som (ex: "me acorda às 7h" -> DESPERTADOR: 07:00|Acordar|uma vez). dias: uma vez, todos, seg-sex ou lista como seg,qua.
TRABALHO: ligar | desligar        -> liga ou desliga o modo trabalho (quando pedir "modo trabalho", "modo profissional", "sair do modo trabalho").${navegacao}${pessoas}
Nunca explique os comandos. Confirme a ação em linguagem natural (ex: "Pronto, vou te lembrar do remédio às 8h e às 20h.").
${extra}`
}
const COMANDOS = [
  'MEMORIA',
  'AGENDA',
  'LISTA',
  'ROTINA',
  'NAVEGAR',
  'ABRIR',
  'BUSCAR',
  'DESPERTADOR',
  'TRABALHO',
  'MENSAGEM',
  'AUDIO',
  'LER',
  'EMERGENCIA',
]
export const ROTAS_ABRIR = [
  '/home',
  '/agenda',
  '/notas',
  '/rotinas',
  '/rotinas?aba=despertador',
  '/pessoas',
  '/profissao',
  '/configuracoes',
  '/configuracoes?secao=memoria',
  '/mapa',
  '/chat?camera=1',
]
const NOMES_ROTAS = {
  '/home': 'Início',
  '/agenda': 'Agenda',
  '/notas': 'Notas e listas',
  '/rotinas': 'Rotinas',
  '/profissao': 'Trabalho',
  '/configuracoes': 'Ajustes',
  '/mapa': 'Mapa',
  '/chat?camera=1': 'Câmera',
  '/rotinas?aba=despertador': 'Despertador',
  '/configuracoes?secao=memoria': 'Memória',
  '/pessoas': 'Pessoas',
}
const normalizarLinha = linha =>
  linha
    .trim()
    .replace(/^[-*>\s]+/, '')
    .replace(/[*_`]/g, '')
    .trim()
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const TIPOS_VALIDOS = ['remedio', 'agua', 'consulta', 'exercicio', 'personalizado']
function tipoRotina(t) {
  const n = semAcento(String(t || '').toLowerCase()).trim()
  if (TIPOS_VALIDOS.includes(n)) return n
  if (/remed|medic|comprim|capsul/.test(n)) return 'remedio'
  if (/agua|hidrat/.test(n)) return 'agua'
  if (/consult|medico|exame/.test(n)) return 'consulta'
  if (/exerc|caminh|trein|alongam/.test(n)) return 'exercicio'
  return 'personalizado'
}
const COMANDO_NO_MEIO = new RegExp(String.raw`\s*[([]\s*((?:${COMANDOS.join('|')})\s*:[^()[\]\n]*)[)\]]`, 'g')
const COMANDO_GRUDADO = new RegExp(
  String.raw`([^\n])[ \t]*(?<![A-Za-zÀ-ÿ])(MEM[OÓ]RIA|AGENDA|LISTA|ROTINA|NAVEGAR|ABRIR|BUSCAR|DESPERTADOR|TRABALHO|MENSAGEM|[AÁ]UDIO|LER|EMERG[EÊ]NCIA)\s*:`,
  'g',
)
export function semRepeticao(texto) {
  const t = String(texto || '').trim()
  const n = t.length
  if (n < 16) return t
  for (let k = Math.floor(n / 2) - 3; k <= Math.ceil(n / 2) + 3; k++) {
    if (k <= 0 || k >= n) continue
    const a = t.slice(0, k).trim()
    if (a.length >= 8 && a === t.slice(k).trim()) return a
  }
  return t
}
export function separarComandos(texto) {
  return semRepeticao(texto).replace(COMANDO_GRUDADO, '$1\n$2:')
}
export function processarComandos(resposta) {
  const acoes = []
  const linhas = separarComandos(resposta)
    .replace(COMANDO_NO_MEIO, '\n$1\n')
    .split('\n')
    .filter(linha => {
      const l = normalizarLinha(linha)
      const norm = semAcento(l)
      const depois = () => l.slice(l.indexOf(':') + 1).trim()
      if (/^MEMORIA\s*:/i.test(norm)) {
        const resto = depois()
        const i = resto.indexOf(':')
        const chave = i > 0 ? resto.slice(0, i).trim() : `nota_${Date.now()}`
        const valor = i > 0 ? resto.slice(i + 1).trim() : resto
        if (valor) {
          const salvo = ler('kleo_memory', {})
          const mem = salvo && typeof salvo === 'object' && !Array.isArray(salvo) ? salvo : {}
          mem[chave] = valor
          salvar('kleo_memory', mem)
          acoes.push({
            tipo: 'memoria',
            texto: i > 0 ? `Lembrei: ${chave}` : 'Guardei na memória',
          })
        }
        return false
      }
      if (/^AGENDA\s*:/i.test(norm)) {
        const [titulo, data, hora = '', descricao = ''] = depois()
          .split('|')
          .map(s => s.trim())
        if (titulo && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
          adicionarEvento({
            titulo,
            data,
            hora,
            descricao,
          })
          acoes.push({
            tipo: 'agenda',
            data,
            texto: `Agenda: ${titulo} em ${data.split('-').reverse().join('/')}${hora ? ' às ' + hora : ''}`,
          })
        }
        return false
      }
      if (/^LISTA\s*:/i.test(norm)) {
        const [nome, ...resto] = depois()
          .split('|')
          .map(s => s.trim())
        const item = resto.join(' ')
        if (nome && item) {
          const lista = adicionarItemLista(nome, item)
          acoes.push({
            tipo: 'lista',
            texto: `${item} adicionado em ${lista}`,
          })
        }
        return false
      }
      if (/^NAVEGAR\s*:/i.test(norm)) {
        const partes = depois()
          .split('|')
          .map(x => x.replace(/^["']|["'.]$/g, '').trim())
          .filter(Boolean)
        let lat = null,
          lon = null,
          modo = '',
          acessivel = false
        const resto = []
        for (const parte of partes) {
          const c = parte.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/)
          if (c) {
            lat = +c[1]
            lon = +c[2]
            if (lon > 0 && lon < 75) {
              lon = -lon
              if (lat > 6) lat = -lat
            }
            continue
          }
          if (resto.length && /^(acessivel|acessível|cadeirante|cadeira de rodas)$/i.test(parte)) {
            acessivel = true
            continue
          }
          const m = parte.length <= 14 ? modoDe(parte) : ''
          if (m && !modo && resto.length) {
            modo = m
            continue
          }
          resto.push(parte)
        }
        if (!modo && resto.length) {
          const pedacos = resto[resto.length - 1].split(',').map(x => x.trim())
          const ultimo = pedacos[pedacos.length - 1]
          const m = pedacos.length > 1 && ultimo.length <= 14 ? modoDe(ultimo) : ''
          if (m) {
            modo = m
            pedacos.pop()
            resto[resto.length - 1] = pedacos.join(', ')
          }
        }
        let destino = resto.filter(Boolean).join(', ')
        const salvo = lat === null ? acharLocal(destino) || acharLocal(resto[0] || '') : null
        if (salvo) {
          destino = salvo.nome
          lat = salvo.lat
          lon = salvo.lng
        }
        if (destino && !acoes.some(a => a.tipo === 'navegar')) {
          const q = new URLSearchParams({
            destino,
          })
          if (lat !== null) {
            q.set('lat', lat)
            q.set('lon', lon)
          }
          if (modo === 'acessivel') {
            modo = 'pe'
            acessivel = true
          }
          if (modo) q.set('modo', modo)
          if (acessivel) q.set('acessivel', '1')
          acoes.push({
            tipo: 'navegar',
            destino,
            lat,
            lon,
            modo,
            acessivel,
            rota: `/mapa?${q}`,
            texto: `Abrir no mapa: ${destino}`,
          })
        }
        return false
      }
      if (/^BUSCAR\s*:/i.test(norm)) {
        const termo = depois()
          .replace(/^["']|["'.]$/g, '')
          .trim()
        if (termo && !acoes.some(a => a.tipo === 'buscar'))
          acoes.push({
            tipo: 'buscar',
            termo,
            texto: `Procurando ${termo} perto de você`,
          })
        return false
      }
      if (/^MENSAGEM\s*:/i.test(norm)) {
        const [contato, ...resto] = depois()
          .split('|')
          .map(x => x.trim())
        const conteudo = resto
          .join(' | ')
          .replace(/^["“']|["”']$/g, '')
          .trim()
        if (contato && conteudo && !acoes.some(a => a.tipo === 'mensagem')) {
          acoes.push({
            tipo: 'mensagem',
            contato,
            conteudo,
            texto: `Mensagem para ${contato}`,
          })
        }
        return false
      }
      if (/^AUDIO\s*:/i.test(norm)) {
        const contato = depois().split('|')[0].trim()
        if (contato && !acoes.some(a => a.tipo === 'audio'))
          acoes.push({
            tipo: 'audio',
            contato,
            texto: `Áudio para ${contato}`,
          })
        return false
      }
      if (/^LER\s*:/i.test(norm)) {
        const contato = depois().split('|')[0].trim() || 'todas'
        if (!acoes.some(a => a.tipo === 'ler'))
          acoes.push({
            tipo: 'ler',
            contato,
            texto: 'Lendo as mensagens',
          })
        return false
      }
      if (/^EMERGENCIA\s*:/i.test(norm)) {
        if (!acoes.some(a => a.tipo === 'emergencia'))
          acoes.push({
            tipo: 'emergencia',
            motivo: depois(),
            texto: 'Emergência acionada',
          })
        return false
      }
      if (/^DESPERTADOR\s*:/i.test(norm)) {
        const [hora, rotulo = '', dias = ''] = depois()
          .split('|')
          .map(x => x.trim())
        const a = adicionarAlarme({
          hora,
          rotulo,
          dias,
        })
        if (a)
          acoes.push({
            tipo: 'despertador',
            rota: '/rotinas?aba=despertador',
            texto: `Despertador ${a.hora}${a.rotulo ? ' · ' + a.rotulo : ''}`,
          })
        return false
      }
      if (/^TRABALHO\s*:/i.test(norm)) {
        const v = semAcento(depois().toLowerCase())
        const ligar = !/deslig|sair|off|desativ|nao/.test(v)
        const atual = modoTrabalho()
        if (atual.profissao) {
          salvar('kleo_modo_trabalho', {
            ativo: ligar,
            profissao: atual.profissao,
          })
          acoes.push({
            tipo: 'trabalho',
            texto: ligar ? `Modo trabalho: ${nomeProfissao(atual.profissao)}` : 'Modo trabalho desligado',
          })
        }
        return false
      }
      if (/^ABRIR\s*:/i.test(norm)) {
        const bruta = depois()
          .split(/\s/)[0]
          .replace(/[.,;]+$/, '')
          .toLowerCase()
        const rota =
          ROTAS_ABRIR.find(r => r === bruta || r === '/' + bruta.replace(/^\/+/, '')) ||
          (bruta.includes('camera') ? '/chat?camera=1' : null)
        if (rota && !acoes.some(a => a.tipo === 'abrir' || a.tipo === 'navegar')) {
          acoes.push({
            tipo: 'abrir',
            rota,
            texto: `Abrir ${NOMES_ROTAS[rota] || rota}`,
          })
        }
        return false
      }
      if (/^ROTINA\s*:/i.test(norm)) {
        const [tipoBruto, titulo, horas = '', dias = 'todos', duracao = '', ...detalhe] = depois()
          .split('|')
          .map(s => s.trim())
        const tipo = tipoRotina(tipoBruto)
        const nova = {
          tipo,
          titulo: titulo || 'Lembrete',
          dias: interpretarDias(dias),
        }
        const cada = semAcento(horas.toLowerCase()).match(/cada\s*:?\s*(\d+)/)
        if (cada) {
          nova.intervaloMin = Math.max(15, Number(cada[1]))
          nova.horarios = []
        } else {
          nova.horarios = (horas.match(/\d{1,2}[:h]\d{2}|\b\d{1,2}h\b/gi) || []).map(h => {
            const [hh, mm = '00'] = h.toLowerCase().replace('h', ':').split(':')
            return `${String(Math.min(23, Number(hh))).padStart(2, '0')}:${(mm || '00').padStart(2, '0').slice(0, 2)}`
          })
        }
        const d = parseInt(duracao, 10)
        if (d > 0) nova.duracaoDias = d
        if (detalhe.length) nova.detalhe = detalhe.join(' ')
        if (titulo && (nova.horarios?.length || nova.intervaloMin)) {
          const r = adicionarRotina(nova)
          const quando = r.intervaloMin ? `a cada ${r.intervaloMin} min` : r.horarios.join(', ')
          acoes.push({
            tipo: 'rotina',
            id: r.id,
            texto: `Rotina: ${r.titulo} (${quando})`,
          })
        }
        return false
      }
      return true
    })
  return {
    texto: linhas.join('\n').trim(),
    acoes,
  }
}
export function ocultarComandos(texto) {
  const linhas = String(texto || '')
    .replace(COMANDO_GRUDADO, '$1\n$2:')
    .split('\n')
  const ultima = linhas.length - 1
  return linhas
    .filter((linha, i) => {
      const norm = semAcento(normalizarLinha(linha)).toUpperCase()
      if (!norm) return true
      if (COMANDOS.some(c => new RegExp(`^${c}\\s*:`).test(norm))) return false
      if (i === ultima && norm.length < 8 && COMANDOS.some(c => c.startsWith(norm.replace(/\s*:?$/, ''))))
        return false
      return true
    })
    .join('\n')
    .trim()
}
export class ErroIA extends Error {
  constructor(codigo, info = {}) {
    super(codigo)
    this.name = 'ErroIA'
    this.codigo = codigo
    Object.assign(this, info)
  }
}
const erroAborto = () => {
  try {
    return new DOMException('Cancelado', 'AbortError')
  } catch {
    const e = new Error('Cancelado')
    e.name = 'AbortError'
    return e
  }
}
const ERROS_SERVIDOR_KLEO = {
  IA_INTEGRADA_GRANDE: 'MUITO_GRANDE',
  IA_INTEGRADA_PEDIDO: 'REQUISICAO_INVALIDA',
}
function codigoIntegrada(s, codigoTexto) {
  if (/^IA_INTEGRADA_[A-Z_]+$/.test(codigoTexto)) return ERROS_SERVIDOR_KLEO[codigoTexto] || codigoTexto
  if (s === 404 || s === 405) return 'IA_INTEGRADA_INDISPONIVEL'
  if (s === 429) return 'IA_INTEGRADA_LIMITE'
  if (s === 413) return 'MUITO_GRANDE'
  if (s === 401 || s === 403) return 'IA_INTEGRADA_ORIGEM'
  if (s >= 500) return 'IA_INTEGRADA_FALHOU'
  return 'REQUISICAO_INVALIDA'
}
export function lerCorpoErro(texto) {
  let j = null
  try {
    j = JSON.parse(texto)
  } catch {}
  const e = j && typeof j === 'object' ? (j.error && typeof j.error === 'object' ? j.error : j) : {}
  const mensagem =
    (typeof e.message === 'string' && e.message) ||
    (typeof j?.error === 'string' && j.error) ||
    (j ? '' : String(texto || ''))
  return {
    detalhe: String(mensagem).replace(/\s+/g, ' ').trim().slice(0, 300),
    codigoTexto: typeof e.code === 'string' ? e.code : '',
  }
}
export function interpretarErro(status, texto, base = {}) {
  const c = lerCorpoErro(texto)
  const s = Number(status) || 0
  return new ErroIA(codigoIntegrada(s, c.codigoTexto), {
    ...base,
    status: s,
    detalhe: c.detalhe,
  })
}
async function erroDaResposta(r, base) {
  let texto = ''
  try {
    texto = await r.text()
  } catch {}
  return interpretarErro(r.status, texto, base)
}
const ERROS_CONFIG_IA = new Set([
  'SEM_CHAVE',
  'IA_INTEGRADA_DESLIGADA',
  'IA_INTEGRADA_INDISPONIVEL',
  'IA_INTEGRADA_CHAVE',
  'IA_INTEGRADA_ORIGEM',
])
export const ehErroDeConfiguracao = e => ERROS_CONFIG_IA.has(e?.message)
export function mensagemErro(e) {
  if (!e) return 'Tive um problema para responder. Tente novamente.'
  if (e.name === 'AbortError') return 'Resposta cancelada.'
  const det = e.detalhe ? ` Detalhe: ${String(e.detalhe).slice(0, 140)}` : ''
  switch (e.message) {
    case 'SEM_INTERNET':
      return 'Sem conexão com a internet no momento. Verifique o Wi-Fi ou os dados móveis.'
    case 'SEM_CHAVE':
    case 'IA_INTEGRADA_DESLIGADA':
    case 'IA_INTEGRADA_INDISPONIVEL':
      if (e.funcao === 'transcricao')
        return 'Áudio em texto indisponível agora. O áudio continua disponível para ouvir.'
      return 'A Kleo está indisponível no momento. Tente mais tarde.'
    case 'IA_INTEGRADA_LIMITE':
      return 'A IA grátis da Kleo está muito usada agora. Tente de novo em alguns minutos.'
    case 'IA_INTEGRADA_ORIGEM':
      return 'Este endereço não tem permissão para usar a IA da Kleo. Abra o app pelo site oficial.'
    case 'IA_INTEGRADA_CHAVE':
      return 'A Kleo está indisponível no momento. Tente mais tarde.'
    case 'IA_INTEGRADA_FALHOU':
    case 'SERVIDOR':
      return 'A IA da Kleo está instável agora. Tente de novo em instantes.'
    case 'TIMEOUT':
      return 'A IA da Kleo demorou demais para responder. Verifique sua internet e tente de novo.'
    case 'REDE_CORS':
      return 'Não consegui falar com a IA da Kleo. Verifique a internet e tente de novo.'
    case 'RESPOSTA_VAZIA':
      return 'A IA da Kleo respondeu vazio. Tente de novo com outras palavras.'
    case 'MUITO_GRANDE':
      return 'A mensagem ficou grande demais. Tente uma pergunta mais curta, uma foto menor ou limpe a conversa.'
    case 'REQUISICAO_INVALIDA':
      return `A IA da Kleo não aceitou esse pedido.${det}`
    case 'TRANSCRICAO_FALHOU':
      return 'Não consegui transformar o áudio em texto agora. O áudio continua disponível para ouvir.'
    default:
      if (e instanceof TypeError) return 'Sem conexão com a internet no momento.'
      return `Tive um problema para responder${e.status ? ` (erro ${e.status})` : ''}. Tente novamente.${det}`
  }
}
const textoDe = conteudo =>
  typeof conteudo === 'string'
    ? conteudo
    : Array.isArray(conteudo)
      ? conteudo
          .filter(p => p?.type === 'text')
          .map(p => p.text)
          .join('\n')
      : String(conteudo ?? '')
function montarRequisicao(req) {
  const msgs = [
    ...(req.system
      ? [
          {
            role: 'system',
            content: req.system,
          },
        ]
      : []),
    ...req.mensagens.filter(m => m && m.role !== 'system'),
  ]
  return {
    url: urlIaIntegrada(),
    corpo: {
      funcao: funcaoValida(req.funcao),
      messages: msgs,
      temperature: req.temperatura,
      max_tokens: req.maxTokens,
      stream: true,
    },
  }
}
export function removerPensamento(texto) {
  let t = String(texto || '').replace(/<think>[\s\S]*?<\/think>/gi, '')
  const aberto = t.search(/<think>/i)
  if (aberto >= 0) t = t.slice(0, aberto)
  const fecha = t.search(/<\/think>/i)
  if (fecha >= 0) t = t.slice(fecha + 8)
  t = t.replace(/<\/?t?h?i?n?k?$/i, m =>
    '<think>'.startsWith(m.toLowerCase()) || '</think>'.startsWith(m.toLowerCase()) ? '' : m,
  )
  return t.replace(/^\s+/, '')
}
async function lerSSE(resposta, { onDelta, vivo, base }) {
  const reader = resposta.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let texto = ''
  let visivel = ''
  const linha = bruta => {
    const l = bruta.replace(/\r$/, '')
    if (!l.startsWith('data:')) return null
    const dado = l.slice(5).trim()
    if (!dado) return null
    if (dado === '[DONE]') return 'fim'
    let j
    try {
      j = JSON.parse(dado)
    } catch {
      return null
    }
    if (j.type === 'error' || j.error) {
      const e = j.error || {}
      const msg = typeof e === 'string' ? e : e.message || 'erro no streaming'
      const tipo = String(e.code || e.type || e.status || '')
      const codigo = /^IA_INTEGRADA_[A-Z_]+$/.test(tipo)
        ? tipo
        : /rate|overloaded|429|resource_exhausted/i.test(tipo)
          ? 'LIMITE'
          : /auth|key/i.test(tipo)
            ? 'CHAVE_INVALIDA'
            : 'SERVIDOR'
      throw new ErroIA(codigo, {
        ...base,
        detalhe: msg,
      })
    }
    let delta = ''
    if (j.type) {
      if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') delta = j.delta.text || ''
      else if (j.type === 'message_stop') return 'fim'
    } else {
      const c = j.choices?.[0]
      const d = c?.delta?.content ?? c?.message?.content ?? c?.text ?? ''
      delta = typeof d === 'string' ? d : textoDe(d)
    }
    if (delta) {
      texto += delta
      const vis = removerPensamento(texto)
      if (vis !== visivel) {
        visivel = vis
        onDelta?.(vis, delta)
      }
    }
    return null
  }
  for (;;) {
    const { done, value } = await reader.read()
    vivo()
    if (done) break
    buf += dec.decode(value, {
      stream: true,
    })
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, i)
      buf = buf.slice(i + 1)
      if (linha(l) === 'fim') {
        reader.cancel().catch(() => {})
        return removerPensamento(texto)
      }
    }
  }
  buf += dec.decode()
  if (buf.trim()) linha(buf)
  return removerPensamento(texto)
}
function textoDoJSON(j) {
  if (Array.isArray(j?.content))
    return j.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
  const c = j?.choices?.[0]
  const d = c?.message?.content ?? c?.text ?? ''
  return typeof d === 'string' ? d : textoDe(d)
}
async function executar(req, { signal, onToken, timeoutMs = TIMEOUT_INTEGRADA } = {}) {
  const base = {
    provedor: 'kleo',
    modelo: 'auto',
    funcao: req.funcao,
  }
  if (signal?.aborted) throw erroAborto()
  const { url, corpo } = montarRequisicao(req)
  const limite = Math.max(timeoutMs || 0, TIMEOUT_INTEGRADA)
  const ctrl = new AbortController()
  let estourou = false
  let timer = null
  const vivo = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      estourou = true
      ctrl.abort()
    }, limite)
  }
  const repassar = () => ctrl.abort()
  signal?.addEventListener('abort', repassar, {
    once: true,
  })
  vivo()
  try {
    let r
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corpo),
        signal: ctrl.signal,
      })
    } catch (e) {
      if (signal?.aborted) throw erroAborto()
      if (estourou) throw new ErroIA('TIMEOUT', base)
      if (typeof navigator !== 'undefined' && navigator.onLine === false)
        throw new ErroIA('SEM_INTERNET', base)
      throw new ErroIA('REDE_CORS', {
        ...base,
        detalhe: e?.message,
      })
    }
    vivo()
    if (!r.ok) {
      const erro = await erroDaResposta(r, base)
      if (['IA_INTEGRADA_INDISPONIVEL', 'IA_INTEGRADA_DESLIGADA'].includes(erro.message)) {
        marcarIntegrada({
          ok: false,
          chat: false,
          visao: false,
          transcricao: false,
          motivo: erro.message,
        })
      }
      throw erro
    }
    let texto
    const tipo = r.headers.get('content-type') || ''
    if (tipo.includes('text/html')) {
      marcarIntegrada({
        ok: false,
        chat: false,
        visao: false,
        transcricao: false,
        motivo: 'sem-servidor',
      })
      throw new ErroIA('IA_INTEGRADA_INDISPONIVEL', base)
    }
    try {
      if (r.body && !tipo.includes('application/json')) {
        texto = await lerSSE(r, {
          onDelta: onToken,
          vivo,
          base,
        })
      } else {
        texto = removerPensamento(textoDoJSON(await r.json()))
        if (texto) onToken?.(texto, texto)
      }
    } catch (e) {
      if (e instanceof ErroIA) throw e
      if (signal?.aborted) throw erroAborto()
      if (estourou) throw new ErroIA('TIMEOUT', base)
      throw new ErroIA('REDE_CORS', {
        ...base,
        detalhe: 'Conexão interrompida durante a resposta.',
      })
    }
    if (!texto.trim()) throw new ErroIA('RESPOSTA_VAZIA', base)
    return texto
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', repassar)
  }
}
export async function perguntar(mensagens, opcoes = {}) {
  const {
    funcao = 'chat',
    extraSystem = '',
    system,
    temperatura = 0.7,
    maxTokens = 800,
    onToken,
    signal,
    timeoutMs,
    completo = funcao === 'chat',
  } = opcoes
  const f = funcaoValida(funcao)
  if (integradaServe(f) === null) await verificarIntegrada()
  else verificarIntegrada()
  if (integradaServe(f) === false && estadoIntegrada()?.motivo !== 'rede')
    throw new ErroIA('IA_INTEGRADA_INDISPONIVEL', {
      funcao: f,
      provedor: 'kleo',
    })
  const req = {
    mensagens: Array.isArray(mensagens)
      ? mensagens
      : [
          {
            role: 'user',
            content: String(mensagens),
          },
        ],
    system:
      system ??
      systemPrompt(extraSystem, {
        completo,
      }),
    temperatura,
    maxTokens,
    funcao: f,
  }
  try {
    return await executar(req, {
      onToken,
      signal,
      timeoutMs,
    })
  } catch (e) {
    if (e?.name === 'AbortError' || signal?.aborted) throw erroAborto()
    console.warn('[Kleo IA] a IA da Kleo falhou:', e?.message, e?.status || '', e?.detalhe || '')
    throw e
  }
}
export function perguntarGroq(mensagens, opcoes = {}) {
  return perguntar(mensagens, {
    ...opcoes,
    funcao: opcoes.funcao || (opcoes.json ? 'json' : 'rapido'),
  })
}
export async function conversar(textoUsuario, { onToken, extraSystem = '', signal, oculta = false } = {}) {
  const salvo = ler('kleo_chat_history', [])
  const historico = Array.isArray(salvo) ? salvo : []
  const msgs = historico
    .slice(-20)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map(m => ({
      role: m.role,
      content: m.paraIA || m.bruto || m.content,
    }))
  msgs.push({
    role: 'user',
    content: textoUsuario,
  })
  const bruto = await perguntar(msgs, {
    funcao: 'chat',
    maxTokens: tamanhoRespostas() === 'detalhadas' ? 1300 : 800,
    extraSystem,
    signal,
    onToken: onToken ? acum => onToken(ocultarComandos(acum)) : undefined,
  })
  const { texto, acoes } = processarComandos(bruto)
  const atual = ler('kleo_chat_history', [])
  const novo = [
    ...(Array.isArray(atual) ? atual : historico),
    {
      role: 'user',
      content: textoUsuario,
      ts: Date.now(),
      ...(oculta
        ? {
            oculta: true,
          }
        : {}),
    },
    {
      role: 'assistant',
      content: texto,
      bruto: semRepeticao(bruto),
      acoes,
      ts: Date.now() + 1,
    },
  ].slice(-20)
  salvar('kleo_chat_history', novo)
  return {
    texto,
    acoes,
  }
}
export async function analisarImagem(
  dataURL,
  pergunta,
  {
    funcao = 'visao',
    extraSystem = '',
    maxTokens = 700,
    signal,
    onToken,
    temperatura = 0.5,
    completo = false,
  } = {},
) {
  const instrucao =
    'Você está vendo uma foto tirada pela câmera da pessoa. Seja prático e útil: cite textos, valores, datas e riscos importantes.'
  return perguntar(
    [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: pergunta || 'Descreva o que você vê de forma útil para mim.',
          },
          {
            type: 'image_url',
            image_url: {
              url: dataURL,
            },
          },
        ],
      },
    ],
    {
      funcao,
      extraSystem: `${instrucao}\n${extraSystem}`,
      maxTokens,
      signal,
      onToken,
      temperatura,
      timeoutMs: 35000,
      completo,
    },
  )
}
export async function testarIntegrada() {
  const t0 = performance.now()
  try {
    await verificarIntegrada({
      forcar: true,
    })
    const resposta = await executar(
      {
        mensagens: [
          {
            role: 'user',
            content: 'Responda apenas: ok',
          },
        ],
        system: 'Responda apenas com a palavra ok.',
        temperatura: 0,
        maxTokens: 16,
        funcao: 'rapido',
      },
      {
        timeoutMs: TIMEOUT_INTEGRADA,
      },
    )
    return {
      ok: true,
      ms: Math.round(performance.now() - t0),
      resposta: resposta.trim(),
    }
  } catch (e) {
    return {
      ok: false,
      ms: Math.round(performance.now() - t0),
      erro: mensagemErro(e),
      codigo: e?.message,
    }
  }
}
export { estadoIntegrada, verificarIntegrada }
export const temTranscricao = () => integradaServe('transcricao') !== false
export async function transcreverAudio(blob, { signal } = {}) {
  if (integradaServe('transcricao') === null) await verificarIntegrada()
  if (integradaServe('transcricao') === false)
    throw new ErroIA('SEM_CHAVE', {
      funcao: 'transcricao',
    })
  return transcreverIntegrada(blob, {
    signal,
  })
}
async function transcreverIntegrada(blob, { signal } = {}) {
  const base = {
    provedor: 'kleo',
    funcao: 'transcricao',
  }
  let r
  try {
    r = await fetch(urlTranscricaoIntegrada(), {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/webm',
      },
      body: blob,
      signal,
    })
  } catch (e) {
    if (signal?.aborted) throw erroAborto()
    throw new ErroIA(
      typeof navigator !== 'undefined' && navigator.onLine === false ? 'SEM_INTERNET' : 'REDE_CORS',
      {
        ...base,
        detalhe: e?.message,
      },
    )
  }
  const tipo = r.headers.get('content-type') || ''
  if (!r.ok || !tipo.includes('json')) {
    const erro = r.ok ? new ErroIA('IA_INTEGRADA_INDISPONIVEL', base) : await erroDaResposta(r, base)
    if (['IA_INTEGRADA_INDISPONIVEL', 'IA_INTEGRADA_DESLIGADA'].includes(erro.message)) {
      marcarIntegrada({
        ok: false,
        chat: false,
        visao: false,
        transcricao: false,
        motivo: erro.message,
      })
    }
    throw erro
  }
  const j = await r.json().catch(() => ({}))
  return String(j?.texto || '').trim()
}
const PISTA_DATA =
  /\b(hoje|amanh[ãa]|depois de amanh[ãa]|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|fim de semana|semana que vem|m[êe]s que vem|dia \d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2} ?h\b|\d{1,2}:\d{2}|meio[- ]dia)/i
const PISTA_EVENTO =
  /\b(vamos|bora|vem|venha|marcar|marquei|marcad|encontr|almo[çc]|jant|caf[ée]|festa|anivers[áa]rio|reuni[ãa]o|consulta|exame|m[ée]dico|dentista|visita|passar a[íi]|passo a[íi]|te pego|buscar|levar|sair|cinema|missa|culto|viagem|churrasco|combinado|chego|chegar|chegando|vou a[íi]|vou passar)/i
export const pareceCompromisso = texto => PISTA_DATA.test(texto || '') && PISTA_EVENTO.test(texto || '')
export async function extrairCompromisso(texto, deQuem = '') {
  if (!pareceCompromisso(texto)) return null
  if (!temIA('json')) return compromissoLocal(texto, deQuem)
  const agora = new Date()
  const bruto = await perguntar(
    [
      {
        role: 'user',
        content: `Mensagem de ${deQuem || 'um contato'}: "${texto}"`,
      },
    ],
    {
      funcao: 'json',
      temperatura: 0.1,
      maxTokens: 160,
      system: `Hoje é ${hojeISO(agora)} (${agora.toLocaleDateString('pt-BR', {
        weekday: 'long',
      })}). Se a mensagem propõe ou confirma um compromisso com dia definido, responda só um JSON {"titulo":"curto, citando a pessoa (ex: Almoço com Ana)","data":"YYYY-MM-DD","hora":"HH:MM ou vazio"}. Se não houver compromisso com dia claro, responda {"titulo":""}. Nada fora do JSON.`,
    },
  )
  let j
  try {
    j = JSON.parse(String(removerPensamento(bruto)).match(/\{[\s\S]*\}/)?.[0] || '{}')
  } catch {
    return compromissoLocal(texto, deQuem)
  }
  if (!j.titulo || !/^\d{4}-\d{2}-\d{2}$/.test(j.data || '') || j.data < hojeISO(agora)) return null
  return {
    titulo: String(j.titulo).slice(0, 80),
    data: j.data,
    hora: /^\d{2}:\d{2}$/.test(j.hora || '') ? j.hora : '',
  }
}
