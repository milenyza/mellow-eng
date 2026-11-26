import type { DailyStudyTime } from '@/types/game'
import type { NotebookFilters, NotebookItem } from '@/types/notebook'

export type FlashcardDirection = 'en-pt' | 'pt-en'
export type ReviewDirection = FlashcardDirection | 'mixed'
export type ReviewLength = 5 | 10 | 20 | 'all'
export type RecallRating = 'forgot' | 'effort' | 'easy'
export type FlashcardFilters = Omit<NotebookFilters, 'sort'>

export interface FlashcardConfiguration {
  direction: ReviewDirection
  length: ReviewLength
  filters: FlashcardFilters
  scope: 'saved' | 'difficult' | 'history' | 'recommended'
}

export interface Flashcard {
  item: NotebookItem
  direction: FlashcardDirection
}

export interface RecallObservation {
  vocabularyId: string
  direction: FlashcardDirection
  rating: RecallRating
}

export interface FlashcardSession {
  id: string
  configuration: FlashcardConfiguration
  cards: readonly Flashcard[]
  position: number
  revealedIds: readonly string[]
  observations: readonly RecallObservation[]
  startedAt: number
  completedAt?: number
}

export interface FlashcardResult {
  sessionId: string
  configuration: FlashcardConfiguration
  observations: readonly RecallObservation[]
  startedAt: number
  completedAt: number
  activeMs: number
}

export interface CompletedFlashcardSession extends Omit<
  FlashcardResult,
  'configuration'
> {
  configuration: Omit<FlashcardConfiguration, 'filters'> & {
    filters: Omit<FlashcardFilters, 'query'>
    usedSearch: boolean
  }
  dailyPracticeMs: DailyStudyTime
}
