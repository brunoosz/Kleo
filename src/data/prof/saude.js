import {
  Stethoscope,
  HeartPulse,
  Syringe,
  Smile,
  Brain,
  Activity,
  Apple,
  Pill,
  AudioLines,
  PawPrint,
} from 'lucide-react'
export default [
  {
    id: 'medico',
    label: 'Médico',
    categoria: 'saude',
    icone: Stethoscope,
    sinonimos: ['medica', 'doutor', 'clinico geral', 'medicina', 'plantonista'],
    mascote: {
      nome: 'Medix',
      genero: 'm',
      cor: '#bdf0dc',
      chapeu: 'nenhum',
      item: 'estetoscopio',
      oculos: 'redondo',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
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
          titulo: 'Apoio clínico',
          prompts: [
            {
              rotulo: 'Explicar ao paciente',
              modelo:
                'Explique este diagnóstico ou orientação para um paciente leigo, em linguagem simples, curta e acolhedora:\n\n{entrada}',
              placeholder: 'Ex: hipertensão e uso de losartana',
            },
            {
              rotulo: 'Resumir caso',
              modelo: 'Organize estas anotações em uma evolução clínica no formato SOAP:\n\n{entrada}',
              placeholder: 'Cole suas anotações',
            },
            {
              rotulo: 'Diagnóstico diferencial',
              modelo:
                'Liste diagnósticos diferenciais a considerar e exames úteis para este quadro (apoio educacional, não substitui julgamento clínico):\n\n{entrada}',
              placeholder: 'Descreva o quadro',
            },
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'imc',
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
    ],
    atalhos: [
      'Resuma as diretrizes atuais de hipertensão',
      'Como dar uma notícia difícil ao paciente?',
      'Me lembre de beber água durante o plantão',
      'Escreva um atestado de comparecimento modelo',
    ],
    dica: 'A Kleo organiza plantões e pacientes, resume casos e explica orientações em linguagem simples.',
  },
  {
    id: 'enfermeiro',
    label: 'Enfermeiro',
    categoria: 'saude',
    icone: HeartPulse,
    sinonimos: ['enfermeira', 'enfermagem', 'profissional de saude', 'saude', 'uti'],
    mascote: {
      nome: 'Bay',
      genero: 'm',
      cor: '#c4f2e4',
      chapeu: 'touca_medica',
      item: 'prancheta',
      oculos: 'nenhum',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Passagem de plantão',
          diario: true,
          itens: [
            'Sinais vitais registrados',
            'Medicações administradas e checadas',
            'Curativos realizados',
            'Balanço hídrico',
            'Intercorrências anotadas',
            'Pendências passadas à equipe',
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'regra_de_tres',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Medicação',
              min: 30,
            },
            {
              nome: 'Sinais vitais',
              min: 60,
            },
            {
              nome: 'Mudança de decúbito',
              min: 120,
            },
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio de enfermagem',
          prompts: [
            {
              rotulo: 'Evolução',
              modelo:
                'Redija uma evolução de enfermagem clara e técnica a partir destas anotações:\n\n{entrada}',
              placeholder: 'Cole suas anotações do paciente',
            },
            {
              rotulo: 'Orientação de alta',
              modelo: 'Escreva orientações de alta simples para o paciente e família sobre:\n\n{entrada}',
              placeholder: 'Ex: cuidados com curativo',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Como calcular gotejamento de soro?',
      'Resuma os 9 certos da administração de medicamentos',
      'Dicas para lidar com o estresse do plantão',
      'Me lembre de beber água no plantão',
    ],
    dica: 'A Kleo cuida da sua escala, calcula doses e lembra horários de medicação.',
  },
  {
    id: 'tecnico-enfermagem',
    label: 'Técnico de enfermagem',
    categoria: 'saude',
    icone: Syringe,
    sinonimos: ['tecnica de enfermagem', 'auxiliar de enfermagem', 'tec enfermagem'],
    mascote: {
      nome: 'Joy',
      genero: 'f',
      cor: '#b6ecd5',
      chapeu: 'touca_medica',
      item: 'seringa',
      oculos: 'nenhum',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Medicação',
              min: 30,
            },
            {
              nome: 'Sinais vitais',
              min: 60,
            },
            {
              nome: 'Glicemia',
              min: 120,
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Início de plantão',
          diario: true,
          itens: [
            'Conferir prescrições',
            'Checar carrinho de emergência',
            'Aferir sinais vitais',
            'Higienização das mãos',
            'Registrar no prontuário',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Procedimentos',
          itens: ['Medicações', 'Curativos', 'Punções'],
        },
      },
    ],
    atalhos: [
      'Quais os 5 momentos da higienização das mãos?',
      'Como aferir pressão corretamente?',
      'Como prevenir lesão por pressão?',
      'Me ajude a trocar plantão com um colega',
    ],
    dica: 'A Kleo avisa a hora de cada medicação e mantém o plantão organizado.',
  },
  {
    id: 'dentista',
    label: 'Dentista',
    categoria: 'saude',
    icone: Smile,
    sinonimos: ['odontologo', 'cirurgiao dentista', 'odontologia', 'ortodontista'],
    mascote: {
      nome: 'Dan',
      genero: 'm',
      cor: '#d2f5ea',
      chapeu: 'touca_medica',
      item: 'dente',
      oculos: 'protecao',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Pacientes',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Plano de tratamento',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Biossegurança do consultório',
          diario: true,
          itens: [
            'Autoclave testada',
            'Instrumentais embalados',
            'Superfícies desinfetadas',
            'EPIs disponíveis',
            'Descarte de perfurocortantes',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente odontológico',
          prompts: [
            {
              rotulo: 'Pós-operatório',
              modelo: 'Escreva orientações de pós-operatório simples para o paciente após:\n\n{entrada}',
              placeholder: 'Ex: extração de siso',
            },
            {
              rotulo: 'Mensagem de retorno',
              modelo: 'Escreva uma mensagem gentil de WhatsApp lembrando o paciente do retorno:\n\n{entrada}',
              placeholder: 'Nome, data e motivo',
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
      'Como explicar ao paciente a necessidade de canal?',
      'Ideias de posts sobre saúde bucal',
      'Orientações de higiene para quem usa aparelho',
      'Como reduzir faltas de pacientes?',
    ],
    dica: 'A Kleo monta planos de tratamento, lembra retornos e cuida do caixa do consultório.',
  },
  {
    id: 'psicologo',
    label: 'Psicólogo',
    categoria: 'saude',
    icone: Brain,
    sinonimos: ['psicologa', 'psicoterapeuta', 'terapeuta', 'psicologia'],
    mascote: {
      nome: 'Patrick',
      genero: 'm',
      cor: '#c9eee6',
      chapeu: 'nenhum',
      item: 'cerebro',
      oculos: 'redondo',
      roupa: 'lenco',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Pacientes',
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio ao atendimento',
          prompts: [
            {
              rotulo: 'Psicoeducação',
              modelo: 'Escreva um texto curto de psicoeducação, acolhedor e simples, sobre:\n\n{entrada}',
              placeholder: 'Ex: o que é ansiedade',
            },
            {
              rotulo: 'Exercício',
              modelo:
                'Sugira um exercício terapêutico prático (para fazer entre sessões) sobre:\n\n{entrada}',
              placeholder: 'Tema ou abordagem',
            },
            {
              rotulo: 'Organizar anotações',
              modelo:
                'Organize estas anotações de sessão em tópicos objetivos (sem dados identificáveis):\n\n{entrada}',
              placeholder: 'Cole suas anotações',
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
      'Técnicas de respiração para ensinar a pacientes ansiosos',
      'Como estruturar uma primeira sessão?',
      'Dicas de autocuidado para quem atende muitas pessoas',
      'Explique a TCC de forma simples',
    ],
    dica: 'A Kleo organiza pacientes e sessões e guia exercícios de respiração.',
  },
  {
    id: 'fisioterapeuta',
    label: 'Fisioterapeuta',
    categoria: 'saude',
    icone: Activity,
    sinonimos: ['fisio', 'fisioterapia', 'reabilitacao', 'rpg', 'pilates'],
    mascote: {
      nome: 'Rocky',
      genero: 'm',
      cor: '#b2ecd0',
      chapeu: 'nenhum',
      item: 'haltere',
      oculos: 'nenhum',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Pacientes',
        },
      },
      {
        id: 'treinos',
        config: {},
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar postura',
          prompt:
            'Analise a postura da pessoa na foto (vista anterior, lateral ou posterior). Aponte possíveis desalinhamentos e sugira exercícios gerais (apoio educacional).',
          dica: 'Pessoa em pé, corpo inteiro, fundo liso.',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'paradas',
        config: {},
      },
    ],
    atalhos: [
      'Monte uma série de exercícios para lombalgia',
      'Alongamentos para quem trabalha sentado',
      'Como orientar exercícios em casa para idosos?',
      'Explique ao paciente a importância da continuidade',
    ],
    dica: 'A Kleo avalia postura pela câmera, monta fichas de exercícios e organiza visitas domiciliares.',
  },
  {
    id: 'nutricionista',
    label: 'Nutricionista',
    categoria: 'saude',
    icone: Apple,
    sinonimos: ['nutricao', 'nutri', 'dieta', 'alimentacao saudavel'],
    mascote: {
      nome: 'Remy',
      genero: 'm',
      cor: '#d6f5c9',
      chapeu: 'nenhum',
      item: 'balanca',
      oculos: 'nenhum',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'receitas',
        config: {
          estilo: 'nutricao',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'imc',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Pacientes',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler rótulo',
          prompt:
            'Leia o rótulo nutricional da foto. Resuma calorias, açúcares, sódio, gorduras e ingredientes de atenção, e dê uma avaliação nutricional simples.',
          dica: 'Fotografe a tabela nutricional e a lista de ingredientes.',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de nutrição',
          prompts: [
            {
              rotulo: 'Cardápio',
              modelo: 'Monte um cardápio de 1 dia, prático e equilibrado, para:\n\n{entrada}',
              placeholder: 'Ex: 1800 kcal, vegetariano',
            },
            {
              rotulo: 'Lista de substituições',
              modelo: 'Crie uma lista de substituições alimentares equivalentes para:\n\n{entrada}',
              placeholder: 'Ex: pão francês',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Monte um cardápio semanal barato e saudável',
      'Lanches saudáveis para levar ao trabalho',
      'Como explicar índice glicêmico ao paciente?',
      'Ideias de conteúdo sobre alimentação para o Instagram',
    ],
    dica: 'A Kleo lê rótulos pela câmera, sugere receitas nutritivas e calcula IMC.',
  },
  {
    id: 'farmaceutico',
    label: 'Farmacêutico',
    categoria: 'saude',
    icone: Pill,
    sinonimos: ['farmaceutica', 'farmacia', 'drogaria', 'farmaceutico clinico'],
    mascote: {
      nome: 'Snape',
      genero: 'm',
      cor: '#c0f0e8',
      chapeu: 'nenhum',
      item: 'pilula',
      oculos: 'quadrado',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler receita ou caixa',
          prompt:
            'Leia a receita médica ou embalagem do medicamento na foto. Identifique princípio ativo, dose, posologia e alertas importantes. Sinalize trechos ilegíveis.',
          dica: 'Fotografe bem de perto, com boa luz.',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'regra_de_tres',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Medicamentos',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio farmacêutico',
          prompts: [
            {
              rotulo: 'Interações',
              modelo:
                'Liste possíveis interações medicamentosas relevantes entre (apoio educacional):\n\n{entrada}',
              placeholder: 'Ex: varfarina e ibuprofeno',
            },
            {
              rotulo: 'Orientar paciente',
              modelo:
                'Escreva orientações simples ao paciente sobre como usar este medicamento:\n\n{entrada}',
              placeholder: 'Nome e dose',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Quais medicamentos não devem ser tomados com leite?',
      'Como orientar o uso correto de antibióticos?',
      'Explique genérico vs similar vs referência',
      'Como armazenar insulina corretamente?',
    ],
    dica: 'A Kleo lê receitas pela câmera, checa interações e controla o estoque.',
  },
  {
    id: 'fonoaudiologo',
    label: 'Fonoaudiólogo',
    categoria: 'saude',
    icone: AudioLines,
    sinonimos: ['fono', 'fonoaudiologia', 'terapia da fala', 'audiologia'],
    mascote: {
      nome: 'Vox',
      genero: 'm',
      cor: '#c8f0dd',
      chapeu: 'fones',
      item: 'microfone',
      oculos: 'nenhum',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Pacientes',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio fonoaudiológico',
          prompts: [
            {
              rotulo: 'Lista de palavras',
              modelo:
                'Crie uma lista de 20 palavras e 5 frases para treino do fonema/tema abaixo, adequadas à idade indicada:\n\n{entrada}',
              placeholder: 'Ex: fonema /r/, 6 anos',
            },
            {
              rotulo: 'Orientar família',
              modelo: 'Escreva orientações simples para a família estimular em casa:\n\n{entrada}',
              placeholder: 'Ex: atraso de fala',
            },
          ],
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
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
      'Atividades lúdicas para estimular a fala',
      'Exercícios de aquecimento vocal para professores',
      'Como explicar a importância do teste da orelhinha?',
      'Sinais de alerta no desenvolvimento da linguagem',
    ],
    dica: 'A Kleo cria listas de palavras para terapia e orienta exercícios de respiração e voz.',
  },
  {
    id: 'veterinario',
    label: 'Veterinário',
    categoria: 'saude',
    icone: PawPrint,
    sinonimos: ['veterinaria', 'medico veterinario', 'clinica veterinaria', 'pet', 'animais'],
    mascote: {
      nome: 'Paws',
      genero: 'm',
      cor: '#d4f3d8',
      chapeu: 'nenhum',
      item: 'pata',
      oculos: 'nenhum',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'regra_de_tres',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar lesão',
          prompt:
            'Observe a lesão ou condição do animal na foto. Descreva o que vê, hipóteses possíveis e quando é urgente (apoio educacional, não substitui exame).',
          dica: 'Foto nítida e próxima, com boa luz.',
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio veterinário',
          prompts: [
            {
              rotulo: 'Calendário vacinal',
              modelo: 'Monte um calendário de vacinação e vermifugação para:\n\n{entrada}',
              placeholder: 'Ex: filhote de cão, 2 meses',
            },
            {
              rotulo: 'Orientar tutor',
              modelo: 'Escreva orientações simples e carinhosas ao tutor sobre:\n\n{entrada}',
              placeholder: 'Ex: pós-castração',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Alimentos tóxicos para cães e gatos',
      'Como acalmar animais ansiosos na consulta?',
      'Sinais de dor em gatos',
      'Escreva um lembrete de vacina para o tutor',
    ],
    dica: 'A Kleo calcula doses por peso, lembra vacinas e organiza seus tutores.',
  },
]
