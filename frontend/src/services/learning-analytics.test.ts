import { expect, it } from 'vitest'
import { englishA1Index } from '@/data/curriculum/english-a1-index'
import { getCurriculumOverview } from './curriculum'
import {
  selectFlashcardHistory,
  summarizeFlashcardHistory,
} from './flashcard-history'
import { selectGameHistory, selectGameTotals } from './game-history'
import { selectLearningAnalytics } from './learning-analytics'
import {
  selectGamesReport,
  selectLessonReport,
  selectNotebookReport,
  selectPracticalReport,
  selectStoryReport,
} from './learning-reports'
import { storyIndex } from '@/data/story-index'
import { stories } from '@/data/stories'
import { sentenceChallenges } from '@/data/sentence-challenges'
import { sentenceChallengeMetadata } from '@/data/sentence-metadata'
import { validStudyRange } from './study-calendar'
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
} from './progress-format'
import { readingTotals } from './reading-progress'
import { combinedDailyStudyMs, totalStudyMs } from './study-time'
import type { ExerciseAttempt } from '@/types/exercise'
import type { LearnerProgress, StudyRun } from '@/types/progress'
import type { VocabularyAnnotation } from '@/types/notebook'

const day1 = '2026-11-25'
const day2 = '2026-11-26'
const before = new Date(2026, 10, 25, 23, 59, 59).getTime()
const midnight = new Date(2026, 10, 26).getTime()
const after = midnight + 2000
const lessonId = englishA1Index.units[0].lessons[0].id
const ticket = 'story-first-trip-ticket'
const word = 'en-a-little'
const answer = { kind: 'true-or-false', value: true } as const
const correct: ExerciseAttempt = {
  answer,
  status: 'correct',
  submissions: [
    { answer, correct: true, submittedAt: midnight, mode: 'practice' },
  ],
}
const corrected: ExerciseAttempt = {
  answer,
  status: 'reviewed',
  reviewedAt: after,
  submissions: [
    { answer, correct: false, submittedAt: before, mode: 'text-alternative' },
  ],
}

const run: StudyRun = {
  id: 'lesson-run',
  startedAt: before,
  finishedAt: after,
  blockId: 'intro',
  visitedBlockIds: ['intro'],
  activeMs: 2000,
  activities: {
    practice: {
      activityId: 'test',
      finished: true,
      attempts: { test: correct, alt: corrected },
      textActivityIds: [],
      heardActivityIds: [],
    },
  },
}
const readingRun = {
  id: 'story-run',
  startedAt: before,
  chapterId: 'morning-rain',
  activeMs: 2000,
  chapters: {
    'morning-rain': {
      readAt: after,
      practice: { index: 0, finished: true, attempts: { number: correct } },
    },
  },
}
const sharedGame = {
  gameId: 'word-match',
  level: 'A1',
  difficulty: 'easy',
  outcome: 'completed',
  source: 'stories',
  startedAt: before,
  endedAt: after,
  activeMs: 3000,
  dailyPracticeMs: { [day1]: 1000, [day2]: 2000 },
  answeredCount: 3,
  correctCount: 2,
  roundsCompleted: 1,
  firstAttemptCorrect: 1,
  vocabularyIds: [ticket, word],
  reviewIds: [ticket],
} as const
const firstReview = {
  sessionId: 'review-one',
  startedAt: midnight,
  completedAt: after,
  activeMs: 1000,
  dailyPracticeMs: { [day2]: 1000 },
  configuration: {
    direction: 'en-pt',
    length: 'all',
    scope: 'saved',
    filters: { source: '', type: '', level: '' },
    usedSearch: false,
  },
  observations: [
    { vocabularyId: ticket, direction: 'en-pt', rating: 'effort' },
  ],
} as const

const data: LearnerProgress = {
  dailyStudyMs: { [day1]: 1000, [day2]: 5000 },
  lessons: {
    [lessonId]: { run, completion: { completedAt: after, run } },
    [englishA1Index.units[0].lessons[1].id]: {
      run: {
        ...run,
        id: 'fresh',
        startedAt: midnight,
        activeMs: 1000,
        finishedAt: undefined,
        activities: {},
      },
    },
  },
  reading: {
    preferences: { fontSize: 'normal', translations: false },
    stories: {
      'a-rainy-morning': {
        run: readingRun,
        activeMs: 2000,
        readChapterIds: ['morning-rain', 'morning-rain', 'older'],
        completion: { completedAt: after, run: readingRun },
      },
    },
  },
  gameSessions: {
    'game-one': { ...sharedGame, sessionId: 'game-one' },
    'game-two': {
      ...sharedGame,
      sessionId: 'game-two',
      startedAt: midnight,
      activeMs: 1000,
      dailyPracticeMs: { [day2]: 1000 },
    },
    'memory-one': {
      ...sharedGame,
      gameId: 'memory-game',
      sessionId: 'memory-one',
      activeMs: 0,
      dailyPracticeMs: {},
      totalPairs: 2,
      incorrectAttempts: 1,
    },
    alias: { ...sharedGame, sessionId: 'game-one' },
  },
  simulationSessions: {
    'simulation-one': {
      sessionId: 'simulation-one',
      situationId: 'shopping',
      scenarioId: 'ask-the-price',
      startedAt: before,
      completedAt: after,
      activeMs: 1500,
      dailyPracticeMs: { [day1]: 500, [day2]: 1000 },
      decisionsCompleted: 1,
      reviewedCorrections: 0,
      attempts: [
        { nodeId: 'opening', choiceId: 'opening-price', fit: 'appropriate' },
      ],
    },
    'simulation-two': {
      sessionId: 'simulation-two',
      situationId: 'shopping',
      scenarioId: 'ask-the-price',
      startedAt: midnight,
      completedAt: after,
      activeMs: 0,
      dailyPracticeMs: {},
      decisionsCompleted: 1,
      reviewedCorrections: 0,
      attempts: [
        { nodeId: 'opening', choiceId: 'opening-price', fit: 'appropriate' },
      ],
    },
  },
  flashcardSessions: {
    'review-one': firstReview,
    'review-two': {
      ...firstReview,
      sessionId: 'review-two',
      completedAt: after + 1000,
      observations: [
        { vocabularyId: ticket, direction: 'en-pt', rating: 'easy' },
      ],
    },
    alias: firstReview,
  },
}

function view(range = {}, value = data) {
  return selectLearningAnalytics(
    value,
    englishA1Index,
    [word, word, 'unresolved'],
    new Map<string, VocabularyAnnotation>([
      [
        word,
        {
          vocabularyId: word,
          createdAt: before,
          updatedAt: after,
          familiarity: 'learning',
        },
      ],
      [
        ticket,
        {
          vocabularyId: ticket,
          createdAt: before,
          updatedAt: after,
          familiarity: 'familiar',
        },
      ],
    ]),
    range,
  )
}

it('uses the same totals as the Dashboard and separates publication, time, performance and self-reports', () => {
  const { allTime, period, limitations } = view()
  expect(allTime.curriculum).toMatchObject({
    completed: 1,
    inProgress: 1,
    ready: 2,
    published: 4,
    planned: 44,
    total: 48,
  })
  expect(allTime.curriculum.completed).toBe(
    getCurriculumOverview(englishA1Index, data).completedCount,
  )
  expect(allTime.curriculum.units[0]).toMatchObject({
    published: 4,
    completed: 1,
  })
  expect(allTime.reading).toEqual(readingTotals(data))
  expect(allTime.reading).toEqual({ stories: 1, chapters: 2, activeMs: 2000 })
  expect(allTime.games).toEqual(selectGameTotals(selectGameHistory(data)))
  expect(allTime.flashcards).toEqual(
    summarizeFlashcardHistory(selectFlashcardHistory(data)),
  )
  expect(allTime.simulations).toEqual({ sessions: 2, distinct: 1 })
  expect(allTime.favorites).toBe(2)
  expect(allTime.familiarity).toEqual({
    learning: 1,
    unclassified: 1,
    familiar: 0,
    reviewing: 0,
  })
  expect(period.flashcards.recall).toEqual({ effort: 1, easy: 1, forgot: 0 })
  expect(period.activeMs).toBe(13_500)
  expect(period.activeMs).toBe(totalStudyMs(data))
  expect(period.activeDays).toBe(2)
  expect(period.lessonsMs).toBe(4000)
  expect(period.readingMs).toBe(2000)
  expect(period.lessonPerformance.byMode).toEqual({
    practice: { correct: 1, attempted: 1 },
    'text-alternative': { correct: 0, attempted: 1 },
  })
  expect(period.comprehension).toMatchObject({ attempted: 1, correct: 1 })
  expect(period.games.memory).toEqual({ sessions: 1, pairs: 2, mismatches: 1 })
  expect(period.recent.filter(({ kind }) => kind === 'lesson')).toHaveLength(1)
  expect(period.recent.every(({ at }) => at >= before)).toBe(true)
  expect(limitations.undatedChapters).toBe(1)
})

it('applies inclusive local dates to activity and completion independently, preserving overall completion', () => {
  const first = view({ from: day1, to: day1 })
  const second = view({ from: day2, to: day2 })
  expect(first.allTime).toEqual(second.allTime)
  expect(first.period.activeMs).toBe(2500)
  expect(first.period.games.completed).toBe(0)
  expect(first.period.games.activeMs).toBe(1000)
  expect(first.period.activeDays).toBe(1)
  expect(first.period.lessonsMs).toBeUndefined()
  expect(first.period.readingMs).toBeUndefined()
  expect(first.period.lessonPerformance.attempted).toBe(1)
  expect(first.period.lessonPerformance.correct).toBe(0)
  expect(second.period.lessonPerformance.correct).toBe(1)
  expect(second.period.simulations).toMatchObject({
    sessions: 2,
    activeMs: 1000,
    situations: [{ id: 'shopping', sessions: 2, distinct: 1 }],
  })
  expect(second.period.activeMs).toBe(11_000)
  expect(first.period.daily[0].totalMs).toBe(combinedDailyStudyMs(data)[day1])
  expect(validStudyRange({ from: day2, to: day1 })).toBe(false)
  expect(validStudyRange({ from: '2026-02-30' })).toBe(false)
  expect(
    view({ from: day2, to: day1 }).period.lessonPerformance.attempted,
  ).toBe(0)
})

it('keeps empty and legacy data valid and does not fabricate historical dates or a split for inconsistent time', () => {
  const empty = view({}, emptyProgress())
  expect(empty.period).toMatchObject({
    activeMs: 0,
    activeDays: 0,
    recent: [],
    lessonsMs: 0,
    readingMs: 0,
  })
  const legacy = parseProgress(
    JSON.stringify({
      version: 1,
      data: { lessons: {}, dailyStudyMs: { [day1]: 2500 } },
    }),
  )!
  expect(view({}, legacy).period).toMatchObject({
    activeMs: 2500,
    activeDays: 1,
    lessonsMs: 2500,
    readingMs: 0,
    recent: [],
  })
  const mismatched = view(
    {},
    { ...data, dailyStudyMs: { [day1]: 1000, '2026-02-30': 9000 } },
  )
  expect(mismatched.period.activeMs).toBe(8500)
  expect(mismatched.period.lessonsMs).toBeUndefined()
  expect(mismatched.limitations.inconsistentSharedTime).toBe(true)
  const restored = parseProgress(serializeProgress(data))!
  expect(view({}, restored)).toEqual(view())
})

it('uses the same dated records for period and calendar selectors without inventing older chapter dates', () => {
  const input = {
    ...data,
    dailyStudyMs: { ...data.dailyStudyMs, '2026-11-27': 60_000 },
  }
  const now = day2
  const result = selectLearningAnalytics(
    input,
    englishA1Index,
    [],
    new Map(),
    { from: day1, to: day1 },
    now,
  )
  expect(result.calendar.daily.map(({ day }) => day)).toEqual([day1, day2])
  expect(result.period.daily.map(({ day }) => day)).toEqual([day1])
  expect(result.period.lessonsMs).toBeUndefined()
  expect(
    result.calendar.milestones
      .filter(({ kind }) => kind === 'chapter')
      .map(({ contentId }) => contentId),
  ).toEqual(['morning-rain'])
  expect(result.limitations.undatedChapters).toBeGreaterThan(0)
  const all = selectLearningAnalytics(
    input,
    englishA1Index,
    [],
    new Map(),
    {},
    now,
  )
  expect(all.period.activeMs).toBe(totalStudyMs(data))
  expect(all.period.lessonsMs).toBeUndefined()
})

it('uses the canonical bilingual A1 metadata for twelve units and all 48 lesson outlines', () => {
  const { curriculum } = view().allTime
  expect(curriculum.units).toHaveLength(12)
  expect(curriculum.units.every(({ titlePtBr }) => Boolean(titlePtBr))).toBe(
    true,
  )
  expect(curriculum.units.flatMap(({ lessons }) => lessons)).toHaveLength(48)
  expect(curriculum.units[0].lessons.map(({ status }) => status)).toEqual([
    'completed',
    'in-progress',
    'available',
    'available',
  ])
  expect(curriculum.units[0]).toMatchObject({
    titlePtBr: 'Olá, prazer em conhecer você!',
    published: 4,
    completed: 1,
    planned: 0,
  })
  expect(
    curriculum.units
      .slice(1)
      .every(({ published, planned }) => published === 0 && planned === 4),
  ).toBe(true)
  expect(
    curriculum.units.flatMap(({ lessons }) =>
      lessons.map(({ lesson }) => lesson),
    ),
  ).toEqual(englishA1Index.units.flatMap(({ lessons }) => lessons))
})

it('counts dated lesson submissions and explicit correction reviews separately, deduplicating the retained run', () => {
  const range = { from: day2, to: day2 }
  const lesson = selectLessonReport(data, view(range), range, day2)
  expect(lesson.performance).toMatchObject({
    submissions: 1,
    independentlyCorrect: 1,
    correct: 1,
    attempted: 1,
    corrections: 1,
    incorrect: 0,
  })
  expect(lesson.review).toEqual([
    {
      id: lessonId,
      title: englishA1Index.units[0].lessons[0].title,
      focus: englishA1Index.units[0].lessons[0].focus,
      incorrect: 0,
      corrections: 1,
    },
  ])
  expect(lesson.activeMs).toBeUndefined()
  const original = selectLessonReport(data, view(), {}, day2)
  expect(original.performance).toMatchObject({
    submissions: 2,
    independentlyCorrect: 1,
    corrections: 1,
  })
  expect(original.activeMs).toBe(4000)
})

it('reports catalog coverage, distinct reading and optional comprehension without supplying missing chapter dates', () => {
  expect(
    storyIndex.map(({ id, publication, chapters }) => [
      id,
      publication,
      chapters.map(({ id }) => id),
    ]),
  ).toEqual(
    stories.map(({ id, publication, chapters }) => [
      id,
      publication,
      chapters.map(({ id }) => id),
    ]),
  )
  const range = { from: day1, to: day1 }
  const firstTrip = storyIndex.find(({ id }) => id === 'the-first-trip')!
  const rainy = storyIndex.find(({ id }) => id === 'a-rainy-morning')!
  const optional = {
    ...data,
    reading: {
      ...data.reading!,
      stories: {
        ...data.reading!.stories,
        [firstTrip.id]: {
          activeMs: 0,
          readChapterIds: [firstTrip.chapters[0].id],
          run: {
            id: 'first-trip-run',
            startedAt: before,
            chapterId: firstTrip.chapters[1].id,
            activeMs: 0,
            chapters: {},
          },
        },
      },
    },
  }
  const report = selectStoryReport(optional, view(range, optional), range, day2)
  expect(report).toMatchObject({
    stories: 1,
    reading: 1,
    chapters: 3,
    undated: 2,
    coverage: { published: 2, total: 6 },
    performance: { submissions: 0, corrections: 0 },
    activeMs: undefined,
  })
  expect(report.entries.find(({ id }) => id === rainy.id)?.status).toBe(
    'completed',
  )
  const active = report.entries.find(({ id }) => id === firstTrip.id)
  expect(active).toMatchObject({ status: 'in-progress', read: 1 })
  expect(active?.chapters[0]).toMatchObject({
    read: true,
    performance: { submissions: 0 },
  })
})

it('preserves each game metric and associates sentence topics with real challenge metadata', () => {
  expect(
    sentenceChallenges.map(({ id, topics, sentence }) => [
      id,
      { topics, sentence },
    ]),
  ).toEqual(Object.entries(sentenceChallengeMetadata))
  const session = {
    ...sharedGame,
    sessionId: 'sentence-one',
    gameId: 'sentence-builder',
    topic: 'mixed',
    challenges: [
      { id: 'name-ana', reviewed: true, incorrectAnswers: ['Ana is name my.'] },
      { id: 'name-leo', reviewed: false, incorrectAnswers: [] },
    ],
    correctCount: 1,
    firstAttemptCorrect: 1,
  } as const
  const games = selectGamesReport(
    view(
      {},
      {
        ...data,
        gameSessions: { ...data.gameSessions, 'sentence-one': session },
      },
    ).period,
  )
  expect(games.wordMatch).toMatchObject({
    sessions: 2,
    pairs: 4,
    firstCorrect: 2,
    attempts: 6,
    reviewItems: 1,
  })
  expect(games.sentenceBuilder).toMatchObject({
    sessions: 1,
    practiced: 2,
    independentlyCorrect: 1,
    firstCorrect: 1,
    corrections: 1,
    topics: ['introductions', 'affirmative'],
  })
  expect(games.memory).toEqual({
    sessions: 1,
    pairs: 2,
    mismatches: 1,
    attempts: 3,
  })
  expect(
    games.recent.find(({ gameId }) => gameId === 'sentence-builder'),
  ).toMatchObject({
    reviewCount: 1,
    knownSentences: [
      { id: 'name-ana', text: 'My name is Ana.', reviewed: true },
      { id: 'name-leo', text: 'My name is Leo.', reviewed: false },
    ],
  })
  expect(games.recent.map(({ sessionId }) => sessionId)).toEqual([
    'game-one',
    'game-two',
    'sentence-one',
    'memory-one',
  ])
})

it('keeps practical situation coverage distinct from repeats and separates response fit and explicit review', () => {
  const session = data.simulationSessions!['simulation-one']!
  const current = {
    ...data,
    simulationSessions: {
      ...data.simulationSessions,
      'simulation-one': {
        ...session,
        reviewedCorrections: 1,
        attempts: [
          { nodeId: 'opening', choiceId: 'wrong-context', fit: 'context' },
          { nodeId: 'opening', choiceId: 'wrong-grammar', fit: 'language' },
        ],
      },
      alias: session,
    },
  } satisfies LearnerProgress
  const report = selectPracticalReport(current, view({}, current).period)
  expect(report).toMatchObject({
    sessions: 2,
    distinct: 1,
    practiced: 1,
    responses: {
      attempts: 3,
      firstAppropriate: 1,
      decisions: 2,
      context: 1,
      language: 1,
      corrections: 1,
    },
  })
  expect(report.coverage.find(({ id }) => id === 'shopping')).toMatchObject({
    completed: 1,
    scenarios: expect.arrayContaining([
      { id: 'ask-the-price', title: expect.any(String), completed: true },
    ]),
  })
  const earlier = selectPracticalReport(
    current,
    view({ from: day1, to: day1 }, current).period,
  )
  expect(earlier).toMatchObject({ sessions: 0, practiced: 0, activeMs: 500 })
  expect(earlier.coverage).toEqual(report.coverage)
})

it('keeps self-reported recall within the period and current familiarity independent of it', () => {
  const whole = selectNotebookReport(view())
  const earlier = selectNotebookReport(view({ from: day1, to: day1 }))
  expect(whole).toMatchObject({
    saved: 2,
    familiarity: { learning: 1, unclassified: 1 },
    reviews: {
      sessions: 2,
      vocabulary: 1,
      recall: { forgot: 0, easy: 1, effort: 1 },
    },
  })
  expect(earlier.familiarity).toEqual(whole.familiarity)
  expect(earlier.reviews).toMatchObject({
    sessions: 0,
    vocabulary: 0,
    recall: { forgot: 0, effort: 0, easy: 0 },
  })
})
