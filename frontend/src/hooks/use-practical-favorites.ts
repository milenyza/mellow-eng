import { useState } from 'react'
import { readFavoriteWordIds, setWordFavorite } from '@/services/word-favorites'

function readSavedExpressions() {
  try {
    return new Set(readFavoriteWordIds())
  } catch {
    return new Set<string>()
  }
}

export function usePracticalFavorites() {
  const [saved, setSaved] = useState(readSavedExpressions)
  const [feedback, setFeedback] = useState('')
  function toggleFavorite(id: string) {
    const next = !saved.has(id)
    try {
      setWordFavorite(id, next)
      setSaved(readSavedExpressions())
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
