// @vitest-environment jsdom

import { afterEach, expect, it, vi } from 'vitest'
import {
  getVocabularyAnnotations,
  noteLimit,
  parseVocabularyAnnotations,
  saveVocabularyAnnotation,
  vocabularyAnnotationsKey,
} from './vocabulary-annotations'
import {
  favoriteWordsKey,
  readFavoriteWordIds,
  setWordFavorite,
} from './word-favorites'

const id = 'story-first-trip-ticket'
const progressKey = 'mellow:learner-progress'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

it('round-trips plain personal data and leaves existing favorites and progress intact', () => {
  localStorage.setItem(favoriteWordsKey, JSON.stringify([id, 'en-a-little']))
  localStorage.setItem(
    progressKey,
    '{"version":4,"data":{"lessons":{},"dailyStudyMs":{}}}',
  )
  expect(getVocabularyAnnotations().records.has(id)).toBe(false)
  const draft = {
    familiarity: 'learning',
    note: '  Atenção\nna estação!  ',
    personalExample: "It's my ticket.",
  } as const
  const time = vi.spyOn(Date, 'now').mockReturnValue(1000)
  expect(saveVocabularyAnnotation(id, draft, undefined)).toBe('saved')
  const read = parseVocabularyAnnotations(
    localStorage.getItem(vocabularyAnnotationsKey),
  ).records.get(id)
  expect(read).toEqual({
    vocabularyId: id,
    createdAt: 1000,
    updatedAt: 1000,
    ...draft,
  })
  time.mockReturnValue(2000)
  expect(
    saveVocabularyAnnotation(
      id,
      { personalExample: 'I have two tickets.' },
      read,
    ),
  ).toBe('saved')
  const edited = getVocabularyAnnotations().records.get(id)
  expect(edited).toMatchObject({
    createdAt: 1000,
    updatedAt: 2000,
    personalExample: 'I have two tickets.',
  })
  expect(edited?.note).toBeUndefined()
  expect(edited?.familiarity).toBeUndefined()
  expect(saveVocabularyAnnotation(id, { personalExample: ' ' }, edited)).toBe(
    'saved',
  )
  expect(getVocabularyAnnotations().records.has(id)).toBe(false)
  expect(readFavoriteWordIds()).toEqual([id, 'en-a-little'])
  expect(localStorage.getItem(progressKey)).toBe(
    '{"version":4,"data":{"lessons":{},"dailyStudyMs":{}}}',
  )
})

it('isolates invalid records, protects unsupported versions and avoids overwriting a newer edit', () => {
  const valid = {
    vocabularyId: id,
    createdAt: 100,
    updatedAt: 200,
    note: 'válida',
  }
  localStorage.setItem(
    vocabularyAnnotationsKey,
    JSON.stringify({
      version: 1,
      records: {
        [id]: valid,
        wrong: { ...valid, vocabularyId: 'wrong', familiarity: 'mastered' },
        oversized: {
          ...valid,
          vocabularyId: 'oversized',
          note: 'x'.repeat(noteLimit + 1),
        },
        time: { ...valid, vocabularyId: 'time', updatedAt: 50 },
        alias: valid,
      },
    }),
  )
  const snapshot = getVocabularyAnnotations()
  expect(snapshot.status).toBe('recovered')
  expect([...snapshot.records.keys()]).toEqual([id])
  expect(
    saveVocabularyAnnotation(id, { note: 'nova' }, snapshot.records.get(id)),
  ).toBe('saved')
  expect(
    saveVocabularyAnnotation(
      id,
      { note: 'rascunho' },
      snapshot.records.get(id),
    ),
  ).toBe('conflict')
  expect(getVocabularyAnnotations().records.get(id)?.note).toBe('nova')
  const unsupported = '{"version":2,"records":{"future":{"unknown":true}}}'
  localStorage.setItem(vocabularyAnnotationsKey, unsupported)
  expect(saveVocabularyAnnotation(id, { note: 'draft' }, undefined)).toBe(
    'unavailable',
  )
  expect(localStorage.getItem(vocabularyAnnotationsKey)).toBe(unsupported)
  expect(parseVocabularyAnnotations('{malformed').status).toBe('recovered')
})

it('requires confirmation for annotated favorite removal and restores personal data on re-saving', () => {
  setWordFavorite(id, true)
  saveVocabularyAnnotation(
    id,
    { familiarity: 'reviewing', note: 'rever depois' },
    undefined,
  )
  const confirm = vi
    .spyOn(window, 'confirm')
    .mockReturnValueOnce(false)
    .mockImplementationOnce(() => {
      localStorage.setItem(
        favoriteWordsKey,
        JSON.stringify([id, 'en-a-little']),
      )
      return true
    })
  expect(setWordFavorite(id, false)).toBe(false)
  expect(readFavoriteWordIds()).toEqual([id])
  expect(setWordFavorite(id, false)).toBe(true)
  expect(confirm).toHaveBeenCalledTimes(2)
  expect(readFavoriteWordIds()).toEqual(['en-a-little'])
  expect(getVocabularyAnnotations().records.get(id)?.note).toBe('rever depois')
  setWordFavorite(id, true)
  expect(readFavoriteWordIds()).toEqual(['en-a-little', id])
  expect(getVocabularyAnnotations().records.get(id)?.familiarity).toBe(
    'reviewing',
  )
})
