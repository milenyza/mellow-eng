import { describe, expect, it } from 'vitest'
import {
  findCourseLesson,
  getCurriculumOverview,
  getNextPublishedLesson,
} from '@/services/curriculum'
import { parseProgress, serializeProgress } from '@/services/progress-format'
import { englishA1 } from './english-a1'
import { englishCourse } from './english-course'
import { introductionsLesson } from './introductions-lesson'
import type { AvailableLesson } from '@/types/curriculum'
import type { ExerciseAttempt } from '@/types/exercise'
import {
  evaluateExercise,
  normalizeTextAnswer,
} from '@/services/exercise-evaluation'
import {
  completeLesson,
  getBlockExercises,
  getCompletionRequirements,
  restoreActivitySession,
  saveActivitySession,
  startStudyRun,
  visitBlock,
} from '@/services/lesson-progress'
import type { Exercise, ExerciseAnswer } from '@/types/exercise'
import { introducingAFriendLesson } from './introducing-a-friend-lesson'
import { originsLesson } from './origins-lesson'
import { personalIntroductionLesson } from './personal-introduction-lesson'

const newLessons: readonly AvailableLesson[] = [
  originsLesson,
  introducingAFriendLesson,
  personalIntroductionLesson,
]

function expectUniqueIds(items: readonly { id: string }[]) {
  expect(new Set(items.map(({ id }) => id)).size).toBe(items.length)
  for (const { id } of items) expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
}

function expectedAnswer(exercise: Exercise): ExerciseAnswer {
  switch (exercise.kind) {
    case 'multiple-choice':
      return { kind: exercise.kind, optionId: exercise.correctOptionId }
    case 'fill-in-the-blanks':
      return {
        kind: exercise.kind,
        values: Object.fromEntries(
          exercise.blanks.map(({ id, acceptedAnswers }) => [
            id,
            acceptedAnswers[0],
          ]),
        ),
      }
    case 'sentence-builder':
      return { kind: exercise.kind, tileIds: exercise.correctOrder }
    case 'matching-pairs':
      return { kind: exercise.kind, pairs: exercise.correctPairs }
    case 'true-or-false':
      return { kind: exercise.kind, value: exercise.correctValue }
  }
}

function validateAnswer(exercise: Exercise) {
  expect(exercise.prompt.trim()).not.toBe('')
  expect(exercise.instructions.trim()).not.toBe('')
  expect(exercise.feedback.trim()).not.toBe('')
  const answer = expectedAnswer(exercise)
  expect(evaluateExercise(exercise, answer)).toBe('correct')
  expect(evaluateExercise(exercise, null)).toBe('incomplete')

  switch (exercise.kind) {
    case 'multiple-choice':
      expectUniqueIds(exercise.options)
      for (const option of exercise.options.filter(
        ({ id }) => id !== exercise.correctOptionId,
      )) {
        expect(
          evaluateExercise(exercise, {
            kind: exercise.kind,
            optionId: option.id,
          }),
        ).toBe('incorrect')
      }
      expect(exercise.options.length).toBeGreaterThanOrEqual(2)
      break
    case 'fill-in-the-blanks': {
      const values = answer.kind === 'fill-in-the-blanks' ? answer.values : {}
      expectUniqueIds(exercise.blanks)
      for (const { id, acceptedAnswers } of exercise.blanks) {
        const normalized = acceptedAnswers.map(normalizeTextAnswer)
        expect(normalized).not.toContain('')
        expect(new Set(normalized).size).toBe(acceptedAnswers.length)
        for (const alternative of acceptedAnswers) {
          expect(
            evaluateExercise(exercise, {
              kind: exercise.kind,
              values: { ...values, [id]: alternative },
            }),
          ).toBe('correct')
        }
      }
      break
    }
    case 'sentence-builder':
      expectUniqueIds(exercise.tiles)
      expect(
        evaluateExercise(exercise, {
          kind: exercise.kind,
          tileIds: [...exercise.correctOrder].reverse(),
        }),
      ).toBe('incorrect')
      break
    case 'matching-pairs':
      expectUniqueIds(exercise.left)
      expectUniqueIds(exercise.right)
      expect(Object.keys(exercise.correctPairs).sort()).toEqual(
        exercise.left.map(({ id }) => id).sort(),
      )
      break
    case 'true-or-false':
      expect(
        evaluateExercise(exercise, {
          kind: exercise.kind,
          value: !exercise.correctValue,
        }),
      ).toBe('incorrect')
      break
  }
}

describe('Unit 01 lesson content', () => {
  it('uses unique activity IDs across the three new lessons', () => {
    expectUniqueIds(
      newLessons.flatMap((lesson) => lesson.blocks.flatMap(getBlockExercises)),
    )
  })

  it.each(newLessons)(
    'validates stages, activities and answers for $title',
    (lesson) => {
      expect(lesson.durationMinutes).toBeGreaterThanOrEqual(15)
      expect(lesson.durationMinutes).toBeLessThanOrEqual(20)
      expect(
        lesson.objectives.every((objective) => Boolean(objective.trim())),
      ).toBe(true)
      expectUniqueIds(lesson.blocks)
      expect([...new Set(lesson.blocks.map(({ kind }) => kind))]).toEqual([
        'introduction',
        'vocabulary',
        'grammar',
        'dialogue',
        'listening',
        'practice',
        'speaking',
        'review',
      ])
      const vocabulary = lesson.blocks.flatMap((block) =>
        block.kind === 'vocabulary' ? block.entries : [],
      )
      expect(vocabulary.length).toBeGreaterThanOrEqual(8)
      expect(vocabulary.length).toBeLessThanOrEqual(12)
      const practice = lesson.blocks.flatMap((block) =>
        block.kind === 'practice' ? block.exercises : [],
      )
      expect(practice.length).toBeGreaterThanOrEqual(8)
      expect(practice.length).toBeLessThanOrEqual(12)
      expect(new Set(practice.map(({ kind }) => kind)).size).toBe(5)

      for (const block of lesson.blocks) {
        for (const exercise of getBlockExercises(block)) {
          expect(exercise.id.startsWith(lesson.id + '-')).toBe(true)
          validateAnswer(exercise)
        }
        if (block.kind !== 'listening') continue
        expect(block.activities.map(({ format }) => format)).toEqual([
          'listen-and-choose',
          'listen-and-write',
          'dialogue-comprehension',
        ])
        for (const {
          format,
          source,
          textAlternative,
          exercise,
        } of block.activities) {
          expect(source.language).toBe('en-US')
          expectUniqueIds(source.parts)
          expect(textAlternative.trim()).not.toBe('')
          for (const part of source.parts) {
            expect(part.text.trim()).not.toBe('')
            expect(part.translation.trim()).not.toBe('')
            expect(textAlternative).not.toContain(part.text)
          }
          if (format === 'listen-and-write') {
            expect(exercise.blanks).toHaveLength(1)
            expect(
              evaluateExercise(exercise, {
                kind: 'fill-in-the-blanks',
                values: { [exercise.blanks[0].id]: source.parts[0].text },
              }),
            ).toBe('correct')
          }
          if (format === 'dialogue-comprehension') {
            expect(source.parts.length).toBeGreaterThanOrEqual(2)
            expect(
              new Set(source.parts.map(({ speaker }) => speaker)).size,
            ).toBe(2)
          }
        }
      }
    },
  )
})

function prepareCompletion(lesson: AvailableLesson) {
  let run = startStudyRun(lesson.blocks[0].id, 1000)
  for (const block of lesson.blocks) {
    run = visitBlock(run, block.id)
    if (block.kind !== 'practice' && block.kind !== 'listening') continue
    const exercises = getBlockExercises(block)
    const attempts = Object.fromEntries(
      exercises.map((exercise) => {
        const answer = expectedAnswer(exercise)
        const attempt: ExerciseAttempt = {
          answer,
          status: 'correct',
          submissions: [
            {
              answer,
              correct: true,
              submittedAt: 2000,
              mode: block.kind === 'listening' ? 'listening' : 'practice',
            },
          ],
        }
        return [exercise.id, attempt]
      }),
    )
    run = {
      ...run,
      activities: {
        ...run.activities,
        [block.id]: saveActivitySession(block, {
          index: exercises.length - 1,
          attempts,
          finished: true,
        }),
      },
    }
  }
  return run
}

it('publishes only the original four Unit 01 lessons in syllabus order', () => {
  const lessons = englishA1.units.flatMap(({ lessons }) => lessons)
  expectUniqueIds(englishA1.units)
  expectUniqueIds(lessons)
  expectUniqueIds(
    lessons.flatMap((lesson) =>
      lesson.availability === 'available'
        ? lesson.blocks.flatMap(getBlockExercises)
        : [],
    ),
  )
  expect(lessons).toHaveLength(48)
  expect(
    lessons.filter(({ availability }) => availability === 'planned'),
  ).toHaveLength(44)
  expect(
    lessons.filter(({ availability }) => availability === 'available'),
  ).toEqual([introductionsLesson, ...newLessons])
  expect(
    englishA1.units[0].lessons
      .map(({ id, title, objectives }) => ({ id, title, objectives }))
      .slice(1),
  ).toEqual([
    {
      id: 'en-a1-introductions-from',
      title: 'Where are you from?',
      objectives: [
        'Perguntar de onde alguém é',
        'Responder com cidade ou país',
      ],
    },
    {
      id: 'en-a1-introductions-meet',
      title: 'This is my friend',
      objectives: [
        'Selecionar o pronome pessoal adequado',
        'Apresentar alguém pelo nome',
      ],
    },
    {
      id: 'en-a1-introductions-about-me',
      title: 'A little about me',
      objectives: [
        'Dizer algo sobre si e fazer uma pergunta',
        'Distinguir respostas afirmativas e negativas',
      ],
    },
  ])
})

it('preserves previously saved progress and recommends the next lesson in the published sequence', () => {
  const oldRecord = completeLesson(
    introductionsLesson,
    { run: prepareCompletion(introductionsLesson) },
    4000,
  )
  const restored = parseProgress(
    serializeProgress({
      lessons: { [introductionsLesson.id]: oldRecord },
      dailyStudyMs: { '2026-11-24': 3000 },
    }),
  )
  if (!restored)
    throw new Error('The original version 1 record did not restore')
  expect(restored.lessons[introductionsLesson.id]).toEqual(oldRecord)
  const overview = getCurriculumOverview(englishA1, restored)
  expect(overview.completedCount).toBe(1)
  expect(overview.recommended?.lesson).toBe(originsLesson)

  const published = [introductionsLesson, ...newLessons]
  for (const [index, lesson] of published.entries()) {
    expect(findCourseLesson(englishCourse, lesson.id)?.lesson).toBe(lesson)
    expect(getNextPublishedLesson(englishCourse, lesson.id)).toBe(
      published[index + 1],
    )
  }
})

it.each(newLessons)(
  'restores activity state and permits explicit completion for $title',
  (lesson) => {
    const task = lesson.blocks.find((block) => block.kind === 'practice')
    if (!task) throw new Error('Missing practice')
    const exercise = task.exercises[1]
    const draft: ExerciseAttempt = {
      answer: expectedAnswer(exercise),
      status: 'editing',
      submissions: [],
    }
    const saved = saveActivitySession(task, {
      index: 1,
      finished: false,
      attempts: { [exercise.id]: draft },
    })
    const run = {
      ...visitBlock(startStudyRun(lesson.blocks[0].id), task.id),
      activities: { [task.id]: saved },
    }
    const restored = parseProgress(
      serializeProgress({
        lessons: { [lesson.id]: { run } },
        dailyStudyMs: {},
      }),
    )
    const resumedRun = restored?.lessons[lesson.id]?.run
    expect(resumedRun?.blockId).toBe(task.id)
    expect(
      restoreActivitySession(task, resumedRun?.activities[task.id]),
    ).toEqual({
      index: 1,
      finished: false,
      attempts: { [exercise.id]: draft },
    })
    expect(getCompletionRequirements(lesson, run).eligible).toBe(false)
    const completeRun = prepareCompletion(lesson)
    expect(getCompletionRequirements(lesson, completeRun).eligible).toBe(true)
    expect(completeRun.finishedAt).toBeUndefined()
    expect(
      completeLesson(lesson, { run: completeRun }, 4000).completion
        ?.completedAt,
    ).toBe(4000)
  },
)
