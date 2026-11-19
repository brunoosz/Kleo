import {
  Sprout,
  Wheat,
  ClipboardList,
  Beef,
  PawPrint,
  Tractor,
  Recycle,
  Microscope,
  TreePine,
} from 'lucide-react'
export default [
  {
    id: 'agricultor',
    label: 'Agricultor',
    categoria: 'agricultura',
    icone: Sprout,
    sinonimos: [
      'produtor rural',
      'lavrador',
      'roceiro',
      'sitiante',
      'horticultor',
      'fazendeiro',
      'agricultura familiar',
    ],
    mascote: {
      nome: 'Carl',
      genero: 'm',
      cor: '#cdeaa0',
      chapeu: 'palha',
      item: 'espiga',
      oculos: 'nenhum',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'clima',
        config: {
          foco: 'agro',
        },
      },
      {
        id: 'plantio',
        config: {},
      },
      {
        id: 'manejo',
        config: {},
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Identificar praga',
          prompt:
            'Analise esta planta ou folha como um agrônomo. Identifique praga, doença ou deficiência nutricional provável, o nível de gravidade e o controle indicado, priorizando opções de baixo custo e manejo integrado.',
          dica: 'Fotografe a folha atacada de perto',
        },
      },
      {
        id: 'caixa',
        config: {},
      },
    ],
    atalhos: [
      'Qual a melhor época para plantar milho na minha região?',
      'Como combater lagarta no milho sem gastar muito?',
      'Vai chover esta semana? Posso pulverizar?',
      'Como fazer adubo orgânico com o que tenho no sítio?',
      'Como vender minha produção direto na feira?',
    ],
    dica: 'A Kleo vê a chuva, organiza o plantio e identifica pragas pela câmera.',
  },
  {
    id: 'agronomo',
    label: 'Agrônomo',
    categoria: 'agricultura',
    icone: Wheat,
    sinonimos: ['engenheiro agrônomo', 'agronomia', 'consultor agrícola', 'assistência técnica rural'],
    mascote: {
      nome: 'Agro',
      genero: 'm',
      cor: '#f2e3a0',
      chapeu: 'bone',
      item: 'lupa',
      oculos: 'quadrado',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Diagnóstico de lavoura',
          prompt:
            'Faça um diagnóstico técnico desta foto de lavoura ou folha: praga, doença ou deficiência provável, estádio da cultura, nível de dano econômico e recomendação de manejo integrado.',
          dica: 'Fotografe a planta e o sintoma de perto',
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'agro',
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
          rotulo: 'Clientes',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Laudos e recomendações',
          prompts: [
            {
              rotulo: 'Recomendação técnica',
              modelo:
                'Escreva uma recomendação técnica clara para o produtor, em linguagem simples, sobre: {entrada}',
              placeholder: 'Cultura, problema e área',
            },
            {
              rotulo: 'Interpretar análise de solo',
              modelo: 'Interprete esta análise de solo e sugira calagem e adubação: {entrada}',
              placeholder: 'Cole os valores da análise',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Calcule a calagem pela saturação por bases',
      'Recomendação de adubação para soja',
      'Como montar um plano de MIP para lagarta?',
      'Explique a análise de solo para o produtor de forma simples',
      'Janela de plantio do feijão no Paraná',
    ],
    dica: 'A Kleo faz diagnósticos pela câmera, interpreta análises e escreve recomendações.',
  },
  {
    id: 'tecnico-agricola',
    label: 'Técnico agrícola',
    categoria: 'agricultura',
    icone: ClipboardList,
    sinonimos: ['técnico em agropecuária', 'técnico agropecuário', 'extensionista', 'emater'],
    mascote: {
      nome: 'Crop',
      genero: 'm',
      cor: '#d8eeb0',
      chapeu: 'bone',
      item: 'prancheta',
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
          titulo: 'Visita à propriedade',
          itens: [
            'Conversar com o produtor',
            'Vistoriar a lavoura',
            'Fotografar sintomas',
            'Coletar amostra de solo',
            'Conferir armazenamento de defensivos',
            'Registrar recomendações',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Identificar praga',
          prompt:
            'Identifique a praga, doença ou deficiência nesta foto e recomende o manejo mais simples e seguro para um pequeno produtor.',
          dica: 'Fotografe o sintoma de perto',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'regra_de_tres',
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
      'Como calibrar um pulverizador costal?',
      'Dose de defensivo para um tanque de 20 litros',
      'Como coletar amostra de solo corretamente?',
      'Regras de armazenamento de agrotóxicos',
      'Resuma o PRONAF para o produtor',
    ],
    dica: 'A Kleo organiza suas visitas, guia o checklist e identifica pragas pela câmera.',
  },
  {
    id: 'zootecnista',
    label: 'Zootecnista',
    categoria: 'agricultura',
    icone: Beef,
    sinonimos: ['zootecnia', 'nutrição animal', 'produção animal', 'pecuarista', 'criador'],
    mascote: {
      nome: 'Fauna',
      genero: 'f',
      cor: '#f6d5c3',
      chapeu: 'palha',
      item: 'balanca',
      oculos: 'redondo',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'calculadora',
        config: {
          tipo: 'dosagem_racao',
        },
      },
      {
        id: 'manejo',
        config: {
          itens: ['Vacinação', 'Pesagem', 'Vermifugação', 'Inseminação', 'Desmama'],
        },
      },
      {
        id: 'estoque',
        config: {
          rotulo: 'Ração e insumos',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Escore corporal',
          prompt:
            'Avalie o escore de condição corporal deste animal (escala 1 a 5), o estado geral aparente e sugestões de ajuste na nutrição.',
          dica: 'Fotografe o animal de lado e por trás',
        },
      },
    ],
    atalhos: [
      'Quanto de ração por dia para um bezerro de 150 kg?',
      'Como formular uma dieta para vaca leiteira?',
      'Calendário de vacinação de bovinos',
      'Como melhorar o ganho de peso no pasto seco?',
      'Calcule a lotação do pasto em UA por hectare',
    ],
    dica: 'A Kleo calcula a ração, organiza o manejo e avalia o escore corporal pela foto.',
  },
  {
    id: 'veterinario-rural',
    label: 'Veterinário rural',
    categoria: 'agricultura',
    icone: PawPrint,
    sinonimos: ['veterinário de grandes animais', 'médico veterinário rural', 'buiatra', 'veterinária rural'],
    mascote: {
      nome: 'Ranch',
      genero: 'm',
      cor: '#e3d6f5',
      chapeu: 'palha',
      item: 'seringa',
      oculos: 'nenhum',
      roupa: 'jaleco',
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
          tipo: 'regra_de_tres',
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar lesão',
          prompt:
            'Descreva esta lesão ou sinal clínico em animal de produção, liste diagnósticos diferenciais prováveis e exames ou condutas a considerar. Lembre que é apoio, não substitui o exame clínico.',
          dica: 'Fotografe a lesão com boa luz',
        },
      },
      {
        id: 'manejo',
        config: {
          itens: [
            'Vacinação',
            'Exame de brucelose',
            'Exame de tuberculose',
            'Diagnóstico de prenhez',
            'Casqueamento',
          ],
        },
      },
    ],
    atalhos: [
      'Calcule a dose de medicamento por peso do animal',
      'Sinais de tristeza parasitária em bovinos',
      'Protocolo de IATF passo a passo',
      'Calendário sanitário de ovinos',
      'Como orientar o produtor sobre carência de medicamentos?',
    ],
    dica: 'A Kleo organiza a rota das fazendas, calcula doses e registra o manejo sanitário.',
  },
  {
    id: 'operador-maquinas-agricolas',
    label: 'Operador de máquinas agrícolas',
    categoria: 'agricultura',
    icone: Tractor,
    sinonimos: ['tratorista', 'operador de colheitadeira', 'operador de trator', 'operador de pulverizador'],
    mascote: {
      nome: 'Tractor',
      genero: 'm',
      cor: '#ffe49e',
      chapeu: 'bone',
      item: 'volante',
      oculos: 'sol',
      roupa: 'macacao',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Antes de ligar a máquina',
          diario: true,
          itens: [
            'Nível de óleo do motor',
            'Água do radiador',
            'Combustível',
            'Pneus',
            'Engraxar pontos',
            'Luzes e sinalização',
            'Filtro de ar limpo',
          ],
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'agro',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'combustivel',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Produção do dia',
          itens: ['Hectares feitos', 'Tanques aplicados', 'Cargas colhidas'],
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
      'Quanto diesel o trator gasta por hectare?',
      'Vento bom para pulverizar hoje?',
      'Como regular a colheitadeira para perder menos grãos?',
      'O que significa a luz de alerta no painel do trator?',
      'Cuidados de segurança perto da tomada de força',
    ],
    dica: 'A Kleo confere a máquina antes de sair, vê o vento e conta sua produção do dia.',
  },
  {
    id: 'engenheiro-ambiental',
    label: 'Engenheiro ambiental',
    categoria: 'agricultura',
    icone: Recycle,
    sinonimos: [
      'engenharia ambiental',
      'gestor ambiental',
      'licenciamento ambiental',
      'sustentabilidade',
      'meio ambiente',
    ],
    mascote: {
      nome: 'Gaia',
      genero: 'f',
      cor: '#bfe8d0',
      chapeu: 'capacete_obra',
      item: 'folha',
      oculos: 'quadrado',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'checklist',
        config: {
          titulo: 'Vistoria ambiental',
          itens: [
            'Licenças em dia',
            'Destinação de resíduos',
            'Efluentes tratados',
            'Área de preservação respeitada',
            'Fotos georreferenciadas',
            'Registro de não conformidades',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Avaliar impacto',
          prompt:
            'Analise esta foto quanto a impactos ambientais visíveis (erosão, descarte irregular, contaminação, desmatamento). Classifique a gravidade e sugira medidas corretivas.',
          dica: 'Fotografe a área ou o ponto de descarte',
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'area_m2',
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Relatórios',
          prompts: [
            {
              rotulo: 'Relatório de vistoria',
              modelo:
                'Transforme estas anotações de campo em um relatório técnico de vistoria ambiental: {entrada}',
              placeholder: 'Cole suas anotações',
            },
            {
              rotulo: 'Explicar legislação',
              modelo:
                'Explique de forma simples o que a legislação ambiental brasileira diz sobre: {entrada}',
              placeholder: 'Ex: APP em beira de rio',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Qual a largura de APP para um rio de 10 m?',
      'Etapas do licenciamento ambiental',
      'Como montar um plano de gerenciamento de resíduos?',
      'O que é o CAR e quem precisa fazer?',
      'Escreva um relatório de vistoria com estas notas',
    ],
    dica: 'A Kleo guia vistorias, avalia impactos pela câmera e escreve seus relatórios.',
  },
  {
    id: 'biologo',
    label: 'Biólogo',
    categoria: 'agricultura',
    icone: Microscope,
    sinonimos: ['bióloga', 'biologia', 'pesquisador de campo', 'ecólogo', 'botânico', 'zoólogo'],
    mascote: {
      nome: 'Bio',
      genero: 'm',
      cor: '#c8f0e0',
      chapeu: 'nenhum',
      item: 'tubo_ensaio',
      oculos: 'redondo',
      roupa: 'jaleco',
    },
    ferramentas: [
      {
        id: 'camera_ia',
        config: {
          titulo: 'Identificar espécie',
          prompt:
            'Identifique a espécie (planta, inseto, ave ou outro animal) desta foto: nome popular, nome científico provável, características que justificam a identificação e curiosidades.',
          dica: 'Fotografe o organismo com detalhes',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Levantamento de campo',
          itens: ['Espécie A', 'Espécie B', 'Espécie C', 'Não identificada'],
        },
      },
      {
        id: 'clima',
        config: {
          foco: 'geral',
        },
      },
      {
        id: 'cronometro',
        config: {
          voltas: true,
        },
      },
      {
        id: 'assistente',
        config: {
          titulo: 'Ciência rápida',
          prompts: [
            {
              rotulo: 'Resumir artigo',
              modelo:
                'Resuma este trecho de artigo científico em linguagem simples, com objetivo, método e conclusão: {entrada}',
              placeholder: 'Cole o resumo do artigo',
            },
            {
              rotulo: 'Explicar conceito',
              modelo: 'Explique de forma didática para alunos: {entrada}',
              placeholder: 'Ex: fotossíntese',
            },
          ],
        },
      },
    ],
    atalhos: [
      'Que espécie é esta?',
      'Como fazer um levantamento de aves por ponto de escuta?',
      'Resuma este artigo científico',
      'Explique cadeia alimentar de forma simples',
      'Como montar um herbário caseiro?',
    ],
    dica: 'A Kleo identifica espécies pela câmera e conta seus registros de campo.',
  },
  {
    id: 'tecnico-florestal',
    label: 'Técnico florestal',
    categoria: 'agricultura',
    icone: TreePine,
    sinonimos: ['engenheiro florestal', 'silvicultura', 'reflorestamento', 'manejo florestal', 'viveirista'],
    mascote: {
      nome: 'Forest',
      genero: 'm',
      cor: '#b5dfb8',
      chapeu: 'capacete_obra',
      item: 'trena',
      oculos: 'protecao',
      roupa: 'colete',
    },
    ferramentas: [
      {
        id: 'clima',
        config: {
          foco: 'agro',
        },
      },
      {
        id: 'contador',
        config: {
          rotulo: 'Inventário florestal',
          itens: ['Árvores medidas', 'Mudas plantadas', 'Mudas mortas'],
        },
      },
      {
        id: 'calculadora',
        config: {
          tipo: 'area_m2',
        },
      },
      {
        id: 'checklist',
        config: {
          titulo: 'Saída a campo',
          itens: [
            'GPS e mapa',
            'Trena e fita métrica',
            'Hipsômetro',
            'EPI e perneira',
            'Água e protetor solar',
            'Avisar a equipe do trajeto',
          ],
        },
      },
      {
        id: 'camera_ia',
        config: {
          titulo: 'Saúde da árvore',
          prompt:
            'Avalie a saúde desta árvore ou muda: espécie provável, sinais de praga, fungo, cupim ou risco de queda, e recomendação de manejo.',
          dica: 'Fotografe o tronco, a copa e as folhas',
        },
      },
    ],
    atalhos: [
      'Como calcular o volume de madeira de uma árvore?',
      'Espaçamento ideal para plantio de eucalipto',
      'Espécies nativas para recuperar mata ciliar',
      'Risco de incêndio com este tempo seco?',
      'Como medir o DAP corretamente?',
    ],
    dica: 'A Kleo conta seu inventário, prepara a saída a campo e avalia árvores pela câmera.',
  },
]
