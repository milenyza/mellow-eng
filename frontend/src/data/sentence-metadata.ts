import type {
  SentenceTopic,
  SentenceTopicSelection,
} from '@/types/sentence-builder'

export const sentenceTopics: Record<SentenceTopicSelection, string> = {
  mixed: 'Prática mista',
  introductions: 'Cumprimentos e apresentações',
  pronouns: 'Pronomes pessoais',
  'to-be': 'Verbo to be',
  origins: 'Países e nacionalidades',
  affirmative: 'Frases afirmativas',
  negative: 'Frases negativas',
  questions: 'Perguntas básicas',
}

const greeting = ['introductions'] as const
const statement = ['pronouns', 'to-be', 'affirmative'] as const
const negative = ['negative', 'pronouns', 'to-be', 'origins'] as const
const question = ['questions', 'pronouns', 'to-be'] as const
const placeQuestion = ['questions', 'pronouns', 'to-be', 'origins'] as const
const placeStatement = ['origins', ...statement] as const
const friendStatement = ['introductions', 'to-be', 'affirmative'] as const

export const sentenceChallengeMetadata = {
  'name-ana': {
    topics: [...greeting, 'affirmative'],
    sentence: 'My name is Ana.',
  },
  'name-leo': {
    topics: [...greeting, 'affirmative'],
    sentence: 'My name is Leo.',
  },
  'meet-you': { topics: greeting, sentence: 'Nice to meet you!' },
  'morning-clara': { topics: greeting, sentence: 'Good morning, Clara!' },
  'clara-intro': {
    topics: [...greeting, 'affirmative', 'pronouns', 'to-be'],
    sentence: 'I am Clara.',
  },
  'he-from-canada': { topics: placeStatement, sentence: 'He is from Canada.' },
  'she-brazilian': { topics: placeStatement, sentence: 'She is Brazilian.' },
  'they-from-brazil': {
    topics: placeStatement,
    sentence: 'They are from Brazil.',
  },
  'i-from-recife': { topics: placeStatement, sentence: 'I am from Recife.' },
  'not-from-mexico': { topics: negative, sentence: 'I’m not from Mexico.' },
  'not-from-brazil': { topics: negative, sentence: 'I am not from Brazil.' },
  'he-not-canadian': { topics: negative, sentence: 'He is not Canadian.' },
  'she-not-mexican': { topics: negative, sentence: 'She is not Mexican.' },
  'they-not-canadian': { topics: negative, sentence: 'They are not Canadian.' },
  'ask-leo': { topics: question, sentence: 'Are you Leo?' },
  'ask-name': {
    topics: ['questions', 'introductions', 'to-be'],
    sentence: 'What is your name?',
  },
  'ask-from': { topics: placeQuestion, sentence: 'Where are you from?' },
  'ask-canada': { topics: placeQuestion, sentence: 'Are you from Canada?' },
  'ask-she-recife': { topics: placeQuestion, sentence: 'Is she from Recife?' },
  'ask-they-mexican': { topics: placeQuestion, sentence: 'Are they Mexican?' },
  'hi-ana': { topics: greeting, sentence: 'Hi, my name is Ana.' },
  'meet-clara': { topics: greeting, sentence: 'Nice to meet you, Clara!' },
  'introduce-friend': {
    topics: friendStatement,
    sentence: 'This is my friend Leo.',
  },
  'introduce-clara': {
    topics: friendStatement,
    sentence: 'This is my friend Clara.',
  },
  'hello-clara': {
    topics: [...greeting, 'affirmative', 'pronouns', 'to-be'],
    sentence: 'Hello, my name is Clara.',
  },
  'rain-this-morning': {
    topics: statement,
    sentence: 'It is raining this morning.',
  },
  'not-he-brazil': { topics: negative, sentence: 'He is not from Brazil.' },
  'not-she-canada': { topics: negative, sentence: 'She is not from Canada.' },
  'not-they-recife': {
    topics: negative,
    sentence: 'They are not from Recife.',
  },
  'not-i-recife': { topics: negative, sentence: 'I am not from Recife.' },
  'ask-her-canada': {
    topics: placeQuestion,
    sentence: 'Is she from Canada, Leo?',
  },
  'ask-friend-canadian': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Is your friend Clara Canadian?',
  },
  'ask-where-clara': {
    topics: placeQuestion,
    sentence: 'Clara, where are you from?',
  },
  'ask-your-friend-from': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Where is your friend from?',
  },
  'ask-if-my-friend-from': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Is my friend Leo from Canada?',
  },
  'repeat-from': {
    topics: negative,
    sentence: 'He is from Brazil, not from Canada.',
  },
  'hard-intro-canada': {
    topics: [...friendStatement, 'origins'],
    sentence: 'This is my friend Leo from Canada.',
  },
  'hard-intro-recife': {
    topics: [...friendStatement, 'origins'],
    sentence: 'This is my friend Clara from Recife.',
  },
  'hard-friend-affirmative': {
    topics: [...friendStatement, 'origins'],
    sentence: 'My friend Leo is from Canada.',
  },
  'hard-friend-clara-affirmative': {
    topics: [...friendStatement, 'origins'],
    sentence: 'My friend Clara is from Brazil.',
  },
  'hard-friend-negative': {
    topics: ['negative', 'to-be', 'origins'],
    sentence: 'My friend Leo is not from Mexico.',
  },
  'hard-friend-clara-negative': {
    topics: ['negative', 'to-be', 'origins'],
    sentence: 'My friend Clara is not from Canada.',
  },
  'hard-your-friend-negative': {
    topics: ['negative', 'to-be', 'origins'],
    sentence: 'Your friend Leo is not Brazilian.',
  },
  'hard-your-friend-clara-negative': {
    topics: ['negative', 'to-be', 'origins'],
    sentence: 'Your friend Clara is not Canadian.',
  },
  'hard-where-your-friend': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Where is your friend Clara from?',
  },
  'hard-ask-friend-mexico': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Is your friend Leo from Mexico?',
  },
  'hard-ask-friend-brazil': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Is your friend Clara from Brazil?',
  },
  'hard-ask-my-friend': {
    topics: ['questions', 'to-be', 'origins'],
    sentence: 'Is my friend Leo from Recife?',
  },
} as const satisfies Record<
  string,
  { topics: readonly [SentenceTopic, ...SentenceTopic[]]; sentence: string }
>
