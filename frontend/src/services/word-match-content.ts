import { uniqueVocabularyPairs } from '@/services/game-vocabulary'
import { shuffle } from '@/services/shuffle'
import type { VocabularyPair } from '@/types/game'
import type { WordMatchRound } from '@/types/word-match'

export const wordMatchRoundCount = 3

export function generateWordMatchRounds(
  candidates: readonly VocabularyPair[],
  roundSize: number,
  random = Math.random,
): WordMatchRound[] | null {
  const pool = uniqueVocabularyPairs(candidates)
  if (!Number.isInteger(roundSize) || roundSize < 1 || pool.length < roundSize)
    return null

  const uses = new Map<string, number>()
  return Array.from({ length: wordMatchRoundCount }, () => {
    const pairs = shuffle(pool, random)
      .sort((a, b) => (uses.get(a.id) ?? 0) - (uses.get(b.id) ?? 0))
      .slice(0, roundSize)
    for (const { id } of pairs) uses.set(id, (uses.get(id) ?? 0) + 1)
    return {
      english: shuffle(pairs, random),
      portuguese: shuffle(pairs, random),
    }
  })
}
