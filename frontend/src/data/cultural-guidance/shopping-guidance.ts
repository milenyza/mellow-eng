import { defineGuidance } from './authoring'

const entry = defineGuidance('shopping')

export default [
  entry(
    'ask-for-shop-assistance',
    'politeness',
    'Escolher como chamar a atenção',
    '“Excuse me” ajuda a iniciar um pedido quando ainda não está conversando com o atendente.',
    'Diga qual produto está procurando depois de chamar a atenção.',
    [
      [
        'looking-for-shirt',
        'Excuse me. I’m looking for a shirt.',
        'Com licença. Estou procurando uma camisa.',
      ],
    ],
    {
      expressions: ['try-on'],
      dialogue: 'trying-a-shirt',
      simulation: 'ask-for-a-size',
    },
  ),
  entry(
    'prices-and-sizes',
    'clarification',
    'Conferir preço e tamanho',
    'Algumas marcas usam tamanhos diferentes. Você pode dizer o tamanho que procura e perguntar se pode experimentar.',
    'Ao dizer “this”, mostre a peça para deixar claro qual modelo quer.',
    ['how-much', 'size-medium'],
    {
      expressions: ['try-on', 'fitting-room'],
      dialogue: 'trying-a-shirt',
      simulation: 'ask-for-a-size',
    },
  ),
  entry(
    'state-a-preference',
    'context',
    'Dizer de qual opção você gosta',
    '“I like…” diz de qual opção você gosta. Se estiver apontando para um produto, pode dizer “the blue one” para evitar repetir o nome dele.',
    'Use “I’ll take it” quando já tiver decidido comprar.',
    [['blue-preference', 'I like the blue one.', 'Gosto do azul.'], 'take-it'],
    {
      expressions: ['another-color'],
      dialogue: 'price-at-the-shop',
      simulation: 'ask-the-price',
    },
  ),
  entry(
    'decline-help',
    'politeness',
    'Agradecer e continuar olhando',
    'Se alguém oferecer ajuda e você quiser olhar por conta própria, uma resposta curta com “thanks” é suficiente.',
    '“Just looking” indica que você ainda está vendo os produtos.',
    [
      [
        'just-looking',
        'I’m just looking, thanks.',
        'Só estou dando uma olhada, agradeço.',
      ],
      'keep-looking',
    ],
    { dialogue: 'price-at-the-shop' },
  ),
] as const
