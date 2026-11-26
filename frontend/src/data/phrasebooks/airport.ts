import type { Phrasebook } from '@/types/practical-english'
import { definePhrasebook } from './authoring'

const situationId = 'at-the-airport'
const group = definePhrasebook(situationId)

export const airportPhrasebook = {
  situationId,
  groups: [
    group('check-in-counter', 'Encontrar o balcão', [
      [
        'where-counter',
        'Where is the check-in counter?',
        'Onde fica o balcão de check-in?',
        'Use ao chegar ao terminal. Se necessário, diga também o nome da companhia aérea.',
        {
          keywords: ['balcão', 'terminal', 'companhia aérea'],
          related: ['check-in-here'],
        },
      ],
      [
        'check-in-here',
        'Can I check in here?',
        'Posso fazer o check-in aqui?',
        'Pergunte quando já estiver diante de um balcão e quiser confirmar que a fila é a certa.',
      ],
      [
        'flight-number',
        'My flight number is 205.',
        'Meu voo é o 205.',
        'Informe o número que aparece na passagem. Troque 205 pelo número do seu voo.',
      ],
    ]),
    group('documents', 'Apresentar documentos', [
      [
        'passport',
        'Here is my passport.',
        'Aqui está meu passaporte.',
        'Diga ao entregar o passaporte solicitado. “Here is” acompanha a entrega de um item.',
        { pronunciation: '/hɪr ɪz maɪ ˈpæs.pɔrt/', related: ['boarding-pass'] },
      ],
      [
        'boarding-pass',
        'Here is my boarding pass.',
        'Aqui está meu cartão de embarque.',
        'Use quando alguém pedir o cartão de embarque impresso ou digital.',
      ],
      [
        'id-enough',
        'Is this ID OK?',
        'Este documento serve?',
        'Mostre o documento ao perguntar se ele pode ser usado. A aceitação depende do local e da viagem.',
        { register: 'Pergunta direta', keywords: ['identidade', 'documento'] },
      ],
    ]),
    group('luggage', 'Despachar a bagagem', [
      [
        'check-bag',
        'I’d like to check this bag.',
        'Gostaria de despachar esta mala.',
        'Diga no balcão e indique a mala que vai despachar. Aqui, “check” quer dizer despachar.',
        { related: ['carry-on'] },
      ],
      [
        'carry-on',
        'Can I take this bag on the plane?',
        'Posso levar esta mala no avião?',
        'Use para perguntar se a mala pode ir com você na cabine.',
        { keywords: ['bagagem de mão', 'cabine'] },
      ],
      [
        'weigh-bag',
        'Where can I weigh my bag?',
        'Onde posso pesar minha mala?',
        'Pergunte quando precisar encontrar uma balança para conferir o peso da bagagem.',
        { keywords: ['balança', 'peso'] },
      ],
    ]),
    group('boarding', 'Encontrar o portão e embarcar', [
      [
        'where-gate',
        'Where is gate 12?',
        'Onde fica o portão 12?',
        'Substitua 12 pelo número mostrado no cartão de embarque ou no painel.',
        { keywords: ['portão de embarque', 'painel'] },
      ],
      [
        'boarding-time',
        'What time does boarding start?',
        'Que horas começa o embarque?',
        'Pergunte pelo início do embarque. O horário de embarque e o horário do voo podem ser diferentes.',
        { related: ['gate-change'] },
      ],
      [
        'gate-change',
        'Is gate 12 still the right gate?',
        'O portão 12 ainda é o portão certo?',
        'Use para confirmar o portão quando houver uma mudança no painel ou um novo aviso.',
      ],
    ]),
    group('help', 'Pedir ajuda', [
      [
        'help',
        'Excuse me. Can you help me?',
        'Com licença. Você pode me ajudar?',
        '“Excuse me” chama a atenção de alguém com educação antes de fazer o pedido.',
        {
          references: [
            { kind: 'vocabulary', vocabularyId: 'story-first-trip-excuse-me' },
          ],
          related: ['repeat'],
        },
      ],
      [
        'repeat',
        'Could you say that again, please?',
        'Pode repetir, por favor?',
        'Use quando uma informação passar rápido. “Could you” suaviza o pedido.',
        { register: 'Pedido cordial' },
      ],
      [
        'missed-flight',
        'I missed my flight. Where can I get help?',
        'Perdi meu voo. Onde posso procurar ajuda?',
        'Use para explicar o que aconteceu e ser encaminhado ao atendimento.',
      ],
    ]),
    group('immigration', 'Conversar na imigração', [
      [
        'vacation',
        'I’m here on vacation.',
        'Estou aqui de férias.',
        'Uma resposta curta sobre o motivo da visita, quando você realmente está viajando a lazer.',
        { keywords: ['turismo', 'motivo da viagem'] },
      ],
      [
        'stay',
        'I’m staying for one week.',
        'Vou ficar uma semana.',
        'Informe a duração real da visita. Troque “one week” pelo período da sua viagem.',
      ],
      [
        'hotel-address',
        'Here is the address of my hotel.',
        'Aqui está o endereço do meu hotel.',
        'Use ao apresentar o endereço da hospedagem, se a pessoa atendente pedir.',
      ],
    ]),
  ],
} satisfies Phrasebook
