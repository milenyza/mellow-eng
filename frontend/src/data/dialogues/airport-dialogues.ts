import { defineDialogue } from './authoring'

export const airportDialogues = [
  defineDialogue(
    'flight-check-in',
    [
      'Entregar o passaporte e informar que vai despachar uma mala.',
      'Identificar o portão ao receber o cartão de embarque.',
    ],
    [
      { id: 'traveler', role: 'Passageira' },
      { id: 'agent', role: 'Atendente da companhia aérea' },
    ],
    [
      [
        'counter',
        'traveler',
        'Good morning. Can I check in here?',
        'Bom dia. Posso fazer o check-in aqui?',
        ['check-in-here'],
      ],
      [
        'destination',
        'agent',
        'Yes. Where are you flying today?',
        'Sim. Para onde você vai hoje?',
      ],
      [
        'city',
        'traveler',
        'To Boston. My flight number is 205.',
        'Para Boston. Meu voo é o 205.',
        ['flight-number'],
      ],
      [
        'document-request',
        'agent',
        'Can I see your passport, please?',
        'Posso ver seu passaporte, por favor?',
      ],
      [
        'hand-over-passport',
        'traveler',
        'Here is my passport.',
        'Aqui está meu passaporte.',
        ['passport'],
      ],
      [
        'luggage-question',
        'agent',
        'Thank you. Do you have a bag to check?',
        'Obrigada. Você tem alguma mala para despachar?',
      ],
      [
        'check-luggage',
        'traveler',
        'Yes. I’d like to check this bag.',
        'Sim. Gostaria de despachar esta mala.',
        ['check-bag'],
      ],
      [
        'weigh-luggage',
        'agent',
        'Sure. Put it on the scale, please.',
        'Claro. Coloque-a na balança, por favor.',
      ],
      [
        'ask-gate',
        'traveler',
        'Thanks. What’s my gate?',
        'Obrigada. Qual é o meu portão?',
      ],
      [
        'boarding-pass',
        'agent',
        'Gate 12. Here’s your boarding pass.',
        'Portão 12. Aqui está seu cartão de embarque.',
      ],
    ],
    [
      [
        'check-in',
        '“Check in” é fazer o check-in. Já “check this bag” é despachar esta mala.',
        ['check-in-here', 'check-bag'],
      ],
      [
        'hand-over',
        '“Here is” acompanha a entrega de um item. Quem entrega o cartão pode dizer “Here’s your boarding pass”.',
        ['passport', 'boarding-pass'],
      ],
      [
        'scale',
        '“Scale” quer dizer balança neste contexto. A pessoa atendente pede para colocar a mala sobre ela.',
      ],
    ],
  ),
  defineDialogue(
    'boarding-gate',
    [
      'Pedir orientação sobre o portão com educação.',
      'Confirmar a direção e o horário de embarque.',
    ],
    [
      { id: 'traveler', role: 'Passageiro' },
      { id: 'staff', role: 'Atendente do aeroporto' },
    ],
    [
      [
        'ask-help',
        'traveler',
        'Excuse me. Can you help me?',
        'Com licença. Você pode me ajudar?',
        ['help'],
      ],
      [
        'offer-help',
        'staff',
        'Of course. What’s your flight number?',
        'Claro. Qual é o número do seu voo?',
      ],
      [
        'flight',
        'traveler',
        'My flight number is 205. Is gate 12 still the right gate?',
        'Meu voo é o 205. O portão 12 ainda é o portão certo?',
        ['flight-number', 'gate-change'],
      ],
      [
        'new-gate',
        'staff',
        'No, it’s gate 18 now.',
        'Não, agora é o portão 18.',
      ],
      [
        'ask-location',
        'traveler',
        'Where is gate 18?',
        'Onde fica o portão 18?',
        ['where-gate'],
      ],
      [
        'directions',
        'staff',
        'Go straight, then turn left.',
        'Siga em frente e depois vire à esquerda.',
      ],
      [
        'ask-repeat',
        'traveler',
        'Could you say that again, please?',
        'Pode repetir, por favor?',
        ['repeat'],
      ],
      [
        'repeat-directions',
        'staff',
        'Go straight. Then turn left.',
        'Siga em frente. Depois vire à esquerda.',
      ],
      [
        'boarding-time',
        'traveler',
        'Thank you. What time does boarding start?',
        'Obrigado. Que horas começa o embarque?',
        ['boarding-time'],
      ],
      ['answer', 'staff', 'At ten thirty.', 'Às dez e meia.'],
    ],
    [
      [
        'start-politely',
        '“Excuse me” chama a atenção. “Can you help me?” diz o que você precisa em seguida.',
        ['help'],
      ],
      [
        'direction',
        '“Go straight” indica seguir em frente. “Turn left” indica virar à esquerda.',
      ],
      [
        'ask-again',
        'Use “Could you say that again, please?” para pedir que alguém repita. Para confirmar só uma informação, você também pode repetir o que ouviu como pergunta.',
        ['repeat'],
      ],
    ],
  ),
] as const
