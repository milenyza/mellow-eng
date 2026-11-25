import type { CompletedGameSession } from '@/types/game-history'
import type { GameDifficulty, VocabularySource } from '@/types/game'
import type { SentenceTopicSelection } from '@/types/sentence-builder'

const entry = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const timestamp = (value: unknown): value is number =>
  count(value) && value <= 8.64e15
const id = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[\w-]+$/.test(value) &&
  !['__proto__', 'constructor', 'prototype'].includes(value)
const vocabularyId = (value: unknown): value is string =>
  typeof value === 'string' && value.split('/').every(id)
const uniqueVocabulary = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every(vocabularyId) &&
  new Set(value).size === value.length

const difficulties: readonly GameDifficulty[] = [
  'easy',
  'medium',
  'hard',
  'basic',
  'intermediate',
]
const sources: readonly VocabularySource[] = [
  'lessons',
  'stories',
  'saved',
  'mixed',
]
const topics: readonly SentenceTopicSelection[] = [
  'introductions',
  'pronouns',
  'to-be',
  'origins',
  'affirmative',
  'negative',
  'questions',
  'mixed',
]

export function isCompletedGameSession(
  value: unknown,
): value is CompletedGameSession {
  if (
    !entry(value) ||
    value.outcome !== 'completed' ||
    !id(value.sessionId) ||
    !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(value.level as string) ||
    !difficulties.includes(value.difficulty as GameDifficulty) ||
    !timestamp(value.startedAt) ||
    !timestamp(value.endedAt) ||
    value.endedAt < value.startedAt ||
    !count(value.activeMs) ||
    !count(value.answeredCount) ||
    !count(value.correctCount) ||
    value.correctCount > value.answeredCount ||
    !entry(value.dailyPracticeMs)
  )
    return false

  const dayTimes = Object.entries(value.dailyPracticeMs)
  if (
    !dayTimes.every(([day, ms]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && count(ms))
  )
    return false
  if (
    dayTimes.reduce((sum, [, ms]) => sum + (ms as number), 0) !== value.activeMs
  )
    return false

  switch (value.gameId) {
    case 'word-match':
      return (
        sources.includes(value.source as VocabularySource) &&
        count(value.roundsCompleted) &&
        value.roundsCompleted > 0 &&
        count(value.firstAttemptCorrect) &&
        value.firstAttemptCorrect <= value.correctCount &&
        uniqueVocabulary(value.vocabularyIds) &&
        value.vocabularyIds.length > 0 &&
        value.vocabularyIds.length <= value.correctCount &&
        uniqueVocabulary(value.reviewIds) &&
        value.reviewIds.every((key) =>
          (value.vocabularyIds as string[]).includes(key),
        )
      )
    case 'sentence-builder': {
      if (
        !topics.includes(value.topic as SentenceTopicSelection) ||
        !count(value.firstAttemptCorrect) ||
        value.firstAttemptCorrect > value.correctCount ||
        !Array.isArray(value.challenges) ||
        value.challenges.length === 0 ||
        value.answeredCount < value.challenges.length
      )
        return false
      const seen = new Set<string>()
      let reviewed = 0
      for (const challenge of value.challenges) {
        if (
          !entry(challenge) ||
          !id(challenge.id) ||
          seen.has(challenge.id) ||
          typeof challenge.reviewed !== 'boolean' ||
          !Array.isArray(challenge.incorrectAnswers) ||
          !challenge.incorrectAnswers.every(
            (answer) => typeof answer === 'string' && answer.trim(),
          ) ||
          (challenge.reviewed && !challenge.incorrectAnswers.length)
        )
          return false
        seen.add(challenge.id)
        reviewed += Number(challenge.reviewed)
      }
      return value.correctCount + reviewed === value.challenges.length
    }
    case 'memory-game':
      return (
        sources.includes(value.source as VocabularySource) &&
        count(value.totalPairs) &&
        value.totalPairs > 0 &&
        value.totalPairs === value.correctCount &&
        count(value.incorrectAttempts) &&
        value.incorrectAttempts === value.answeredCount - value.correctCount &&
        uniqueVocabulary(value.vocabularyIds) &&
        value.vocabularyIds.length === value.totalPairs
      )
    default:
      return false
  }
}

export function restoreGameSessions(value: unknown) {
  if (!entry(value)) return undefined
  const sessions: [string, CompletedGameSession][] = []
  for (const [key, session] of Object.entries(value)) {
    if (isCompletedGameSession(session) && key === session.sessionId)
      sessions.push([key, session])
  }
  return Object.fromEntries(sessions)
}
