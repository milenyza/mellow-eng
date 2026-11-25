import { sentenceBuilderGame } from '@/data/games'
import { findCourseLesson } from '@/services/curriculum'
import {
  evaluateSentenceOrder,
  normalizeTextAnswer,
} from '@/services/exercise-evaluation'
import { shuffle } from '@/services/shuffle'
import type { Course } from '@/types/curriculum'
import type { ExerciseOption, SentenceBuilderExercise } from '@/types/exercise'
import type { Story } from '@/types/story'
import type {
  PreparedSentenceChallenge,
  SentenceChallenge,
  SentenceDifficulty,
  SentenceTopicSelection,
} from '@/types/sentence-builder'

const wordLimits = {
  easy: [3, 5],
  medium: [5, 8],
  hard: [6, 10],
} satisfies Record<SentenceDifficulty, readonly [number, number]>

function words(sentence: string) {
  return sentence
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[,.!?;:]+$/g, ''))
}

function wordKey(word: string) {
  return normalizeTextAnswer(word).replaceAll('’', "'")
}

function mapOrder(sentence: string, wordsWithIds: readonly ExerciseOption[]) {
  const unused = [...wordsWithIds]
  const ids: string[] = []
  for (const word of words(sentence)) {
    const index = unused.findIndex(
      ({ text }) => wordKey(text) === wordKey(word),
    )
    if (index < 0) return null
    const [tile] = unused.splice(index, 1)
    ids.push(tile.id)
  }
  return unused.length ? null : ids
}

export function prepareSentenceChallenge(
  definition: SentenceChallenge,
): PreparedSentenceChallenge | null {
  const solution = words(definition.sentence)
  const [minimum, maximum] = wordLimits[definition.difficulty]
  const distractors = definition.distractors ?? []
  if (
    solution.length < minimum ||
    solution.length > maximum ||
    solution.some((word) => !word) ||
    (definition.difficulty === 'hard' && distractors.length === 0) ||
    distractors.some(
      (word) =>
        !word ||
        /\s/.test(word) ||
        solution.some((token) => wordKey(token) === wordKey(word)),
    ) ||
    new Set(distractors.map(wordKey)).size !== distractors.length
  )
    return null

  const tiles = solution.map((text, index) => ({
    id: `${definition.id}-word-${index + 1}`,
    text,
  }))
  const alternativeOrders = []
  for (const alternative of definition.alternatives ?? []) {
    const order = mapOrder(alternative, tiles)
    if (!order) return null
    alternativeOrders.push(order)
  }

  return {
    definition,
    exercise: {
      kind: 'sentence-builder',
      id: definition.id,
      instructions: 'Escolha as palavras para montar a frase em inglês.',
      prompt: definition.prompt,
      feedback: definition.feedback,
      hint: definition.hint,
      correctOrder: tiles.map(({ id }) => id),
      alternativeOrders,
      tiles: [
        ...tiles,
        ...distractors.map((text, index) => ({
          id: `${definition.id}-extra-${index + 1}`,
          text,
        })),
      ],
    },
  }
}

export function hasPublishedSentenceReference(
  { reference }: SentenceChallenge,
  course: Course,
  stories: readonly Story[],
) {
  if (reference.kind === 'lesson') {
    const location = findCourseLesson(course, reference.lessonId)
    return (
      location?.level === 'A1' &&
      location.lesson.availability === 'available' &&
      location.lesson.blocks.some(({ id }) => id === reference.blockId)
    )
  }

  const story = stories.find(({ id }) => id === reference.storyId)
  return (
    story?.publication === 'available' &&
    story.level === 'A1' &&
    story.chapters.some(
      ({ id, paragraphs }) =>
        id === reference.chapterId &&
        paragraphs.some(({ id }) => id === reference.paragraphId),
    )
  )
}

export function eligibleSentenceChallenges(
  challenges: readonly SentenceChallenge[],
  topic: SentenceTopicSelection,
  difficulty: SentenceDifficulty,
) {
  const ids = new Set<string>()
  const sentences = new Set<string>()
  const eligible: PreparedSentenceChallenge[] = []
  for (const challenge of challenges) {
    if (
      challenge.difficulty !== difficulty ||
      (topic !== 'mixed' && !challenge.topics.includes(topic))
    )
      continue
    const answers = [challenge.sentence, ...(challenge.alternatives ?? [])].map(
      (sentence) => words(sentence).map(wordKey).join(' '),
    )
    if (
      ids.has(challenge.id) ||
      answers.some((sentence) => sentences.has(sentence))
    )
      continue
    const prepared = prepareSentenceChallenge(challenge)
    if (!prepared) continue
    eligible.push(prepared)
    ids.add(challenge.id)
    answers.forEach((sentence) => sentences.add(sentence))
  }
  return eligible
}

function shuffledTiles(
  exercise: SentenceBuilderExercise,
  random: () => number,
) {
  const tiles = shuffle(exercise.tiles, random)
  const solved = (bank: readonly ExerciseOption[]) =>
    evaluateSentenceOrder(
      exercise,
      bank.slice(0, exercise.correctOrder.length).map(({ id }) => id),
    ) === 'correct'
  if (!solved(tiles)) return tiles

  // Distinct visible permutations skip swaps between identical tokens.
  const compare = (a: ExerciseOption, b: ExerciseOption) =>
    a.text === b.text ? 0 : a.text < b.text ? -1 : 1
  const candidate = [...tiles].sort(compare)
  do {
    if (!solved(candidate)) return candidate
  } while (nextTilePermutation(candidate, compare))
  return tiles
}

function nextTilePermutation(
  tiles: ExerciseOption[],
  compare: (a: ExerciseOption, b: ExerciseOption) => number,
) {
  let pivot = tiles.length - 2
  while (pivot >= 0 && compare(tiles[pivot], tiles[pivot + 1]) >= 0) pivot--
  if (pivot < 0) return false

  let next = tiles.length - 1
  while (compare(tiles[pivot], tiles[next]) >= 0) next--
  const previous = tiles[pivot]
  tiles[pivot] = tiles[next]
  tiles[next] = previous
  tiles.splice(pivot + 1, tiles.length, ...tiles.slice(pivot + 1).reverse())
  return true
}

export function generateSentenceSession(
  eligible: readonly PreparedSentenceChallenge[],
  difficulty: SentenceDifficulty,
  random = Math.random,
) {
  const count =
    sentenceBuilderGame.difficulties.find(({ id }) => id === difficulty)
      ?.roundSize ?? 0
  if (!count || eligible.length < count) return null
  return shuffle(eligible, random)
    .slice(0, count)
    .map(({ definition, exercise }) => ({
      definition,
      exercise: { ...exercise, tiles: shuffledTiles(exercise, random) },
    }))
}

export function sentenceForOrder(
  { definition, exercise }: PreparedSentenceChallenge,
  ids: readonly string[],
) {
  const selected = ids.map(
    (id) => exercise.tiles.find((tile) => tile.id === id)?.text ?? '',
  )
  const display = (sentence: string) => words(sentence).map(wordKey).join(' ')
  return (
    [definition.sentence, ...(definition.alternatives ?? [])].find(
      (candidate) => display(candidate) === selected.map(wordKey).join(' '),
    ) ?? selected.join(' ')
  )
}
