import {
  ChefHat,
  CookingPot,
  Cake,
  Croissant,
  Coffee,
  Dumbbell,
  Activity,
  HeartPulse,
  Hand,
  Flower2,
} from 'lucide-react'
export default [
  {
    id: 'chef',
    label: 'Chef de cozinha',
    categoria: 'alimentacao',
    icone: ChefHat,
    sinonimos: ['chef', 'chefe de cozinha', 'sous chef', 'gastronomia', 'restaurante'],
    mascote: {
      nome: 'Linguini',
      genero: 'm',
      cor: '#ffe0b8',
      chapeu: 'chef',
      item: 'frigideira',
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
        id: 'calculadora',
        config: {
          tipo: 'markup',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Insumos da cozinha',
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Abertura da cozinha',
          diario: true,
          itens: [
            'Temperatura das geladeiras',
            'Mise en place pronto',
            'Etiquetas de validade',
            'Bancadas higienizadas',
            'Equipe uniformizada',
            'Conferir reservas do dia',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Cardápio e ficha técnica',
          prompts: [
            {
              rotulo: 'Ficha técnica',
              modelo:
                'Monte uma ficha técnica (ingredientes, quantidades por porção, rendimento, modo de preparo e custo estimado) para: {entrada}',
              placeholder: 'Nome do prato',
            },
            {
              rotulo: 'Descrição para cardápio',
              modelo: 'Escreva uma descrição curta e apetitosa para cardápio de: {entrada}',
              placeholder: 'Nome e ingredientes do prato',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Monte a ficha técnica de um risoto de cogumelos',
      'Como calcular o CMV de um prato?',
      'Sugira um menu degustação de 4 tempos',
      'Harmonização de vinho com peixe grelhado',
      'Como reduzir o desperdício na cozinha?',
    ],
    dica: 'A Kleo cria fichas técnicas, calcula o preço do prato e controla os insumos.',
  },
  {
    id: 'cozinheiro',
    label: 'Cozinheiro',
    categoria: 'alimentacao',
    icone: CookingPot,
    sinonimos: ['cozinheira', 'cozinha', 'auxiliar de cozinha', 'marmita', 'merendeira', 'quentinha'],
    mascote: {
      nome: 'Cook',
      genero: 'm',
      cor: '#ffd8c2',
      chapeu: 'chef',
      item: 'frigideira',
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
              nome: 'Ovo cozido',
              min: 10,
            },
            {
              nome: 'Macarrão',
              min: 9,
            },
            {
              nome: 'Frango no forno',
              min: 45,
            },
          ],
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Despensa',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'escala_receita',
        },
      },
    ],
    atalhos: [
      'Receita rápida com frango e batata',
      'Como dobrar esta receita para 20 pessoas?',
      'Quanto tempo cozinhar o feijão na pressão?',
      'Substituto para ovo em bolo',
      'Monte um cardápio de marmitas da semana',
    ],
    dica: 'A Kleo traz receitas, cuida dos tempos de cozimento e da sua despensa.',
  },
  {
    id: 'confeiteiro',
    label: 'Confeiteiro',
    categoria: 'alimentacao',
    icone: Cake,
    sinonimos: ['confeiteira', 'confeitaria', 'boleira', 'doceira', 'bolos', 'doces de festa'],
    mascote: {
      nome: 'Willy',
      genero: 'm',
      cor: '#ffc9e3',
      chapeu: 'chef',
      item: 'bolo',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'receitas',
        config: {
          estilo: 'doces',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'escala_receita',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de encomenda',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'markup',
        },
      },
    ],
    atalhos: [
      'Quanto cobrar por um bolo de 2 kg?',
      'Ajuste esta receita de brigadeiro para 200 unidades',
      'Como evitar que o chantilly desande no calor?',
      'Recheios que combinam com massa de chocolate',
      'Escreva uma mensagem confirmando a encomenda',
    ],
    dica: 'A Kleo ajusta receitas, calcula o preço e organiza suas encomendas.',
  },
  {
    id: 'padeiro',
    label: 'Padeiro',
    categoria: 'alimentacao',
    icone: Croissant,
    sinonimos: ['padeira', 'padaria', 'panificação', 'fermentação natural', 'pão'],
    mascote: {
      nome: 'Dough',
      genero: 'm',
      cor: '#f6dfb0',
      chapeu: 'chef',
      item: 'pao',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'receitas',
        config: {
          estilo: 'paes',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Autólise',
              min: 30,
            },
            {
              nome: 'Primeira fermentação',
              min: 90,
            },
            {
              nome: 'Dobras',
              min: 30,
            },
            {
              nome: 'Fermentação final',
              min: 60,
            },
            {
              nome: 'Forno',
              min: 25,
            },
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'escala_receita',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Fornadas',
          itens: ['Pão francês', 'Pão de forma', 'Pão doce', 'Fornadas'],
        },
      },
    ],
    atalhos: [
      'Calcule a porcentagem de padeiro desta receita',
      'Como alimentar o fermento natural?',
      'Por que meu pão ficou denso?',
      'Receita de pão francês para 100 unidades',
      'Temperatura ideal da água para a massa no verão',
    ],
    dica: 'A Kleo cronometra cada fase da massa, escala receitas e conta suas fornadas.',
  },
  {
    id: 'barista',
    label: 'Barista',
    categoria: 'alimentacao',
    icone: Coffee,
    sinonimos: ['cafeteria', 'café especial', 'latte art', 'atendente de café'],
    mascote: {
      nome: 'Brew',
      genero: 'm',
      cor: '#e8d3c0',
      chapeu: 'boina',
      item: 'xicara',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'cafe_proporcao',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Extração espresso',
              min: 0.5,
            },
            {
              nome: 'Coado (V60)',
              min: 3,
            },
            {
              nome: 'Prensa francesa',
              min: 4,
            },
            {
              nome: 'Cold brew',
              min: 720,
            },
          ],
        },
      },
      {
        id: 'receitas',
        config: {
          estilo: 'bebidas',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Abertura do balcão',
          diario: true,
          itens: [
            'Purgar e limpar a máquina',
            'Calibrar o moedor',
            'Testar o primeiro espresso',
            'Leite e insumos na validade',
            'Vitrine abastecida',
          ],
        },
      },
    ],
    atalhos: [
      'Proporção de café e água para coado',
      'Meu espresso está amargo: o que ajustar?',
      'Receita de cappuccino gelado',
      'Como vaporizar leite para latte art?',
      'Diferença entre torra clara e escura',
    ],
    dica: 'A Kleo calcula a proporção, cronometra a extração e traz receitas de bebidas.',
  },
  {
    id: 'personal-trainer',
    label: 'Personal trainer',
    categoria: 'alimentacao',
    icone: Dumbbell,
    sinonimos: ['personal', 'treinador', 'instrutor de academia', 'professor de academia', 'musculação'],
    mascote: {
      nome: 'Power',
      genero: 'm',
      cor: '#d2e534',
      chapeu: 'viseira',
      item: 'haltere',
      oculos: 'nenhum',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'treinos',
        config: {},
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Alunos',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'carga_treino',
        },
      },
      {
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Monte um treino ABC para iniciante',
      'Treino seguro para aluno com dor no joelho',
      'Como calcular a carga pelo 1RM?',
      'Exercícios para idosos melhorarem o equilíbrio',
      'Mensagem para cobrar a mensalidade com educação',
    ],
    dica: 'A Kleo monta fichas de treino, controla seus alunos e cronometra os descansos.',
  },
  {
    id: 'educador-fisico',
    label: 'Educador físico',
    categoria: 'alimentacao',
    icone: Activity,
    sinonimos: [
      'professor de educação física',
      'educação física',
      'profissional de educação física',
      'recreador',
    ],
    mascote: {
      nome: 'Motivo',
      genero: 'm',
      cor: '#bfe6f7',
      chapeu: 'bone',
      item: 'prancheta',
      oculos: 'nenhum',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Aulas',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Placar e chamada',
          itens: ['Time A', 'Time B', 'Presentes'],
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Planos de aula',
          prompts: [
            {
              rotulo: 'Plano de aula',
              modelo:
                'Crie um plano de aula de educação física (aquecimento, parte principal, volta à calma, materiais) para: {entrada}',
              placeholder: 'Ex: 5º ano, 40 min, coordenação',
            },
            {
              rotulo: 'Brincadeiras',
              modelo: 'Sugira 5 brincadeiras ou jogos com regras simples para: {entrada}',
              placeholder: 'Idade e espaço disponível',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Plano de aula de vôlei para o 8º ano',
      'Brincadeiras para dia de chuva na quadra',
      'Aquecimento de 10 minutos para turma grande',
      'Atividade física adaptada para aluno cadeirante',
      'Está quente demais para aula ao ar livre?',
    ],
    dica: 'A Kleo cria planos de aula, cronometra atividades e marca o placar.',
  },
  {
    id: 'fisiologista-exercicio',
    label: 'Fisiologista do exercício',
    categoria: 'alimentacao',
    icone: HeartPulse,
    sinonimos: ['fisiologia do exercício', 'avaliador físico', 'preparador físico', 'treinamento esportivo'],
    mascote: {
      nome: 'Banner',
      genero: 'm',
      cor: '#ffc8cc',
      chapeu: 'headset',
      item: 'coracao',
      oculos: 'quadrado',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'imc',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'carga_treino',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Pacientes',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Relatório de avaliação',
          prompts: [
            {
              rotulo: 'Laudo de avaliação',
              modelo:
                'Escreva um relatório de avaliação física claro e motivador, com interpretação e próximos passos, a partir destes dados: {entrada}',
              placeholder: 'Cole os dados da avaliação',
            },
            {
              rotulo: 'Zonas de treino',
              modelo:
                'Calcule as zonas de frequência cardíaca (método de Karvonen) e explique cada zona para: {entrada}',
              placeholder: 'Idade e FC de repouso',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Calcule as zonas de FC pelo método de Karvonen',
      'Como interpretar o VO2 máximo do aluno?',
      'Protocolo de teste de esteira para sedentário',
      'Diferença entre limiar aeróbio e anaeróbio',
      'Escreva o relatório desta avaliação física',
    ],
    dica: 'A Kleo calcula zonas e cargas, cronometra testes e escreve seus relatórios.',
  },
  {
    id: 'massoterapeuta',
    label: 'Massoterapeuta',
    categoria: 'alimentacao',
    icone: Hand,
    sinonimos: ['massagista', 'massagem', 'quick massage', 'drenagem linfática', 'terapeuta corporal'],
    mascote: {
      nome: 'Relax',
      genero: 'm',
      cor: '#e6dcff',
      chapeu: 'coque',
      item: 'folha',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Quick massage',
              min: 15,
            },
            {
              nome: 'Sessão relaxante',
              min: 50,
            },
            {
              nome: 'Drenagem',
              min: 60,
            },
            {
              nome: 'Pés',
              min: 20,
            },
          ],
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
    ],
    atalhos: [
      'Quais as contraindicações da massagem?',
      'Óleos essenciais indicados para relaxar',
      'Sequência de quick massage em 15 minutos',
      'Como cuidar das minhas mãos e punhos no trabalho?',
      'Escreva uma mensagem lembrando o cliente da sessão',
    ],
    dica: 'A Kleo agenda clientes, cronometra as sessões e guia uma respiração calma.',
  },
  {
    id: 'instrutor-yoga',
    label: 'Instrutor de yoga',
    categoria: 'alimentacao',
    icone: Flower2,
    sinonimos: ['yoga', 'professor de yoga', 'ioga', 'meditação', 'pilates'],
    mascote: {
      nome: 'Zenit',
      genero: 'm',
      cor: '#d9f0c8',
      chapeu: 'tiara_flor',
      item: 'tapete_yoga',
      oculos: 'nenhum',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'respiracao',
        config: {},
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Alunos',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Sequências e meditações',
          prompts: [
            {
              rotulo: 'Sequência de aula',
              modelo:
                'Monte uma sequência de yoga de 45 minutos (nome das posturas, tempo e adaptações) com foco em: {entrada}',
              placeholder: 'Ex: lombar, iniciantes',
            },
            {
              rotulo: 'Meditação guiada',
              modelo:
                'Escreva o texto de uma meditação guiada de 5 minutos, com frases curtas e calmas, sobre: {entrada}',
              placeholder: 'Ex: gratidão, sono',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Sequência de yoga para iniciantes com dor nas costas',
      'Yoga na cadeira para idosos',
      'Escreva uma meditação guiada para dormir',
      'Benefícios da respiração alternada',
      'Como adaptar a saudação ao sol para gestantes?',
    ],
    dica: 'A Kleo conduz respirações, cronometra posturas e cria sequências de aula.',
  },
]
