import { defineDialogue } from './authoring'

export const hotelDialogues = [
  defineDialogue(
    'hotel-reservation',
    [
      'Informar que tem uma reserva e dizer em nome de quem está.',
      'Entender quando o quarto está pronto e pedir a chave.',
    ],
    [
      { id: 'guest', role: 'Hóspede' },
      { id: 'reception', role: 'Recepcionista' },
    ],
    [
      [
        'arrival',
        'guest',
        'Good afternoon. I have a reservation.',
        'Boa tarde. Tenho uma reserva.',
        ['have-reservation'],
      ],
      [
        'ask-name',
        'reception',
        'Welcome. What’s your name, please?',
        'Bem-vinda. Qual é o seu nome, por favor?',
      ],
      [
        'reservation',
        'guest',
        'The reservation is under the name Silva.',
        'A reserva está no nome de Silva.',
        ['reservation-name'],
      ],
      [
        'confirmation',
        'reception',
        'Thank you. Can I see your booking confirmation?',
        'Obrigada. Posso ver a confirmação da reserva?',
      ],
      [
        'show-confirmation',
        'guest',
        'Of course. Here is my booking confirmation.',
        'Claro. Aqui está a confirmação da minha reserva.',
        ['show-confirmation'],
      ],
      [
        'nights',
        'reception',
        'I see it here. Two nights, right?',
        'Encontrei aqui. São duas noites, certo?',
      ],
      [
        'ask-room',
        'guest',
        'Yes. Is my room ready?',
        'Sim. Meu quarto já está pronto?',
        ['room-ready'],
      ],
      [
        'room-number',
        'reception',
        'Yes. You’re in room 204.',
        'Sim. Você vai ficar no quarto 204.',
      ],
      [
        'ask-key',
        'guest',
        'Can I have the room key, please?',
        'Pode me dar a chave do quarto, por favor?',
        ['room-key'],
      ],
      [
        'give-key',
        'reception',
        'Here’s your key card. Enjoy your stay!',
        'Aqui está seu cartão do quarto. Boa estadia!',
      ],
    ],
    [
      [
        'initial-reservation',
        '“I have a reservation” abre a conversa. “Under the name” informa em nome de quem está a reserva.',
        ['have-reservation', 'reservation-name'],
      ],
      [
        'counting-nights',
        '“Two nights” são duas noites. Em “Two nights, right?”, a recepcionista está confirmando a informação.',
      ],
      [
        'key-card',
        '“Room key” funciona como pedido geral. “Key card” é a chave eletrônica em formato de cartão.',
        ['room-key'],
      ],
    ],
  ),
  defineDialogue(
    'hotel-reception-info',
    [
      'Perguntar o horário e o local do café da manhã.',
      'Pedir a senha do Wi-Fi e confirmar onde encontrá-la.',
    ],
    [
      { id: 'guest', role: 'Hóspede' },
      { id: 'reception', role: 'Recepcionista' },
    ],
    [
      [
        'start',
        'guest',
        'Good evening. What time is breakfast?',
        'Boa noite. Qual é o horário do café da manhã?',
        ['breakfast-time'],
      ],
      ['times', 'reception', 'From seven to ten.', 'Das sete às dez.'],
      [
        'included',
        'guest',
        'Is breakfast included?',
        'O café da manhã está incluído?',
        ['breakfast-included'],
      ],
      ['included-answer', 'reception', 'Yes, it is.', 'Sim, está.'],
      [
        'where',
        'guest',
        'Where is breakfast served?',
        'Onde é servido o café da manhã?',
        ['breakfast-place'],
      ],
      [
        'restaurant',
        'reception',
        'In the restaurant, next to the lobby.',
        'No restaurante, ao lado do saguão.',
      ],
      [
        'wifi',
        'guest',
        'Thanks. What’s the Wi-Fi password?',
        'Obrigado. Qual é a senha do Wi-Fi?',
        ['wifi'],
      ],
      [
        'card',
        'reception',
        'It’s on this card, under the network name.',
        'Está neste cartão, abaixo do nome da rede.',
      ],
      [
        'check-location',
        'guest',
        'Here, on the second line?',
        'Aqui, na segunda linha?',
      ],
      ['confirmation', 'reception', 'Yes, that’s it.', 'Sim, é isso mesmo.'],
    ],
    [
      [
        'breakfast-questions',
        '“What time” pergunta pelo horário. “Where” pergunta pelo local. “Is breakfast included?” confirma se a refeição está incluída.',
        ['breakfast-time', 'breakfast-place', 'breakfast-included'],
      ],
      [
        'next-to',
        '“Next to” quer dizer “ao lado de”. “Lobby” é o saguão de entrada.',
      ],
      [
        'confirming',
        'Uma pergunta curta como “Here, on the second line?” ajuda a confirmar se você entendeu a indicação.',
      ],
    ],
  ),
] as const
