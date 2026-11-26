import { defineConversation } from './authoring'

export const transportationSimulations = [
  defineConversation(
    'buy-a-ticket',
    'Passageiro',
    'Atendente da bilheteria',
    ({ decision, success }) => [
      decision(
        'ticket',
        [
          'Good morning. Where are you going today?',
          'Bom dia. Para onde você vai hoje?',
        ],
        [
          [
            'one-way',
            [
              'One ticket to Brookfield, please. One way.',
              'Uma passagem para Brookfield, por favor. Só de ida.',
              ['ticket-to', 'one-way'],
            ],
            'Você informou o destino e pediu apenas a ida.',
            { next: 'one-way' },
          ],
          [
            'return',
            [
              'A round-trip ticket to Brookfield, please.',
              'Uma passagem de ida e volta para Brookfield, por favor.',
              ['round-trip'],
            ],
            'Ida e volta é outra opção válida para a viagem.',
            { next: 'round-trip' },
          ],
          [
            'wrong',
            [
              'One ticket from Brookfield, please.',
              'Uma passagem saindo de Brookfield, por favor.',
            ],
            '“From” indica origem. Use “to Brookfield” para dizer aonde quer ir.',
            'context',
          ],
        ],
        'Se já souber o tipo de passagem, pode informar junto com o destino.',
      ),
      decision(
        'one-way',
        ['One way. That’s seven dollars.', 'Só a ida. São sete dólares.'],
        [
          [
            'time',
            [
              'What time is the next train?',
              'Que horas sai o próximo trem?',
              ['next-train'],
            ],
            'Você confirmou quando sai o próximo trem.',
            { next: 'departure' },
          ],
          [
            'wrong',
            ['What time the next train is?', 'Que horas sai o próximo trem?'],
            'Na pergunta direta, use “is” antes de “the next train”.',
            'language',
          ],
        ],
      ),
      decision(
        'round-trip',
        [
          'Round trip. That’s twelve dollars.',
          'Ida e volta. São doze dólares.',
        ],
        [
          [
            'time',
            [
              'What time is the next train?',
              'Que horas sai o próximo trem?',
              ['next-train'],
            ],
            'Agora você pode confirmar o horário da ida.',
            { next: 'departure' },
          ],
          [
            'wrong',
            [
              'One way, please. I need to go and come back.',
              'Só de ida, por favor. Preciso ir e voltar.',
              ['one-way'],
            ],
            'As duas partes se contradizem. “One way” vale apenas para a ida.',
            'context',
          ],
        ],
      ),
      decision(
        'departure',
        [
          'The next train leaves at nine thirty.',
          'O próximo trem sai às nove e meia.',
        ],
        [
          [
            'platform',
            ['Which platform is it?', 'Qual é a plataforma?', ['platform']],
            'Agora você pergunta onde embarcar.',
            { next: 'confirm' },
          ],
          [
            'wrong',
            ['What color is your shirt?', 'Qual é a cor da sua camisa?'],
            'A pergunta faz sentido sobre roupas. Aqui, você precisa saber a plataforma.',
            'context',
          ],
        ],
      ),
      decision(
        'confirm',
        [
          'Platform two. Here’s your ticket.',
          'Plataforma dois. Aqui está sua passagem.',
        ],
        [
          [
            'repeat',
            [
              'Nine thirty, platform two. Thank you.',
              'Nove e meia, plataforma dois. Obrigado.',
              ['platform'],
            ],
            'Você confirmou o horário e a plataforma corretos.',
            { next: 'done' },
          ],
          [
            'wrong',
            [
              'Ten thirty, platform two. Thank you.',
              'Dez e meia, plataforma dois. Obrigado.',
            ],
            'O horário informado foi “nine thirty”, nove e meia.',
            'context',
          ],
        ],
      ),
      success('done', [
        'That’s right. Have a good trip!',
        'Isso mesmo. Boa viagem!',
      ]),
    ],
  ),
  defineConversation(
    'confirm-the-stop',
    'Passageira',
    'Motorista',
    ({ decision, success }) => [
      decision(
        'opening',
        ['Hello. Do you need help?', 'Oi. Precisa de ajuda?'],
        [
          [
            'destination',
            [
              'Does this bus go to the park?',
              'Este ônibus vai ao parque?',
              ['go-to'],
            ],
            'Você perguntou se este ônibus passa no destino.',
            { next: 'route' },
          ],
          [
            'number',
            [
              'Which bus do I take to the park?',
              'Qual ônibus eu pego para ir ao parque?',
              ['bus-number'],
            ],
            'Você pediu a linha que atende o parque.',
            { next: 'number' },
          ],
          [
            'wrong',
            ['Does this bus goes to the park?', 'Este ônibus vai ao parque?'],
            'Depois de “does”, o verbo fica “go”, sem “es”.',
            'language',
          ],
        ],
        'Confirme se este ônibus vai ao parque ou pergunte qual linha pegar.',
      ),
      decision(
        'route',
        ['Yes, it does. This is bus eight.', 'Sim. Este é o ônibus oito.'],
        [
          [
            'get-off',
            ['Where do I get off?', 'Onde eu desço?', ['get-off']],
            'Você já sabe que a linha é certa e quer confirmar a parada.',
            { next: 'stop' },
          ],
          [
            'wrong',
            ['I’m going to the library.', 'Estou indo para a biblioteca.'],
            'A frase indica outro destino. Você está indo ao parque.',
            'context',
          ],
        ],
      ),
      decision(
        'number',
        [
          'Take bus eight. That’s this bus.',
          'Pegue o ônibus oito. É este aqui.',
        ],
        [
          [
            'get-off',
            ['Where do I get off?', 'Onde eu desço?', ['get-off']],
            'Confirmada a linha, pergunte onde descer para o parque.',
            { next: 'stop' },
          ],
          [
            'wrong',
            ['Where I get off?', 'Onde eu desço?'],
            'Use “do” na pergunta “Where do I get off?”.',
            'language',
          ],
        ],
      ),
      decision(
        'stop',
        [
          'Get off at Lake Street. It’s the third stop.',
          'Desça na Lake Street. É a terceira parada.',
        ],
        [
          [
            'ask',
            [
              'Can you tell me when we get there?',
              'Pode me avisar quando chegarmos?',
              ['tell-me'],
            ],
            'Você pediu um aviso para não passar do ponto.',
            { next: 'check' },
          ],
          [
            'wrong',
            [
              'I’ll get off at the first stop.',
              'Vou descer na primeira parada.',
            ],
            'O motorista disse terceira parada, “the third stop”.',
            'context',
          ],
        ],
      ),
      decision(
        'check',
        [
          'Of course. This is Lake Street now.',
          'Claro. Chegamos à Lake Street.',
        ],
        [
          [
            'confirm',
            [
              'So this is my stop. Thank you!',
              'Então este é meu ponto. Obrigada!',
              ['right-stop'],
            ],
            'Você identificou a parada e agradeceu pelo aviso.',
            { next: 'done' },
          ],
          [
            'wrong',
            ['I’ll stay on the bus.', 'Vou ficar no ônibus.'],
            'Ficar no ônibus faria você passar do ponto do parque.',
            'context',
          ],
        ],
      ),
      success('done', [
        'You’re welcome. The park is across the street.',
        'De nada. O parque fica do outro lado da rua.',
      ]),
    ],
  ),
] as const
