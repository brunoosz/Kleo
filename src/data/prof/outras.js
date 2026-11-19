import {
  Sparkles,
  Scissors,
  Brush,
  Gem,
  Shirt,
  Sofa,
  HeartHandshake,
  Baby,
  Languages,
  Compass,
} from 'lucide-react'
export default [
  {
    id: 'esteticista',
    label: 'Esteticista',
    categoria: 'outras',
    icone: Sparkles,
    sinonimos: ['estética', 'limpeza de pele', 'depiladora', 'designer de sobrancelha', 'cosmetóloga'],
    mascote: {
      nome: 'Glow',
      genero: 'f',
      cor: '#ffd3e6',
      chapeu: 'laco',
      item: 'esmalte',
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
        id: 'camera_ia',
        config: {
          titulo: 'Analisar pele',
          prompt:
            'Observe esta foto de pele e descreva de forma cuidadosa: tipo de pele provável, oleosidade, manchas, acne ou ressecamento visíveis e cuidados estéticos indicados. Recomende dermatologista se houver algo suspeito.',
          dica: 'Fotografe com luz natural, sem maquiagem',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Máscara facial',
              min: 15,
            },
            {
              nome: 'Vapor',
              min: 8,
            },
            {
              nome: 'Limpeza de pele',
              min: 60,
            },
          ],
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Produtos',
        },
      },
    ],
    atalhos: [
      'Protocolo de limpeza de pele passo a passo',
      'Cuidados após depilação com cera',
      'Ativos indicados para pele oleosa',
      'Como montar um pacote de serviços atrativo?',
      'Mensagem de pós-atendimento para a cliente',
    ],
    dica: 'A Kleo cuida da agenda de clientes, cronometra procedimentos e analisa a pele pela foto.',
  },
  {
    id: 'cabeleireiro',
    label: 'Cabeleireiro',
    categoria: 'outras',
    icone: Scissors,
    sinonimos: ['cabeleireira', 'salão de beleza', 'hair stylist', 'colorista', 'trancista'],
    mascote: {
      nome: 'Locks',
      genero: 'm',
      cor: '#f9c9f0',
      chapeu: 'coque',
      item: 'secador',
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
              nome: 'Pausa da coloração',
              min: 35,
            },
            {
              nome: 'Descoloração',
              min: 45,
            },
            {
              nome: 'Hidratação',
              min: 20,
            },
            {
              nome: 'Progressiva',
              min: 40,
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Sugerir corte',
          prompt:
            'Olhando este rosto e cabelo, sugira 3 cortes ou penteados que valorizam o formato do rosto e o tipo de fio, e uma tonalidade de cor que combine com a pele.',
          dica: 'Fotografe a cliente de frente, com o cabelo solto',
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'comissao',
        },
      },
    ],
    atalhos: [
      'Como chegar no loiro platinado com segurança?',
      'Corte que valoriza rosto redondo',
      'Diferença entre hidratação, nutrição e reconstrução',
      'Quanto cobrar por uma progressiva?',
      'Mensagem para encher a agenda numa semana fraca',
    ],
    dica: 'A Kleo marca o tempo da química, sugere cortes pela foto e soma seu caixa.',
  },
  {
    id: 'barbeiro',
    label: 'Barbeiro',
    categoria: 'outras',
    icone: Brush,
    sinonimos: ['barbearia', 'barber', 'corte masculino', 'barba'],
    mascote: {
      nome: 'Blade',
      genero: 'm',
      cor: '#c8daf7',
      chapeu: 'bone',
      item: 'navalha',
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
        id: 'contador',
        config: {
          rotulo: 'Atendimentos do dia',
          itens: ['Cortes', 'Barbas', 'Combos', 'Sobrancelhas'],
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'comissao',
        },
      },
    ],
    atalhos: [
      'Como fazer um degradê navalhado perfeito?',
      'Cortes masculinos em alta este ano',
      'Como montar um plano de assinatura na barbearia?',
      'Quanto pagar de comissão para o barbeiro parceiro?',
      'Cuidados para evitar foliculite na barba',
    ],
    dica: 'A Kleo conta seus atendimentos, calcula comissões e fecha o caixa do dia.',
  },
  {
    id: 'manicure',
    label: 'Manicure',
    categoria: 'outras',
    icone: Gem,
    sinonimos: ['pedicure', 'nail designer', 'unhas', 'alongamento de unhas', 'manicure e pedicure'],
    mascote: {
      nome: 'Nails',
      genero: 'f',
      cor: '#ffcfe0',
      chapeu: 'laco',
      item: 'esmalte',
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
        id: 'caixa',
        config: {},
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Esmaltes e materiais',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Biossegurança',
          diario: true,
          itens: [
            'Alicates esterilizados',
            'Lixas descartáveis novas',
            'Bancada higienizada',
            'Luvas e máscara',
            'Toalhas limpas',
          ],
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Cabine UV/LED',
              min: 1,
            },
            {
              nome: 'Molho das cutículas',
              min: 5,
            },
            {
              nome: 'Secagem',
              min: 10,
            },
          ],
        },
      },
    ],
    atalhos: [
      'Como esterilizar alicates corretamente?',
      'Tendências de cores de esmalte da estação',
      'Quanto cobrar por alongamento em gel?',
      'Como evitar descolamento do gel?',
      'Mensagem lembrando a cliente da manutenção',
    ],
    dica: 'A Kleo guarda suas clientes, controla os esmaltes e lembra a biossegurança.',
  },
  {
    id: 'costureiro',
    label: 'Costureiro',
    categoria: 'outras',
    icone: Shirt,
    sinonimos: ['costureira', 'alfaiate', 'modista', 'ajustes de roupa', 'confecção', 'estilista'],
    mascote: {
      nome: 'Lilo',
      genero: 'f',
      cor: '#e5d6ff',
      chapeu: 'nenhum',
      item: 'agulha',
      oculos: 'redondo',
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
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de costura',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'conversor_unidades',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Moldes e tecidos',
          prompts: [
            {
              rotulo: 'Quanto de tecido',
              modelo:
                'Estime quantos metros de tecido (largura 1,40 m e 1,50 m) são necessários para: {entrada}',
              placeholder: 'Ex: vestido midi manga curta tamanho 42',
            },
            {
              rotulo: 'Passo a passo',
              modelo: 'Explique o passo a passo de costura para: {entrada}',
              placeholder: 'Ex: barra italiana em calça social',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Identificar tecido',
          prompt:
            'Analise este tecido: tipo provável, composição, caimento, como costurar (agulha, linha, ponto) e como lavar.',
          dica: 'Fotografe o tecido de perto',
        },
      },
    ],
    atalhos: [
      'Quantos metros de tecido para uma saia godê?',
      'Como fazer uma barra invisível?',
      'Tabela de medidas femininas do 36 ao 50',
      'Quanto cobrar por ajuste de calça?',
      'Agulha certa para costurar jeans',
    ],
    dica: 'A Kleo anota medidas dos clientes, calcula o tecido e faz seus orçamentos.',
  },
  {
    id: 'designer-interiores',
    label: 'Designer de interiores',
    categoria: 'outras',
    icone: Sofa,
    sinonimos: ['decorador', 'decoração', 'design de interiores', 'home staging', 'ambientação'],
    mascote: {
      nome: 'Ambi',
      genero: 'm',
      cor: '#f5dcc8',
      chapeu: 'boina',
      item: 'paleta',
      oculos: 'quadrado',
      roupa: 'lenco',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Repaginar ambiente',
          prompt:
            'Analise este ambiente como um designer de interiores: estilo atual, pontos fortes e fracos, e proponha uma repaginação com paleta de cores, móveis, iluminação e 3 itens de decoração de baixo custo.',
          dica: 'Fotografe o ambiente inteiro, de um canto',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'area_m2',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Proposta de decoração',
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
          tipo: 'tinta',
        },
      },
    ],
    atalhos: [
      'Como deixar uma sala pequena parecer maior?',
      'Paleta de cores aconchegante para quarto',
      'Distância ideal entre sofá e TV',
      'Decoração acessível para idosos em casa',
      'Quanto cobrar por um projeto de decoração?',
    ],
    dica: 'A Kleo sugere repaginações pela foto, calcula medidas e monta sua proposta.',
  },
  {
    id: 'cuidador-idosos',
    label: 'Cuidador de idosos',
    categoria: 'outras',
    icone: HeartHandshake,
    sinonimos: [
      'cuidadora de idosos',
      'acompanhante de idoso',
      'cuidador',
      'home care',
      'técnico de cuidado',
    ],
    mascote: {
      nome: 'Amparo',
      genero: 'f',
      cor: '#ffd9cc',
      chapeu: 'nenhum',
      item: 'coracao',
      oculos: 'redondo',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Cuidados do dia',
          diario: true,
          itens: [
            'Remédios da manhã',
            'Café da manhã',
            'Higiene e banho',
            'Hidratação',
            'Almoço',
            'Remédios da tarde',
            'Caminhada ou exercício leve',
            'Jantar',
            'Remédios da noite',
          ],
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
          titulo: 'Ler receita ou remédio',
          prompt:
            'Leia esta receita médica ou caixa de remédio e explique de forma clara: nome do remédio, dose, horários e cuidados. Se algo estiver ilegível, diga para confirmar com o médico ou farmacêutico.',
          dica: 'Fotografe a receita ou a caixa do remédio',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Registro do dia',
          itens: ['Copos de água', 'Idas ao banheiro', 'Refeições completas'],
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
    ],
    atalhos: [
      'Como prevenir quedas em casa?',
      'Sinais de desidratação em idosos',
      'Atividades para estimular a memória',
      'Como dar banho com segurança em quem tem pouca mobilidade?',
      'O que fazer se a pessoa ficar confusa de repente?',
    ],
    dica: 'A Kleo lembra cada cuidado do dia e lê receitas e remédios pela câmera.',
  },
  {
    id: 'cuidador-infantil',
    label: 'Cuidador infantil',
    categoria: 'outras',
    icone: Baby,
    sinonimos: ['babá', 'baba', 'cuidadora infantil', 'berçarista', 'monitor infantil'],
    mascote: {
      nome: 'Cuddle',
      genero: 'f',
      cor: '#cfeaff',
      chapeu: 'laco',
      item: 'mamadeira',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina da criança',
          diario: true,
          itens: [
            'Café da manhã',
            'Brincadeira ao ar livre',
            'Almoço',
            'Soneca',
            'Lanche',
            'Banho',
            'Leitura',
            'Jantar',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Registro do bebê',
          itens: ['Mamadas', 'Fraldas trocadas', 'Sonecas'],
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Soneca',
              min: 60,
            },
            {
              nome: 'Mamadeira esfriar',
              min: 5,
            },
            {
              nome: 'Tempo de tela',
              min: 30,
            },
          ],
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
    ],
    atalhos: [
      'Brincadeiras para criança de 3 anos em casa',
      'O que fazer se a criança engasgar?',
      'Lanches saudáveis que criança gosta',
      'Como lidar com birra sem gritar?',
      'Quantas horas de sono por idade?',
    ],
    dica: 'A Kleo cuida da rotina da criança, registra mamadas e fraldas e sugere brincadeiras.',
  },
  {
    id: 'tradutor',
    label: 'Tradutor',
    categoria: 'outras',
    icone: Languages,
    sinonimos: ['tradutora', 'intérprete', 'interprete de libras', 'versão', 'legendagem'],
    mascote: {
      nome: 'Poly',
      genero: 'm',
      cor: '#c5d8ff',
      chapeu: 'headset',
      item: 'globo',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Revisão de tradução',
          prompts: [
            {
              rotulo: 'Revisar tradução',
              modelo:
                'Revise esta tradução apontando erros, falsos cognatos e sugestões mais naturais: {entrada}',
              placeholder: 'Cole original e tradução',
            },
            {
              rotulo: 'Glossário',
              modelo:
                'Monte um glossário bilíngue (português e inglês) com 15 termos técnicos da área de: {entrada}',
              placeholder: 'Ex: contratos de aluguel',
            },
            {
              rotulo: 'Adaptar tom',
              modelo:
                'Adapte este texto traduzido para um tom mais formal e natural para o público brasileiro: {entrada}',
              placeholder: 'Cole o texto',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Traduzir foto',
          prompt:
            'Transcreva o texto desta imagem e traduza para o português, mantendo a formatação. Indique o idioma original.',
          dica: 'Fotografe o documento, placa ou cardápio',
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
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de tradução',
        },
      },
    ],
    atalhos: [
      'Traduza este parágrafo mantendo o tom formal',
      'Falsos cognatos comuns em inglês',
      'Quanto cobrar por lauda de tradução?',
      'Como traduzir esta expressão idiomática?',
      'Diferença entre tradução juramentada e livre',
    ],
    dica: 'A Kleo traduz e revisa na hora, até textos de fotos, e calcula seus orçamentos.',
  },
  {
    id: 'guia-turistico',
    label: 'Guia turístico',
    categoria: 'outras',
    icone: Compass,
    sinonimos: ['guia de turismo', 'turismo', 'receptivo', 'guia de viagem', 'condutor de turismo'],
    mascote: {
      nome: 'Dora',
      genero: 'f',
      cor: '#d6f0c0',
      chapeu: 'palha',
      item: 'mapa',
      oculos: 'sol',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'paradas',
        config: {},
      },
      {
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Grupo',
          itens: ['Turistas presentes', 'No ônibus'],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Roteiros e histórias',
          prompts: [
            {
              rotulo: 'Roteiro',
              modelo: 'Monte um roteiro turístico com horários, deslocamentos e dicas para: {entrada}',
              placeholder: 'Ex: 1 dia no centro histórico de SP',
            },
            {
              rotulo: 'Contar a história',
              modelo: 'Conte a história e 3 curiosidades interessantes, em tom de guia, sobre: {entrada}',
              placeholder: 'Nome do lugar ou monumento',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Monte um roteiro de 1 dia no Rio de Janeiro',
      'Curiosidades sobre o Theatro Municipal',
      'Frases úteis em inglês e espanhol para o grupo',
      'Vai chover no passeio de amanhã?',
      'Como conduzir um grupo com idosos com segurança?',
    ],
    dica: 'A Kleo traduz, organiza as paradas do passeio e conta a história de cada lugar.',
  },
]
