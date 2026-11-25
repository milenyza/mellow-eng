import {
  emptyProgress,
  parseProgress,
  serializeProgress,
} from '@/services/progress-format'
import type { LearnerProgress } from '@/types/progress'

export const progressStorageKey = 'mellow:learner-progress'

export interface ProgressSnapshot {
  data: LearnerProgress
  persistence: 'ready' | 'recovered' | 'unavailable'
}

export interface ProgressRepository {
  getSnapshot(): ProgressSnapshot
  subscribe(listener: () => void): () => void
  update(change: (data: LearnerProgress) => LearnerProgress): void
}

export function createLocalProgressRepository(
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'> = () =>
    window.localStorage,
  events:
    | Pick<Window, 'addEventListener' | 'removeEventListener'>
    | undefined = typeof window === 'undefined' ? undefined : window,
): ProgressRepository {
  let snapshot: ProgressSnapshot = {
    data: emptyProgress(),
    persistence: 'ready',
  }
  let lastStored: string | null = null
  const listeners = new Set<() => void>()

  function restore(value: string | null) {
    lastStored = value
    const data = parseProgress(value)
    snapshot = {
      data: data ?? emptyProgress(),
      persistence: data ? snapshot.persistence : 'recovered',
    }
  }

  try {
    restore(getStorage().getItem(progressStorageKey))
  } catch {
    snapshot = { ...snapshot, persistence: 'unavailable' }
  }

  function notify() {
    for (const listener of listeners) listener()
  }

  function refreshFromStorage() {
    if (snapshot.persistence === 'unavailable') return
    try {
      const latest = getStorage().getItem(progressStorageKey)
      if (latest !== lastStored) restore(latest)
    } catch {
      snapshot = { ...snapshot, persistence: 'unavailable' }
    }
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== progressStorageKey && event.key !== null) return
    const previous = snapshot
    refreshFromStorage()
    if (snapshot !== previous) notify()
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) events?.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0)
          events?.removeEventListener('storage', onStorage)
      }
    },
    update(change) {
      const previous = snapshot
      // Rebase on other tabs' persisted updates before applying a local change.
      refreshFromStorage()
      const data = change(snapshot.data)
      if (data !== snapshot.data) {
        try {
          const serialized = serializeProgress(data)
          getStorage().setItem(progressStorageKey, serialized)
          lastStored = serialized
          snapshot = {
            data,
            persistence:
              snapshot.persistence === 'recovered' ? 'recovered' : 'ready',
          }
        } catch {
          snapshot = { data, persistence: 'unavailable' }
        }
      }
      if (snapshot !== previous) notify()
    },
  }
}
