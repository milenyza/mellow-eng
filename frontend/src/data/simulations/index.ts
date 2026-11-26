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
  {
    id: 'ask-the-price',
    situationId: 'shopping',
    level: 'A1',
    title: 'Descobrir o preço de um caderno',
    context:
      'Você quer um caderno por no máximo seis dólares. Um está sem etiqueta e há outros em promoção.',
    goal: 'Encontrar um caderno dentro do orçamento e confirmar a compra.',
    objectives: [
      'Perguntar preço ou desconto.',
      'Confirmar a opção escolhida e pedir o comprovante.',
    ],
    dialogueId: 'price-at-the-shop',
    outlineId: 'ask-the-price',
  },
  {
    id: 'ask-for-a-size',
    situationId: 'shopping',
    level: 'A1',
    title: 'Encontrar uma jaqueta que sirva',
    context:
      'Uma jaqueta P ficou apertada. Você pode pedir o tamanho M ou perguntar se há uma peça maior. Quer provar antes de comprar.',
    goal: 'Encontrar a jaqueta no tamanho certo e provar a peça.',
    objectives: [
      'Pedir outro tamanho com educação.',
      'Usar o provador e decidir depois da prova.',
    ],
    dialogueId: 'trying-a-shirt',
    outlineId: 'ask-for-a-size',
  },
  {
    id: 'buy-a-ticket',
    situationId: 'getting-around',
    level: 'A1',
    title: 'Comprar uma passagem de trem',
    context:
      'Você vai para Brookfield. Ainda não decidiu se volta de trem. Há passagem só de ida ou ida e volta.',
    goal: 'Pedir uma passagem e confirmar quando e onde embarcar.',
    objectives: [
      'Informar o destino e escolher o tipo de passagem.',
      'Confirmar horário e plataforma.',
    ],
    dialogueId: 'ticket-window',
    outlineId: 'buy-a-ticket',
  },
  {
    id: 'confirm-the-stop',
    situationId: 'getting-around',
    level: 'A1',
    title: 'Encontrar a linha para o parque',
    context:
      'Você está no ponto e quer ir ao parque. O ônibus 8 acaba de chegar. Pode perguntar pelo destino ou pela linha.',
    goal: 'Confirmar o ônibus para o parque e pedir ajuda para descer.',
    objectives: [
      'Confirmar a linha antes de embarcar.',
      'Entender quando descer e pedir aviso.',
    ],
    dialogueId: 'bus-to-the-library',
    outlineId: 'confirm-the-stop',
  },
  {
    id: 'meet-a-classmate',
    situationId: 'meeting-people',
    level: 'A1',
    title: 'Conhecer alguém antes da aula',
    context:
      'Você é Nina e chega para a primeira aula. Há uma cadeira livre ao lado de uma colega. Você pode se apresentar ou perguntar pelo lugar primeiro.',
    goal: 'Sentar e trocar nomes com uma colega.',
    objectives: [
      'Cumprimentar e se apresentar.',
      'Confirmar se é a primeira aula e responder com gentileza.',
    ],
    dialogueId: 'first-english-class',
    outlineId: 'meet-a-classmate',
  },
  {
    id: 'talk-about-origins',
    situationId: 'meeting-people',
    level: 'A1',
    title: 'Conversar depois de uma oficina',
    context:
      'Você veio do Brasil e está na cidade só para o fim de semana. Durante uma conversa, pode perguntar de onde Ben é ou se ele mora na cidade.',
    goal: 'Trocar informações sobre origem e visita.',
    objectives: [
      'Distinguir onde a pessoa mora de onde ela é.',
      'Explicar que está na cidade por pouco tempo.',
    ],
    dialogueId: 'where-we-are-from',
    outlineId: 'talk-about-origins',
  },
  {
    id: 'say-how-you-feel',
    situationId: 'health-and-emergencies',
    level: 'A1',
    title: 'Explicar um mal-estar',
    context:
      'Você está em uma feira, sente tontura e está sem companhia. Uma pessoa percebe e oferece ajuda.',
    goal: 'Dizer como está se sentindo e pedir ajuda para ligar para alguém.',
    objectives: [
      'Comunicar um mal-estar e pedir companhia.',
      'Pedir uma ligação e indicar onde está o número.',
    ],
    dialogueId: 'asking-for-help',
    outlineId: 'say-how-you-feel',
  },
  {
    id: 'give-your-location',
    situationId: 'health-and-emergencies',
    level: 'A1',
    title: 'Combinar onde receber ajuda',
    context:
      'Você precisa de ajuda e liga para uma funcionária. Está do lado de fora da biblioteca, perto da entrada principal.',
    goal: 'Indicar um local exato para que a pessoa encontre você.',
    objectives: [
      'Usar um ponto de referência para dizer onde está.',
      'Confirmar a entrada e o ponto de encontro.',
    ],
    dialogueId: 'meeting-at-the-entrance',
    outlineId: 'give-your-location',
  },
  {
    id: 'find-a-place',
    situationId: 'around-the-city',
    level: 'A1',
    title: 'Chegar à biblioteca a pé',
    context:
      'Você quer visitar a biblioteca e está a poucos quarteirões dela. Pode pedir o caminho ou começar perguntando se dá para ir a pé.',
    goal: 'Obter um caminho a pé e reconhecer o prédio certo.',
    objectives: [
      'Pedir direções para um lugar.',
      'Confirmar o ponto de referência indicado.',
    ],
    dialogueId: 'finding-the-museum',
    outlineId: 'find-a-place',
  },
  {
    id: 'confirm-a-direction',
    situationId: 'around-the-city',
    level: 'A1',
    title: 'Conferir a curva para a farmácia',
    context:
      'Uma pessoa indica uma curva perto do parque. Você quer chegar à farmácia e precisa confirmar o lado e a esquina.',
    goal: 'Confirmar onde e para que lado virar.',
    objectives: [
      'Esclarecer uma indicação incompleta.',
      'Distinguir o ponto da curva da localização da farmácia.',
    ],
    dialogueId: 'confirming-the-turn',
    outlineId: 'confirm-a-direction',
  },
] as const satisfies readonly SimulationSummary[]
