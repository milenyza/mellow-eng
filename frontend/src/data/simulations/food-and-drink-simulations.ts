import { defineConversation } from './authoring'

export const foodAndDrinkSimulations = [
  defineConversation(
    'restaurant-meal',
    'Cliente',
    'Atendente do restaurante',
    ({ decision, success }) => [
      decision(
        'table',
        [
          'Good evening. A table inside or outside?',
          'Boa noite. Uma mesa na parte interna ou na área externa?',
        ],
        [
          [
            'inside',
            [
              'Inside, please. A table for two.',
              'Na parte interna, por favor. Uma mesa para duas pessoas.',
              ['table-for-two'],
            ],
            'Você indicou a área e informou quantas pessoas vão se sentar.',
            { next: 'inside-menu' },
          ],
          [
            'outside',
            [
              'Outside, please. A table for two.',
              'Na área externa, por favor. Uma mesa para duas pessoas.',
              ['sit-outside', 'table-for-two'],
            ],
            'Escolher a área externa também funciona. A pessoa vai guiar vocês até lá.',
            { next: 'outside-menu' },
          ],
          [
            'takeaway',
            ['To go, please.', 'Para viagem, por favor.', ['to-go']],
            'Esse pedido é natural para levar. Neste cenário, vocês querem sentar para comer.',
            'context',
          ],
        ],
        '“Inside” significa na parte interna. “Outside” significa na área externa.',
      ),
      decision(
        'inside-menu',
        ['Here’s a table by the window.', 'Aqui está uma mesa junto à janela.'],
        [
          [
            'menu',
            [
              'Can I see the menu, please?',
              'Posso ver o cardápio, por favor?',
              ['menu'],
            ],
            'Pedir o cardápio ajuda a decidir o que vocês vão comer.',
            { next: 'order' },
          ],
          [
            'mistake',
            ['Can I sees the menu?', 'Posso ver o cardápio?'],
            'Depois de “can”, use “see”, sem o “s”.',
            'language',
          ],
        ],
      ),
      decision(
        'outside-menu',
        ['Here’s a table on the patio.', 'Aqui está uma mesa no pátio.'],
        [
          [
            'menu',
            [
              'Can I see the menu, please?',
              'Posso ver o cardápio, por favor?',
              ['menu'],
            ],
            'Você já tem uma mesa e agora pode pedir o cardápio.',
            { next: 'order' },
          ],
          [
            'bill',
            [
              'Could we have the bill, please?',
              'Pode trazer a conta, por favor?',
              ['bill'],
            ],
            'Esse pedido é natural no fim da refeição. Agora vocês ainda estão escolhendo.',
            'context',
          ],
        ],
      ),
      decision(
        'order',
        [
          'Here’s the menu. What would you like?',
          'Aqui está o cardápio. O que você gostaria de pedir?',
        ],
        [
          [
            'meal',
            [
              'I’d like the chicken and rice, please.',
              'Gostaria do frango com arroz, por favor.',
            ],
            '“I’d like” ajuda a fazer o pedido com educação.',
            { next: 'bill' },
          ],
          [
            'mistake',
            [
              'I’d likes chicken and rice, please.',
              'Gostaria de frango com arroz, por favor.',
            ],
            'A forma é “I’d like”. Não acrescente “s” a “like” depois de “I’d”.',
            'language',
          ],
        ],
      ),
      decision(
        'bill',
        [
          'How was your meal? Do you need anything else?',
          'Como estava a refeição? Você precisa de mais alguma coisa?',
        ],
        [
          [
            'pay',
            [
              'It was good. Could we have the bill, please?',
              'Estava boa. Pode trazer a conta, por favor?',
              ['bill'],
            ],
            'Você responde sobre a refeição e pede a conta na hora certa.',
            { next: 'done' },
          ],
          [
            'table',
            [
              'Can we sit outside?',
              'Podemos sentar do lado de fora?',
              ['sit-outside'],
            ],
            'Você pode perguntar isso quando chega. Agora, o objetivo é pedir a conta.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Of course. I’ll bring the bill.',
        'Claro. Vou trazer a conta.',
      ]),
    ],
  ),
  defineConversation(
    'order-at-the-counter',
    'Cliente',
    'Atendente da cafeteria',
    ({ decision, success }) => [
      decision(
        'order',
        ['Hi! What can I get you?', 'Oi! O que você gostaria de pedir?'],
        [
          [
            'coffee',
            ['A coffee, please.', 'Um café, por favor.', ['coffee']],
            'É um pedido curto e cordial para fazer no balcão.',
            { next: 'size' },
          ],
          [
            'wrong-item',
            ['Can I have a glass of water?', 'Pode me trazer um copo de água?'],
            'A frase é natural para pedir água. Neste cenário, você quer pedir um café.',
            'context',
          ],
        ],
      ),
      decision(
        'size',
        ['Sure. Small or large?', 'Claro. Pequeno ou grande?'],
        [
          [
            'small',
            ['Small, please.', 'Pequeno, por favor.'],
            'Você escolheu um café pequeno. Essa escolha muda o preço.',
            { next: 'small-takeaway' },
          ],
          [
            'large',
            ['Large, please.', 'Grande, por favor.'],
            'Um café grande também é uma escolha natural. Essa escolha muda o preço.',
            { next: 'large-takeaway' },
          ],
          [
            'plural',
            ['One large coffees, please.', 'Um café grande, por favor.'],
            'Depois de “one”, use “coffee” no singular. Você também pode responder só com o tamanho.',
            'language',
          ],
        ],
        'Você pode escolher qualquer tamanho.',
      ),
      decision(
        'small-takeaway',
        [
          'One small coffee. For here or to go?',
          'Um café pequeno. Para tomar aqui ou para viagem?',
        ],
        [
          [
            'to-go',
            ['To go, please.', 'Para viagem, por favor.', ['to-go']],
            'Use “to go” para dizer que quer levar o café.',
            { next: 'small-payment' },
          ],
          [
            'for-here',
            ['For here, please.', 'Para tomar aqui, por favor.'],
            '“For here” está correto para consumir no local. Aqui você pediu para levar.',
            'context',
          ],
        ],
      ),
      decision(
        'large-takeaway',
        [
          'One large coffee. For here or to go?',
          'Um café grande. Para tomar aqui ou para viagem?',
        ],
        [
          [
            'to-go',
            ['To go, please.', 'Para viagem, por favor.', ['to-go']],
            '“To go” indica que você vai levar o café grande.',
            { next: 'large-payment' },
          ],
          [
            'wrong-place',
            ['For here, please.', 'Para tomar aqui, por favor.'],
            'Essa é uma resposta natural se você for ficar. Neste cenário, você precisa levar o café.',
            'context',
          ],
        ],
      ),
      decision(
        'small-payment',
        ['That’s three dollars.', 'São três dólares.'],
        [
          [
            'card',
            ['Can I pay by card?', 'Posso pagar com cartão?', ['pay-card']],
            'Você confirma o pagamento com cartão antes de aproximá-lo.',
            { next: 'done' },
          ],
          [
            'mistake',
            ['Can I pays by card?', 'Posso pagar com cartão?'],
            'Depois de “can”, use “pay”, sem o “s”.',
            'language',
          ],
        ],
      ),
      decision(
        'large-payment',
        ['That’s four dollars.', 'São quatro dólares.'],
        [
          [
            'card',
            ['Can I pay by card?', 'Posso pagar com cartão?', ['pay-card']],
            'A pergunta confirma se a cafeteria aceita cartão.',
            { next: 'done' },
          ],
          [
            'cash',
            ['Can I pay in cash?', 'Posso pagar em dinheiro?'],
            'A frase funciona para dinheiro. O objetivo da situação é pagar com cartão.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Sure. Tap your card here. Your coffee will be ready soon.',
        'Claro. Aproxime o cartão aqui. Seu café fica pronto logo.',
      ]),
    ],
  ),
] as const
