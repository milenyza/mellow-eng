import type { AudioSource } from '@/types/audio'
import type { CefrCode } from '@/types/curriculum'
import type { TranslatedExample } from '@/types/lesson-content'

export type NotebookSource = 'lesson' | 'story' | 'practical' | 'daily'
export type NotebookContentType = 'word' | 'expression' | 'phrase'

export interface NotebookVocabulary extends TranslatedExample {
  id: string
  type: NotebookContentType
  level: CefrCode
  source: {
    kind: NotebookSource
    title?: string
    language?: 'en' | 'pt-BR'
    href: string
  }
  pronunciation?: string
  example?: TranslatedExample
  usage?: string
  keywords?: readonly string[]
  audio?: AudioSource
}

export interface SavedVocabulary {
  vocabularyId: string
  annotation?: VocabularyAnnotation
  savedAt?: number
}

export interface NotebookItem extends SavedVocabulary {
  vocabulary: NotebookVocabulary
}

export interface NotebookResolution {
  vocabulary: ReadonlyMap<string, NotebookVocabulary>
  failedIds: ReadonlySet<string>
}

export type VocabularyFamiliarity = 'learning' | 'reviewing' | 'familiar'

export interface VocabularyAnnotationDraft {
  familiarity?: VocabularyFamiliarity
  note?: string
  personalExample?: string
}

export interface VocabularyAnnotation extends VocabularyAnnotationDraft {
  vocabularyId: string
  createdAt: number
  updatedAt: number
}

export interface NotebookFilters {
  query: string
  source: NotebookSource | ''
  type: NotebookContentType | ''
  level: CefrCode | ''
  familiarity?: VocabularyFamiliarity | 'unclassified' | ''
  sort: 'alphabetical' | 'recent'
}
