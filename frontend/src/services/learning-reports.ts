import { sentenceChallengeMetadata } from '@/data/sentence-metadata'
import { simulationSummaries } from '@/data/simulations'
import { storyIndex } from '@/data/story-index'
import {
  collectPerformance,
  lessonAttempts,
  readingAttempts,
  recordedDuring,
  retainedRuns,
  type selectLearningAnalytics,
} from '@/services/learning-analytics'
import {
  getReadingProgress,
  getReadingStatus,
} from '@/services/reading-progress'
import { recordedSessions } from '@/services/study-time'
import type { CompletedGameSession } from '@/types/game-history'
import type { StudyDateRange } from '@/types/learning-analytics'
import type { LearnerProgress } from '@/types/progress'
import type { SentenceTopic } from '@/types/sentence-builder'
import type { CompletedSimulationSession } from '@/types/simulation-progress'

type Analytics = ReturnType<typeof selectLearningAnalytics>

export function selectLessonReport(
  data: LearnerProgress,
  analytics: Analytics,
  range: StudyDateRange,
  through: string,
) {
  const eligible = recordedDuring(range, through)
  const review = analytics.allTime.curriculum.units.flatMap(({ lessons }) =>
    lessons.flatMap(({ lesson, status }) => {
      const record = data.lessons[lesson.id]
      if (!record || status === 'planned') return []
      const attempts = lessonAttempts(
        retainedRuns(record.run, record.completion?.run),
      )
      const { incorrect, corrections } = collectPerformance(attempts, eligible)
      return incorrect || corrections
        ? [
            {
              id: lesson.id,
              title: lesson.title,
              focus: lesson.focus,
              incorrect,
              corrections,
            },
          ]
        : []
    }),
  )
  return {
    curriculum: analytics.allTime.curriculum,
    performance: analytics.period.lessonPerformance,
    activeMs: analytics.period.lessonsMs,
    review,
  }
}

export function selectStoryReport(
  data: LearnerProgress,
  analytics: Analytics,
  range: StudyDateRange,
  through: string,
) {
  const records = getReadingProgress(data).stories
  const eligible = recordedDuring(range, through)
  const published = storyIndex.filter(
    ({ publication }) => publication === 'available',
  )
  const stories = published.map(({ id, title, chapters }) => {
    const record = records[id]
    const status = getReadingStatus(record)
    const runs = record ? retainedRuns(record.run, record.completion?.run) : []
    const readIds = new Set(record?.readChapterIds)
    const results = chapters.map(({ id, title }) => ({
      id,
      title,
      read: readIds.has(id),
      performance: collectPerformance(readingAttempts(runs, id), eligible),
    }))
    return {
      id,
      title,
      status,
      chapters: results,
      read: results.filter(({ read }) => read).length,
    }
  })
  return {
    ...analytics.allTime.reading,
    activeMs: analytics.period.readingMs,
    undated: analytics.limitations.undatedChapters,
    coverage: { published: published.length, total: storyIndex.length },
    reading: stories.filter(({ status }) => status === 'in-progress').length,
    performance: analytics.period.comprehension,
    entries: stories,
  }
}

function getSentenceMetadata(id: string) {
  return Object.hasOwn(sentenceChallengeMetadata, id)
    ? sentenceChallengeMetadata[id as keyof typeof sentenceChallengeMetadata]
    : undefined
}

function sentenceReviewCount(
  session: Extract<CompletedGameSession, { gameId: 'sentence-builder' }>,
) {
  return session.challenges.filter(({ reviewed }) => reviewed).length
}

function describeRecentGame(session: CompletedGameSession) {
  if (session.gameId !== 'sentence-builder') return session
  return {
    ...session,
    reviewCount: sentenceReviewCount(session),
    knownSentences: session.challenges.flatMap(({ id, reviewed }) => {
      const metadata = getSentenceMetadata(id)
      return metadata ? [{ id, reviewed, text: metadata.sentence }] : []
    }),
  }
}

function recentGames(sessions: CompletedGameSession[]) {
  return sessions
    .sort(
      (a, b) => b.endedAt - a.endedAt || a.sessionId.localeCompare(b.sessionId),
    )
    .slice(0, 3)
}

export function selectGamesReport({ games, records }: Analytics['period']) {
  const wordMatch = records.games.filter(
    (entry) => entry.gameId === 'word-match',
  )
  const sentenceBuilder = records.games.filter(
    (entry) => entry.gameId === 'sentence-builder',
  )
  const memory = records.games.filter((entry) => entry.gameId === 'memory-game')
  const topics = new Set<SentenceTopic>()
  for (const session of sentenceBuilder) {
    for (const { id } of session.challenges) {
      const metadata = getSentenceMetadata(id)
      if (metadata) metadata.topics.forEach((topic) => topics.add(topic))
      else if (session.topic !== 'mixed') topics.add(session.topic)
    }
  }
  return {
    ...games,
    wordMatch: {
      ...games.wordMatch,
      attempts: wordMatch.reduce(
        (sum, session) => sum + session.answeredCount,
        0,
      ),
      pairs: wordMatch.reduce((sum, session) => sum + session.correctCount, 0),
      reviewItems: new Set(wordMatch.flatMap(({ reviewIds }) => reviewIds))
        .size,
    },
    sentenceBuilder: {
      ...games.sentenceBuilder,
      practiced: sentenceBuilder.reduce(
        (sum, session) => sum + session.challenges.length,
        0,
      ),
      independentlyCorrect: sentenceBuilder.reduce(
        (sum, session) => sum + session.correctCount,
        0,
      ),
      corrections: sentenceBuilder.reduce(
        (sum, session) => sum + sentenceReviewCount(session),
        0,
      ),
      topics: [...topics],
    },
    memory: {
      ...games.memory,
      attempts: memory.reduce((sum, session) => sum + session.answeredCount, 0),
    },
    recent: [
      ...recentGames(wordMatch),
      ...recentGames(sentenceBuilder),
      ...recentGames(memory),
    ].map(describeRecentGame),
  }
}

const scenarioKey = ({
  id,
  situationId,
}: {
  id: string
  situationId: string
}) => situationId + '/' + id
const sessionScenarioKey = ({
  scenarioId,
  situationId,
}: CompletedSimulationSession) => scenarioKey({ id: scenarioId, situationId })

export function selectPracticalReport(
  data: LearnerProgress,
  period: Analytics['period'],
) {
  const sessions = period.records.simulations
  const completed = new Set(
    recordedSessions(data.simulationSessions).map(sessionScenarioKey),
  )
  const practiced = new Set(sessions.map(({ situationId }) => situationId))
  const coverage = new Map<
    string,
    {
      id: string
      scenarios: { id: string; title: string; completed: boolean }[]
    }
  >()
  for (const scenario of simulationSummaries) {
    const situation = coverage.get(scenario.situationId) ?? {
      id: scenario.situationId,
      scenarios: [],
    }
    situation.scenarios.push({
      id: scenario.id,
      title: scenario.title,
      completed: completed.has(scenarioKey(scenario)),
    })
    coverage.set(scenario.situationId, situation)
  }
  const responses = {
    attempts: 0,
    firstAppropriate: 0,
    decisions: 0,
    context: 0,
    language: 0,
    corrections: 0,
  }
  for (const session of sessions) {
    const seen = new Set<string>()
    responses.corrections += session.reviewedCorrections
    for (const { nodeId, fit } of session.attempts) {
      responses.attempts++
      if (fit === 'context' || fit === 'language') responses[fit]++
      if (!seen.has(nodeId)) {
        responses.decisions++
        responses.firstAppropriate += Number(fit === 'appropriate')
        seen.add(nodeId)
      }
    }
  }
  return {
    ...period.simulations,
    distinct: period.simulations.situations.reduce(
      (sum, { distinct }) => sum + distinct,
      0,
    ),
    practiced: practiced.size,
    responses,
    coverage: [...coverage.values()].map((entry) => ({
      ...entry,
      completed: entry.scenarios.filter(({ completed }) => completed).length,
    })),
  }
}

export function selectNotebookReport({ allTime, period }: Analytics) {
  return {
    saved: allTime.favorites,
    familiarity: allTime.familiarity,
    reviews: period.flashcards,
  }
}
