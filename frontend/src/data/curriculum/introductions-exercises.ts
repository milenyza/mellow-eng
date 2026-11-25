import type { PracticeBlock } from '@/types/lesson-content'

export const introductionsExercises = [
  {
    id: 'en-a1-introductions-exercise-morning',
    kind: 'multiple-choice',
    instructions: 'Escolha um cumprimento.',
    prompt: 'São 9 da manhã e você acaba de chegar ao curso. O que pode dizer?',
    options: [
      { id: 'afternoon', text: 'Good afternoon!' },
      { id: 'morning', text: 'Good morning!' },
      { id: 'goodbye', text: 'Goodbye!' },
    ],
    correctOptionId: 'morning',
    hint: 'Pense no período entre acordar e o meio-dia.',
    feedback:
      'Good morning significa “bom dia” e é usado ao cumprimentar alguém pela manhã.',
  },
  {
    id: 'en-a1-introductions-exercise-name',
    kind: 'fill-in-the-blanks',
    instructions: 'Digite apenas a palavra que falta em inglês.',
    prompt: 'Complete a apresentação de Leo, que está dizendo o próprio nome.',
    blanks: [
      {
        id: 'verb',
        before: 'My name',
        after: ' Leo.',
        acceptedAnswers: ['is'],
      },
    ],
    feedback:
      'Em My name is, o sujeito é my name (meu nome). Com essa expressão, usamos is.',
  },
  {
    id: 'en-a1-introductions-exercise-ask-name',
    kind: 'sentence-builder',
    instructions:
      'Selecione as palavras na ordem da pergunta. Para retirar uma palavra, selecione-a de novo.',
    prompt: 'Monte a pergunta “Qual é o seu nome?”',
    tiles: [
      { id: 'name', text: 'name?' },
      { id: 'whats', text: 'What’s' },
      { id: 'your', text: 'your' },
    ],
    correctOrder: ['whats', 'your', 'name'],
    feedback:
      'Comece com What’s e termine com your name. A expressão your name significa “seu nome”.',
  },
  {
    id: 'en-a1-introductions-exercise-greetings',
    kind: 'matching-pairs',
    instructions: 'Escolha uma tradução para cada expressão.',
    prompt: 'Associe os cumprimentos ao seu significado.',
    left: [
      { id: 'morning', text: 'Good morning' },
      { id: 'afternoon', text: 'Good afternoon' },
      { id: 'evening', text: 'Good evening' },
    ],
    right: [
      { id: 'night', text: 'Boa noite' },
      { id: 'morning', text: 'Bom dia' },
      { id: 'afternoon', text: 'Boa tarde' },
    ],
    correctPairs: {
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'night',
    },
    feedback:
      'Morning corresponde à manhã, afternoon à tarde e evening ao período da noite em que você está cumprimentando alguém.',
  },
  {
    id: 'en-a1-introductions-exercise-farewell',
    kind: 'true-or-false',
    instructions: 'Escolha verdadeiro ou falso.',
    prompt: '“See you” é uma forma informal de se despedir.',
    correctValue: true,
    feedback:
      'See you equivale a “até mais” e funciona como despedida entre colegas.',
  },
  {
    id: 'en-a1-introductions-exercise-first-meeting',
    kind: 'multiple-choice',
    instructions: 'Escolha a frase que combina com a situação.',
    prompt:
      'Uma colega acaba de se apresentar. Como dizer “Prazer em conhecer você”?',
    options: [
      { id: 'morning', text: 'Good morning!' },
      { id: 'farewell', text: 'See you!' },
      { id: 'meet', text: 'Nice to meet you!' },
    ],
    correctOptionId: 'meet',
    feedback:
      'Nice to meet you é o que você pode dizer logo depois de conhecer alguém e ouvir seu nome.',
  },
  {
    id: 'en-a1-introductions-exercise-i-am',
    kind: 'fill-in-the-blanks',
    instructions:
      'Digite o trecho que falta em inglês. Você pode usar a forma curta ou completa.',
    prompt: 'Ana quer dizer “Eu sou a Ana”. Complete a frase.',
    blanks: [
      {
        id: 'subject-verb',
        before: '',
        after: ' Ana.',
        acceptedAnswers: ['I am', 'I’m', "I'm"],
      },
    ],
    feedback:
      'Para dizer quem você é, use I am antes do seu nome. I’m é a forma curta e passa a mesma ideia.',
  },
  {
    id: 'en-a1-introductions-exercise-confirm-name',
    kind: 'sentence-builder',
    instructions: 'Selecione as palavras na ordem da pergunta.',
    prompt:
      'Você acha que a pessoa se chama Leo. Monte a pergunta “Você é o Leo?”',
    tiles: [
      { id: 'you', text: 'you' },
      { id: 'leo', text: 'Leo?' },
      { id: 'are', text: 'Are' },
    ],
    correctOrder: ['are', 'you', 'leo'],
    hint: 'Na pergunta de confirmação, o verbo vem antes de you.',
    feedback:
      'Para confirmar se alguém é Leo, comece com Are you. A pergunta completa é Are you Leo?',
  },
  {
    id: 'en-a1-introductions-exercise-conversation-pairs',
    kind: 'matching-pairs',
    instructions: 'Escolha uma tradução para cada expressão.',
    prompt: 'Revise algumas expressões que cabem numa primeira conversa.',
    left: [
      { id: 'hi', text: 'Hi' },
      { id: 'goodbye', text: 'Goodbye' },
      { id: 'meet', text: 'Nice to meet you!' },
    ],
    right: [
      { id: 'bye', text: 'Tchau' },
      { id: 'meet', text: 'Prazer em conhecer você!' },
      { id: 'hi', text: 'Oi' },
    ],
    correctPairs: { hi: 'hi', goodbye: 'bye', meet: 'meet' },
    feedback:
      'Hi abre a conversa, Nice to meet you combina com uma primeira apresentação e Goodbye encerra a conversa.',
  },
  {
    id: 'en-a1-introductions-exercise-to-be',
    kind: 'true-or-false',
    instructions: 'Escolha verdadeiro ou falso.',
    prompt: '“I are Ana” é uma forma correta de dizer “Eu sou a Ana”.',
    correctValue: false,
    feedback:
      'Use am com I. Para se apresentar, diga I am Ana ou I’m Ana. Em uma frase com you, usamos are.',
  },
] satisfies PracticeBlock['exercises']
