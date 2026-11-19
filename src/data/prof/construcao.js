import {
  BrickWall,
  Droplets,
  PaintRoller,
  Hammer,
  Anvil,
  Flame,
  AirVent,
  Cog,
  Shovel,
  Trees,
} from 'lucide-react'
export default [
  {
    id: 'pedreiro',
    label: 'Pedreiro',
    categoria: 'construcao',
    icone: BrickWall,
    sinonimos: ['mestre de obras', 'ajudante de pedreiro', 'servente', 'obra', 'construção', 'azulejista'],
    mascote: {
      nome: 'Brick',
      genero: 'm',
      cor: '#f7c9a8',
      chapeu: 'capacete_obra',
      item: 'tijolo',
      oculos: 'nenhum',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'concreto',
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
          rotulo: 'Orçamento da obra',
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'obra',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar rachadura',
          prompt:
            'Analise esta rachadura ou parede como um mestre de obras: tipo de fissura, gravidade provável, possíveis causas e como corrigir. Avise se precisa de engenheiro.',
          dica: 'Fotografe a rachadura de perto e de longe',
        },
      },
    ],
    atalhos: [
      'Quantos sacos de cimento para 1 m³ de concreto?',
      'Quantos tijolos para uma parede de 3 x 2,8 m?',
      'Traço de argamassa para reboco',
      'Quanto cobrar por m² de contrapiso?',
      'Vai chover amanhã para concretar a laje?',
    ],
    dica: 'A Kleo calcula concreto e área, vê a chuva para a obra e faz seu orçamento.',
  },
  {
    id: 'encanador',
    label: 'Encanador',
    categoria: 'construcao',
    icone: Droplets,
    sinonimos: ['bombeiro hidráulico', 'hidráulica', 'instalador hidráulico', 'desentupidor'],
    mascote: {
      nome: 'Mario',
      genero: 'm',
      cor: '#a9d8f5',
      chapeu: 'bone',
      item: 'cano',
      oculos: 'nenhum',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento do serviço',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Identificar vazamento',
          prompt:
            'Analise esta foto de encanamento, registro, sifão ou mancha de umidade. Diga a provável origem do vazamento, a peça envolvida e o passo a passo de reparo.',
          dica: 'Fotografe o cano, a conexão ou a mancha',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Peças e conexões',
        },
      },
      {
        id: 'paradas',
        config: {},
      },
    ],
    atalhos: [
      'Como achar um vazamento escondido na parede?',
      'Diferença entre cano PVC soldável e roscável',
      'Qual a pressão ideal para chuveiro?',
      'Como desentupir pia sem produto químico?',
      'Quanto cobrar para trocar um registro?',
    ],
    dica: 'A Kleo identifica vazamentos pela foto, organiza visitas e faz seus orçamentos.',
  },
  {
    id: 'pintor',
    label: 'Pintor',
    categoria: 'construcao',
    icone: PaintRoller,
    sinonimos: ['pintor de parede', 'pintura', 'pintor predial', 'textura', 'grafiato'],
    mascote: {
      nome: 'Palette',
      genero: 'm',
      cor: '#ffd1e8',
      chapeu: 'bandana',
      item: 'rolo_pintura',
      oculos: 'nenhum',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'tinta',
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
          rotulo: 'Orçamento de pintura',
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'obra',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar parede',
          prompt:
            'Analise esta parede antes da pintura: mofo, descascamento, umidade, trincas. Diga o preparo necessário (lixa, massa, fundo, selador) e o tipo de tinta indicado.',
          dica: 'Fotografe a parede com boa luz',
        },
      },
    ],
    atalhos: [
      'Quantos litros de tinta para um quarto de 12 m²?',
      'Como tirar mofo antes de pintar?',
      'Diferença entre massa corrida e massa acrílica',
      'Quanto cobrar por m² de pintura?',
      'Posso pintar a fachada com tempo úmido?',
    ],
    dica: 'A Kleo calcula a tinta, avalia a parede pela câmera e monta seu orçamento.',
  },
  {
    id: 'marceneiro',
    label: 'Marceneiro',
    categoria: 'construcao',
    icone: Hammer,
    sinonimos: ['carpinteiro', 'moveleiro', 'marcenaria', 'móveis planejados', 'montador de móveis'],
    mascote: {
      nome: 'Gepeto',
      genero: 'm',
      cor: '#e8cfa6',
      chapeu: 'bone',
      item: 'serrote',
      oculos: 'protecao',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'conversor_unidades',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento do móvel',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Chapas e ferragens',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Plano de corte',
          prompts: [
            {
              rotulo: 'Lista de peças',
              modelo:
                'Monte a lista de peças (com medidas em mm) e ferragens para este móvel em MDF 15mm: {entrada}',
              placeholder: 'Ex: armário 80x200x40 com 2 portas',
            },
            {
              rotulo: 'Montagem',
              modelo: 'Explique a sequência de montagem passo a passo deste móvel: {entrada}',
              placeholder: 'Descreva o móvel',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Quantas chapas de MDF para um guarda-roupa?',
      'Qual dobradiça usar em porta de 60 cm?',
      'Como calcular o preço de um móvel planejado?',
      'Diferença entre MDF e MDP',
      'Como evitar lascar a chapa no corte?',
    ],
    dica: 'A Kleo monta listas de peças, controla chapas e ferragens e faz o orçamento.',
  },
  {
    id: 'serralheiro',
    label: 'Serralheiro',
    categoria: 'construcao',
    icone: Anvil,
    sinonimos: ['serralheria', 'portão', 'grade', 'esquadria', 'metalúrgico'],
    mascote: {
      nome: 'Forge',
      genero: 'm',
      cor: '#c7cff0',
      chapeu: 'bone',
      item: 'martelo',
      oculos: 'protecao',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'area_m2',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de serralheria',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Segurança na oficina',
          diario: true,
          itens: [
            'Óculos e protetor auricular',
            'Luvas de raspa',
            'Disco da esmerilhadeira em bom estado',
            'Extintor acessível',
            'Área livre de inflamáveis',
          ],
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
    ],
    atalhos: [
      'Quantos metros de metalon para um portão 3 x 2 m?',
      'Como calcular o peso de um portão de ferro?',
      'Quanto cobrar por m² de grade?',
      'Qual tinta usar para proteger da ferrugem?',
      'Medidas de corrimão pela norma de acessibilidade',
    ],
    dica: 'A Kleo calcula medidas, cuida da segurança na oficina e faz seus orçamentos.',
  },
  {
    id: 'soldador',
    label: 'Soldador',
    categoria: 'construcao',
    icone: Flame,
    sinonimos: ['solda', 'soldagem', 'caldeireiro', 'solda mig', 'solda tig', 'eletrodo'],
    mascote: {
      nome: 'Weld',
      genero: 'm',
      cor: '#ffc4a8',
      chapeu: 'bandana',
      item: 'tocha_solda',
      oculos: 'protecao',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Inspecionar solda',
          prompt:
            'Inspecione este cordão de solda: porosidade, mordedura, falta de fusão, respingos e uniformidade. Dê um parecer curto e o ajuste provável (corrente, velocidade, ângulo).',
          dica: 'Fotografe o cordão de perto e com luz',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Antes de soldar',
          itens: [
            'Máscara com filtro certo',
            'Luvas e avental de raspa',
            'Aterramento firme',
            'Área sem inflamáveis',
            'Ventilação ou exaustão',
            'Extintor por perto',
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'consumo_eletrico',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de solda',
        },
      },
    ],
    atalhos: [
      'Qual eletrodo usar para aço carbono fino?',
      'Amperagem certa para eletrodo 2,5 mm',
      'Como evitar porosidade na solda MIG?',
      'Diferença entre solda MIG, TIG e eletrodo',
      'Qual tonalidade de lente da máscara usar?',
    ],
    dica: 'A Kleo inspeciona sua solda pela câmera e lembra a segurança antes de começar.',
  },
  {
    id: 'instalador-ar',
    label: 'Instalador de ar-condicionado',
    categoria: 'construcao',
    icone: AirVent,
    sinonimos: ['refrigeração', 'técnico de refrigeração', 'climatização', 'split', 'ar condicionado'],
    mascote: {
      nome: 'Breeze',
      genero: 'm',
      cor: '#bfe9f7',
      chapeu: 'bone',
      item: 'engrenagem',
      oculos: 'nenhum',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'area_m2',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'consumo_eletrico',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Instalação de split',
          itens: [
            'Conferir BTUs do ambiente',
            'Disjuntor e fiação dedicados',
            'Furo com caimento para o dreno',
            'Flangear e apertar com torque',
            'Vácuo na tubulação',
            'Teste de vazamento',
            'Medir temperatura de saída',
          ],
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de instalação',
        },
      },
    ],
    atalhos: [
      'Quantos BTUs para um quarto de 15 m² com sol da tarde?',
      'Quanto tempo de vácuo na instalação?',
      'Por que o split está pingando dentro de casa?',
      'Quanto custa por mês um ar de 12.000 BTUs ligado 8 horas?',
      'Lembre o cliente da limpeza a cada 6 meses',
    ],
    dica: 'A Kleo calcula BTUs e consumo, segue o passo a passo da instalação e lembra seus clientes.',
  },
  {
    id: 'tecnico-manutencao',
    label: 'Técnico de manutenção',
    categoria: 'construcao',
    icone: Cog,
    sinonimos: ['manutenção predial', 'faz-tudo', 'zelador', 'marido de aluguel', 'manutenção industrial'],
    mascote: {
      nome: 'Fix',
      genero: 'm',
      cor: '#d9d3f7',
      chapeu: 'bone',
      item: 'chave_inglesa',
      oculos: 'nenhum',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Ronda de manutenção',
          diario: true,
          itens: [
            'Bombas e caixa d’água',
            'Iluminação das áreas comuns',
            'Extintores e hidrantes',
            'Portões e interfones',
            'Elevador sem ruído',
            'Vazamentos aparentes',
          ],
        },
      },
      {
        id: 'paradas',
        config: {},
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Materiais',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'O que é esse defeito?',
          prompt:
            'Analise este equipamento ou instalação com defeito. Identifique a peça, o problema provável e um passo a passo seguro de reparo. Avise se for necessário um especialista.',
          dica: 'Fotografe o equipamento ou a peça',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento',
        },
      },
    ],
    atalhos: [
      'Monte um plano de manutenção preventiva mensal',
      'Como trocar a resistência de um chuveiro com segurança?',
      'Por que o disjuntor fica desarmando?',
      'Como regular a boia da caixa d’água?',
      'Quanto cobrar por hora de serviço?',
    ],
    dica: 'A Kleo faz sua ronda diária, guarda os chamados e identifica defeitos pela câmera.',
  },
  {
    id: 'jardineiro',
    label: 'Jardineiro',
    categoria: 'construcao',
    icone: Shovel,
    sinonimos: ['jardinagem', 'cuidador de jardim', 'roçador', 'podador', 'manutenção de jardim'],
    mascote: {
      nome: 'Sprout',
      genero: 'm',
      cor: '#c5ecb4',
      chapeu: 'palha',
      item: 'regador',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'clima',
        config: {
          foco: 'agro',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Identificar planta',
          prompt:
            'Identifique esta planta e diga: nome popular, se está saudável, pragas ou doenças visíveis, frequência de rega, luz ideal e quando podar.',
          dica: 'Fotografe a folha e a planta inteira',
        },
      },
      {
        id: 'paradas',
        config: {},
      },
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
    ],
    atalhos: [
      'Qual a melhor época para podar roseira?',
      'Como acabar com formigas no jardim sem veneno forte?',
      'Adubo caseiro para plantas de vaso',
      'Preciso regar hoje ou vai chover?',
      'Quanto cobrar por manutenção mensal de jardim?',
    ],
    dica: 'A Kleo diz se vai chover, identifica plantas pela câmera e organiza suas visitas.',
  },
  {
    id: 'paisagista',
    label: 'Paisagista',
    categoria: 'construcao',
    icone: Trees,
    sinonimos: ['paisagismo', 'projeto de jardim', 'arquiteto paisagista', 'jardim vertical'],
    mascote: {
      nome: 'Bell',
      genero: 'f',
      cor: '#b8e3c8',
      chapeu: 'coroa_folhas',
      item: 'planta',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'area_m2',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Projeto de paisagismo',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ideias para o espaço',
          prompt:
            'Analise este espaço externo como um paisagista: insolação, solo, tamanho. Sugira um estilo de jardim e 6 plantas adequadas ao clima brasileiro, com porte e cuidados.',
          dica: 'Fotografe o quintal, a varanda ou o terreno',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'agro',
        },
      },
    ],
    atalhos: [
      'Plantas que aguentam sol forte o dia todo',
      'Ideias de jardim para varanda pequena',
      'Quantas mudas de grama para 50 m²?',
      'Plantas seguras para quem tem cachorro',
      'Como montar um jardim vertical simples?',
    ],
    dica: 'A Kleo sugere plantas pela foto do espaço, calcula áreas e monta a proposta.',
  },
]
