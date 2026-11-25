import type {
  ExerciseAnswer,
  ExerciseAttempt,
  ExerciseSubmission,
} from '@/types/exercise'
import type {
  LearnerProgress,
  LessonProgress,
  SavedActivitySession,
  StudyRun,
} from '@/types/progress'

type Entry = Record<string, unknown>
const isEntry = (value: unknown): value is Entry =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[\w-]+$/.test(value) &&
  !['__proto__', 'constructor', 'prototype'].includes(value)
const isTime = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 8.64e15
const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean'
const isText = (value: unknown): value is string => typeof value === 'string'
const isRecord = (value: unknown, check: (value: unknown) => boolean) =>
  isEntry(value) &&
  Object.entries(value).every(([key, item]) => isId(key) && check(item))
const isIds = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isId)

function isAnswer(value: unknown): value is ExerciseAnswer {
  if (!isEntry(value)) return false
  switch (value.kind) {
    case 'multiple-choice':
      return isId(value.optionId)
    case 'fill-in-the-blanks':
      return isRecord(value.values, isText)
    case 'sentence-builder':
      return isIds(value.tileIds)
    case 'matching-pairs':
      return isRecord(value.pairs, (id) => id === '' || isId(id))
    case 'true-or-false':
      return isBoolean(value.value)
    default:
      return false
  }
}

function isSubmission(value: unknown): value is ExerciseSubmission {
  return (
    isEntry(value) &&
    isAnswer(value.answer) &&
    isBoolean(value.correct) &&
    isTime(value.submittedAt) &&
    (value.mode === 'practice' ||
      value.mode === 'listening' ||
      value.mode === 'text-alternative' ||
      value.mode === 'no-audio')
  )
}

function isAttempt(value: unknown): value is ExerciseAttempt {
  if (
    !isEntry(value) ||
    !(value.answer === null || isAnswer(value.answer)) ||
    !Array.isArray(value.submissions) ||
    !value.submissions.every(isSubmission)
  )
    return false

  const last = value.submissions.at(-1)
  switch (value.status) {
    case 'editing':
      return value.reviewedAt === undefined
    case 'correct':
      return (
        value.answer !== null &&
        last?.correct === true &&
        value.reviewedAt === undefined
      )
    case 'incorrect':
      return (
        value.answer !== null &&
        last?.correct === false &&
        value.reviewedAt === undefined
      )
    case 'reviewed':
      return (
        value.answer !== null &&
        last?.correct === false &&
        isTime(value.reviewedAt) &&
        value.reviewedAt >= last.submittedAt
      )
    default:
      return false
  }
}

function isActivitySession(value: unknown): value is SavedActivitySession {
  return (
    isEntry(value) &&
    isId(value.activityId) &&
    isRecord(value.attempts, isAttempt) &&
    isBoolean(value.finished) &&
    isIds(value.textActivityIds) &&
    isIds(value.heardActivityIds)
  )
}

function isRun(value: unknown): value is StudyRun {
  return (
    isEntry(value) &&
    isId(value.id) &&
    isId(value.blockId) &&
    isTime(value.startedAt) &&
    (value.finishedAt === undefined ||
      (isTime(value.finishedAt) && value.finishedAt >= value.startedAt)) &&
    isIds(value.visitedBlockIds) &&
    isRecord(value.activities, isActivitySession) &&
    isTime(value.activeMs)
  )
}

function isLesson(value: unknown): value is LessonProgress {
  if (!isEntry(value) || !isRun(value.run)) return false
  const { completion } = value
  if (completion === undefined) return value.run.finishedAt === undefined
  return (
    isEntry(completion) &&
    isTime(completion.completedAt) &&
    isRun(completion.run) &&
    completion.run.finishedAt === completion.completedAt
  )
}

export function emptyProgress(): LearnerProgress {
  return { lessons: {}, dailyStudyMs: {} }
}

export function serializeProgress(data: LearnerProgress) {
  return JSON.stringify({ version: 1, data })
}

export function parseProgress(
  serialized: string | null,
): LearnerProgress | null {
  if (serialized === null) return emptyProgress()
  try {
    const envelope: unknown = JSON.parse(serialized)
    if (
      isEntry(envelope) &&
      envelope.version === 1 &&
      isEntry(envelope.data) &&
      isRecord(envelope.data.lessons, isLesson) &&
      isEntry(envelope.data.dailyStudyMs) &&
      Object.entries(envelope.data.dailyStudyMs).every(
        ([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && isTime(value),
      )
    )
      return envelope.data as unknown as LearnerProgress
  } catch {
    return null
  }
  return null
}
