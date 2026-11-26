import type {
  CompletedFlashcardSession,
  FlashcardResult,
  RecallObservation,
  ReviewDirection,
} from '@/types/flashcards'
import type { DailyStudyTime } from '@/types/game'
import type { LearnerProgress } from '@/types/progress'

const scope = ['saved', 'difficult', 'history', 'recommended']
const directions = ['en-pt', 'pt-en', 'mixed']
const ratings = ['forgot', 'effort', 'easy']
const entry = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const number = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 8.64e15
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9_]+(?:[-/][a-z0-9_]+)*$/.test(value)
const includes = (
  values: readonly (string | number | undefined)[],
  value: unknown,
) => values.includes(value as string | number | undefined)

function isCompleted(value: unknown): value is CompletedFlashcardSession {
  if (
    !entry(value) ||
    !id(value.sessionId) ||
    value.sessionId.includes('/') ||
    !number(value.startedAt) ||
    !number(value.completedAt) ||
    value.completedAt < value.startedAt ||
    !number(value.activeMs) ||
    !entry(value.dailyPracticeMs) ||
    !entry(value.configuration) ||
    !entry(value.configuration.filters) ||
    !includes(scope, value.configuration.scope) ||
    !includes(directions, value.configuration.direction) ||
    !includes(['all', 5, 10, 20], value.configuration.length) ||
    typeof value.configuration.usedSearch !== 'boolean' ||
    !Array.isArray(value.observations) ||
    !value.observations.length ||
    (value.configuration.length !== 'all' &&
      value.configuration.length !== value.observations.length)
  )
    return false
  const { source, type, level, familiarity } = value.configuration.filters
  if (
    !includes(['', 'lesson', 'story', 'practical', 'daily'], source) ||
    !includes(['', 'word', 'expression', 'phrase'], type) ||
    !includes(['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'], level) ||
    !includes(
      [undefined, '', 'learning', 'reviewing', 'familiar', 'unclassified'],
      familiarity,
    )
  )
    return false
  const days = Object.entries(value.dailyPracticeMs)
  if (
    !days.every(([day, ms]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && number(ms)) ||
    days.reduce((sum, [, ms]) => sum + (ms as number), 0) !== value.activeMs
  )
    return false

  const seen = new Set<string>()
  for (const observation of value.observations) {
    if (
      !entry(observation) ||
      !id(observation.vocabularyId) ||
      seen.has(observation.vocabularyId) ||
      !includes(directions.slice(0, 2), observation.direction) ||
      (value.configuration.direction !== 'mixed' &&
        observation.direction !== value.configuration.direction) ||
      !includes(ratings, observation.rating)
    )
      return false
    seen.add(observation.vocabularyId)
  }
  return true
}

export function restoreFlashcardSessions(value: unknown) {
  if (!entry(value)) return undefined
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, session]) =>
      isCompleted(session) && key === session.sessionId
        ? [[key, session] as const]
        : [],
    ),
  )
}

export function recordFlashcardSession(
  data: LearnerProgress,
  result: FlashcardResult,
  dailyPracticeMs: DailyStudyTime,
): LearnerProgress {
  if (Object.hasOwn(data.flashcardSessions ?? {}, result.sessionId)) return data
  const { query, ...filters } = result.configuration.filters
  const session: CompletedFlashcardSession = {
    ...result,
    configuration: {
      ...result.configuration,
      filters,
      usedSearch: !!query.trim(),
    },
    dailyPracticeMs,
  }
  if (!isCompleted(session)) return data
  return {
    ...data,
    flashcardSessions: {
      ...data.flashcardSessions,
      [session.sessionId]: session,
    },
  }
}

export function selectFlashcardHistory(
  data: LearnerProgress,
  direction?: ReviewDirection,
) {
  return Object.values(data.flashcardSessions ?? {})
    .filter(
      (session): session is CompletedFlashcardSession =>
        !!session &&
        (!direction || session.configuration.direction === direction),
    )
    .sort(
      (a, b) =>
        b.completedAt - a.completedAt ||
        b.startedAt - a.startedAt ||
        a.sessionId.localeCompare(b.sessionId),
    )
}

export function summarizeFlashcardHistory(
  history: readonly CompletedFlashcardSession[],
) {
  const ids = new Set<string>()
  let activeMs = 0
  for (const session of history) {
    activeMs += session.activeMs
    for (const observation of session.observations)
      ids.add(observation.vocabularyId)
  }
  return { sessions: history.length, vocabulary: ids.size, activeMs }
}

export function summarizeRecall(observations: readonly RecallObservation[]) {
  const counts = { forgot: 0, effort: 0, easy: 0 }
  for (const { rating } of observations) counts[rating]++
  return counts
}
