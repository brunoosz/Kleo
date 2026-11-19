import {
  Palette,
  Camera,
  Video,
  Clapperboard,
  Megaphone,
  Newspaper,
  Share2,
  Smartphone,
  PenLine,
  Building2,
} from 'lucide-react'
export default [
  {
    id: 'designer-grafico',
    label: 'Designer gráfico',
    categoria: 'comunicacao',
    icone: Palette,
    sinonimos: ['designer', 'diagramador', 'ilustrador', 'artista gráfico', 'identidade visual', 'logo'],
    mascote: {
      nome: 'Vinci',
      genero: 'm',
      cor: '#f5c6e0',
      chapeu: 'boina',
      item: 'paleta',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'pomodoro',
        config: {
          foco: 50,
          pausa: 10,
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de criação',
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
          titulo: 'Briefing e ideias',
          prompts: [
            {
              rotulo: 'Organizar briefing',
              modelo:
                'Transforme estas anotações de um cliente em um briefing de design organizado (objetivo, público, tom, entregáveis, prazos): {entrada}',
              placeholder: 'Cole as anotações do cliente',
            },
            {
              rotulo: 'Paleta de cores',
              modelo:
                'Sugira 2 paletas de cores (com códigos HEX e o porquê) para uma marca assim: {entrada}',
              placeholder: 'Ex: padaria artesanal, aconchegante',
            },
            {
              rotulo: 'Responder feedback',
              modelo:
                'Escreva uma resposta educada e profissional para este feedback de cliente sobre um layout: {entrada}',
              placeholder: 'Cole o feedback do cliente',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar uma arte',
          prompt:
            'Analise esta peça gráfica como um diretor de arte: hierarquia visual, contraste, legibilidade, alinhamento e uso de cores. Dê 3 sugestões práticas e curtas.',
          dica: 'Fotografe ou envie um print do seu layout',
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
      'Como precificar um projeto de identidade visual?',
      'Sugira fontes que combinam para um cardápio elegante',
      'Quais as medidas de post e story do Instagram?',
      'Escreva uma proposta comercial curta para um logo',
      'Como explicar ao cliente por que menos é mais no design?',
    ],
    dica: 'A Kleo organiza briefings, sugere paletas e avalia suas artes pela câmera.',
  },
  {
    id: 'fotografo',
    label: 'Fotógrafo',
    categoria: 'comunicacao',
    icone: Camera,
    sinonimos: ['fotógrafa', 'fotografia', 'foto', 'ensaio', 'casamento', 'retratista'],
    mascote: {
      nome: 'Peter',
      genero: 'm',
      cor: '#c9e4f5',
      chapeu: 'bone',
      item: 'camera',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Equipamento para o ensaio',
          itens: [
            'Baterias carregadas',
            'Cartões de memória formatados',
            'Lentes limpas',
            'Flash e pilhas',
            'Rebatedor',
            'Tripé',
            'Roteiro de poses',
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
          rotulo: 'Orçamento de ensaio',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Analisar foto',
          prompt:
            'Analise esta fotografia como um fotógrafo experiente: composição, luz, foco, enquadramento e cor. Dê uma nota de 0 a 10 e 3 dicas curtas de melhoria e de edição.',
          dica: 'Envie uma foto do seu trabalho',
        },
      },
    ],
    atalhos: [
      'Qual o melhor horário para a golden hour hoje?',
      'Configuração de câmera para foto em ambiente escuro',
      'Ideias de poses para ensaio de casal',
      'Monte um contrato simples de ensaio fotográfico',
      'Como cobrar por um casamento pequeno?',
    ],
    dica: 'A Kleo vê o clima do ensaio, confere seu equipamento e analisa suas fotos.',
  },
  {
    id: 'videomaker',
    label: 'Videomaker',
    categoria: 'comunicacao',
    icone: Video,
    sinonimos: ['cinegrafista', 'filmmaker', 'filmagem', 'produtor de vídeo', 'operador de câmera'],
    mascote: {
      nome: 'Frame',
      genero: 'm',
      cor: '#ffd6a5',
      chapeu: 'bone',
      item: 'claquete',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Checklist de gravação',
          itens: [
            'Baterias e carregadores',
            'Cartões com espaço',
            'Microfone de lapela testado',
            'Iluminação',
            'Estabilizador ou tripé',
            'Autorização de imagem assinada',
            'Roteiro impresso',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Roteiro rápido',
          prompts: [
            {
              rotulo: 'Roteiro de vídeo',
              modelo:
                'Crie um roteiro curto com cenas, falas e planos de câmera para um vídeo sobre: {entrada}',
              placeholder: 'Ex: institucional de 60s para clínica',
            },
            {
              rotulo: 'Decupagem',
              modelo:
                'Faça a decupagem (lista de planos numerados com tipo de plano e ação) para esta cena: {entrada}',
              placeholder: 'Descreva a cena',
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
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de produção',
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
      'Monte um roteiro de vídeo institucional de 1 minuto',
      'Que planos usar para um vídeo de casamento?',
      'Como captar áudio limpo em ambiente barulhento?',
      'Quanto cobrar por diária de filmagem?',
      'Ideias de B-roll para restaurante',
    ],
    dica: 'A Kleo escreve roteiros, confere o equipamento e cronometra suas tomadas.',
  },
  {
    id: 'editor-video',
    label: 'Editor de vídeo',
    categoria: 'comunicacao',
    icone: Clapperboard,
    sinonimos: ['editor', 'edição', 'montador', 'pós-produção', 'motion'],
    mascote: {
      nome: 'Dead',
      genero: 'm',
      cor: '#d8d1ff',
      chapeu: 'fones',
      item: 'notebook',
      oculos: 'quadrado',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'pomodoro',
        config: {
          foco: 45,
          pausa: 10,
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Antes de exportar',
          itens: [
            'Áudio normalizado',
            'Legendas revisadas',
            'Correção de cor',
            'Créditos e logo',
            'Trilha licenciada',
            'Formato e resolução certos',
            'Backup do projeto',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Títulos e legendas',
          prompts: [
            {
              rotulo: 'Título e descrição',
              modelo: 'Crie 3 títulos chamativos e uma descrição para um vídeo sobre: {entrada}',
              placeholder: 'Assunto do vídeo',
            },
            {
              rotulo: 'Revisar legenda',
              modelo:
                'Revise ortografia e pontuação desta legenda, mantendo frases curtas para tela: {entrada}',
              placeholder: 'Cole a legenda',
            },
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
      'Qual a melhor configuração de exportação para o YouTube?',
      'Dicas para cortes mais dinâmicos em vídeo curto',
      'Como sincronizar áudio externo com o vídeo?',
      'Atalhos úteis do Premiere e do DaVinci',
      'Como cobrar por minuto de vídeo editado?',
    ],
    dica: 'A Kleo cuida das pausas, do checklist de exportação e escreve títulos e legendas.',
  },
  {
    id: 'publicitario',
    label: 'Publicitário',
    categoria: 'comunicacao',
    icone: Megaphone,
    sinonimos: ['publicidade', 'propaganda', 'marketing', 'agência', 'atendimento de agência'],
    mascote: {
      nome: 'Draper',
      genero: 'm',
      cor: '#e6f29a',
      chapeu: 'nenhum',
      item: 'microfone',
      oculos: 'quadrado',
      roupa: 'gravata',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Fábrica de ideias',
          prompts: [
            {
              rotulo: 'Slogans',
              modelo: 'Crie 5 slogans curtos e criativos para: {entrada}',
              placeholder: 'Ex: academia de bairro para idosos',
            },
            {
              rotulo: 'Conceito de campanha',
              modelo:
                'Proponha um conceito de campanha com nome, ideia central, 3 peças e canais para: {entrada}',
              placeholder: 'Produto e objetivo',
            },
            {
              rotulo: 'Persona',
              modelo: 'Descreva uma persona detalhada (dores, desejos, onde está) para: {entrada}',
              placeholder: 'Produto ou serviço',
            },
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'porcentagem',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'pomodoro',
        config: {
          foco: 25,
          pausa: 5,
        },
      },
    ],
    atalhos: [
      'Crie um slogan para uma padaria de bairro',
      'Como calcular o ROI de uma campanha?',
      'Monte uma apresentação de campanha em 5 slides',
      'Ideias de ação de marketing com baixo orçamento',
      'Explique funil de vendas de forma simples',
    ],
    dica: 'A Kleo gera slogans, conceitos de campanha e personas em segundos.',
  },
  {
    id: 'jornalista',
    label: 'Jornalista',
    categoria: 'comunicacao',
    icone: Newspaper,
    sinonimos: ['repórter', 'jornalismo', 'âncora', 'assessor de imprensa', 'apresentador'],
    mascote: {
      nome: 'Clark',
      genero: 'm',
      cor: '#bfe3d0',
      chapeu: 'boina',
      item: 'microfone',
      oculos: 'redondo',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Redação jornalística',
          prompts: [
            {
              rotulo: 'Lide',
              modelo:
                'Escreva um lide jornalístico (o quê, quem, quando, onde, como, por quê) a partir destes fatos: {entrada}',
              placeholder: 'Cole os fatos apurados',
            },
            {
              rotulo: 'Perguntas de entrevista',
              modelo: 'Sugira 8 perguntas objetivas e uma pergunta difícil para entrevistar: {entrada}',
              placeholder: 'Quem é o entrevistado e o tema',
            },
            {
              rotulo: 'Títulos',
              modelo: 'Crie 5 títulos jornalísticos curtos e sem sensacionalismo para: {entrada}',
              placeholder: 'Resumo da matéria',
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
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler documento',
          prompt:
            'Transcreva o texto principal deste documento ou anotação e destaque nomes, datas, números e informações importantes para uma reportagem.',
          dica: 'Fotografe um documento, cartaz ou anotação',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Checagem de fatos',
          itens: [
            'Fonte primária confirmada',
            'Nomes e cargos conferidos',
            'Datas e números conferidos',
            'Outro lado ouvido',
            'Imagens com crédito',
          ],
        },
      },
    ],
    atalhos: [
      'Escreva um lide com estes fatos',
      'Como checar se uma notícia é falsa?',
      'Perguntas para entrevistar um prefeito',
      'Resuma este texto em 3 linhas',
      'Diferença entre notícia, reportagem e artigo',
    ],
    dica: 'A Kleo ajuda a escrever o lide, preparar entrevistas e checar fatos.',
  },
  {
    id: 'social-media',
    label: 'Social media',
    categoria: 'comunicacao',
    icone: Share2,
    sinonimos: ['mídias sociais', 'redes sociais', 'gestor de redes', 'community manager', 'instagram'],
    mascote: {
      nome: 'Barbie',
      genero: 'f',
      cor: '#ffc8dd',
      chapeu: 'laco',
      item: 'telefone',
      oculos: 'sol',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Posts e legendas',
          prompts: [
            {
              rotulo: 'Legenda',
              modelo:
                'Escreva uma legenda envolvente com chamada para ação e 5 hashtags para um post sobre: {entrada}',
              placeholder: 'Assunto do post',
            },
            {
              rotulo: 'Calendário da semana',
              modelo:
                'Monte um calendário de posts de 7 dias (formato, tema e horário) para o perfil: {entrada}',
              placeholder: 'Ex: loja de roupas femininas',
            },
            {
              rotulo: 'Responder comentário',
              modelo: 'Escreva uma resposta simpática e profissional para este comentário: {entrada}',
              placeholder: 'Cole o comentário',
            },
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
        id: 'calculadora',
        config: {
          tipo: 'porcentagem',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina diária das redes',
          diario: true,
          itens: [
            'Responder directs',
            'Responder comentários',
            'Publicar story',
            'Conferir métricas',
            'Salvar referências',
          ],
        },
      },
    ],
    atalhos: [
      'Ideias de posts para esta semana',
      'Como calcular taxa de engajamento?',
      'Melhores horários para postar no Instagram',
      'Escreva uma legenda para promoção de Black Friday',
      'Como responder um comentário negativo?',
    ],
    dica: 'A Kleo cria legendas, calendários de posts e cuida da sua rotina nas redes.',
  },
  {
    id: 'criador-conteudo',
    label: 'Criador de conteúdo',
    categoria: 'comunicacao',
    icone: Smartphone,
    sinonimos: ['influenciador', 'youtuber', 'tiktoker', 'streamer', 'creator', 'blogueiro'],
    mascote: {
      nome: 'Beast',
      genero: 'm',
      cor: '#c4bfff',
      chapeu: 'headset',
      item: 'camera',
      oculos: 'sol',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Ideias de vídeo',
          prompts: [
            {
              rotulo: 'Ganchos',
              modelo: 'Crie 5 ganchos fortes para os 3 primeiros segundos de um vídeo curto sobre: {entrada}',
              placeholder: 'Tema do vídeo',
            },
            {
              rotulo: 'Roteiro de vídeo curto',
              modelo:
                'Escreva um roteiro de vídeo curto (até 45s) com gancho, desenvolvimento e chamada final sobre: {entrada}',
              placeholder: 'Tema',
            },
            {
              rotulo: 'Proposta para marca',
              modelo: 'Escreva uma mensagem curta e profissional propondo parceria para a marca: {entrada}',
              placeholder: 'Nome da marca e seu nicho',
            },
          ],
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: false,
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Antes de gravar',
          itens: [
            'Celular carregado',
            'Lente limpa',
            'Luz de frente',
            'Áudio testado',
            'Roteiro à mão',
            'Modo avião ligado',
          ],
        },
      },
    ],
    atalhos: [
      'Ideias de vídeos para o meu nicho',
      'Como precificar uma publi?',
      'Crie um gancho para um vídeo de receita',
      'Como crescer no TikTok começando do zero?',
      'Monte um media kit simples',
    ],
    dica: 'A Kleo cria ganchos, roteiros e controla seus ganhos com publis.',
  },
  {
    id: 'redator',
    label: 'Redator',
    categoria: 'comunicacao',
    icone: PenLine,
    sinonimos: ['copywriter', 'escritor', 'revisor', 'conteudista', 'ghostwriter'],
    mascote: {
      nome: 'Script',
      genero: 'm',
      cor: '#fff1a8',
      chapeu: 'boina',
      item: 'caneta',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Oficina de texto',
          prompts: [
            {
              rotulo: 'Revisar texto',
              modelo:
                'Revise este texto corrigindo gramática e clareza, sem mudar o estilo. Liste as principais mudanças no final: {entrada}',
              placeholder: 'Cole o texto',
            },
            {
              rotulo: 'Encurtar',
              modelo: 'Reescreva este texto com metade do tamanho, mantendo a ideia: {entrada}',
              placeholder: 'Cole o texto',
            },
            {
              rotulo: 'Headlines',
              modelo: 'Crie 5 headlines persuasivas (fórmulas diferentes) para: {entrada}',
              placeholder: 'Produto ou tema',
            },
          ],
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
        id: 'contador',
        config: {
          rotulo: 'Produção do dia',
          itens: ['Textos entregues', 'Revisões', 'Pautas aprovadas'],
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
      'Revise este parágrafo para mim',
      'Sinônimos para "importante"',
      'Crie uma headline para landing page',
      'Quando usar crase?',
      'Quanto cobrar por lauda ou por palavra?',
    ],
    dica: 'A Kleo revisa, encurta e cria headlines enquanto você mantém o foco.',
  },
  {
    id: 'arquiteto',
    label: 'Arquiteto',
    categoria: 'comunicacao',
    icone: Building2,
    sinonimos: ['arquiteta', 'arquitetura', 'urbanista', 'projetista'],
    mascote: {
      nome: 'Archi',
      genero: 'm',
      cor: '#cfe8ff',
      chapeu: 'capacete_obra',
      item: 'regua',
      oculos: 'quadrado',
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
          rotulo: 'Proposta de projeto',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Visita técnica',
          itens: [
            'Trena e nível',
            'Fotos de todos os ambientes',
            'Medir pé-direito',
            'Verificar pontos elétricos e hidráulicos',
            'Anotar orientação solar',
            'Ouvir as necessidades do cliente',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar ambiente',
          prompt:
            'Analise este ambiente como um arquiteto: iluminação natural, circulação, acessibilidade, possíveis problemas (umidade, fissuras) e 3 sugestões de melhoria.',
          dica: 'Fotografe o cômodo ou a fachada',
        },
      },
    ],
    atalhos: [
      'Regras de acessibilidade para banheiro (NBR 9050)',
      'Como calcular a área útil de um apartamento?',
      'Quanto cobrar por um projeto residencial?',
      'Ideias para ampliar um ambiente pequeno',
      'Escreva um memorial descritivo simples',
    ],
    dica: 'A Kleo calcula áreas, monta propostas e avalia ambientes pela câmera.',
  },
]
