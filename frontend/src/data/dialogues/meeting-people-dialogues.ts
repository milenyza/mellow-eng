import { defineDialogue } from './authoring'

export const meetingPeopleDialogues = [
  defineDialogue(
    'first-english-class',
    [
      'Pedir para sentar e dizer seu nome.',
      'Cumprimentar e combinar de se ver na próxima aula.',
    ],
    [
      { id: 'student', role: 'Nina, estudante' },
      { id: 'partner', role: 'Maya, estudante' },
    ],
    [
      [
        'seat',
        'student',
        'Hi. Can I sit here?',
        'Oi. Posso sentar aqui?',
        ['sit-here'],
      ],
      [
        'free',
        'partner',
        'Of course. This seat is free.',
        'Claro. Este lugar está livre.',
      ],
      [
        'name',
        'student',
        'Thanks. My name is Nina.',
        'Obrigada. Meu nome é Nina.',
        ['name'],
      ],
      [
        'introduce',
        'partner',
        'I’m Maya. Nice to meet you.',
        'Sou Maya. Prazer em conhecer você.',
        ['nice-to-meet'],
      ],
      [
        'greet',
        'student',
        'Nice to meet you, too. Is this your first class?',
        'O prazer é meu. É sua primeira aula?',
        ['nice-to-meet', 'first-class'],
      ],
      [
        'first',
        'partner',
        'Yes, it is. Is it your first class, too?',
        'Sim. É sua primeira aula também?',
      ],
      [
        'yes',
        'student',
        'Yes. I’m a little nervous.',
        'Sim. Estou um pouco nervosa.',
      ],
      [
        'me-too',
        'partner',
        'Me too! Oh, the teacher is here.',
        'Eu também! Olha, a professora chegou.',
      ],
      [
        'next',
        'student',
        'That was a good class. See you next week, Maya.',
        'A aula foi boa. Até a semana que vem, Maya.',
        ['see-next'],
      ],
      ['bye', 'partner', 'See you, Nina.', 'Até mais, Nina.'],
    ],
    [
      [
        'seat',
        '“Can I sit here?” é uma maneira cordial de confirmar se um lugar está livre.',
        ['sit-here'],
      ],
      [
        'too',
        '“Too” no fim de “Nice to meet you, too” devolve a saudação.',
        ['nice-to-meet'],
      ],
      [
        'next-week',
        'Use “See you next week” quando já sabe que verá a pessoa na próxima semana.',
        ['see-next'],
      ],
    ],
  ),
  defineDialogue(
    'where-we-are-from',
    ['Perguntar de onde alguém é.', 'Distinguir origem de moradia atual.'],
    [
      { id: 'student', role: 'Nina, participante' },
      { id: 'partner', role: 'Leo, participante' },
    ],
    [
      [
        'origin',
        'student',
        'Where are you from, Leo?',
        'De onde você é, Leo?',
        ['where-from'],
      ],
      [
        'city',
        'partner',
        'I’m from Austin. How about you?',
        'Sou de Austin. E você?',
      ],
      [
        'brazil',
        'student',
        'I’m from Brazil.',
        'Sou do Brasil.',
        ['from-brazil'],
      ],
      [
        'here',
        'partner',
        'Do you live here now?',
        'Você mora aqui agora?',
        ['live-here'],
      ],
      [
        'weekend',
        'student',
        'No. I’m here for the weekend.',
        'Não. Estou aqui para passar o fim de semana.',
        ['visiting'],
      ],
      ['mine', 'partner', 'I live here now.', 'Eu moro aqui agora.'],
      [
        'repeat',
        'student',
        'Sorry, can you say that again?',
        'Desculpa, pode dizer isso de novo?',
        ['say-again'],
      ],
      [
        'again',
        'partner',
        'Sure. I live here now, but I’m from Austin.',
        'Claro. Moro aqui agora, mas sou de Austin.',
      ],
      [
        'understood',
        'student',
        'Oh, I see. Thanks, Leo.',
        'Ah, entendi. Obrigada, Leo.',
      ],
      [
        'bye',
        'partner',
        'You’re welcome. Enjoy your weekend!',
        'De nada. Bom fim de semana!',
      ],
    ],
    [
      [
        'from',
        '“I’m from” indica origem. “I live in” indica onde a pessoa mora.',
        ['where-from', 'from-brazil'],
      ],
      ['time', '“For the weekend” indica a duração da visita.', ['visiting']],
      [
        'ask-again',
        '“Can you say that again?” ajuda a esclarecer uma fala sem interromper a conversa por muito tempo.',
        ['say-again'],
      ],
    ],
  ),
] as const
