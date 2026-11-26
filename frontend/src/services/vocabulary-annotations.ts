import type {
  VocabularyAnnotation,
  VocabularyAnnotationDraft,
} from '@/types/notebook'

export const vocabularyAnnotationsKey = 'mellow:vocabulary-annotations'
const vocabularyAnnotationChangeEvent = 'mellow:vocabulary-annotations-changed'
export const noteLimit = 1200
export const personalExampleLimit = 400

type AnnotationSnapshot = {
  records: ReadonlyMap<string, VocabularyAnnotation>
  status: 'ready' | 'recovered' | 'unavailable' | 'unsupported'
}

let cached: AnnotationSnapshot = { records: new Map(), status: 'ready' }
let previousRaw: string | null | undefined

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 8.64e15
  )
}

function validFamiliarity(value: unknown) {
  return (
    value === undefined ||
    value === 'learning' ||
    value === 'reviewing' ||
    value === 'familiar'
  )
}

function validText(value: unknown, limit: number) {
  return (
    value === undefined || (typeof value === 'string' && value.length <= limit)
  )
}

function isAnnotation(
  value: unknown,
  key: string,
): value is VocabularyAnnotation {
  return (
    object(value) &&
    !!key.trim() &&
    value.vocabularyId === key &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt) &&
    value.updatedAt >= value.createdAt &&
    validFamiliarity(value.familiarity) &&
    validText(value.note, noteLimit) &&
    validText(value.personalExample, personalExampleLimit)
  )
}

export function parseVocabularyAnnotations(
  raw: string | null,
): AnnotationSnapshot {
  const records = new Map<string, VocabularyAnnotation>()
  if (raw === null) return { records, status: 'ready' }
  try {
    const value: unknown = JSON.parse(raw)
    if (
      object(value) &&
      typeof value.version === 'number' &&
      value.version !== 1
    )
      return { records, status: 'unsupported' }
    if (object(value) && value.version === 1 && object(value.records)) {
      const entries = Object.entries(value.records)
      for (const [id, record] of entries)
        if (isAnnotation(record, id)) {
          const {
            vocabularyId,
            createdAt,
            updatedAt,
            familiarity,
            note,
            personalExample,
          } = record
          records.set(id, {
            vocabularyId,
            createdAt,
            updatedAt,
            familiarity,
            note,
            personalExample,
          })
        }
      return {
        records,
        status: records.size === entries.length ? 'ready' : 'recovered',
      }
    }
  } catch {
    // A later explicit save can replace malformed data.
  }
  return { records, status: 'recovered' }
}

export function getVocabularyAnnotations(): AnnotationSnapshot {
  try {
    const raw = window.localStorage.getItem(vocabularyAnnotationsKey)
    if (raw !== previousRaw || cached.status === 'unavailable') {
      cached = parseVocabularyAnnotations(raw)
      previousRaw = raw
    }
  } catch {
    if (cached.status !== 'unavailable')
      cached = { ...cached, status: 'unavailable' }
  }
  return cached
}

export function subscribeVocabularyAnnotations(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === vocabularyAnnotationsKey) onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(vocabularyAnnotationChangeEvent, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(vocabularyAnnotationChangeEvent, onChange)
  }
}

export function saveVocabularyAnnotation(
  id: string,
  draft: VocabularyAnnotationDraft,
  previous: VocabularyAnnotation | undefined,
) {
  const snapshot = getVocabularyAnnotations()
  if (snapshot.status === 'unavailable' || snapshot.status === 'unsupported')
    return 'unavailable'
  const current = snapshot.records.get(id)
  if (JSON.stringify(current) !== JSON.stringify(previous)) return 'conflict'

  if (
    !validFamiliarity(draft.familiarity) ||
    !validText(draft.note, noteLimit) ||
    !validText(draft.personalExample, personalExampleLimit)
  )
    return 'invalid'
  const now = Math.max(Date.now(), current?.updatedAt ?? 0)
  const record: VocabularyAnnotation = {
    vocabularyId: id,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    familiarity: draft.familiarity,
    note: draft.note?.trim() ? draft.note : undefined,
    personalExample: draft.personalExample?.trim()
      ? draft.personalExample
      : undefined,
  }
  if (!isAnnotation(record, id)) return 'invalid'
  const records = new Map(snapshot.records)
  if (record.note || record.personalExample || record.familiarity)
    records.set(id, record)
  else records.delete(id)
  try {
    window.localStorage.setItem(
      vocabularyAnnotationsKey,
      JSON.stringify({ version: 1, records: Object.fromEntries(records) }),
    )
  } catch {
    return 'unavailable'
  }
  window.dispatchEvent(new Event(vocabularyAnnotationChangeEvent))
  return 'saved'
}
