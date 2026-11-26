import { definePhrasebook } from './authoring'
import type { Phrasebook } from '@/types/practical-english'

const group = definePhrasebook('getting-around')
export const transportationPhrasebook = {
  situationId: 'getting-around',
  groups: [
    group('tickets', 'Pedir uma passagem', [
      [
        'ticket-to',
        'One ticket to Riverside, please.',
        'Uma passagem para Riverside, por favor.',
        'Troque Riverside pelo nome do seu destino.',
      ],
      [
        'one-way',
        'One way, please.',
        'Só de ida, por favor.',
        'Use para indicar que não precisa da volta.',
      ],
      [
        'round-trip',
        'A round-trip ticket, please.',
        'Uma passagem de ida e volta, por favor.',
        'Use para comprar ida e volta juntas.',
      ],
      [
        'return-time',
        'What time is the last train back?',
        'Que horas sai o último trem de volta?',
        'Pergunte para planejar seu retorno.',
      ],
    ]),
    group('boarding', 'Confirmar a saída e o embarque', [
      [
        'next-train',
        'What time is the next train?',
        'Que horas sai o próximo trem?',
        'Pergunte pelo horário da próxima saída.',
      ],
      [
        'platform',
        'Which platform is it?',
        'Qual é a plataforma?',
        'Use após identificar o trem.',
      ],
      [
        'go-to',
        'Does this bus go to the library?',
        'Este ônibus vai até a biblioteca?',
        'Confirme o destino antes de subir.',
      ],
      [
        'bus-number',
        'Which bus do I take?',
        'Qual ônibus eu pego?',
        'Peça o número ou a linha do ônibus.',
      ],
    ]),
    group('stops', 'Reconhecer a parada certa', [
      [
        'get-off',
        'Where do I get off?',
        'Onde eu desço?',
        'Pergunte qual é a parada para descer.',
      ],
      [
        'tell-me',
        'Can you tell me when we get there?',
        'Pode me avisar quando chegarmos?',
        'Peça um aviso ao se aproximar do destino.',
      ],
      [
        'right-stop',
        'Is this the right stop?',
        'Este é o ponto certo?',
        'Confirme o ponto antes de embarcar ou descer.',
      ],
    ]),
  ],
} satisfies Phrasebook
