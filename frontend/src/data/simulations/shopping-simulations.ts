import { defineConversation } from './authoring'

export const shoppingSimulations = [
  defineConversation(
    'ask-the-price',
    'Cliente',
    'Atendente da papelaria',
    ({ decision, success }) => [
      decision(
        'opening',
        ['Hi. Can I help you?', 'Oi. Posso ajudar?'],
        [
          [
            'price',
            ['How much is this?', 'Quanto custa isto?', ['how-much']],
            'Você pediu o valor do caderno que está mostrando.',
            { next: 'price' },
          ],
          [
            'sale',
            ['Is this on sale?', 'Isto está em promoção?', ['on-sale']],
            'Você pode começar perguntando se o caderno que está mostrando tem desconto.',
            { next: 'discount' },
          ],
          [
            'wrong',
            ['How much this is?', 'Quanto custa isto?'],
            'Na pergunta direta, use “is” antes de “this”.',
            'language',
          ],
        ],
        'Você pode perguntar o preço diretamente ou perguntar pela promoção.',
      ),
      decision(
        'price',
        [
          'That one is eight dollars. The small notebooks are five.',
          'Esse custa oito dólares. Os cadernos pequenos custam cinco.',
        ],
        [
          [
            'small',
            [
              'Can I see a small notebook, please?',
              'Posso ver um caderno pequeno, por favor?',
            ],
            'O modelo de cinco dólares cabe no seu orçamento.',
            { next: 'choose' },
          ],
          [
            'expensive',
            [
              'I’ll take that one for eight dollars.',
              'Vou levar o caderno de oito dólares.',
            ],
            'A frase está boa, mas oito dólares passam do limite de seis.',
            'context',
          ],
        ],
      ),
      decision(
        'discount',
        [
          'This one isn’t on sale. The small notebooks are five dollars.',
          'Este não está em promoção. Os cadernos pequenos custam cinco dólares.',
        ],
        [
          [
            'small',
            [
              'Can I see a small notebook, please?',
              'Posso ver um caderno pequeno, por favor?',
            ],
            'Você pediu para ver um modelo dentro do orçamento.',
            { next: 'choose' },
          ],
          [
            'wrong',
            ['The blue shirts, please.', 'As camisas azuis, por favor.'],
            'Camisas seriam outro produto. Você precisa de um caderno.',
            'context',
          ],
        ],
      ),
      decision(
        'choose',
        [
          'Here are the small ones. Do you like the green one?',
          'Aqui estão os pequenos. Você gostou do verde?',
        ],
        [
          [
            'buy',
            ['Yes, I’ll take it.', 'Sim, vou levar.', ['take-it']],
            '“I’ll take it” confirma a compra do caderno mostrado.',
            { next: 'checkout' },
          ],
          [
            'wrong',
            ['Yes, I’ll takes it.', 'Sim, vou levar.'],
            'Depois de “I’ll”, use “take” sem “s”.',
            'language',
          ],
        ],
      ),
      decision(
        'checkout',
        [
          'That’s five dollars. Anything else?',
          'São cinco dólares. Mais alguma coisa?',
        ],
        [
          [
            'receipt',
            [
              'Can I have a receipt, please?',
              'Pode me dar o comprovante, por favor?',
              ['receipt'],
            ],
            'Você pediu o comprovante no momento do pagamento.',
            { next: 'done' },
          ],
          [
            'wrong',
            [
              'Where’s the fitting room?',
              'Onde fica o provador?',
              ['fitting-room'],
            ],
            'O provador é para roupas. Para esta compra, peça o comprovante.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Of course. Here’s your notebook and your receipt.',
        'Claro. Aqui estão seu caderno e seu comprovante.',
      ]),
    ],
  ),
  defineConversation(
    'ask-for-a-size',
    'Cliente',
    'Atendente da loja',
    ({ decision, success }) => [
      decision(
        'opening',
        ['How does the small jacket fit?', 'Como ficou a jaqueta P?'],
        [
          [
            'medium',
            [
              'Do you have this in a medium?',
              'Tem este modelo no tamanho M?',
              ['size-medium'],
            ],
            'Você indicou o tamanho que quer provar.',
            { next: 'medium' },
          ],
          [
            'larger',
            [
              'Do you have a larger size?',
              'Tem um tamanho maior?',
              ['larger-size'],
            ],
            'Você pode pedir uma peça maior sem informar o tamanho exato.',
            { next: 'options' },
          ],
          [
            'wrong',
            ['Do you has a larger size?', 'Tem um tamanho maior?'],
            'Depois de “do you”, use “have”.',
            'language',
          ],
        ],
        'Diga o tamanho que você quer ou peça uma peça maior.',
      ),
      decision(
        'medium',
        [
          'Yes. We have a medium in black.',
          'Sim. Temos uma preta no tamanho M.',
        ],
        [
          [
            'try',
            ['Can I try it on?', 'Posso provar?', ['try-on']],
            'A pergunta pede permissão para provar essa jaqueta.',
            { next: 'fitting' },
          ],
          [
            'leave',
            ['I don’t need a jacket.', 'Não preciso de uma jaqueta.'],
            'A frase indicaria desistência. Aqui você quer provar a peça.',
            'context',
          ],
        ],
      ),
      decision(
        'options',
        [
          'Yes, we have a medium and a large. Which one would you like?',
          'Sim, temos M e G. Qual você gostaria?',
        ],
        [
          [
            'try',
            ['Can I try the medium on?', 'Posso provar a M?', ['try-on']],
            'Você escolheu um tamanho maior para provar.',
            { next: 'fitting' },
          ],
          [
            'wrong',
            ['Can I tries the medium on?', 'Posso provar a M?'],
            'Depois de “can”, use “try”.',
            'language',
          ],
        ],
      ),
      decision(
        'fitting',
        [
          'Sure. The fitting room is at the back.',
          'Claro. O provador fica nos fundos.',
        ],
        [
          [
            'confirm',
            ['At the back. Thanks!', 'Nos fundos. Obrigada!', ['fitting-room']],
            'Repetir a localização confirma que você entendeu.',
            { next: 'decide' },
          ],
          [
            'wrong',
            ['At the front. Thanks!', 'Na frente. Obrigada!'],
            '“At the back” significa nos fundos.',
            'context',
          ],
        ],
      ),
      decision(
        'decide',
        ['Does the medium fit?', 'A M serviu?'],
        [
          [
            'take',
            [
              'Yes, it fits. I’ll take it.',
              'Sim, serviu. Vou levar.',
              ['take-it'],
            ],
            'Você explica que serviu e confirma a compra.',
            { next: 'done' },
          ],
          [
            'wrong',
            ['Yes, it’s fits.', 'Sim, serviu.'],
            '“It fits” já diz que serviu. Use “fits” sozinho, sem “is”.',
            'language',
          ],
        ],
      ),
      success('done', [
        'Great. I can help you at the register.',
        'Ótimo. Posso atender você no caixa.',
      ]),
    ],
  ),
] as const
