import { defineDialogue } from './authoring'

export const shoppingDialogues = [
  defineDialogue(
    'price-at-the-shop',
    [
      'Pedir o preço de um objeto.',
      'Perguntar por outra cor e decidir a compra.',
    ],
    [
      { id: 'shopper', role: 'Cliente' },
      { id: 'clerk', role: 'Atendente da loja' },
    ],
    [
      [
        'price',
        'shopper',
        'Excuse me. How much is this bag?',
        'Com licença. Quanto custa esta bolsa?',
        ['how-much'],
      ],
      ['amount', 'clerk', 'It’s twenty dollars.', 'Custa vinte dólares.'],
      [
        'color',
        'shopper',
        'Does it come in another color?',
        'Tem em outra cor?',
        ['another-color'],
      ],
      ['blue', 'clerk', 'Yes. We have it in blue.', 'Sim. Temos em azul.'],
      [
        'see',
        'shopper',
        'Can I see the blue one, please?',
        'Posso ver a azul, por favor?',
      ],
      ['here', 'clerk', 'Sure. Here it is.', 'Claro. Aqui está.'],
      [
        'buy',
        'shopper',
        'Thanks. I’ll take it.',
        'Obrigada. Vou levar.',
        ['take-it'],
      ],
      ['cash', 'clerk', 'Cash or card?', 'Em dinheiro ou cartão?'],
      [
        'card',
        'shopper',
        'Card, please. Can I have a receipt?',
        'Cartão, por favor. Pode me dar o comprovante?',
        ['receipt'],
      ],
      [
        'receipt',
        'clerk',
        'Of course. Here’s your receipt.',
        'Claro. Aqui está seu comprovante.',
      ],
    ],
    [
      [
        'pointing',
        'Use “this” para falar do item que você aponta ou segura.',
        ['how-much'],
      ],
      [
        'one',
        'Em “the blue one”, “one” substitui “bag” e evita repetir o nome do produto.',
        ['another-color'],
      ],
      [
        'decision',
        '“I’ll take it” indica uma decisão de compra. No caixa, “receipt” é o comprovante.',
        ['take-it', 'receipt'],
      ],
    ],
  ),
  defineDialogue(
    'trying-a-shirt',
    [
      'Pedir para experimentar uma peça.',
      'Explicar que uma roupa ficou pequena.',
    ],
    [
      { id: 'shopper', role: 'Cliente' },
      { id: 'clerk', role: 'Atendente da loja' },
    ],
    [
      [
        'medium',
        'shopper',
        'Do you have this in a medium?',
        'Tem este modelo no tamanho M?',
        ['size-medium'],
      ],
      ['stock', 'clerk', 'Yes. Here’s a medium.', 'Sim. Aqui está uma M.'],
      ['try', 'shopper', 'Can I try it on?', 'Posso provar?', ['try-on']],
      [
        'directions',
        'clerk',
        'Of course. The fitting room is over there.',
        'Claro. O provador fica ali.',
        ['fitting-room'],
      ],
      [
        'small',
        'shopper',
        'It’s too small. Do you have a larger size?',
        'Ficou pequena demais. Tem um tamanho maior?',
        ['larger-size'],
      ],
      ['large', 'clerk', 'Yes. Try this large.', 'Sim. Prove esta G.'],
      [
        'fit',
        'shopper',
        'It fits. Is this on sale?',
        'Serviu. Está em promoção?',
        ['on-sale'],
      ],
      [
        'sale',
        'clerk',
        'Yes. It’s fifteen dollars today.',
        'Sim. Hoje custa quinze dólares.',
      ],
      [
        'decide',
        'shopper',
        'Great. I’ll take it.',
        'Ótimo. Vou levar.',
        ['take-it'],
      ],
      [
        'counter',
        'clerk',
        'The register is by the door.',
        'O caixa fica perto da porta.',
      ],
    ],
    [
      [
        'sizes',
        '“Medium” indica tamanho M. “Large” indica tamanho G.',
        ['size-medium', 'larger-size'],
      ],
      [
        'trying',
        '“Try it on” significa provar a peça. Para perguntar onde fazer isso, use “fitting room”.',
        ['try-on', 'fitting-room'],
      ],
      [
        'fit',
        '“It fits” indica que a peça serve. “Too small” indica que ficou pequena demais.',
        ['larger-size'],
      ],
    ],
  ),
] as const
