import type { GameSessionBase } from '@/types/game'
import type { SentenceBuilderExercise } from '@/types/exercise'

export type SentenceTopic =
  | 'introductions'
  | 'pronouns'
  | 'to-be'
  | 'origins'
  | 'affirmative'
  | 'negative'
  | 'questions'

export type SentenceTopicSelection = SentenceTopic | 'mixed'
export type SentenceDifficulty = 'easy' | 'medium' | 'hard'

export type SentenceContentReference =
  | { kind: 'lesson'; lessonId: string; blockId: string }
  | { kind: 'story'; storyId: string; chapterId: string; paragraphId: string }

export interface SentenceChallenge {
  id: string
  topics: readonly [SentenceTopic, ...SentenceTopic[]]
  difficulty: SentenceDifficulty
  prompt: string
  sentence: string
  alternatives?: readonly string[]
  distractors?: readonly string[]
  hint?: string
  feedback: string
  reference: SentenceContentReference
}

export interface PreparedSentenceChallenge {
  definition: SentenceChallenge
  exercise: SentenceBuilderExercise
}

export interface SentenceBuilderResult extends GameSessionBase {
  gameId: 'sentence-builder'
  level: 'A1'
  difficulty: SentenceDifficulty
  topic: SentenceTopicSelection
  completedCount: number
  firstAttemptCorrect: number
  challenges: readonly {
    id: string
    sentence: string
    topics: SentenceChallenge['topics']
    incorrectAnswers: readonly string[]
    feedback: string
    reviewed: boolean
  }[]
}
