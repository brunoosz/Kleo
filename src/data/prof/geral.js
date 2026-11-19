import { GraduationCap, House, Armchair, User } from 'lucide-react'
export default [
  {
    id: 'estudante',
    label: 'Estudante',
    categoria: 'geral',
    icone: GraduationCap,
    sinonimos: ['aluno', 'aluna', 'universitário', 'vestibulando', 'concurseiro', 'escola', 'faculdade'],
    mascote: {
      nome: 'Capelito',
      genero: 'm',
      cor: '#d8d1ff',
      chapeu: 'capelo',
      item: 'livro',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'pomodoro',
        config: {
          foco: 25,
          pausa: 5,
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Ajuda nos estudos',
          prompts: [
            {
              rotulo: 'Explicar simples',
              modelo: 'Explique de forma simples, com um exemplo do dia a dia: {entrada}',
              placeholder: 'Ex: o que é derivada',
            },
            {
              rotulo: 'Resumo',
              modelo: 'Faça um resumo em tópicos curtos para revisar para a prova: {entrada}',
              placeholder: 'Cole o texto ou diga o tema',
            },
            {
              rotulo: 'Quiz',
              modelo: 'Crie 5 perguntas de múltipla escolha com gabarito comentado sobre: {entrada}',
              placeholder: 'Tema da prova',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Tirar dúvida pela foto',
          prompt:
            'Leia este exercício ou trecho de material e explique passo a passo como resolver, de forma didática, sem só dar a resposta.',
          dica: 'Fotografe o exercício ou a página',
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Aulas',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Tarefas da semana',
          itens: [
            'Revisar a matéria da semana',
            'Entregar trabalhos',
            'Ler o capítulo indicado',
            'Fazer exercícios',
          ],
        },
      },
    ],
    atalhos: [
      'Monte um cronograma de estudos para mim',
      'Explique um conceito de forma simples',
      'Crie um resumo para a prova',
      'Dicas para manter o foco',
      'Me faça 5 perguntas para treinar',
    ],
    dica: 'A Kleo explica a matéria, cria resumos e quizzes e guarda seu foco com o pomodoro.',
  },
  {
    id: 'lar',
    label: 'Do lar',
    categoria: 'geral',
    icone: House,
    sinonimos: ['dona de casa', 'dono de casa', 'cuida da casa', 'mãe', 'pai', 'família'],
    mascote: {
      nome: 'Larinho',
      genero: 'm',
      cor: '#ffe1c8',
      chapeu: 'bandana',
      item: 'casa',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'receitas',
        config: {
          estilo: 'geral',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Casa em ordem',
          diario: true,
          itens: [
            'Arrumar as camas',
            'Louça lavada',
            'Roupa na máquina',
            'Varrer a casa',
            'Tirar o lixo',
            'Planejar o jantar',
          ],
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Arroz',
              min: 18,
            },
            {
              nome: 'Feijão na pressão',
              min: 25,
            },
            {
              nome: 'Bolo no forno',
              min: 40,
            },
            {
              nome: 'Máquina de lavar',
              min: 60,
            },
          ],
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Despensa',
        },
      },
    ],
    atalhos: [
      'Monte um cardápio da semana',
      'Como organizar a casa em 15 minutos',
      'Dicas para economizar na conta de luz',
      'Receita rápida com o que tenho em casa',
      'Como tirar mancha de gordura da roupa?',
    ],
    dica: 'A Kleo planeja refeições, organiza a casa e cuida das contas do mês.',
  },
  {
    id: 'aposentado',
    label: 'Aposentado',
    categoria: 'geral',
    icone: Armchair,
    sinonimos: ['aposentada', 'pensionista', 'terceira idade', 'melhor idade', 'idoso', 'inss'],
    mascote: {
      nome: 'Vovozinho',
      genero: 'm',
      cor: '#e3dcff',
      chapeu: 'cabelo_branco',
      item: 'bengala',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Meu dia',
          diario: true,
          itens: [
            'Tomar os remédios da manhã',
            'Beber água',
            'Caminhar um pouco',
            'Ligar para alguém querido',
            'Tomar os remédios da noite',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler para mim',
          prompt:
            'Leia o texto desta foto (receita, bula, conta, carta ou rótulo) e explique em frases curtas e muito simples o que é importante. Se for remédio, diga a dose e os horários.',
          dica: 'Fotografe o papel, a caixa ou a conta',
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
    ],
    atalhos: [
      'Quando cai minha aposentadoria este mês?',
      'Exercícios leves para fazer em casa',
      'Como evitar golpes pelo telefone e WhatsApp?',
      'Me lembre de tomar o remédio às 8 horas',
      'Ideias de passeios perto de casa',
    ],
    dica: 'A Kleo lembra seus remédios, lê papéis para você e ajuda a cuidar do dinheiro.',
  },
  {
    id: 'outro',
    label: 'Outro',
    categoria: 'geral',
    icone: User,
    sinonimos: ['outra', 'outra profissão', 'nenhuma', 'desempregado', 'procurando emprego', 'autônomo'],
    mascote: {
      nome: 'Kleo',
      genero: 'f',
      cor: '#d8d1ff',
      chapeu: 'nenhum',
      item: 'nenhum',
      oculos: 'nenhum',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Tarefas do dia',
          diario: true,
          itens: ['Planejar o dia', 'Beber água', 'Fazer uma pausa', 'Revisar amanhã'],
        },
      },
      {
        id: 'pomodoro',
        config: {
          foco: 25,
          pausa: 5,
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Ajuda rápida',
          prompts: [
            {
              rotulo: 'Escrever mensagem',
              modelo: 'Escreva uma mensagem educada e clara para esta situação: {entrada}',
              placeholder: 'Ex: pedir folga ao chefe',
            },
            {
              rotulo: 'Currículo',
              modelo: 'Melhore este resumo profissional para currículo, deixando-o curto e forte: {entrada}',
              placeholder: 'Cole sua experiência',
            },
            {
              rotulo: 'Explicar',
              modelo: 'Explique de forma simples: {entrada}',
              placeholder: 'Sua dúvida',
            },
          ],
        },
      },
      {
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Organize meu dia',
      'Me lembre de beber água',
      'Dicas de produtividade',
      'Me ajude a escrever uma mensagem',
      'Me ajude a montar um currículo',
    ],
    dica: 'A Kleo organiza seu dia, escreve mensagens e controla seu dinheiro.',
  },
]
