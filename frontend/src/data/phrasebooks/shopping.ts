import { definePhrasebook } from './authoring'
import type { Phrasebook } from '@/types/practical-english'

const group = definePhrasebook('shopping')
export const shoppingPhrasebook = {
  situationId: 'shopping',
  groups: [
    group('prices', 'Perguntar preço e conhecer o produto', [
      [
        'how-much',
        'How much is this?',
        'Quanto custa isto?',
        'Aponte ou mostre o produto ao perguntar.',
      ],
      [
        'price-tag',
        'There’s no price tag.',
        'Está sem etiqueta de preço.',
        'Explique por que você precisa perguntar o valor.',
      ],
      [
        'another-color',
        'Does it come in another color?',
        'Tem em outra cor?',
        'Pergunte se existe outra cor para o mesmo modelo.',
      ],
      [
        'on-sale',
        'Is this on sale?',
        'Isto está em promoção?',
        'Confira se o item tem desconto.',
      ],
    ]),
    group('sizes', 'Encontrar o tamanho certo', [
      [
        'size-medium',
        'Do you have this in a medium?',
        'Tem este modelo no tamanho M?',
        'Use small, medium ou large para tamanhos de roupa.',
      ],
      [
        'larger-size',
        'Do you have a larger size?',
        'Tem um tamanho maior?',
        'Peça uma opção maior após ver ou provar uma peça.',
      ],
      [
        'try-on',
        'Can I try it on?',
        'Posso provar?',
        'Pergunte antes de entrar no provador.',
      ],
      [
        'fitting-room',
        'Where’s the fitting room?',
        'Onde fica o provador?',
        'Use para localizar o espaço de prova.',
      ],
    ]),
    group('checkout', 'Decidir e pagar', [
      [
        'take-it',
        'I’ll take it.',
        'Vou levar.',
        'Confirme que decidiu comprar o item.',
      ],
      [
        'keep-looking',
        'I’ll keep looking, thanks.',
        'Vou continuar olhando, agradeço.',
        'Use para encerrar a conversa com educação quando ainda está decidindo.',
      ],
      [
        'receipt',
        'Can I have a receipt, please?',
        'Pode me dar o comprovante, por favor?',
        'Peça o comprovante da compra no caixa.',
      ],
    ]),
  ],
} satisfies Phrasebook
