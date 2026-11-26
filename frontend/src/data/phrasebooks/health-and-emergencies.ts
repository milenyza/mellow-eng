import { definePhrasebook } from './authoring'
import type { Phrasebook } from '@/types/practical-english'

const group = definePhrasebook('health-and-emergencies')
export const healthAndEmergenciesPhrasebook = {
  situationId: 'health-and-emergencies',
  groups: [
    group('symptoms', 'Dizer como está se sentindo', [
      [
        'not-well',
        'I don’t feel well.',
        'Não estou me sentindo bem.',
        'Use para avisar que há algo errado sem precisar dar detalhes de imediato.',
      ],
      [
        'dizzy',
        'I feel dizzy.',
        'Estou com tontura.',
        'Use para descrever a sensação de tontura.',
      ],
      [
        'headache',
        'I have a headache.',
        'Estou com dor de cabeça.',
        'Use para nomear a dor em uma conversa.',
      ],
      [
        'knee-hurts',
        'My knee hurts.',
        'Meu joelho está doendo.',
        'Troque knee pela parte do corpo, como arm ou foot.',
      ],
    ]),
    group('help', 'Pedir ajuda', [
      [
        'need-help',
        'I need help.',
        'Preciso de ajuda.',
        'Use para chamar a atenção quando precisa de assistência.',
      ],
      [
        'stay-with-me',
        'Can you stay with me?',
        'Pode ficar comigo?',
        'Peça que a pessoa permaneça por perto.',
      ],
      [
        'call-friend',
        'Can you call my friend?',
        'Pode ligar para minha amiga ou meu amigo?',
        'Use quando quer que alguém ligue para uma pessoa conhecida.',
      ],
      [
        'repeat',
        'Can you repeat that, please?',
        'Pode repetir, por favor?',
        'Peça para ouvir de novo se não entendeu.',
      ],
    ]),
    group('location', 'Explicar onde você está', [
      [
        'main-entrance',
        'I’m at the main entrance.',
        'Estou na entrada principal.',
        'Diga qual entrada usar para encontrar você.',
      ],
      [
        'near-desk',
        'I’m near the information desk.',
        'Estou perto do balcão de informações.',
        'Use near para indicar um ponto de referência próximo.',
      ],
      [
        'in-front',
        'I’m in front of the library.',
        'Estou em frente à biblioteca.',
        'Use in front of para indicar que está diante de um local.',
      ],
    ]),
  ],
} satisfies Phrasebook
