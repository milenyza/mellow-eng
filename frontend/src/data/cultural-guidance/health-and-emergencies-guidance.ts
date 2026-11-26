import { defineGuidance } from './authoring'

const entry = defineGuidance('health-and-emergencies')

export default [
  entry(
    'describe-a-symptom',
    'context',
    'Descrever como você está se sentindo',
    'Diga o que sente com uma frase curta. “I don’t feel well” comunica mal-estar. Você pode acrescentar um detalhe que ajude a outra pessoa a entender.',
    'Use “I feel…” seguido da sensação quando souber descrevê-la.',
    ['not-well', 'dizzy'],
    {
      expressions: ['headache'],
      dialogue: 'asking-for-help',
      simulation: 'say-how-you-feel',
    },
  ),
  entry(
    'ask-for-immediate-help',
    'politeness',
    'Pedir ajuda em poucas palavras',
    '“I need help” transmite a necessidade de ajuda diretamente. Depois, diga o que espera que a outra pessoa faça.',
    'Se quiser companhia, faça um pedido curto e específico.',
    ['need-help', 'stay-with-me'],
    {
      expressions: ['call-friend'],
      dialogue: 'asking-for-help',
      simulation: 'say-how-you-feel',
    },
  ),
  entry(
    'confirm-what-you-heard',
    'clarification',
    'Confirmar uma informação importante',
    'Se não entender, peça para repetir. Você também pode dizer em voz alta o local que entendeu para conferir.',
    'Em uma ligação, confirme uma informação de cada vez.',
    [
      'repeat',
      [
        'check-entrance',
        'Do you mean the main entrance?',
        'Você quer dizer a entrada principal?',
      ],
    ],
    {
      expressions: ['main-entrance'],
      dialogue: 'meeting-at-the-entrance',
      simulation: 'give-your-location',
    },
  ),
  entry(
    'give-a-specific-location',
    'context',
    'Dizer onde você está',
    'Diga o nome do lugar e acrescente uma referência próxima. “Inside” e “outside” ajudam a indicar de que lado da entrada você está.',
    'Na ligação, mencione um elemento que a outra pessoa possa identificar.',
    [
      'main-entrance',
      [
        'outside-library',
        'I’m outside, in front of the library.',
        'Estou do lado de fora, em frente à biblioteca.',
      ],
    ],
    {
      expressions: ['in-front', 'near-desk'],
      dialogue: 'meeting-at-the-entrance',
      simulation: 'give-your-location',
    },
  ),
] as const
