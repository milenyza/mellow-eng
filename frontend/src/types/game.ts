import type { CefrCode } from '@/types/curriculum'
import type {
  GrammarBlock,
  TranslatedExample,
  VocabularyBlock,
} from '@/types/lesson-content'
import type { StoryVocabularyEntry } from '@/types/story'
import type { WordMatchResult } from '@/types/word-match'
import type { SentenceBuilderResult } from '@/types/sentence-builder'
import type { MemoryGameResult } from '@/types/memory-game'

export type GameType = 'word-match' | 'sentence-builder' | 'memory'
export type GameDifficulty =
  'basic' | 'intermediate' | 'easy' | 'medium' | 'hard'
export type GamePublication = 'planned' | 'available'

export interface GameDifficultySetting {
  id: GameDifficulty
  roundSize: number
}

export type GameContentReference =
  | { kind: 'lesson-vocabulary' | 'lesson-grammar'; lessonId?: string }
  | { kind: 'story-vocabulary'; storyId?: string }
  | { kind: 'saved-vocabulary' }

export interface GameConfiguration {
  id: string
  type: GameType
  title: string
  description: string
  levels: readonly [CefrCode, ...CefrCode[]]
  estimatedMinutes: number
  objectives: readonly [string, ...string[]]
  difficulties: readonly [GameDifficultySetting, ...GameDifficultySetting[]]
  content: readonly [GameContentReference, ...GameContentReference[]]
  publication: GamePublication
}

export type VocabularySource = 'lessons' | 'stories' | 'saved' | 'mixed'

export interface VocabularyPair {
  id: string
  english: string
  portuguese: string
  context?: string
  example?: TranslatedExample
  pronunciation?: string
  matchGroup?: string
}

export interface StandaloneGameVocabulary {
  id: string
  level: CefrCode
  word: string
  translation: string
  pronunciation?: string
  example?: string
  exampleTranslation?: string
}

export type GameContentCandidate =
  | {
      kind: 'lesson-block'
      courseId: string
      lessonId: string
      block: VocabularyBlock | GrammarBlock
    }
  | {
      kind: 'story-entry'
      storyId: string
      chapterId: string
      entry: StoryVocabularyEntry
    }
  | { kind: 'standalone-entry'; entry: StandaloneGameVocabulary }

export type GameSessionResult =
  WordMatchResult | SentenceBuilderResult | MemoryGameResult

export type DailyStudyTime = Readonly<Record<string, number | undefined>>

export interface GameSessionBase {
  sessionId: string
  gameId: GameConfiguration['id']
  level: CefrCode
  difficulty: GameDifficulty
  startedAt: number
  endedAt: number
  activeMs: number
  dailyPracticeMs: DailyStudyTime
  outcome: 'completed' | 'exited'
  answeredCount: number
  correctCount: number
}
