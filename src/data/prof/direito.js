import {
  Scale,
  Gavel,
  Landmark,
  BadgeCheck,
  Shield,
  Flame,
  ShieldHalf,
  Fingerprint,
  HardHat,
} from 'lucide-react'
export default [
  {
    id: 'advogado',
    label: 'Advogado',
    categoria: 'direito',
    icone: Scale,
    sinonimos: ['advogada', 'direito', 'juridico', 'causidico', 'oab'],
    mascote: {
      nome: 'Saul',
      genero: 'm',
      cor: '#c9d6f2',
      chapeu: 'nenhum',
      item: 'maleta',
      oculos: 'quadrado',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente jurídico',
          prompts: [
            {
              rotulo: 'Resumir processo',
              modelo:
                'Resuma estes autos/decisão em: partes, pedido, fundamentos, decisão e próximos prazos:\n\n{entrada}',
              placeholder: 'Cole o texto',
            },
            {
              rotulo: 'Explicar ao cliente',
              modelo:
                'Explique esta situação jurídica ao cliente em linguagem simples, sem juridiquês:\n\n{entrada}',
              placeholder: 'Descreva a situação',
            },
            {
              rotulo: 'Minuta',
              modelo: 'Redija uma minuta (estrutura e argumentos principais) de:\n\n{entrada}',
              placeholder: 'Tipo de peça e fatos',
            },
            {
              rotulo: 'Contar prazo',
              modelo:
                'Explique como contar este prazo processual (dias úteis, CPC) e qual a data final provável:\n\n{entrada}',
              placeholder: 'Ex: contestação, intimado em 03/11',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler documento',
          prompt:
            'Leia o contrato ou documento da foto. Resuma cláusulas principais e destaque pontos de risco ou abusivos.',
          dica: 'Fotografe uma página por vez, reta e legível.',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Como contar prazo em dias úteis no novo CPC?',
      'Explique a diferença entre recurso e agravo',
      'Como calcular honorários pela tabela da OAB?',
      'Escreva uma mensagem atualizando o cliente do processo',
    ],
    dica: 'A Kleo resume processos, traduz o juridiquês para o cliente e controla honorários.',
  },
  {
    id: 'juiz',
    label: 'Juiz',
    categoria: 'direito',
    icone: Gavel,
    sinonimos: ['juiza', 'magistrado', 'magistratura', 'desembargador'],
    mascote: {
      nome: 'Justus',
      genero: 'm',
      cor: '#bcc9ea',
      chapeu: 'nenhum',
      item: 'malhete',
      oculos: 'redondo',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio ao gabinete',
          prompts: [
            {
              rotulo: 'Relatório do caso',
              modelo: 'Elabore um relatório neutro e objetivo do caso a partir destes autos:\n\n{entrada}',
              placeholder: 'Cole os fatos e peças',
            },
            {
              rotulo: 'Pontos controvertidos',
              modelo: 'Identifique os pontos controvertidos e as provas necessárias:\n\n{entrada}',
              placeholder: 'Resumo das alegações',
            },
            {
              rotulo: 'Linguagem simples',
              modelo: 'Reescreva esta decisão em linguagem simples para o cidadão entender:\n\n{entrada}',
              placeholder: 'Cole o trecho da decisão',
            },
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Produtividade',
          itens: ['Sentenças', 'Decisões', 'Despachos', 'Audiências'],
        },
      },
      {
        id: 'pomodoro',
        config: {
          foco: 50,
          pausa: 10,
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
    ],
    atalhos: [
      'Resuma o que é o princípio da fundamentação',
      'Como organizar uma pauta de audiências',
      'Técnicas para leitura dinâmica de autos',
      'Explique a linguagem simples no Judiciário',
    ],
    dica: 'A Kleo resume autos, simplifica decisões para o cidadão e acompanha sua produtividade.',
  },
  {
    id: 'promotor',
    label: 'Promotor',
    categoria: 'direito',
    icone: Landmark,
    sinonimos: ['promotora', 'ministerio publico', 'procurador', 'mp'],
    mascote: {
      nome: 'Veritas',
      genero: 'm',
      cor: '#c4d3f0',
      chapeu: 'nenhum',
      item: 'livro',
      oculos: 'quadrado',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio à promotoria',
          prompts: [
            {
              rotulo: 'Analisar inquérito',
              modelo:
                'Analise este inquérito: fatos, indícios de autoria e materialidade, diligências faltantes:\n\n{entrada}',
              placeholder: 'Resumo do inquérito',
            },
            {
              rotulo: 'Roteiro de audiência',
              modelo: 'Monte um roteiro de perguntas para audiência com testemunha sobre:\n\n{entrada}',
              placeholder: 'Fatos a esclarecer',
            },
            {
              rotulo: 'Linha do tempo',
              modelo: 'Organize estes fatos em uma linha do tempo clara:\n\n{entrada}',
              placeholder: 'Cole os fatos',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Antes da audiência',
          itens: [
            'Autos revisados',
            'Testemunhas confirmadas',
            'Perguntas preparadas',
            'Provas organizadas',
            'Jurisprudência separada',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Manifestações',
          itens: ['Denúncias', 'Pareceres', 'Audiências'],
        },
      },
      {
        id: 'pomodoro',
        config: {
          foco: 45,
          pausa: 10,
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
    ],
    atalhos: [
      'Requisitos de uma denúncia (art. 41 CPP)',
      'Explique acordo de não persecução penal',
      'Como organizar estudos para o júri?',
      'Diferença entre arquivamento e absolvição',
    ],
    dica: 'A Kleo analisa inquéritos, monta linhas do tempo e prepara suas audiências.',
  },
  {
    id: 'delegado',
    label: 'Delegado',
    categoria: 'direito',
    icone: BadgeCheck,
    sinonimos: ['delegada', 'delegado de policia', 'policia civil', 'autoridade policial'],
    mascote: {
      nome: 'Jim',
      genero: 'm',
      cor: '#b8c9ec',
      chapeu: 'nenhum',
      item: 'distintivo',
      oculos: 'sol',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio à investigação',
          prompts: [
            {
              rotulo: 'Relatório final',
              modelo:
                'Estruture um relatório de inquérito (fatos, diligências, conclusão) a partir de:\n\n{entrada}',
              placeholder: 'Resumo da investigação',
            },
            {
              rotulo: 'Plano de diligências',
              modelo: 'Sugira um plano de diligências priorizado para investigar:\n\n{entrada}',
              placeholder: 'Descreva o caso',
            },
            {
              rotulo: 'Perguntas de oitiva',
              modelo: 'Liste perguntas objetivas e não indutivas para a oitiva sobre:\n\n{entrada}',
              placeholder: 'Fatos e papel do ouvido',
            },
          ],
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Auto de prisão em flagrante',
          itens: [
            'Comunicação ao juiz em 24h',
            'Nota de culpa entregue',
            'Comunicação à família/advogado',
            'Exame de corpo de delito',
            'Oitivas do condutor e testemunhas',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Registrar evidência',
          prompt:
            'Descreva objetivamente a cena ou objeto da foto para fins de registro: elementos visíveis, posições, marcas e detalhes relevantes.',
          dica: 'Fotografe com referência de escala e de vários ângulos.',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Procedimentos',
          itens: ['Boletins', 'Inquéritos instaurados', 'Flagrantes'],
        },
      },
    ],
    atalhos: [
      'Prazos do inquérito com preso e solto',
      'Como montar uma linha do tempo da investigação?',
      'Explique cadeia de custódia',
      'Técnicas de entrevista investigativa',
    ],
    dica: 'A Kleo planeja diligências, estrutura relatórios e organiza seus plantões.',
  },
  {
    id: 'policial',
    label: 'Policial',
    categoria: 'direito',
    icone: Shield,
    sinonimos: ['policia militar', 'pm', 'policial militar', 'policial civil', 'soldado', 'agente'],
    mascote: {
      nome: 'Patrol',
      genero: 'm',
      cor: '#a9c4f0',
      chapeu: 'quepe',
      item: 'distintivo',
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
        id: 'checklist',
        config: {
          titulo: 'Início de serviço',
          diario: true,
          itens: [
            'Colete balístico',
            'Armamento e munição conferidos',
            'Rádio e bateria',
            'Viatura inspecionada',
            'Algemas e lanterna',
            'Ciência das ocorrências do turno anterior',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio ao registro',
          prompts: [
            {
              rotulo: 'Histórico de ocorrência',
              modelo:
                'Redija um histórico de boletim de ocorrência objetivo, impessoal e em ordem cronológica a partir de:\n\n{entrada}',
              placeholder: 'Fatos da ocorrência',
            },
            {
              rotulo: 'Base legal',
              modelo: 'Indique o possível enquadramento legal (orientativo) para a conduta:\n\n{entrada}',
              placeholder: 'Descreva a conduta',
            },
          ],
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
      {
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
    ],
    atalhos: [
      'Como escrever um bom histórico de ocorrência?',
      'Técnicas de abordagem e verbalização',
      'Como lidar com o estresse após uma ocorrência difícil?',
      'Me lembre de me hidratar durante o patrulhamento',
    ],
    dica: 'A Kleo organiza a escala, ajuda no histórico de ocorrência e cuida do seu bem-estar.',
  },
  {
    id: 'bombeiro',
    label: 'Bombeiro',
    categoria: 'direito',
    icone: Flame,
    sinonimos: ['bombeira', 'corpo de bombeiros', 'brigadista', 'bombeiro civil', 'socorrista'],
    mascote: {
      nome: 'Ember',
      genero: 'm',
      cor: '#ffc4b8',
      chapeu: 'bombeiro',
      item: 'mangueira',
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
        id: 'checklist',
        config: {
          titulo: 'Conferência da viatura',
          diario: true,
          itens: [
            'EPI de combate completo',
            'Cilindros de ar cheios',
            'Mangueiras e esguichos',
            'Desencarcerador testado',
            'Kit de primeiros socorros',
            'Rádio e lanternas',
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
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio operacional',
          prompts: [
            {
              rotulo: 'Protocolo de socorro',
              modelo: 'Resuma o protocolo de atendimento pré-hospitalar (passo a passo) para:\n\n{entrada}',
              placeholder: 'Ex: vítima de queimadura',
            },
            {
              rotulo: 'Palestra de prevenção',
              modelo: 'Monte uma palestra curta de prevenção para a comunidade sobre:\n\n{entrada}',
              placeholder: 'Ex: incêndio em cozinha',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Passos do RCP em adulto',
      'Classes de incêndio e extintores corretos',
      'Como manter o condicionamento físico na escala 24x72?',
      'Sinais de insolação e o que fazer',
    ],
    dica: 'A Kleo confere a viatura, cronometra compressões e resume protocolos de socorro.',
  },
  {
    id: 'guarda-municipal',
    label: 'Guarda municipal',
    categoria: 'direito',
    icone: ShieldHalf,
    sinonimos: ['guarda civil', 'gcm', 'guarda civil metropolitana', 'agente de seguranca'],
    mascote: {
      nome: 'Steel',
      genero: 'm',
      cor: '#b5d2f5',
      chapeu: 'quepe',
      item: 'escudo',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'paradas',
        config: {},
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Ronda',
          itens: [
            'Equipamentos conferidos',
            'Rádio testado',
            'Pontos de ronda visitados',
            'Ocorrências registradas',
            'Passagem de serviço',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio ao serviço',
          prompts: [
            {
              rotulo: 'Relatório de ronda',
              modelo: 'Redija um relatório de ronda objetivo a partir destas anotações:\n\n{entrada}',
              placeholder: 'Anotações da ronda',
            },
            {
              rotulo: 'Orientar cidadão',
              modelo: 'Escreva uma orientação educada e simples ao cidadão sobre:\n\n{entrada}',
              placeholder: 'Assunto',
            },
          ],
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
    ],
    atalhos: [
      'Como mediar um conflito de vizinhos?',
      'Como orientar um idoso perdido na rua?',
      'Técnicas de comunicação não violenta',
      'O que registrar em um relatório de ronda?',
    ],
    dica: 'A Kleo organiza rondas e turnos, mostra o clima e ajuda nos relatórios.',
  },
  {
    id: 'perito-criminal',
    label: 'Perito criminal',
    categoria: 'direito',
    icone: Fingerprint,
    sinonimos: ['perita', 'pericia', 'criminalistica', 'perito', 'forense'],
    mascote: {
      nome: 'Dexter',
      genero: 'm',
      cor: '#c6cdf7',
      chapeu: 'nenhum',
      item: 'lupa',
      oculos: 'protecao',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Descrever vestígio',
          prompt:
            'Descreva tecnicamente o vestígio ou cena da foto: forma, dimensões estimadas, cor, padrão, posição relativa e o que mais deve ser coletado ou fotografado.',
          dica: 'Use escala métrica ao lado do vestígio.',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Cadeia de custódia',
          itens: [
            'Isolamento do local',
            'Fotografia geral, média e de detalhe',
            'Croqui da cena',
            'Coleta e acondicionamento',
            'Lacre numerado',
            'Registro de transferência',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio pericial',
          prompts: [
            {
              rotulo: 'Estrutura de laudo',
              modelo:
                'Estruture um laudo pericial (histórico, descrição, exames, discussão, conclusão) para:\n\n{entrada}',
              placeholder: 'Tipo de perícia e achados',
            },
            {
              rotulo: 'Quesitos',
              modelo: 'Responda de forma técnica e objetiva aos quesitos:\n\n{entrada}',
              placeholder: 'Cole os quesitos e dados',
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
        id: 'calculadora',
        config: {
          tipo: 'conversor_unidades',
        },
      },
    ],
    atalhos: [
      'Explique as etapas da cadeia de custódia',
      'Como fotografar uma cena de crime corretamente?',
      'Diferença entre vestígio, evidência e indício',
      'Como escrever uma conclusão de laudo clara?',
    ],
    dica: 'A Kleo descreve vestígios pela câmera, guia a cadeia de custódia e estrutura laudos.',
  },
  {
    id: 'tecnico-seguranca-trabalho',
    label: 'Técnico de segurança do trabalho',
    categoria: 'direito',
    icone: HardHat,
    sinonimos: ['tst', 'seguranca do trabalho', 'tecnico de seguranca', 'sesmt', 'cipa'],
    mascote: {
      nome: 'Safe',
      genero: 'm',
      cor: '#d2e0f7',
      chapeu: 'capacete_obra',
      item: 'prancheta',
      oculos: 'protecao',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Inspeção de segurança',
          prompt:
            'Inspecione a foto do ambiente de trabalho: identifique riscos (NRs aplicáveis), falta de EPIs/EPCs, condições inseguras e ações corretivas por prioridade.',
          dica: 'Fotografe a área de trabalho com as pessoas e equipamentos.',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Inspeção de EPIs',
          diario: true,
          itens: [
            'Capacetes com CA válido',
            'Calçados de segurança',
            'Protetores auriculares',
            'Luvas adequadas à tarefa',
            'Cintos para trabalho em altura (NR-35)',
            'Extintores sinalizados e dentro da validade',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Apoio ao SESMT',
          prompts: [
            {
              rotulo: 'DDS',
              modelo:
                'Escreva um DDS (diálogo diário de segurança) de 5 minutos, simples e envolvente, sobre:\n\n{entrada}',
              placeholder: 'Tema',
            },
            {
              rotulo: 'Análise de acidente',
              modelo:
                'Faça a análise deste acidente/quase acidente (causas imediatas, básicas e ações):\n\n{entrada}',
              placeholder: 'Descreva o ocorrido',
            },
            {
              rotulo: 'APR',
              modelo: 'Monte uma APR (análise preliminar de risco) em tabela para a tarefa:\n\n{entrada}',
              placeholder: 'Descreva a tarefa',
            },
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Indicadores',
          itens: ['Dias sem acidente', 'Quase acidentes', 'Inspeções feitas'],
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'obra',
        },
      },
    ],
    atalhos: [
      'Ideias de temas para o DDS da semana',
      'Quais NRs se aplicam a uma obra pequena?',
      'Como montar o mapa de riscos?',
      'Como organizar a SIPAT?',
    ],
    dica: 'A Kleo inspeciona riscos pela câmera, escreve DDS e acompanha os EPIs.',
  },
]
