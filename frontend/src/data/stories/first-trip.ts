import cover from '@/assets/stories/first-trip.svg'
import type { PublishedStory } from '@/types/story'

import { firstTripMetadata } from '../story-index'

export const firstTripStory = {
  ...firstTripMetadata,
  cover,
  chapters: [
    {
      ...firstTripMetadata.chapters[0],
      paragraphs: [
        {
          id: 'at-the-station',
          text: 'It is Saturday morning. Caio is at the train station. He wants to visit the coast. This is his first train trip alone. He has a small bag and a ticket.',
          translation:
            'É sábado de manhã. Caio está na estação de trem. Ele quer visitar o litoral. Esta é a primeira viagem dele de trem sozinho. Ele tem uma bolsa pequena e uma passagem.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-first-trip-train-station',
              phrase: 'train station',
            },
            { vocabularyId: 'story-first-trip-ticket', phrase: 'ticket' },
          ],
        },
        {
          id: 'departure-time',
          text: 'Caio looks at his ticket. The train leaves at nine. He looks at the clock. It is eight thirty. He has time, but he does not know where to go.',
          translation:
            'Caio olha a passagem. O trem sai às nove. Ele olha o relógio. São oito e meia. Ele tem tempo, mas não sabe para onde ir.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-first-trip-leaves-at',
              phrase: 'leaves at nine',
            },
          ],
        },
      ],
      vocabulary: [
        {
          id: 'story-first-trip-train-station',
          word: 'train station',
          pronunciation: '/treɪn ˈsteɪ.ʃən/',
          matchingTranslation: 'Estação de trem',
          meaning: 'Estação de trem, onde Caio vai embarcar.',
          example: {
            text: 'I am at the train station.',
            translation: 'Estou na estação de trem.',
          },
        },
        {
          id: 'story-first-trip-ticket',
          word: 'ticket',
          pronunciation: '/ˈtɪk.ɪt/',
          matchingTranslation: 'Passagem / Bilhete',
          meaning:
            'Passagem ou bilhete. A passagem de Caio mostra o horário do trem.',
          example: {
            text: 'I have a train ticket.',
            translation: 'Tenho uma passagem de trem.',
          },
        },
        {
          id: 'story-first-trip-leaves-at',
          word: 'leaves at',
          pronunciation: '/liːvz æt/',
          matchingTranslation: 'Sai às',
          meaning: 'Sai às. A expressão indica o horário de partida.',
          example: {
            text: 'The train leaves at ten.',
            translation: 'O trem sai às dez.',
          },
        },
      ],
      comprehension: {
        id: 'first-trip-ticket-comprehension',
        instructions:
          'Confira o destino e os horários da viagem. Você pode reler os trechos e seguir para o próximo capítulo sem responder.',
        exercises: [
          {
            id: 'first-trip-destination',
            kind: 'multiple-choice',
            prompt: 'Where does Caio want to go?',
            promptLanguage: 'en',
            instructions: 'Escolha o destino que Caio quer visitar.',
            options: [
              { id: 'home', text: 'Home' },
              { id: 'coast', text: 'The coast' },
              { id: 'work', text: 'Work' },
            ],
            correctOptionId: 'coast',
            feedback:
              'O texto diz que Caio quer visitar o litoral, “the coast”.',
            paragraphIds: ['at-the-station'],
          },
          {
            id: 'first-trip-departure',
            kind: 'fill-in-the-blanks',
            prompt: 'Complete com o horário de saída do trem.',
            instructions: 'Digite a palavra em inglês usada no bilhete.',
            blanks: [
              {
                id: 'hour',
                before: 'The train leaves at',
                after: '.',
                acceptedAnswers: ['nine'],
              },
            ],
            feedback: '“Leaves at nine” indica que o trem sai às nove.',
            paragraphIds: ['departure-time'],
          },
          {
            id: 'first-trip-clock',
            kind: 'true-or-false',
            prompt: 'The clock shows eight thirty.',
            promptLanguage: 'en',
            instructions:
              'A frase diz que o relógio marca oito e meia. Confira se está correta.',
            correctValue: true,
            feedback:
              'São oito e meia quando Caio olha o relógio. O trem ainda vai sair às nove.',
            paragraphIds: ['departure-time'],
          },
          {
            id: 'first-trip-station-words',
            kind: 'matching-pairs',
            prompt: 'Associe as palavras aos sentidos usados no capítulo.',
            instructions: 'Escolha uma tradução para cada expressão.',
            left: [
              { id: 'station', text: 'train station' },
              { id: 'ticket', text: 'ticket' },
            ],
            right: [
              { id: 'pass', text: 'passagem' },
              { id: 'place', text: 'estação de trem' },
            ],
            correctPairs: { station: 'place', ticket: 'pass' },
            feedback:
              'A estação é o local de embarque. A passagem tem os dados da viagem.',
            paragraphIds: ['at-the-station'],
          },
        ],
      },
    },
    {
      ...firstTripMetadata.chapters[1],
      paragraphs: [
        {
          id: 'asking-for-help',
          text: 'Caio sees a woman at the information desk. “Excuse me. Where is the train to the coast?” he asks. She looks at his ticket. “Platform two,” she says.',
          translation:
            'Caio vê uma mulher no balcão de informações. “Com licença. Onde fica o trem para o litoral?”, ele pergunta. Ela olha a passagem dele. “Plataforma dois”, responde.',
          vocabularyReferences: [
            {
              vocabularyId: 'story-first-trip-information-desk',
              phrase: 'information desk',
            },
            { vocabularyId: 'story-first-trip-excuse-me', phrase: 'Excuse me' },
            {
              vocabularyId: 'story-first-trip-platform',
              phrase: 'Platform two',
            },
          ],
        },
        {
          id: 'directions-to-platform',
          text: '“Go straight and turn left,” the woman says. Caio says, “Thank you.” He follows the signs and finds platform two. The train is there. He gets on.',
          translation:
            '“Siga em frente e vire à esquerda”, diz a mulher. Caio agradece. Ele segue as placas e encontra a plataforma dois. O trem está lá. Ele embarca.',
          vocabularyReferences: [
            { vocabularyId: 'story-first-trip-turn-left', phrase: 'turn left' },
          ],
        },
      ],
      vocabulary: [
        {
          id: 'story-first-trip-information-desk',
          word: 'information desk',
          pronunciation: '/ˌɪn.fɚˈmeɪ.ʃən desk/',
          matchingTranslation: 'Balcão de informações',
          meaning: 'Balcão de informações, onde Caio pede ajuda.',
          example: {
            text: 'The information desk is over there.',
            translation: 'O balcão de informações fica ali.',
          },
        },
        {
          id: 'story-first-trip-excuse-me',
          word: 'Excuse me',
          pronunciation: '/ɪkˈskjuːz miː/',
          matchingTranslation: 'Com licença',
          meaning:
            'Com licença. Caio usa a expressão para iniciar uma pergunta com educação.',
          example: {
            text: 'Excuse me. Where is the train?',
            translation: 'Com licença. Onde está o trem?',
          },
        },
        {
          id: 'story-first-trip-platform',
          word: 'platform',
          pronunciation: '/ˈplæt.fɔːrm/',
          matchingTranslation: 'Plataforma',
          meaning: 'Plataforma, área onde os passageiros embarcam no trem.',
          example: {
            text: 'My train is at platform two.',
            translation: 'Meu trem está na plataforma dois.',
          },
        },
        {
          id: 'story-first-trip-turn-left',
          word: 'turn left',
          pronunciation: '/tɝːn left/',
          matchingTranslation: 'Vire à esquerda',
          meaning: 'Vire à esquerda. É uma instrução de direção.',
          example: {
            text: 'Turn left at the door.',
            translation: 'Vire à esquerda na porta.',
          },
        },
      ],
      comprehension: {
        id: 'first-trip-platform-comprehension',
        instructions:
          'Revise a pergunta de Caio, a plataforma indicada e as instruções de direção.',
        exercises: [
          {
            id: 'first-trip-platform-number',
            kind: 'multiple-choice',
            prompt: 'Which platform does Caio need?',
            promptLanguage: 'en',
            instructions: 'Escolha a plataforma indicada pela funcionária.',
            options: [
              { id: 'one', text: 'Platform one' },
              { id: 'three', text: 'Platform three' },
              { id: 'two', text: 'Platform two' },
            ],
            correctOptionId: 'two',
            feedback:
              'A funcionária confere a passagem e responde “Platform two”.',
            paragraphIds: ['asking-for-help'],
          },
          {
            id: 'first-trip-left',
            kind: 'true-or-false',
            prompt: 'Caio needs to turn right.',
            promptLanguage: 'en',
            instructions:
              'A frase diz que Caio deve virar à direita. Confira a instrução do texto.',
            correctValue: false,
            feedback:
              'A funcionária diz “turn left”, que significa virar à esquerda.',
            paragraphIds: ['directions-to-platform'],
          },
          {
            id: 'first-trip-excuse',
            kind: 'multiple-choice',
            prompt: 'Por que Caio diz “Excuse me”?',
            instructions: 'Escolha o sentido da expressão na conversa.',
            options: [
              {
                id: 'start',
                text: 'Para começar a pergunta com educação.',
                language: 'pt-BR',
              },
              {
                id: 'end',
                text: 'Para se despedir da funcionária.',
                language: 'pt-BR',
              },
              {
                id: 'time',
                text: 'Para informar o horário do trem.',
                language: 'pt-BR',
              },
            ],
            correctOptionId: 'start',
            feedback:
              'Caio diz “Excuse me” antes de perguntar onde está o trem. É uma forma educada de chamar a atenção.',
            paragraphIds: ['asking-for-help'],
          },
          {
            id: 'first-trip-platform-sequence',
            kind: 'sequence-ordering',
            prompt: 'Em que ordem Caio encontra o trem?',
            instructions: 'Selecione os acontecimentos do primeiro ao último.',
            items: [
              { id: 'find', text: 'Caio finds platform two.' },
              { id: 'board', text: 'Caio gets on the train.' },
              { id: 'ask', text: 'Caio asks for help.' },
            ],
            correctOrder: ['ask', 'find', 'board'],
            feedback:
              'Primeiro Caio pede ajuda. Depois encontra a plataforma e embarca.',
            paragraphIds: ['asking-for-help', 'directions-to-platform'],
          },
        ],
      },
    },
    {
      ...firstTripMetadata.chapters[2],
      paragraphs: [
        {
          id: 'finding-the-seat',
          text: 'On the train, Caio looks at his ticket again. His seat is number twelve, by the window. A man is next to the seat. “Is this seat twelve?” Caio asks. “Yes, it is,” the man says.',
          translation:
            'No trem, Caio olha a passagem de novo. O assento dele é o número doze, junto à janela. Um homem está ao lado do assento. “Este é o assento doze?”, pergunta Caio. “Sim, é”, responde o homem.',
          vocabularyReferences: [
            { vocabularyId: 'story-first-trip-seat', phrase: 'seat' },
            {
              vocabularyId: 'story-first-trip-by-window',
              phrase: 'by the window',
            },
          ],
        },
        {
          id: 'leaving-the-city',
          text: 'Caio sits down. The train leaves the station. He sees buildings, then trees. The city is far away now. He smiles and looks out the window. Now he is on his way to the coast.',
          translation:
            'Caio se senta. O trem sai da estação. Ele vê prédios e depois árvores. Agora a cidade está longe. Ele sorri e olha pela janela. Agora ele está a caminho do litoral.',
          vocabularyReferences: [
            { vocabularyId: 'story-first-trip-sits-down', phrase: 'sits down' },
          ],
        },
      ],
      vocabulary: [
        {
          id: 'story-first-trip-seat',
          word: 'seat',
          pronunciation: '/siːt/',
          matchingTranslation: 'Assento / Lugar para sentar',
          meaning: 'Assento ou lugar para sentar. Caio procura o número doze.',
          example: {
            text: 'This is my seat.',
            translation: 'Este é o meu assento.',
          },
        },
        {
          id: 'story-first-trip-by-window',
          word: 'by the window',
          pronunciation: '/baɪ ðə ˈwɪn.doʊ/',
          matchingTranslation: 'Junto à janela',
          meaning: 'Junto à janela. Indica onde está o assento.',
          example: {
            text: 'I sit by the window.',
            translation: 'Eu me sento junto à janela.',
          },
        },
        {
          id: 'story-first-trip-sits-down',
          word: 'sit down',
          pronunciation: '/sɪt daʊn/',
          matchingTranslation: 'Sentar-se',
          meaning:
            'Sentar-se. No texto aparece “sits down” porque o sujeito é Caio.',
          example: {
            text: 'I sit down and look out the window.',
            translation: 'Eu me sento e olho pela janela.',
          },
        },
      ],
      comprehension: {
        id: 'first-trip-seat-comprehension',
        instructions:
          'Confira onde Caio se senta e o que vê quando o trem sai da cidade.',
        exercises: [
          {
            id: 'first-trip-seat-number',
            kind: 'multiple-choice',
            prompt: 'What is Caio’s seat number?',
            promptLanguage: 'en',
            instructions: 'Escolha o número do assento de Caio.',
            options: [
              { id: 'ten', text: 'Ten' },
              { id: 'twelve', text: 'Twelve' },
              { id: 'two', text: 'Two' },
            ],
            correctOptionId: 'twelve',
            feedback:
              'O assento é o número doze. O número dois indicava a plataforma, em outro capítulo.',
            paragraphIds: ['finding-the-seat'],
          },
          {
            id: 'first-trip-window',
            kind: 'multiple-choice',
            prompt: 'O que “by the window” indica sobre o assento?',
            instructions: 'Escolha o sentido no trecho.',
            options: [
              { id: 'door', text: 'Fica perto da porta.', language: 'pt-BR' },
              { id: 'window', text: 'Fica junto à janela.', language: 'pt-BR' },
              { id: 'station', text: 'Fica na estação.', language: 'pt-BR' },
            ],
            correctOptionId: 'window',
            feedback:
              '“By the window” significa “junto à janela”. É onde fica o assento de Caio.',
            paragraphIds: ['finding-the-seat'],
          },
          {
            id: 'first-trip-buildings',
            kind: 'fill-in-the-blanks',
            prompt: 'Complete com o que Caio vê depois dos prédios.',
            instructions: 'Digite a palavra em inglês usada no texto.',
            blanks: [
              {
                id: 'view',
                before: 'He sees buildings, then',
                after: '.',
                acceptedAnswers: ['trees'],
              },
            ],
            feedback:
              'Caio vê prédios e depois árvores. “Trees” significa “árvores”.',
            paragraphIds: ['leaving-the-city'],
          },
          {
            id: 'first-trip-city',
            kind: 'true-or-false',
            prompt: 'The train stays at the station.',
            promptLanguage: 'en',
            instructions:
              'A frase diz que o trem fica na estação. Isso acontece?',
            correctValue: false,
            feedback:
              'O texto diz “The train leaves the station”. O trem sai e a cidade fica para trás.',
            paragraphIds: ['leaving-the-city'],
          },
        ],
      },
    },
  ],
} satisfies PublishedStory
