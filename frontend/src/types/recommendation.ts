import type { NotebookVocabulary } from '@/types/notebook'

export type RecommendationSource =
  | 'flashcards'
  | 'word-match'
  | 'sentence-builder'
  | 'simulation'
  | 'familiarity'

export interface ReviewEvidence {
  source: RecommendationSource
  explanation: string
  at?: number
  count: number
  href?: string
}

export type ReviewRecommendation = {
  id: string
  reasons: readonly ReviewEvidence[]
} & (
  | { kind: 'vocabulary'; item: NotebookVocabulary }
  | { kind: 'sentence'; text: string; explanation: string; href: string }
)
