import { defineGuidance } from './authoring'

const entry = defineGuidance('restaurants-and-coffee-shops')

export default [
  entry(
    'order-with-please',
    'politeness',
    'Fazer um pedido cordial',
    '“I’d like…” é uma forma cordial de dizer o que você quer pedir. Uma frase curta com “please” também funciona quando o contexto já está claro.',
    'Em um balcão, diga primeiro o item e depois o tamanho, se houver opções.',
    [
      'coffee',
      [
        'tea-order',
        'I’d like a tea, please.',
        'Gostaria de um chá, por favor.',
      ],
    ],
    {
      expressions: ['to-go'],
      dialogue: 'coffee-to-go',
      simulation: 'order-at-the-counter',
    },
  ),
  entry(
    'ask-for-the-bill',
    'context',
    'Pedir a conta no fim da refeição',
    'Em um restaurante com serviço à mesa, você pode chamar o atendimento com “Excuse me” e pedir a conta quando terminar.',
    'Se estiver com companhia e quiser pagar separado, diga isso ao pedir a conta.',
    ['bill', 'pay-separately'],
    { dialogue: 'restaurant-meal', simulation: 'restaurant-meal' },
  ),
  entry(
    'communicate-dietary-needs',
    'clarification',
    'Dizer o ingrediente e confirmar a resposta',
    'Se precisar comunicar uma alergia, diga o nome do ingrediente. Pergunte se o prato contém esse ingrediente e peça para repetir caso não entenda a resposta.',
    '“Does this contain…?” pergunta especificamente o que há naquele prato.',
    [
      'peanut-allergy',
      [
        'contains-peanuts',
        'Does this contain peanuts?',
        'Isto contém amendoim?',
      ],
    ],
    { expressions: ['contains-milk'], dialogue: 'restaurant-meal' },
  ),
  entry(
    'bill-and-check',
    'vocabulary',
    'Reconhecer “bill” e “check”',
    'Para falar da conta do restaurante, você pode ouvir “check” nos Estados Unidos e costuma encontrar “bill” no inglês britânico.',
    'Use “please” para manter o pedido cordial com qualquer uma das palavras.',
    [
      [
        'check-us',
        'Could I have the check, please?',
        'Pode trazer a conta, por favor?',
        'en-US',
      ],
      [
        'bill-uk',
        'Can I have the bill, please?',
        'Pode trazer a conta, por favor?',
        'en-GB',
      ],
    ],
    {
      expressions: ['bill'],
      dialogue: 'restaurant-meal',
      simulation: 'restaurant-meal',
    },
  ),
] as const
