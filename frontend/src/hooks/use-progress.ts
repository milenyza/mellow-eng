import { createContext, useContext, useSyncExternalStore } from 'react'
import type { ProgressRepository } from '@/services/progress-repository'

export const ProgressContext = createContext<ProgressRepository | null>(null)

export function useProgress() {
  const repository = useContext(ProgressContext)
  if (!repository) throw new Error('ProgressProvider is required')
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
  )
  return { repository, ...snapshot }
}
