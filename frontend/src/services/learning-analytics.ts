import {
  filterActivityHistory,
  selectActivityHistory,
} from '@/services/activity-history'
import { getCurriculumOverview } from '@/services/curriculum'
import {
  summarizeFlashcardHistory,
  summarizeRecall,
} from '@/services/flashcard-history'
import { selectGameTotals } from '@/services/game-history'
import { summarizeFamiliarity } from '@/services/notebook-selectors'
import { getReadingProgress, readingTotals } from '@/services/reading-progress'
import { validStudyRange } from '@/services/study-calendar'
import {
  getDailyStudySources,
  getSharedStudySplit,
  localStudyDay,
  recordedSessions,
} from '@/services/study-time'
import type { CefrLevelIndex } from '@/types/curriculum'
import type { ExerciseAttempt, SubmissionMode } from '@/types/exercise'
import type {
  CurriculumCounts,
  DailyLearningActivity,
  StudyDateRange,
  TimedModule,
} from '@/types/learning-analytics'
import type { VocabularyAnnotation } from '@/types/notebook'
import type { LearnerProgress, ReadingRun, StudyRun } from '@/types/progress'

function dayInRange(day: string, { from, to }: StudyDateRange) {
  return (!from || day >= from) && (!to || day <= to)
}

function inRange(at: number, range: StudyDateRange) {
  const time = new Date(at)
  return (
    Number.isFinite(time.getTime()) && dayInRange(localStudyDay(time), range)
  )
}

export function recordedDuring(range: StudyDateRange, through?: string) {
  const valid = validStudyRange(range)
  return (at: number) =>
    valid && inRange(at, range) && inRange(at, { to: through })
}

const zeroTime = (): Record<TimedModule, number> => ({
  lessonsAndReading: 0,
  games: 0,
  simulations: 0,
  flashcards: 0,
})

export function selectDailyLearningActivity(
  data: LearnerProgress,
  range: StudyDateRange = {},
): DailyLearningActivity[] {
  if (!validStudyRange(range)) return []
  const days = new Map<string, DailyLearningActivity>()
  const sources = getDailyStudySources(data)
  for (const module of Object.keys(sources) as TimedModule[]) {
    for (const [day, duration] of Object.entries(sources[module])) {
      if (!dayInRange(day, range)) continue
      const item = days.get(day) ?? { day, totalMs: 0, byModule: zeroTime() }
      item.byModule[module] += duration
      item.totalMs += duration
      days.set(day, item)
    }
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export function selectCurriculumAnalytics(
  level: CefrLevelIndex,
  data: LearnerProgress,
) {
  const overview = getCurriculumOverview(level, data)
  const blank = (): CurriculumCounts => ({
    completed: 0,
    inProgress: 0,
    ready: 0,
    published: 0,
    planned: 0,
    total: 0,
  })
  const totals = blank()
  const units = new Map(
    level.units.map((unit) => [
      unit.id,
      { ...unit, lessons: [] as typeof overview.lessons, ...blank() },
    ]),
  )
  for (const entry of overview.lessons) {
    const { unit, status } = entry
    const unitCounts = units.get(unit.id)
    if (!unitCounts) continue
    unitCounts.lessons.push(entry)
    for (const counts of [totals, unitCounts]) {
      counts.total++
      if (status === 'planned') counts.planned++
      else {
        counts.published++
        if (status === 'completed') counts.completed++
        else if (status === 'in-progress') counts.inProgress++
        else counts.ready++
      }
    }
  }
  return { ...totals, units: [...units.values()] }
}

export function retainedRuns<T extends { id: string }>(
  current: T,
  completed?: T,
) {
  return completed && completed.id !== current.id
    ? [completed, current]
    : [current]
}

export function collectPerformance(
  attempts: Iterable<ExerciseAttempt | undefined>,
  eligible: (at: number) => boolean,
) {
  const byMode: Partial<
    Record<SubmissionMode, { correct: number; attempted: number }>
  > = {}
  let attempted = 0
  let correct = 0
  let submissions = 0
  let independentlyCorrect = 0
  let corrections = 0
  let incorrect = 0
  for (const attempt of attempts) {
    if (!attempt) continue
    const responses = attempt.submissions.filter(({ submittedAt }) =>
      eligible(submittedAt),
    )
    submissions += responses.length
    incorrect += responses.filter(({ correct }) => !correct).length
    independentlyCorrect += Number(responses.some(({ correct }) => correct))
    corrections += Number(
      attempt.reviewedAt !== undefined && eligible(attempt.reviewedAt),
    )
    const first = attempt.submissions[0]
    if (!first || !eligible(first.submittedAt)) continue
    const mode = byMode[first.mode] ?? { correct: 0, attempted: 0 }
    mode.correct += Number(first.correct)
    mode.attempted++
    byMode[first.mode] = mode
    attempted++
    correct += Number(first.correct)
  }
  return {
    attempted,
    correct,
    byMode,
    submissions,
    independentlyCorrect,
    corrections,
    incorrect,
  }
}

export function* lessonAttempts(runs: Iterable<StudyRun>) {
  for (const run of runs) {
    for (const activity of Object.values(run.activities))
      if (activity) yield* Object.values(activity.attempts)
  }
}

export function* readingAttempts(
  runs: Iterable<ReadingRun>,
  chapterId?: string,
) {
  for (const run of runs) {
    for (const chapter of chapterId
      ? [run.chapters[chapterId]]
      : Object.values(run.chapters))
      if (chapter?.practice) yield* Object.values(chapter.practice.attempts)
  }
}

export function selectLearningAnalytics(
  data: LearnerProgress,
  level: CefrLevelIndex,
  favoriteIds: readonly string[],
  annotations: ReadonlyMap<string, VocabularyAnnotation>,
  range: StudyDateRange = {},
  through?: string,
) {
  const acceptedRange = validStudyRange(range)
  const scoped = recordedDuring(range, through)
  const filtered = Boolean(range.from || range.to)
  const calendarDays = selectDailyLearningActivity(data, { to: through })
  const daily = acceptedRange
    ? calendarDays.filter(({ day }) => dayInRange(day, range))
    : []
  const byModule = zeroTime()
  let activeMs = 0
  for (const day of daily) {
    activeMs += day.totalMs
    for (const key of Object.keys(byModule) as TimedModule[])
      byModule[key] += day.byModule[key]
  }

  const lessonRuns: StudyRun[] = []
  const readingRuns: ReadingRun[] = []
  for (const record of Object.values(data.lessons)) {
    if (record)
      lessonRuns.push(...retainedRuns(record.run, record.completion?.run))
  }
  for (const record of Object.values(getReadingProgress(data).stories)) {
    if (record)
      readingRuns.push(...retainedRuns(record.run, record.completion?.run))
  }
  const { entries: milestones, undatedChapters } = selectActivityHistory(
    data,
    through,
  )

  const gameAll = recordedSessions(data.gameSessions)
  const simulationAll = recordedSessions(data.simulationSessions)
  const flashcardAll = recordedSessions(data.flashcardSessions)
  const games = gameAll.filter(({ endedAt }) => scoped(endedAt))
  const simulations = simulationAll.filter(({ completedAt }) =>
    scoped(completedAt),
  )
  const flashcards = flashcardAll.filter(({ completedAt }) =>
    scoped(completedAt),
  )
  const reading = readingTotals(data)
  const sharedSplit = getSharedStudySplit(data, reading.activeMs)
  const canSplit =
    !filtered &&
    acceptedRange &&
    sharedSplit &&
    sharedSplit.lessonsMs + sharedSplit.readingMs === byModule.lessonsAndReading
  const situation = new Map<
    string,
    { sessions: number; scenarios: Set<string> }
  >()
  for (const session of simulations) {
    const entry = situation.get(session.situationId) ?? {
      sessions: 0,
      scenarios: new Set<string>(),
    }
    entry.sessions++
    entry.scenarios.add(session.scenarioId)
    situation.set(session.situationId, entry)
  }
  return {
    calendar: { daily: calendarDays, milestones },
    allTime: {
      curriculum: selectCurriculumAnalytics(level, data),
      reading,
      games: selectGameTotals(gameAll),
      simulations: {
        sessions: simulationAll.length,
        distinct: new Set(
          simulationAll.map(
            ({ situationId, scenarioId }) => `${situationId}/${scenarioId}`,
          ),
        ).size,
      },
      flashcards: summarizeFlashcardHistory(flashcardAll),
      favorites: new Set(favoriteIds).size,
      familiarity: summarizeFamiliarity(favoriteIds, annotations),
    },
    period: {
      records: { games, simulations, flashcards },
      daily,
      activeMs,
      activeDays: daily.length,
      byModule,
      lessonsMs: canSplit ? sharedSplit.lessonsMs : undefined,
      readingMs: canSplit ? sharedSplit.readingMs : undefined,
      lessonPerformance: collectPerformance(lessonAttempts(lessonRuns), scoped),
      comprehension: collectPerformance(readingAttempts(readingRuns), scoped),
      games: {
        ...selectGameTotals(games),
        activeMs: byModule.games,
        wordMatch: {
          sessions: games.filter((game) => game.gameId === 'word-match').length,
          firstCorrect: games.reduce(
            (sum, game) =>
              sum +
              (game.gameId === 'word-match' ? game.firstAttemptCorrect : 0),
            0,
          ),
        },
        sentenceBuilder: {
          sessions: games.filter((game) => game.gameId === 'sentence-builder')
            .length,
          firstCorrect: games.reduce(
            (sum, game) =>
              sum +
              (game.gameId === 'sentence-builder'
                ? game.firstAttemptCorrect
                : 0),
            0,
          ),
        },
        memory: {
          sessions: games.filter((game) => game.gameId === 'memory-game')
            .length,
          pairs: games.reduce(
            (sum, game) =>
              sum + (game.gameId === 'memory-game' ? game.totalPairs : 0),
            0,
          ),
          mismatches: games.reduce(
            (sum, game) =>
              sum +
              (game.gameId === 'memory-game' ? game.incorrectAttempts : 0),
            0,
          ),
        },
      },
      simulations: {
        sessions: simulations.length,
        activeMs: byModule.simulations,
        situations: [...situation]
          .map(([id, entry]) => ({
            id,
            sessions: entry.sessions,
            distinct: entry.scenarios.size,
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      },
      flashcards: {
        ...summarizeFlashcardHistory(flashcards),
        activeMs: byModule.flashcards,
        recall: summarizeRecall(
          flashcards.flatMap(({ observations }) => observations),
        ),
      },
      recent: filterActivityHistory(milestones, range),
    },
    limitations: {
      undatedChapters,
      inconsistentSharedTime: !sharedSplit,
      splitUnavailable: !canSplit,
    },
  }
}
