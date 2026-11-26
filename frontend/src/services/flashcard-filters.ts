import {
  familiarityLabels,
  notebookSourceLabels,
  notebookTypeLabels,
} from '@/data/notebook-labels'
import { dailyWord } from '@/data/dashboard'
import { englishCourseId } from '@/services/lesson-vocabulary-reference'
import type { FlashcardFilters } from '@/types/flashcards'
import type { VocabularyAnnotation } from '@/types/notebook'

const cefr = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export function getFlashcardFilters(
  params: URLSearchParams,
  query = '',
): FlashcardFilters {
  const source = params.get('origem')
  const type = params.get('tipo')
  const level = params.get('nivel')
  const familiarity = params.get('familiaridade')
  return {
    query,
    source:
      source && Object.hasOwn(notebookSourceLabels, source)
        ? (source as FlashcardFilters['source'])
        : '',
    type:
      type && Object.hasOwn(notebookTypeLabels, type)
        ? (type as FlashcardFilters['type'])
        : '',
    level: cefr.find((code) => code === level) ?? '',
    familiarity:
      familiarity && Object.hasOwn(familiarityLabels, familiarity)
        ? (familiarity as FlashcardFilters['familiarity'])
        : '',
  }
}

export function getFlashcardSearch(filters: FlashcardFilters) {
  const params = new URLSearchParams()
  const entries = {
    origem: filters.source,
    tipo: filters.type,
    nivel: filters.level,
    familiaridade: filters.familiarity,
  }
  for (const [key, value] of Object.entries(entries))
    if (value) params.set(key, value)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function selectFlashcardIds(
  ids: readonly string[],
  filters: Pick<FlashcardFilters, 'source' | 'familiarity'>,
  annotations: ReadonlyMap<string, VocabularyAnnotation>,
): readonly string[] {
  if (!filters.source && !filters.familiarity) return ids
  return ids.filter((id) => {
    const matchesSource =
      !filters.source ||
      (filters.source === 'story' && id.startsWith('story-')) ||
      (filters.source === 'practical' && id.startsWith('practical-')) ||
      (filters.source === 'lesson' && id.startsWith(`${englishCourseId}/`)) ||
      (filters.source === 'daily' && id === dailyWord.id)
    return (
      matchesSource &&
      (!filters.familiarity ||
        filters.familiarity ===
          (annotations.get(id)?.familiarity ?? 'unclassified'))
    )
  })
}
