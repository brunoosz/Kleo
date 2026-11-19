import {
  Code2,
  Cpu,
  Workflow,
  Wrench,
  Network,
  ShieldCheck,
  BarChart3,
  Bot,
  PenTool,
  Server,
} from 'lucide-react'
export default [
  {
    id: 'programador',
    label: 'Programador / Desenvolvedor de software',
    categoria: 'tecnologia',
    icone: Code2,
    sinonimos: [
      'programador',
      'desenvolvedor',
      'dev',
      'developer',
      'software',
      'front-end',
      'back-end',
      'full stack',
      'codigo',
    ],
    mascote: {
      nome: 'Neo',
      genero: 'm',
      cor: '#b7c8ff',
      chapeu: 'fones',
      item: 'notebook',
      oculos: 'quadrado',
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
        id: 'assistente',
        config: {
          titulo: 'Copiloto de código',
          prompts: [
            {
              rotulo: 'Explicar código',
              modelo:
                'Explique de forma clara e curta o que este código faz, linha a linha quando necessário:\n\n{entrada}',
              placeholder: 'Cole o trecho de código',
            },
            {
              rotulo: 'Revisar código',
              modelo:
                'Revise este código. Aponte bugs, problemas de segurança, performance e legibilidade, com sugestão de correção:\n\n{entrada}',
              placeholder: 'Cole o código para revisão',
            },
            {
              rotulo: 'Entender erro',
              modelo: 'Explique a causa provável deste erro e como corrigir, passo a passo:\n\n{entrada}',
              placeholder: 'Cole a mensagem de erro / stack trace',
            },
            {
              rotulo: 'Mensagem de commit',
              modelo:
                'Escreva uma mensagem de commit no padrão Conventional Commits (em português) para estas mudanças:\n\n{entrada}',
              placeholder: 'Descreva o que mudou',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Antes do deploy',
          itens: [
            'Testes passando',
            'Lint sem erros',
            'Variáveis de ambiente conferidas',
            'Migrações de banco revisadas',
            'Changelog atualizado',
            'Plano de rollback pronto',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Tarefas do dia',
          itens: ['Tarefas concluídas', 'Bugs corrigidos', 'Code reviews'],
        },
      },
    ],
    atalhos: [
      'Explique a diferença entre REST e GraphQL de forma curta',
      'Me ajude a quebrar esta feature em tarefas menores',
      'Como escrever um bom teste unitário?',
      'Monte um plano de estudos para eu aprender TypeScript',
      'Me lembre de alongar a cada 1 hora',
    ],
    dica: 'A Kleo explica erros, revisa código e protege seu foco com pomodoros longos.',
  },
  {
    id: 'engenheiro-computacao',
    label: 'Engenheiro de Computação',
    categoria: 'tecnologia',
    icone: Cpu,
    sinonimos: ['engenharia de computacao', 'hardware', 'sistemas embarcados', 'arduino', 'microcontrolador'],
    mascote: {
      nome: 'Tony',
      genero: 'm',
      cor: '#c3d0ff',
      chapeu: 'nenhum',
      item: 'chip',
      oculos: 'protecao',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'lei_ohm',
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
          titulo: 'Assistente de engenharia',
          prompts: [
            {
              rotulo: 'Explicar circuito',
              modelo: 'Explique o funcionamento deste circuito ou componente de forma didática:\n\n{entrada}',
              placeholder: 'Descreva o circuito ou componente',
            },
            {
              rotulo: 'Código embarcado',
              modelo:
                'Escreva um código C/C++ para microcontrolador (Arduino/ESP32) que faça o seguinte, com comentários:\n\n{entrada}',
              placeholder: 'O que o firmware deve fazer?',
            },
            {
              rotulo: 'Arquitetura',
              modelo:
                'Proponha uma arquitetura de sistema (hardware + software) para este projeto, com prós e contras:\n\n{entrada}',
              placeholder: 'Descreva o projeto',
            },
          ],
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
        id: 'camera_ia',
        config: {
          titulo: 'Identificar componente',
          prompt:
            'Identifique o componente eletrônico ou placa da foto, leia códigos e marcações visíveis e explique para que serve e cuidados de uso.',
          dica: 'Fotografe bem de perto, com boa luz, mostrando as marcações.',
        },
      },
    ],
    atalhos: [
      'Qual a diferença entre microcontrolador e microprocessador?',
      'Como calcular o resistor de um LED?',
      'Explique comunicação I2C vs SPI vs UART',
      'Sugira um projeto de IoT para o meu portfólio',
    ],
    dica: 'A Kleo calcula circuitos, identifica componentes pela câmera e escreve firmware com você.',
  },
  {
    id: 'analista-sistemas',
    label: 'Analista de sistemas',
    categoria: 'tecnologia',
    icone: Workflow,
    sinonimos: ['analista', 'sistemas', 'requisitos', 'analista de requisitos', 'product owner'],
    mascote: {
      nome: 'Logic',
      genero: 'm',
      cor: '#cfd8ff',
      chapeu: 'nenhum',
      item: 'prancheta',
      oculos: 'redondo',
      roupa: 'gravata',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Analista assistente',
          prompts: [
            {
              rotulo: 'Histórias de usuário',
              modelo:
                'Transforme esta necessidade em histórias de usuário no formato "Como... quero... para...", com critérios de aceite:\n\n{entrada}',
              placeholder: 'Descreva a necessidade do cliente',
            },
            {
              rotulo: 'Requisitos',
              modelo:
                'Liste requisitos funcionais e não funcionais para este sistema, numerados:\n\n{entrada}',
              placeholder: 'Descreva o sistema',
            },
            {
              rotulo: 'Ata de reunião',
              modelo:
                'Organize estas anotações em uma ata de reunião com decisões, pendências e responsáveis:\n\n{entrada}',
              placeholder: 'Cole suas anotações',
            },
            {
              rotulo: 'Modelo de dados',
              modelo: 'Sugira um modelo de dados (tabelas, campos e relacionamentos) para:\n\n{entrada}',
              placeholder: 'Descreva o domínio',
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
        id: 'checklist',
        config: {
          titulo: 'Levantamento de requisitos',
          itens: [
            'Objetivo do sistema definido',
            'Usuários e perfis mapeados',
            'Fluxo atual (as-is) documentado',
            'Regras de negócio levantadas',
            'Integrações identificadas',
            'Critérios de aceite validados',
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
        id: 'orcamento',
        config: {
          rotulo: 'Estimativa do projeto',
        },
      },
    ],
    atalhos: [
      'Como conduzir uma boa entrevista de requisitos?',
      'Explique diagrama de casos de uso de forma simples',
      'Me ajude a priorizar o backlog com MoSCoW',
      'Escreva um e-mail de alinhamento com o cliente',
    ],
    dica: 'A Kleo transforma conversas em requisitos, histórias de usuário e atas organizadas.',
  },
  {
    id: 'tecnico-informatica',
    label: 'Técnico de informática',
    categoria: 'tecnologia',
    icone: Wrench,
    sinonimos: [
      'tecnico de computador',
      'manutencao de computador',
      'suporte tecnico',
      'formatacao',
      'helpdesk',
    ],
    mascote: {
      nome: 'Chip',
      genero: 'm',
      cor: '#bcd7ff',
      chapeu: 'bone',
      item: 'chave_inglesa',
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
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de serviço',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Diagnóstico de PC',
          itens: [
            'Fonte e cabos conferidos',
            'Memória RAM testada',
            'Saúde do HD/SSD verificada',
            'Temperatura da CPU ok',
            'Drivers atualizados',
            'Antivírus e atualizações do sistema',
            'Backup do cliente feito',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler tela de erro',
          prompt:
            'Leia a mensagem de erro ou tela azul na foto, explique a causa provável e os passos para resolver.',
          dica: 'Fotografe a tela inteira, sem reflexo.',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Peças',
        },
      },
      {
        id: 'paradas',
        config: {},
      },
    ],
    atalhos: [
      'O computador liga mas não dá vídeo. O que testar?',
      'Como explicar para o cliente que vale trocar HD por SSD?',
      'Passo a passo para formatar e instalar o Windows',
      'Quanto cobrar por uma formatação com backup?',
    ],
    dica: 'A Kleo lê telas de erro pela câmera, monta orçamentos e organiza seus clientes.',
  },
  {
    id: 'tecnico-redes',
    label: 'Técnico de redes',
    categoria: 'tecnologia',
    icone: Network,
    sinonimos: ['redes', 'infraestrutura', 'cabeamento', 'wi-fi', 'provedor de internet', 'fibra'],
    mascote: {
      nome: 'Link',
      genero: 'm',
      cor: '#a9d4ff',
      chapeu: 'capacete_obra',
      item: 'roteador',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'paradas',
        config: {},
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Instalação de rede',
          itens: [
            'Testar cabo com testador',
            'Crimpagem no padrão T568A/B',
            'Configurar SSID e senha WPA2/WPA3',
            'Trocar senha padrão do roteador',
            'Medir velocidade e sinal',
            'Etiquetar pontos de rede',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de redes',
          prompts: [
            {
              rotulo: 'Calcular sub-rede',
              modelo:
                'Faça o cálculo de sub-rede (rede, broadcast, faixa de hosts, máscara) para:\n\n{entrada}',
              placeholder: 'Ex: 192.168.10.0/26',
            },
            {
              rotulo: 'Diagnosticar problema',
              modelo:
                'Ajude a diagnosticar este problema de rede com passos de teste em ordem (ping, traceroute, DNS etc.):\n\n{entrada}',
              placeholder: 'Descreva o sintoma',
            },
            {
              rotulo: 'Comandos',
              modelo: 'Liste os comandos (Cisco/Mikrotik/Linux, conforme o caso) para:\n\n{entrada}',
              placeholder: 'O que precisa configurar?',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Inspecionar rack',
          prompt:
            'Analise a foto do rack, switch ou cabeamento. Aponte problemas de organização, cabos mal crimpados, LEDs de erro e sugestões de melhoria.',
          dica: 'Mostre o rack de frente com os LEDs visíveis.',
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
      'Qual a diferença entre cabo Cat5e, Cat6 e Cat6a?',
      'Como melhorar o Wi-Fi de uma casa de dois andares?',
      'Explique VLAN de um jeito simples',
      'O cliente reclama de internet lenta. Por onde começo?',
    ],
    dica: 'A Kleo calcula sub-redes, organiza suas visitas e inspeciona racks pela câmera.',
  },
  {
    id: 'ciberseguranca',
    label: 'Analista de cibersegurança',
    categoria: 'tecnologia',
    icone: ShieldCheck,
    sinonimos: ['seguranca da informacao', 'cybersecurity', 'hacker etico', 'pentest', 'soc', 'infosec'],
    mascote: {
      nome: 'Cypher',
      genero: 'm',
      cor: '#c2bdfc',
      chapeu: 'bandana',
      item: 'cadeado',
      oculos: 'sol',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Analista de segurança',
          prompts: [
            {
              rotulo: 'Analisar log',
              modelo:
                'Analise este log em busca de sinais de ataque ou comportamento suspeito. Liste indicadores e recomendações:\n\n{entrada}',
              placeholder: 'Cole o trecho do log',
            },
            {
              rotulo: 'É phishing?',
              modelo:
                'Avalie se esta mensagem é phishing. Aponte os sinais de alerta e o que fazer:\n\n{entrada}',
              placeholder: 'Cole o e-mail ou mensagem',
            },
            {
              rotulo: 'Explicar CVE',
              modelo: 'Explique esta vulnerabilidade, o impacto e como mitigar:\n\n{entrada}',
              placeholder: 'Ex: CVE-2021-44228',
            },
            {
              rotulo: 'Resposta a incidente',
              modelo:
                'Monte um plano de resposta a incidente (contenção, erradicação, recuperação, lições) para:\n\n{entrada}',
              placeholder: 'Descreva o incidente',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina de segurança',
          diario: true,
          itens: [
            'Revisar alertas do SIEM',
            'Conferir backups da noite',
            'Verificar patches pendentes',
            'Revisar acessos privilegiados',
            'Checar feeds de ameaças',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Checar mensagem suspeita',
          prompt:
            'Analise o print desta mensagem, e-mail ou site. Diga se parece golpe/phishing e explique os sinais.',
          dica: 'Tire print ou foto da mensagem inteira, com remetente.',
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
        },
      },
    ],
    atalhos: [
      'Explique o modelo Zero Trust de forma curta',
      'Como montar uma política de senhas forte?',
      'Quais os passos de um pentest web?',
      'Crie um treinamento rápido anti-phishing para a equipe',
    ],
    dica: 'A Kleo analisa logs, detecta phishing e ajuda a responder incidentes rápido.',
  },
  {
    id: 'cientista-dados',
    label: 'Cientista de dados',
    categoria: 'tecnologia',
    icone: BarChart3,
    sinonimos: ['dados', 'data science', 'analista de dados', 'estatistico', 'machine learning', 'bi'],
    mascote: {
      nome: 'Sheldon',
      genero: 'm',
      cor: '#b5e0ff',
      chapeu: 'nenhum',
      item: 'grafico',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de dados',
          prompts: [
            {
              rotulo: 'Escrever SQL',
              modelo: 'Escreva uma consulta SQL para o seguinte, explicando brevemente:\n\n{entrada}',
              placeholder: 'Descreva tabelas e o que quer obter',
            },
            {
              rotulo: 'Código pandas',
              modelo: 'Escreva código Python com pandas para:\n\n{entrada}',
              placeholder: 'O que quer fazer com os dados?',
            },
            {
              rotulo: 'Escolher modelo',
              modelo:
                'Sugira técnicas de análise ou modelos de machine learning adequados, com métricas de avaliação, para:\n\n{entrada}',
              placeholder: 'Descreva o problema e os dados',
            },
            {
              rotulo: 'Explicar para leigos',
              modelo:
                'Explique este resultado de análise para um público não técnico, em poucas frases:\n\n{entrada}',
              placeholder: 'Cole o resultado',
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
        id: 'camera_ia',
        config: {
          titulo: 'Interpretar gráfico',
          prompt:
            'Interprete o gráfico ou tabela da foto: tendências, outliers, possíveis erros de visualização e conclusões.',
          dica: 'Fotografe o gráfico inteiro com eixos e legenda.',
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
      'Explique p-valor como se eu tivesse 12 anos',
      'Qual a diferença entre overfitting e underfitting?',
      'Como tratar dados faltantes?',
      'Sugira um gráfico para comparar vendas por região',
    ],
    dica: 'A Kleo escreve SQL e pandas, interpreta gráficos e traduz resultados para leigos.',
  },
  {
    id: 'especialista-ia',
    label: 'Especialista em inteligência artificial',
    categoria: 'tecnologia',
    icone: Bot,
    sinonimos: [
      'inteligencia artificial',
      'ia',
      'ai',
      'engenheiro de machine learning',
      'llm',
      'prompt engineer',
    ],
    mascote: {
      nome: 'Syn',
      genero: 'm',
      cor: '#d0c4ff',
      chapeu: 'headset',
      item: 'robo',
      oculos: 'vr',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Laboratório de IA',
          prompts: [
            {
              rotulo: 'Melhorar prompt',
              modelo:
                'Reescreva este prompt para ficar mais claro, específico e robusto, explicando as mudanças:\n\n{entrada}',
              placeholder: 'Cole o prompt',
            },
            {
              rotulo: 'Explicar artigo',
              modelo:
                'Resuma e explique este conceito ou artigo de IA em linguagem acessível, com pontos principais:\n\n{entrada}',
              placeholder: 'Cole o resumo ou tema',
            },
            {
              rotulo: 'Pipeline de RAG',
              modelo:
                'Desenhe uma arquitetura de RAG/agente para este caso de uso, com etapas e ferramentas:\n\n{entrada}',
              placeholder: 'Descreva o caso de uso',
            },
            {
              rotulo: 'Avaliação',
              modelo:
                'Proponha um plano de avaliação (métricas, conjunto de testes, riscos e vieses) para este modelo:\n\n{entrada}',
              placeholder: 'Descreva o modelo',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Teste de visão',
          prompt:
            'Descreva tudo o que você vê nesta imagem em detalhes: objetos, textos, pessoas, contexto e possíveis ambiguidades.',
          dica: 'Use para testar como um modelo de visão enxerga uma cena.',
        },
      },
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'pomodoro',
        config: {
          foco: 50,
          pausa: 10,
        },
      },
    ],
    atalhos: [
      'Explique transformers em 3 frases',
      'Quando usar fine-tuning e quando usar RAG?',
      'Como reduzir alucinações em um chatbot?',
      'Quais cuidados éticos ao lançar um produto com IA?',
    ],
    dica: 'A Kleo afina seus prompts, explica papers e desenha pipelines de IA com você.',
  },
  {
    id: 'designer-ux',
    label: 'Designer UX/UI',
    categoria: 'tecnologia',
    icone: PenTool,
    sinonimos: [
      'ux',
      'ui',
      'designer de produto',
      'product designer',
      'experiencia do usuario',
      'interface',
      'figma',
    ],
    mascote: {
      nome: 'Pixel',
      genero: 'm',
      cor: '#e2c8ff',
      chapeu: 'boina',
      item: 'paleta',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Crítica de interface',
          prompt:
            'Faça uma crítica de UX/UI desta tela: hierarquia visual, contraste, acessibilidade (WCAG), legibilidade, consistência e 3 melhorias prioritárias.',
          dica: 'Fotografe ou tire print da tela inteira.',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de UX',
          prompts: [
            {
              rotulo: 'Microcopy',
              modelo: 'Escreva 3 opções de microcopy claras e amigáveis (em PT-BR) para:\n\n{entrada}',
              placeholder: 'Ex: mensagem de erro de pagamento',
            },
            {
              rotulo: 'Roteiro de entrevista',
              modelo:
                'Crie um roteiro de entrevista com usuários (perguntas abertas, sem viés) sobre:\n\n{entrada}',
              placeholder: 'Tema da pesquisa',
            },
            {
              rotulo: 'Persona',
              modelo: 'Crie uma persona realista, com objetivos, dores e contexto de uso, para:\n\n{entrada}',
              placeholder: 'Descreva o produto e público',
            },
            {
              rotulo: 'Heurísticas',
              modelo: 'Avalie este fluxo pelas 10 heurísticas de Nielsen e sugira melhorias:\n\n{entrada}',
              placeholder: 'Descreva o fluxo',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Acessibilidade da tela',
          itens: [
            'Contraste mínimo 4.5:1',
            'Alvos de toque com 44px ou mais',
            'Textos alternativos em imagens',
            'Não depende só de cor',
            'Ordem de foco lógica',
            'Funciona com fonte grande',
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
    ],
    atalhos: [
      'Qual a diferença entre UX e UI?',
      'Como apresentar meu design para stakeholders?',
      'Sugira uma paleta acessível para um app de saúde',
      'Como fazer um teste de usabilidade rápido?',
    ],
    dica: 'A Kleo critica telas pela câmera, escreve microcopy e checa acessibilidade.',
  },
  {
    id: 'administrador-ti',
    label: 'Administrador de TI',
    categoria: 'tecnologia',
    icone: Server,
    sinonimos: ['sysadmin', 'administrador de sistemas', 'gestor de ti', 'infraestrutura', 'devops', 'ti'],
    mascote: {
      nome: 'Toad',
      genero: 'm',
      cor: '#b0c4f5',
      chapeu: 'headset',
      item: 'engrenagem',
      oculos: 'quadrado',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina diária de TI',
          diario: true,
          itens: [
            'Backups concluídos',
            'Espaço em disco dos servidores',
            'Alertas de monitoramento',
            'Chamados abertos revisados',
            'Atualizações críticas aplicadas',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de infraestrutura',
          prompts: [
            {
              rotulo: 'Script',
              modelo: 'Escreva um script (PowerShell ou Bash, conforme o caso) comentado para:\n\n{entrada}',
              placeholder: 'O que o script deve fazer?',
            },
            {
              rotulo: 'Comunicado',
              modelo: 'Escreva um comunicado curto e claro para os usuários sobre:\n\n{entrada}',
              placeholder: 'Ex: manutenção no servidor sábado',
            },
            {
              rotulo: 'Procedimento',
              modelo: 'Crie um procedimento operacional padrão (POP) passo a passo para:\n\n{entrada}',
              placeholder: 'Qual tarefa?',
            },
          ],
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Equipamentos e licenças',
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Plantões',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Chamados',
          itens: ['Abertos', 'Resolvidos', 'Escalados'],
        },
      },
    ],
    atalhos: [
      'Como montar uma política de backup 3-2-1?',
      'Checklist para integrar um novo funcionário',
      'Como justificar para a diretoria a troca de servidores?',
      'Explique Active Directory de forma simples',
    ],
    dica: 'A Kleo escreve scripts, organiza chamados e cuida do inventário de equipamentos.',
  },
]
