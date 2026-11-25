import { useMemo, useState } from 'react'
import { englishCourse } from '@/data/curriculum/english-course'
import { dailyWord } from '@/data/dashboard'
import { stories } from '@/data/stories'
import { getVocabularyPool } from '@/services/game-vocabulary'
import { readFavoriteWordIds } from '@/services/word-favorites'
import type { GameConfiguration, VocabularySource } from '@/types/game'

export function useGameVocabulary(
  game: GameConfiguration,
  source: VocabularySource,
) {
  const [savedWordIds] = useState(() => {
    try {
      return readFavoriteWordIds()
    } catch {
      return []
    }
  })

  return useMemo(
    () =>
      getVocabularyPool(game, source, {
        course: englishCourse,
        stories,
        savedWordIds,
        standaloneVocabulary: [dailyWord],
      }),
    [game, source, savedWordIds],
  )
}
