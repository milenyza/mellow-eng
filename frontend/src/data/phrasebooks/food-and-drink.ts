import type { Phrasebook } from '@/types/practical-english'
import { definePhrasebook } from './authoring'

const situationId = 'restaurants-and-coffee-shops'
const group = definePhrasebook(situationId)

export const foodAndDrinkPhrasebook = {
  situationId,
  groups: [
    group('table', 'Pedir uma mesa', [
      [
        'table-for-two',
        'A table for two, please.',
        'Uma mesa para duas pessoas, por favor.',
        'Use ao chegar. Troque “two” pelo número de pessoas do grupo.',
        { keywords: ['mesa', 'lugares'] },
      ],
      [
        'sit-outside',
        'Can we sit outside?',
        'Podemos sentar do lado de fora?',
        'Pergunte se há lugar na área externa. “We” indica que você está acompanhado.',
      ],
      [
        'wait-time',
        'How long is the wait?',
        'Quanto tempo de espera?',
        'Pergunte quando houver fila ou quando todas as mesas estiverem ocupadas.',
      ],
    ]),
    group('menu', 'Consultar o cardápio', [
      [
        'menu',
        'Can I see the menu, please?',
        'Posso ver o cardápio, por favor?',
        'Peça o cardápio à mesa ou no balcão.',
        {
          pronunciation: '/kæn aɪ siː ðə ˈmen.juː pliːz/',
          keywords: ['cardapio', 'menu'],
        },
      ],
      [
        'whats-this',
        'What is this dish?',
        'Que prato é este?',
        'Aponte um prato no cardápio e pergunte o que é.',
      ],
      [
        'todays-special',
        'What’s today’s special?',
        'Qual é o prato do dia?',
        'Pergunte se houver uma opção especial anunciada para aquele dia.',
      ],
    ]),
    group('order', 'Pedir comida e bebida', [
      [
        'coffee',
        'A coffee, please.',
        'Um café, por favor.',
        'É um pedido breve e comum no balcão. Para um pedido mais completo, também cabe “I’d like a coffee, please”.',
        {
          related: ['sandwich'],
          references: [
            {
              kind: 'story',
              storyId: 'a-rainy-morning',
              chapterId: 'inside-the-bakery',
            },
          ],
        },
      ],
      [
        'get-coffee',
        'Can I get a coffee, please?',
        'Pode me dar um café, por favor?',
        'Um pedido mais informal, comum em cafeterias nos EUA. “A coffee, please” funciona bem no mesmo contexto.',
        {
          formality: 'informal',
          register: 'Uso comum nos EUA',
          related: ['coffee'],
        },
      ],
      [
        'sandwich',
        'I’d like a sandwich, please.',
        'Gostaria de um sanduíche, por favor.',
        'Use “I’d like” com o nome do item. É uma forma cordial de pedir à mesa ou no balcão.',
        { register: 'Pedido cordial' },
      ],
      [
        'glass-of-water',
        'Can I have a glass of water, please?',
        'Pode me trazer um copo de água, por favor?',
        'Use para pedir um copo de água à pessoa que está atendendo.',
      ],
    ]),
    group('dietary-needs', 'Comunicar necessidades alimentares', [
      [
        'peanut-allergy',
        'I’m allergic to peanuts.',
        'Tenho alergia a amendoim.',
        'Informe a alergia antes de fazer o pedido. A frase comunica a necessidade e não confirma o preparo do prato.',
        { keywords: ['alergia', 'amendoim'], related: ['contains-milk'] },
      ],
      [
        'contains-milk',
        'Does this contain milk?',
        'Isto contém leite?',
        'Aponte o item e pergunte se contém leite. Você pode trocar “milk” pelo ingrediente relevante.',
        { keywords: ['ingrediente', 'laticínios', 'leite'] },
      ],
      [
        'vegetarian',
        'Is this dish vegetarian?',
        'Este prato é vegetariano?',
        'Use para confirmar se o prato é vegetariano. “Vegetarian” e “vegan” indicam requisitos diferentes.',
      ],
    ]),
    group('pay', 'Pedir a conta e pagar', [
      [
        'bill',
        'Could we have the bill, please?',
        'Pode trazer a conta, por favor?',
        'Use à mesa quando o grupo estiver pronto para pagar. Em muitos restaurantes dos EUA, também se diz “check”.',
        {
          register: 'Pedido cordial',
          keywords: ['conta', 'pagamento'],
          related: ['pay-card'],
        },
      ],
      [
        'pay-card',
        'Can I pay by card?',
        'Posso pagar com cartão?',
        'Use antes de pagar quando quiser confirmar a forma de pagamento.',
        { keywords: ['cartão', 'pagamento'] },
      ],
      [
        'pay-separately',
        'Can we pay separately?',
        'Podemos pagar separado?',
        'Use quando cada pessoa quiser pagar a sua parte. Pergunte se o local permite.',
      ],
    ]),
    group('takeaway', 'Pedir para levar', [
      [
        'to-go',
        'To go, please.',
        'Para viagem, por favor.',
        'Resposta comum nos EUA quando perguntam se você vai consumir no local ou levar.',
        {
          register: 'Uso comum nos EUA',
          keywords: ['para levar', 'viagem'],
          related: ['takeaway'],
        },
      ],
      [
        'takeaway',
        'Can I get this to take away?',
        'Posso pedir isto para levar?',
        'Use antes de fechar o pedido. “Take away” é uma formulação comum no Reino Unido.',
        { register: 'Uso comum no Reino Unido', related: ['to-go'] },
      ],
      [
        'box',
        'Can I have a box for this, please?',
        'Pode me trazer uma embalagem para isto, por favor?',
        'Peça uma embalagem para levar o que sobrou da refeição. Aponte o que gostaria de levar.',
      ],
    ]),
  ],
} satisfies Phrasebook
