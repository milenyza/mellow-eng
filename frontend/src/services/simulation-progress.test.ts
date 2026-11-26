import { it, expect } from 'vitest'
import {
  createLocalProgressRepository,
  progressStorageKey,
} from './progress-repository'
import { parseProgress } from './progress-format'
import {
  countSimulationAttempts,
  recordSimulationSession,
  selectSimulationHistory,
} from './simulation-progress'
import {
  addDailyTime,
  combinedDailyStudyMs,
  getWeeklyStudyDays,
  totalStudyMs,
} from './study-time'
import type { CompletedSimulationSession } from '@/types/simulation-progress'
import type { LearnerProgress } from '@/types/progress'

const startedAt = new Date(2026, 10, 23, 23, 59, 59).getTime()
const completedAt = startedAt + 3000
const session: CompletedSimulationSession = {
  sessionId: 'session-one',
  situationId: 'at-the-airport',
  scenarioId: 'flight-check-in',
  startedAt,
  completedAt,
  activeMs: 3000,
  dailyPracticeMs: addDailyTime({}, startedAt, completedAt),
  decisionsCompleted: 2,
  reviewedCorrections: 1,
  attempts: [
    { nodeId: 'documents', choiceId: 'documents-hotel', fit: 'context' },
    { nodeId: 'documents', choiceId: 'documents-passport', fit: 'appropriate' },
    { nodeId: 'luggage', choiceId: 'luggage-wrong-verb', fit: 'language' },
  ],
}

const legacy = {
  dailyStudyMs: { '2026-11-23': 1000 },
  lessons: {
    lesson: {
      run: {
        id: 'old-run',
        startedAt: 0,
        blockId: 'intro',
        visitedBlockIds: ['intro'],
        activities: {},
        activeMs: 1000,
      },
    },
  },
  reading: {
    preferences: { fontSize: 'large', translations: true },
    stories: {},
  },
  gameSessions: {
    'game-one': {
      outcome: 'completed',
      level: 'A1',
      gameId: 'memory-game',
      difficulty: 'easy',
      sessionId: 'game-one',
      source: 'lessons',
      startedAt,
      endedAt: completedAt,
      activeMs: 1000,
      dailyPracticeMs: { '2026-11-24': 1000 },
      answeredCount: 2,
      correctCount: 1,
      incorrectAttempts: 1,
      totalPairs: 1,
      vocabularyIds: ['hello'],
    },
  },
} satisfies LearnerProgress

it('upgrades version 3, restores the attempts and retains earlier progress across reloads and replays', () => {
  let saved = JSON.stringify({ version: 3, data: legacy })
  const storage = {
    getItem: () => saved,
    setItem(key: string, value: string) {
      expect(key).toBe(progressStorageKey)
      saved = value
    },
  }
  const first = createLocalProgressRepository(() => storage)
  const second = createLocalProgressRepository(() => storage)
  first.update((data) => recordSimulationSession(data, session))
  const replay = {
    ...session,
    sessionId: 'session-two',
    completedAt: completedAt + 100,
  }
  second.update((data) => recordSimulationSession(data, replay))
  const restored = createLocalProgressRepository(() => storage).getSnapshot()
    .data

  expect(restored).toEqual({
    ...legacy,
    simulationSessions: { 'session-one': session, 'session-two': replay },
  })
  expect(recordSimulationSession(restored, session)).toBe(restored)
  expect(
    selectSimulationHistory(restored, 'at-the-airport', 'flight-check-in'),
  ).toEqual([replay, session])
  expect(selectSimulationHistory(restored, 'at-the-hotel')).toEqual([])
  expect(countSimulationAttempts(session.attempts)).toEqual({
    correct: 1,
    incorrect: 2,
    total: 3,
  })
  const study = combinedDailyStudyMs(restored)
  expect(study).toEqual({ '2026-11-23': 3000, '2026-11-24': 5000 })
  expect(totalStudyMs(restored)).toBe(8000)
  expect(getWeeklyStudyDays(study, new Date(completedAt))).toEqual([1, 2])
})

it('discards damaged sessions without invalidating the remaining learner data', () => {
  const data = parseProgress(
    JSON.stringify({
      version: 4,
      data: {
        ...legacy,
        simulationSessions: {
          'session-one': session,
          alias: session,
          'wrong-time': {
            ...session,
            sessionId: 'wrong-time',
            completedAt: startedAt - 1,
          },
          'wrong-count': {
            ...session,
            sessionId: 'wrong-count',
            reviewedCorrections: 2,
          },
          'wrong-fit': {
            ...session,
            sessionId: 'wrong-fit',
            attempts: [
              { nodeId: 'documents', choiceId: 'answer', fit: 'maybe' },
            ],
          },
          'wrong-duration': {
            ...session,
            sessionId: 'wrong-duration',
            dailyPracticeMs: {},
          },
        },
      },
    }),
  )
  expect(data).toEqual({
    ...legacy,
    simulationSessions: { 'session-one': session },
  })
})

it('retains completed sessions in memory and reports unavailable storage on write failure', () => {
  const repository = createLocalProgressRepository(() => ({
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }))
  repository.update((data) => recordSimulationSession(data, session))
  const { data, persistence } = repository.getSnapshot()
  expect(persistence).toBe('unavailable')
  expect(selectSimulationHistory(data, 'at-the-airport')).toEqual([session])
})
