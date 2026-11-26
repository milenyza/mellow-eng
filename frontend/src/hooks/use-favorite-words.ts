import { useSyncExternalStore } from 'react'
import {
  getFavoriteWordsSnapshot,
  subscribeFavoriteWords,
} from '@/services/word-favorites'

export function useFavoriteWords() {
  return useSyncExternalStore(subscribeFavoriteWords, getFavoriteWordsSnapshot)
}
