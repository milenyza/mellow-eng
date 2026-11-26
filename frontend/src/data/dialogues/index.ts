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
] as const satisfies readonly DialogueSummary[]
