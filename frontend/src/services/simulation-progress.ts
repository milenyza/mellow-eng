import type { ConversationAttempt } from '@/types/conversation'
import type { LearnerProgress } from '@/types/progress'
import type { CompletedSimulationSession } from '@/types/simulation-progress'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const isTimestamp = (value: unknown): value is number =>
  isCount(value) && value <= 8.64e15

function isAttempt(value: unknown): value is ConversationAttempt {
  return (
    isRecord(value) &&
    isId(value.nodeId) &&
    isId(value.choiceId) &&
    (value.fit === 'appropriate' ||
      value.fit === 'context' ||
      value.fit === 'language')
  )
}

export function countSimulationAttempts(
  attempts: readonly ConversationAttempt[],
) {
  const correct = attempts.filter(({ fit }) => fit === 'appropriate').length
  return {
    correct,
    incorrect: attempts.length - correct,
    total: attempts.length,
  }
}

function isCompletedSession(
  value: unknown,
): value is CompletedSimulationSession {
  if (
    !isRecord(value) ||
    !isId(value.sessionId) ||
    ['constructor', 'prototype'].includes(value.sessionId) ||
    !isId(value.situationId) ||
    !isId(value.scenarioId) ||
    !isTimestamp(value.startedAt) ||
    !isTimestamp(value.completedAt) ||
    value.completedAt < value.startedAt ||
    !isCount(value.decisionsCompleted) ||
    value.decisionsCompleted === 0 ||
    !isCount(value.reviewedCorrections) ||
    !isCount(value.activeMs) ||
    !isRecord(value.dailyPracticeMs) ||
    !Array.isArray(value.attempts) ||
    !value.attempts.every(isAttempt)
  )
    return false

  const daily = Object.entries(value.dailyPracticeMs)
  if (
    !daily.every(([day, ms]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && isCount(ms))
  )
    return false
  if (daily.reduce((sum, [, ms]) => sum + (ms as number), 0) !== value.activeMs)
    return false

  const outcomes = new Map<string, boolean>()
  for (const { nodeId, fit } of value.attempts) {
    if (outcomes.get(nodeId)) return false
    outcomes.set(nodeId, fit === 'appropriate')
  }
  const reviewed = [...outcomes.values()].filter(
    (appropriate) => !appropriate,
  ).length
  return (
    outcomes.size === value.decisionsCompleted &&
    reviewed === value.reviewedCorrections
  )
}

export function restoreSimulationSessions(value: unknown) {
  if (!isRecord(value)) return undefined
  const sessions: [string, CompletedSimulationSession][] = []
  for (const [key, session] of Object.entries(value)) {
    if (isCompletedSession(session) && key === session.sessionId)
      sessions.push([key, session])
  }
  return Object.fromEntries(sessions)
}

export function startSimulationRun(startedAt = Date.now()) {
  const sessionId =
    globalThis.crypto?.randomUUID?.() ??
    `simulation-${startedAt}-${Math.random().toString(36).slice(2) || '0'}`
  return { sessionId, startedAt }
}

export function recordSimulationSession(
  data: LearnerProgress,
  session: CompletedSimulationSession,
): LearnerProgress {
  if (
    Object.hasOwn(data.simulationSessions ?? {}, session.sessionId) ||
    !isCompletedSession(session)
  )
    return data
  return {
    ...data,
    simulationSessions: {
      ...data.simulationSessions,
      [session.sessionId]: session,
    },
  }
}

export function selectSimulationHistory(
  data: LearnerProgress,
  situationId: string,
  scenarioId?: string,
) {
  return Object.values(data.simulationSessions ?? {})
    .filter(
      (session): session is CompletedSimulationSession =>
        !!session &&
        session.situationId === situationId &&
        (scenarioId === undefined || session.scenarioId === scenarioId),
    )
    .sort(
      (a, b) =>
        b.completedAt - a.completedAt ||
        b.startedAt - a.startedAt ||
        a.sessionId.localeCompare(b.sessionId),
    )
}
