import { expect, it } from 'vitest'
import { loadSimulation } from '@/data/simulations/load-simulation'
import {
  collectSimulationEvidence,
  collectVocabularyEvidence,
  loadReviewRecommendations,
} from './review-recommendations'
import { recordFlashcardSession } from './flashcard-history'
import { emptyProgress } from './progress-format'
import type { FlashcardResult, RecallRating } from '@/types/flashcards'
import type { CompletedGameSession } from '@/types/game-history'
import type { LearnerProgress } from '@/types/progress'
import type { CompletedSimulationSession } from '@/types/simulation-progress'
import type { VocabularyAnnotation } from '@/types/notebook'

const daily = 'en-a-little'
const ticket = 'story-first-trip-ticket'
const memoryOnly = 'story-rainy-morning-umbrella'
const passage = 'practical-getting-around-ticket-to'
const lesson = 'english-for-pt-br/en-a1-introductions-hello/greetings/hello'

function review(
  data: LearnerProgress,
  id: string,
  rating: RecallRating,
  at: number,
  vocabularyId: string,
) {
  const result: FlashcardResult = {
    sessionId: id,
    startedAt: at - 1,
    completedAt: at,
    activeMs: 0,
    configuration: {
      direction: 'en-pt',
      length: 'all',
      scope: 'saved',
      filters: { source: '', query: '', type: '', level: '' },
    },
    observations: [{ vocabularyId, rating, direction: 'en-pt' }],
  }
  return recordFlashcardSession(data, result, {})
}

const simulation: CompletedSimulationSession = {
  sessionId: 'simulation-one',
  scenarioId: 'flight-check-in',
  situationId: 'at-the-airport',
  startedAt: 1,
  completedAt: 12,
  decisionsCompleted: 4,
  reviewedCorrections: 1,
  activeMs: 0,
  dailyPracticeMs: {},
  attempts: [
    { nodeId: 'documents', choiceId: 'documents-hotel', fit: 'context' },
    { nodeId: 'documents', choiceId: 'documents-passport', fit: 'appropriate' },
    {
      nodeId: 'flight-number',
      choiceId: 'flight-number-omit-verb',
      fit: 'language',
    },
    { nodeId: 'luggage', choiceId: 'luggage-check', fit: 'appropriate' },
    { nodeId: 'gate', choiceId: 'gate-confirm', fit: 'appropriate' },
  ],
}

it('groups real evidence by reference and drops old flashcard difficulty after an easy recall', async () => {
  const base = {
    startedAt: 1,
    endedAt: 15,
    activeMs: 0,
    dailyPracticeMs: {},
    level: 'A1',
    difficulty: 'easy',
    outcome: 'completed',
    answeredCount: 2,
    correctCount: 1,
  } as const
  const games: Record<string, CompletedGameSession> = {
    matching: {
      ...base,
      sessionId: 'matching',
      gameId: 'word-match',
      source: 'saved',
      roundsCompleted: 1,
      firstAttemptCorrect: 0,
      vocabularyIds: [ticket],
      reviewIds: [ticket],
    },
    memory: {
      ...base,
      sessionId: 'memory',
      gameId: 'memory-game',
      source: 'stories',
      totalPairs: 1,
      incorrectAttempts: 1,
      vocabularyIds: [memoryOnly],
    },
    sentence: {
      ...base,
      sessionId: 'sentence',
      gameId: 'sentence-builder',
      topic: 'introductions',
      firstAttemptCorrect: 0,
      challenges: [
        {
          id: 'name-ana',
          reviewed: true,
          incorrectAnswers: ['Ana is My name'],
        },
      ],
    },
  }
  const initial = {
    ...emptyProgress(),
    gameSessions: games,
    simulationSessions: { 'simulation-one': simulation },
  }
  const data = review(
    review(
      review(
        review(
          review(initial, 'old', 'forgot', 10, daily),
          'new',
          'easy',
          20,
          daily,
        ),
        'story-old',
        'forgot',
        30,
        ticket,
      ),
      'story-new',
      'effort',
      40,
      ticket,
    ),
    'lesson-review',
    'effort',
    45,
    lesson,
  )
  const annotations = new Map<string, VocabularyAnnotation>([
    [
      ticket,
      {
        vocabularyId: ticket,
        familiarity: 'reviewing',
        createdAt: 1,
        updatedAt: 25,
      },
    ],
  ])
  const result = await loadReviewRecommendations(
    data,
    [ticket, passage],
    annotations,
  )
  expect(result.map(({ id }) => id)).not.toContain(daily)
  expect(result.map(({ id }) => id)).not.toContain(memoryOnly)
  expect(result.map(({ id }) => id)).not.toContain(passage)
  expect(result.filter(({ id }) => id === ticket)).toHaveLength(1)
  expect(result.find(({ id }) => id === ticket)?.reasons).toEqual([
    expect.objectContaining({
      source: 'flashcards',
      count: 2,
      at: 40,
      explanation: expect.stringContaining('com esforço'),
    }),
    expect.objectContaining({ source: 'word-match', at: 15 }),
    expect.objectContaining({ source: 'familiarity' }),
  ])
  expect(result.find(({ id }) => id === 'name-ana')).toMatchObject({
    kind: 'sentence',
    href: '/aulas/en-a1-introductions-hello',
    explanation: 'Cumprimentos e apresentações · Frases afirmativas',
    reasons: [
      expect.objectContaining({
        explanation: expect.stringContaining('revisou uma correção'),
      }),
    ],
  })
  expect(result[0].id).toBe(lesson)
})

it('uses authored context and correction references without treating distractors or grammar attempts as lexical failure', async () => {
  const { scenario } = await loadSimulation('at-the-airport', 'flight-check-in')
  const { context, correction } = collectSimulationEvidence(
    simulation,
    scenario!,
  )
  expect([...context]).toEqual([
    'practical-at-the-airport-passport',
    'practical-at-the-airport-flight-number',
  ])
  expect([...correction]).toEqual(['practical-at-the-airport-flight-number'])
  const other = {
    ...simulation,
    attempts: simulation.attempts.map((attempt) =>
      attempt.nodeId === 'documents'
        ? { ...attempt, choiceId: 'removed' }
        : attempt,
    ),
  }
  expect(collectSimulationEvidence(other, scenario!).context.size).toBe(0)
  const map = new Map([['at-the-airport/flight-check-in', scenario!]])
  const reasons = collectVocabularyEvidence(
    {
      ...emptyProgress(),
      simulationSessions: { 'simulation-one': simulation },
    },
    [],
    new Map(),
    map,
  )
  expect(
    reasons
      .get('practical-at-the-airport-flight-number')
      ?.map(({ explanation }) => explanation),
  ).toEqual([
    expect.stringContaining('fora de contexto'),
    expect.stringContaining('correção de inglês'),
  ])
})
