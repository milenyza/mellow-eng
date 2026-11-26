import { expect, it } from 'vitest'
import {
  recordFlashcardSession,
  selectFlashcardHistory,
  summarizeFlashcardHistory,
  summarizeRecall,
} from './flashcard-history'
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
} from './progress-format'
import {
  createLocalProgressRepository,
  progressStorageKey,
} from './progress-repository'
import {
  addDailyTime,
  combinedDailyStudyMs,
  getWeeklyStudyDays,
  totalStudyMs,
} from './study-time'
import type { FlashcardResult } from '@/types/flashcards'

const start = new Date(2026, 10, 23, 23, 59, 59).getTime()
const vocab = 'story-first-trip-ticket'
const review: FlashcardResult = {
  sessionId: 'repeat-one',
  startedAt: start,
  completedAt: start + 2000,
  activeMs: 2000,
  configuration: {
    direction: 'en-pt',
    length: 'all',
    scope: 'saved',
    filters: { source: '', type: '', level: '', query: 'uma nota privada' },
  },
  observations: [{ vocabularyId: vocab, direction: 'en-pt', rating: 'effort' }],
}
const daily = addDailyTime({}, start, start + 2000)

it('restores a version 4 record with its previous data and persists compact sessions exactly once', () => {
  const legacy = {
    lessons: {
      lesson: {
        run: {
          id: 'legacy',
          startedAt: start,
          blockId: 'intro',
          visitedBlockIds: ['intro'],
          activities: {},
          activeMs: 500,
        },
      },
    },
    dailyStudyMs: { '2026-11-23': 500 },
    reading: {
      preferences: { fontSize: 'large', translations: false },
      stories: {},
    },
    gameSessions: {},
    simulationSessions: {},
  } as const
  let raw = JSON.stringify({ version: 4, data: legacy })
  const storage = {
    getItem: () => raw,
    setItem(key: string, value: string) {
      expect(key).toBe(progressStorageKey)
      raw = value
    },
  }
  const first = createLocalProgressRepository(() => storage)
  const second = createLocalProgressRepository(() => storage)
  expect(first.getSnapshot().data).toEqual(legacy)
  first.update((data) => recordFlashcardSession(data, review, daily))
  const snapshot = first.getSnapshot()
  first.update((data) => recordFlashcardSession(data, review, daily))
  expect(first.getSnapshot()).toBe(snapshot)
  second.update((data) =>
    recordFlashcardSession(
      data,
      {
        ...review,
        sessionId: 'repeat-two',
        completedAt: start + 3000,
        configuration: {
          ...review.configuration,
          direction: 'mixed',
          scope: 'difficult',
        },
      },
      daily,
    ),
  )
  const data = createLocalProgressRepository(() => storage).getSnapshot().data
  expect(JSON.parse(raw).version).toBe(5)
  expect(raw).not.toContain('uma nota privada')
  expect(data.lessons).toEqual(legacy.lessons)
  expect(data.reading).toEqual(legacy.reading)
  expect(data.gameSessions).toEqual(legacy.gameSessions)
  expect(data.simulationSessions).toEqual(legacy.simulationSessions)
  const history = selectFlashcardHistory(data)
  expect(history.map(({ sessionId }) => sessionId)).toEqual([
    'repeat-two',
    'repeat-one',
  ])
  expect(history[0].configuration.usedSearch).toBe(true)
  expect(
    selectFlashcardHistory(data, 'en-pt').map(({ sessionId }) => sessionId),
  ).toEqual(['repeat-one'])
  expect(summarizeFlashcardHistory(history)).toEqual({
    sessions: 2,
    vocabulary: 1,
    activeMs: 4000,
  })
  expect(summarizeRecall(history[0].observations)).toEqual({
    forgot: 0,
    effort: 1,
    easy: 0,
  })
  expect(combinedDailyStudyMs(data)).toEqual({
    '2026-11-23': 2500,
    '2026-11-24': 2000,
  })
  expect(totalStudyMs(data)).toBe(4500)
  expect(
    getWeeklyStudyDays(combinedDailyStudyMs(data), new Date(start + 2000)),
  ).toEqual([1, 2])
})

it('ignores malformed sessions and never records an incomplete session or invalid duration', () => {
  const initial = emptyProgress()
  expect(
    recordFlashcardSession(initial, { ...review, observations: [] }, daily),
  ).toBe(initial)
  expect(recordFlashcardSession(initial, review, {})).toBe(initial)
  const saved = recordFlashcardSession(initial, review, daily)
  const { data } = JSON.parse(serializeProgress(saved))
  const approved = data.flashcardSessions['repeat-one']
  data.flashcardSessions.alias = approved
  data.flashcardSessions.duplicate = {
    ...approved,
    sessionId: 'duplicate',
    observations: [...approved.observations, ...approved.observations],
  }
  data.flashcardSessions.incomplete = {
    ...approved,
    sessionId: 'incomplete',
    observations: [],
  }
  data.flashcardSessions.invalid = {
    ...approved,
    sessionId: 'invalid',
    configuration: { ...approved.configuration, direction: 'wrong' },
  }
  expect(parseProgress(JSON.stringify({ version: 5, data }))).toEqual(saved)
})
