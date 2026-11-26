import { expect, it, vi } from 'vitest'
import * as phrasebooks from '@/data/phrasebooks/load-phrasebook'
import { resolveNotebookVocabulary } from './notebook-content'
import {
  filterNotebook,
  initialNotebookFilters,
  type NotebookFilters,
  selectSavedVocabulary,
} from './notebook-selectors'

const lesson = 'english-for-pt-br/en-a1-introductions-hello/greetings/hello'
const story = 'story-first-trip-ticket'
const phrase = 'practical-shopping-receipt'
const daily = 'en-a-little'

it('resolves each source, preserves canonical references and loads only the referenced phrasebooks', async () => {
  const load = vi.spyOn(phrasebooks, 'loadPhrasebook')
  try {
    const { vocabulary, failedIds } = await resolveNotebookVocabulary([
      lesson,
      story,
      phrase,
      daily,
      phrase,
      'outdated',
    ])
    expect(failedIds.size).toBe(0)
    expect(vocabulary.size).toBe(4)
    expect(load.mock.calls).toEqual([['shopping']])
    expect(vocabulary.get(lesson)).toMatchObject({
      text: 'Hello',
      type: 'word',
      source: { href: '/aulas/en-a1-introductions-hello' },
    })
    expect(vocabulary.get(story)).toMatchObject({
      pronunciation: '/ˈtɪk.ɪt/',
      source: { href: '/historias/the-first-trip/a-ticket-to-the-coast' },
    })
    expect(vocabulary.get(phrase)).toMatchObject({
      type: 'phrase',
      source: {
        href: '/ingles-na-pratica/shopping#practical-shopping-receipt',
      },
    })
    expect(vocabulary.get(daily)).toMatchObject({
      type: 'expression',
      source: { kind: 'daily' },
    })
    expect(vocabulary.has('outdated')).toBe(false)
  } finally {
    load.mockRestore()
  }
})

it('distinguishes a failed source load from an outdated favorite and preserves other sources', async () => {
  const load = vi
    .spyOn(phrasebooks, 'loadPhrasebook')
    .mockRejectedValueOnce(new Error('Chunk unavailable'))
  try {
    const { vocabulary, failedIds } = await resolveNotebookVocabulary([
      phrase,
      daily,
      'unknown',
    ])
    expect(failedIds).toEqual(new Set([phrase]))
    expect([...vocabulary.keys()]).toEqual([daily])
  } finally {
    load.mockRestore()
  }
})

it('preserves different meanings and applies bilingual filters and reliable date sorting', async () => {
  const { vocabulary } = await resolveNotebookVocabulary([
    story,
    lesson,
    phrase,
    daily,
  ])
  const original = vocabulary.get(story)!
  const other = {
    ...original,
    id: 'ticket-other',
    translation: 'Multa',
    level: 'A2',
  } as const
  const items = selectSavedVocabulary(
    [daily, phrase, story, other.id, story, lesson],
    new Map([...vocabulary, [other.id, other]]),
    { [phrase]: 10, [story]: 20 },
  )
  expect(items).toHaveLength(5)
  const find = (filters: Partial<NotebookFilters>) =>
    filterNotebook(items, { ...initialNotebookFilters, ...filters }).map(
      ({ vocabularyId }) => vocabularyId,
    )
  expect(find({ query: 'TICKET' })).toEqual([other.id, story])
  expect(find({ query: 'OLA' })).toEqual([lesson])
  expect(
    find({
      ...initialNotebookFilters,
      query: 'PRECO',
      source: 'practical',
      type: 'phrase',
      level: 'A1',
    }),
  ).toEqual([phrase])
  expect(
    find({ ...initialNotebookFilters, query: 'ticket', level: 'A2' }),
  ).toEqual([other.id])
  expect(find({ sort: 'recent' }).slice(0, 2)).toEqual([story, phrase])
  expect(find({}).slice(0, 3)).toEqual([daily, phrase, lesson])
  expect(
    items.find(({ vocabularyId }) => vocabularyId === lesson)?.savedAt,
  ).toBeUndefined()
})
