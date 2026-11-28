import { getVocabularyAnnotations } from '@/services/vocabulary-annotations'

export const favoriteWordsKey = 'mellow:favorite-words'
export const savedAtKey = 'mellow:favorite-words-saved-at'
const changeEvent = 'mellow:favorites-changed'

export interface FavoriteWordsSnapshot {
  ids: readonly string[]
  savedAt: Readonly<Record<string, number | undefined>>
  available: boolean
}

let cached: FavoriteWordsSnapshot = { ids: [], savedAt: {}, available: false }
let previousIds: string | null | undefined
let previousDates: string | null | undefined

function readJson(value: string | null): unknown {
  try {
    return value === null ? undefined : JSON.parse(value)
  } catch {
    return undefined
  }
}

function parseIds(raw: string | null) {
  const value = readJson(raw)
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === 'string' && !!id.trim(),
          ),
        ),
      ]
    : []
}

function parseDates(raw: string | null) {
  const value = readJson(raw)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, timestamp]) =>
        Number.isSafeInteger(timestamp) &&
        timestamp > 0 &&
        timestamp <= 8.64e15,
    ),
  ) as Record<string, number | undefined>
}

export function readFavoriteWordIds() {
  return parseIds(window.localStorage.getItem(favoriteWordsKey))
}

export function getFavoriteWordsSnapshot(): FavoriteWordsSnapshot {
  try {
    const ids = window.localStorage.getItem(favoriteWordsKey)
    let dates: string | null = null
    try {
      dates = window.localStorage.getItem(savedAtKey)
    } catch {
      /* Optional metadata. */
    }
    if (!cached.available || ids !== previousIds || dates !== previousDates) {
      cached = {
        ids:
          cached.available && ids === previousIds ? cached.ids : parseIds(ids),
        savedAt: parseDates(dates),
        available: true,
      }
      previousIds = ids
      previousDates = dates
    }
  } catch {
    if (cached.available) cached = { ...cached, available: false }
  }
  return cached
}

export function subscribeFavoriteWords(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (
      event.key === null ||
      event.key === favoriteWordsKey ||
      event.key === savedAtKey
    )
      onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(changeEvent, onChange)
  }
}

export function setWordFavorite(id: string, saved: boolean) {
  if (!id.trim()) return false
  let ids = new Set(readFavoriteWordIds())
  if (ids.has(id) === saved) return true
  if (!saved && getVocabularyAnnotations().records.has(id)) {
    if (
      !window.confirm(
        'Remover este favorito? Seu nível, suas notas e seus exemplos ficam guardados neste navegador e voltam a aparecer se você salvar o item novamente.',
      )
    )
      return false
    // Another tab can modify favorites while this tab is waiting for confirmation.
    ids = new Set(readFavoriteWordIds())
  }
  if (saved) ids.add(id)
  else ids.delete(id)
  window.localStorage.setItem(favoriteWordsKey, JSON.stringify([...ids]))
  try {
    const dates = new Map(
      Object.entries(parseDates(window.localStorage.getItem(savedAtKey))),
    )
    if (saved) dates.set(id, Date.now())
    else dates.delete(id)
    if (dates.size)
      window.localStorage.setItem(
        savedAtKey,
        JSON.stringify(Object.fromEntries(dates)),
      )
    else window.localStorage.removeItem(savedAtKey)
  } catch {
    // Keep the canonical favorite change when optional timestamp storage fails.
  }
  window.dispatchEvent(new Event(changeEvent))
  return true
}
