import type { GameSessionBase, VocabularySource } from '@/types/game'
import type { SentenceTopicSelection } from '@/types/sentence-builder'

type CompletedSessionBase = Omit<GameSessionBase, 'outcome' | 'gameId'> & {
  outcome: 'completed'
}

export interface PracticedChallenge {
  id: string
  reviewed: boolean
  incorrectAnswers: readonly string[]
}

export type CompletedGameSession =
  | (CompletedSessionBase & {
      gameId: 'word-match'
      source: VocabularySource
      roundsCompleted: number
      firstAttemptCorrect: number
      vocabularyIds: readonly string[]
      reviewIds: readonly string[]
    })
  | (CompletedSessionBase & {
      gameId: 'sentence-builder'
      topic: SentenceTopicSelection
      firstAttemptCorrect: number
      challenges: readonly PracticedChallenge[]
    })
  | (CompletedSessionBase & {
      gameId: 'memory-game'
      source: VocabularySource
      totalPairs: number
      incorrectAttempts: number
      vocabularyIds: readonly string[]
    })
