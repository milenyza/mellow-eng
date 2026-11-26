import { shuffle } from '@/services/shuffle'
import type {
  Flashcard,
  FlashcardConfiguration,
  FlashcardDirection,
  FlashcardResult,
  FlashcardSession,
  RecallObservation,
  RecallRating,
  ReviewLength,
} from '@/types/flashcards'
import type { NotebookItem } from '@/types/notebook'

const fixedLengths = [5, 10, 20] as const

export function getReviewLengths(eligible: number): ReviewLength[] {
  return eligible > 0
    ? [...fixedLengths.filter((size) => size <= eligible), 'all']
    : []
}

export function generateFlashcards(
  items: readonly NotebookItem[],
  configuration: FlashcardConfiguration,
  random = Math.random,
): Flashcard[] {
  const unique = new Map<string, NotebookItem>()
  for (const item of items) {
    if (
      item.vocabulary.text.trim() &&
      item.vocabulary.translation.trim() &&
      !unique.has(item.vocabularyId)
    )
      unique.set(item.vocabularyId, item)
  }
  if (!getReviewLengths(unique.size).includes(configuration.length)) return []
  const count =
    configuration.length === 'all' ? unique.size : configuration.length
  const selected = shuffle([...unique.values()], random).slice(0, count)
  if (configuration.direction !== 'mixed') {
    const direction = configuration.direction
    return selected.map((item) => ({ item, direction }))
  }

  const englishCount =
    Math.floor(count / 2) + Number(count % 2 === 1 && random() < 0.5)
  const directions = shuffle(
    Array.from({ length: count }, (_, index): FlashcardDirection =>
      index < englishCount ? 'en-pt' : 'pt-en',
    ),
    random,
  )
  return selected.map((item, index) => ({ item, direction: directions[index] }))
}

export function startFlashcardSession(
  cards: readonly Flashcard[],
  configuration: FlashcardConfiguration,
  startedAt = Date.now(),
): FlashcardSession {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `review-${startedAt}-${Math.random().toString(36).slice(2) || '0'}`,
    configuration,
    cards,
    position: 0,
    revealedIds: [],
    observations: [],
    startedAt,
  }
}

export type FlashcardAction =
  | { kind: 'reveal' | 'previous' | 'next' }
  | { kind: 'rate'; vocabularyId: string; rating: RecallRating; at: number }

export function updateFlashcardSession(
  session: FlashcardSession,
  action: FlashcardAction,
): FlashcardSession {
  const card = session.cards[session.position]
  if (session.completedAt !== undefined || !card) return session
  const id = card.item.vocabularyId
  const revealed = session.revealedIds.includes(id)
  const rated = session.observations.some(
    ({ vocabularyId }) => vocabularyId === id,
  )

  switch (action.kind) {
    case 'reveal':
      return revealed
        ? session
        : { ...session, revealedIds: [...session.revealedIds, id] }
    case 'previous':
      return session.position > 0
        ? { ...session, position: session.position - 1 }
        : session
    case 'next':
      return rated && session.position + 1 < session.cards.length
        ? { ...session, position: session.position + 1 }
        : session
    case 'rate': {
      if (!revealed || rated || action.vocabularyId !== id) return session
      const observations = [
        ...session.observations,
        { vocabularyId: id, direction: card.direction, rating: action.rating },
      ]
      return observations.length === session.cards.length
        ? {
            ...session,
            observations,
            completedAt: Math.max(session.startedAt, action.at),
          }
        : { ...session, observations, position: session.position + 1 }
    }
  }
}

export function finishFlashcardSession(
  session: FlashcardSession,
  activeMs: number,
): FlashcardResult | undefined {
  if (session.completedAt === undefined) return
  return {
    sessionId: session.id,
    configuration: session.configuration,
    observations: session.observations,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    activeMs,
  }
}

export function selectDifficultCards(
  cards: readonly Flashcard[],
  observations: readonly RecallObservation[],
) {
  const difficult = new Set(
    observations
      .filter(({ rating }) => rating !== 'easy')
      .map(({ vocabularyId }) => vocabularyId),
  )
  return cards.filter(({ item }) => difficult.has(item.vocabularyId))
}
