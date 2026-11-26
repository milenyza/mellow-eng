import { defineGuidance } from './authoring'

const entry = defineGuidance('around-the-city')

export default [
  entry(
    'approach-someone',
    'politeness',
    'Abordar alguém com educação',
    '“Excuse me” ajuda a chamar a atenção de uma pessoa antes de pedir informação.',
    'Depois, diga o nome do lugar que está procurando.',
    [
      [
        'excuse-post',
        'Excuse me. I’m looking for the post office.',
        'Com licença. Estou procurando o correio.',
      ],
    ],
    {
      expressions: ['find'],
      dialogue: 'confirming-the-turn',
      simulation: 'confirm-a-direction',
    },
  ),
  entry(
    'ask-for-directions',
    'context',
    'Pedir o caminho a pé',
    '“How do I get to…?” pede instruções para chegar a um lugar. Se quiser saber se o trajeto dá para fazer a pé, pergunte isso também.',
    'Troque “the museum” pelo nome do seu destino.',
    ['museum', 'walk'],
    {
      expressions: ['far'],
      dialogue: 'finding-the-museum',
      simulation: 'find-a-place',
    },
  ),
  entry(
    'check-the-turn',
    'clarification',
    'Conferir o sentido e a esquina',
    'Repita o ponto e o lado da curva. “At this corner?” é útil quando você pode apontar para a esquina.',
    'Confira também se deve virar antes ou depois do ponto de referência.',
    ['this-corner', 'before-after'],
    {
      expressions: ['left', 'right'],
      dialogue: 'confirming-the-turn',
      simulation: 'confirm-a-direction',
    },
  ),
  entry(
    'say-you-are-lost',
    'context',
    'Dizer que está sem saber o caminho',
    '“I’m lost” é uma forma simples de dizer que você se perdeu. Diga para onde quer ir ou mostre o local no mapa.',
    'Se souber o nome da rua em que está, use-o para situar a conversa.',
    [
      [
        'lost-post',
        'I’m lost. Can you help me find the post office?',
        'Estou sem saber o caminho. Pode me ajudar a encontrar o correio?',
      ],
    ],
    {
      expressions: ['find', 'which-way'],
      dialogue: 'confirming-the-turn',
      simulation: 'find-a-place',
    },
  ),
] as const
