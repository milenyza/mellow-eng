import { definePhrasebook } from './authoring'
import type { Phrasebook } from '@/types/practical-english'

const group = definePhrasebook('meeting-people')
export const meetingPeoplePhrasebook = {
  situationId: 'meeting-people',
  groups: [
    group('introductions', 'Cumprimentar e se apresentar', [
      [
        'name',
        'My name is Nina.',
        'Meu nome é Nina.',
        'Troque Nina pelo seu nome para se apresentar.',
      ],
      [
        'your-name',
        'What’s your name?',
        'Qual é o seu nome?',
        'Pergunte o nome da outra pessoa.',
      ],
      [
        'nice-to-meet',
        'Nice to meet you.',
        'Prazer em conhecer você.',
        'Use quando conhece alguém pela primeira vez.',
      ],
      [
        'first-class',
        'Is this your first class?',
        'É sua primeira aula?',
        'Abra uma conversa em um curso ou oficina.',
      ],
    ]),
    group('origins', 'Conversar sobre origens', [
      [
        'where-from',
        'Where are you from?',
        'De onde você é?',
        'Pergunte a origem depois de iniciar a conversa.',
      ],
      [
        'from-brazil',
        'I’m from Brazil.',
        'Sou do Brasil.',
        'Troque Brazil pelo país ou cidade de origem.',
      ],
      [
        'live-here',
        'Do you live here?',
        'Você mora aqui?',
        'Pergunte se a pessoa mora na cidade onde vocês estão.',
      ],
      [
        'visiting',
        'I’m here for the weekend.',
        'Estou aqui para passar o fim de semana.',
        'Explique que está visitando por pouco tempo.',
      ],
    ]),
    group('follow-up', 'Dar continuidade ou se despedir', [
      [
        'say-again',
        'Can you say that again?',
        'Pode dizer isso de novo?',
        'Peça que a pessoa repita algo que você não entendeu.',
      ],
      [
        'sit-here',
        'Can I sit here?',
        'Posso sentar aqui?',
        'Confirme se o lugar está livre.',
      ],
      [
        'see-next',
        'See you next week.',
        'Até a semana que vem.',
        'Despeça-se quando espera ver a pessoa na próxima semana.',
      ],
    ]),
  ],
} satisfies Phrasebook
