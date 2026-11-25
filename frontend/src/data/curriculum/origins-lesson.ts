import type { AvailableLesson } from '@/types/curriculum'

export const originsLesson = {
  id: 'en-a1-introductions-from',
  title: 'Where are you from?',
  description: 'Converse sobre sua origem e a de outras pessoas.',
  objectives: ['Perguntar de onde alguém é', 'Responder com cidade ou país'],
  durationMinutes: 16,
  focus: 'Perguntas com where e verbo to be',
  availability: 'available',
  activities: [],
  blocks: [
    {
      id: 'introduction',
      kind: 'introduction',
      title: 'Depois dos nomes, fale de onde você é',
      paragraphs: [
        'Na recepção de um curso, você já sabe dizer seu nome e cumprimentar alguém. Agora vai aprender a perguntar de onde a pessoa é e a responder com uma cidade ou um país.',
        'Dizer a origem e dizer a nacionalidade são duas maneiras de contar algo sobre você. Vamos praticar as duas em conversas curtas.',
      ],
    },
    {
      id: 'places',
      kind: 'vocabulary',
      title: 'Uma cidade ou um país',
      entries: [
        {
          expression: {
            text: 'Where are you from?',
            translation: 'De onde você é?',
          },
          example: {
            text: 'Hi, I’m Nina. Where are you from?',
            translation: 'Oi, eu sou a Nina. De onde você é?',
          },
        },
        {
          expression: {
            text: 'I’m from…',
            translation: 'Eu sou de…',
          },
          example: {
            text: 'I’m from Recife.',
            translation: 'Eu sou de Recife.',
          },
        },
        {
          expression: {
            text: 'Brazil',
            translation: 'Brasil',
          },
          example: {
            text: 'I’m from Brazil.',
            translation: 'Eu sou do Brasil.',
          },
        },
        {
          expression: {
            text: 'Canada',
            translation: 'Canadá',
          },
          example: {
            text: 'I’m from Canada.',
            translation: 'Eu sou do Canadá.',
          },
        },
        {
          expression: {
            text: 'Mexico',
            translation: 'México',
          },
          example: {
            text: 'I’m from Mexico.',
            translation: 'Eu sou do México.',
          },
        },
        {
          expression: {
            text: 'Recife',
            translation: 'Recife',
          },
          example: {
            text: 'Hi, I’m Leo. I’m from Recife.',
            translation: 'Oi, eu sou o Leo. Eu sou de Recife.',
          },
        },
      ],
    },
    {
      id: 'nationalities',
      kind: 'vocabulary',
      title: 'Nacionalidades',
      entries: [
        {
          expression: {
            text: 'Brazilian',
            translation: 'Brasileiro(a)',
          },
          example: {
            text: 'I’m Brazilian.',
            translation: 'Eu sou brasileiro(a).',
          },
        },
        {
          expression: {
            text: 'Canadian',
            translation: 'Canadense',
          },
          example: {
            text: 'My name is Nina. I’m Canadian.',
            translation: 'Meu nome é Nina. Eu sou canadense.',
          },
        },
        {
          expression: {
            text: 'Mexican',
            translation: 'Mexicano(a)',
          },
          example: {
            text: 'Hi, I’m Diego. I’m Mexican.',
            translation: 'Oi, eu sou o Diego. Eu sou mexicano.',
          },
        },
      ],
    },
    {
      id: 'grammar',
      kind: 'grammar',
      title: 'Origem com from',
      explanation:
        'Use I’m from antes do lugar. Observe a ordem em “Where are you from?”. Where indica “onde”, are vem antes de you e from fica no final. Na resposta, I’m é a forma curta de I am.',
      patterns: [
        {
          note: 'Na pergunta, mantenha from no final.',
          example: {
            text: 'Where are you from?',
            translation: 'De onde você é?',
          },
        },
        {
          note: 'Na resposta, troque apenas o lugar. Use from com cidades e países.',
          example: {
            text: 'I’m from Mexico.',
            translation: 'Eu sou do México.',
          },
        },
        {
          note: 'Para dizer a nacionalidade, use I’m seguido de Brazilian, Canadian ou Mexican, sem from. Em inglês, nomes de países e nacionalidades começam com maiúscula.',
          example: {
            text: 'I’m Canadian.',
            translation: 'Eu sou canadense.',
          },
        },
        {
          note: 'Se quiser corrigir uma suposição sobre sua origem, use I’m not from seguido do lugar.',
          example: {
            text: 'I’m not from Canada. I’m from Brazil.',
            translation: 'Eu não sou do Canadá. Eu sou do Brasil.',
          },
        },
      ],
    },
    {
      id: 'dialogue',
      kind: 'dialogue',
      title: 'Na recepção do curso',
      context: 'Leo e Nina se conhecem enquanto aguardam o início da aula.',
      lines: [
        {
          speaker: 'Nina',
          text: 'Hi, I’m Nina. Where are you from?',
          translation: 'Oi, eu sou a Nina. De onde você é?',
        },
        {
          speaker: 'Leo',
          text: 'I’m from Recife. I’m Brazilian.',
          translation: 'Eu sou de Recife. Sou brasileiro.',
        },
        {
          speaker: 'Nina',
          text: 'Nice to meet you, Leo! I’m from Canada.',
          translation: 'Prazer em conhecer você, Leo! Eu sou do Canadá.',
        },
        {
          speaker: 'Leo',
          text: 'Nice to meet you, too!',
          translation: 'Prazer em conhecer você também!',
        },
      ],
    },
    {
      id: 'listening',
      kind: 'listening',
      title: 'Ouça de onde as pessoas são',
      instructions:
        'Ouça cada trecho e preste atenção ao lugar mencionado. Você pode repetir o áudio ou praticar com a alternativa em texto.',
      activities: [
        {
          format: 'listen-and-choose',
          source: {
            kind: 'speech',
            language: 'en-US',
            parts: [
              {
                id: 'line-1',
                text: 'Hello, I’m Diego. I’m from Mexico.',
                translation: 'Olá, eu sou o Diego. Eu sou do México.',
              },
            ],
          },
          textAlternative:
            'Diego acaba de se apresentar e conta que é do México.',
          exercise: {
            id: 'en-a1-introductions-from-listening-country',
            prompt: 'De que país Diego é?',
            instructions: 'Escolha o país mencionado.',
            kind: 'multiple-choice',
            options: [
              {
                id: 'brazil',
                text: 'Brasil',
                language: 'pt-BR',
              },
              {
                id: 'canada',
                text: 'Canadá',
                language: 'pt-BR',
              },
              {
                id: 'mexico',
                text: 'México',
                language: 'pt-BR',
              },
            ],
            correctOptionId: 'mexico',
            feedback: 'I’m from Mexico informa que Diego é do México.',
          },
        },
        {
          format: 'listen-and-write',
          source: {
            kind: 'speech',
            language: 'en-US',
            parts: [
              {
                id: 'line-1',
                text: 'I’m from Recife.',
                translation: 'Eu sou de Recife.',
              },
            ],
          },
          textAlternative:
            'Uma pessoa responde “Sou de Recife”. Escreva a resposta em inglês usando I’m.',
          exercise: {
            id: 'en-a1-introductions-from-listening-city',
            prompt: 'Como a pessoa diz de onde é?',
            instructions: 'Digite a frase com I’m. O ponto final é opcional.',
            kind: 'fill-in-the-blanks',
            blanks: [
              {
                id: 'response',
                before: '',
                after: '',
                acceptedAnswers: [
                  'I’m from Recife.',
                  'I’m from Recife',
                  "I'm from Recife.",
                  "I'm from Recife",
                ],
              },
            ],
            feedback:
              'I’m from seguido de Recife informa a cidade de origem. O apóstrofo faz parte de I’m.',
          },
        },
        {
          format: 'dialogue-comprehension',
          source: {
            kind: 'speech',
            language: 'en-US',
            parts: [
              {
                id: 'line-1',
                text: 'Hi, Nina. Where are you from?',
                translation: 'Oi, Nina. De onde você é?',
                speaker: 'Leo',
              },
              {
                id: 'line-2',
                text: 'I’m from Canada. I’m Canadian.',
                translation: 'Eu sou do Canadá. Sou canadense.',
                speaker: 'Nina',
              },
            ],
          },
          textAlternative:
            'Leo pergunta de onde Nina é. Nina diz que é do Canadá e que é canadense.',
          exercise: {
            id: 'en-a1-introductions-from-listening-nationality',
            prompt: 'Qual nacionalidade Nina menciona?',
            instructions: 'Escolha a nacionalidade.',
            kind: 'multiple-choice',
            options: [
              {
                id: 'mexican',
                text: 'Mexicana',
                language: 'pt-BR',
              },
              {
                id: 'brazilian',
                text: 'Brasileira',
                language: 'pt-BR',
              },
              {
                id: 'canadian',
                text: 'Canadense',
                language: 'pt-BR',
              },
            ],
            correctOptionId: 'canadian',
            feedback:
              'I’m Canadian quer dizer “Sou canadense”. Canada é o país e Canadian é a nacionalidade.',
          },
        },
      ],
    },
    {
      id: 'practice',
      kind: 'practice',
      title: 'Pratique uma conversa sobre origem',
      instructions:
        'Confira a resposta de cada exercício. Quando precisar, leia a explicação e tente de novo.',
      exercises: [
        {
          id: 'en-a1-introductions-from-practice-question',
          prompt:
            'Você já sabe o nome da pessoa. Como perguntar de onde ela é?',
          instructions: 'Escolha a pergunta adequada.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'name',
              text: 'What’s your name?',
            },
            {
              id: 'origin',
              text: 'Where are you from?',
            },
            {
              id: 'confirm',
              text: 'Are you Leo?',
            },
          ],
          correctOptionId: 'origin',
          feedback:
            'Where are you from? pergunta a origem. What’s your name? pergunta o nome.',
        },
        {
          id: 'en-a1-introductions-from-practice-from',
          prompt: 'Complete “Sou do Canadá” em inglês.',
          instructions: 'Digite apenas a palavra que falta.',
          kind: 'fill-in-the-blanks',
          blanks: [
            {
              id: 'response',
              before: 'I’m',
              after: ' Canada.',
              acceptedAnswers: ['from'],
            },
          ],
          feedback:
            'From liga I’m ao lugar de origem. Veja a frase I’m from Canada.',
        },
        {
          id: 'en-a1-introductions-from-practice-city',
          prompt: 'Monte a frase “Eu sou de Recife”.',
          instructions: 'Toque ou selecione as palavras na ordem da frase.',
          kind: 'sentence-builder',
          tiles: [
            {
              id: 'city',
              text: 'Recife.',
            },
            {
              id: 'from',
              text: 'from',
            },
            {
              id: 'im',
              text: 'I’m',
            },
          ],
          correctOrder: ['im', 'from', 'city'],
          feedback: 'Use I’m, depois from e, por fim, o lugar.',
        },
        {
          id: 'en-a1-introductions-from-practice-nationalities',
          prompt: 'Associe os países às nacionalidades.',
          instructions:
            'Escolha uma nacionalidade em português para cada país.',
          kind: 'matching-pairs',
          left: [
            {
              id: 'brazil',
              text: 'Brazil',
            },
            {
              id: 'canada',
              text: 'Canada',
            },
            {
              id: 'mexico',
              text: 'Mexico',
            },
          ],
          right: [
            {
              id: 'mx',
              text: 'Mexicano(a)',
              language: 'pt-BR',
            },
            {
              id: 'br',
              text: 'Brasileiro(a)',
              language: 'pt-BR',
            },
            {
              id: 'ca',
              text: 'Canadense',
              language: 'pt-BR',
            },
          ],
          correctPairs: {
            brazil: 'br',
            canada: 'ca',
            mexico: 'mx',
          },
          feedback:
            'Brazil corresponde a Brazilian, Canada a Canadian e Mexico a Mexican.',
        },
        {
          id: 'en-a1-introductions-from-practice-city-meaning',
          prompt: '“I’m from Recife” informa a cidade de origem.',
          instructions: 'Indique se a frase é verdadeira ou falsa.',
          kind: 'true-or-false',
          correctValue: true,
          feedback:
            'Recife é a cidade na resposta. I’m from pode indicar uma cidade ou um país.',
        },
        {
          id: 'en-a1-introductions-from-practice-adjective',
          prompt: 'Nina é canadense. Como ela pode dizer isso em inglês?',
          instructions: 'Escolha a frase que expressa a nacionalidade.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'country',
              text: 'I’m from Canada.',
            },
            {
              id: 'name',
              text: 'I’m Nina.',
            },
            {
              id: 'nationality',
              text: 'I’m Canadian.',
            },
          ],
          correctOptionId: 'nationality',
          feedback:
            'I’m Canadian diz a nacionalidade. I’m from Canada informa o país de origem.',
        },
        {
          id: 'en-a1-introductions-from-practice-mexican',
          prompt: 'Complete a fala de Diego: “Eu sou mexicano”.',
          instructions: 'Digite apenas a nacionalidade.',
          kind: 'fill-in-the-blanks',
          blanks: [
            {
              id: 'response',
              before: 'I’m',
              after: '.',
              acceptedAnswers: ['Mexican'],
            },
          ],
          feedback: 'Mexican é a nacionalidade. Mexico é o nome do país.',
        },
        {
          id: 'en-a1-introductions-from-practice-negative',
          prompt: '“I’m not from Canada” quer dizer “Eu sou do Canadá”.',
          instructions: 'Indique se a tradução está correta.',
          kind: 'true-or-false',
          correctValue: false,
          feedback:
            'Not torna a frase negativa. I’m not from Canada significa “Eu não sou do Canadá”.',
        },
      ],
    },
    {
      id: 'speaking',
      kind: 'speaking',
      title: 'Diga de onde você é',
      instructions:
        'Ouça os modelos se quiser e responda em voz alta. Troque Recife ou Brazil por sua cidade ou seu país.',
      prompts: [
        {
          instruction: 'Pergunte a origem da outra pessoa.',
          model: {
            text: 'Where are you from?',
            translation: 'De onde você é?',
          },
        },
        {
          instruction: 'Responda com sua cidade ou país.',
          model: {
            text: 'I’m from Recife.',
            translation: 'Eu sou de Recife.',
          },
        },
        {
          instruction: 'Diga sua nacionalidade.',
          model: {
            text: 'I’m Brazilian.',
            translation: 'Eu sou brasileiro(a).',
          },
        },
      ],
    },
    {
      id: 'review',
      kind: 'review',
      title: 'Sua origem em duas frases',
      reminders: [
        'Pergunte a origem com Where are you from?',
        'Em I’m from, use uma cidade ou um país. Para a nacionalidade, diga I’m Brazilian, I’m Canadian ou I’m Mexican.',
        'Escreva países e nacionalidades com inicial maiúscula em inglês.',
      ],
      examples: [
        {
          text: 'I’m from Brazil. I’m Brazilian.',
          translation: 'Eu sou do Brasil. Sou brasileiro(a).',
        },
      ],
    },
  ],
} satisfies AvailableLesson
