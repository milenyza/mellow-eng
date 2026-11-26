import type { DialogueSummary } from '@/types/practical-english'

export const dialogueSummaries = [
  {
    id: 'flight-check-in',
    situationId: 'at-the-airport',
    level: 'A1',
    title: 'Check-in para o voo',
    englishTitle: 'Checking in for a flight',
    context:
      'Uma pessoa chega ao balcão da companhia aérea para apresentar os documentos e despachar uma mala.',
  },
  {
    id: 'boarding-gate',
    situationId: 'at-the-airport',
    level: 'A1',
    scenarioId: 'find-the-gate',
    title: 'Onde fica o portão?',
    englishTitle: 'Finding the boarding gate',
    context:
      'O portão mudou no painel. Uma pessoa pergunta à equipe do aeroporto onde embarcar.',
  },
  {
    id: 'hotel-reservation',
    situationId: 'at-the-hotel',
    level: 'A1',
    scenarioId: 'check-in-at-reception',
    title: 'Chegada com reserva',
    englishTitle: 'Checking in with a reservation',
    context:
      'Uma hóspede chega à recepção e confirma a reserva antes de pegar a chave do quarto.',
  },
  {
    id: 'hotel-reception-info',
    situationId: 'at-the-hotel',
    level: 'A1',
    scenarioId: 'check-breakfast-time',
    title: 'Informações na recepção',
    englishTitle: 'Asking for information at reception',
    context:
      'Um hóspede quer saber onde tomar café da manhã e como se conectar ao Wi-Fi.',
  },
  {
    id: 'restaurant-meal',
    situationId: 'restaurants-and-coffee-shops',
    level: 'A1',
    scenarioId: 'ask-for-the-bill',
    title: 'Uma refeição no restaurante',
    englishTitle: 'Ordering a meal',
    context:
      'Duas pessoas chegam juntas a um restaurante. Uma delas pede a mesa, faz o pedido e conversa com o atendimento.',
  },
  {
    id: 'coffee-to-go',
    situationId: 'restaurants-and-coffee-shops',
    level: 'A1',
    scenarioId: 'order-at-the-counter',
    title: 'Um café para levar',
    englishTitle: 'Ordering coffee to go',
    context:
      'Uma pessoa pede um café no balcão antes de sair e confirma como pode pagar.',
  },
  {
    id: 'price-at-the-shop',
    situationId: 'shopping',
    level: 'A1',
    scenarioId: 'ask-the-price',
    title: 'Quanto custa a bolsa?',
    englishTitle: 'Asking about a price',
    context: 'Uma cliente encontra uma bolsa verde sem etiqueta em uma loja.',
  },
  {
    id: 'trying-a-shirt',
    situationId: 'shopping',
    level: 'A1',
    scenarioId: 'ask-for-a-size',
    title: 'Provar uma camisa',
    englishTitle: 'Trying on a shirt',
    context:
      'Um cliente experimenta uma camisa e pede o mesmo modelo em outro tamanho.',
  },
  {
    id: 'ticket-window',
    situationId: 'getting-around',
    level: 'A1',
    scenarioId: 'buy-a-ticket',
    title: 'Uma passagem para Riverside',
    englishTitle: 'A ticket to Riverside',
    context:
      'Na bilheteria, uma passageira compra passagem para o próximo trem.',
  },
  {
    id: 'bus-to-the-library',
    situationId: 'getting-around',
    level: 'A1',
    scenarioId: 'confirm-the-stop',
    title: 'De ônibus até a biblioteca',
    englishTitle: 'Taking the bus to the library',
    context:
      'Um passageiro confirma a linha e combina um aviso para descer no ponto certo.',
  },
  {
    id: 'first-english-class',
    situationId: 'meeting-people',
    level: 'A1',
    scenarioId: 'meet-a-classmate',
    title: 'Antes da primeira aula',
    englishTitle: 'Before the first English class',
    context:
      'Duas colegas se conhecem na primeira aula de inglês para adultos e se despedem no fim.',
  },
  {
    id: 'where-we-are-from',
    situationId: 'meeting-people',
    level: 'A1',
    scenarioId: 'talk-about-origins',
    title: 'De onde vocês são?',
    englishTitle: 'Talking about where we are from',
    context:
      'Depois de uma oficina, duas pessoas conversam sobre onde nasceram e onde moram.',
  },
  {
    id: 'asking-for-help',
    situationId: 'health-and-emergencies',
    level: 'A1',
    scenarioId: 'say-how-you-feel',
    title: 'Pedir ajuda ao se sentir mal',
    englishTitle: 'Asking for help when you feel unwell',
    context:
      'Uma pessoa sente tontura em um espaço público e conversa com alguém que se oferece para ajudar.',
  },
  {
    id: 'meeting-at-the-entrance',
    situationId: 'health-and-emergencies',
    level: 'A1',
    scenarioId: 'give-your-location',
    title: 'Onde posso encontrar você?',
    englishTitle: 'Where can I find you?',
    context:
      'Uma pessoa precisa de ajuda em um prédio e orienta um funcionário pelo telefone.',
  },
  {
    id: 'finding-the-museum',
    situationId: 'around-the-city',
    level: 'A1',
    scenarioId: 'find-a-place',
    title: 'O caminho até o museu',
    englishTitle: 'Finding the museum',
    context:
      'Uma visitante quer ir a pé até o museu e usa um banco como referência.',
  },
  {
    id: 'confirming-the-turn',
    situationId: 'around-the-city',
    level: 'A1',
    scenarioId: 'confirm-a-direction',
    title: 'Antes ou depois do parque?',
    englishTitle: 'Before or after the park?',
    context:
      'Um visitante pede que uma moradora esclareça a indicação para chegar ao correio.',
  },
] as const satisfies readonly DialogueSummary[]
