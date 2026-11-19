import {
  Car,
  Bike,
  Truck,
  Plane,
  PlaneTakeoff,
  Package,
  Forklift,
  Boxes,
  Warehouse,
  Wrench,
} from 'lucide-react'
export default [
  {
    id: 'motorista',
    label: 'Motorista',
    categoria: 'transporte',
    icone: Car,
    sinonimos: [
      'motorista de aplicativo',
      'uber',
      '99',
      'taxista',
      'táxi',
      'motorista particular',
      'chofer',
      'van',
    ],
    mascote: {
      nome: 'Drive',
      genero: 'm',
      cor: '#b9dcf2',
      chapeu: 'bone',
      item: 'volante',
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
          tipo: 'combustivel',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'lucro_dia',
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'rua',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Revisão do carro',
          itens: [
            'Calibrar pneus',
            'Nível do óleo',
            'Água do radiador',
            'Luzes e setas',
            'Limpador de para-brisa',
            'Documento em dia',
            'Carro limpo para o passageiro',
          ],
        },
      },
    ],
    atalhos: [
      'Calcule quanto gasto de combustível por corrida',
      'Vale mais a pena etanol ou gasolina hoje?',
      'Quanto preciso rodar para lucrar R$ 200 por dia?',
      'Dicas de direção defensiva na chuva',
      'Quando trocar o óleo do carro?',
    ],
    dica: 'A Kleo controla seus ganhos, calcula o combustível e avisa do clima na rua.',
  },
  {
    id: 'motoboy',
    label: 'Motoboy',
    categoria: 'transporte',
    icone: Bike,
    sinonimos: ['motociclista', 'mototaxista', 'motofrete', 'moto entregador', 'motogirl'],
    mascote: {
      nome: 'Rush',
      genero: 'm',
      cor: '#ffd3a5',
      chapeu: 'capacete_moto',
      item: 'caixa',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
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
        id: 'calculadora',
        config: {
          tipo: 'combustivel',
        },
      },
      {
        id: 'caixa',
        config: {},
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Entregas do dia',
          itens: ['Entregas', 'Coletas', 'Retornos'],
        },
      },
    ],
    atalhos: [
      'Vai chover no meu turno hoje?',
      'Quanto a moto gasta por entrega?',
      'Dicas de segurança para pilotar na chuva',
      'Como organizar várias entregas na mesma região?',
      'Checklist rápido da moto antes de sair',
    ],
    dica: 'A Kleo organiza suas paradas, avisa a chuva e soma o que você ganhou.',
  },
  {
    id: 'caminhoneiro',
    label: 'Caminhoneiro',
    categoria: 'transporte',
    icone: Truck,
    sinonimos: ['motorista de caminhão', 'carreteiro', 'transportador', 'frete', 'estradeiro'],
    mascote: {
      nome: 'Haul',
      genero: 'm',
      cor: '#c8e6b0',
      chapeu: 'bone',
      item: 'volante',
      oculos: 'sol',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'paradas',
        config: {},
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'frete',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Pré-viagem',
          itens: [
            'Pneus e estepe',
            'Freios e ar',
            'Óleo e água',
            'Lonas e amarração da carga',
            'Tacógrafo',
            'Nota fiscal e documentos',
            'Kit de emergência',
          ],
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Pausa a cada 5h30 (Lei do Descanso)',
              min: 330,
            },
            {
              nome: 'Descanso de 30 min',
              min: 30,
            },
            {
              nome: 'Cochilo',
              min: 20,
            },
          ],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'combustivel',
        },
      },
    ],
    atalhos: [
      'Como calcular o valor justo de um frete?',
      'O que diz a Lei do Descanso sobre pausas?',
      'Dicas para não sentir sono ao volante',
      'Quanto diesel gasto em 800 km?',
      'Exercícios de alongamento para fazer na parada',
    ],
    dica: 'A Kleo calcula o frete, lembra das pausas da Lei do Descanso e guia suas paradas.',
  },
  {
    id: 'piloto',
    label: 'Piloto',
    categoria: 'transporte',
    icone: Plane,
    sinonimos: ['piloto de avião', 'aviador', 'comandante', 'copiloto', 'piloto de helicóptero'],
    mascote: {
      nome: 'Maverick',
      genero: 'm',
      cor: '#cde7fb',
      chapeu: 'piloto',
      item: 'aviao',
      oculos: 'sol',
      roupa: 'uniforme',
    },
    ferramentas: [
      {
        id: 'clima',
        config: {
          foco: 'voo',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'tempo_voo',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Pré-voo',
          itens: [
            'Inspeção externa',
            'Combustível conferido',
            'Peso e balanceamento',
            'METAR e TAF consultados',
            'NOTAMs lidos',
            'Plano de voo',
            'Briefing com a tripulação',
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
        id: 'tradutor',
        config: {},
      },
    ],
    atalhos: [
      'Explique este METAR para mim',
      'Como calcular o tempo de voo com vento de proa?',
      'Fraseologia em inglês para pedir descida',
      'Dicas para lidar com o jet lag',
      'Revisar limites de jornada do aeronauta',
    ],
    dica: 'A Kleo vê o tempo para voar, calcula o tempo de voo e repassa o checklist.',
  },
  {
    id: 'comissario-bordo',
    label: 'Comissário de bordo',
    categoria: 'transporte',
    icone: PlaneTakeoff,
    sinonimos: ['comissária', 'aeromoça', 'tripulante', 'flight attendant'],
    mascote: {
      nome: 'Sky',
      genero: 'f',
      cor: '#f9c6d3',
      chapeu: 'quepe',
      item: 'mala',
      oculos: 'nenhum',
      roupa: 'lenco',
    },
    ferramentas: [
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'tradutor',
        config: {},
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Mala de pernoite',
          itens: [
            'Uniforme reserva',
            'Documentos e passaporte',
            'Carregador e adaptador',
            'Remédios',
            'Itens de higiene',
            'Garrafa de água',
          ],
        },
      },
      {
        id: 'respiracao',
        config: {},
      },
    ],
    atalhos: [
      'Frases em inglês e espanhol para atender passageiros',
      'Como acalmar um passageiro com medo de voar?',
      'Dicas para dormir bem em pernoite',
      'O que levar na mala para um pernoite frio?',
      'Primeiros socorros básicos a bordo',
    ],
    dica: 'A Kleo organiza sua escala, traduz na hora e ajuda a relaxar entre voos.',
  },
  {
    id: 'entregador',
    label: 'Entregador',
    categoria: 'transporte',
    icone: Package,
    sinonimos: ['entregadora', 'delivery', 'ifood', 'bike entregador', 'ciclista entregador', 'carteiro'],
    mascote: {
      nome: 'Dash',
      genero: 'm',
      cor: '#ffe3a3',
      chapeu: 'bone',
      item: 'sacola',
      oculos: 'nenhum',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'paradas',
        config: {},
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Entregas',
          itens: ['Entregues', 'Ausentes', 'Devolvidas'],
        },
      },
      {
        id: 'caixa',
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
      'Qual a melhor ordem para estas entregas?',
      'Quanto ganhei por hora hoje?',
      'O que fazer quando o cliente não atende?',
      'Vai chover nas próximas horas?',
      'Dicas para cuidar da coluna carregando peso',
    ],
    dica: 'A Kleo ordena as entregas, conta as concluídas e mostra seu ganho do dia.',
  },
  {
    id: 'operador-logistico',
    label: 'Operador logístico',
    categoria: 'transporte',
    icone: Forklift,
    sinonimos: ['logística', 'operador de empilhadeira', 'conferente', 'expedição', 'separador'],
    mascote: {
      nome: 'Sokka',
      genero: 'm',
      cor: '#d2e7c4',
      chapeu: 'capacete_obra',
      item: 'prancheta',
      oculos: 'protecao',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Inspeção da empilhadeira',
          diario: true,
          itens: [
            'Freios',
            'Buzina e alarme de ré',
            'Garfos sem trinca',
            'Nível de bateria ou gás',
            'Pneus',
            'Cinto de segurança',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Expedição',
          itens: ['Paletes carregados', 'Volumes conferidos', 'Avarias'],
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler etiqueta',
          prompt:
            'Leia esta etiqueta ou nota de carga e extraia: código, destino, peso, quantidade de volumes e qualquer aviso de manuseio.',
          dica: 'Fotografe a etiqueta do volume',
        },
      },
    ],
    atalhos: [
      'O que é FIFO e FEFO?',
      'Como montar um palete com segurança?',
      'Explique a curva ABC de estoque',
      'Regras de segurança para empilhadeira',
      'Como reduzir erros de separação de pedidos?',
    ],
    dica: 'A Kleo faz a inspeção diária, conta a expedição e lê etiquetas pela câmera.',
  },
  {
    id: 'estoquista',
    label: 'Estoquista',
    categoria: 'transporte',
    icone: Boxes,
    sinonimos: ['repositor', 'auxiliar de estoque', 'controle de estoque', 'inventário'],
    mascote: {
      nome: 'Stock',
      genero: 'm',
      cor: '#f3d9b1',
      chapeu: 'bone',
      item: 'caixa',
      oculos: 'nenhum',
      roupa: 'avental',
    },
    ferramentas: [
      {
        id: 'estoque',
        config: {
          rotulo: 'Produtos',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Contagem rápida',
          itens: ['Caixas', 'Unidades', 'Avarias'],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Conferir validade',
          prompt:
            'Leia o rótulo deste produto e informe nome, lote e data de validade. Avise se estiver vencido ou vencendo em menos de 30 dias.',
          dica: 'Fotografe o rótulo com a data',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Recebimento de mercadoria',
          itens: [
            'Conferir nota fiscal',
            'Contar volumes',
            'Checar avarias',
            'Conferir validade',
            'Dar entrada no sistema',
            'Guardar no endereço certo',
          ],
        },
      },
    ],
    atalhos: [
      'Como organizar um inventário rápido?',
      'O que é estoque mínimo e como calcular?',
      'Como evitar produtos vencidos na prateleira?',
      'Explique PEPS de forma simples',
      'Monte uma planilha simples de estoque',
    ],
    dica: 'A Kleo controla o estoque, avisa a reposição e confere validades pela câmera.',
  },
  {
    id: 'almoxarife',
    label: 'Almoxarife',
    categoria: 'transporte',
    icone: Warehouse,
    sinonimos: ['almoxarifado', 'auxiliar de almoxarifado', 'controle de materiais', 'ferramentaria'],
    mascote: {
      nome: 'Depot',
      genero: 'm',
      cor: '#c9d6f5',
      chapeu: 'bone',
      item: 'chave',
      oculos: 'quadrado',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'estoque',
        config: {
          rotulo: 'Materiais',
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
          titulo: 'Fechamento do almoxarifado',
          diario: true,
          itens: [
            'Conferir retiradas do dia',
            'Ferramentas devolvidas',
            'EPIs repostos',
            'Pedidos de compra enviados',
            'Almoxarifado trancado',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Pedido de compra',
          prompts: [
            {
              rotulo: 'Pedido de compra',
              modelo:
                'Escreva um pedido de compra formal e organizado em tabela para estes materiais: {entrada}',
              placeholder: 'Liste materiais e quantidades',
            },
            {
              rotulo: 'Cobrar fornecedor',
              modelo: 'Escreva uma mensagem educada cobrando a entrega atrasada deste pedido: {entrada}',
              placeholder: 'Fornecedor, pedido e prazo',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Como controlar empréstimo de ferramentas?',
      'Como calcular o ponto de pedido?',
      'Organização de almoxarifado com endereçamento',
      'Como controlar a entrega de EPIs?',
      'Escreva um pedido de compra de materiais',
    ],
    dica: 'A Kleo controla materiais, alerta reposição e escreve seus pedidos de compra.',
  },
  {
    id: 'mecanico-automotivo',
    label: 'Mecânico automotivo',
    categoria: 'transporte',
    icone: Wrench,
    sinonimos: ['mecânico', 'oficina', 'funileiro', 'auto center', 'eletricista automotivo'],
    mascote: {
      nome: 'Luigi',
      genero: 'm',
      cor: '#b9d8f0',
      chapeu: 'bone',
      item: 'chave_inglesa',
      oculos: 'protecao',
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
          titulo: 'Diagnóstico pela foto',
          prompt:
            'Analise esta foto de uma peça ou parte do motor como um mecânico experiente. Aponte desgaste, vazamento ou dano visível, possíveis causas e o que verificar a seguir.',
          dica: 'Fotografe a peça, o vazamento ou a luz do painel',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Revisão completa',
          itens: [
            'Óleo e filtro',
            'Filtro de ar',
            'Pastilhas e discos',
            'Correia dentada',
            'Suspensão',
            'Bateria',
            'Fluido de freio',
            'Teste de rodagem',
          ],
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Peças',
        },
      },
    ],
    atalhos: [
      'O que significa a luz da injeção acesa?',
      'Barulho ao frear: o que pode ser?',
      'Torque de aperto das rodas de carro popular',
      'Monte um orçamento de revisão de 40 mil km',
      'Como explicar o defeito ao cliente de forma simples?',
    ],
    dica: 'A Kleo monta orçamentos, guarda seus clientes e ajuda no diagnóstico pela câmera.',
  },
]
