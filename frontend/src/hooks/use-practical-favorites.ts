import { useState } from 'react'
import { setWordFavorite } from '@/services/word-favorites'

import { useFavoriteWords } from './use-favorite-words'

export function usePracticalFavorites() {
  const { ids } = useFavoriteWords()
  const saved = new Set(ids)
  const [feedback, setFeedback] = useState('')
  function toggleFavorite(id: string) {
    const next = !saved.has(id)
    try {
      if (!setWordFavorite(id, next)) return
      setFeedback(
        next
          ? 'Expressão salva nos favoritos.'
          : 'Expressão removida dos favoritos.',
      )
    } catch {
      setFeedback('Não foi possível atualizar os favoritos neste navegador.')
    }
  }
  return { saved, feedback, toggleFavorite }
}
