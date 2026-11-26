import { defineConversation } from './authoring'

export const aroundTheCitySimulations = [
  defineConversation(
    'find-a-place',
    'Visitante',
    'Morador',
    ({ decision, success }) => [
      decision(
        'start',
        [
          'Hi. Can I help you find something?',
          'Olá. Posso ajudar você a encontrar algum lugar?',
        ],
        [
          [
            'directions',
            [
              'How do I get to the library?',
              'Como chego à biblioteca?',
              ['museum'],
            ],
            'Você pediu instruções para chegar ao destino.',
            { next: 'walk-time' },
          ],
          [
            'walking',
            [
              'Can I walk to the library from here?',
              'Dá para ir a pé daqui até a biblioteca?',
              ['walk'],
            ],
            'Você perguntou se pode fazer o trajeto andando.',
            { next: 'first-street' },
          ],
          [
            'wrong',
            ['How I get to the library?', 'Como chego à biblioteca?'],
            'Use “do” para formar “How do I get to the library?”.',
            'language',
          ],
        ],
        'Você pode pedir o caminho ou perguntar se dá para ir a pé.',
      ),
      decision(
        'walk-time',
        ['It’s a five-minute walk.', 'São cinco minutos a pé.'],
        [
          [
            'which',
            ['Which street do I take?', 'Qual rua eu pego?'],
            'Você sabe que é perto e pediu por onde começar.',
            { next: 'corner' },
          ],
          [
            'wrong',
            ['I want to go to the airport.', 'Quero ir ao aeroporto.'],
            'A frase muda o destino para o aeroporto. Você quer ir até a biblioteca.',
            'context',
          ],
        ],
      ),
      decision(
        'first-street',
        [
          'Yes. You can walk there. Take this street.',
          'Sim. Dá para ir a pé. Pegue esta rua.',
        ],
        [
          [
            'first',
            ['This street. Then what?', 'Esta rua. E depois?'],
            'Você confirmou a rua inicial e pediu a próxima instrução.',
            { next: 'corner' },
          ],
          [
            'wrong',
            [
              'I’ll take the street behind us.',
              'Vou pegar a rua atrás de nós.',
            ],
            'A indicação foi “this street”, a rua que a pessoa está mostrando.',
            'context',
          ],
        ],
      ),
      decision(
        'corner',
        [
          'Go straight and turn left at the corner.',
          'Siga em frente e vire à esquerda na esquina.',
        ],
        [
          [
            'landmark',
            [
              'What’s next to the library?',
              'O que fica ao lado da biblioteca?',
              ['next-to'],
            ],
            'Você pediu uma referência para reconhecer o prédio.',
            { next: 'landmark' },
          ],
          [
            'wrong',
            [
              'I’ll turn right at the corner.',
              'Vou virar à direita na esquina.',
            ],
            'A instrução é “turn left”, vire à esquerda.',
            'context',
          ],
        ],
      ),
      decision(
        'landmark',
        [
          'It’s next to the bank, in a red building.',
          'Fica ao lado do banco, em um prédio vermelho.',
        ],
        [
          [
            'confirm',
            [
              'The red building next to the bank. Thank you!',
              'O prédio vermelho ao lado do banco. Obrigada!',
              ['next-to'],
            ],
            'Você repetiu a cor e o ponto de referência corretos.',
            { next: 'done' },
          ],
          [
            'wrong',
            [
              'The red building behind the bank. Thanks!',
              'O prédio vermelho atrás do banco. Obrigada!',
            ],
            '“Next to” significa ao lado. “Behind” significa atrás.',
            'context',
          ],
        ],
      ),
      success('done', [
        'That’s it. You’ll see the library sign.',
        'Isso mesmo. Você vai ver a placa da biblioteca.',
      ]),
    ],
  ),
  defineConversation(
    'confirm-a-direction',
    'Visitante',
    'Moradora',
    ({ decision, success }) => [
      decision(
        'start',
        [
          'Go straight and turn near the park.',
          'Siga em frente e vire perto do parque.',
        ],
        [
          [
            'turn',
            ['Which way do I turn?', 'Para que lado eu viro?', ['which-way']],
            'Você pediu que a pessoa indique o sentido da curva.',
            { next: 'right' },
          ],
          [
            'park',
            [
              'Before or after the park?',
              'Antes ou depois do parque?',
              ['before-after'],
            ],
            'Você pediu para esclarecer o ponto da curva.',
            { next: 'after' },
          ],
          [
            'wrong',
            ['What time does the train leave?', 'Que horas sai o trem?'],
            'Essa pergunta é sobre transporte. Aqui, você precisa confirmar a curva.',
            'context',
          ],
        ],
        'Pergunte pelo sentido da curva ou pela posição em relação ao parque.',
      ),
      decision(
        'right',
        ['Turn right.', 'Vire à direita.'],
        [
          [
            'ask',
            [
              'Before or after the park?',
              'Antes ou depois do parque?',
              ['before-after'],
            ],
            'Você já sabe o sentido. Agora está confirmando o ponto da curva.',
            { next: 'restate' },
          ],
          [
            'wrong',
            ['Do I turn left?', 'Eu viro à esquerda?'],
            'A indicação já foi “turn right”, vire à direita.',
            'context',
          ],
        ],
      ),
      decision(
        'after',
        ['After the park.', 'Depois do parque.'],
        [
          [
            'ask',
            ['Which way do I turn?', 'Para que lado eu viro?', ['which-way']],
            'Você já sabe onde virar e agora pergunta para que lado.',
            { next: 'restate' },
          ],
          [
            'wrong',
            ['I turn before the park.', 'Viro antes do parque.'],
            '“After” significa depois, então a curva vem após o parque.',
            'context',
          ],
        ],
      ),
      decision(
        'restate',
        [
          'Turn right at the first corner after the park.',
          'Vire à direita na primeira esquina depois do parque.',
        ],
        [
          [
            'confirm',
            [
              'Right at the first corner after the park. Is the pharmacy on the right, too?',
              'À direita na primeira esquina depois do parque. A farmácia também fica à direita?',
              ['right'],
            ],
            'Você confirmou a curva e distinguiu o lado em que a farmácia fica.',
            { next: 'pharmacy' },
          ],
          [
            'wrong',
            [
              'Right at the second corner after the park.',
              'À direita na segunda esquina depois do parque.',
            ],
            'A indicação foi “first corner”, a primeira esquina.',
            'context',
          ],
        ],
      ),
      decision(
        'pharmacy',
        [
          'The pharmacy is on your left, next to a bookstore.',
          'A farmácia fica à sua esquerda, ao lado de uma livraria.',
        ],
        [
          [
            'confirm',
            [
              'On the left, next to the bookstore. Thank you!',
              'À esquerda, ao lado da livraria. Obrigado!',
              ['next-to'],
            ],
            'Você confirmou o lado e o ponto de referência da farmácia.',
            { next: 'done' },
          ],
          [
            'wrong',
            [
              'On the left, next the bookstore. Thank you!',
              'À esquerda, ao lado da livraria. Obrigado!',
            ],
            'Para dizer que fica ao lado da livraria, use “next to the bookstore”.',
            'language',
          ],
        ],
      ),
      success('done', [
        'Exactly. It has a green sign.',
        'Isso mesmo. Tem uma placa verde.',
      ]),
    ],
  ),
] as const
