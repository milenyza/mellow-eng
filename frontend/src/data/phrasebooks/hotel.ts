import type { Phrasebook } from '@/types/practical-english'
import { definePhrasebook } from './authoring'

const situationId = 'at-the-hotel'
const group = definePhrasebook(situationId)

export const hotelPhrasebook = {
  situationId,
  groups: [
    group('reservation', 'Confirmar a reserva', [
      [
        'have-reservation',
        'I have a reservation.',
        'Tenho uma reserva.',
        'Use para iniciar a conversa na recepção. Em seguida, informe o nome da reserva.',
        { keywords: ['reserva', 'recepção'], related: ['reservation-name'] },
      ],
      [
        'reservation-name',
        'The reservation is under the name Silva.',
        'A reserva está no nome de Silva.',
        'Troque Silva pelo nome cadastrado. “Under the name” indica em nome de quem está a reserva.',
      ],
      [
        'show-confirmation',
        'Here is my booking confirmation.',
        'Aqui está a confirmação da minha reserva.',
        'Use ao mostrar a confirmação pelo celular ou em papel.',
        { register: '“Booking” é comum em reservas de viagem.' },
      ],
    ]),
    group('arrival', 'Fazer o check-in', [
      [
        'check-in',
        'I’d like to check in, please.',
        'Gostaria de fazer o check-in, por favor.',
        'Use na recepção para dizer que chegou e quer dar entrada.',
        { pronunciation: '/aɪd laɪk tə tʃek ɪn pliːz/' },
      ],
      [
        'room-ready',
        'Is my room ready?',
        'Meu quarto já está pronto?',
        'Pergunte principalmente se chegou antes do horário previsto.',
      ],
      [
        'room-key',
        'Can I have the room key, please?',
        'Pode me dar a chave do quarto, por favor?',
        'Use quando o quarto estiver liberado. Para um cartão, você também pode dizer “key card”.',
      ],
    ]),
    group('breakfast', 'Perguntar sobre o café da manhã', [
      [
        'breakfast-time',
        'What time is breakfast?',
        'Qual é o horário do café da manhã?',
        'Pergunte pelo horário em que o hotel serve a refeição.',
        {
          keywords: ['cafe da manha', 'horário'],
          related: ['breakfast-place', 'breakfast-included'],
        },
      ],
      [
        'breakfast-included',
        'Is breakfast included?',
        'O café da manhã está incluído?',
        'Use para confirmar se a refeição já faz parte da diária.',
      ],
      [
        'breakfast-place',
        'Where is breakfast served?',
        'Onde é servido o café da manhã?',
        'Pergunte qual é a sala ou o local da refeição.',
      ],
    ]),
    group('assistance', 'Pedir assistência', [
      [
        'extra-towel',
        'Could I have an extra towel, please?',
        'Pode me trazer mais uma toalha, por favor?',
        'Peça uma toalha adicional na recepção ou à equipe de limpeza.',
        { register: 'Pedido cordial' },
      ],
      [
        'key-not-working',
        'My key card doesn’t work.',
        'Meu cartão do quarto não funciona.',
        'Use quando o cartão não abrir a porta. Dizer o problema já ajuda a equipe a entender o pedido.',
      ],
      [
        'help-bags',
        'Can you help me with my bags?',
        'Pode me ajudar com as malas?',
        'Peça ajuda para carregar a bagagem ou levá-la até o quarto.',
      ],
    ]),
    group('facilities', 'Consultar os serviços do quarto', [
      [
        'wifi',
        'What’s the Wi-Fi password?',
        'Qual é a senha do Wi-Fi?',
        'Use ao conectar o celular ou computador à rede do hotel.',
        { keywords: ['internet', 'rede', 'senha'] },
      ],
      [
        'hair-dryer',
        'Is there a hair dryer in the room?',
        'Tem secador de cabelo no quarto?',
        'Use “Is there” para verificar se há um item no quarto.',
        { keywords: ['secador', 'banheiro'] },
      ],
      [
        'air-conditioning',
        'Does the room have air conditioning?',
        'O quarto tem ar-condicionado?',
        'Use para confirmar se o quarto tem esse equipamento, antes ou depois da chegada.',
      ],
    ]),
    group('departure', 'Fazer o check-out', [
      [
        'check-out-time',
        'What time is check-out?',
        'Qual é o horário do check-out?',
        'Confirme até que horas precisa liberar o quarto.',
        { related: ['check-out'] },
      ],
      [
        'check-out',
        'I’d like to check out, please.',
        'Gostaria de fazer o check-out, por favor.',
        'Diga na recepção quando estiver pronto para encerrar a estadia.',
      ],
      [
        'late-check-out',
        'May I check out at noon?',
        'Posso fazer o check-out ao meio-dia?',
        'Peça autorização para sair ao meio-dia. “May I” é um pouco mais formal que “Can I”.',
        { formality: 'formal', related: ['check-out-time'] },
      ],
      [
        'receipt',
        'Can I have a receipt, please?',
        'Pode me dar um recibo, por favor?',
        'Peça um comprovante depois do pagamento. “Receipt” é o recibo.',
      ],
    ]),
  ],
} satisfies Phrasebook
