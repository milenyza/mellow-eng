import type { ListeningBlock } from '@/types/lesson-content'

export const introductionsListening = [
  {
    format: 'listen-and-choose',
    source: {
      kind: 'speech',
      language: 'en-US',
      parts: [
        {
          id: 'greeting',
          text: 'Good morning, Clara!',
          translation: 'Bom dia, Clara!',
        },
      ],
    },
    textAlternative:
      'Uma colega encontra Clara quando chega ao curso às 9 horas da manhã e a cumprimenta.',
    exercise: {
      id: 'en-a1-introductions-listening-time',
      kind: 'multiple-choice',
      prompt: 'Em que período do dia acontece o cumprimento?',
      instructions: 'Escolha o período que combina com a situação.',
      options: [
        { id: 'morning', text: 'De manhã', language: 'pt-BR' },
        { id: 'afternoon', text: 'À tarde', language: 'pt-BR' },
        { id: 'evening', text: 'À noite', language: 'pt-BR' },
      ],
      correctOptionId: 'morning',
      hint: 'Preste atenção na palavra que acompanha “good”.',
      feedback:
        'Good morning quer dizer “bom dia”. É o cumprimento usado pela manhã.',
    },
  },
  {
    format: 'listen-and-choose',
    source: {
      kind: 'speech',
      language: 'en-US',
      parts: [
        {
          id: 'farewell',
          text: 'See you tomorrow, Ana!',
          translation: 'Até amanhã, Ana!',
        },
      ],
    },
    textAlternative:
      'No fim do curso, uma colega avisa à Ana que verá a turma de novo no dia seguinte.',
    exercise: {
      id: 'en-a1-introductions-listening-farewell',
      kind: 'multiple-choice',
      prompt: 'O que a pessoa está fazendo?',
      instructions: 'Escolha a opção que descreve a situação.',
      options: [
        {
          id: 'introducing',
          text: 'Dizendo o próprio nome',
          language: 'pt-BR',
        },
        { id: 'leaving', text: 'Despedindo-se', language: 'pt-BR' },
        {
          id: 'asking',
          text: 'Perguntando o nome de alguém',
          language: 'pt-BR',
        },
      ],
      correctOptionId: 'leaving',
      feedback:
        'See you é uma despedida. Com tomorrow, a expressão significa “até amanhã”.',
    },
  },
  {
    format: 'listen-and-write',
    source: {
      kind: 'speech',
      language: 'en-US',
      parts: [
        { id: 'afternoon', text: 'Good afternoon!', translation: 'Boa tarde!' },
      ],
    },
    textAlternative:
      'Você chega à recepção às 15 horas. Escreva em inglês o cumprimento que corresponde a “boa tarde”.',
    exercise: {
      id: 'en-a1-introductions-listening-write-greeting',
      kind: 'fill-in-the-blanks',
      prompt: 'Qual é o cumprimento em inglês?',
      instructions:
        'Digite a expressão completa. O ponto de exclamação é opcional.',
      blanks: [
        {
          id: 'expression',
          before: '',
          after: '',
          acceptedAnswers: ['Good afternoon!', 'Good afternoon'],
        },
      ],
      feedback:
        'Good afternoon é o cumprimento usado à tarde. Escrevemos good e afternoon como duas palavras.',
    },
  },
  {
    format: 'listen-and-write',
    source: {
      kind: 'speech',
      language: 'en-US',
      parts: [
        {
          id: 'ask-name',
          text: 'What’s your name?',
          translation: 'Qual é o seu nome?',
        },
      ],
    },
    textAlternative:
      'Você acaba de conhecer alguém e quer perguntar “Qual é o seu nome?”. Escreva a pergunta em inglês usando a forma curta.',
    exercise: {
      id: 'en-a1-introductions-listening-write-name',
      kind: 'fill-in-the-blanks',
      prompt: 'Como perguntar o nome de alguém em inglês?',
      instructions:
        'Digite a pergunta na forma curta, com apóstrofo. O ponto de interrogação é opcional.',
      blanks: [
        {
          id: 'expression',
          before: '',
          after: '',
          acceptedAnswers: [
            'What’s your name?',
            'What’s your name',
            "What's your name?",
            "What's your name",
          ],
        },
      ],
      feedback:
        'What’s your name? é a pergunta usada para saber o nome de alguém. O apóstrofo faz parte da forma curta what’s.',
    },
  },
  {
    format: 'dialogue-comprehension',
    source: {
      kind: 'speech',
      language: 'en-US',
      parts: [
        {
          id: 'bruno',
          speaker: 'Bruno',
          text: 'Hi! I’m Bruno. What’s your name?',
          translation: 'Oi! Eu sou o Bruno. Qual é o seu nome?',
        },
        {
          id: 'clara',
          speaker: 'Clara',
          text: 'Hello, Bruno. My name is Clara. Nice to meet you!',
          translation: 'Olá, Bruno. Meu nome é Clara. Prazer em conhecer você!',
        },
      ],
    },
    textAlternative:
      'Na chegada a um curso, Bruno se apresenta e quer saber com quem está falando. Clara diz o próprio nome e responde com uma expressão cordial de primeiro encontro.',
    exercise: {
      id: 'en-a1-introductions-listening-dialogue-names',
      kind: 'multiple-choice',
      prompt: 'Por que Bruno faz uma pergunta?',
      instructions: 'Escolha o objetivo da pergunta na conversa.',
      options: [
        {
          id: 'ask-name',
          text: 'Para descobrir o nome de Clara',
          language: 'pt-BR',
        },
        {
          id: 'say-goodbye',
          text: 'Para se despedir de Clara',
          language: 'pt-BR',
        },
        {
          id: 'confirm-time',
          text: 'Para saber se já é noite',
          language: 'pt-BR',
        },
      ],
      correctOptionId: 'ask-name',
      feedback:
        'Bruno pergunta What’s your name? para saber o nome de Clara. Ela responde My name is Clara, ou “Meu nome é Clara”.',
    },
  },
  {
    format: 'dialogue-comprehension',
    source: {
      kind: 'speech',
      language: 'en-US',
      parts: [
        {
          id: 'clara',
          speaker: 'Clara',
          text: 'Goodbye, Bruno!',
          translation: 'Tchau, Bruno!',
        },
        {
          id: 'bruno',
          speaker: 'Bruno',
          text: 'See you tomorrow, Clara!',
          translation: 'Até amanhã, Clara!',
        },
      ],
    },
    textAlternative:
      'A aula terminou. Clara vai embora, e Bruno indica que eles se verão no dia seguinte.',
    exercise: {
      id: 'en-a1-introductions-listening-dialogue-goodbye',
      kind: 'true-or-false',
      prompt: 'Clara e Bruno estão se cumprimentando ao chegar.',
      instructions: 'Indique se a afirmação descreve a conversa.',
      correctValue: false,
      feedback:
        'Clara diz Goodbye, e Bruno responde See you tomorrow. As duas expressões são de despedida.',
    },
  },
] satisfies ListeningBlock['activities']
