import { defineConversation } from './authoring'

export const airportSimulations = [
  defineConversation(
    'flight-check-in',
    'Passageiro',
    'Atendente da companhia aérea',
    ({ decision, success }) => [
      decision(
        'documents',
        [
          'Good morning. Do you have your passport and flight number?',
          'Bom dia. Você está com seu passaporte e o número do voo?',
        ],
        [
          [
            'passport',
            ['Here is my passport.', 'Aqui está meu passaporte.', ['passport']],
            'Entregar o passaporte é uma forma natural de começar. A pessoa ainda pode pedir o número do voo.',
            { next: 'flight-number' },
          ],
          [
            'flight',
            ['My flight number is 205.', 'Meu voo é o 205.', ['flight-number']],
            'Você pode informar o voo primeiro. Em seguida, a pessoa confirma o passaporte.',
            { next: 'show-passport' },
          ],
          [
            'hotel',
            ['I have a hotel reservation.', 'Tenho uma reserva de hotel.'],
            'A frase funciona na recepção de um hotel. No balcão da companhia aérea, fale do voo ou apresente o passaporte.',
            'context',
          ],
        ],
        'Você pode começar por qualquer um dos dois documentos ou dados solicitados.',
      ),
      decision(
        'flight-number',
        [
          'Thank you. What’s your flight number?',
          'Obrigado. Qual é o número do seu voo?',
        ],
        [
          [
            'number',
            ['My flight number is 205.', 'Meu voo é o 205.', ['flight-number']],
            'Você informou o número que identifica seu voo.',
            { next: 'luggage' },
          ],
          [
            'omit-verb',
            ['My flight number 205.', 'Meu voo 205.'],
            'Inclua “is” para ligar “my flight number” ao número 205.',
            'language',
          ],
        ],
      ),
      decision(
        'show-passport',
        [
          'Flight 205. Can I see your passport, please?',
          'Voo 205. Posso ver seu passaporte, por favor?',
        ],
        [
          [
            'show',
            ['Here is my passport.', 'Aqui está meu passaporte.', ['passport']],
            '“Here is” acompanha a entrega do documento.',
            { next: 'luggage' },
          ],
          [
            'not-now',
            ['Where is gate 12?', 'Onde fica o portão 12?', ['where-gate']],
            'Essa pergunta pode ser útil depois. Agora foi solicitado o passaporte.',
            'context',
          ],
        ],
      ),
      decision(
        'luggage',
        ['Do you have a bag to check?', 'Você tem alguma mala para despachar?'],
        [
          [
            'check',
            [
              'Yes. I’d like to check this bag.',
              'Sim. Gostaria de despachar esta mala.',
              ['check-bag'],
            ],
            '“Check this bag” informa que você quer despachar essa mala.',
            { next: 'gate' },
          ],
          [
            'cabin',
            [
              'Can I take this bag on the plane?',
              'Posso levar esta mala no avião?',
              ['carry-on'],
            ],
            'A pergunta é natural para bagagem de mão. Neste cenário, você precisa despachar a mala.',
            'context',
          ],
        ],
      ),
      decision(
        'gate',
        [
          'Your bag is checked. Here’s your boarding pass.',
          'Sua mala foi despachada. Aqui está seu cartão de embarque.',
        ],
        [
          [
            'confirm',
            ['Thank you. What’s my gate?', 'Obrigado. Qual é o meu portão?'],
            'A pergunta confirma onde você deve embarcar antes de sair do balcão.',
            { next: 'done' },
          ],
          [
            'room',
            ['Is my room ready?', 'Meu quarto já está pronto?'],
            'Esta frase serve para um hotel. No aeroporto, confirme o portão.',
            'context',
          ],
        ],
      ),
      success('done', [
        'You’re all set. Your flight leaves from gate 12.',
        'Tudo pronto. Seu voo sai do portão 12.',
      ]),
    ],
  ),
  defineConversation(
    'find-the-gate',
    'Passageira',
    'Atendente do aeroporto',
    ({ decision, success }) => [
      decision(
        'ask',
        ['Hello. How can I help?', 'Olá. Como posso ajudar?'],
        [
          [
            'directions',
            ['Where is gate 18?', 'Onde fica o portão 18?', ['where-gate']],
            '“Where is” pede a localização. Nessa situação, você pode começar pela direção.',
            { next: 'confirm-gate' },
          ],
          [
            'confirm',
            [
              'Is gate 18 the right gate for flight 205?',
              'O portão 18 é o portão certo para o voo 205?',
              ['gate-change'],
            ],
            'Você pode confirmar o portão antes de pedir a direção.',
            { next: 'ask-directions' },
          ],
          [
            'omit-verb',
            ['Where gate 18?', 'Onde portão 18?'],
            'Para perguntar onde fica o portão, use “Where is” seguido do número.',
            'language',
          ],
        ],
        '“Where is” pede uma localização. Uma pergunta com “Is” também pode confirmar o portão.',
      ),
      decision(
        'confirm-gate',
        [
          'Go straight, then turn left. What’s your flight number?',
          'Siga em frente e vire à esquerda. Qual é o número do seu voo?',
        ],
        [
          [
            'number',
            ['My flight number is 205.', 'Meu voo é o 205.', ['flight-number']],
            'O número permite confirmar se a indicação serve para o seu voo.',
            { next: 'boarding' },
          ],
          [
            'documents',
            ['Here is my passport.', 'Aqui está meu passaporte.', ['passport']],
            'A pessoa perguntou pelo número do voo. Essa informação também está no cartão de embarque.',
            'context',
          ],
        ],
      ),
      decision(
        'ask-directions',
        ['Yes, flight 205 is at gate 18.', 'Sim, o voo 205 sai do portão 18.'],
        [
          [
            'where',
            ['Where is gate 18?', 'Onde fica o portão 18?', ['where-gate']],
            'Depois de confirmar o portão, você pede como chegar até ele.',
            { next: 'give-directions' },
          ],
          [
            'hotel',
            ['Where is my hotel?', 'Onde fica meu hotel?'],
            'A pergunta está bem formada, mas você precisa encontrar o portão.',
            'context',
          ],
        ],
      ),
      decision(
        'boarding',
        [
          'Yes, gate 18 is right for your flight.',
          'Sim, o portão 18 é o certo para seu voo.',
        ],
        [
          [
            'time',
            [
              'What time does boarding start?',
              'Que horas começa o embarque?',
              ['boarding-time'],
            ],
            'Você confirma a hora de embarcar depois de encontrar a direção.',
            { next: 'acknowledge' },
          ],
          [
            'luggage',
            [
              'I’d like to check this bag.',
              'Gostaria de despachar esta mala.',
              ['check-bag'],
            ],
            'Esse pedido é feito no check-in. Nesta conversa, falta confirmar o horário do embarque.',
            'context',
          ],
        ],
      ),
      decision(
        'give-directions',
        ['Go straight, then turn left.', 'Siga em frente e vire à esquerda.'],
        [
          [
            'time',
            [
              'Thanks. What time does boarding start?',
              'Obrigada. Que horas começa o embarque?',
              ['boarding-time'],
            ],
            'Você já tem a direção e agora confirma o horário.',
            { next: 'acknowledge' },
          ],
          [
            'time-error',
            ['What time boarding start?', 'Que horas o embarque começa?'],
            'Use “does” depois de “what time” para formar esta pergunta.',
            'language',
          ],
        ],
      ),
      decision(
        'acknowledge',
        ['Boarding starts at ten thirty.', 'O embarque começa às dez e meia.'],
        [
          [
            'confirm',
            ['Ten thirty. Thank you!', 'Dez e meia. Obrigada!'],
            'Repetir o horário confirma o que você ouviu.',
            { next: 'done' },
          ],
          [
            'wrong-time',
            ['Eleven thirty. Thank you!', 'Onze e meia. Obrigada!'],
            'A frase está bem formada, mas “ten thirty” é dez e meia.',
            'context',
          ],
        ],
      ),
      success('done', [
        'That’s right. Have a good flight!',
        'Isso mesmo. Tenha um bom voo!',
      ]),
    ],
  ),
] as const
