import type { Exercise } from '@/types/exercise'
import type { ListeningActivity } from '@/types/listening'

export interface TranslatedExample {
  text: string
  translation: string
}

interface BlockBase {
  id: string
  title: string
  requiredForCompletion?: boolean
}

export type IntroductionBlock = BlockBase & {
  kind: 'introduction'
  paragraphs: readonly string[]
}

export type VocabularyBlock = BlockBase & {
  kind: 'vocabulary'
  entries: readonly {
    id: string
    matchGroup?: string
    expression: TranslatedExample
    example: TranslatedExample
    usage?: string
  }[]
}

export type GrammarBlock = BlockBase & {
  kind: 'grammar'
  explanation: string
  patterns: readonly { note: string; example: TranslatedExample }[]
}

export type DialogueBlock = BlockBase & {
  kind: 'dialogue'
  context: string
  lines: readonly (TranslatedExample & { speaker: string })[]
}

export type ListeningBlock = BlockBase & {
  kind: 'listening'
  instructions: string
  activities: readonly [ListeningActivity, ...ListeningActivity[]]
}

export type PracticeBlock = BlockBase & {
  kind: 'practice'
  instructions: string
  exercises: readonly [Exercise, ...Exercise[]]
}

export type SpeakingBlock = BlockBase & {
  kind: 'speaking'
  instructions: string
  prompts: readonly { instruction: string; model: TranslatedExample }[]
}

export type ReviewBlock = BlockBase & {
  kind: 'review'
  reminders: readonly string[]
  examples: readonly TranslatedExample[]
}

export type LessonBlock =
  | IntroductionBlock
  | VocabularyBlock
  | GrammarBlock
  | DialogueBlock
  | ListeningBlock
  | PracticeBlock
  | SpeakingBlock
  | ReviewBlock
