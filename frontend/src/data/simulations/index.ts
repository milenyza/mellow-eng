import type { SimulationSummary } from '@/types/conversation'

export const simulationSummaries = [
  {
    id: 'flight-check-in',
    situationId: 'at-the-airport',
    title: 'Check-in para o voo',
    context:
      'No balcão, você precisa apresentar os documentos, despachar uma mala e confirmar onde vai embarcar.',
    goal: 'Concluir o check-in e confirmar o portão.',
    level: 'A1',
    objectives: [
      'Apresentar o passaporte e informar o voo.',
      'Pedir para despachar uma mala e confirmar o portão.',
    ],
    dialogueId: 'flight-check-in',
  },
  {
    id: 'find-the-gate',
    situationId: 'at-the-airport',
    title: 'Pedindo direções até o portão',
    context:
      'O painel mostrou uma mudança de portão. Você se aproxima de uma pessoa da equipe com o cartão de embarque na mão.',
    goal: 'Confirmar o novo portão e descobrir como chegar até ele.',
    level: 'A1',
    objectives: [
      'Pedir orientação com educação.',
      'Confirmar o portão e o início do embarque.',
    ],
    dialogueId: 'boarding-gate',
    outlineId: 'find-the-gate',
  },
  {
    id: 'check-in-at-reception',
    situationId: 'at-the-hotel',
    title: 'Chegando ao hotel',
    context:
      'Você tem uma reserva no nome de Silva. Na recepção, pode apresentar a confirmação ou começar pelo seu nome.',
    goal: 'Localizar a reserva e receber a chave.',
    level: 'A1',
    objectives: [
      'Informar que tem uma reserva.',
      'Confirmar se o quarto está pronto e pedir a chave.',
    ],
    dialogueId: 'hotel-reservation',
    outlineId: 'check-in-at-reception',
  },
  {
    id: 'reception-information',
    situationId: 'at-the-hotel',
    title: 'Pedindo ajuda na recepção',
    context:
      'Você está no quarto 204. Antes de subir, quer perguntar sobre o café da manhã ou o Wi-Fi e pedir uma toalha extra.',
    goal: 'Obter uma informação e solicitar uma toalha.',
    level: 'A1',
    objectives: [
      'Pedir informações sobre o café da manhã ou o Wi-Fi.',
      'Pedir uma toalha e confirmar o número do quarto.',
    ],
    dialogueId: 'hotel-reception-info',
    outlineId: 'check-breakfast-time',
  },
  {
    id: 'restaurant-meal',
    situationId: 'restaurants-and-coffee-shops',
    title: 'Pedindo uma refeição',
    context:
      'Você e outra pessoa chegam a um restaurante. Há mesas dentro e do lado de fora. Você quer comer e pedir a conta no fim.',
    goal: 'Escolher onde sentar, fazer o pedido e pedir a conta.',
    level: 'A1',
    objectives: [
      'Pedir uma mesa e o cardápio.',
      'Pedir uma refeição e a conta com educação.',
    ],
    dialogueId: 'restaurant-meal',
    outlineId: 'ask-for-the-bill',
  },
  {
    id: 'order-at-the-counter',
    situationId: 'restaurants-and-coffee-shops',
    title: 'Pedindo um café para levar',
    context:
      'Você para em uma cafeteria antes de sair. Pode escolher o tamanho do café e quer pagar com cartão.',
    goal: 'Pedir um café para levar e confirmar o pagamento.',
    level: 'A1',
    objectives: [
      'Pedir café e escolher um tamanho.',
      'Indicar que é para levar e perguntar sobre pagamento com cartão.',
    ],
    dialogueId: 'coffee-to-go',
    outlineId: 'order-at-the-counter',
  },
] as const satisfies readonly SimulationSummary[]
