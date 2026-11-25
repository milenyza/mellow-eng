import { expect, it } from 'vitest'
import { selectGameReview } from '@/services/game-history-content'
import {
  recordGameSession,
  selectGameHistory,
  selectGameTotals,
} from '@/services/game-history'
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
} from '@/services/progress-format'
import { createLocalProgressRepository } from '@/services/progress-repository'
import {
  addDailyTime,
  combinedDailyStudyMs,
  getWeeklyStudyDays,
  totalStudyMs,
} from '@/services/study-time'
import type { GameSessionBase } from '@/types/game'
import type { MemoryGameResult } from '@/types/memory-game'
import type { SentenceBuilderResult } from '@/types/sentence-builder'
import type { WordMatchResult } from '@/types/word-match'

const start = new Date(2026, 10, 23, 23, 59, 59).getTime()
const base = {
  level: 'A1',
  difficulty: 'easy',
  startedAt: start,
  endedAt: start + 4000,
  activeMs: 4000,
  dailyPracticeMs: addDailyTime({}, start, start + 4000),
  answeredCount: 5,
  correctCount: 4,
  outcome: 'completed',
} satisfies Omit<GameSessionBase, 'sessionId' | 'gameId'>
const pair = {
  id: 'english-for-pt-br/en-a1-introductions-hello/greetings/hello',
  english: 'Hello',
  portuguese: 'Olá',
}
const memory = {
  ...base,
  gameId: 'memory-game',
  sessionId: 'memory-one',
  source: 'mixed',
  totalPairs: 1,
  incorrectAttempts: 1,
  answeredCount: 2,
  correctCount: 1,
  vocabulary: [pair],
} satisfies MemoryGameResult
const word = {
  ...base,
  gameId: 'word-match',
  sessionId: 'word-one',
  source: 'lessons',
  roundsCompleted: 3,
  firstAttemptCorrect: 2,
  vocabulary: [pair],
  reviewIds: [pair.id],
} satisfies WordMatchResult
const sentence = {
  ...base,
  gameId: 'sentence-builder',
  sessionId: 'sentence-one',
  difficulty: 'medium',
  topic: 'mixed',
  completedCount: 2,
  correctCount: 1,
  firstAttemptCorrect: 1,
  challenges: [
    {
      id: 'name-ana',
      sentence: 'My name is Ana.',
      reviewed: true,
      incorrectAnswers: ['Ana is My name'],
      topics: ['introductions'],
      feedback: 'Use “my name is”.',
    },
    {
      id: 'ask-from',
      sentence: 'Where are you from?',
      reviewed: false,
      incorrectAnswers: [],
      topics: ['questions'],
      feedback: 'Comece com “where”.',
    },
  ],
} satisfies SentenceBuilderResult

function allGames() {
  return [word, sentence, memory].reduce(recordGameSession, emptyProgress())
}

it('round-trips all types as compact references and counts repeated practice separately from distinct vocabulary', () => {
  const data = allGames()
  const serialized = serializeProgress(data)
  expect(serialized).not.toContain('My name is Ana.')
  expect(serialized).not.toContain('portuguese')
  expect(serialized).toContain(pair.id)
  expect(parseProgress(serialized)).toEqual(data)
  expect(recordGameSession(data, { ...memory, activeMs: 0 })).toBe(data)
  expect(
    recordGameSession(data, {
      ...word,
      sessionId: 'exited',
      outcome: 'exited',
    }),
  ).toBe(data)
  const replayed = recordGameSession(data, {
    ...memory,
    sessionId: 'memory-two',
    endedAt: start + 4500,
  })
  expect(selectGameHistory(replayed)[0].sessionId).toBe('memory-two')
  expect(selectGameTotals(selectGameHistory(replayed))).toEqual({
    completed: 4,
    uniqueVocabulary: 1,
    activeMs: 16000,
  })
  expect(
    selectGameHistory(replayed, {
      gameId: 'sentence-builder',
      difficulty: 'medium',
    })[0].sessionId,
  ).toBe('sentence-one')
  expect(
    selectGameHistory(replayed, {
      gameId: 'sentence-builder',
      difficulty: 'easy',
    }),
  ).toEqual([])
})

it('keeps lessons, prior days and reading preferences through v1/v2 upgrades and isolates invalid game rows', () => {
  const lesson = {
    run: {
      id: 'old-run',
      startedAt: 0,
      blockId: 'intro',
      visitedBlockIds: ['intro'],
      activities: {},
      activeMs: 1000,
    },
  }
  const legacy = { lessons: { lesson }, dailyStudyMs: { '2026-11-23': 1000 } }
  const reading = {
    preferences: { fontSize: 'large', translations: true },
    stories: {},
  }
  expect(parseProgress(JSON.stringify({ version: 1, data: legacy }))).toEqual(
    legacy,
  )
  const old = parseProgress(
    JSON.stringify({ version: 2, data: { ...legacy, reading } }),
  )!
  const upgraded = recordGameSession(old, memory)
  const damaged = JSON.parse(serializeProgress(upgraded))
  damaged.data.gameSessions.malformed = {
    ...damaged.data.gameSessions[memory.sessionId],
    sessionId: 'malformed',
    incorrectAttempts: 99,
  }
  damaged.data.gameSessions.alias = damaged.data.gameSessions[memory.sessionId]
  damaged.data.gameSessions.incomplete = {
    sessionId: 'incomplete',
    outcome: 'exited',
  }
  expect(parseProgress(JSON.stringify(damaged))).toEqual(upgraded)
  expect(parseProgress('{"version":77,"data":{}}')).toBeNull()
})

it('adds completed game time once per local day and excludes memory mismatches from review suggestions', () => {
  const data = allGames()
  const withReading = { ...data, dailyStudyMs: { '2026-11-23': 3000 } }
  expect(combinedDailyStudyMs(withReading)).toEqual({
    '2026-11-23': 6000,
    '2026-11-24': 9000,
  })
  expect(totalStudyMs(withReading)).toBe(15_000)
  expect(
    getWeeklyStudyDays(
      combinedDailyStudyMs(withReading),
      new Date(2026, 10, 24),
    ),
  ).toEqual([1, 2])
  expect(
    selectGameReview(selectGameHistory(data, { gameId: 'memory-game' })),
  ).toEqual({
    vocabularyIds: [],
    grammarTopics: [],
    reviewedSentences: [],
  })
  const review = selectGameReview(selectGameHistory(data))
  expect(review.vocabularyIds).toEqual([pair.id])
  expect(review.grammarTopics).toContain('introductions')
  expect(review.grammarTopics).not.toContain('questions')
  expect(review.reviewedSentences).toEqual([
    {
      challengeId: 'name-ana',
      reference: {
        kind: 'lesson',
        lessonId: 'en-a1-introductions-hello',
        blockId: 'pronouns',
      },
    },
  ])
})

it('restores completed records through a fresh repository and keeps failed writes available in memory', () => {
  let raw: string | null = null
  const storage = {
    getItem: () => raw,
    setItem: (_: string, value: string) => {
      raw = value
    },
  }
  const repository = createLocalProgressRepository(() => storage)
  repository.update((data) => recordGameSession(data, word))
  const restored = createLocalProgressRepository(() => storage)
  expect(restored.getSnapshot().data).toEqual(repository.getSnapshot().data)
  const unavailable = createLocalProgressRepository(() => ({
    ...storage,
    setItem: () => {
      throw new Error('quota')
    },
  }))
  unavailable.update((data) => recordGameSession(data, memory))
  expect(unavailable.getSnapshot().persistence).toBe('unavailable')
  expect(selectGameHistory(unavailable.getSnapshot().data)).toHaveLength(2)
  expect(selectGameHistory(restored.getSnapshot().data)).toHaveLength(1)
})
