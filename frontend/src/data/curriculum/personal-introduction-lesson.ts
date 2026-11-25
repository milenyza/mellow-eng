import type { AvailableLesson } from '@/types/curriculum'

export const personalIntroductionLesson = {
  id: 'en-a1-introductions-about-me',
  title: 'A little about me',
  description: 'Reúna informações básicas sobre si em uma apresentação curta.',
  objectives: [
    'Dizer algo sobre si e fazer uma pergunta',
    'Distinguir respostas afirmativas e negativas',
  ],
  durationMinutes: 20,
  focus: 'Afirmativas, negativas e perguntas com to be',
  availability: 'available',
  activities: [],
  blocks: [
    {
      id: 'introduction',
      kind: 'introduction',
      title: 'Nome, origem e uma pergunta',
      paragraphs: [
        'Em um encontro do curso, as primeiras conversas podem ser curtas. Você pode cumprimentar, dizer seu nome e sua origem, e fazer uma pergunta à outra pessoa.',
        'Nesta aula, junte o que estudou na unidade. Você também vai praticar como confirmar ou negar uma informação em uma resposta curta.',
      ],
    },
    {
      id: 'personal-details',
      kind: 'vocabulary',
      title: 'Conte um pouco sobre você',
      entries: [
        {
          id: 'good-morning',
          expression: {
            text: 'Good morning',
            translation: 'Bom dia',
          },
          example: {
            text: 'Good morning! I’m Clara.',
            translation: 'Bom dia! Eu sou a Clara.',
          },
        },
        {
          id: 'my-name-is',
          expression: {
            text: 'My name is…',
            translation: 'Meu nome é…',
          },
          example: {
            text: 'My name is Leo.',
            translation: 'Meu nome é Leo.',
          },
        },
        {
          id: 'im-from',
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
          id: 'where-are-you-from',
          expression: {
            text: 'Where are you from?',
            translation: 'De onde você é?',
          },
          example: {
            text: 'Nice to meet you! Where are you from?',
            translation: 'Prazer em conhecer você! De onde você é?',
          },
        },
      ],
    },
    {
      id: 'confirming',
      kind: 'vocabulary',
      title: 'Confirme ou corrija uma informação',
      entries: [
        {
          id: 'are-you-from',
          expression: {
            text: 'Are you from…?',
            translation: 'Você é de…?',
          },
          example: {
            text: 'Are you from Canada?',
            translation: 'Você é do Canadá?',
          },
        },
        {
          id: 'yes-i-am',
          expression: {
            text: 'Yes, I am.',
            translation: 'Sim, sou.',
          },
          example: {
            text: 'Are you from Canada? Yes, I am.',
            translation: 'Você é do Canadá? Sim, sou.',
          },
        },
        {
          id: 'no-im-not',
          expression: {
            text: 'No, I’m not.',
            translation: 'Não, não sou.',
          },
          example: {
            text: 'Are you from Canada? No, I’m not.',
            translation: 'Você é do Canadá? Não, não sou.',
          },
        },
        {
          id: 'im-not-from',
          expression: {
            text: 'I’m not from…',
            translation: 'Eu não sou de…',
          },
          example: {
            text: 'I’m not from Canada. I’m from Brazil.',
            translation: 'Eu não sou do Canadá. Eu sou do Brasil.',
          },
        },
      ],
    },
    {
      id: 'grammar',
      kind: 'grammar',
      title: 'Afirme, pergunte e responda',
      explanation:
        'Retome o verbo to be nas conversas desta unidade. Para dizer de onde você é, comece com I am ou I’m. Para negar, use not depois do verbo. Para confirmar a origem de alguém, comece a pergunta com are.',
      patterns: [
        {
          note: 'Na afirmativa, I’m é a forma curta de I am. From continua antes do lugar.',
          example: {
            text: 'I’m from Brazil.',
            translation: 'Eu sou do Brasil.',
          },
        },
        {
          note: 'Na negativa, I’m not é a forma curta de I am not.',
          example: {
            text: 'I’m not from Canada.',
            translation: 'Eu não sou do Canadá.',
          },
        },
        {
          note: 'Para perguntar, comece com are you from. Quando responder sobre você, diga Yes, I am ou No, I’m not. Use I am, sem contrair, depois de yes.',
          example: {
            text: 'Are you from Mexico? No, I’m not. I’m from Brazil.',
            translation: 'Você é do México? Não, não sou. Eu sou do Brasil.',
          },
        },
      ],
    },
    {
      id: 'dialogue',
      kind: 'dialogue',
      title: 'Uma conversa antes do encontro',
      context:
        'Clara e Leo se apresentam enquanto esperam um encontro começar.',
      lines: [
        {
          speaker: 'Clara',
          text: 'Good morning! I’m Clara. Are you from Brazil?',
          translation: 'Bom dia! Eu sou a Clara. Você é do Brasil?',
        },
        {
          speaker: 'Leo',
          text: 'No, I’m not. I’m from Canada. My name is Leo.',
          translation: 'Não, não sou. Eu sou do Canadá. Meu nome é Leo.',
        },
        {
          speaker: 'Clara',
          text: 'Nice to meet you, Leo! I’m from Recife.',
          translation: 'Prazer em conhecer você, Leo! Eu sou de Recife.',
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
      title: 'Ouça afirmações e negativas',
      instructions:
        'Preste atenção ao começo da resposta. Você pode ouvir de novo ou usar uma situação equivalente em texto.',
      activities: [
        {
          format: 'listen-and-choose',
          source: {
            kind: 'speech',
            language: 'en-US',
            parts: [
              {
                id: 'line-1',
                text: 'No, I’m not. I’m from Brazil.',
                translation: 'Não, não sou. Eu sou do Brasil.',
              },
            ],
          },
          textAlternative:
            'Perguntaram se Clara é do Canadá. Clara nega a informação e explica que é do Brasil.',
          exercise: {
            id: 'en-a1-introductions-about-me-listening-negative',
            prompt: 'O que a pessoa faz no começo da resposta?',
            instructions: 'Escolha a opção que descreve a resposta.',
            kind: 'multiple-choice',
            options: [
              {
                id: 'yes',
                text: 'Confirma a informação',
                language: 'pt-BR',
              },
              {
                id: 'question',
                text: 'Faz uma pergunta',
                language: 'pt-BR',
              },
              {
                id: 'no',
                text: 'Nega a informação',
                language: 'pt-BR',
              },
            ],
            correctOptionId: 'no',
            feedback:
              'No, I’m not é uma resposta negativa. Em seguida, I’m from Brazil informa a origem correta.',
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
                text: 'Yes, I am.',
                translation: 'Sim, sou.',
              },
            ],
          },
          textAlternative:
            'Imagine que acabaram de perguntar “Você é do Canadá?”. Responda “Sim, sou” em inglês, usando a resposta curta.',
          exercise: {
            id: 'en-a1-introductions-about-me-listening-affirmative',
            prompt: 'Qual foi a resposta curta em inglês?',
            instructions:
              'Digite a resposta. A vírgula e o ponto final são opcionais.',
            kind: 'fill-in-the-blanks',
            blanks: [
              {
                id: 'response',
                before: '',
                after: '',
                acceptedAnswers: [
                  'Yes, I am.',
                  'Yes, I am',
                  'Yes I am.',
                  'Yes I am',
                ],
              },
            ],
            feedback:
              'Yes, I am confirma a informação. Quando a resposta afirmativa termina no verbo, usamos I am.',
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
                text: 'Hi, Leo! Are you from Canada?',
                translation: 'Oi, Leo! Você é do Canadá?',
                speaker: 'Nina',
              },
              {
                id: 'line-2',
                text: 'Yes, I am. I’m from Canada.',
                translation: 'Sim, sou. Eu sou do Canadá.',
                speaker: 'Leo',
              },
            ],
          },
          textAlternative:
            'Nina pergunta se Leo é do Canadá. Ele confirma que é do Canadá.',
          exercise: {
            id: 'en-a1-introductions-about-me-listening-leo',
            prompt: 'Leo confirma que é do Canadá.',
            instructions: 'Indique se a afirmação é verdadeira ou falsa.',
            kind: 'true-or-false',
            correctValue: true,
            feedback:
              'Yes, I am confirma a pergunta de Nina. A frase I’m from Canada repete a informação.',
          },
        },
      ],
    },
    {
      id: 'practice',
      kind: 'practice',
      title: 'Monte uma apresentação curta',
      instructions:
        'Combine o que você já estudou: cumprimente, se apresente, confirme informações e responda com clareza.',
      exercises: [
        {
          id: 'en-a1-introductions-about-me-practice-greeting-name',
          prompt:
            'É de manhã e você se chama Clara. Qual fala cumprimenta a pessoa e diz seu nome?',
          instructions: 'Escolha a fala completa.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'origin',
              text: 'Good morning! Where are you from?',
            },
            {
              id: 'farewell',
              text: 'Goodbye, Clara!',
            },
            {
              id: 'intro',
              text: 'Good morning! I’m Clara.',
            },
          ],
          correctOptionId: 'intro',
          feedback:
            'Good morning é o cumprimento da manhã, e I’m Clara informa seu nome.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-question',
          prompt: 'Monte a pergunta “Você é do Canadá?”',
          instructions: 'Selecione as palavras na ordem da pergunta.',
          kind: 'sentence-builder',
          tiles: [
            {
              id: 'you',
              text: 'you',
            },
            {
              id: 'canada',
              text: 'Canada?',
            },
            {
              id: 'are',
              text: 'Are',
            },
            {
              id: 'from',
              text: 'from',
            },
          ],
          correctOrder: ['are', 'you', 'from', 'canada'],
          feedback: 'Comece com Are you. Use from antes do país.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-not',
          prompt: 'Complete “Eu não sou do Canadá”.',
          instructions: 'Digite apenas a palavra que deixa a frase negativa.',
          kind: 'fill-in-the-blanks',
          blanks: [
            {
              id: 'response',
              before: 'I’m',
              after: ' from Canada.',
              acceptedAnswers: ['not'],
            },
          ],
          feedback: 'Em I’m not, not marca a negativa logo depois de I’m.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-short-yes',
          prompt:
            'Você é do México. Ao ouvir “Are you from Mexico?”, qual resposta curta confirma a informação?',
          instructions: 'Escolha a resposta curta.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'no',
              text: 'No, I’m not.',
            },
            {
              id: 'yes',
              text: 'Yes, I am.',
            },
            {
              id: 'where',
              text: 'Where are you from?',
            },
          ],
          correctOptionId: 'yes',
          feedback:
            'Yes, I am confirma a pergunta sobre você. No, I’m not nega.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-conversation',
          prompt: 'Associe as frases a seus significados.',
          instructions: 'Escolha uma tradução para cada frase.',
          kind: 'matching-pairs',
          left: [
            {
              id: 'origin',
              text: 'Where are you from?',
            },
            {
              id: 'friend',
              text: 'This is my friend Leo.',
            },
            {
              id: 'bye',
              text: 'See you!',
            },
          ],
          right: [
            {
              id: 'bye',
              text: 'Até mais!',
              language: 'pt-BR',
            },
            {
              id: 'friend',
              text: 'Este é o meu amigo Leo.',
              language: 'pt-BR',
            },
            {
              id: 'where',
              text: 'De onde você é?',
              language: 'pt-BR',
            },
          ],
          correctPairs: {
            origin: 'where',
            friend: 'friend',
            bye: 'bye',
          },
          feedback:
            'Where are you from? pergunta a origem, This is apresenta outra pessoa e See you encerra a conversa.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-affirmative-negative',
          prompt: '“No, I’m not” é uma resposta afirmativa.',
          instructions: 'Indique se a afirmação é verdadeira ou falsa.',
          kind: 'true-or-false',
          correctValue: false,
          feedback:
            'No e not indicam uma resposta negativa. Para confirmar a informação, diga Yes, I am.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-they-verb',
          prompt: 'Complete “Eles são do Brasil”.',
          instructions: 'Digite apenas o verbo que falta.',
          kind: 'fill-in-the-blanks',
          blanks: [
            {
              id: 'response',
              before: 'They',
              after: ' from Brazil.',
              acceptedAnswers: ['are'],
            },
          ],
          feedback: 'They combina com are. Use from antes do país.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-negative',
          prompt: 'Monte a frase “Eu não sou do México”.',
          instructions: 'Selecione as palavras na ordem da frase.',
          kind: 'sentence-builder',
          tiles: [
            {
              id: 'mexico',
              text: 'Mexico.',
            },
            {
              id: 'not',
              text: 'not',
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
          correctOrder: ['im', 'not', 'from', 'mexico'],
          feedback:
            'I’m vem primeiro. Depois, diga not para negar e from Mexico para indicar o lugar sobre o qual está falando.',
        },
        {
          id: 'en-a1-introductions-about-me-practice-correct-origin',
          prompt:
            'Você é do Brasil. Uma colega pergunta “Are you from Canada?”. Qual fala corrige a informação e diz sua origem?',
          instructions: 'Escolha a resposta mais completa.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'yes',
              text: 'Yes, I am. I’m from Canada.',
            },
            {
              id: 'name',
              text: 'No, I’m not. I’m Clara.',
            },
            {
              id: 'correct',
              text: 'No, I’m not. I’m from Brazil.',
            },
          ],
          correctOptionId: 'correct',
          feedback:
            'No, I’m not nega a origem sugerida. I’m from Brazil informa o lugar correto.',
        },
      ],
    },
    {
      id: 'speaking',
      kind: 'speaking',
      title: 'Faça sua apresentação em três falas',
      instructions:
        'Use seus dados ou imagine uma pessoa. Diga as falas no seu ritmo e troque nomes ou lugares nos modelos.',
      prompts: [
        {
          instruction: 'Cumprimente, diga seu nome e diga de onde você é.',
          model: {
            text: 'Hi! I’m Clara. I’m from Recife.',
            translation: 'Oi! Eu sou a Clara. Eu sou de Recife.',
          },
        },
        {
          instruction: 'Confirme se a pessoa é do Canadá.',
          model: {
            text: 'Are you from Canada?',
            translation: 'Você é do Canadá?',
          },
        },
        {
          instruction:
            'Imagine que perguntaram se você é do Canadá. Negue e diga a origem correta.',
          model: {
            text: 'No, I’m not. I’m from Brazil.',
            translation: 'Não, não sou. Eu sou do Brasil.',
          },
        },
      ],
    },
    {
      id: 'review',
      kind: 'review',
      title: 'O que você já consegue dizer',
      reminders: [
        'Use um cumprimento, I’m ou My name is para dizer seu nome, e I’m from para falar da sua origem.',
        'Pergunte Where are you from? para descobrir a origem. Use Are you from…? para confirmar um lugar.',
        'Diga Yes, I am para confirmar ou No, I’m not para negar. Ao apresentar outra pessoa, comece com This is.',
      ],
      examples: [
        {
          text: 'Hi! I’m Leo. I’m from Canada. Where are you from?',
          translation: 'Oi! Eu sou o Leo. Eu sou do Canadá. De onde você é?',
        },
      ],
    },
  ],
} satisfies AvailableLesson
