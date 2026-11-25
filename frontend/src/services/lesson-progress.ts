import { evaluateExercise } from '@/services/exercise-evaluation'
import type { AvailableLesson } from '@/types/curriculum'
import type {
  ExerciseAttempt,
  PracticeSession,
  SubmissionMode,
} from '@/types/exercise'
import type {
  LessonBlock,
  ListeningBlock,
  PracticeBlock,
} from '@/types/lesson-content'
import type {
  LearnerLessonStatus,
  LearnerProgress,
  LessonProgress,
  SavedActivitySession,
  StudyRun,
} from '@/types/progress'

export function lessonProgressStatus(
  progress?: LessonProgress,
): LearnerLessonStatus {
  return progress?.completion
    ? 'completed'
    : progress
      ? 'in-progress'
      : 'not-started'
}

export function startStudyRun(
  firstBlockId: string,
  now = Date.now(),
): StudyRun {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `run-${now}-${Math.random().toString(36).slice(2)}`,
    startedAt: now,
    blockId: firstBlockId,
    visitedBlockIds: [firstBlockId],
    activities: {},
    activeMs: 0,
  }
}

export function visitBlock(run: StudyRun, blockId: string): StudyRun {
  if (run.blockId === blockId && run.visitedBlockIds.includes(blockId))
    return run
  return {
    ...run,
    blockId,
    visitedBlockIds: run.visitedBlockIds.includes(blockId)
      ? run.visitedBlockIds
      : [...run.visitedBlockIds, blockId],
  }
}

export function getBlockExercises(block: LessonBlock) {
  if (block.kind === 'practice') return block.exercises
  if (block.kind === 'listening')
    return block.activities.map(({ exercise }) => exercise)
  return []
}

export function saveActivitySession(
  block: ListeningBlock | PracticeBlock,
  session?: PracticeSession,
  textActivityIds: readonly string[] = [],
  heardActivityIds: readonly string[] = [],
): SavedActivitySession {
  const exercise = getBlockExercises(block)[session?.index ?? 0]
  return {
    activityId: exercise.id,
    attempts: session?.attempts ?? {},
    finished: session?.finished ?? false,
    textActivityIds,
    heardActivityIds,
  }
}

export function restoreActivitySession(
  block: LessonBlock,
  saved?: SavedActivitySession,
): PracticeSession | undefined {
  if (!saved) return undefined
  const exercises = getBlockExercises(block)
  const savedIndex = exercises.findIndex(({ id }) => id === saved.activityId)
  const pendingIndex = exercises.findIndex(
    (exercise) => !isResolved(exercise, saved.attempts[exercise.id]),
  )
  const finished = saved.finished && pendingIndex < 0
  return {
    index:
      saved.finished && pendingIndex >= 0
        ? pendingIndex
        : Math.max(0, savedIndex),
    attempts: saved.attempts,
    finished,
  }
}

function isResolved(
  exercise: ReturnType<typeof getBlockExercises>[number],
  attempt?: ExerciseAttempt,
) {
  if (!attempt) return false
  const outcome = evaluateExercise(exercise, attempt.answer)
  return (
    (attempt.status === 'correct' && outcome === 'correct') ||
    (attempt.status === 'reviewed' &&
      attempt.reviewedAt !== undefined &&
      outcome === 'incorrect')
  )
}

export function getCompletionRequirements(
  lesson: AvailableLesson,
  run: StudyRun,
) {
  const unvisited = lesson.blocks.filter(
    (block) =>
      block.requiredForCompletion !== false &&
      !run.visitedBlockIds.includes(block.id),
  )
  const unanswered = lesson.blocks.flatMap((block) =>
    block.requiredForCompletion === false
      ? []
      : getBlockExercises(block)
          .filter(
            (exercise) =>
              exercise.requiredForCompletion !== false &&
              !isResolved(
                exercise,
                run.activities[block.id]?.attempts[exercise.id],
              ),
          )
          .map((exercise) => ({ blockId: block.id, exerciseId: exercise.id })),
  )
  return {
    unvisited,
    unanswered,
    eligible: unvisited.length === 0 && unanswered.length === 0,
  }
}

export function completeLesson(
  lesson: AvailableLesson,
  record: LessonProgress,
  now = Date.now(),
): LessonProgress {
  if (
    record.run.finishedAt !== undefined ||
    !getCompletionRequirements(lesson, record.run).eligible
  )
    return record
  const completedAt = Math.max(now, record.run.startedAt)
  const run = { ...record.run, finishedAt: completedAt }
  return { run, completion: record.completion ?? { run, completedAt } }
}

export function getLessonResults(lesson: AvailableLesson, run: StudyRun) {
  const accuracy: Partial<
    Record<SubmissionMode, { correct: number; attempted: number }>
  > = {}
  let reviewed = 0
  const mistakes = lesson.blocks.flatMap((block) =>
    getBlockExercises(block).flatMap((exercise) => {
      const attempt = run.activities[block.id]?.attempts[exercise.id]
      if (isResolved(exercise, attempt)) reviewed++
      const first = attempt?.submissions[0]
      if (first) {
        const counts = accuracy[first.mode] ?? { correct: 0, attempted: 0 }
        accuracy[first.mode] = {
          correct: counts.correct + Number(first.correct),
          attempted: counts.attempted + 1,
        }
      }
      return attempt?.submissions.some(({ correct }) => !correct)
        ? [exercise]
        : []
    }),
  )
  return { accuracy, reviewed, mistakes }
}

export function updateLessonRecord(
  data: LearnerProgress,
  id: string,
  change: (record?: LessonProgress) => LessonProgress | undefined,
): LearnerProgress {
  const current = data.lessons[id]
  const next = change(current)
  if (!next || next === current) return data
  return { ...data, lessons: { ...data.lessons, [id]: next } }
}
