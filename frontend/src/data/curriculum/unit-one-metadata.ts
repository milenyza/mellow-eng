import type { LessonMetadata } from '@/types/curriculum'

export const introductionsLessonMetadata = {
  id: 'en-a1-introductions-hello',
  title: 'Hello, nice to meet you!',
  description: 'Dê os primeiros passos em uma conversa de apresentação.',
  objectives: [
    'Escolher um cumprimento de acordo com o momento do dia.',
    'Apresentar-se pelo nome e perguntar o nome de outra pessoa.',
    'Despedir-se em uma conversa curta.',
  ],
  durationMinutes: 15,
  focus: 'Cumprimentos e apresentações com I am, you are e my name is.',
  availability: 'available',
  activities: [],
} as const satisfies LessonMetadata

export const originsLessonMetadata = {
  id: 'en-a1-introductions-from',
  title: 'Where are you from?',
  description: 'Converse sobre sua origem e a de outras pessoas.',
  objectives: ['Perguntar de onde alguém é', 'Responder com cidade ou país'],
  durationMinutes: 16,
  focus: 'Perguntas com where e verbo to be',
  availability: 'available',
  activities: [],
} as const satisfies LessonMetadata

export const introducingAFriendLessonMetadata = {
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
} as const satisfies LessonMetadata

export const personalIntroductionLessonMetadata = {
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
} as const satisfies LessonMetadata
