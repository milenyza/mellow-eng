import { defineDialogue } from './authoring'

export const healthAndEmergenciesDialogues = [
  defineDialogue(
    'asking-for-help',
    [
      'Comunicar um mal-estar em frases curtas.',
      'Pedir companhia e ajuda para entrar em contato com alguém.',
    ],
    [
      { id: 'caller', role: 'Pessoa pedindo ajuda' },
      { id: 'helper', role: 'Pessoa que se oferece para ajudar' },
    ],
    [
      [
        'help',
        'caller',
        'Excuse me. I need help.',
        'Com licença. Preciso de ajuda.',
        ['need-help'],
      ],
      ['okay', 'helper', 'Of course. Are you okay?', 'Claro. Você está bem?'],
      [
        'dizzy',
        'caller',
        'I don’t feel well. I feel dizzy.',
        'Não estou me sentindo bem. Estou com tontura.',
        ['not-well', 'dizzy'],
      ],
      [
        'together',
        'helper',
        'I’m here with you. What do you need?',
        'Estou aqui com você. Do que você precisa?',
      ],
      [
        'stay',
        'caller',
        'Can you stay with me, please?',
        'Pode ficar comigo, por favor?',
        ['stay-with-me'],
      ],
      [
        'yes',
        'helper',
        'Yes. Is someone here with you?',
        'Sim. Tem alguém aqui com você?',
      ],
      [
        'call',
        'caller',
        'No. Can you call my friend?',
        'Não. Pode ligar para minha amiga?',
        ['call-friend'],
      ],
      [
        'number',
        'helper',
        'Sure. What’s her number?',
        'Claro. Qual é o número dela?',
      ],
      [
        'screen',
        'caller',
        'It’s on my phone. Here it is.',
        'Está no meu celular. Aqui está.',
      ],
      [
        'calling',
        'helper',
        'Thanks. I’ll call her now.',
        'Obrigada. Vou ligar para ela agora.',
      ],
    ],
    [
      [
        'feel',
        '“I don’t feel well” comunica um mal-estar de forma geral. “I feel dizzy” dá um detalhe.',
        ['not-well', 'dizzy'],
      ],
      [
        'stay',
        '“Can you stay with me?” pede companhia à pessoa que está perto.',
        ['stay-with-me'],
      ],
      [
        'her',
        'Em “I’ll call her”, “her” substitui o nome da amiga que receberá a ligação.',
        ['call-friend'],
      ],
    ],
  ),
  defineDialogue(
    'meeting-at-the-entrance',
    [
      'Nomear uma entrada e um ponto de referência.',
      'Pedir repetição e confirmar o ponto de encontro.',
    ],
    [
      { id: 'caller', role: 'Pessoa pedindo ajuda' },
      { id: 'helper', role: 'Funcionário do prédio' },
    ],
    [
      [
        'start',
        'caller',
        'Hello. I need help.',
        'Olá. Preciso de ajuda.',
        ['need-help'],
      ],
      [
        'where',
        'helper',
        'Of course. Where are you?',
        'Claro. Onde você está?',
      ],
      [
        'entrance',
        'caller',
        'I’m at the main entrance.',
        'Estou na entrada principal.',
        ['main-entrance'],
      ],
      [
        'outside',
        'helper',
        'Are you inside or outside?',
        'Você está dentro ou fora?',
      ],
      [
        'desk',
        'caller',
        'I’m inside, near the information desk.',
        'Estou dentro, perto do balcão de informações.',
        ['near-desk'],
      ],
      [
        'meet',
        'helper',
        'Okay. Wait by the desk, please.',
        'Certo. Espere perto do balcão, por favor.',
      ],
      [
        'repeat',
        'caller',
        'Can you repeat that, please?',
        'Pode repetir, por favor?',
        ['repeat'],
      ],
      [
        'wait',
        'helper',
        'Yes. Please wait by the information desk.',
        'Sim. Por favor, espere perto do balcão de informações.',
      ],
      [
        'confirm',
        'caller',
        'Okay. I’m by the desk now.',
        'Certo. Estou perto do balcão agora.',
        ['near-desk'],
      ],
      [
        'going',
        'helper',
        'Thanks. I’ll meet you there.',
        'Obrigado. Vou encontrar você aí.',
      ],
    ],
    [
      [
        'place',
        'Use “at” em “at the main entrance” para indicar o local onde você está.',
        ['main-entrance'],
      ],
      [
        'close',
        '“Near the desk” e “by the desk” indicam proximidade. “Inside” esclarece de que lado da entrada você está.',
        ['near-desk'],
      ],
      [
        'clarify',
        '“Can you repeat that, please?” ajuda a confirmar o que foi dito na ligação.',
        ['repeat'],
      ],
    ],
  ),
] as const
