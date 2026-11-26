import { defineConversation } from './authoring'

export const healthAndEmergenciesSimulations = [
  defineConversation(
    'say-how-you-feel',
    'Pessoa pedindo ajuda',
    'Pessoa na feira',
    ({ decision, success }) => [
      decision(
        'start',
        ['Hi. Are you okay?', 'Oi. Você está bem?'],
        [
          [
            'general',
            ['I don’t feel well.', 'Não estou me sentindo bem.', ['not-well']],
            'Você avisou que está passando mal. A pessoa pode pedir mais detalhes.',
            { next: 'symptom' },
          ],
          [
            'specific',
            ['I feel dizzy.', 'Estou com tontura.', ['dizzy']],
            'Você já informou um detalhe sobre como está se sentindo.',
            { next: 'together' },
          ],
          [
            'wrong',
            ['I don’t feels well.', 'Não estou me sentindo bem.'],
            'Depois de “don’t”, use “feel”, sem “s”.',
            'language',
          ],
        ],
        'Você pode começar explicando que não está bem ou dizer que está com tontura.',
      ),
      decision(
        'symptom',
        ['I’m here. How do you feel?', 'Estou aqui. Como você se sente?'],
        [
          [
            'dizzy',
            [
              'I feel dizzy. Can you stay with me?',
              'Estou com tontura. Pode ficar comigo?',
              ['dizzy', 'stay-with-me'],
            ],
            'Você descreveu a sensação e pediu companhia.',
            { next: 'contact' },
          ],
          [
            'wrong',
            ['I feel great.', 'Estou me sentindo muito bem.'],
            '“Great” significa muito bem. Aqui você ainda está com tontura.',
            'context',
          ],
        ],
      ),
      decision(
        'together',
        ['I see. Do you want me to stay?', 'Entendi. Quer que eu fique?'],
        [
          [
            'stay',
            [
              'Yes, please stay with me.',
              'Sim, por favor, fique comigo.',
              ['stay-with-me'],
            ],
            'Você aceitou que a pessoa ficasse ao seu lado.',
            { next: 'contact' },
          ],
          [
            'wrong',
            ['Yes, please stays with me.', 'Sim, por favor, fique comigo.'],
            'Ao pedir diretamente, use “please stay”, sem “s”.',
            'language',
          ],
        ],
      ),
      decision(
        'contact',
        [
          'Of course. Is there someone I can call?',
          'Claro. Tem alguém para quem eu possa ligar?',
        ],
        [
          [
            'call',
            [
              'Can you call my friend?',
              'Pode ligar para minha amiga?',
              ['call-friend'],
            ],
            'Você pediu ajuda para entrar em contato com sua amiga.',
            { next: 'number' },
          ],
          [
            'wrong',
            ['I can call you tomorrow.', 'Posso ligar para você amanhã.'],
            'A pessoa se ofereceu para ligar para alguém agora. Diga para quem ela pode ligar.',
            'context',
          ],
        ],
      ),
      decision(
        'number',
        [
          'Sure. What’s her phone number?',
          'Claro. Qual é o número de telefone dela?',
        ],
        [
          [
            'show',
            [
              'It’s on my phone. Here it is.',
              'Está no meu celular. Aqui está.',
            ],
            'Mostrar o número no celular responde à pergunta.',
            { next: 'done' },
          ],
          [
            'wrong',
            ['Her phone number are here.', 'O número dela está aqui.'],
            '“Phone number” está no singular. Use “is”, ou “It’s on my phone”.',
            'language',
          ],
        ],
      ),
      success('done', [
        'Thank you. I’ll call your friend now.',
        'Obrigada. Vou ligar para sua amiga agora.',
      ]),
    ],
  ),
  defineConversation(
    'give-your-location',
    'Pessoa pedindo ajuda',
    'Funcionária do local',
    ({ decision, success }) => [
      decision(
        'start',
        ['Hello. Where are you now?', 'Olá. Onde você está agora?'],
        [
          [
            'building',
            [
              'I’m in front of the library.',
              'Estou em frente à biblioteca.',
              ['in-front'],
            ],
            'Você informou qual prédio está na sua frente.',
            { next: 'entrance' },
          ],
          [
            'entrance',
            [
              'I’m at the main entrance to the library.',
              'Estou na entrada principal da biblioteca.',
              ['main-entrance'],
            ],
            'Você identificou o prédio e a entrada de uma vez.',
            { next: 'outside' },
          ],
          [
            'wrong',
            ['I’m front of the library.', 'Estou em frente à biblioteca.'],
            'Use a expressão completa “in front of” para dizer “em frente a”.',
            'language',
          ],
        ],
        'Comece pelo prédio ou pela entrada que está perto de você.',
      ),
      decision(
        'entrance',
        ['Which entrance are you near?', 'De qual entrada você está perto?'],
        [
          [
            'main',
            [
              'I’m near the main entrance, outside.',
              'Estou perto da entrada principal, do lado de fora.',
              ['main-entrance'],
            ],
            'Você confirmou a entrada e o lado certo.',
            { next: 'bench' },
          ],
          [
            'wrong',
            ['I’m at the back entrance.', 'Estou na entrada dos fundos.'],
            'O ponto de referência correto é a entrada principal.',
            'context',
          ],
        ],
      ),
      decision(
        'outside',
        ['Are you inside or outside?', 'Você está dentro ou fora?'],
        [
          [
            'outside',
            ['I’m outside.', 'Estou do lado de fora.'],
            'Você esclareceu de que lado da entrada está.',
            { next: 'bench' },
          ],
          [
            'wrong',
            [
              'I’m inside, near the desk.',
              'Estou do lado de dentro, perto do balcão.',
              ['near-desk'],
            ],
            'Essa frase aponta para um lugar diferente. Aqui você está do lado de fora.',
            'context',
          ],
        ],
      ),
      decision(
        'bench',
        [
          'Can you see a blue bench by the door?',
          'Você consegue ver um banco azul perto da porta?',
        ],
        [
          [
            'confirm',
            ['Yes. I’m next to it.', 'Sim. Estou ao lado dele.'],
            'Você confirmou o banco como referência para a funcionária.',
            { next: 'meet' },
          ],
          [
            'wrong',
            ['Yes. I’m next it.', 'Sim. Estou ao lado dele.'],
            'Use “next to” antes do objeto que está ao seu lado.',
            'language',
          ],
        ],
      ),
      decision(
        'meet',
        [
          'Okay. I’ll meet you by the blue bench.',
          'Certo. Vou encontrar você perto do banco azul.',
        ],
        [
          [
            'wait',
            ['I’ll wait here. Thank you.', 'Vou esperar aqui. Obrigada.'],
            'Você confirmou que vai esperar no lugar combinado.',
            { next: 'done' },
          ],
          [
            'wrong',
            ['I’ll go to the back entrance.', 'Vou à entrada dos fundos.'],
            'O encontro ficou combinado perto do banco azul, na entrada principal.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Thank you. I’m on my way.',
        'Obrigada. Estou a caminho.',
      ]),
    ],
  ),
] as const
