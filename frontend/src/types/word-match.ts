import type {
  GameSessionBase,
  VocabularyPair,
  VocabularySource,
} from '@/types/game'

export type WordMatchSide = 'english' | 'portuguese'

export interface WordMatchRound {
  english: readonly VocabularyPair[]
  portuguese: readonly VocabularyPair[]
}

export interface WordMatchResult extends GameSessionBase {
  gameId: 'word-match'
  level: 'A1'
  source: VocabularySource
  roundsCompleted: number
  firstAttemptCorrect: number
  vocabulary: readonly VocabularyPair[]
  reviewIds: readonly string[]
}
