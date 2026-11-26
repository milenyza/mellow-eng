import { recordedSessions } from '@/services/study-time'
import { isCompletedGameSession } from '@/services/game-history-format'
import type { CompletedGameSession } from '@/types/game-history'
import type { GameDifficulty, GameSessionResult } from '@/types/game'
import type { LearnerProgress } from '@/types/progress'

function projectCompletedResult(
  result: GameSessionResult,
): CompletedGameSession | null {
  if (result.outcome !== 'completed') return null
  const {
    sessionId,
    level,
    difficulty,
    startedAt,
    endedAt,
    activeMs,
    dailyPracticeMs,
    answeredCount,
    correctCount,
  } = result
  const base = {
    sessionId,
    level,
    difficulty,
    startedAt,
    endedAt,
    activeMs,
    dailyPracticeMs,
    answeredCount,
    correctCount,
    outcome: 'completed',
  } as const
  switch (result.gameId) {
    case 'word-match':
      return {
        ...base,
        gameId: result.gameId,
        source: result.source,
        roundsCompleted: result.roundsCompleted,
        firstAttemptCorrect: result.firstAttemptCorrect,
        vocabularyIds: result.vocabulary.map(({ id }) => id),
        reviewIds: result.reviewIds,
      }
    case 'sentence-builder':
      return {
        ...base,
        gameId: result.gameId,
        topic: result.topic,
        firstAttemptCorrect: result.firstAttemptCorrect,
        challenges: result.challenges.map(
          ({ id, reviewed, incorrectAnswers }) => ({
            id,
            reviewed,
            incorrectAnswers: [...new Set(incorrectAnswers)],
          }),
        ),
      }
    case 'memory-game':
      return {
        ...base,
        gameId: result.gameId,
        source: result.source,
        totalPairs: result.totalPairs,
        incorrectAttempts: result.incorrectAttempts,
        vocabularyIds: result.vocabulary.map(({ id }) => id),
      }
  }
}

export function recordGameSession(
  data: LearnerProgress,
  result: GameSessionResult,
): LearnerProgress {
  if (Object.hasOwn(data.gameSessions ?? {}, result.sessionId)) return data
  const session = projectCompletedResult(result)
  if (!isCompletedGameSession(session)) return data
  return {
    ...data,
    gameSessions: { ...data.gameSessions, [session.sessionId]: session },
  }
}

export function selectGameHistory(
  data: LearnerProgress,
  filters: {
    gameId?: CompletedGameSession['gameId']
    difficulty?: GameDifficulty
  } = {},
): CompletedGameSession[] {
  return recordedSessions(data.gameSessions)
    .filter(
      (session): session is CompletedGameSession =>
        !!session &&
        (!filters.gameId || session.gameId === filters.gameId) &&
        (!filters.difficulty || session.difficulty === filters.difficulty),
    )
    .sort(
      (a, b) =>
        b.endedAt - a.endedAt ||
        b.startedAt - a.startedAt ||
        a.sessionId.localeCompare(b.sessionId),
    )
}

export function selectGameTotals(history: readonly CompletedGameSession[]) {
  const vocabulary = new Set<string>()
  let activeMs = 0
  for (const session of history) {
    activeMs += session.activeMs
    if (session.gameId !== 'sentence-builder')
      session.vocabularyIds.forEach((id) => vocabulary.add(id))
  }
  return {
    completed: history.length,
    activeMs,
    uniqueVocabulary: vocabulary.size,
  }
}

export function createGameSessionId(
  gameId: CompletedGameSession['gameId'],
  startedAt: number,
) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${gameId}-${startedAt}-${Math.random().toString(36).slice(2)}`
  )
}
