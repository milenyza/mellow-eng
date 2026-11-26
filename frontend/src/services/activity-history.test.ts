import { expect, it } from 'vitest'
import { englishA1Index } from '@/data/curriculum/english-a1-index'
import { describeActivity } from '@/services/activity-description'
import {
  filterActivityHistory,
  groupActivityByDay,
  selectActivityHistory,
} from '@/services/activity-history'
import { selectLearningAnalytics } from '@/services/learning-analytics'
import { parseProgress } from '@/services/progress-format'
import { totalStudyMs } from '@/services/study-time'
import type { LearnerProgress, StudyRun } from '@/types/progress'

const yesterday = '2026-11-25'
const today = '2026-11-26'
const at = new Date(2026, 10, 26).getTime()
const lessonId = englishA1Index.units[0].lessons[0].id
const original: StudyRun = {
  id: 'lesson-original',
  blockId: 'intro',
  visitedBlockIds: [],
  activities: {},
  startedAt: at - 10_000,
  finishedAt: at - 1,
  activeMs: 1000,
}
const replay = {
  ...original,
  id: 'lesson-replay',
  startedAt: at,
  finishedAt: at + 1,
}
const readingRun = {
  id: 'read-run',
  chapterId: 'rain-at-the-window',
  startedAt: at - 15_000,
  activeMs: 10_000,
  chapters: { 'rain-at-the-window': { readAt: at }, unknown: {} },
}
const game = {
  gameId: 'word-match',
  level: 'A1',
  source: 'saved',
  difficulty: 'easy',
  startedAt: at,
  endedAt: at + 5,
  outcome: 'completed',
  activeMs: 0,
  dailyPracticeMs: {},
  answeredCount: 3,
  correctCount: 2,
  roundsCompleted: 1,
  firstAttemptCorrect: 1,
  vocabularyIds: ['removed-favorite'],
  reviewIds: [],
} as const
const flashcard = {
  sessionId: 'same',
  startedAt: at,
  completedAt: at + 5,
  activeMs: 0,
  dailyPracticeMs: {},
  configuration: {
    direction: 'en-pt',
    length: 'all',
    scope: 'saved',
    filters: { source: '', type: '', level: '' },
    usedSearch: false,
  },
  observations: [
    { vocabularyId: 'removed-favorite', direction: 'en-pt', rating: 'effort' },
  ],
} as const
const records: LearnerProgress = {
  dailyStudyMs: { [today]: 100_000, [yesterday]: 10_000 },
  lessons: {
    [lessonId]: {
      run: replay,
      completion: { run: original, completedAt: at - 1 },
    },
  },
  reading: {
    preferences: { fontSize: 'normal', translations: false },
    stories: {
      'a-rainy-morning': {
        activeMs: 80_000,
        readChapterIds: ['rain-at-the-window', 'rain-at-the-window', 'unknown'],
        completion: { completedAt: at + 1, run: readingRun },
        run: {
          ...readingRun,
          activeMs: 70_000,
          id: 'reading-replay',
          chapters: { 'rain-at-the-window': { readAt: at + 2 } },
        },
      },
    },
  },
  gameSessions: {
    same: { ...game, sessionId: 'same' },
    second: { ...game, sessionId: 'second', endedAt: at + 6 },
    alias: { ...game, sessionId: 'same' },
    sentence: {
      ...game,
      gameId: 'sentence-builder',
      sessionId: 'sentence',
      topic: 'mixed',
      correctCount: 1,
      challenges: [{ id: 'name-ana', reviewed: false, incorrectAnswers: [] }],
    },
    memory: {
      ...game,
      gameId: 'memory-game',
      sessionId: 'memory',
      totalPairs: 2,
      incorrectAttempts: 1,
    },
  },
  simulationSessions: {
    same: {
      sessionId: 'same',
      situationId: 'shopping',
      scenarioId: 'ask-the-price',
      startedAt: at,
      completedAt: at + 3,
      activeMs: 0,
      dailyPracticeMs: {},
      decisionsCompleted: 1,
      reviewedCorrections: 0,
      attempts: [{ nodeId: 'start', choiceId: 'valid', fit: 'appropriate' }],
    },
  },
  flashcardSessions: { same: flashcard },
}

it('uses stable composite identities, preserves repeated sessions and separates milestone and run time', () => {
  const { entries, undatedChapters } = selectActivityHistory(records, today)
  expect(undatedChapters).toBe(1)
  expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length)
  expect(entries.filter(({ kind }) => kind === 'game')).toHaveLength(4)
  expect(
    entries
      .filter(({ kind }) => kind === 'lesson')
      .map(({ classification }) => classification),
  ).toEqual(['session', 'milestone'])
  expect(entries.find(({ kind }) => kind === 'chapter')).toMatchObject({
    at: at + 2,
  })
  expect(
    entries.find(({ kind }) => kind === 'chapter')?.durationMs,
  ).toBeUndefined()
  expect(entries.find(({ kind }) => kind === 'story')?.durationMs).toBe(10_000)
  expect(entries.find(({ kind }) => kind === 'flashcard')).toMatchObject({
    vocabulary: 1,
  })
  expect(entries.find(({ kind }) => kind === 'simulation')).toMatchObject({
    decisions: 1,
    attempts: 1,
    corrections: 0,
  })
  expect(entries.map(({ at }) => at)).toEqual(
    entries.map(({ at }) => at).sort((a, b) => b - a),
  )
  const reversed = Object.fromEntries(
    Object.entries(records.gameSessions!).reverse(),
  )
  expect(
    selectActivityHistory(
      { ...records, gameSessions: reversed },
      today,
    ).entries.map(({ id }) => id),
  ).toEqual(entries.map(({ id }) => id))
})

it('filters inclusive local dates and groups in the same order as the calendar and recent activity', () => {
  const { entries } = selectActivityHistory(records, today)
  const groups = groupActivityByDay(entries)
  expect(groups.map(({ day }) => day)).toEqual([today, yesterday])
  const range = { from: yesterday, to: yesterday }
  expect(filterActivityHistory(entries, range, 'lessons')).toEqual(
    groups[1].entries,
  )
  expect(
    filterActivityHistory(entries, { from: today, to: yesterday }),
  ).toEqual([])
  expect(filterActivityHistory(entries, {}, 'games')).toHaveLength(4)
  const analytics = selectLearningAnalytics(
    records,
    englishA1Index,
    [],
    new Map(),
    range,
    today,
  )
  expect(analytics.calendar.milestones).toEqual(entries)
  expect(analytics.period.recent).toEqual(groups[1].entries)
  expect(analytics.allTime.curriculum.completed).toBe(1)
  expect(analytics.allTime.reading.chapters).toBe(2)
  expect(
    selectLearningAnalytics(records, englishA1Index, [], new Map(), {}, today)
      .period.activeMs,
  ).toBe(totalStudyMs(records))
})

it('keeps history entries after content or favorites become unavailable, with links only to valid destinations', () => {
  const legacy = {
    ...records,
    lessons: {
      ...records.lessons,
      'no-longer-in-catalog': {
        run: original,
        completion: { run: original, completedAt: at - 1 },
      },
      [englishA1Index.units[1].lessons[0].id]: {
        run: original,
        completion: { run: original, completedAt: at - 1 },
      },
      'bad-date': { run: { ...replay, finishedAt: Infinity } },
    },
  }
  const { entries } = selectActivityHistory(legacy)
  const item = (id: string) =>
    describeActivity(entries.find(({ contentId }) => contentId === id)!)
  expect(item('no-longer-in-catalog').destination).toBeUndefined()
  expect(item(englishA1Index.units[1].lessons[0].id)).toMatchObject({
    title: expect.any(String),
    destination: undefined,
  })
  expect(item('rain-at-the-window').destination?.to).toBe(
    '/historias/a-rainy-morning/rain-at-the-window',
  )
  expect(item('ask-the-price').destination?.to).toBe(
    '/ingles-na-pratica/shopping/simulacoes/ask-the-price',
  )
  expect(
    describeActivity(entries.find(({ kind }) => kind === 'flashcard')!)
      .destination?.to,
  ).toBe('/meu-caderno/revisoes/same')
  expect(entries.some(({ contentId }) => contentId === 'bad-date')).toBe(false)
})

it.each([1, 2, 3, 4, 5])(
  'reads historical schema %i while retaining only records supported by that version',
  (version) => {
    const decoded = parseProgress(JSON.stringify({ version, data: records }))
    expect(decoded).toBeTruthy()
    const { entries } = selectActivityHistory(decoded!, today)
    expect(entries.filter(({ kind }) => kind === 'lesson')).toHaveLength(2)
    expect(entries.some(({ kind }) => kind === 'chapter')).toBe(version >= 2)
    expect(entries.some(({ kind }) => kind === 'game')).toBe(version >= 3)
    expect(entries.some(({ kind }) => kind === 'simulation')).toBe(version >= 4)
    expect(entries.some(({ kind }) => kind === 'flashcard')).toBe(version >= 5)
  },
)
