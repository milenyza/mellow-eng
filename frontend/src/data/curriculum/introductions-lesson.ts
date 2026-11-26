import { introductionsLessonMetadata } from './unit-one-metadata'
import { introductionsListening } from './introductions-listening'
import { introductionsExercises } from './introductions-exercises'
import type { AvailableLesson } from '@/types/curriculum'

export const introductionsLesson = {
  ...introductionsLessonMetadata,
  blocks: [
    {
      id: 'introduction',
      kind: 'introduction',
      title: 'Uma primeira conversa',
      paragraphs: [
        'Imagine que você chegou a um curso pela primeira vez. Alguém senta ao seu lado, diz oi e se apresenta. Você pode conversar em inglês usando poucas frases.',
        'Nesta aula, você vai começar pelo cumprimento, trocar nomes e terminar com uma despedida.',
      ],
    },
    {
      id: 'greetings',
      kind: 'vocabulary',
      title: 'Cumprimentar e se despedir',
      entries: [
        {
          id: 'hello',
          matchGroup: 'greeting-hello',
          expression: { text: 'Hello', translation: 'Olá' },
          example: {
            text: 'Hello, I’m Ana.',
            translation: 'Olá, eu sou a Ana.',
          },
          usage:
            'Um cumprimento que funciona em praticamente qualquer situação.',
        },
        {
          id: 'hi',
          matchGroup: 'greeting-hello',
          expression: { text: 'Hi', translation: 'Oi' },
          example: { text: 'Hi, Bruno!', translation: 'Oi, Bruno!' },
          usage: 'Uma opção informal, comum entre colegas.',
        },
        {
          id: 'good-morning',
          expression: { text: 'Good morning', translation: 'Bom dia' },
          example: {
            text: 'Good morning, Clara.',
            translation: 'Bom dia, Clara.',
          },
        },
        {
          id: 'good-afternoon',
          expression: { text: 'Good afternoon', translation: 'Boa tarde' },
          example: {
            text: 'Good afternoon, I’m Leo.',
            translation: 'Boa tarde, eu sou o Leo.',
          },
        },
        {
          id: 'good-evening',
          expression: { text: 'Good evening', translation: 'Boa noite' },
          example: {
            text: 'Good evening, everyone.',
            translation: 'Boa noite a todos.',
          },
          usage:
            'Use ao cumprimentar alguém à noite. Ao se despedir à noite, você também pode dizer “good night”.',
        },
        {
          id: 'goodbye',
          expression: { text: 'Goodbye', translation: 'Adeus / Tchau' },
          example: {
            text: 'Goodbye, everyone.',
            translation: 'Tchau, pessoal.',
          },
        },
        {
          id: 'see-you',
          expression: { text: 'See you', translation: 'Até mais' },
          example: { text: 'See you tomorrow!', translation: 'Até amanhã!' },
          usage:
            'Uma despedida informal. Você pode acrescentar quando espera ver a pessoa de novo.',
        },
      ],
    },
    {
      id: 'names',
      kind: 'vocabulary',
      title: 'Trocar nomes',
      entries: [
        {
          id: 'my-name-is',
          expression: { text: 'My name is…', translation: 'Meu nome é…' },
          example: { text: 'My name is Ana.', translation: 'Meu nome é Ana.' },
        },
        {
          id: 'whats-your-name',
          expression: {
            text: 'What’s your name?',
            translation: 'Qual é o seu nome?',
          },
          example: {
            text: 'Hello! What’s your name?',
            translation: 'Olá! Qual é o seu nome?',
          },
        },
        {
          id: 'nice-to-meet-you',
          expression: {
            text: 'Nice to meet you!',
            translation: 'Prazer em conhecer você!',
          },
          example: {
            text: 'Nice to meet you, Ana!',
            translation: 'Prazer em conhecer você, Ana!',
          },
          usage:
            'Diga isso quando conhecer alguém. Você pode responder “Nice to meet you, too!”.',
        },
      ],
    },
    {
      id: 'pronouns',
      kind: 'grammar',
      title: 'Eu, você e o verbo to be',
      explanation:
        'Em inglês, geralmente dizemos quem é o sujeito da frase. Ao se apresentar, use I (eu) com am. Ao falar diretamente com alguém, use you (você) com are. Nesses exemplos, o verbo to be tem o sentido de ser.',
      patterns: [
        {
          note: 'I sempre se escreve com letra maiúscula. I’m é a forma curta de I am.',
          example: { text: 'I’m Ana.', translation: 'Eu sou a Ana.' },
        },
        {
          note: 'You usa are. Em uma pergunta de confirmação, are vem antes de you.',
          example: { text: 'Are you Leo?', translation: 'Você é o Leo?' },
        },
        {
          note: 'My significa meu ou minha. Em My name is, o sujeito é my name (meu nome) e usamos is.',
          example: { text: 'My name is Ana.', translation: 'Meu nome é Ana.' },
        },
      ],
    },
    {
      id: 'dialogue',
      kind: 'dialogue',
      title: 'Antes da primeira aula',
      context:
        'Ana e Leo chegam para uma aula à noite. Eles se apresentam antes de entrar.',
      lines: [
        {
          speaker: 'Ana',
          text: 'Good evening! My name is Ana. What’s your name?',
          translation: 'Boa noite! Meu nome é Ana. Qual é o seu nome?',
        },
        {
          speaker: 'Leo',
          text: 'Hi, Ana! I’m Leo. Nice to meet you!',
          translation: 'Oi, Ana! Eu sou o Leo. Prazer em conhecer você!',
        },
        {
          speaker: 'Ana',
          text: 'Nice to meet you, too!',
          translation: 'Prazer em conhecer você também!',
        },
        {
          speaker: 'Leo',
          text: 'See you in class!',
          translation: 'Até mais, na sala!',
        },
      ],
    },
    {
      id: 'listening',
      kind: 'listening',
      title: 'Identifique o cumprimento',
      instructions:
        'Ouça expressões e conversas curtas. Você pode repetir o áudio ou reduzir a velocidade. Depois, confira sua resposta.',
      activities: introductionsListening,
    },
    {
      id: 'practice',
      kind: 'practice',
      title: 'Pratique uma primeira conversa',
      instructions:
        'Use o que você já estudou. Confira cada resposta e, se precisar, tente de novo ou revise a explicação para seguir.',
      exercises: introductionsExercises,
    },
    {
      id: 'speaking',
      kind: 'speaking',
      title: 'Experimente falar em voz alta',
      instructions:
        'Ouça os modelos e repita no seu ritmo. Na primeira frase, troque Ana pelo seu nome.',
      prompts: [
        {
          instruction: 'Cumprimente e diga seu nome.',
          model: {
            text: 'Hello! My name is Ana.',
            translation: 'Olá! Meu nome é Ana.',
          },
        },
        {
          instruction: 'Pergunte o nome da outra pessoa.',
          model: {
            text: 'What’s your name?',
            translation: 'Qual é o seu nome?',
          },
        },
        {
          instruction: 'Mostre que gostou de conhecer a pessoa e se despeça.',
          model: {
            text: 'Nice to meet you! See you!',
            translation: 'Prazer em conhecer você! Até mais!',
          },
        },
      ],
    },
    {
      id: 'review',
      kind: 'review',
      title: 'O que levar desta conversa',
      reminders: [
        'Você pode usar “hello” ou “hi” para começar. De manhã, à tarde ou à noite, escolha um cumprimento que combine com o horário.',
        'Para dizer seu nome, comece com “my name is” ou “I’m”.',
        'Quando estiver indo embora, diga “goodbye” ou “see you”.',
      ],
      examples: [
        {
          text: 'Hi! I’m Ana. Nice to meet you!',
          translation: 'Oi! Eu sou a Ana. Prazer em conhecer você!',
        },
      ],
    },
  ],
} satisfies AvailableLesson
