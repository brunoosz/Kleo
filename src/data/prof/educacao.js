import { School, BookOpen, Puzzle, Microscope, Presentation, ClipboardList, Baby } from 'lucide-react'
export default [
  {
    id: 'professor',
    label: 'Professor',
    categoria: 'educacao',
    icone: School,
    sinonimos: ['professora', 'docente', 'mestre', 'educador', 'ensino'],
    mascote: {
      nome: 'Mentor',
      genero: 'm',
      cor: '#fff3a8',
      chapeu: 'nenhum',
      item: 'livro',
      oculos: 'redondo',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Aulas',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de aula',
          prompts: [
            {
              rotulo: 'Plano de aula',
              modelo:
                'Crie um plano de aula com objetivo (BNCC quando aplicável), duração, etapas, atividade e avaliação sobre:\n\n{entrada}',
              placeholder: 'Tema, série e duração',
            },
            {
              rotulo: 'Questões de prova',
              modelo:
                'Crie 5 questões de múltipla escolha e 2 discursivas, com gabarito, sobre:\n\n{entrada}',
              placeholder: 'Tema e série',
            },
            {
              rotulo: 'Explicar simples',
              modelo:
                'Explique este conteúdo de forma simples e com um exemplo do cotidiano para alunos:\n\n{entrada}',
              placeholder: 'Conteúdo e idade',
            },
            {
              rotulo: 'Recado aos pais',
              modelo: 'Escreva um recado gentil e claro aos responsáveis sobre:\n\n{entrada}',
              placeholder: 'Assunto',
            },
          ],
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Alunos',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Corrigir atividade',
          prompt:
            'Leia a atividade ou redação do aluno na foto. Aponte erros, acertos e dê um feedback construtivo curto com sugestão de nota.',
          dica: 'Fotografe a folha inteira, reta e bem iluminada.',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: false,
        },
      },
    ],
    atalhos: [
      'Ideias de atividades para começar a aula',
      'Como lidar com turma agitada?',
      'Crie uma dinâmica de 10 minutos sobre frações',
      'Monte uma rubrica de avaliação para seminário',
    ],
    dica: 'A Kleo cria planos de aula e provas, corrige atividades pela câmera e organiza suas turmas.',
  },
  {
    id: 'professor-particular',
    label: 'Professor particular',
    categoria: 'educacao',
    icone: BookOpen,
    sinonimos: ['aula particular', 'reforco escolar', 'tutor', 'explicador', 'aulas particulares'],
    mascote: {
      nome: 'Hermi',
      genero: 'f',
      cor: '#fff0b8',
      chapeu: 'nenhum',
      item: 'lapis',
      oculos: 'redondo',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Alunos',
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de reforço',
          prompts: [
            {
              rotulo: 'Lista de exercícios',
              modelo:
                'Crie uma lista de 8 exercícios graduados (fácil para difícil), com gabarito comentado, sobre:\n\n{entrada}',
              placeholder: 'Tema e nível do aluno',
            },
            {
              rotulo: 'Relatório ao responsável',
              modelo:
                'Escreva um relatório curto de progresso do aluno para os pais, positivo e honesto:\n\n{entrada}',
              placeholder: 'Pontos fortes e a melhorar',
            },
            {
              rotulo: 'Resolver passo a passo',
              modelo: 'Resolva passo a passo, explicando cada etapa de forma didática:\n\n{entrada}',
              placeholder: 'Cole o exercício',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Resolver exercício',
          prompt:
            'Leia o exercício da foto e resolva passo a passo, explicando de forma didática para um aluno.',
          dica: 'Fotografe só o exercício, bem nítido.',
        },
      },
      {
        id: 'paradas',
        config: {},
      },
    ],
    atalhos: [
      'Quanto cobrar por hora de aula particular?',
      'Como manter um aluno motivado?',
      'Monte um plano de 4 semanas para o ENEM',
      'Escreva um anúncio das minhas aulas',
    ],
    dica: 'A Kleo cria exercícios, resolve questões pela câmera e controla alunos e pagamentos.',
  },
  {
    id: 'pedagogo',
    label: 'Pedagogo',
    categoria: 'educacao',
    icone: Puzzle,
    sinonimos: ['pedagoga', 'pedagogia', 'psicopedagogo', 'orientador educacional'],
    mascote: {
      nome: 'Ludo',
      genero: 'm',
      cor: '#fff5c2',
      chapeu: 'laco',
      item: 'livro',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente pedagógico',
          prompts: [
            {
              rotulo: 'Atividade lúdica',
              modelo: 'Sugira uma atividade lúdica (materiais, passo a passo e objetivo) para:\n\n{entrada}',
              placeholder: 'Habilidade e faixa etária',
            },
            {
              rotulo: 'Adaptação inclusiva',
              modelo: 'Sugira adaptações curriculares inclusivas para este aluno e atividade:\n\n{entrada}',
              placeholder: 'Necessidade do aluno e atividade',
            },
            {
              rotulo: 'Relatório descritivo',
              modelo:
                'Escreva um relatório descritivo de desenvolvimento do aluno, acolhedor e técnico:\n\n{entrada}',
              placeholder: 'Observações',
            },
          ],
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Alunos',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Observação de desenvolvimento',
          itens: [
            'Linguagem oral',
            'Coordenação motora',
            'Interação social',
            'Autonomia',
            'Atenção e concentração',
          ],
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: false,
        },
      },
    ],
    atalhos: [
      'Sinais de dislexia em sala de aula',
      'Como conduzir reunião com pais preocupados?',
      'Atividades para trabalhar coordenação motora fina',
      'Explique a teoria de Vygotsky de forma simples',
    ],
    dica: 'A Kleo sugere atividades lúdicas, adapta conteúdos e escreve relatórios descritivos.',
  },
  {
    id: 'pesquisador',
    label: 'Pesquisador',
    categoria: 'educacao',
    icone: Microscope,
    sinonimos: ['pesquisadora', 'cientista', 'academico', 'mestrado', 'doutorado', 'pos-graduacao'],
    mascote: {
      nome: 'Rick',
      genero: 'm',
      cor: '#fbeaa0',
      chapeu: 'nenhum',
      item: 'lupa',
      oculos: 'redondo',
      roupa: 'jaleco',
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
          titulo: 'Assistente de pesquisa',
          prompts: [
            {
              rotulo: 'Resumir artigo',
              modelo:
                'Resuma este artigo em: objetivo, método, resultados, limitações e contribuição:\n\n{entrada}',
              placeholder: 'Cole o resumo ou trecho',
            },
            {
              rotulo: 'Melhorar escrita',
              modelo:
                'Revise este texto acadêmico para clareza, coesão e norma culta, mantendo o sentido:\n\n{entrada}',
              placeholder: 'Cole o parágrafo',
            },
            {
              rotulo: 'Metodologia',
              modelo:
                'Sugira uma metodologia de pesquisa adequada (tipo, amostra, coleta e análise) para:\n\n{entrada}',
              placeholder: 'Pergunta de pesquisa',
            },
            {
              rotulo: 'Abstract',
              modelo: 'Traduza e adapte para um abstract em inglês acadêmico:\n\n{entrada}',
              placeholder: 'Cole o resumo em português',
            },
          ],
        },
      },
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Digitalizar anotação',
          prompt: 'Transcreva o texto ou anotação manuscrita da foto e organize em tópicos.',
          dica: 'Fotografe a página reta e iluminada.',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Etapas da pesquisa',
          itens: [
            'Problema e objetivos definidos',
            'Revisão de literatura',
            'Aprovação no comitê de ética',
            'Coleta de dados',
            'Análise dos resultados',
            'Redação e revisão',
            'Submissão',
          ],
        },
      },
    ],
    atalhos: [
      'Como escrever uma boa pergunta de pesquisa?',
      'Diferença entre pesquisa qualitativa e quantitativa',
      'Monte um cronograma para minha dissertação',
      'Como formatar referência ABNT de artigo online?',
    ],
    dica: 'A Kleo resume artigos, revisa sua escrita e protege seu foco nas sessões de escrita.',
  },
  {
    id: 'instrutor-cursos',
    label: 'Instrutor de cursos',
    categoria: 'educacao',
    icone: Presentation,
    sinonimos: ['instrutor', 'treinador corporativo', 'facilitador', 'palestrante', 'cursos livres'],
    mascote: {
      nome: 'Yoda',
      genero: 'm',
      cor: '#ffeeb0',
      chapeu: 'headset',
      item: 'microfone',
      oculos: 'nenhum',
      roupa: 'gravata',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Criador de treinamentos',
          prompts: [
            {
              rotulo: 'Roteiro de curso',
              modelo:
                'Crie a estrutura de um curso (módulos, objetivos, atividades práticas e carga horária) sobre:\n\n{entrada}',
              placeholder: 'Tema e público',
            },
            {
              rotulo: 'Quebra-gelo',
              modelo: 'Sugira 3 dinâmicas quebra-gelo rápidas para:\n\n{entrada}',
              placeholder: 'Público e tamanho da turma',
            },
            {
              rotulo: 'Quiz',
              modelo: 'Crie um quiz de 6 perguntas com gabarito para revisar:\n\n{entrada}',
              placeholder: 'Conteúdo',
            },
          ],
        },
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
        id: 'checklist',
        config: {
          titulo: 'Antes da turma',
          itens: [
            'Projetor e som testados',
            'Lista de presença',
            'Material impresso',
            'Exemplos práticos prontos',
            'Formulário de avaliação',
          ],
        },
      },
      {
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Como manter a atenção em um curso de 4 horas?',
      'Como avaliar se o treinamento funcionou?',
      'Dicas para falar em público sem nervosismo',
      'Escreva a descrição do meu curso para divulgação',
    ],
    dica: 'A Kleo monta cursos e quizzes, cronometra blocos e cuida da lista da turma.',
  },
  {
    id: 'coordenador-pedagogico',
    label: 'Coordenador pedagógico',
    categoria: 'educacao',
    icone: ClipboardList,
    sinonimos: ['coordenadora pedagogica', 'coordenacao', 'gestao escolar', 'diretor de escola'],
    mascote: {
      nome: 'Prisma',
      genero: 'f',
      cor: '#f9e79a',
      chapeu: 'nenhum',
      item: 'prancheta',
      oculos: 'quadrado',
      roupa: 'terno',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de coordenação',
          prompts: [
            {
              rotulo: 'Pauta de reunião',
              modelo: 'Monte uma pauta objetiva de reunião pedagógica (com tempos) sobre:\n\n{entrada}',
              placeholder: 'Temas da reunião',
            },
            {
              rotulo: 'Comunicado',
              modelo: 'Escreva um comunicado oficial e acolhedor para as famílias sobre:\n\n{entrada}',
              placeholder: 'Assunto',
            },
            {
              rotulo: 'Feedback ao professor',
              modelo:
                'Escreva um feedback construtivo para um professor, a partir desta observação de aula:\n\n{entrada}',
              placeholder: 'Pontos observados',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Semana pedagógica',
          itens: [
            'Planejamentos entregues',
            'Diários atualizados',
            'Observação de aula agendada',
            'Casos de alunos acompanhados',
            'Comunicados enviados',
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
        id: 'escala',
        config: {
          rotulo: 'Aulas',
        },
      },
    ],
    atalhos: [
      'Como conduzir conselho de classe produtivo?',
      'Estratégias para reduzir evasão escolar',
      'Como lidar com conflito entre professor e família?',
      'Monte um plano de formação continuada',
    ],
    dica: 'A Kleo organiza pautas, comunicados e o acompanhamento dos professores.',
  },
  {
    id: 'educador-infantil',
    label: 'Educador infantil',
    categoria: 'educacao',
    icone: Baby,
    sinonimos: ['professora de educacao infantil', 'creche', 'berçario', 'pre-escola', 'auxiliar de classe'],
    mascote: {
      nome: 'Bluey',
      genero: 'f',
      cor: '#fff6c9',
      chapeu: 'laco',
      item: 'mamadeira',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Ideias para os pequenos',
          prompts: [
            {
              rotulo: 'Atividade',
              modelo:
                'Sugira uma atividade sensorial ou lúdica (materiais simples e seguros) para crianças de:\n\n{entrada}',
              placeholder: 'Idade e tema',
            },
            {
              rotulo: 'Música e história',
              modelo: 'Crie uma historinha curta ou paródia de música infantil sobre:\n\n{entrada}',
              placeholder: 'Tema',
            },
            {
              rotulo: 'Agenda aos pais',
              modelo: 'Escreva um bilhete carinhoso de agenda aos pais sobre o dia da criança:\n\n{entrada}',
              placeholder: 'O que aconteceu no dia',
            },
          ],
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Soninho',
              min: 60,
            },
            {
              nome: 'Lanche',
              min: 20,
            },
            {
              nome: 'Troca de fralda',
              min: 120,
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina da turma',
          diario: true,
          itens: [
            'Acolhida',
            'Lanche da manhã',
            'Atividade dirigida',
            'Parque',
            'Almoço',
            'Soninho',
            'Saída e recados',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Turma hoje',
          itens: ['Presentes', 'Trocas', 'Mamadeiras'],
        },
      },
    ],
    atalhos: [
      'Como lidar com a adaptação na creche?',
      'Brincadeiras para dias de chuva',
      'O que fazer se uma criança morder outra?',
      'Ideias de festa junina para crianças de 3 anos',
    ],
    dica: 'A Kleo inventa atividades e historinhas, cuida da rotina da turma e escreve a agenda.',
  },
]
