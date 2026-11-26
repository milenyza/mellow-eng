import type {
  NotebookContentType,
  NotebookFilters,
  NotebookItem,
  NotebookVocabulary,
  VocabularyAnnotation,
} from '@/types/notebook'

export type { NotebookFilters } from '@/types/notebook'

const alphabetical = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
})

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’']/g, '')
    .toLowerCase()
}

export function getNotebookContentType(text: string): NotebookContentType {
  return /^\s*[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*[.!?,]?\s*$/u.test(text)
    ? 'word'
    : 'expression'
}

export function selectSavedVocabulary(
  ids: readonly string[],
  vocabulary: ReadonlyMap<string, NotebookVocabulary>,
  dates: Readonly<Record<string, number | undefined>>,
  annotations?: ReadonlyMap<string, VocabularyAnnotation>,
): NotebookItem[] {
  return [...new Set(ids)].flatMap((id) => {
    const entry = vocabulary.get(id)
    return entry
      ? [
          {
            vocabularyId: id,
            vocabulary: entry,
            annotation: annotations?.get(id),
            savedAt: Object.hasOwn(dates, id) ? dates[id] : undefined,
          },
        ]
      : []
  })
}

export function summarizeFamiliarity(
  ids: readonly string[],
  annotations: ReadonlyMap<string, VocabularyAnnotation>,
) {
  const counts = { unclassified: 0, learning: 0, reviewing: 0, familiar: 0 }
  for (const id of new Set(ids))
    counts[annotations.get(id)?.familiarity ?? 'unclassified']++
  return counts
}

export function matchesAnnotationFilters(
  filters: Pick<NotebookFilters, 'query' | 'familiarity'>,
  annotation: VocabularyAnnotation | undefined,
  fields: readonly (string | undefined)[],
) {
  if (
    filters.familiarity &&
    filters.familiarity !== (annotation?.familiarity ?? 'unclassified')
  )
    return false
  const terms = normalize(filters.query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const text = normalize(
    [...fields, annotation?.note, annotation?.personalExample].join(' '),
  )
  return terms.every((term) => text.includes(term))
}

export function filterNotebook(
  items: readonly NotebookItem[],
  filters: NotebookFilters,
) {
  return items
    .filter(({ vocabulary: item, annotation }) => {
      if (
        (filters.source && item.source.kind !== filters.source) ||
        (filters.type && item.type !== filters.type) ||
        (filters.level && item.level !== filters.level)
      )
        return false
      const fields = [
        item.text,
        item.translation,
        item.usage,
        item.source.title,
        item.example?.text,
        item.example?.translation,
        ...(item.keywords ?? []),
      ]
      return matchesAnnotationFilters(filters, annotation, fields)
    })
    .sort((a, b) => {
      if (filters.sort === 'recent' && a.savedAt !== b.savedAt)
        return (b.savedAt ?? 0) - (a.savedAt ?? 0)
      return (
        alphabetical.compare(a.vocabulary.text, b.vocabulary.text) ||
        alphabetical.compare(
          a.vocabulary.translation,
          b.vocabulary.translation,
        ) ||
        a.vocabularyId.localeCompare(b.vocabularyId)
      )
    })
}
export const initialNotebookFilters = {
  query: '',
  source: '',
  type: '',
  level: '',
  familiarity: '',
  sort: 'alphabetical',
} as const satisfies NotebookFilters
