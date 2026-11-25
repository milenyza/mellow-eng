const storageKey = 'mellow:favorite-words'

export function readFavoriteWordIds(): string[] {
  const stored = window.localStorage.getItem(storageKey)
  if (!stored) return []

  try {
    const value: unknown = JSON.parse(stored)
    if (Array.isArray(value)) {
      return value.filter((id): id is string => typeof id === 'string')
    }
  } catch {
    return []
  }

  return []
}

export function setWordFavorite(id: string, saved: boolean) {
  const ids = new Set(readFavoriteWordIds())
  if (saved) ids.add(id)
  else ids.delete(id)
  window.localStorage.setItem(storageKey, JSON.stringify([...ids]))
}
