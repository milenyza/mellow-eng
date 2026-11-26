import type {
  PhrasebookGroup,
  PracticalSituation,
  SituationCategoryId,
} from '@/types/practical-english'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’']/g, '')
    .toLowerCase()
    .trim()
}

function matchTerms(terms: readonly string[], fields: readonly string[]) {
  const searchText = normalize(fields.join(' '))
  return terms.every((term) => searchText.includes(term))
}

function searchTerms(query: string) {
  return normalize(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

export function filterSituations(
  situations: readonly PracticalSituation[],
  query: string,
  categoryId: SituationCategoryId | '',
) {
  const terms = searchTerms(query)
  return situations.filter(
    (situation) =>
      (!categoryId || situation.categoryId === categoryId) &&
      matchTerms(terms, [
        situation.title,
        situation.englishTitle,
        ...situation.keywords,
      ]),
  )
}

export function filterPhrasebook(
  groups: readonly PhrasebookGroup[],
  query: string,
  intent: string,
) {
  const terms = searchTerms(query)
  return groups.flatMap((group) => {
    if (intent && group.id !== intent) return []
    const expressions = group.expressions.filter((expression) =>
      matchTerms(terms, [
        group.title,
        expression.text,
        expression.translation,
        expression.usage,
        ...(expression.keywords ?? []),
      ]),
    )
    return expressions.length ? [{ ...group, expressions }] : []
  })
}
