import type {
  SentenceChallenge,
  SentenceContentReference,
} from '@/types/sentence-builder'
import { sentenceChallengeMetadata } from './sentence-metadata'

export { sentenceTopics } from './sentence-metadata'

const intro = {
  kind: 'lesson',
  lessonId: 'en-a1-introductions-hello',
  blockId: 'pronouns',
} as const
const personal = {
  kind: 'lesson',
  lessonId: 'en-a1-introductions-about-me',
  blockId: 'grammar',
} as const
const origin = {
  kind: 'lesson',
  lessonId: 'en-a1-introductions-from',
  blockId: 'grammar',
} as const
const friend = {
  kind: 'lesson',
  lessonId: 'en-a1-introductions-meet',
  blockId: 'grammar',
} as const

const nameRule = 'A ordem é “my name”, depois “is” e então o nome.'
const originRule =
  'Use o sujeito, uma forma de “to be” e “from” antes do lugar.'
const notRule =
  'Coloque “not” logo depois da forma de “to be”. Para indicar origem, mantenha “from” antes do lugar.'
const questionRule =
  'Em perguntas de sim ou não, coloque “to be” antes do sujeito.'
const friendRule =
  'Use “this is” para apresentar alguém. “My friend” indica a relação com você.'

function challenge(
  id: keyof typeof sentenceChallengeMetadata,
  difficulty: SentenceChallenge['difficulty'],
  prompt: string,
  feedback: string,
  reference: SentenceContentReference,
  extras: Pick<SentenceChallenge, 'distractors' | 'alternatives' | 'hint'> = {},
): SentenceChallenge {
  return {
    id,
    difficulty,
    ...sentenceChallengeMetadata[id],
    prompt,
    feedback,
    reference,
    ...extras,
  }
}

export const sentenceChallenges: readonly SentenceChallenge[] = [
  challenge(
    'name-ana',
    'easy',
    'Em uma apresentação, diga “Meu nome é Ana”.',
    nameRule,
    intro,
  ),
  challenge(
    'name-leo',
    'easy',
    'Na primeira aula, diga “Meu nome é Leo”.',
    nameRule,
    personal,
  ),
  challenge(
    'meet-you',
    'easy',
    'Você acaba de conhecer alguém. Diga “Prazer em conhecer você”.',
    '“Nice to meet you” é uma expressão fixa usada ao conhecer alguém.',
    intro,
  ),
  challenge(
    'morning-clara',
    'easy',
    'Cumprimente Clara com “Bom dia, Clara!”',
    'Em “good morning”, “good” vem antes de “morning”.',
    { ...intro, blockId: 'greetings' },
  ),
  challenge(
    'clara-intro',
    'easy',
    'Apresente-se dizendo “Eu sou Clara”. Use a forma sem contração.',
    'Com “I”, use “am” antes do nome.',
    intro,
  ),
  challenge(
    'he-from-canada',
    'easy',
    'Diga “Ele é do Canadá”. Use a forma sem contração.',
    originRule,
    friend,
  ),
  challenge(
    'she-brazilian',
    'easy',
    'Diga “Ela é brasileira”. Use a forma sem contração.',
    'Com “she”, use “is” antes da nacionalidade.',
    friend,
  ),
  challenge(
    'they-from-brazil',
    'easy',
    'Diga “Eles são do Brasil”. Use a forma sem contração.',
    'Com “they”, use “are”. “From” introduz o país.',
    friend,
  ),
  challenge(
    'i-from-recife',
    'easy',
    'Diga “Eu sou de Recife”. Use a forma sem contração.',
    originRule,
    personal,
  ),
  challenge(
    'not-from-mexico',
    'easy',
    'Diga “Eu não sou do México”. Use a contração de “I am”.',
    notRule,
    personal,
  ),
  challenge(
    'not-from-brazil',
    'easy',
    'Diga “Eu não sou do Brasil”. Use a forma sem contração.',
    notRule,
    personal,
  ),
  challenge(
    'he-not-canadian',
    'easy',
    'Diga “Ele não é canadense”. Use a forma sem contração.',
    notRule,
    friend,
  ),
  challenge(
    'she-not-mexican',
    'easy',
    'Diga “Ela não é mexicana”. Use a forma sem contração.',
    notRule,
    origin,
  ),
  challenge(
    'they-not-canadian',
    'easy',
    'Diga “Eles não são canadenses”. Use a forma sem contração.',
    notRule,
    friend,
  ),
  challenge('ask-leo', 'easy', 'Pergunte “Você é o Leo?”', questionRule, intro),
  challenge(
    'ask-name',
    'easy',
    'Pergunte “Qual é o seu nome?” Use a forma sem contração.',
    'Comece com “what is”, seguido de “your name”.',
    intro,
  ),
  challenge(
    'ask-from',
    'easy',
    'Pergunte “De onde você é?”',
    'Use “where” no início e “from” no final. Na pergunta, “are” vem antes de “you”.',
    origin,
  ),
  challenge(
    'ask-canada',
    'easy',
    'Pergunte “Você é do Canadá?”',
    questionRule,
    personal,
  ),
  challenge(
    'ask-she-recife',
    'easy',
    'Pergunte “Ela é de Recife?”',
    questionRule,
    friend,
  ),
  challenge(
    'ask-they-mexican',
    'easy',
    'Pergunte “Eles são mexicanos?”',
    questionRule,
    origin,
  ),

  challenge(
    'hi-ana',
    'medium',
    'Diga “Oi, meu nome é Ana”. A saudação pode vir antes ou depois do nome.',
    nameRule,
    intro,
    {
      alternatives: ['My name is Ana. Hi!'],
      hint: 'Mantenha “my name is” junto.',
    },
  ),
  challenge(
    'meet-clara',
    'medium',
    'Diga “Prazer em conhecer você, Clara!”',
    'Mantenha “nice to meet you” junto e acrescente o nome de Clara ao final.',
    { ...friend, blockId: 'dialogue' },
  ),
  challenge(
    'introduce-friend',
    'medium',
    'Apresente alguém dizendo “Este é o meu amigo Leo”.',
    friendRule,
    friend,
  ),
  challenge(
    'introduce-clara',
    'medium',
    'Apresente sua amiga dizendo “Esta é a minha amiga Clara”.',
    friendRule,
    friend,
  ),
  challenge(
    'hello-clara',
    'medium',
    'Diga “Olá, meu nome é Clara”. Use “hello” no começo.',
    nameRule,
    intro,
  ),
  challenge(
    'rain-this-morning',
    'medium',
    'Diga “Está chovendo hoje de manhã”. A expressão de tempo pode vir no começo ou no final.',
    '“It is raining” descreve o tempo. “This morning” indica quando e pode aparecer antes ou depois.',
    {
      kind: 'story',
      storyId: 'a-rainy-morning',
      chapterId: 'rain-at-the-window',
      paragraphId: 'morning-rain',
    },
    { alternatives: ['This morning, it is raining.'] },
  ),
  challenge(
    'not-he-brazil',
    'medium',
    'Diga “Ele não é do Brasil”. Use a forma sem contração.',
    notRule,
    friend,
  ),
  challenge(
    'not-she-canada',
    'medium',
    'Diga “Ela não é do Canadá”. Use a forma sem contração.',
    notRule,
    friend,
  ),
  challenge(
    'not-they-recife',
    'medium',
    'Diga “Eles não são de Recife”. Use a forma sem contração.',
    notRule,
    friend,
  ),
  challenge(
    'not-i-recife',
    'medium',
    'Diga “Eu não sou de Recife”. Use a forma sem contração.',
    notRule,
    personal,
  ),
  challenge(
    'ask-her-canada',
    'medium',
    'Pergunte sobre sua colega diretamente ao Leo. Diga “Ela é do Canadá, Leo?” Ponha o nome no final.',
    questionRule,
    friend,
  ),
  challenge(
    'ask-friend-canadian',
    'medium',
    'Pergunte “Sua amiga Clara é canadense?”',
    questionRule,
    friend,
  ),
  challenge(
    'ask-where-clara',
    'medium',
    'Pergunte diretamente “Clara, de onde você é?” Diga o nome primeiro.',
    'Depois do nome, use “where are you from?” para perguntar a origem.',
    origin,
  ),
  challenge(
    'ask-your-friend-from',
    'medium',
    'Pergunte “De onde é o seu amigo?”',
    '“Where” vem primeiro, “is” vem antes de “your friend” e “from” fica no fim.',
    friend,
  ),
  challenge(
    'ask-if-my-friend-from',
    'medium',
    'Pergunte “Meu amigo Leo é do Canadá?”',
    questionRule,
    friend,
  ),
  challenge(
    'repeat-from',
    'medium',
    'Diga “Ele é do Brasil, não do Canadá”. Repita a preposição de origem na segunda parte.',
    '“He is from Brazil” informa a origem. Use “not from Canada” para negar a segunda origem.',
    personal,
  ),

  challenge(
    'hard-intro-canada',
    'hard',
    'Apresente a pessoa com “Este é o meu amigo Leo do Canadá”.',
    'Use “this is” para apresentar Leo e “from Canada” para indicar sua origem.',
    friend,
    {
      distractors: ['are'],
      alternatives: ['This is Leo, my friend from Canada.'],
    },
  ),
  challenge(
    'hard-intro-recife',
    'hard',
    'Apresente a pessoa com “Esta é a minha amiga Clara de Recife”.',
    '“This is” apresenta Clara. “From Recife” informa de onde ela é.',
    friend,
    {
      distractors: ['am'],
      alternatives: ['This is Clara, my friend from Recife.'],
    },
  ),
  challenge(
    'hard-friend-affirmative',
    'hard',
    'Diga “Meu amigo Leo é do Canadá”.',
    '“My friend Leo” é o sujeito. Use “is” e complete com “from Canada”.',
    friend,
    { distractors: ['are'] },
  ),
  challenge(
    'hard-friend-clara-affirmative',
    'hard',
    'Diga “Minha amiga Clara é do Brasil”.',
    'Com uma só pessoa, use “is” antes de “from Brazil”.',
    friend,
    { distractors: ['am'] },
  ),
  challenge(
    'hard-friend-negative',
    'hard',
    'Diga “Meu amigo Leo não é do México”.',
    notRule,
    friend,
    { distractors: ['are'] },
  ),
  challenge(
    'hard-friend-clara-negative',
    'hard',
    'Diga “Minha amiga Clara não é do Canadá”.',
    notRule,
    friend,
    { distractors: ['am'] },
  ),
  challenge(
    'hard-your-friend-negative',
    'hard',
    'Diga “Seu amigo Leo não é brasileiro”.',
    'Depois do sujeito singular, use “is not” antes da nacionalidade.',
    friend,
    { distractors: ['are'] },
  ),
  challenge(
    'hard-your-friend-clara-negative',
    'hard',
    'Diga “Sua amiga Clara não é canadense”.',
    'Use “is not” para negar a nacionalidade de Clara.',
    friend,
    { distractors: ['am'] },
  ),
  challenge(
    'hard-where-your-friend',
    'hard',
    'Pergunte “De onde é a sua amiga Clara?”',
    'Use “where is”, depois o sujeito e por fim “from”.',
    friend,
    { distractors: ['are'], hint: 'O sujeito é “your friend Clara”.' },
  ),
  challenge(
    'hard-ask-friend-mexico',
    'hard',
    'Pergunte “Seu amigo Leo é do México?”',
    questionRule,
    friend,
    { distractors: ['am'] },
  ),
  challenge(
    'hard-ask-friend-brazil',
    'hard',
    'Pergunte “Sua amiga Clara é do Brasil?”',
    questionRule,
    friend,
    { distractors: ['are'] },
  ),
  challenge(
    'hard-ask-my-friend',
    'hard',
    'Pergunte “Meu amigo Leo é de Recife?”',
    questionRule,
    friend,
    { distractors: ['am'] },
  ),
]
