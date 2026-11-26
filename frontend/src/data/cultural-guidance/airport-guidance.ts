import { defineGuidance } from './authoring'

const entry = defineGuidance('at-the-airport')

export default [
  entry(
    'polite-airport-requests',
    'politeness',
    'Pedir ajuda no balcão',
    'Comece com um pedido curto e diga o que precisa. Um “please” ajuda a deixar o pedido cordial.',
    'Ao abordar alguém, “Excuse me” pode ajudar a chamar a atenção.',
    [
      'check-bag',
      [
        'polite-gate',
        'Excuse me. Where’s gate twelve?',
        'Com licença. Onde fica o portão doze?',
      ],
    ],
    {
      expressions: ['where-gate'],
      dialogue: 'flight-check-in',
      simulation: 'flight-check-in',
    },
  ),
  entry(
    'repeat-flight-information',
    'clarification',
    'Pedir para ouvir de novo',
    'Se não entender o horário ou o portão, você pode pedir para a pessoa repetir só a parte que faltou.',
    'Repita o número que ouviu para conferir.',
    [
      'repeat',
      ['confirm-number', 'Gate twelve, right?', 'Portão doze, certo?'],
    ],
    {
      expressions: ['boarding-time'],
      dialogue: 'boarding-gate',
      simulation: 'find-the-gate',
    },
  ),
  entry(
    'boarding-announcements',
    'context',
    'Reconhecer um aviso de embarque',
    'Em avisos curtos, preste atenção no número do voo e no portão. “Now boarding” avisa que o embarque está acontecendo.',
    'Use o número para identificar seu voo antes de seguir a indicação.',
    [
      [
        'now-boarding',
        'Flight 205 is now boarding at gate twelve.',
        'O voo 205 está embarcando agora no portão doze.',
      ],
    ],
    {
      expressions: ['flight-number', 'boarding-time'],
      dialogue: 'boarding-gate',
      simulation: 'find-the-gate',
    },
  ),
  entry(
    'baggage-claim-words',
    'vocabulary',
    'Ler as placas de retirada de bagagem',
    'Em inglês americano, é comum ler “baggage claim”. Em inglês britânico, você pode encontrar “baggage reclaim”. As duas placas apontam para a área de retirada de bagagem.',
    'Na chegada, procure a expressão completa na placa.',
    [
      [
        'claim-us',
        'Where’s baggage claim?',
        'Onde fica a retirada de bagagem?',
        'en-US',
      ],
      [
        'claim-uk',
        'Where’s baggage reclaim?',
        'Onde fica a retirada de bagagem?',
        'en-GB',
      ],
    ],
    { expressions: ['check-bag'], dialogue: 'flight-check-in' },
  ),
] as const
