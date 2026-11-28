import { progressStorageKey } from '@/services/progress-repository'
import { vocabularyAnnotationsKey } from '@/services/vocabulary-annotations'
import { favoriteWordsKey, savedAtKey } from '@/services/word-favorites'

const storageKeys = [
  progressStorageKey,
  favoriteWordsKey,
  savedAtKey,
  vocabularyAnnotationsKey,
] as const

type StorageKey = (typeof storageKeys)[number]
type StorageValue = { schemaVersion: number | null; raw: string }

export interface LegacySnapshot {
  formatVersion: 1
  requestId: string
  exportedAt?: string
  storage: Partial<Record<StorageKey, StorageValue>>
}

function readVersion(raw: string) {
  try {
    const value: unknown = JSON.parse(raw)
    if (value && typeof value === 'object' && 'version' in value) {
      const { version } = value
      if (
        typeof version === 'number' &&
        Number.isInteger(version) &&
        version >= -2147483648 &&
        version <= 2147483647
      )
        return version
    }
  } catch {
    // Preserve invalid raw values for the dry-run report.
  }
  return null
}

export function createLegacySnapshot(
  storage: Pick<Storage, 'getItem'>,
  requestId: string,
  exportedAt?: Date,
): LegacySnapshot {
  const snapshot: LegacySnapshot = {
    formatVersion: 1,
    requestId,
    storage: {},
  }
  if (exportedAt) snapshot.exportedAt = exportedAt.toISOString()
  for (const key of storageKeys) {
    const raw = storage.getItem(key)
    if (raw === null) continue
    const versioned =
      key === progressStorageKey || key === vocabularyAnnotationsKey
    snapshot.storage[key] = {
      raw,
      schemaVersion: versioned ? readVersion(raw) : null,
    }
  }
  return snapshot
}
