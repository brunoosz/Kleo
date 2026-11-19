import {
  Fuel,
  Wallet,
  Percent,
  Tag,
  BadgePercent,
  Landmark,
  Clock,
  Truck,
  Ruler,
  PaintRoller,
  Layers,
  Plug,
  Zap,
  HeartPulse,
  Receipt,
  Scale,
  ChefHat,
  Coffee,
  ArrowLeftRight,
  Plane,
  Dumbbell,
  Wheat,
  TrendingUp,
} from 'lucide-react'
import { fmt, reais, horasMin } from './comum'
const ok = n => Number.isFinite(n)
const pos = n => ok(n) && n > 0
export const CALCULADORAS = {
  combustivel: {
    nome: 'Custo de combustível',
    icone: Fuel,
    explicacao: 'Divide a distância pelo consumo do veículo e multiplica pelo preço do litro.',
    campos: [
      {
        id: 'km',
        rotulo: 'Distância',
        unidade: 'km',
        padrao: '',
      },
      {
        id: 'consumo',
        rotulo: 'Consumo',
        unidade: 'km/l',
        padrao: '10',
      },
      {
        id: 'preco',
        rotulo: 'Preço do litro',
        unidade: 'R$',
        padrao: '5,89',
      },
      {
        id: 'ida',
        rotulo: 'Trajeto',
        padrao: 'ida',
        opcoes: [
          {
            id: 'ida',
            label: 'Só ida',
          },
          {
            id: 'volta',
            label: 'Ida e volta',
          },
        ],
      },
    ],
    calcular: v => {
      if (!pos(v.km) || !pos(v.consumo) || !ok(v.preco)) return null
      const dist = v.km * (v.ida === 'volta' ? 2 : 1)
      const litros = dist / v.consumo
      return {
        principal: {
          rotulo: 'Custo da viagem',
          valor: reais(litros * v.preco),
        },
        extras: [
          {
            rotulo: 'Combustível',
            valor: `${fmt(litros, 1)} L`,
          },
          {
            rotulo: 'Distância total',
            valor: `${fmt(dist, 1)} km`,
          },
        ],
      }
    },
  },
  lucro_dia: {
    nome: 'Lucro do dia',
    icone: Wallet,
    explicacao: 'Lucro é o que você ganhou menos tudo o que gastou para trabalhar.',
    campos: [
      {
        id: 'ganho',
        rotulo: 'Quanto ganhou',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'gastos',
        rotulo: 'Gastos (material, combustível)',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'horas',
        rotulo: 'Horas trabalhadas',
        unidade: 'h',
        padrao: '8',
      },
    ],
    calcular: v => {
      if (!ok(v.ganho)) return null
      const lucro = v.ganho - (ok(v.gastos) ? v.gastos : 0)
      const extras = [
        {
          rotulo: 'Margem',
          valor: v.ganho > 0 ? `${fmt((lucro / v.ganho) * 100, 1)}%` : '-',
        },
      ]
      if (pos(v.horas))
        extras.unshift({
          rotulo: 'Por hora',
          valor: reais(lucro / v.horas),
        })
      return {
        principal: {
          rotulo: lucro >= 0 ? 'Lucro' : 'Prejuízo',
          valor: reais(lucro),
        },
        extras,
      }
    },
  },
  comissao: {
    nome: 'Comissão',
    icone: BadgePercent,
    explicacao: 'Comissão = total vendido vezes o percentual. Somamos o salário fixo, se houver.',
    campos: [
      {
        id: 'vendas',
        rotulo: 'Total vendido',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'taxa',
        rotulo: 'Comissão',
        unidade: '%',
        padrao: '5',
      },
      {
        id: 'fixo',
        rotulo: 'Salário fixo',
        unidade: 'R$',
        padrao: '0',
      },
    ],
    calcular: v => {
      if (!ok(v.vendas) || !ok(v.taxa)) return null
      const c = (v.vendas * v.taxa) / 100
      return {
        principal: {
          rotulo: 'Comissão',
          valor: reais(c),
        },
        extras: [
          {
            rotulo: 'Total a receber',
            valor: reais(c + (ok(v.fixo) ? v.fixo : 0)),
          },
        ],
      }
    },
  },
  markup: {
    nome: 'Preço de venda',
    icone: Tag,
    explicacao: 'Para ter a margem desejada sobre o preço final, dividimos o custo por (1 menos a margem).',
    campos: [
      {
        id: 'custo',
        rotulo: 'Custo do produto',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'margem',
        rotulo: 'Margem de lucro desejada',
        unidade: '%',
        padrao: '30',
      },
      {
        id: 'taxas',
        rotulo: 'Impostos e taxas',
        unidade: '%',
        padrao: '0',
      },
    ],
    calcular: v => {
      const t = (ok(v.margem) ? v.margem : 0) + (ok(v.taxas) ? v.taxas : 0)
      if (!pos(v.custo) || t >= 100) return null
      const preco = v.custo / (1 - t / 100)
      return {
        principal: {
          rotulo: 'Preço sugerido',
          valor: reais(preco),
        },
        extras: [
          {
            rotulo: 'Lucro por unidade',
            valor: reais((preco * (v.margem || 0)) / 100),
          },
          {
            rotulo: 'Markup',
            valor: `${fmt(preco / v.custo, 2)}x`,
          },
        ],
      }
    },
  },
  desconto: {
    nome: 'Desconto',
    icone: Percent,
    explicacao: 'Tiramos o percentual do preço original.',
    campos: [
      {
        id: 'preco',
        rotulo: 'Preço original',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'desc',
        rotulo: 'Desconto',
        unidade: '%',
        padrao: '10',
      },
    ],
    calcular: v => {
      if (!ok(v.preco) || !ok(v.desc)) return null
      const economia = (v.preco * v.desc) / 100
      return {
        principal: {
          rotulo: 'Preço final',
          valor: reais(v.preco - economia),
        },
        extras: [
          {
            rotulo: 'Você economiza',
            valor: reais(economia),
          },
        ],
      }
    },
  },
  porcentagem: {
    nome: 'Porcentagem',
    icone: Percent,
    explicacao: 'Três contas comuns de porcentagem num só lugar.',
    campos: [
      {
        id: 'modo',
        rotulo: 'O que calcular',
        padrao: 'de',
        opcoes: [
          {
            id: 'de',
            label: 'X% de um valor',
          },
          {
            id: 'quanto',
            label: 'Quanto % é',
          },
          {
            id: 'variacao',
            label: 'Aumento ou queda',
          },
        ],
      },
      {
        id: 'a',
        rotulo: 'Percentual',
        unidade: '%',
        padrao: '',
        mostrar: v => v.modo === 'de',
      },
      {
        id: 'a2',
        rotulo: 'Parte',
        padrao: '',
        mostrar: v => v.modo === 'quanto',
      },
      {
        id: 'a3',
        rotulo: 'Valor antigo',
        padrao: '',
        mostrar: v => v.modo === 'variacao',
      },
      {
        id: 'b',
        rotulo: 'Valor total',
        padrao: '',
        mostrar: v => v.modo !== 'variacao',
      },
      {
        id: 'b3',
        rotulo: 'Valor novo',
        padrao: '',
        mostrar: v => v.modo === 'variacao',
      },
    ],
    calcular: v => {
      if (v.modo === 'quanto')
        return pos(v.b) && ok(v.a2)
          ? {
              principal: {
                rotulo: 'Representa',
                valor: `${fmt((v.a2 / v.b) * 100, 2)}%`,
              },
              extras: [],
            }
          : null
      if (v.modo === 'variacao') {
        if (!pos(v.a3) || !ok(v.b3)) return null
        const d = ((v.b3 - v.a3) / v.a3) * 100
        return {
          principal: {
            rotulo: d >= 0 ? 'Aumento' : 'Queda',
            valor: `${fmt(Math.abs(d), 2)}%`,
          },
          extras: [
            {
              rotulo: 'Diferença',
              valor: fmt(v.b3 - v.a3, 2),
            },
          ],
        }
      }
      return ok(v.a) && ok(v.b)
        ? {
            principal: {
              rotulo: 'Resultado',
              valor: fmt((v.a * v.b) / 100, 2),
            },
            extras: [],
          }
        : null
    },
  },
  juros: {
    nome: 'Juros e parcelas',
    icone: Landmark,
    explicacao:
      'Juros compostos crescem sobre o valor acumulado. A parcela usa a tabela Price (prestações iguais).',
    campos: [
      {
        id: 'capital',
        rotulo: 'Valor',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'taxa',
        rotulo: 'Juros ao mês',
        unidade: '%',
        padrao: '2',
      },
      {
        id: 'meses',
        rotulo: 'Meses',
        padrao: '12',
      },
      {
        id: 'tipo',
        rotulo: 'Tipo de juros',
        padrao: 'composto',
        opcoes: [
          {
            id: 'composto',
            label: 'Compostos',
          },
          {
            id: 'simples',
            label: 'Simples',
          },
        ],
      },
    ],
    calcular: v => {
      if (!pos(v.capital) || !ok(v.taxa) || !pos(v.meses)) return null
      const i = v.taxa / 100
      const montante =
        v.tipo === 'simples' ? v.capital * (1 + i * v.meses) : v.capital * Math.pow(1 + i, v.meses)
      const parcela =
        v.tipo === 'simples'
          ? montante / v.meses
          : i > 0
            ? (v.capital * i) / (1 - Math.pow(1 + i, -v.meses))
            : v.capital / v.meses
      return {
        principal: {
          rotulo: 'Total no fim',
          valor: reais(montante),
        },
        extras: [
          {
            rotulo: 'Só de juros',
            valor: reais(montante - v.capital),
          },
          {
            rotulo: `Parcela (${fmt(v.meses, 0)}x)`,
            valor: reais(parcela),
          },
        ],
      }
    },
  },
  hora_extra: {
    nome: 'Hora extra',
    icone: Clock,
    explicacao:
      'Valor da hora = salário dividido pelas horas do mês. A hora extra soma o adicional (50% em dias úteis, 100% em domingos e feriados).',
    campos: [
      {
        id: 'salario',
        rotulo: 'Salário mensal',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'jornada',
        rotulo: 'Horas no mês',
        unidade: 'h',
        padrao: '220',
      },
      {
        id: 'extras',
        rotulo: 'Horas extras feitas',
        unidade: 'h',
        padrao: '',
      },
      {
        id: 'adicional',
        rotulo: 'Adicional',
        padrao: '50',
        opcoes: [
          {
            id: '50',
            label: '50%',
          },
          {
            id: '100',
            label: '100%',
          },
        ],
      },
    ],
    calcular: v => {
      if (!pos(v.salario) || !pos(v.jornada) || !ok(v.extras)) return null
      const hora = v.salario / v.jornada
      const he = hora * (1 + Number(v.adicional) / 100)
      return {
        principal: {
          rotulo: 'A receber de horas extras',
          valor: reais(he * v.extras),
        },
        extras: [
          {
            rotulo: 'Valor da hora normal',
            valor: reais(hora),
          },
          {
            rotulo: 'Valor da hora extra',
            valor: reais(he),
          },
        ],
      }
    },
  },
  frete: {
    nome: 'Preço do frete',
    icone: Truck,
    explicacao:
      'Custo = combustível (ida e volta) + pedágios + outros. Somamos a margem para chegar ao preço.',
    campos: [
      {
        id: 'km',
        rotulo: 'Distância (só ida)',
        unidade: 'km',
        padrao: '',
      },
      {
        id: 'consumo',
        rotulo: 'Consumo',
        unidade: 'km/l',
        padrao: '3',
      },
      {
        id: 'diesel',
        rotulo: 'Preço do combustível',
        unidade: 'R$',
        padrao: '6,10',
      },
      {
        id: 'pedagio',
        rotulo: 'Pedágios e outros',
        unidade: 'R$',
        padrao: '0',
      },
      {
        id: 'margem',
        rotulo: 'Margem',
        unidade: '%',
        padrao: '30',
      },
    ],
    calcular: v => {
      if (!pos(v.km) || !pos(v.consumo) || !ok(v.diesel)) return null
      const custo = ((v.km * 2) / v.consumo) * v.diesel + (ok(v.pedagio) ? v.pedagio : 0)
      const preco = custo * (1 + (ok(v.margem) ? v.margem : 0) / 100)
      return {
        principal: {
          rotulo: 'Preço sugerido',
          valor: reais(preco),
        },
        extras: [
          {
            rotulo: 'Custo total',
            valor: reais(custo),
          },
          {
            rotulo: 'Por km rodado',
            valor: reais(preco / v.km),
          },
        ],
      }
    },
  },
  area_m2: {
    nome: 'Área em m²',
    icone: Ruler,
    explicacao: 'Área = largura vezes comprimento. Somamos a perda para comprar material com folga.',
    campos: [
      {
        id: 'larg',
        rotulo: 'Largura',
        unidade: 'm',
        padrao: '',
      },
      {
        id: 'comp',
        rotulo: 'Comprimento',
        unidade: 'm',
        padrao: '',
      },
      {
        id: 'perda',
        rotulo: 'Perda / sobra',
        unidade: '%',
        padrao: '10',
      },
    ],
    calcular: v => {
      if (!pos(v.larg) || !pos(v.comp)) return null
      const a = v.larg * v.comp
      return {
        principal: {
          rotulo: 'Área',
          valor: `${fmt(a, 2)} m²`,
        },
        extras: [
          {
            rotulo: 'Comprar (com perda)',
            valor: `${fmt(a * (1 + (v.perda || 0) / 100), 2)} m²`,
          },
          {
            rotulo: 'Perímetro',
            valor: `${fmt(2 * (v.larg + v.comp), 2)} m`,
          },
        ],
      }
    },
  },
  tinta: {
    nome: 'Quantidade de tinta',
    icone: PaintRoller,
    explicacao:
      'Litros = área vezes demãos dividido pelo rendimento. O rendimento médio fica perto de 10 m² por litro por demão.',
    campos: [
      {
        id: 'area',
        rotulo: 'Área a pintar',
        unidade: 'm²',
        padrao: '',
      },
      {
        id: 'demaos',
        rotulo: 'Demãos',
        padrao: '2',
      },
      {
        id: 'rend',
        rotulo: 'Rendimento',
        unidade: 'm²/L',
        padrao: '10',
      },
      {
        id: 'lata',
        rotulo: 'Embalagem',
        padrao: '18',
        opcoes: [
          {
            id: '18',
            label: 'Lata 18 L',
          },
          {
            id: '3.6',
            label: 'Galão 3,6 L',
          },
          {
            id: '0.9',
            label: 'Quarto 0,9 L',
          },
        ],
      },
    ],
    calcular: v => {
      if (!pos(v.area) || !pos(v.demaos) || !pos(v.rend)) return null
      const litros = (v.area * v.demaos) / v.rend
      const lata = Number(v.lata)
      return {
        principal: {
          rotulo: 'Tinta necessária',
          valor: `${fmt(litros, 1)} L`,
        },
        extras: [
          {
            rotulo: 'Embalagens',
            valor: `${Math.ceil(litros / lata)} de ${fmt(lata, 1)} L`,
          },
        ],
      }
    },
  },
  concreto: {
    nome: 'Concreto',
    icone: Layers,
    explicacao:
      'Volume = comprimento x largura x espessura. Traço 1:2:3 por m³: cerca de 7 sacos de cimento, 0,56 m³ de areia e 0,84 m³ de brita (já com 5% de perda).',
    campos: [
      {
        id: 'comp',
        rotulo: 'Comprimento',
        unidade: 'm',
        padrao: '',
      },
      {
        id: 'larg',
        rotulo: 'Largura',
        unidade: 'm',
        padrao: '',
      },
      {
        id: 'esp',
        rotulo: 'Espessura',
        unidade: 'cm',
        padrao: '10',
      },
    ],
    calcular: v => {
      if (!pos(v.comp) || !pos(v.larg) || !pos(v.esp)) return null
      const vol = v.comp * v.larg * (v.esp / 100) * 1.05
      return {
        principal: {
          rotulo: 'Volume de concreto',
          valor: `${fmt(vol, 2)} m³`,
        },
        extras: [
          {
            rotulo: 'Cimento (50 kg)',
            valor: `${Math.ceil(vol * 7)} sacos`,
          },
          {
            rotulo: 'Areia',
            valor: `${fmt(vol * 0.56, 2)} m³`,
          },
          {
            rotulo: 'Brita',
            valor: `${fmt(vol * 0.84, 2)} m³`,
          },
          {
            rotulo: 'Água',
            valor: `${fmt(vol * 180, 0)} L`,
          },
        ],
      }
    },
  },
  consumo_eletrico: {
    nome: 'Consumo de energia',
    icone: Plug,
    explicacao: 'kWh = potência (W) x horas de uso / 1000. Multiplicamos pela tarifa da sua conta de luz.',
    campos: [
      {
        id: 'w',
        rotulo: 'Potência do aparelho',
        unidade: 'W',
        padrao: '',
      },
      {
        id: 'horas',
        rotulo: 'Horas por dia',
        unidade: 'h',
        padrao: '4',
      },
      {
        id: 'dias',
        rotulo: 'Dias no mês',
        padrao: '30',
      },
      {
        id: 'tarifa',
        rotulo: 'Tarifa',
        unidade: 'R$/kWh',
        padrao: '0,85',
      },
    ],
    calcular: v => {
      if (!pos(v.w) || !ok(v.horas) || !ok(v.dias)) return null
      const kwh = (v.w * v.horas * v.dias) / 1000
      return {
        principal: {
          rotulo: 'Custo por mês',
          valor: reais(kwh * (v.tarifa || 0)),
        },
        extras: [
          {
            rotulo: 'Consumo',
            valor: `${fmt(kwh, 1)} kWh/mês`,
          },
          {
            rotulo: 'Por dia',
            valor: reais((kwh * (v.tarifa || 0)) / (v.dias || 1)),
          },
        ],
      }
    },
  },
  lei_ohm: {
    nome: 'Lei de Ohm',
    icone: Zap,
    explicacao: 'V = R x I e P = V x I. Escolha o que quer descobrir e informe os outros dois valores.',
    campos: [
      {
        id: 'alvo',
        rotulo: 'Descobrir',
        padrao: 'i',
        opcoes: [
          {
            id: 'v',
            label: 'Tensão (V)',
          },
          {
            id: 'i',
            label: 'Corrente (A)',
          },
          {
            id: 'r',
            label: 'Resistência (Ω)',
          },
        ],
      },
      {
        id: 'v',
        rotulo: 'Tensão',
        unidade: 'V',
        padrao: '220',
        mostrar: v => v.alvo !== 'v',
      },
      {
        id: 'i',
        rotulo: 'Corrente',
        unidade: 'A',
        padrao: '',
        mostrar: v => v.alvo !== 'i',
      },
      {
        id: 'r',
        rotulo: 'Resistência',
        unidade: 'Ω',
        padrao: '',
        mostrar: v => v.alvo !== 'r',
      },
    ],
    calcular: v => {
      let { v: V, i: I, r: R } = v
      if (v.alvo === 'v') {
        if (!pos(I) || !pos(R)) return null
        V = I * R
      } else if (v.alvo === 'i') {
        if (!pos(V) || !pos(R)) return null
        I = V / R
      } else {
        if (!pos(V) || !pos(I)) return null
        R = V / I
      }
      const unid = {
        v: ['Tensão', `${fmt(V, 2)} V`],
        i: ['Corrente', `${fmt(I, 3)} A`],
        r: ['Resistência', `${fmt(R, 2)} Ω`],
      }[v.alvo]
      return {
        principal: {
          rotulo: unid[0],
          valor: unid[1],
        },
        extras: [
          {
            rotulo: 'Potência',
            valor: `${fmt(V * I, 1)} W`,
          },
        ],
      }
    },
  },
  imc: {
    nome: 'IMC',
    icone: HeartPulse,
    explicacao:
      'IMC = peso dividido pela altura ao quadrado. É uma referência geral, não substitui avaliação profissional.',
    campos: [
      {
        id: 'peso',
        rotulo: 'Peso',
        unidade: 'kg',
        padrao: '',
      },
      {
        id: 'altura',
        rotulo: 'Altura',
        unidade: 'cm',
        padrao: '',
      },
    ],
    calcular: v => {
      if (!pos(v.peso) || !pos(v.altura)) return null
      const m = v.altura / 100
      const imc = v.peso / (m * m)
      const faixa =
        imc < 18.5
          ? 'Abaixo do peso'
          : imc < 25
            ? 'Peso adequado'
            : imc < 30
              ? 'Sobrepeso'
              : imc < 35
                ? 'Obesidade grau I'
                : imc < 40
                  ? 'Obesidade grau II'
                  : 'Obesidade grau III'
      return {
        principal: {
          rotulo: 'IMC',
          valor: fmt(imc, 1),
        },
        extras: [
          {
            rotulo: 'Classificação',
            valor: faixa,
          },
          {
            rotulo: 'Peso adequado',
            valor: `${fmt(18.5 * m * m, 0)} a ${fmt(24.9 * m * m, 0)} kg`,
          },
        ],
      }
    },
  },
  gorjeta: {
    nome: 'Gorjeta e divisão',
    icone: Receipt,
    explicacao: 'Somamos a taxa de serviço à conta e dividimos pelo número de pessoas.',
    campos: [
      {
        id: 'conta',
        rotulo: 'Valor da conta',
        unidade: 'R$',
        padrao: '',
      },
      {
        id: 'taxa',
        rotulo: 'Serviço',
        padrao: '10',
        opcoes: [
          {
            id: '0',
            label: 'Sem',
          },
          {
            id: '10',
            label: '10%',
          },
          {
            id: '12',
            label: '12%',
          },
          {
            id: '15',
            label: '15%',
          },
        ],
      },
      {
        id: 'pessoas',
        rotulo: 'Pessoas',
        padrao: '1',
      },
    ],
    calcular: v => {
      if (!pos(v.conta)) return null
      const g = (v.conta * Number(v.taxa)) / 100
      const p = pos(v.pessoas) ? Math.round(v.pessoas) : 1
      return {
        principal: {
          rotulo: 'Total com serviço',
          valor: reais(v.conta + g),
        },
        extras: [
          {
            rotulo: 'Serviço',
            valor: reais(g),
          },
          {
            rotulo: `Por pessoa (${p})`,
            valor: reais((v.conta + g) / p),
          },
        ],
      }
    },
  },
  regra_de_tres: {
    nome: 'Regra de três',
    icone: Scale,
    explicacao:
      'Se A está para B, então C está para X. Na inversa, quando um aumenta o outro diminui (ex: mais pessoas, menos dias).',
    campos: [
      {
        id: 'tipo',
        rotulo: 'Tipo',
        padrao: 'direta',
        opcoes: [
          {
            id: 'direta',
            label: 'Direta',
          },
          {
            id: 'inversa',
            label: 'Inversa',
          },
        ],
      },
      {
        id: 'a',
        rotulo: 'A',
        padrao: '',
      },
      {
        id: 'b',
        rotulo: 'B',
        padrao: '',
      },
      {
        id: 'c',
        rotulo: 'C',
        padrao: '',
      },
    ],
    calcular: v => {
      if (!pos(v.a) || !ok(v.b) || !ok(v.c)) return null
      const x = v.tipo === 'inversa' ? (v.a * v.b) / v.c : (v.b * v.c) / v.a
      return ok(x)
        ? {
            principal: {
              rotulo: 'X',
              valor: fmt(x, 4),
            },
            extras: [],
          }
        : null
    },
  },
  escala_receita: {
    nome: 'Ajustar receita',
    icone: ChefHat,
    explicacao:
      'Multiplicamos cada ingrediente pelo fator: porções desejadas divididas pelas porções da receita.',
    campos: [
      {
        id: 'orig',
        rotulo: 'Porções da receita',
        padrao: '4',
      },
      {
        id: 'nova',
        rotulo: 'Porções desejadas',
        padrao: '10',
      },
      {
        id: 'qtd',
        rotulo: 'Quantidade do ingrediente',
        unidade: 'g, ml ou un',
        padrao: '',
      },
    ],
    calcular: v => {
      if (!pos(v.orig) || !pos(v.nova)) return null
      const f = v.nova / v.orig
      return {
        principal: {
          rotulo: ok(v.qtd) ? 'Nova quantidade' : 'Fator',
          valor: ok(v.qtd) ? fmt(v.qtd * f, 1) : `${fmt(f, 2)}x`,
        },
        extras: ok(v.qtd)
          ? [
              {
                rotulo: 'Fator',
                valor: `${fmt(f, 2)}x`,
              },
            ]
          : [],
      }
    },
  },
  cafe_proporcao: {
    nome: 'Proporção do café',
    icone: Coffee,
    explicacao:
      'Proporção 1:15 significa 1 grama de café para cada 15 ml de água. Menor número = café mais forte.',
    campos: [
      {
        id: 'agua',
        rotulo: 'Água',
        unidade: 'ml',
        padrao: '300',
      },
      {
        id: 'prop',
        rotulo: 'Proporção',
        padrao: '15',
        opcoes: [
          {
            id: '12',
            label: '1:12 forte',
          },
          {
            id: '15',
            label: '1:15',
          },
          {
            id: '16',
            label: '1:16',
          },
          {
            id: '17',
            label: '1:17 suave',
          },
        ],
      },
    ],
    calcular: v => {
      if (!pos(v.agua)) return null
      const g = v.agua / Number(v.prop)
      return {
        principal: {
          rotulo: 'Café moído',
          valor: `${fmt(g, 1)} g`,
        },
        extras: [
          {
            rotulo: 'Colheres de sopa (aprox.)',
            valor: fmt(g / 7, 1),
          },
          {
            rotulo: 'Xícaras de 50 ml',
            valor: fmt(v.agua / 50, 0),
          },
        ],
      }
    },
  },
  conversor_unidades: {
    nome: 'Conversor de unidades',
    icone: ArrowLeftRight,
    explicacao: 'Conversões comuns do dia a dia e do trabalho.',
    campos: [
      {
        id: 'conv',
        rotulo: 'Conversão',
        padrao: 'km_mi',
        opcoes: [
          {
            id: 'km_mi',
            label: 'km para milhas',
          },
          {
            id: 'mi_km',
            label: 'milhas para km',
          },
          {
            id: 'kg_lb',
            label: 'kg para libras',
          },
          {
            id: 'lb_kg',
            label: 'libras para kg',
          },
          {
            id: 'c_f',
            label: '°C para °F',
          },
          {
            id: 'f_c',
            label: '°F para °C',
          },
          {
            id: 'l_gal',
            label: 'litros para galões',
          },
          {
            id: 'xic_ml',
            label: 'xícaras para ml',
          },
          {
            id: 'pol_cm',
            label: 'polegadas para cm',
          },
          {
            id: 'pe_m',
            label: 'pés para metros',
          },
          {
            id: 'nm_km',
            label: 'milhas náuticas para km',
          },
          {
            id: 'oz_g',
            label: 'onças para gramas',
          },
        ],
      },
      {
        id: 'valor',
        rotulo: 'Valor',
        padrao: '',
      },
    ],
    calcular: v => {
      if (!ok(v.valor)) return null
      const t = {
        km_mi: [x => x * 0.621371, 'mi'],
        mi_km: [x => x / 0.621371, 'km'],
        kg_lb: [x => x * 2.20462, 'lb'],
        lb_kg: [x => x / 2.20462, 'kg'],
        c_f: [x => x * 1.8 + 32, '°F'],
        f_c: [x => (x - 32) / 1.8, '°C'],
        l_gal: [x => x / 3.78541, 'gal'],
        xic_ml: [x => x * 240, 'ml'],
        pol_cm: [x => x * 2.54, 'cm'],
        pe_m: [x => x * 0.3048, 'm'],
        nm_km: [x => x * 1.852, 'km'],
        oz_g: [x => x * 28.3495, 'g'],
      }[v.conv]
      return t
        ? {
            principal: {
              rotulo: 'Resultado',
              valor: `${fmt(t[0](v.valor), 3)} ${t[1]}`,
            },
            extras: [],
          }
        : null
    },
  },
  tempo_voo: {
    nome: 'Tempo de voo e combustível',
    icone: Plane,
    explicacao:
      'Velocidade no solo = velocidade verdadeira mais vento de cauda (ou menos vento de proa). Combustível inclui reserva de 45 minutos.',
    campos: [
      {
        id: 'dist',
        rotulo: 'Distância',
        unidade: 'NM',
        padrao: '',
      },
      {
        id: 'tas',
        rotulo: 'Velocidade verdadeira',
        unidade: 'kt',
        padrao: '120',
      },
      {
        id: 'vento',
        rotulo: 'Vento (+ cauda / - proa)',
        unidade: 'kt',
        padrao: '0',
      },
      {
        id: 'consumo',
        rotulo: 'Consumo',
        unidade: 'L/h',
        padrao: '35',
      },
    ],
    calcular: v => {
      const gs = (v.tas || 0) + (ok(v.vento) ? v.vento : 0)
      if (!pos(v.dist) || !pos(gs)) return null
      const t = v.dist / gs
      const comb = pos(v.consumo) ? v.consumo * (t + 0.75) : NaN
      return {
        principal: {
          rotulo: 'Tempo em rota',
          valor: horasMin(t),
        },
        extras: [
          {
            rotulo: 'Velocidade no solo',
            valor: `${fmt(gs, 0)} kt`,
          },
          {
            rotulo: 'Combustível com reserva',
            valor: ok(comb) ? `${fmt(comb, 0)} L` : '-',
          },
        ],
      }
    },
  },
  carga_treino: {
    nome: 'Carga de treino',
    icone: Dumbbell,
    explicacao:
      'Estimamos a carga máxima (1RM) pela fórmula de Epley: carga x (1 + repetições / 30). Depois aplicamos o percentual desejado.',
    campos: [
      {
        id: 'carga',
        rotulo: 'Carga usada',
        unidade: 'kg',
        padrao: '',
      },
      {
        id: 'reps',
        rotulo: 'Repetições feitas',
        padrao: '10',
      },
      {
        id: 'pct',
        rotulo: 'Intensidade',
        padrao: '70',
        opcoes: [
          {
            id: '60',
            label: '60% resistência',
          },
          {
            id: '70',
            label: '70% hipertrofia',
          },
          {
            id: '80',
            label: '80%',
          },
          {
            id: '90',
            label: '90% força',
          },
        ],
      },
    ],
    calcular: v => {
      if (!pos(v.carga) || !pos(v.reps)) return null
      const rm = v.carga * (1 + v.reps / 30)
      return {
        principal: {
          rotulo: `Carga a ${v.pct}%`,
          valor: `${fmt((rm * Number(v.pct)) / 100, 1)} kg`,
        },
        extras: [
          {
            rotulo: '1RM estimado',
            valor: `${fmt(rm, 1)} kg`,
          },
        ],
      }
    },
  },
  dosagem_racao: {
    nome: 'Ração por dia',
    icone: Wheat,
    explicacao:
      'Cada animal come um percentual do próprio peso por dia (bovinos cerca de 2,5%, aves e suínos variam). Ajuste conforme o técnico.',
    campos: [
      {
        id: 'peso',
        rotulo: 'Peso médio do animal',
        unidade: 'kg',
        padrao: '',
      },
      {
        id: 'pct',
        rotulo: 'Consumo do peso vivo',
        unidade: '%',
        padrao: '2,5',
      },
      {
        id: 'n',
        rotulo: 'Número de animais',
        padrao: '1',
      },
      {
        id: 'preco',
        rotulo: 'Preço do kg da ração',
        unidade: 'R$',
        padrao: '',
      },
    ],
    calcular: v => {
      if (!pos(v.peso) || !pos(v.pct)) return null
      const porAnimal = (v.peso * v.pct) / 100
      const total = porAnimal * (pos(v.n) ? v.n : 1)
      const extras = [
        {
          rotulo: 'Por animal',
          valor: `${fmt(porAnimal, 2)} kg/dia`,
        },
        {
          rotulo: 'No mês',
          valor: `${fmt(total * 30, 0)} kg`,
        },
      ]
      if (pos(v.preco))
        extras.push({
          rotulo: 'Custo no mês',
          valor: reais(total * 30 * v.preco),
        })
      return {
        principal: {
          rotulo: 'Ração por dia',
          valor: `${fmt(total, 1)} kg`,
        },
        extras,
      }
    },
  },
}
export const ICONE_CALC = TrendingUp
export const getCalculadora = tipo => CALCULADORAS[tipo] || null
