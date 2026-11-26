import { getLessonVocabularyId } from '@/services/lesson-vocabulary-reference'
import { normalizeTextAnswer } from '@/services/exercise-evaluation'
import { selectGameContent } from '@/services/game-content'
import type {
  GameConfiguration,
  GameContentReference,
  VocabularyPair,
  VocabularySource,
} from '@/types/game'

const sourceKinds: Record<
  VocabularySource,
  readonly GameContentReference['kind'][]
> = {
  lessons: ['lesson-vocabulary'],
  stories: ['story-vocabulary'],
  saved: ['saved-vocabulary'],
  mixed: ['lesson-vocabulary', 'story-vocabulary', 'saved-vocabulary'],
}

export function collectGameVocabulary(
  game: GameConfiguration,
  source: VocabularySource,
  data: Parameters<typeof selectGameContent>[2],
): VocabularyPair[] {
  const references = game.content.filter(({ kind }) =>
    sourceKinds[source].includes(kind),
  )
  const [first, ...rest] = references
  if (!first) return []
  const candidates = selectGameContent(
    { ...game, content: [first, ...rest] },
    'A1',
    data,
  )
  const pairs: VocabularyPair[] = []
  for (const candidate of candidates) {
    switch (candidate.kind) {
      case 'lesson-block':
        if (candidate.block.kind !== 'vocabulary') break
        for (const entry of candidate.block.entries) {
          pairs.push({
            id: getLessonVocabularyId(
              candidate.courseId,
              candidate.lessonId,
              candidate.block.id,
              entry.id,
            ),
            english: entry.expression.text,
            portuguese: entry.expression.translation,
            context: entry.usage,
            example: entry.example,
            matchGroup: entry.matchGroup,
          })
        }
        break
      case 'story-entry': {
        const { entry } = candidate
        if (entry.matchingTranslation)
          pairs.push({
            id: entry.id,
            english: entry.word,
            portuguese: entry.matchingTranslation,
            context: entry.meaning,
            example: entry.example,
            pronunciation: entry.pronunciation,
          })
        break
      }
      case 'standalone-entry':
        pairs.push({
          id: candidate.entry.id,
          english: candidate.entry.word,
          portuguese: candidate.entry.translation,
          pronunciation: candidate.entry.pronunciation,
          example:
            candidate.entry.example && candidate.entry.exampleTranslation
              ? {
                  text: candidate.entry.example,
                  translation: candidate.entry.exampleTranslation,
                }
              : undefined,
        })
    }
  }
  return pairs
}

export function getVocabularyPool(
  ...args: Parameters<typeof collectGameVocabulary>
) {
  return uniqueVocabularyPairs(collectGameVocabulary(...args))
}

function matchKey(text: string) {
  return normalizeTextAnswer(text)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function uniqueVocabularyPairs(pairs: readonly VocabularyPair[]) {
  const usedIds = new Set<string>()
  const usedEnglish = new Set<string>()
  const usedPortuguese = new Set<string>()
  const usedGroups = new Set<string>()
  return pairs.filter(({ id, english, portuguese, matchGroup }) => {
    const term = matchKey(english)
    const meanings = portuguese.split('/').map(matchKey).filter(Boolean)
    if (
      !term ||
      !meanings.length ||
      usedIds.has(id) ||
      usedEnglish.has(term) ||
      meanings.some((meaning) => usedPortuguese.has(meaning)) ||
      (matchGroup && usedGroups.has(matchGroup))
    )
      return false

    usedIds.add(id)
    usedEnglish.add(term)
    meanings.forEach((meaning) => usedPortuguese.add(meaning))
    if (matchGroup) usedGroups.add(matchGroup)
    return true
  })
}
