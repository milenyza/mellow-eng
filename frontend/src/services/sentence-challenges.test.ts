import { expect, it } from 'vitest'
import { englishCourse } from '@/data/curriculum/english-course'
import { sentenceBuilderGame } from '@/data/games'
import { sentenceChallenges, sentenceTopics } from '@/data/sentence-challenges'
import { stories } from '@/data/stories'
import type { SentenceTopicSelection } from '@/types/sentence-builder'
import { evaluateExercise } from './exercise-evaluation'
import {
  eligibleSentenceChallenges,
  generateSentenceSession,
  hasPublishedSentenceReference,
  prepareSentenceChallenge,
  sentenceForOrder,
} from './sentence-challenges'
import { summarizeSentences } from './sentence-session'

function find(id: string) {
  return sentenceChallenges.find((item) => item.id === id)!
}

it('keeps challenge IDs unique and each prompt, answer and reference usable with published A1 material', () => {
  expect(new Set(sentenceChallenges.map(({ id }) => id)).size).toBe(
    sentenceChallenges.length,
  )
  for (const definition of sentenceChallenges) {
    expect(
      hasPublishedSentenceReference(definition, englishCourse, stories),
      definition.id,
    ).toBe(true)
    const prepared = prepareSentenceChallenge(definition)
    expect(prepared, definition.id).toBeTruthy()
    expect(definition.prompt).toBeTruthy()
    expect(definition.feedback).toBeTruthy()
    const { exercise } = prepared!
    expect(new Set(exercise.tiles.map(({ id }) => id)).size).toBe(
      exercise.tiles.length,
    )
    expect(
      evaluateExercise(exercise, {
        kind: 'sentence-builder',
        tileIds: exercise.correctOrder,
      }),
    ).toBe('correct')
  }
  expect(
    hasPublishedSentenceReference(
      {
        ...find('name-ana'),
        reference: {
          kind: 'lesson',
          lessonId: 'unpublished',
          blockId: 'grammar',
        },
      },
      englishCourse,
      stories,
    ),
  ).toBe(false)
})

it('offers at least one difficulty for every listed topic and only includes matching challenges', () => {
  for (const topic of Object.keys(sentenceTopics) as SentenceTopicSelection[]) {
    expect(
      sentenceBuilderGame.difficulties.some(({ id, roundSize }) => {
        const eligible = eligibleSentenceChallenges(
          sentenceChallenges,
          topic,
          id,
        )
        expect(
          eligible.every(
            ({ definition }) =>
              definition.difficulty === id &&
              (topic === 'mixed' || definition.topics.includes(topic)),
          ),
        ).toBe(true)
        return eligible.length >= roundSize
      }),
      topic,
    ).toBe(true)
  }
  const introductions = eligibleSentenceChallenges(
    sentenceChallenges,
    'introductions',
    'hard',
  )
  expect(generateSentenceSession(introductions, 'hard')).toBeNull()
  const first = find('name-ana')
  expect(
    eligibleSentenceChallenges(
      [first, first, { ...first, id: 'duplicate-answer' }],
      'mixed',
      'easy',
    ),
  ).toHaveLength(1)
})

it.each([
  ['easy', 5, 3, 5],
  ['medium', 8, 5, 8],
  ['hard', 10, 6, 10],
] as const)(
  'generates reproducible %s sessions with %i distinct, unsolved challenges',
  (difficulty, count, min, max) => {
    const eligible = eligibleSentenceChallenges(
      sentenceChallenges,
      'mixed',
      difficulty,
    )
    const random = () => 0.99999
    const generated = generateSentenceSession(eligible, difficulty, random)!
    expect(generated).toEqual(
      generateSentenceSession(eligible, difficulty, random),
    )
    expect(generated).toHaveLength(count)
    expect(new Set(generated.map(({ definition }) => definition.id)).size).toBe(
      count,
    )
    for (const { exercise } of generated) {
      expect(exercise.correctOrder.length).toBeGreaterThanOrEqual(min)
      expect(exercise.correctOrder.length).toBeLessThanOrEqual(max)
      if (difficulty === 'hard')
        expect(exercise.tiles.length).toBeGreaterThan(
          exercise.correctOrder.length,
        )
      expect(
        evaluateExercise(exercise, {
          kind: 'sentence-builder',
          tileIds: exercise.tiles
            .slice(0, exercise.correctOrder.length)
            .map(({ id }) => id),
        }),
      ).toBe('incorrect')
    }
  },
)

it('accepts authored alternatives and equivalent repeated words but rejects misordering and distractors', () => {
  const alternative = prepareSentenceChallenge(find('hi-ana'))!
  const { exercise } = alternative
  const alternativeOrder = exercise.alternativeOrders![0]
  expect(
    evaluateExercise(exercise, {
      kind: 'sentence-builder',
      tileIds: alternativeOrder,
    }),
  ).toBe('correct')
  expect(sentenceForOrder(alternative, alternativeOrder)).toBe(
    'My name is Ana. Hi!',
  )
  expect(
    evaluateExercise(exercise, {
      kind: 'sentence-builder',
      tileIds: [...alternativeOrder].reverse(),
    }),
  ).toBe('incorrect')

  const repeated = prepareSentenceChallenge(find('repeat-from'))!.exercise
  const repeatedIds = repeated.tiles
    .filter(({ text }) => text === 'from')
    .map(({ id }) => id)
  expect(repeatedIds).toHaveLength(2)
  expect(repeatedIds[0]).not.toBe(repeatedIds[1])
  const swapped = repeated.correctOrder.map((id) =>
    id === repeatedIds[0]
      ? repeatedIds[1]
      : id === repeatedIds[1]
        ? repeatedIds[0]
        : id,
  )
  expect(
    evaluateExercise(repeated, { kind: 'sentence-builder', tileIds: swapped }),
  ).toBe('correct')
  expect(
    evaluateExercise(repeated, {
      kind: 'sentence-builder',
      tileIds: swapped.map((id) =>
        id === repeatedIds[1] ? repeatedIds[0] : id,
      ),
    }),
  ).toBe('incomplete')

  const hard = prepareSentenceChallenge(find('hard-intro-canada'))!.exercise
  expect(
    evaluateExercise(hard, {
      kind: 'sentence-builder',
      tileIds: hard.correctOrder,
    }),
  ).toBe('correct')
  expect(
    evaluateExercise(hard, {
      kind: 'sentence-builder',
      tileIds: [...hard.correctOrder.slice(0, -1), hard.tiles.at(-1)!.id],
    }),
  ).toBe('incorrect')
})

it('counts explicit correction reviews, all attempts and first-attempt accuracy separately', () => {
  const first = prepareSentenceChallenge(find('name-ana'))!
  const second = prepareSentenceChallenge(find('name-leo'))!
  const answer = (tileIds: readonly string[]) =>
    ({ kind: 'sentence-builder', tileIds }) as const
  const incorrect = answer([...first.exercise.correctOrder].reverse())
  const correct = answer(second.exercise.correctOrder)
  expect(
    summarizeSentences(
      {
        index: 1,
        finished: true,
        attempts: {
          [first.definition.id]: {
            status: 'reviewed',
            answer: incorrect,
            submissions: [
              {
                answer: incorrect,
                correct: false,
                submittedAt: 1,
                mode: 'practice',
              },
            ],
          },
          [second.definition.id]: {
            status: 'correct',
            answer: correct,
            submissions: [
              {
                answer: correct,
                correct: true,
                submittedAt: 2,
                mode: 'practice',
              },
            ],
          },
        },
      },
      [first, second],
    ),
  ).toMatchObject({
    completedCount: 2,
    answeredCount: 2,
    correctCount: 1,
    firstAttemptCorrect: 1,
    challenges: [
      { sentence: 'My name is Ana.', incorrectAnswers: ['Ana is name My'] },
      { sentence: 'My name is Leo.', incorrectAnswers: [] },
    ],
  })
})
