import {
  ShoppingBag,
  Handshake,
  Headset,
  Store,
  KeyRound,
  Umbrella,
  ShoppingCart,
  Banknote,
  UtensilsCrossed,
  ConciergeBell,
} from 'lucide-react'
export default [
  {
    id: 'vendedor',
    label: 'Vendedor',
    categoria: 'comercio',
    icone: ShoppingBag,
    sinonimos: ['vendedora', 'vendas', 'consultor de vendas', 'balconista', 'ambulante'],
    mascote: {
      nome: 'Alen',
      genero: 'm',
      cor: '#ffcbbf',
      chapeu: 'bone',
      item: 'sacola',
      oculos: 'nenhum',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'comissao',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'desconto',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Clientes',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Vendas do dia',
          itens: ['Atendimentos', 'Vendas fechadas', 'Trocas'],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de vendas',
          prompts: [
            {
              rotulo: 'Contornar objeção',
              modelo: 'Sugira 3 respostas educadas e persuasivas para esta objeção do cliente:\n\n{entrada}',
              placeholder: 'Ex: está caro',
            },
            {
              rotulo: 'Mensagem de oferta',
              modelo: 'Escreva uma mensagem curta de WhatsApp oferecendo:\n\n{entrada}',
              placeholder: 'Produto e condição',
            },
            {
              rotulo: 'Pós-venda',
              modelo: 'Escreva uma mensagem de pós-venda simpática para:\n\n{entrada}',
              placeholder: 'Cliente e produto comprado',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Como responder quando o cliente diz que está caro?',
      'Técnicas para fechar mais vendas',
      'Quanto vou ganhar de comissão se vender R$ 8.000?',
      'Escreva uma mensagem para cliente que sumiu',
    ],
    dica: 'A Kleo calcula comissão e descontos, conta suas vendas e ajuda a contornar objeções.',
  },
  {
    id: 'representante-comercial',
    label: 'Representante comercial',
    categoria: 'comercio',
    icone: Handshake,
    sinonimos: ['representante', 'rca', 'vendedor externo', 'promotor de vendas'],
    mascote: {
      nome: 'Don',
      genero: 'm',
      cor: '#ffc2b0',
      chapeu: 'nenhum',
      item: 'maleta',
      oculos: 'sol',
      roupa: 'gravata',
    },
    ferramentas: [
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
        id: 'calculadora',
        config: {
          tipo: 'comissao',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'combustivel',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Pedido',
        },
      },
    ],
    atalhos: [
      'Como planejar uma rota de visitas eficiente?',
      'Como reativar um cliente que parou de comprar?',
      'Escreva um e-mail apresentando nossa nova linha',
      'Quanto gasto de combustível para rodar 300 km?',
    ],
    dica: 'A Kleo organiza a rota de visitas, tira pedidos e calcula comissão e combustível.',
  },
  {
    id: 'atendente',
    label: 'Atendente',
    categoria: 'comercio',
    icone: Headset,
    sinonimos: ['atendimento', 'sac', 'call center', 'operador de telemarketing', 'suporte ao cliente'],
    mascote: {
      nome: 'Hello',
      genero: 'm',
      cor: '#ffd3c4',
      chapeu: 'headset',
      item: 'telefone',
      oculos: 'nenhum',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'assistente',
        config: {
          titulo: 'Respostas ao cliente',
          prompts: [
            {
              rotulo: 'Responder reclamação',
              modelo:
                'Escreva uma resposta empática, que peça desculpas e resolva, para esta reclamação:\n\n{entrada}',
              placeholder: 'Cole a reclamação',
            },
            {
              rotulo: 'Explicar procedimento',
              modelo: 'Explique este procedimento ao cliente de forma clara e curta:\n\n{entrada}',
              placeholder: 'Ex: como solicitar troca',
            },
            {
              rotulo: 'Deixar mais gentil',
              modelo: 'Reescreva esta mensagem para ficar mais gentil e profissional:\n\n{entrada}',
              placeholder: 'Cole sua mensagem',
            },
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Atendimentos',
          itens: ['Atendidos', 'Resolvidos', 'Encaminhados'],
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
    ],
    atalhos: [
      'Como acalmar um cliente muito irritado?',
      'Frases que devo evitar no atendimento',
      'Como dizer não ao cliente com educação?',
      'Exercício rápido para relaxar entre ligações',
    ],
    dica: 'A Kleo escreve respostas empáticas, conta atendimentos e te ajuda a respirar entre clientes.',
  },
  {
    id: 'gerente-loja',
    label: 'Gerente de loja',
    categoria: 'comercio',
    icone: Store,
    sinonimos: ['gerente de vendas', 'gerente comercial', 'lojista', 'encarregado de loja'],
    mascote: {
      nome: 'Retail',
      genero: 'm',
      cor: '#ffbfb3',
      chapeu: 'nenhum',
      item: 'chave',
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
        id: 'estoque',
        config: {
          rotulo: 'Produtos',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Abertura da loja',
          diario: true,
          itens: [
            'Alarme desativado',
            'Caixa com troco',
            'Vitrine e iluminação',
            'Loja limpa e organizada',
            'Reunião rápida com a equipe',
            'Metas do dia comunicadas',
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'markup',
        },
      },
      {
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Como montar uma vitrine que atrai clientes?',
      'Ideias de campanha para a Black Friday',
      'Como calcular a meta diária a partir da mensal?',
      'Como reduzir perdas no estoque?',
    ],
    dica: 'A Kleo organiza escala e estoque, abre a loja com você e acompanha o caixa.',
  },
  {
    id: 'corretor-imoveis',
    label: 'Corretor de imóveis',
    categoria: 'comercio',
    icone: KeyRound,
    sinonimos: ['corretora de imoveis', 'imobiliaria', 'creci', 'corretor imobiliario'],
    mascote: {
      nome: 'House',
      genero: 'm',
      cor: '#ffc8a8',
      chapeu: 'nenhum',
      item: 'casa',
      oculos: 'sol',
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
        id: 'paradas',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'juros',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'comissao',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Anúncios e negociação',
          prompts: [
            {
              rotulo: 'Anúncio de imóvel',
              modelo:
                'Escreva um anúncio atrativo e honesto para portais e Instagram deste imóvel:\n\n{entrada}',
              placeholder: 'Tipo, quartos, metragem, bairro, diferenciais',
            },
            {
              rotulo: 'Mensagem de follow-up',
              modelo: 'Escreva uma mensagem de acompanhamento para um cliente que visitou:\n\n{entrada}',
              placeholder: 'Cliente e imóvel',
            },
            {
              rotulo: 'Explicar financiamento',
              modelo: 'Explique de forma simples ao cliente como funciona o financiamento:\n\n{entrada}',
              placeholder: 'Valor do imóvel e entrada',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Descrever imóvel',
          prompt:
            'Descreva o ambiente da foto de forma atrativa para anúncio imobiliário e sugira melhorias simples para fotografar melhor.',
          dica: 'Fotografe com luz natural, do canto do cômodo.',
        },
      },
    ],
    atalhos: [
      'Quanto fica a parcela de um imóvel de R$ 400 mil?',
      'Documentos necessários para comprar um imóvel',
      'Como captar mais imóveis para vender?',
      'Monte meu roteiro de visitas de sábado',
    ],
    dica: 'A Kleo escreve anúncios, simula financiamentos e organiza seu roteiro de visitas.',
  },
  {
    id: 'corretor-seguros',
    label: 'Corretor de seguros',
    categoria: 'comercio',
    icone: Umbrella,
    sinonimos: ['corretora de seguros', 'seguros', 'susep', 'seguro de vida', 'seguro auto'],
    mascote: {
      nome: 'Shield',
      genero: 'm',
      cor: '#ffd0b8',
      chapeu: 'nenhum',
      item: 'escudo',
      oculos: 'quadrado',
      roupa: 'gravata',
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
          tipo: 'comissao',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de seguros',
          prompts: [
            {
              rotulo: 'Explicar apólice',
              modelo:
                'Explique em linguagem simples as coberturas, franquia e exclusões desta apólice:\n\n{entrada}',
              placeholder: 'Cole o trecho da apólice',
            },
            {
              rotulo: 'Lembrete de renovação',
              modelo: 'Escreva uma mensagem cordial lembrando o cliente da renovação:\n\n{entrada}',
              placeholder: 'Cliente, seguro e data',
            },
            {
              rotulo: 'Argumento de venda',
              modelo: 'Crie argumentos simples para mostrar o valor deste seguro ao cliente:\n\n{entrada}',
              placeholder: 'Tipo de seguro e perfil do cliente',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Vistoria por foto',
          prompt:
            'Analise a foto do veículo ou imóvel para vistoria: danos visíveis, avarias, estado geral e itens a registrar.',
          dica: 'Fotografe todos os lados e detalhes de danos.',
        },
      },
    ],
    atalhos: [
      'Diferença entre franquia normal e reduzida',
      'Como explicar seguro de vida para um jovem?',
      'Como montar uma carteira de renovações?',
      'O que fazer quando o cliente sofre um sinistro?',
    ],
    dica: 'A Kleo explica apólices, lembra renovações e faz vistorias por foto.',
  },
  {
    id: 'comprador',
    label: 'Comprador',
    categoria: 'comercio',
    icone: ShoppingCart,
    sinonimos: ['compradora', 'compras', 'suprimentos', 'analista de compras', 'procurement'],
    mascote: {
      nome: 'Jones',
      genero: 'm',
      cor: '#ffc5b5',
      chapeu: 'nenhum',
      item: 'lupa',
      oculos: 'quadrado',
      roupa: 'nenhuma',
    },
    ferramentas: [
      {
        id: 'estoque',
        config: {
          rotulo: 'Itens',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'desconto',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'regra_de_tres',
        },
      },
      {
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de compras',
          prompts: [
            {
              rotulo: 'Comparar cotações',
              modelo:
                'Compare estas cotações considerando preço, prazo, frete e condições, e recomende a melhor:\n\n{entrada}',
              placeholder: 'Cole as cotações',
            },
            {
              rotulo: 'Pedir cotação',
              modelo: 'Escreva um e-mail solicitando cotação a fornecedores para:\n\n{entrada}',
              placeholder: 'Itens, quantidades e prazo',
            },
            {
              rotulo: 'Negociar',
              modelo: 'Sugira uma estratégia e argumentos de negociação com o fornecedor para:\n\n{entrada}',
              placeholder: 'Situação',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Como calcular o ponto de pedido?',
      'Como negociar desconto à vista?',
      'Critérios para avaliar fornecedores',
      'Qual embalagem sai mais barata por unidade?',
    ],
    dica: 'A Kleo compara cotações, controla reposição e calcula o melhor preço por unidade.',
  },
  {
    id: 'caixa',
    label: 'Caixa',
    categoria: 'comercio',
    icone: Banknote,
    sinonimos: ['operador de caixa', 'operadora de caixa', 'frente de caixa', 'checkout'],
    mascote: {
      nome: 'Cash',
      genero: 'm',
      cor: '#ffd9c7',
      chapeu: 'viseira',
      item: 'cartao',
      oculos: 'nenhum',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'desconto',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Abertura e fechamento',
          diario: true,
          itens: [
            'Conferir fundo de troco',
            'Testar maquininha de cartão',
            'Bobina de papel',
            'Sangria quando necessário',
            'Conferir cédulas suspeitas',
            'Fechamento conferido',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Movimento',
          itens: ['Clientes atendidos', 'Cancelamentos', 'Sangrias'],
        },
      },
    ],
    atalhos: [
      'Como identificar nota falsa?',
      'O que fazer se o caixa não bater no fim do dia?',
      'Como agir quando a maquininha não passa o cartão?',
      'Alongamentos para quem fica muito tempo em pé',
    ],
    dica: 'A Kleo confere o caixa, calcula descontos e ajuda na abertura e no fechamento.',
  },
  {
    id: 'garcom',
    label: 'Garçom',
    categoria: 'comercio',
    icone: UtensilsCrossed,
    sinonimos: ['garconete', 'garcom', 'atendente de restaurante', 'maitre', 'bartender'],
    mascote: {
      nome: 'Serve',
      genero: 'm',
      cor: '#ffc6a3',
      chapeu: 'nenhum',
      item: 'bandeja',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'contador',
        config: {
          rotulo: 'Salão',
          itens: ['Mesas atendidas', 'Pedidos', 'Contas fechadas'],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'gorjeta',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Abertura do salão',
          diario: true,
          itens: [
            'Mesas limpas e montadas',
            'Talheres e guardanapos',
            'Cardápios conferidos',
            'Pratos do dia anotados',
            'Comanda e caneta',
            'Uniforme impecável',
          ],
        },
      },
      {
        id: 'tradutor',
        config: {},
      },
    ],
    atalhos: [
      'Como dividir a conta com taxa de 10% entre 6 pessoas?',
      'Como sugerir vinho para um prato de peixe?',
      'Frases em inglês para atender turistas',
      'Como lidar com cliente que reclama do prato?',
    ],
    dica: 'A Kleo conta mesas e pedidos, divide a conta com gorjeta e traduz para turistas.',
  },
  {
    id: 'recepcionista',
    label: 'Recepcionista',
    categoria: 'comercio',
    icone: ConciergeBell,
    sinonimos: ['recepcao', 'recepcionista de hotel', 'recepcionista de clinica', 'concierge', 'porteiro'],
    mascote: {
      nome: 'Will',
      genero: 'm',
      cor: '#ffd6bd',
      chapeu: 'headset',
      item: 'telefone',
      oculos: 'nenhum',
      roupa: 'lenco',
    },
    ferramentas: [
      {
        id: 'clientes',
        config: {
          rotulo: 'Contatos',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Recepção',
          itens: ['Visitantes', 'Ligações', 'Encomendas'],
        },
      },
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente da recepção',
          prompts: [
            {
              rotulo: 'Mensagem de confirmação',
              modelo: 'Escreva uma mensagem de confirmação de horário, cordial e curta, para:\n\n{entrada}',
              placeholder: 'Nome, data, horário e local',
            },
            {
              rotulo: 'Script de telefone',
              modelo: 'Crie um roteiro de atendimento telefônico para:\n\n{entrada}',
              placeholder: 'Situação',
            },
            {
              rotulo: 'Aviso',
              modelo: 'Escreva um aviso curto e educado para colocar na recepção sobre:\n\n{entrada}',
              placeholder: 'Assunto',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Rotina da recepção',
          diario: true,
          itens: [
            'Conferir agenda do dia',
            'Confirmar horários',
            'Organizar balcão',
            'Registrar visitantes',
            'Repassar recados',
          ],
        },
      },
    ],
    atalhos: [
      'Como atender ao telefone de forma profissional?',
      'Como lidar com pessoa irritada no balcão?',
      'Frases em inglês e espanhol para recepção',
      'Escreva um modelo de confirmação de consulta',
    ],
    dica: 'A Kleo confirma horários, traduz para visitantes e conta o movimento da recepção.',
  },
]
