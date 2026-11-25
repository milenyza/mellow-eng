import { uniqueVocabularyPairs } from '@/services/game-vocabulary'
import { shuffle } from '@/services/shuffle'
import type { VocabularyPair } from '@/types/game'
import type { MemoryBoard, MemoryCard } from '@/types/memory-game'

export function generateMemoryBoard(
  candidates: readonly VocabularyPair[],
  pairCount: number,
  random = Math.random,
): MemoryBoard | null {
  const pool = uniqueVocabularyPairs(candidates)
  if (!Number.isInteger(pairCount) || pairCount <= 0 || pool.length < pairCount)
    return null

  const vocabulary = shuffle(pool, random).slice(0, pairCount)
  const cards = vocabulary.flatMap((pair): MemoryCard[] => [
    { id: `en:${pair.id}`, pair, language: 'en' },
    { id: `pt-BR:${pair.id}`, pair, language: 'pt-BR' },
  ])

  return { vocabulary, cards: shuffle(cards, random) }
}
