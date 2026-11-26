import { defineConversation } from './authoring'

export const hotelSimulations = [
  defineConversation(
    'check-in-at-reception',
    'Hóspede',
    'Recepcionista',
    ({ decision, success }) => [
      decision(
        'arrive',
        ['Good evening. How can I help you?', 'Boa noite. Como posso ajudar?'],
        [
          [
            'name',
            [
              'I have a reservation under the name Silva.',
              'Tenho uma reserva em nome de Silva.',
              ['have-reservation', 'reservation-name'],
            ],
            'Você informa o motivo da visita e dá um dado para localizar a reserva.',
            { next: 'confirm-nights' },
          ],
          [
            'booking',
            [
              'Here is my booking confirmation.',
              'Aqui está a confirmação da minha reserva.',
              ['show-confirmation'],
            ],
            'Mostrar a confirmação também é uma forma natural de iniciar o check-in.',
            { next: 'confirm-name' },
          ],
          [
            'meal',
            [
              'A table for two, please.',
              'Uma mesa para duas pessoas, por favor.',
            ],
            'Esse pedido funciona em um restaurante. Na recepção, informe a reserva.',
            'context',
          ],
        ],
        'O nome da reserva e a confirmação são duas maneiras de começar.',
      ),
      decision(
        'confirm-nights',
        [
          'I found your reservation. Two nights, right?',
          'Encontrei sua reserva. São duas noites, certo?',
        ],
        [
          [
            'yes',
            ['Yes, two nights.', 'Sim, duas noites.'],
            'Você confirma a duração da reserva sem precisar de uma frase longa.',
            { next: 'room' },
          ],
          [
            'change',
            ['Yes, one night.', 'Sim, uma noite.'],
            '“One night” é uma noite. A pessoa está confirmando duas.',
            'context',
          ],
        ],
      ),
      decision(
        'confirm-name',
        [
          'Thanks. Is this reservation for Silva?',
          'Obrigada. Esta reserva é para Silva?',
        ],
        [
          [
            'yes',
            [
              'Yes. It’s under the name Silva.',
              'Sim. Está no nome de Silva.',
              ['reservation-name'],
            ],
            'Você confirma que os dados do documento correspondem à sua reserva.',
            { next: 'room' },
          ],
          [
            'show',
            ['My reservation under Silva.', 'Minha reserva no nome de Silva.'],
            'Use “is” ou “it’s” para ligar a reserva ao nome cadastrado.',
            'language',
          ],
        ],
      ),
      decision(
        'room',
        [
          'Everything looks good. Do you need anything else?',
          'Está tudo certo. Precisa de mais alguma coisa?',
        ],
        [
          [
            'ready',
            ['Is my room ready?', 'Meu quarto já está pronto?', ['room-ready']],
            'Você confirma que já pode subir ao quarto.',
            { next: 'key' },
          ],
          [
            'ticket',
            ['Where is my boarding pass?', 'Onde está meu cartão de embarque?'],
            'A frase é válida, mas a recepção está tratando da sua hospedagem.',
            'context',
          ],
        ],
      ),
      decision(
        'key',
        ['Yes. You’re in room 204.', 'Sim. Você vai ficar no quarto 204.'],
        [
          [
            'request',
            [
              'Can I have the room key, please?',
              'Pode me dar a chave do quarto, por favor?',
              ['room-key'],
            ],
            '“Can I have” é útil para pedir a chave com educação.',
            { next: 'done' },
          ],
          [
            'checkout',
            [
              'I’d like to check out, please.',
              'Gostaria de fazer o check-out, por favor.',
              ['check-out'],
            ],
            'Use “check out” quando for sair. Agora você está chegando e precisa da chave.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Here’s your key card. Enjoy your stay!',
        'Aqui está seu cartão do quarto. Boa estadia!',
      ]),
    ],
  ),
  defineConversation(
    'reception-information',
    'Hóspede',
    'Recepcionista',
    ({ decision, success }) => [
      decision(
        'ask',
        [
          'Hello! What would you like to know?',
          'Olá! O que você gostaria de saber?',
        ],
        [
          [
            'breakfast',
            [
              'What time is breakfast?',
              'Qual é o horário do café da manhã?',
              ['breakfast-time'],
            ],
            'A pergunta pede o horário do café da manhã de forma direta.',
            { next: 'breakfast-place' },
          ],
          [
            'wifi',
            [
              'What’s the Wi-Fi password?',
              'Qual é a senha do Wi-Fi?',
              ['wifi'],
            ],
            'Você pode começar pela informação que precisa sobre a internet.',
            { next: 'wifi-card' },
          ],
          [
            'price',
            ['Can I pay by card?', 'Posso pagar com cartão?'],
            'A frase é natural se houver um pagamento. Aqui, o objetivo é consultar um serviço do hotel.',
            'context',
          ],
        ],
        'Você pode perguntar sobre o café da manhã ou sobre o Wi-Fi.',
      ),
      decision(
        'breakfast-place',
        ['It’s from seven to ten.', 'É das sete às dez.'],
        [
          [
            'where',
            [
              'Where is breakfast served?',
              'Onde é servido o café da manhã?',
              ['breakfast-place'],
            ],
            'Depois do horário, você pede o local onde o café é servido.',
            { next: 'towel-after-breakfast' },
          ],
          [
            'wrong-question',
            ['Where breakfast is served?', 'Onde o café da manhã é servido?'],
            'Em uma pergunta direta, ponha “is” antes de “breakfast”.',
            'language',
          ],
        ],
      ),
      decision(
        'wifi-card',
        [
          'It’s on this card, below the network name.',
          'Está neste cartão, abaixo do nome da rede.',
        ],
        [
          [
            'confirm',
            ['Here, on the second line?', 'Aqui, na segunda linha?'],
            'Você confirma a indicação antes de usar a informação.',
            { next: 'towel-after-wifi' },
          ],
          [
            'wrong-line',
            ['Here, above the network name?', 'Aqui, acima do nome da rede?'],
            'A pessoa disse “below”, que quer dizer abaixo, e não acima.',
            'context',
          ],
        ],
      ),
      decision(
        'towel-after-breakfast',
        [
          'In the restaurant. Anything else?',
          'No restaurante. Mais alguma coisa?',
        ],
        [
          [
            'request',
            [
              'Could I have an extra towel, please?',
              'Pode me trazer mais uma toalha, por favor?',
              ['extra-towel'],
            ],
            'Você aproveita a abertura para pedir o item de que precisa.',
            { next: 'room-number' },
          ],
          [
            'bad-verb',
            ['Could I has an extra towel?', 'Eu poderia ter uma toalha extra?'],
            'Depois de “could”, use “have” sem mudar a forma do verbo.',
            'language',
          ],
        ],
      ),
      decision(
        'towel-after-wifi',
        ['Yes, that’s it. Anything else?', 'Sim, é isso. Mais alguma coisa?'],
        [
          [
            'request',
            [
              'Could I have an extra towel, please?',
              'Pode me trazer mais uma toalha, por favor?',
              ['extra-towel'],
            ],
            '“Could I have” é uma forma cordial de pedir uma toalha.',
            { next: 'room-number' },
          ],
          [
            'leave',
            [
              'I’d like to check out.',
              'Gostaria de fazer o check-out.',
              ['check-out'],
            ],
            'Essa frase encerra a estadia. Aqui você ainda quer pedir um item.',
            'context',
          ],
        ],
      ),
      decision(
        'room-number',
        [
          'Of course. What’s your room number?',
          'Claro. Qual é o número do seu quarto?',
        ],
        [
          [
            'confirm',
            ['I’m in room 204.', 'Estou no quarto 204.'],
            'Você indica para qual quarto a toalha deve ser enviada.',
            { next: 'done' },
          ],
          [
            'wrong-number',
            ['I’m in room 240.', 'Estou no quarto 240.'],
            'A frase está correta, mas o seu quarto neste cenário é o 204.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Thank you. We’ll bring a towel to your room.',
        'Obrigada. Vamos levar uma toalha ao seu quarto.',
      ]),
    ],
  ),
] as const
