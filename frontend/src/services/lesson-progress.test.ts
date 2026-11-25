import { expect, it } from 'vitest'
import { introductionsExercises } from '@/data/curriculum/introductions-exercises'
import { introductionsLesson } from '@/data/curriculum/introductions-lesson'
import {
  getCurriculumOverview,
  getLessonStatus,
  getNextPublishedLesson,
} from '@/services/curriculum'
import {
  completeLesson,
  getCompletionRequirements,
  getLessonResults,
  restoreActivitySession,
  saveActivitySession,
  startStudyRun,
  visitBlock,
} from '@/services/lesson-progress'
import type { AvailableLesson, CefrLevel } from '@/types/curriculum'
import type { ExerciseAttempt } from '@/types/exercise'
import type { PracticeBlock } from '@/types/lesson-content'
import type { LessonProgress } from '@/types/progress'

const first = introductionsExercises[0]
const block: PracticeBlock = {
  id: 'practice',
  kind: 'practice',
  title: 'Prática',
  instructions: 'Pratique.',
  exercises: [first],
}
const lesson: AvailableLesson = {
  ...introductionsLesson,
  blocks: [introductionsLesson.blocks[0], block, introductionsLesson.blocks[7]],
}
const incorrectAnswer = {
  kind: 'multiple-choice',
  optionId: 'goodbye',
} as const
const incorrect: ExerciseAttempt = {
  answer: incorrectAnswer,
  status: 'incorrect',
  submissions: [
    {
      answer: incorrectAnswer,
      correct: false,
      submittedAt: 2000,
      mode: 'practice',
    },
  ],
}

function withAttempt(
  record: LessonProgress,
  attempt: ExerciseAttempt,
): LessonProgress {
  return {
    run: {
      ...record.run,
      activities: {
        practice: saveActivitySession(block, {
          index: 0,
          finished: false,
          attempts: { [first.id]: attempt },
        }),
      },
    },
  }
}

it('requires visited blocks and explicit review or a correct answer, with no minimum score', () => {
  const initial = { run: startStudyRun(lesson.blocks[0].id, 1000) }
  const stageVisited = { run: visitBlock(initial.run, block.id) }
  const wrong = withAttempt(stageVisited, incorrect)
  const pending = getCompletionRequirements(lesson, wrong.run)
  expect(pending.unvisited.map(({ kind }) => kind)).toEqual(['speaking'])
  expect(pending.unanswered).toHaveLength(1)
  expect(completeLesson(lesson, wrong, 4000)).toBe(wrong)

  const reviewed = withAttempt(
    { run: visitBlock(wrong.run, lesson.blocks[2].id) },
    { ...incorrect, status: 'reviewed', reviewedAt: 3000 },
  )
  expect(getCompletionRequirements(lesson, reviewed.run).eligible).toBe(true)
  expect(reviewed.completion).toBeUndefined()
  const completed = completeLesson(lesson, reviewed, 4000)
  expect(completed.completion?.completedAt).toBe(4000)
  expect(getLessonResults(lesson, completed.run).accuracy.practice).toEqual({
    correct: 0,
    attempted: 1,
  })
  expect(getLessonResults(lesson, completed.run).mistakes).toEqual([first])
})

it('preserves the original completion during replay and makes repeated confirmation idempotent', () => {
  const visited = lesson.blocks.reduce(
    (run, item) => visitBlock(run, item.id),
    startStudyRun(lesson.blocks[0].id, 1000),
  )
  const eligible = withAttempt(
    { run: visited },
    { ...incorrect, status: 'reviewed', reviewedAt: 3000 },
  )
  const completed = completeLesson(lesson, eligible, 4000)
  const replay = { ...completed, run: startStudyRun(lesson.blocks[0].id, 5000) }
  expect(getLessonStatus(lesson, replay)).toBe('completed')
  expect(completeLesson(lesson, completed, 7000)).toBe(completed)
  const finished = completeLesson(
    lesson,
    { ...eligible, completion: completed.completion },
    8000,
  )
  expect(finished.completion).toBe(completed.completion)
  expect(finished.run.finishedAt).toBe(8000)
})

it('keeps planned lessons unavailable and recommends the active published lesson', () => {
  const planned = {
    ...lesson,
    id: 'planned',
    availability: 'planned',
    blocks: undefined,
  } as const
  const next = { ...lesson, id: 'next' }
  const level: CefrLevel = {
    code: 'A1',
    units: [
      {
        id: 'unit',
        title: 'Unit',
        focus: 'Focus',
        lessons: [lesson, planned, next],
      },
    ],
  }
  const course = {
    id: 'course',
    targetLanguage: 'en',
    interfaceLanguage: 'pt-BR',
    levels: [level],
  }
  const run = startStudyRun(lesson.blocks[0].id)
  const overview = getCurriculumOverview(level, {
    dailyStudyMs: {},
    lessons: { next: { run }, planned: { run } },
  })
  expect(overview.recommended?.lesson).toBe(next)
  expect(getLessonStatus(planned, { run })).toBe('planned')
  expect(getNextPublishedLesson(course, lesson.id)).toBe(next)
})

it('resumes an activity by stable ID even when exercise ordering changes', () => {
  const second = introductionsExercises[1]
  const current: PracticeBlock = { ...block, exercises: [first, second] }
  const saved = saveActivitySession(current, {
    index: 1,
    finished: false,
    attempts: {},
  })
  expect(
    restoreActivitySession({ ...current, exercises: [second, first] }, saved)
      ?.index,
  ).toBe(0)
})
