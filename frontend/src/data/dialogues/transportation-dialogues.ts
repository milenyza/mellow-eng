import { defineDialogue } from './authoring'

export const transportationDialogues = [
  defineDialogue(
    'ticket-window',
    ['Pedir uma passagem só de ida.', 'Confirmar horário e plataforma.'],
    [
      { id: 'passenger', role: 'Passageira' },
      { id: 'worker', role: 'Atendente da bilheteria' },
    ],
    [
      [
        'ticket',
        'passenger',
        'Hi. One ticket to Riverside, please.',
        'Olá. Uma passagem para Riverside, por favor.',
        ['ticket-to'],
      ],
      [
        'type',
        'worker',
        'One way or round trip?',
        'Só de ida ou de ida e volta?',
        ['one-way', 'round-trip'],
      ],
      [
        'one-way',
        'passenger',
        'One way, please.',
        'Só de ida, por favor.',
        ['one-way'],
      ],
      ['price', 'worker', 'That’s six dollars.', 'São seis dólares.'],
      [
        'time',
        'passenger',
        'Here you go. What time is the next train?',
        'Aqui está. Que horas sai o próximo trem?',
        ['next-train'],
      ],
      ['departure', 'worker', 'It leaves at eleven.', 'Sai às onze.'],
      [
        'platform',
        'passenger',
        'Which platform is it?',
        'Qual é a plataforma?',
        ['platform'],
      ],
      ['number', 'worker', 'Platform three.', 'Plataforma três.'],
      [
        'thanks',
        'passenger',
        'Platform three. Thank you.',
        'Plataforma três. Obrigada.',
      ],
      [
        'goodbye',
        'worker',
        'You’re welcome. Have a good trip!',
        'De nada. Boa viagem!',
      ],
    ],
    [
      [
        'destination',
        'Em “a ticket to Riverside”, “to” indica o destino da viagem.',
        ['ticket-to'],
      ],
      [
        'direction',
        '“One way” compra apenas a ida. “Round trip” inclui a volta.',
        ['one-way', 'round-trip'],
      ],
      [
        'leave',
        'Em horários de transporte, “it leaves at eleven” significa que o trem sai às onze.',
        ['next-train'],
      ],
    ],
  ),
  defineDialogue(
    'bus-to-the-library',
    [
      'Confirmar se a linha passa no destino.',
      'Pedir um aviso antes de descer.',
    ],
    [
      { id: 'passenger', role: 'Passageiro' },
      { id: 'worker', role: 'Motorista' },
    ],
    [
      [
        'destination',
        'passenger',
        'Hi. Does this bus go to the library?',
        'Olá. Este ônibus vai até a biblioteca?',
        ['go-to'],
      ],
      [
        'route',
        'worker',
        'Yes, it does. It goes right past it.',
        'Sim. Ele passa bem na frente.',
      ],
      [
        'stop',
        'passenger',
        'Where do I get off?',
        'Onde eu desço?',
        ['get-off'],
      ],
      ['main', 'worker', 'Get off at Main Street.', 'Desça na Main Street.'],
      [
        'ask',
        'passenger',
        'Can you tell me when we get there?',
        'Pode me avisar quando chegarmos?',
        ['tell-me'],
      ],
      ['yes', 'worker', 'Sure. I’ll tell you.', 'Claro. Eu aviso.'],
      [
        'here',
        'passenger',
        'Is this the right stop?',
        'Este é o ponto certo?',
        ['right-stop'],
      ],
      [
        'next',
        'worker',
        'Not yet. Main Street is next.',
        'Ainda não. A Main Street é a próxima.',
      ],
      ['thanks', 'passenger', 'Okay, thank you.', 'Certo, obrigado.'],
      [
        'arrive',
        'worker',
        'Here we are. This is Main Street.',
        'Chegamos. Esta é a Main Street.',
      ],
    ],
    [
      [
        'route',
        '“Does this bus go to” ajuda a conferir a rota com o motorista.',
        ['go-to'],
      ],
      ['exit', '“Get off” é descer ou sair de um ônibus ou trem.', ['get-off']],
      [
        'next',
        '“Next” indica que o ponto procurado vem logo depois do ponto atual.',
        ['tell-me', 'right-stop'],
      ],
    ],
  ),
] as const
