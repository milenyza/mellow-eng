import { defineGuidance } from './authoring'

const entry = defineGuidance('at-the-hotel')

export default [
  entry(
    'polite-reception-requests',
    'politeness',
    'Fazer um pedido na recepção',
    '“Could I have…?” é uma forma cordial de pedir algo. Use o nome do item e, se precisar, diga a quantidade.',
    'Use o número do quarto quando a recepção pedir essa informação.',
    ['extra-towel'],
    {
      expressions: ['room-key'],
      dialogue: 'hotel-reception-info',
      simulation: 'reception-information',
    },
  ),
  entry(
    'clarify-hotel-information',
    'clarification',
    'Conferir horários e locais',
    'Depois de ouvir um horário, repita o que entendeu em forma de pergunta. Assim a pessoa pode confirmar ou corrigir.',
    'Use “at” antes de um horário na pergunta.',
    [
      'breakfast-time',
      ['repeat-seven', 'Is breakfast at seven?', 'O café da manhã é às sete?'],
    ],
    {
      expressions: ['breakfast-place'],
      dialogue: 'hotel-reception-info',
      simulation: 'reception-information',
    },
  ),
  entry(
    'arrival-and-departure',
    'vocabulary',
    'Distinguir check-in de check-out',
    '“Check in” é fazer o registro de entrada. “Check out” é encerrar a estadia na saída.',
    'Para saber o horário de saída, pergunte “What time is check-out?”.',
    ['check-in', 'check-out-time'],
    {
      expressions: ['check-out'],
      dialogue: 'hotel-reservation',
      simulation: 'check-in-at-reception',
    },
  ),
  entry(
    'register-at-reception',
    'context',
    'Escolher um tom simples na chegada',
    '“Hi” é uma saudação informal e amigável. “Good evening” funciona à noite quando você prefere um cumprimento mais neutro.',
    'Depois de cumprimentar, diga logo se tem uma reserva.',
    [
      [
        'formal-greeting',
        'Good evening. I have a reservation.',
        'Boa noite. Tenho uma reserva.',
      ],
      'have-reservation',
    ],
    {
      expressions: ['reservation-name'],
      dialogue: 'hotel-reservation',
      simulation: 'check-in-at-reception',
    },
  ),
] as const
