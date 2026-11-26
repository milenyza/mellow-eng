import {
  getLessonPath,
  getPracticalSimulationPath,
  getStoryPath,
} from '@/data/navigation'
import { selectFlashcardHistory } from '@/services/flashcard-history'
import { resolveNotebookVocabulary } from '@/services/notebook-content'
import type { GuidedConversation } from '@/types/conversation'
import type { VocabularyAnnotation } from '@/types/notebook'
import type { LearnerProgress } from '@/types/progress'
import type {
  ReviewEvidence,
  ReviewRecommendation,
} from '@/types/recommendation'
import type { CompletedSimulationSession } from '@/types/simulation-progress'
import type { SentenceChallenge } from '@/types/sentence-builder'

export function collectVocabularyEvidence(
  data: LearnerProgress,
  ids: readonly string[],
  annotations: ReadonlyMap<string, VocabularyAnnotation>,
  simulations: ReadonlyMap<string, GuidedConversation>,
) {
  const evidence = new Map<string, ReviewEvidence[]>()
  function add(id: string, reason: ReviewEvidence) {
    const previous = evidence.get(id) ?? []
    const index = previous.findIndex(
      (item) =>
        item.source === reason.source &&
        item.explanation === reason.explanation,
    )
    if (index < 0) evidence.set(id, [...previous, reason])
    else {
      const current = previous[index]
      previous[index] = {
        ...((reason.at ?? 0) > (current.at ?? 0) ? reason : current),
        count: current.count + reason.count,
      }
    }
  }

  const seen = new Map<
    string,
    { explanation?: string; at: number; count: number; closed: boolean }
  >()
  for (const session of selectFlashcardHistory(data)) {
    for (const { vocabularyId, rating } of session.observations) {
      const current = seen.get(vocabularyId)
      if (!current) {
        seen.set(vocabularyId, {
          explanation:
            rating === 'easy'
              ? undefined
              : rating === 'forgot'
                ? 'Na última revisão, você marcou que não lembrou deste item.'
                : 'Na última revisão, você marcou que lembrou deste item com esforço.',
          at: session.completedAt,
          count: 1,
          closed: rating === 'easy',
        })
      } else if (!current.closed) {
        if (rating === 'easy') current.closed = true
        else current.count++
      }
    }
  }
  for (const [id, observation] of seen)
    if (observation.explanation)
      add(id, {
        source: 'flashcards',
        explanation: observation.explanation,
        at: observation.at,
        count: observation.count,
      })

  for (const session of Object.values(data.gameSessions ?? {})) {
    if (session?.gameId !== 'word-match') continue
    for (const id of new Set(session.reviewIds))
      add(id, {
        source: 'word-match',
        explanation:
          'Este item esteve em uma tentativa de pareamento incorreta. Vale praticar o par outra vez.',
        at: session.endedAt,
        count: 1,
      })
  }

  for (const id of new Set(ids)) {
    const annotation = annotations.get(id)
    if (
      annotation?.familiarity !== 'learning' &&
      annotation?.familiarity !== 'reviewing'
    )
      continue
    add(id, {
      source: 'familiarity',
      count: 1,
      explanation:
        annotation.familiarity === 'learning'
          ? 'Você marcou este item como Aprendendo.'
          : 'Você marcou este item como Revisando.',
    })
  }

  for (const session of Object.values(data.simulationSessions ?? {})) {
    if (!session) continue
    const scenario = simulations.get(simulationKey(session))
    if (!scenario) continue
    const related = collectSimulationEvidence(session, scenario)
    const href = getPracticalSimulationPath(
      session.situationId,
      session.scenarioId,
    )
    for (const id of related.context)
      add(id, {
        source: 'simulation',
        at: session.completedAt,
        count: 1,
        href,
        explanation:
          'Houve uma escolha fora de contexto neste trecho. Reveja uma expressão adequada para a situação.',
      })
    for (const id of related.correction)
      add(id, {
        source: 'simulation',
        at: session.completedAt,
        count: 1,
        href,
        explanation: related.languageCorrection.has(id)
          ? 'Você revisou uma correção de inglês neste trecho ligado à expressão.'
          : 'Você avançou após revisar uma correção em um trecho ligado a esta expressão.',
      })
  }
  return evidence
}

export function collectSimulationEvidence(
  session: CompletedSimulationSession,
  scenario: GuidedConversation,
) {
  const context = new Set<string>()
  const correction = new Set<string>()
  const languageCorrection = new Set<string>()
  const byNode = new Map<
    string,
    CompletedSimulationSession['attempts'][number][]
  >()
  for (const attempt of session.attempts) {
    const list = byNode.get(attempt.nodeId)
    if (list) list.push(attempt)
    else byNode.set(attempt.nodeId, [attempt])
  }
  const visited = [...byNode.entries()]
  visited.forEach(([nodeId, attempts], index) => {
    const node = scenario.nodes.find((candidate) => candidate.id === nodeId)
    if (node?.kind !== 'decision') return
    const authoredAttempts = attempts.filter((attempt) =>
      node.choices.some(
        (choice) =>
          choice.id === attempt.choiceId && choice.fit === attempt.fit,
      ),
    )
    if (authoredAttempts.length !== attempts.length) return
    const appropriate = node.choices.filter(
      (choice) => choice.fit === 'appropriate',
    )
    if (authoredAttempts.some(({ fit }) => fit === 'context'))
      appropriate
        .flatMap(({ expressionIds }) => expressionIds ?? [])
        .forEach((id) => context.add(id))
    if (
      !session.reviewedCorrections ||
      authoredAttempts.some(({ fit }) => fit === 'appropriate')
    )
      return

    const next = visited[index + 1]?.[0]
    const candidates = appropriate.filter(({ nextNodeId }) =>
      next
        ? nextNodeId === next
        : scenario.nodes.some(
            (candidate) =>
              candidate.id === nextNodeId && candidate.kind === 'success',
          ),
    )
    for (const id of candidates[0]?.expressionIds ?? [])
      if (
        candidates.every(({ expressionIds }) => expressionIds?.includes(id))
      ) {
        correction.add(id)
        if (authoredAttempts.at(-1)?.fit === 'language')
          languageCorrection.add(id)
      }
  })
  return { context, correction, languageCorrection }
}

function collectSentenceEvidence(
  data: LearnerProgress,
  challenges: readonly SentenceChallenge[],
  topicLabels: Readonly<Record<string, string>>,
) {
  const reasons = new Map<string, ReviewEvidence>()
  for (const session of Object.values(data.gameSessions ?? {})) {
    if (session?.gameId !== 'sentence-builder') continue
    for (const item of session.challenges) {
      if (!item.reviewed && !item.incorrectAnswers.length) continue
      const previous = reasons.get(item.id)
      const at = session.endedAt
      const reason: ReviewEvidence = {
        source: 'sentence-builder',
        at,
        count: 1,
        explanation: item.reviewed
          ? 'Você revisou uma correção desta frase no Sentence Builder.'
          : 'Houve uma tentativa incorreta ao montar esta frase no Sentence Builder.',
      }
      reasons.set(item.id, {
        ...((previous?.at ?? 0) > at && previous ? previous : reason),
        count: (previous?.count ?? 0) + 1,
      })
    }
  }
  return challenges.flatMap((challenge): ReviewRecommendation[] => {
    const reason = reasons.get(challenge.id)
    if (!reason) return []
    const ref = challenge.reference
    return [
      {
        kind: 'sentence',
        id: challenge.id,
        text: challenge.sentence,
        explanation: challenge.topics
          .map((topic) => topicLabels[topic])
          .filter(Boolean)
          .join(' · '),
        href:
          ref.kind === 'lesson'
            ? getLessonPath(ref.lessonId)
            : getStoryPath(ref.storyId, ref.chapterId),
        reasons: [reason],
      },
    ]
  })
}

export function sortReviewRecommendations(
  recommendations: readonly ReviewRecommendation[],
) {
  const rank = (item: ReviewRecommendation) => ({
    recent: Math.max(...item.reasons.map(({ at }) => at ?? 0)),
    repeated: item.reasons.reduce((sum, reason) => sum + reason.count, 0),
  })
  return [...recommendations].sort((a, b) => {
    const left = rank(a)
    const right = rank(b)
    return (
      right.recent - left.recent ||
      right.repeated - left.repeated ||
      a.id.localeCompare(b.id)
    )
  })
}

function simulationKey(session: CompletedSimulationSession) {
  return `${session.situationId}/${session.scenarioId}`
}

export async function loadReviewRecommendations(
  data: LearnerProgress,
  ids: readonly string[],
  annotations: ReadonlyMap<string, VocabularyAnnotation>,
) {
  const relevant = Object.values(data.simulationSessions ?? {}).filter(
    (session): session is CompletedSimulationSession =>
      !!session &&
      (!!session.reviewedCorrections ||
        session.attempts.some(({ fit }) => fit === 'context')),
  )
  const unique = new Map(
    relevant.map((session) => [simulationKey(session), session]),
  )
  const simulations = new Map<string, GuidedConversation>()
  const needsSentences = Object.values(data.gameSessions ?? {}).some(
    (session) =>
      session?.gameId === 'sentence-builder' &&
      session.challenges.some(
        ({ reviewed, incorrectAnswers }) =>
          reviewed || !!incorrectAnswers.length,
      ),
  )
  const sentences = needsSentences
    ? import('@/data/sentence-challenges').then(
        ({ sentenceChallenges, sentenceTopics }) =>
          collectSentenceEvidence(data, sentenceChallenges, sentenceTopics),
        () => [],
      )
    : Promise.resolve([])
  if (unique.size) {
    try {
      const { loadSimulation } =
        await import('@/data/simulations/load-simulation')
      await Promise.allSettled(
        [...unique].map(async ([key, { situationId, scenarioId }]) => {
          const { scenario } = await loadSimulation(situationId, scenarioId)
          if (scenario) simulations.set(key, scenario)
        }),
      )
    } catch {
      // Other evidence is still available when a simulation chunk cannot load.
    }
  }
  const evidence = collectVocabularyEvidence(
    data,
    ids,
    annotations,
    simulations,
  )
  const [resolved, sentenceReviews] = await Promise.all([
    resolveNotebookVocabulary([...evidence.keys()]),
    sentences,
  ])
  const vocabulary = [...evidence].flatMap(
    ([id, reasons]): ReviewRecommendation[] => {
      const item = resolved.vocabulary.get(id)
      return item ? [{ kind: 'vocabulary', id, item, reasons }] : []
    },
  )
  return sortReviewRecommendations([...vocabulary, ...sentenceReviews])
}
