import type {
  GameSessionBase,
  VocabularyPair,
  VocabularySource,
} from '@/types/game'

export interface MemoryCard {
  id: string
  pair: VocabularyPair
  language: 'en' | 'pt-BR'
}

export interface MemoryBoard {
  cards: readonly MemoryCard[]
  vocabulary: readonly VocabularyPair[]
}

export interface MemoryGameResult extends GameSessionBase {
  gameId: 'memory-game'
  level: 'A1'
  source: VocabularySource
  totalPairs: number
  incorrectAttempts: number
  vocabulary: readonly VocabularyPair[]
}
