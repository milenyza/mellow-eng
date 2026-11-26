import { defineDialogue } from './authoring'

export const aroundTheCityDialogues = [
  defineDialogue(
    'finding-the-museum',
    [
      'Pedir direções e confirmar se é perto.',
      'Identificar um prédio vizinho ao destino.',
    ],
    [
      { id: 'visitor', role: 'Visitante' },
      { id: 'local', role: 'Moradora' },
    ],
    [
      [
        'ask',
        'visitor',
        'Excuse me. How do I get to the museum?',
        'Com licença. Como chego ao museu?',
        ['museum'],
      ],
      [
        'distance',
        'local',
        'Go straight for two blocks.',
        'Siga em frente por dois quarteirões.',
        ['straight'],
      ],
      ['corner', 'visitor', 'Then do I turn left?', 'Depois viro à esquerda?'],
      [
        'turn',
        'local',
        'Yes. Turn left at the corner.',
        'Sim. Vire à esquerda na esquina.',
        ['left'],
      ],
      [
        'landmark',
        'visitor',
        'Is the museum next to the bank?',
        'O museu fica ao lado do banco?',
        ['next-to'],
      ],
      [
        'yes',
        'local',
        'Yes. It’s a large white building.',
        'Sim. É um prédio grande e branco.',
      ],
      ['far', 'visitor', 'Is it far from here?', 'Fica longe daqui?', ['far']],
      [
        'time',
        'local',
        'No. It’s about five minutes on foot.',
        'Não. São uns cinco minutos a pé.',
        ['walk'],
      ],
      [
        'thanks',
        'visitor',
        'Great. Thank you for your help.',
        'Ótimo. Obrigada pela ajuda.',
      ],
      [
        'bye',
        'local',
        'You’re welcome. Enjoy the museum!',
        'De nada. Aproveite o museu!',
      ],
    ],
    [
      [
        'walking',
        '“How do I get to” pede orientações para chegar ao lugar mencionado.',
        ['museum'],
      ],
      [
        'blocks',
        '“Two blocks” são dois quarteirões. “Go straight” indica que não é para virar ainda.',
        ['straight'],
      ],
      [
        'reference',
        'Use “next to” para confirmar o que fica ao lado do destino.',
        ['next-to'],
      ],
    ],
  ),
  defineDialogue(
    'confirming-the-turn',
    [
      'Conferir o sentido de uma curva.',
      'Distinguir antes e depois de um ponto de referência.',
    ],
    [
      { id: 'visitor', role: 'Visitante' },
      { id: 'local', role: 'Moradora' },
    ],
    [
      [
        'post',
        'visitor',
        'Hi. I’m looking for the post office.',
        'Oi. Estou procurando o correio.',
        ['find'],
      ],
      [
        'corner',
        'local',
        'Go to the corner and turn.',
        'Vá até a esquina e vire.',
      ],
      [
        'direction',
        'visitor',
        'Which way do I turn?',
        'Para que lado eu viro?',
        ['which-way'],
      ],
      [
        'right',
        'local',
        'Turn right after the park.',
        'Vire à direita depois do parque.',
        ['right'],
      ],
      [
        'check',
        'visitor',
        'After the park, right?',
        'Depois do parque, certo?',
        ['before-after'],
      ],
      [
        'yes',
        'local',
        'Yes. The post office is on your left.',
        'Sim. O correio fica à sua esquerda.',
      ],
      ['walk', 'visitor', 'Can I walk there?', 'Dá para ir a pé?', ['walk']],
      [
        'time',
        'local',
        'Yes. It’s about three minutes from here.',
        'Sim. Fica a uns três minutos daqui.',
      ],
      [
        'thanks',
        'visitor',
        'That’s close. Thanks for your help.',
        'É perto. Obrigado pela ajuda.',
      ],
      ['bye', 'local', 'You’re welcome.', 'De nada.'],
    ],
    [
      [
        'post',
        '“I’m looking for” apresenta o lugar que você procura.',
        ['find'],
      ],
      [
        'right',
        '“Turn right” indica uma curva. “On your left” descreve onde algo fica em relação a você.',
        ['right'],
      ],
      [
        'after',
        '“After” indica depois de passar pela referência. “Before” indica antes dela.',
        ['before-after'],
      ],
    ],
  ),
] as const
