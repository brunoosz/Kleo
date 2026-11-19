import {
  Building2,
  Cog,
  Zap,
  Factory,
  CircuitBoard,
  FlaskConical,
  Microchip,
  Settings,
  PlugZap,
  Tractor,
} from 'lucide-react'
export default [
  {
    id: 'engenheiro-civil',
    label: 'Engenheiro civil',
    categoria: 'engenharia',
    icone: Building2,
    sinonimos: ['engenharia civil', 'obra', 'construcao civil', 'estrutural', 'calculista'],
    mascote: {
      nome: 'Bob',
      genero: 'm',
      cor: '#ffd9b0',
      chapeu: 'capacete_obra',
      item: 'regua',
      oculos: 'nenhum',
      roupa: 'colete',
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
        id: 'clima',
        config: {
          foco: 'obra',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Vistoria de obra',
          diario: true,
          itens: [
            'EPIs em uso pela equipe',
            'Escoramentos conferidos',
            'Armaduras conforme projeto',
            'Diário de obra preenchido',
            'Materiais recebidos conferidos',
            'Limpeza e organização do canteiro',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Inspecionar patologia',
          prompt:
            'Analise a foto em busca de patologias construtivas (fissuras, trincas, infiltração, eflorescência, corrosão de armadura). Classifique a gravidade provável e sugira investigação.',
          dica: 'Fotografe com uma referência de tamanho (caneta, trena).',
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento de obra',
        },
      },
    ],
    atalhos: [
      'Qual o traço de concreto para 25 MPa?',
      'Diferença entre fissura, trinca e rachadura',
      'Escreva um relatório de vistoria a partir das minhas notas',
      'Como planejar a concretagem com previsão de chuva?',
    ],
    dica: 'A Kleo calcula concreto e áreas, vê o clima da obra e inspeciona fissuras pela câmera.',
  },
  {
    id: 'engenheiro-mecanico',
    label: 'Engenheiro mecânico',
    categoria: 'engenharia',
    icone: Cog,
    sinonimos: ['engenharia mecanica', 'projetista mecanico', 'manutencao industrial'],
    mascote: {
      nome: 'Torque',
      genero: 'm',
      cor: '#ffd3a8',
      chapeu: 'capacete_obra',
      item: 'engrenagem',
      oculos: 'protecao',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'conversor_unidades',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente mecânico',
          prompts: [
            {
              rotulo: 'Dimensionamento',
              modelo: 'Mostre o passo a passo do dimensionamento (fórmulas e hipóteses) para:\n\n{entrada}',
              placeholder: 'Ex: eixo submetido a torque de 200 N.m',
            },
            {
              rotulo: 'Análise de falha',
              modelo:
                'Faça uma análise de causa raiz (5 porquês + Ishikawa) para esta falha mecânica:\n\n{entrada}',
              placeholder: 'Descreva a falha',
            },
            {
              rotulo: 'Plano de manutenção',
              modelo: 'Monte um plano de manutenção preventiva com periodicidades para:\n\n{entrada}',
              placeholder: 'Equipamento',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Inspecionar peça',
          prompt:
            'Analise a peça mecânica da foto: desgaste, trincas, corrosão, sinais de fadiga ou lubrificação inadequada. Indique causa provável e ação.',
          dica: 'Fotografe a região danificada de perto e de longe.',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Liberação de equipamento',
          itens: [
            'Bloqueio e etiquetagem (LOTO) removidos',
            'Proteções reinstaladas',
            'Lubrificação conferida',
            'Teste em vazio realizado',
            'Registro da intervenção',
          ],
        },
      },
    ],
    atalhos: [
      'Explique tensão de von Mises de forma simples',
      'Como escolher um rolamento?',
      'Converta 150 psi para bar e kgf/cm²',
      'Tipos de ajuste e tolerância ISO',
    ],
    dica: 'A Kleo converte unidades, analisa falhas e inspeciona peças pela câmera.',
  },
  {
    id: 'engenheiro-eletrico',
    label: 'Engenheiro elétrico',
    categoria: 'engenharia',
    icone: Zap,
    sinonimos: ['engenharia eletrica', 'projetista eletrico', 'energia', 'subestacao'],
    mascote: {
      nome: 'Volt',
      genero: 'm',
      cor: '#ffe6a3',
      chapeu: 'capacete_obra',
      item: 'raio',
      oculos: 'protecao',
      roupa: 'colete',
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
          tipo: 'consumo_eletrico',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente elétrico',
          prompts: [
            {
              rotulo: 'Dimensionar circuito',
              modelo: 'Dimensione condutor e disjuntor (NBR 5410) explicando o critério para:\n\n{entrada}',
              placeholder: 'Ex: chuveiro 7500 W, 220 V, 15 m',
            },
            {
              rotulo: 'Memorial descritivo',
              modelo: 'Escreva um memorial descritivo técnico para:\n\n{entrada}',
              placeholder: 'Descreva a instalação',
            },
            {
              rotulo: 'Eficiência energética',
              modelo: 'Sugira medidas de eficiência energética com estimativa de economia para:\n\n{entrada}',
              placeholder: 'Descreva o local e cargas',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Segurança NR-10',
          itens: [
            'Desenergizar e bloquear',
            'Testar ausência de tensão',
            'Aterramento temporário',
            'EPIs e EPCs adequados',
            'Sinalização da área',
            'Autorização de trabalho',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Analisar diagrama',
          prompt:
            'Interprete o diagrama unifilar ou esquema elétrico da foto. Explique o funcionamento e aponte possíveis erros.',
          dica: 'Fotografe o diagrama inteiro, legível.',
        },
      },
    ],
    atalhos: [
      'Explique fator de potência e como corrigir',
      'Diferença entre DR e DPS',
      'Como calcular queda de tensão?',
      'Vale a pena energia solar para uma casa de 300 kWh/mês?',
    ],
    dica: 'A Kleo calcula circuitos e consumo, segue a NR-10 com você e lê diagramas.',
  },
  {
    id: 'engenheiro-producao',
    label: 'Engenheiro de produção',
    categoria: 'engenharia',
    icone: Factory,
    sinonimos: ['engenharia de producao', 'processos', 'lean', 'qualidade', 'pcp', 'melhoria continua'],
    mascote: {
      nome: 'Hiro',
      genero: 'm',
      cor: '#ffd8c2',
      chapeu: 'capacete_obra',
      item: 'grafico',
      oculos: 'quadrado',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Produção',
          itens: ['Peças boas', 'Refugo', 'Retrabalho', 'Paradas'],
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
          titulo: 'Melhoria contínua',
          prompts: [
            {
              rotulo: 'Ishikawa',
              modelo: 'Monte um diagrama de Ishikawa (6M) em texto para este problema:\n\n{entrada}',
              placeholder: 'Descreva o problema',
            },
            {
              rotulo: 'Plano 5W2H',
              modelo: 'Crie um plano de ação 5W2H para:\n\n{entrada}',
              placeholder: 'Objetivo ou problema',
            },
            {
              rotulo: 'Calcular OEE',
              modelo:
                'Calcule e explique o OEE (disponibilidade, performance, qualidade) com estes dados:\n\n{entrada}',
              placeholder: 'Tempo disponível, paradas, produção, refugo',
            },
          ],
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Auditoria 5S',
          itens: [
            'Seiri: só o necessário',
            'Seiton: tudo identificado',
            'Seiso: área limpa',
            'Seiketsu: padrões visíveis',
            'Shitsuke: disciplina mantida',
          ],
        },
      },
    ],
    atalhos: [
      'Explique os 7 desperdícios do Lean',
      'Como fazer uma cronoanálise?',
      'Monte um kanban simples para a produção',
      'Como apresentar um A3 para a diretoria?',
    ],
    dica: 'A Kleo cronometra ciclos, conta produção e monta Ishikawa e 5W2H com você.',
  },
  {
    id: 'engenheiro-eletronico',
    label: 'Engenheiro eletrônico',
    categoria: 'engenharia',
    icone: CircuitBoard,
    sinonimos: ['engenharia eletronica', 'eletronica', 'pcb', 'projetista de placas'],
    mascote: {
      nome: 'Ohm',
      genero: 'm',
      cor: '#ffe0b8',
      chapeu: 'nenhum',
      item: 'chip',
      oculos: 'redondo',
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
        id: 'camera_ia',
        config: {
          titulo: 'Inspecionar placa',
          prompt:
            'Inspecione a placa de circuito da foto: soldas frias, pontes de solda, componentes queimados, capacitores estufados e trilhas danificadas.',
          dica: 'Use boa luz e fotografe bem de perto.',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de eletrônica',
          prompts: [
            {
              rotulo: 'Projetar circuito',
              modelo: 'Proponha um circuito (com valores de componentes) para:\n\n{entrada}',
              placeholder: 'Ex: fonte 5 V 2 A a partir de 12 V',
            },
            {
              rotulo: 'Ler datasheet',
              modelo: 'Resuma os parâmetros principais e cuidados de projeto deste componente:\n\n{entrada}',
              placeholder: 'Código do componente',
            },
          ],
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Componentes',
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
      'Como ler o código de cores de resistores?',
      'Diferença entre regulador linear e chaveado',
      'Como escolher um MOSFET para chavear um motor?',
      'Boas práticas de layout de PCB',
    ],
    dica: 'A Kleo inspeciona placas pela câmera, projeta circuitos e controla seus componentes.',
  },
  {
    id: 'engenheiro-quimico',
    label: 'Engenheiro químico',
    categoria: 'engenharia',
    icone: FlaskConical,
    sinonimos: ['engenharia quimica', 'quimico', 'processos quimicos', 'laboratorio'],
    mascote: {
      nome: 'Atom',
      genero: 'm',
      cor: '#ffcfb5',
      chapeu: 'nenhum',
      item: 'tubo_ensaio',
      oculos: 'protecao',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'regra_de_tres',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'conversor_unidades',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Reação',
              min: 30,
            },
            {
              nome: 'Agitação',
              min: 15,
            },
            {
              nome: 'Secagem',
              min: 60,
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler rótulo/FISPQ',
          prompt:
            'Leia o rótulo ou ficha de segurança do produto químico na foto. Resuma perigos (GHS), EPIs, armazenamento e primeiros socorros.',
          dica: 'Fotografe os pictogramas e frases de perigo.',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de processos',
          prompts: [
            {
              rotulo: 'Balanço de massa',
              modelo: 'Resolva passo a passo este balanço de massa/energia:\n\n{entrada}',
              placeholder: 'Descreva o processo e os dados',
            },
            {
              rotulo: 'Preparar solução',
              modelo: 'Explique como preparar esta solução (cálculos e procedimento seguro):\n\n{entrada}',
              placeholder: 'Ex: 500 mL de NaOH 0,1 mol/L',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Explique os pictogramas GHS',
      'Como fazer uma diluição C1V1 = C2V2?',
      'Boas práticas de descarte de resíduos químicos',
      'Diferença entre reator batelada e contínuo',
    ],
    dica: 'A Kleo prepara soluções, cronometra reações e lê rótulos de segurança pela câmera.',
  },
  {
    id: 'tecnico-eletronica',
    label: 'Técnico em eletrônica',
    categoria: 'engenharia',
    icone: Microchip,
    sinonimos: ['tecnico eletronico', 'conserto de eletronicos', 'reparo de placas', 'assistencia tecnica'],
    mascote: {
      nome: 'Spark',
      genero: 'm',
      cor: '#ffdcaa',
      chapeu: 'nenhum',
      item: 'chip',
      oculos: 'quadrado',
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
          rotulo: 'Orçamento de reparo',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Achar defeito na placa',
          prompt:
            'Inspecione a placa da foto procurando defeitos visíveis: capacitores estufados, componentes queimados, oxidação, soldas frias. Sugira por onde começar o reparo.',
          dica: 'Fotografe a placa inteira e depois a área suspeita.',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'lei_ohm',
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
      'TV liga e desliga sozinha. O que verificar?',
      'Como testar capacitor com multímetro?',
      'Como descarregar uma fonte com segurança?',
      'Quanto cobrar por troca de tela de celular?',
    ],
    dica: 'A Kleo acha defeitos visíveis pela câmera, faz orçamentos e controla peças.',
  },
  {
    id: 'tecnico-mecanica',
    label: 'Técnico em mecânica',
    categoria: 'engenharia',
    icone: Settings,
    sinonimos: ['tecnico mecanico', 'mecanica industrial', 'torneiro', 'ajustador', 'usinagem'],
    mascote: {
      nome: 'Mater',
      genero: 'm',
      cor: '#ffcf9e',
      chapeu: 'bone',
      item: 'chave_inglesa',
      oculos: 'protecao',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'conversor_unidades',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Manutenção preventiva',
          itens: [
            'Bloqueio LOTO aplicado',
            'Lubrificação nos pontos indicados',
            'Aperto de parafusos e fixações',
            'Verificar correias e alinhamento',
            'Medir vibração e temperatura',
            'Registrar no histórico',
          ],
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Assistente de oficina',
          prompts: [
            {
              rotulo: 'Parâmetros de corte',
              modelo:
                'Sugira rotação, avanço e profundidade de corte para esta usinagem, explicando o cálculo:\n\n{entrada}',
              placeholder: 'Ex: torneamento aço 1045, diâmetro 50 mm',
            },
            {
              rotulo: 'Diagnóstico',
              modelo: 'Liste causas prováveis e testes, em ordem, para este problema mecânico:\n\n{entrada}',
              placeholder: 'Descreva o sintoma',
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Ler desenho técnico',
          prompt:
            'Interprete o desenho técnico da foto: cotas, tolerâncias, rugosidade e simbologia de solda/usinagem.',
          dica: 'Fotografe a folha inteira, bem iluminada.',
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Peças e ferramentas',
        },
      },
    ],
    atalhos: [
      'Como ler um paquímetro de 0,02 mm?',
      'Torque de aperto para parafuso M10 classe 8.8',
      'Sinais de rolamento com problema',
      'Explique tolerância H7/g6',
    ],
    dica: 'A Kleo calcula parâmetros de corte, lê desenhos técnicos e guia a preventiva.',
  },
  {
    id: 'eletricista',
    label: 'Eletricista',
    categoria: 'engenharia',
    icone: PlugZap,
    sinonimos: ['eletricista predial', 'eletricista residencial', 'instalacao eletrica', 'eletrica'],
    mascote: {
      nome: 'Fulgor',
      genero: 'm',
      cor: '#fff0a0',
      chapeu: 'capacete_obra',
      item: 'raio',
      oculos: 'protecao',
      roupa: 'macacao',
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
          tipo: 'consumo_eletrico',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Segurança NR-10',
          itens: [
            'Desligar o disjuntor e sinalizar',
            'Testar ausência de tensão',
            'Luvas e ferramentas isoladas',
            'Calçado de segurança',
            'Nunca trabalhar com as mãos molhadas',
            'Religar só após conferir tudo',
          ],
        },
      },
      {
        id: 'orcamento',
        config: {
          rotulo: 'Orçamento elétrico',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Verificar quadro elétrico',
          prompt:
            'Analise a foto do quadro de distribuição. Aponte riscos (fios expostos, emendas, disjuntores subdimensionados, falta de DR/DPS, aquecimento) e melhorias.',
          dica: 'Fotografe o quadro aberto, de frente, com boa luz. Não toque em partes energizadas.',
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
      'Qual a bitola de fio para um chuveiro de 7500 W?',
      'O disjuntor desarma sozinho. O que pode ser?',
      'Como instalar um DR corretamente?',
      'Quanto cobrar para trocar a fiação de um apartamento?',
    ],
    dica: 'A Kleo calcula bitolas e consumo, monta orçamentos e revisa quadros pela câmera.',
  },
  {
    id: 'operador-maquinas',
    label: 'Operador de máquinas',
    categoria: 'engenharia',
    icone: Tractor,
    sinonimos: [
      'operador de maquina',
      'operador de producao',
      'operador industrial',
      'operador de empilhadeira',
      'retroescavadeira',
    ],
    mascote: {
      nome: 'Gear',
      genero: 'm',
      cor: '#ffd2a0',
      chapeu: 'capacete_obra',
      item: 'controle_remoto',
      oculos: 'protecao',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Inspeção antes de ligar',
          diario: true,
          itens: [
            'Nível de óleo e fluidos',
            'Proteções e botão de emergência',
            'Vazamentos',
            'Pneus/esteiras e freios',
            'Área livre de pessoas',
            'EPIs completos',
          ],
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Produção do turno',
          itens: ['Peças produzidas', 'Peças com defeito', 'Paradas'],
        },
      },
      {
        id: 'escala',
        config: {
          rotulo: 'Turnos',
        },
      },
      {
        id: 'temporizadores',
        config: {
          presets: [
            {
              nome: 'Pausa',
              min: 10,
            },
            {
              nome: 'Aquecimento',
              min: 5,
            },
            {
              nome: 'Troca de ferramenta',
              min: 15,
            },
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar defeito',
          prompt:
            'Analise a peça produzida ou a parte da máquina na foto. Aponte defeitos visíveis (rebarbas, desalinhamento, vazamento, desgaste) e o que comunicar à manutenção.',
          dica: 'Fotografe de perto, com a máquina desligada.',
        },
      },
    ],
    atalhos: [
      'O que fazer se a máquina travar no meio da produção?',
      'Como preencher o relatório de turno?',
      'Dicas de segurança com máquinas rotativas',
      'Alongamentos para fazer na pausa',
    ],
    dica: 'A Kleo faz o checklist antes de ligar, conta a produção e organiza seus turnos.',
  },
]
