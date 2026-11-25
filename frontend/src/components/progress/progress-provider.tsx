import { useState, type ReactNode } from 'react'
import { ProgressContext } from '@/hooks/use-progress'
import {
  createLocalProgressRepository,
  type ProgressRepository,
} from '@/services/progress-repository'

export function ProgressProvider({
  children,
  repository,
}: {
  children: ReactNode
  repository?: ProgressRepository
}) {
  const [store] = useState(() => repository ?? createLocalProgressRepository())
  return (
    <ProgressContext.Provider value={store}>
      {children}
    </ProgressContext.Provider>
  )
}
