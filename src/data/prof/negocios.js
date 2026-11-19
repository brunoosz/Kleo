import {
  Briefcase,
  Building,
  Rocket,
  Users,
  TrendingUp,
  Calculator,
  FileText,
  CalendarCheck,
  UserPlus,
  Lightbulb,
} from 'lucide-react'
export default [
  {
    id: 'administrador',
    label: 'Administrador',
    categoria: 'negocios',
    icone: Briefcase,
    sinonimos: ['administradora', 'administracao', 'gestor', 'adm'],
    mascote: {
      nome: 'Scott',
      genero: 'm',
      cor: '#f7c9e3',
      chapeu: 'nenhum',
      item: 'maleta',
      oculos: 'quadrado',
      roupa: 'gravata',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de gestão',
          prompts: [
            {
              rotulo: 'Análise SWOT',
              modelo: 'Faça uma análise SWOT objetiva para:\n\n{entrada}',
              placeholder: 'Empresa ou projeto',
            },
            {
              rotulo: 'Plano 5W2H',
              modelo: 'Crie um plano de ação 5W2H para:\n\n{entrada}',
              placeholder: 'Objetivo',
            },
            {
              rotulo: 'E-mail formal',
              modelo: 'Escreva um e-mail profissional, claro e cordial sobre:\n\n{entrada}',
              placeholder: 'Assunto e destinatário',
            },
            {
              rotulo: 'Indicadores',
              modelo: 'Sugira KPIs (com fórmula e meta exemplo) para acompanhar:\n\n{entrada}',
              placeholder: 'Área ou processo',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Fechamento do mês',
          itens: [
            'Conciliação bancária',
            'Folha de pagamento conferida',
            'Contas a pagar e receber',
            'Relatório de indicadores',
            'Reunião de resultados agendada',
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'juros',
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
      'Como fazer uma reunião de 15 minutos produtiva?',
      'Explique fluxo de caixa vs DRE',
      'Como delegar tarefas sem perder o controle?',
      'Monte um organograma para uma empresa de 20 pessoas',
    ],
    dica: 'A Kleo faz SWOT e 5W2H, calcula juros e organiza o fechamento do mês.',
  },
  {
    id: 'empresario',
    label: 'Empresário',
    categoria: 'negocios',
    icone: Building,
    sinonimos: ['empresaria', 'dono de empresa', 'socio', 'patrao', 'proprietario'],
    mascote: {
      nome: 'Bruce',
      genero: 'm',
      cor: '#efc2f0',
      chapeu: 'cartola',
      item: 'grafico',
      oculos: 'nenhum',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'markup',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Conselheiro de negócios',
          prompts: [
            {
              rotulo: 'Decisão',
              modelo: 'Me ajude a decidir com prós, contras, riscos e uma recomendação final:\n\n{entrada}',
              placeholder: 'Qual decisão precisa tomar?',
            },
            {
              rotulo: 'Proposta comercial',
              modelo: 'Escreva uma proposta comercial persuasiva e objetiva para:\n\n{entrada}',
              placeholder: 'Cliente, produto e valor',
            },
            {
              rotulo: 'Discurso para equipe',
              modelo: 'Escreva uma fala curta e motivadora para a equipe sobre:\n\n{entrada}',
              placeholder: 'Tema',
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
      {
        id: 'calculadora',
        config: {
          tipo: 'porcentagem',
        },
      },
    ],
    atalhos: [
      'Como saber se minha empresa está dando lucro de verdade?',
      'Quando vale a pena contratar mais um funcionário?',
      'Como negociar prazo com fornecedores?',
      'Ideias para aumentar o ticket médio',
    ],
    dica: 'A Kleo controla o caixa, calcula preços com markup e ajuda nas decisões difíceis.',
  },
  {
    id: 'empreendedor',
    label: 'Empreendedor',
    categoria: 'negocios',
    icone: Rocket,
    sinonimos: ['empreendedora', 'autonomo', 'mei', 'microempreendedor', 'startup', 'negocio proprio'],
    mascote: {
      nome: 'Steve',
      genero: 'm',
      cor: '#fcc6d6',
      chapeu: 'bone',
      item: 'cartao',
      oculos: 'sol',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'markup',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'lucro_dia',
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
          rotulo: 'Orçamento',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Sócio virtual',
          prompts: [
            {
              rotulo: 'Post de divulgação',
              modelo: 'Escreva um post curto e chamativo para Instagram/WhatsApp divulgando:\n\n{entrada}',
              placeholder: 'Produto ou serviço e oferta',
            },
            {
              rotulo: 'Validar ideia',
              modelo:
                'Avalie esta ideia de negócio: público, concorrência, custos iniciais e primeiros passos baratos:\n\n{entrada}',
              placeholder: 'Descreva a ideia',
            },
            {
              rotulo: 'Responder cliente',
              modelo:
                'Escreva uma resposta educada e que converta em venda para esta mensagem de cliente:\n\n{entrada}',
              placeholder: 'Cole a mensagem do cliente',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Como emitir nota fiscal como MEI?',
      'Quando e como pagar o DAS?',
      'Como calcular o preço do meu produto?',
      'Ideias para divulgar meu negócio sem gastar',
    ],
    dica: 'A Kleo cuida do caixa, calcula preço e lucro e escreve suas divulgações.',
  },
  {
    id: 'gerente',
    label: 'Gerente',
    categoria: 'negocios',
    icone: Users,
    sinonimos: ['gerente geral', 'supervisor', 'lider', 'coordenador', 'gestor de equipe'],
    mascote: {
      nome: 'Gestor',
      genero: 'm',
      cor: '#e8c4f7',
      chapeu: 'nenhum',
      item: 'prancheta',
      oculos: 'nenhum',
      roupa: 'gravata',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina do gestor',
          diario: true,
          itens: [
            'Reunião rápida com a equipe',
            'Conferir metas do dia',
            'Resolver pendências críticas',
            'Feedback a um colaborador',
            'Atualizar relatório',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de liderança',
          prompts: [
            {
              rotulo: 'Feedback',
              modelo:
                'Me ajude a dar um feedback (modelo SCI: situação, comportamento, impacto) respeitoso e claro sobre:\n\n{entrada}',
              placeholder: 'O que aconteceu?',
            },
            {
              rotulo: 'Meta SMART',
              modelo: 'Transforme este objetivo em metas SMART para a equipe:\n\n{entrada}',
              placeholder: 'Objetivo',
            },
            {
              rotulo: 'Conflito',
              modelo: 'Sugira como mediar este conflito na equipe, passo a passo:\n\n{entrada}',
              placeholder: 'Descreva a situação',
            },
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Metas do dia',
          itens: ['Vendas', 'Atendimentos', 'Reclamações'],
        },
      },
    ],
    atalhos: [
      'Como conduzir uma one-on-one?',
      'Como motivar uma equipe desanimada?',
      'Como demitir alguém com respeito?',
      'Monte uma escala justa para fins de semana',
    ],
    dica: 'A Kleo organiza a escala da equipe, ajuda a dar feedbacks e acompanha metas.',
  },
  {
    id: 'analista-financeiro',
    label: 'Analista financeiro',
    categoria: 'negocios',
    icone: TrendingUp,
    sinonimos: ['financeiro', 'analista de investimentos', 'controller', 'tesouraria', 'financas'],
    mascote: {
      nome: 'Cents',
      genero: 'm',
      cor: '#f5d0ea',
      chapeu: 'nenhum',
      item: 'grafico',
      oculos: 'quadrado',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'juros',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'porcentagem',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente financeiro',
          prompts: [
            {
              rotulo: 'Analisar indicadores',
              modelo:
                'Interprete estes indicadores financeiros (liquidez, margem, endividamento, ROE) e dê um parecer curto:\n\n{entrada}',
              placeholder: 'Cole os números',
            },
            {
              rotulo: 'Fórmula de planilha',
              modelo: 'Escreva a fórmula de Excel/Google Sheets e explique para:\n\n{entrada}',
              placeholder: 'O que precisa calcular?',
            },
            {
              rotulo: 'Relatório executivo',
              modelo: 'Escreva um resumo executivo de 5 linhas para a diretoria sobre:\n\n{entrada}',
              placeholder: 'Resultados do período',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler demonstrativo',
          prompt:
            'Leia o demonstrativo financeiro, boleto ou nota da foto. Extraia os valores principais e aponte inconsistências.',
          dica: 'Fotografe o documento inteiro, reto.',
        },
      },
      {
        id: 'pomodoro',
        config: {
          foco: 45,
          pausa: 10,
        },
      },
    ],
    atalhos: [
      'Explique VPL e TIR de forma simples',
      'Como montar um fluxo de caixa projetado?',
      'Diferença entre EBITDA e lucro líquido',
      'CDB, Tesouro ou LCI: como comparar?',
    ],
    dica: 'A Kleo calcula juros, interpreta indicadores e escreve relatórios executivos.',
  },
  {
    id: 'contador',
    label: 'Contador',
    categoria: 'negocios',
    icone: Calculator,
    sinonimos: ['contadora', 'contabilidade', 'contabil', 'escritorio contabil', 'tecnico contabil'],
    mascote: {
      nome: 'Ledger',
      genero: 'm',
      cor: '#eccbf2',
      chapeu: 'nenhum',
      item: 'calculadora',
      oculos: 'redondo',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'porcentagem',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'hora_extra',
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
          titulo: 'Obrigações do mês',
          itens: [
            'DAS dos clientes MEI/Simples',
            'Folha e eSocial',
            'FGTS Digital',
            'DCTFWeb',
            'Apuração de impostos',
            'Envio de guias aos clientes',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler nota fiscal',
          prompt:
            'Leia a nota fiscal ou cupom da foto. Extraia CNPJ, data, itens, valores, impostos destacados e classificação contábil sugerida.',
          dica: 'Fotografe a nota inteira com boa luz.',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente contábil',
          prompts: [
            {
              rotulo: 'Explicar ao cliente',
              modelo: 'Explique para um cliente leigo, em linguagem simples:\n\n{entrada}',
              placeholder: 'Ex: por que pagar pró-labore',
            },
            {
              rotulo: 'Regime tributário',
              modelo:
                'Compare Simples Nacional, Lucro Presumido e Lucro Real para este caso (orientativo):\n\n{entrada}',
              placeholder: 'Atividade e faturamento',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Quais os prazos fiscais deste mês?',
      'Explique o desenquadramento do MEI',
      'Como calcular férias e 1/3?',
      'Escreva um lembrete de envio de documentos para clientes',
    ],
    dica: 'A Kleo lê notas fiscais pela câmera, calcula horas extras e lembra as obrigações do mês.',
  },
  {
    id: 'auxiliar-administrativo',
    label: 'Auxiliar administrativo',
    categoria: 'negocios',
    icone: FileText,
    sinonimos: ['assistente administrativo', 'auxiliar de escritorio', 'administrativo', 'office boy'],
    mascote: {
      nome: 'Off',
      genero: 'm',
      cor: '#fad3e6',
      chapeu: 'nenhum',
      item: 'prancheta',
      oculos: 'nenhum',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Tarefas do escritório',
          diario: true,
          itens: [
            'Conferir e-mails',
            'Arquivar documentos',
            'Lançar notas',
            'Atualizar planilha de contas',
            'Conferir material de escritório',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Ajudante de escritório',
          prompts: [
            {
              rotulo: 'Escrever e-mail',
              modelo: 'Escreva um e-mail profissional e educado sobre:\n\n{entrada}',
              placeholder: 'Assunto',
            },
            {
              rotulo: 'Fórmula de planilha',
              modelo: 'Explique passo a passo a fórmula de Excel para:\n\n{entrada}',
              placeholder: 'O que precisa calcular?',
            },
            {
              rotulo: 'Ofício / declaração',
              modelo: 'Redija um documento formal (ofício, declaração ou memorando) sobre:\n\n{entrada}',
              placeholder: 'Tipo e conteúdo',
            },
          ],
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Material de escritório',
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
      'Como usar PROCV no Excel?',
      'Como organizar um arquivo de documentos?',
      'Escreva um e-mail cobrando um fornecedor',
      'Como atender bem ao telefone na empresa?',
    ],
    dica: 'A Kleo escreve e-mails e documentos, ensina planilhas e controla o material.',
  },
  {
    id: 'assistente-executivo',
    label: 'Assistente executivo',
    categoria: 'negocios',
    icone: CalendarCheck,
    sinonimos: ['secretaria executiva', 'secretario', 'assistente de diretoria', 'secretariado'],
    mascote: {
      nome: 'Jarvis',
      genero: 'm',
      cor: '#f2c6f5',
      chapeu: 'headset',
      item: 'telefone',
      oculos: 'nenhum',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente da diretoria',
          prompts: [
            {
              rotulo: 'Ata',
              modelo:
                'Transforme estas anotações em uma ata formal com decisões e responsáveis:\n\n{entrada}',
              placeholder: 'Cole suas anotações',
            },
            {
              rotulo: 'Convite de reunião',
              modelo: 'Escreva um convite de reunião claro com pauta, data e objetivo:\n\n{entrada}',
              placeholder: 'Detalhes da reunião',
            },
            {
              rotulo: 'Roteiro de viagem',
              modelo:
                'Monte um roteiro de viagem corporativa organizado (voos, hotel, compromissos):\n\n{entrada}',
              placeholder: 'Destino, datas e compromissos',
            },
          ],
        },
      },
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Preparar reunião',
          itens: [
            'Sala ou link reservado',
            'Convites enviados',
            'Pauta compartilhada',
            'Materiais impressos',
            'Café e água',
            'Ata designada',
          ],
        },
      },
    ],
    atalhos: [
      'Como organizar a agenda de um executivo muito ocupado?',
      'Escreva um e-mail recusando uma reunião com educação',
      'Checklist para viagem internacional a trabalho',
      'Como priorizar demandas de vários diretores?',
    ],
    dica: 'A Kleo escreve atas e convites, traduz e-mails e organiza reuniões e viagens.',
  },
  {
    id: 'recursos-humanos',
    label: 'Recursos humanos',
    categoria: 'negocios',
    icone: UserPlus,
    sinonimos: ['rh', 'analista de rh', 'recrutador', 'departamento pessoal', 'dp', 'gestao de pessoas'],
    mascote: {
      nome: 'People',
      genero: 'm',
      cor: '#fbc8dc',
      chapeu: 'nenhum',
      item: 'coracao',
      oculos: 'redondo',
      roupa: 'lenco',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de RH',
          prompts: [
            {
              rotulo: 'Descrição de vaga',
              modelo:
                'Escreva uma descrição de vaga atrativa e inclusiva (responsabilidades, requisitos, benefícios) para:\n\n{entrada}',
              placeholder: 'Cargo e contexto',
            },
            {
              rotulo: 'Perguntas de entrevista',
              modelo:
                'Crie 8 perguntas de entrevista por competências (com o que observar) para:\n\n{entrada}',
              placeholder: 'Cargo e competências',
            },
            {
              rotulo: 'Comunicado interno',
              modelo: 'Escreva um comunicado interno acolhedor sobre:\n\n{entrada}',
              placeholder: 'Assunto',
            },
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'hora_extra',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Integração de novo colaborador',
          itens: [
            'Documentos admissionais',
            'Exame admissional',
            'Cadastro no eSocial',
            'Acessos e equipamentos',
            'Apresentação à equipe',
            'Conversa de 30 dias agendada',
          ],
        },
      },
    ],
    atalhos: [
      'Como fazer um processo seletivo inclusivo para PcD?',
      'Ideias de ações de clima organizacional baratas',
      'Como calcular rescisão sem justa causa?',
      'Como conduzir uma entrevista de desligamento?',
    ],
    dica: 'A Kleo escreve vagas e entrevistas, calcula horas extras e organiza integrações.',
  },
  {
    id: 'consultor-empresarial',
    label: 'Consultor empresarial',
    categoria: 'negocios',
    icone: Lightbulb,
    sinonimos: ['consultor', 'consultoria', 'mentor de negocios', 'consultor de gestao'],
    mascote: {
      nome: 'Harry',
      genero: 'm',
      cor: '#e6c9fb',
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
        id: 'orcamento',
        config: {
          rotulo: 'Proposta de consultoria',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de consultoria',
          prompts: [
            {
              rotulo: 'Diagnóstico',
              modelo:
                'Faça um diagnóstico empresarial estruturado (problemas, causas, prioridades, quick wins) com base em:\n\n{entrada}',
              placeholder: 'Notas da visita ao cliente',
            },
            {
              rotulo: 'Canvas',
              modelo: 'Monte um Business Model Canvas em texto para:\n\n{entrada}',
              placeholder: 'Negócio do cliente',
            },
            {
              rotulo: 'Apresentação',
              modelo:
                'Estruture uma apresentação de resultados (slide a slide, títulos e mensagens-chave) sobre:\n\n{entrada}',
              placeholder: 'Conteúdo do projeto',
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
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Como precificar minha hora de consultoria?',
      'Perguntas para a primeira reunião com o cliente',
      'Como medir o resultado de um projeto de consultoria?',
      'Como apresentar más notícias ao cliente?',
    ],
    dica: 'A Kleo faz diagnósticos e propostas, cronometra horas e organiza seus clientes.',
  },
]
