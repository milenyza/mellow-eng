import { definePhrasebook } from './authoring'
import type { Phrasebook } from '@/types/practical-english'

const group = definePhrasebook('around-the-city')
export const aroundTheCityPhrasebook = {
  situationId: 'around-the-city',
  groups: [
    group('asking', 'Pedir direções', [
      [
        'museum',
        'How do I get to the museum?',
        'Como chego ao museu?',
        'Troque museum pelo lugar que está procurando.',
      ],
      [
        'find',
        'I’m looking for the post office.',
        'Estou procurando o correio.',
        'Diga qual lugar procura para abrir a conversa.',
      ],
      [
        'far',
        'Is it far from here?',
        'Fica longe daqui?',
        'Pergunte se o trajeto é longo.',
      ],
      [
        'walk',
        'Can I walk there?',
        'Dá para ir a pé?',
        'Confirme se vale fazer o trajeto caminhando.',
      ],
    ]),
    group('directions', 'Entender instruções', [
      [
        'straight',
        'Go straight.',
        'Siga em frente.',
        'Indica que você continua no mesmo sentido.',
      ],
      [
        'left',
        'Turn left at the corner.',
        'Vire à esquerda na esquina.',
        'Mostra o sentido da curva e onde fazê-la.',
      ],
      [
        'right',
        'Turn right after the park.',
        'Vire à direita depois do parque.',
        'Entenda que a curva acontece após passar pelo parque.',
      ],
      [
        'next-to',
        'It’s next to the bank.',
        'Fica ao lado do banco.',
        'Use como referência um prédio vizinho.',
      ],
    ]),
    group('checking', 'Confirmar o caminho', [
      [
        'which-way',
        'Which way do I turn?',
        'Para que lado eu viro?',
        'Pergunte o sentido da curva se a indicação ficou vaga.',
      ],
      [
        'this-corner',
        'At this corner?',
        'Nesta esquina?',
        'Aponte para a esquina em dúvida.',
      ],
      [
        'before-after',
        'Before or after the park?',
        'Antes ou depois do parque?',
        'Use para conferir em que ponto do caminho deve virar.',
      ],
    ]),
  ],
} satisfies Phrasebook
