import { defineGuidance } from './authoring'

const entry = defineGuidance('getting-around')

export default [
  entry(
    'confirm-the-destination',
    'clarification',
    'Conferir o destino antes de embarcar',
    'Diga o nome do destino em vez de apontar apenas para a linha. “Does this bus go to…?” permite confirmar se aquele ônibus vai até lá.',
    'Se houver duas linhas parecidas, pergunte também o número do ônibus.',
    ['go-to', 'bus-number'],
    { dialogue: 'bus-to-the-library', simulation: 'confirm-the-stop' },
  ),
  entry(
    'repeat-the-stop-name',
    'clarification',
    'Pedir para repetir o nome do ponto',
    'Se não entender o nome, peça para repetir a parada específica. “Again” indica que você quer ouvir a mesma informação.',
    'Se ouvir uma parte do nome, repita o que entendeu na pergunta.',
    [
      [
        'repeat-stop',
        'Can you say the stop name again, please?',
        'Pode dizer o nome do ponto de novo, por favor?',
      ],
      'right-stop',
    ],
    {
      expressions: ['get-off'],
      dialogue: 'bus-to-the-library',
      simulation: 'confirm-the-stop',
    },
  ),
  entry(
    'platform-and-stop',
    'context',
    'Identificar onde esperar ou descer',
    '“Platform” indica a plataforma de um trem. “Stop” pode indicar o ponto de ônibus ou uma parada no caminho.',
    'Confira o número da plataforma ou o nome da parada.',
    ['platform', 'get-off'],
    {
      expressions: ['next-train'],
      dialogue: 'ticket-window',
      simulation: 'buy-a-ticket',
    },
  ),
  entry(
    'return-and-round-trip',
    'vocabulary',
    'Pedir passagem de ida e volta',
    'Em inglês americano, “round-trip ticket” indica ida e volta. No inglês britânico, “return ticket” costuma ter esse sentido. Em inglês americano, “return ticket” pode indicar só o trecho de volta.',
    'Se houver dúvida, diga que precisa tanto da ida quanto da volta.',
    [
      [
        'round-trip-us',
        'A round-trip ticket to Oxford, please.',
        'Uma passagem de ida e volta para Oxford, por favor.',
        'en-US',
      ],
      [
        'return-uk',
        'A return ticket to Oxford, please.',
        'Uma passagem de ida e volta para Oxford, por favor.',
        'en-GB',
      ],
    ],
    {
      expressions: ['round-trip', 'one-way'],
      dialogue: 'ticket-window',
      simulation: 'buy-a-ticket',
    },
  ),
] as const
