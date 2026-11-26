import { defineConversation } from './authoring'

export const meetingPeopleSimulations = [
  defineConversation(
    'meet-a-classmate',
    'Nina, estudante',
    'Ana, estudante',
    ({ decision, success }) => [
      decision(
        'welcome',
        [
          'Hi! Are you here for the English class?',
          'Oi! Você está aqui para a aula de inglês?',
        ],
        [
          [
            'name',
            ['Yes. My name is Nina.', 'Sim. Meu nome é Nina.', ['name']],
            'Você confirmou a aula e já se apresentou.',
            { next: 'seat-after-name' },
          ],
          [
            'seat',
            ['Yes. Can I sit here?', 'Sim. Posso sentar aqui?', ['sit-here']],
            'Você confirmou a aula e perguntou se a cadeira está livre.',
            { next: 'name-after-seat' },
          ],
          [
            'wrong',
            ['Yes. My name Nina.', 'Sim. Meu nome é Nina.'],
            'Use “is” em “My name is Nina”.',
            'language',
          ],
        ],
        'Você pode dizer seu nome ou pedir um lugar para sentar.',
      ),
      decision(
        'seat-after-name',
        ['I’m Ana. This seat is free.', 'Sou Ana. Este lugar está livre.'],
        [
          [
            'sit',
            [
              'Thanks. I’ll sit here.',
              'Obrigada. Vou sentar aqui.',
              ['sit-here'],
            ],
            'A colega ofereceu um lugar. Você confirmou que vai sentar.',
            { next: 'class' },
          ],
          [
            'wrong',
            ['I’m here for the bus.', 'Estou aqui para pegar o ônibus.'],
            'Você veio para a aula de inglês, não para pegar o ônibus.',
            'context',
          ],
        ],
      ),
      decision(
        'name-after-seat',
        [
          'Of course. I’m Ana. What’s your name?',
          'Claro. Sou Ana. Qual é o seu nome?',
        ],
        [
          [
            'name',
            ['My name is Nina.', 'Meu nome é Nina.', ['name']],
            'Você respondeu à pergunta de Ana com seu nome.',
            { next: 'class' },
          ],
          [
            'wrong',
            ['What’s my name?', 'Qual é o meu nome?'],
            'Ana quer saber seu nome. Responda com “My name is”.',
            'context',
          ],
        ],
      ),
      decision(
        'class',
        ['Nice to meet you, Nina.', 'Prazer em conhecer você, Nina.'],
        [
          [
            'ask',
            [
              'Nice to meet you, too. Is this your first class?',
              'O prazer é meu. É sua primeira aula?',
              ['nice-to-meet', 'first-class'],
            ],
            'Você devolveu a saudação e iniciou outro assunto.',
            { next: 'first' },
          ],
          [
            'wrong',
            ['Nice meet you, too.', 'O prazer é meu.'],
            'A expressão é “Nice to meet you”, com “to”.',
            'language',
          ],
        ],
      ),
      decision(
        'first',
        [
          'Yes, it is. Is it your first class, too?',
          'Sim. É sua primeira aula também?',
        ],
        [
          [
            'yes',
            [
              'Yes, it is. I’m happy to be here.',
              'Sim. Estou feliz por estar aqui.',
            ],
            '“Yes, it is” confirma que esta é a sua primeira aula.',
            { next: 'done' },
          ],
          [
            'wrong',
            ['No, I teach the class.', 'Não, eu dou a aula.'],
            'Esta é sua primeira aula como estudante. A frase indica que você é a professora.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Me too. Let’s sit together.',
        'Eu também. Vamos sentar juntas.',
      ]),
    ],
  ),
  defineConversation(
    'talk-about-origins',
    'Participante da oficina',
    'Ben, participante',
    ({ decision, success }) => [
      decision(
        'start',
        [
          'Hi, I’m Ben. It’s nice to meet you.',
          'Oi, sou Ben. Prazer em conhecer você.',
        ],
        [
          [
            'origin',
            [
              'Nice to meet you. Where are you from?',
              'Prazer em conhecer você. De onde você é?',
              ['nice-to-meet', 'where-from'],
            ],
            'Você cumprimentou Ben e perguntou de onde ele é.',
            { next: 'origin' },
          ],
          [
            'home',
            [
              'Nice to meet you. Do you live here?',
              'Prazer em conhecer você. Você mora aqui?',
              ['nice-to-meet', 'live-here'],
            ],
            'Perguntar se Ben mora aqui também inicia uma conversa natural.',
            { next: 'home' },
          ],
          [
            'wrong',
            [
              'Nice to meet you. Where is you from?',
              'Prazer em conhecer você. De onde é?',
            ],
            'Use “are” com “you” na pergunta “Where are you from?”.',
            'language',
          ],
        ],
        'Pergunte sobre a origem ou a moradia de Ben.',
      ),
      decision(
        'origin',
        [
          'I’m from Boston. I live here now. How about you?',
          'Sou de Boston. Moro aqui agora. E você?',
        ],
        [
          [
            'country',
            ['I’m from Brazil.', 'Sou do Brasil.', ['from-brazil']],
            '“I’m from” indica sua origem e corresponde ao assunto.',
            { next: 'visit' },
          ],
          [
            'wrong',
            ['I’m from in Brazil.', 'Sou do Brasil.'],
            'Use só “from” antes de Brazil para falar de origem.',
            'language',
          ],
        ],
      ),
      decision(
        'home',
        [
          'Yes. I’m from Boston, but I live here now. Where are you from?',
          'Sim. Sou de Boston, mas moro aqui agora. De onde você é?',
        ],
        [
          [
            'country',
            ['I’m from Brazil.', 'Sou do Brasil.', ['from-brazil']],
            'Você respondeu de onde é.',
            { next: 'visit' },
          ],
          [
            'wrong',
            ['I’m in Brazil now.', 'Estou no Brasil agora.'],
            'Ben perguntou a origem. “In Brazil now” indica localização atual.',
            'context',
          ],
        ],
      ),
      decision(
        'visit',
        ['Oh, nice. Do you live here?', 'Ah, que legal. Você mora aqui?'],
        [
          [
            'weekend',
            [
              'No. I’m here for the weekend.',
              'Não. Estou aqui para passar o fim de semana.',
              ['visiting'],
            ],
            'Você explicou que está fazendo uma visita curta.',
            { next: 'weekend' },
          ],
          [
            'wrong',
            ['Yes. I live here.', 'Sim. Moro aqui.', ['live-here']],
            'A frase indicaria que você mora na cidade. Nesta conversa, você está só de visita.',
            'context',
          ],
        ],
      ),
      decision(
        'weekend',
        [
          'I hope you enjoy your weekend here!',
          'Espero que aproveite seu fim de semana aqui!',
        ],
        [
          [
            'thanks',
            [
              'Thanks! It was nice to meet you.',
              'Obrigada! Foi um prazer conhecer você.',
              ['nice-to-meet'],
            ],
            'Você agradeceu e encerrou a conversa com cordialidade.',
            { next: 'done' },
          ],
          [
            'wrong',
            ['I’m from Boston, too.', 'Também sou de Boston.'],
            'Você já disse que é do Brasil. Um agradecimento combina com essa despedida.',
            'context',
          ],
        ],
      ),
      success('done', [
        'Nice to meet you, too. Bye!',
        'O prazer foi meu. Até logo!',
      ]),
    ],
  ),
] as const
