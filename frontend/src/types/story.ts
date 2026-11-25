import type { AudioSource } from '@/types/audio'
import type { CefrCode } from '@/types/curriculum'
import type { Exercise } from '@/types/exercise'
import type { TranslatedExample } from '@/types/lesson-content'

export type StoryGenre =
  'everyday-life' | 'travel' | 'friendship' | 'slice-of-life' | 'adventure'

export interface StoryParagraph {
  id: string
  text: string
  translation?: string
  vocabularyReferences?: readonly { vocabularyId: string; phrase: string }[]
  narration?: AudioSource
}

export interface StoryVocabularyEntry {
  id: string
  word: string
  pronunciation: string
  meaning: string
  example: TranslatedExample
}

export interface StoryChapterOutline {
  id: string
  title: string
  description: string
}

export interface ReadableStoryChapter extends StoryChapterOutline {
  paragraphs: readonly [StoryParagraph, ...StoryParagraph[]]
  vocabulary?: readonly StoryVocabularyEntry[]
  narration?: AudioSource
  comprehension?: readonly Exercise[]
}

interface StoryMetadata {
  id: string
  title: string
  description: string
  level: CefrCode
  genres: readonly [StoryGenre, ...StoryGenre[]]
  cover: string
  readingMinutes: number
  objectives: readonly [string, ...string[]]
}

export type PublishedStory = StoryMetadata & {
  publication: 'available'
  chapters: readonly [ReadableStoryChapter, ...ReadableStoryChapter[]]
}

export type Story =
  | PublishedStory
  | (StoryMetadata & {
      publication: 'planned'
      chapters: readonly [StoryChapterOutline, ...StoryChapterOutline[]]
    })
