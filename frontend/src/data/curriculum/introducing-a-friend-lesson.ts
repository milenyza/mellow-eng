import type { AvailableLesson } from '@/types/curriculum'

export const introducingAFriendLesson = {
  id: 'en-a1-introductions-meet',
  title: 'This is my friend',
  description: 'Apresente uma terceira pessoa em uma conversa breve.',
  objectives: [
    'Selecionar o pronome pessoal adequado',
    'Apresentar alguém pelo nome',
  ],
  durationMinutes: 17,
  focus: 'He, she e they com is e are',
  availability: 'available',
  activities: [],
  blocks: [
    {
      id: 'introduction',
      kind: 'introduction',
      title: 'Apresente uma pessoa que está com você',
      paragraphs: [
        'Você já sabe se apresentar e falar da sua origem. Agora imagine que chegou a um encontro do curso com uma pessoa amiga. Aprenda a dizer o nome dela e a contar de onde ela é.',
        'Vamos usar he, she e they para falar de outras pessoas e retomar as frases de origem da aula anterior.',
      ],
    },
    {
      id: 'introducing',
      kind: 'vocabulary',
      title: 'Apresentar uma pessoa',
      entries: [
        {
          expression: {
            text: 'This is…',
            translation: 'Este é… / Esta é…',
          },
          example: {
            text: 'This is Clara.',
            translation: 'Esta é a Clara.',
          },
        },
        {
          expression: {
            text: 'My friend',
            translation: 'Meu amigo / Minha amiga',
          },
          example: {
            text: 'This is my friend Leo.',
            translation: 'Este é o meu amigo Leo.',
          },
        },
        {
          expression: {
            text: 'He',
            translation: 'Ele',
          },
          example: {
            text: 'He is from Canada.',
            translation: 'Ele é do Canadá.',
          },
        },
        {
          expression: {
            text: 'She',
            translation: 'Ela',
          },
          example: {
            text: 'She is from Recife.',
            translation: 'Ela é de Recife.',
          },
        },
        {
          expression: {
            text: 'Nice to meet you!',
            translation: 'Prazer em conhecer você!',
          },
          example: {
            text: 'Nice to meet you, Clara!',
            translation: 'Prazer em conhecer você, Clara!',
          },
        },
      ],
    },
    {
      id: 'pronouns',
      kind: 'vocabulary',
      title: 'Falar sobre quem você apresentou',
      entries: [
        {
          expression: {
            text: 'They',
            translation: 'Eles / Elas',
          },
          example: {
            text: 'They are from Brazil.',
            translation: 'Eles são do Brasil.',
          },
          usage: 'Nesta aula, usamos they para falar de duas ou mais pessoas.',
        },
        {
          expression: {
            text: 'He’s',
            translation: 'Ele é / Ele está',
          },
          example: {
            text: 'He’s from Canada.',
            translation: 'Ele é do Canadá.',
          },
        },
        {
          expression: {
            text: 'She’s',
            translation: 'Ela é / Ela está',
          },
          example: {
            text: 'She’s Brazilian.',
            translation: 'Ela é brasileira.',
          },
        },
        {
          expression: {
            text: 'They’re',
            translation: 'Eles são / Elas são',
          },
          example: {
            text: 'They’re from Brazil.',
            translation: 'Elas são do Brasil.',
          },
          usage: 'They’re é a forma curta de they are.',
        },
      ],
    },
    {
      id: 'grammar',
      kind: 'grammar',
      title: 'Escolha o pronome e combine com is ou are',
      explanation:
        'Ao apresentar alguém, diga This is e depois o nome. Nas frases de origem, use is com he ou she e are com they. Depois, repita from e o lugar, como na aula anterior.',
      patterns: [
        {
          note: 'Use This is antes do nome ao apresentar a pessoa ao seu lado.',
          example: {
            text: 'This is my friend Leo.',
            translation: 'Este é o meu amigo Leo.',
          },
        },
        {
          note: 'He is e she is podem ficar mais curtos: he’s e she’s.',
          example: {
            text: 'She’s from Recife.',
            translation: 'Ela é de Recife.',
          },
        },
        {
          note: 'They are pode ficar they’re. Aqui, Ana está falando de dois colegas.',
          example: {
            text: 'They’re from Brazil.',
            translation: 'Eles são do Brasil.',
          },
        },
        {
          note: 'Para confirmar a origem, coloque is ou are antes do pronome. A ordem are you também aparece na pergunta Where are you from? da aula anterior.',
          example: {
            text: 'Is she from Canada?',
            translation: 'Ela é do Canadá?',
          },
        },
      ],
    },
    {
      id: 'dialogue',
      kind: 'dialogue',
      title: 'Uma apresentação entre colegas',
      context: 'Ana chega para a aula com Leo. Clara já está esperando.',
      lines: [
        {
          speaker: 'Ana',
          text: 'Hi, Clara! This is my friend Leo. He’s from Canada.',
          translation: 'Oi, Clara! Este é o meu amigo Leo. Ele é do Canadá.',
        },
        {
          speaker: 'Clara',
          text: 'Nice to meet you, Leo! I’m Clara. I’m from Recife.',
          translation:
            'Prazer em conhecer você, Leo! Eu sou a Clara. Eu sou de Recife.',
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
      title: 'Quem está sendo apresentado?',
      instructions:
        'Ouça as falas e preste atenção aos nomes e aos pronomes. A alternativa em texto está disponível em cada atividade.',
      activities: [
        {
          format: 'listen-and-choose',
          source: {
            kind: 'speech',
            language: 'en-US',
            parts: [
              {
                id: 'line-1',
                text: 'Hi, Diego! This is my friend Clara.',
                translation: 'Oi, Diego! Esta é a minha amiga Clara.',
              },
            ],
          },
          textAlternative:
            'Ana encontra Diego e apresenta Clara, a amiga que veio com ela.',
          exercise: {
            id: 'en-a1-introductions-meet-listening-friend',
            prompt: 'Quem está sendo apresentado?',
            instructions: 'Escolha o nome da pessoa que Ana apresenta.',
            kind: 'multiple-choice',
            options: [
              {
                id: 'ana',
                text: 'Ana',
                language: 'pt-BR',
              },
              {
                id: 'diego',
                text: 'Diego',
                language: 'pt-BR',
              },
              {
                id: 'clara',
                text: 'Clara',
                language: 'pt-BR',
              },
            ],
            correctOptionId: 'clara',
            feedback:
              'This is my friend Clara apresenta Clara. Diego é a pessoa que Ana cumprimenta.',
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
                text: 'She’s from Canada.',
                translation: 'Ela é do Canadá.',
              },
            ],
          },
          textAlternative:
            'Uma colega diz “Ela é do Canadá”. Escreva a mesma frase em inglês usando She’s.',
          exercise: {
            id: 'en-a1-introductions-meet-listening-she',
            prompt: 'Como a pessoa fala da origem da colega?',
            instructions: 'Digite a frase com She’s. O ponto final é opcional.',
            kind: 'fill-in-the-blanks',
            blanks: [
              {
                id: 'response',
                before: '',
                after: '',
                acceptedAnswers: [
                  'She’s from Canada.',
                  'She’s from Canada',
                  "She's from Canada.",
                  "She's from Canada",
                ],
              },
            ],
            feedback:
              'She’s é a forma curta de she is. Use from antes de Canada.',
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
                text: 'Hi, Bruno! This is Leo. He’s from Canada.',
                translation: 'Oi, Bruno! Este é o Leo. Ele é do Canadá.',
                speaker: 'Nina',
              },
              {
                id: 'line-2',
                text: 'Nice to meet you, Leo!',
                translation: 'Prazer em conhecer você, Leo!',
                speaker: 'Bruno',
              },
            ],
          },
          textAlternative:
            'Nina apresenta Leo a Bruno e diz que Leo é do Canadá. Bruno cumprimenta Leo pela primeira vez.',
          exercise: {
            id: 'en-a1-introductions-meet-listening-leo',
            prompt: 'Leo é do Canadá.',
            instructions: 'Indique se a afirmação é verdadeira ou falsa.',
            kind: 'true-or-false',
            correctValue: true,
            feedback: 'Nina usa He’s from Canada para dizer de onde Leo é.',
          },
        },
      ],
    },
    {
      id: 'practice',
      kind: 'practice',
      title: 'Pratique apresentações',
      instructions:
        'Escolha o pronome, monte uma frase ou use uma expressão para continuar a conversa.',
      exercises: [
        {
          id: 'en-a1-introductions-meet-practice-intro',
          prompt:
            'Você diz “Esta é a Clara” ao apresentar a colega. Qual frase corresponde?',
          instructions: 'Escolha a apresentação.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'self',
              text: 'I’m Clara.',
            },
            {
              id: 'introduce',
              text: 'This is Clara.',
            },
            {
              id: 'question',
              text: 'Are you Clara?',
            },
          ],
          correctOptionId: 'introduce',
          feedback:
            'This is apresenta outra pessoa. I’m Clara seria a própria Clara se apresentando.',
        },
        {
          id: 'en-a1-introductions-meet-practice-he',
          prompt: 'Complete “Ele é do Canadá”.',
          instructions: 'Digite apenas o pronome.',
          kind: 'fill-in-the-blanks',
          blanks: [
            {
              id: 'response',
              before: '',
              after: ' is from Canada.',
              acceptedAnswers: ['He'],
            },
          ],
          feedback: 'He representa “ele” e combina com is.',
        },
        {
          id: 'en-a1-introductions-meet-practice-she-verb',
          prompt: 'Complete “Ela é brasileira”.',
          instructions: 'Digite apenas o verbo.',
          kind: 'fill-in-the-blanks',
          blanks: [
            {
              id: 'response',
              before: 'She',
              after: ' Brazilian.',
              acceptedAnswers: ['is'],
            },
          ],
          feedback: 'She combina com is para dizer a nacionalidade.',
        },
        {
          id: 'en-a1-introductions-meet-practice-she-city',
          prompt: 'Monte a frase “Ela é de Recife”.',
          instructions: 'Selecione os itens na ordem da frase.',
          kind: 'sentence-builder',
          tiles: [
            {
              id: 'from',
              text: 'from',
            },
            {
              id: 'recife',
              text: 'Recife.',
            },
            {
              id: 'shes',
              text: 'She’s',
            },
          ],
          correctOrder: ['shes', 'from', 'recife'],
          feedback: 'She’s vem antes de from. Depois vem o nome da cidade.',
        },
        {
          id: 'en-a1-introductions-meet-practice-pronouns',
          prompt: 'Associe cada pronome à tradução usada nesta aula.',
          instructions: 'Escolha uma tradução para cada pronome.',
          kind: 'matching-pairs',
          left: [
            {
              id: 'he',
              text: 'He',
            },
            {
              id: 'she',
              text: 'She',
            },
            {
              id: 'they',
              text: 'They',
            },
          ],
          right: [
            {
              id: 'she',
              text: 'Ela',
              language: 'pt-BR',
            },
            {
              id: 'they',
              text: 'Eles ou elas',
              language: 'pt-BR',
            },
            {
              id: 'he',
              text: 'Ele',
              language: 'pt-BR',
            },
          ],
          correctPairs: {
            he: 'he',
            she: 'she',
            they: 'they',
          },
          feedback:
            'He é “ele”, she é “ela” e aqui usamos they para “eles” ou “elas”.',
        },
        {
          id: 'en-a1-introductions-meet-practice-group',
          prompt:
            'Você fala de dois colegas brasileiros. Como dizer “Eles são do Brasil”?',
          instructions: 'Escolha a frase que fala dos dois colegas.',
          kind: 'multiple-choice',
          options: [
            {
              id: 'she',
              text: 'She’s from Brazil.',
            },
            {
              id: 'they',
              text: 'They’re from Brazil.',
            },
            {
              id: 'you',
              text: 'Are you from Brazil?',
            },
          ],
          correctOptionId: 'they',
          feedback:
            'Use they para falar dos dois colegas. They’re é a forma curta de they are.',
        },
        {
          id: 'en-a1-introductions-meet-practice-confirm',
          prompt: 'Monte a pergunta “Ela é do Canadá?”.',
          instructions: 'Selecione os itens na ordem da pergunta.',
          kind: 'sentence-builder',
          tiles: [
            {
              id: 'she',
              text: 'she',
            },
            {
              id: 'from',
              text: 'from',
            },
            {
              id: 'canada',
              text: 'Canada?',
            },
            {
              id: 'is',
              text: 'Is',
            },
          ],
          correctOrder: ['is', 'she', 'from', 'canada'],
          feedback:
            'Para perguntar, coloque is antes de she. Use from antes de Canada.',
        },
        {
          id: 'en-a1-introductions-meet-practice-agreement',
          prompt:
            'Para dizer “Eles são do Brasil”, a frase “They is from Brazil” está correta.',
          instructions: 'Indique se a afirmação é verdadeira ou falsa.',
          kind: 'true-or-false',
          correctValue: false,
          feedback:
            'They combina com are. Diga They are from Brazil ou They’re from Brazil.',
        },
      ],
    },
    {
      id: 'speaking',
      kind: 'speaking',
      title: 'Apresente alguém em voz alta',
      instructions:
        'Use os nomes de colegas ou invente nomes para praticar sem precisar de outra pessoa.',
      prompts: [
        {
          instruction: 'Apresente uma amiga pelo nome.',
          model: {
            text: 'This is my friend Clara.',
            translation: 'Esta é a minha amiga Clara.',
          },
        },
        {
          instruction: 'Fale da origem da pessoa que você apresentou.',
          model: {
            text: 'She’s from Recife.',
            translation: 'Ela é de Recife.',
          },
        },
        {
          instruction: 'Agora fale de duas pessoas.',
          model: {
            text: 'They’re from Brazil.',
            translation: 'Elas são do Brasil.',
          },
        },
      ],
    },
    {
      id: 'review',
      kind: 'review',
      title: 'Uma apresentação com dois passos',
      reminders: [
        'Comece com This is e o nome da pessoa.',
        'Para acrescentar a origem, diga he’s ou she’s para uma pessoa, ou they’re para duas ou mais nesta prática.',
        'Em perguntas de confirmação, is ou are vem antes do pronome.',
      ],
      examples: [
        {
          text: 'This is Leo. He’s from Canada.',
          translation: 'Este é o Leo. Ele é do Canadá.',
        },
      ],
    },
  ],
} satisfies AvailableLesson
