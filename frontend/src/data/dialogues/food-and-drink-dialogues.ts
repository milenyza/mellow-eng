import { defineDialogue } from './authoring'

export const foodAndDrinkDialogues = [
  defineDialogue(
    'restaurant-meal',
    [
      'Pedir uma mesa e o cardápio.',
      'Escolher um prato, pedir água e solicitar a conta.',
    ],
    [
      { id: 'guest', role: 'Cliente' },
      { id: 'server', role: 'Atendente do restaurante' },
    ],
    [
      [
        'request-table',
        'guest',
        'Good evening. A table for two, please.',
        'Boa noite. Uma mesa para duas pessoas, por favor.',
        ['table-for-two'],
      ],
      [
        'show-table',
        'server',
        'Of course. This way, please.',
        'Claro. Por aqui, por favor.',
      ],
      [
        'request-menu',
        'guest',
        'Can I see the menu, please?',
        'Posso ver o cardápio, por favor?',
        ['menu'],
      ],
      [
        'offer-drink',
        'server',
        'Here you go. Would you like something to drink?',
        'Aqui está. Gostaria de algo para beber?',
      ],
      [
        'order-water',
        'guest',
        'Can I have a glass of water, please?',
        'Pode me trazer um copo de água, por favor?',
        ['glass-of-water'],
      ],
      [
        'take-order',
        'server',
        'Sure. Are you ready to order?',
        'Claro. Já escolheu o que vai pedir?',
      ],
      [
        'order-meal',
        'guest',
        'Yes. I’d like the chicken and rice, please.',
        'Sim. Queria o frango com arroz, por favor.',
      ],
      [
        'confirm-meal',
        'server',
        'Chicken and rice. Thank you.',
        'Frango com arroz. Obrigado.',
      ],
      [
        'request-bill',
        'guest',
        'Excuse me. Could we have the bill, please?',
        'Com licença. Pode trazer a conta, por favor?',
        ['bill'],
      ],
      [
        'bill-answer',
        'server',
        'Of course. I’ll bring it now.',
        'Claro. Vou trazer agora.',
      ],
    ],
    [
      [
        'table-number',
        'Em “A table for two”, o número indica quantas pessoas vão se sentar. Adapte-o ao seu grupo.',
        ['table-for-two'],
      ],
      [
        'ordering',
        '“I’d like” é uma forma cordial de fazer um pedido. “Can I have” também é natural para pedir o que você quer.',
        ['sandwich', 'glass-of-water'],
      ],
      [
        'bill',
        'No fim da refeição, “the bill” é a conta. Em muitos restaurantes nos EUA, você também pode ouvir “the check”.',
        ['bill'],
      ],
    ],
  ),
  defineDialogue(
    'coffee-to-go',
    [
      'Pedir café no balcão.',
      'Indicar que é para levar e conferir se pode pagar com cartão.',
    ],
    [
      { id: 'customer', role: 'Cliente' },
      { id: 'barista', role: 'Atendente da cafeteria' },
    ],
    [
      [
        'greeting',
        'barista',
        'Hi! What can I get you?',
        'Oi! O que você gostaria de pedir?',
      ],
      [
        'order',
        'customer',
        'A coffee, please.',
        'Um café, por favor.',
        ['coffee'],
      ],
      ['size', 'barista', 'Small or large?', 'Pequeno ou grande?'],
      ['size-answer', 'customer', 'Small, please.', 'Pequeno, por favor.'],
      [
        'here-or-go',
        'barista',
        'For here or to go?',
        'Para tomar aqui ou para viagem?',
      ],
      [
        'to-go',
        'customer',
        'To go, please.',
        'Para viagem, por favor.',
        ['to-go'],
      ],
      ['price', 'barista', 'That’s three dollars.', 'São três dólares.'],
      [
        'payment',
        'customer',
        'Can I pay by card?',
        'Posso pagar com cartão?',
        ['pay-card'],
      ],
      [
        'answer',
        'barista',
        'Sure. Tap your card here.',
        'Claro. Aproxime o cartão aqui.',
      ],
      [
        'thanks',
        'customer',
        'Thanks. Have a nice day!',
        'Obrigada. Tenha um bom dia!',
      ],
    ],
    [
      [
        'short-order',
        'No balcão, “A coffee, please” é direto e cordial. Em muitas cafeterias dos EUA, “Can I get a coffee, please?” também é comum.',
        ['coffee', 'get-coffee'],
      ],
      [
        'takeaway',
        '“For here” indica consumo no local. “To go” é comum nos EUA; no Reino Unido você pode ouvir “take away”.',
        ['to-go', 'takeaway'],
      ],
      [
        'tap',
        '“Tap your card” é aproximar o cartão da maquininha. “Pay by card” pergunta de modo geral se aceitam pagamento com cartão.',
        ['pay-card'],
      ],
    ],
  ),
] as const
