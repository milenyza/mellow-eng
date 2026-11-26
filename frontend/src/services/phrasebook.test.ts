import { expect, it } from 'vitest'
import { englishA1 } from '@/data/curriculum/english-a1'
import { englishA1Index } from '@/data/curriculum/english-a1-index'
import { practicalSituations } from '@/data/practical-english'
import {
  loadPhrasebook,
  loadPracticalSituation,
} from '@/data/phrasebooks/load-phrasebook'
import { stories } from '@/data/stories'
import { filterPhrasebook } from './practical-english-catalog'

const publishedIds = [
  'at-the-airport',
  'at-the-hotel',
  'restaurants-and-coffee-shops',
] as const

it('publishes only three complete A1 phrasebooks with stable, unique, scoped expression IDs', async () => {
  expect(
    practicalSituations
      .filter(({ phrasebook }) => phrasebook === 'available')
      .map(({ id }) => id),
  ).toEqual(publishedIds)
  expect(
    practicalSituations.every(({ publication }) => publication === 'planned'),
  ).toBe(true)
  const ids = new Set<string>()
  for (const id of publishedIds) {
    const phrasebook = await loadPhrasebook(id)
    expect(phrasebook.situationId).toBe(id)
    expect(phrasebook.groups).toHaveLength(6)
    expect(new Set(phrasebook.groups.map(({ id }) => id)).size).toBe(6)
    const expressions = phrasebook.groups.flatMap(
      ({ expressions }) => expressions,
    )
    expect(expressions.length).toBeGreaterThanOrEqual(18)
    expect(expressions.length).toBeLessThanOrEqual(24)
    const local = new Set(expressions.map(({ id }) => id))
    for (const group of phrasebook.groups) {
      for (const phrase of group.expressions) {
        expect(phrase.id).toMatch(
          new RegExp(`^practical-${id}-[a-z]+(?:-[a-z]+)*$`),
        )
        expect(ids.has(phrase.id)).toBe(false)
        ids.add(phrase.id)
        expect(phrase.intent).toBe(group.id)
        expect(
          [phrase.text, phrase.translation, phrase.usage].every((item) =>
            item.trim(),
          ),
        ).toBe(true)
        expect(
          phrase.relatedIds?.every((id) => local.has(id) && id !== phrase.id) ??
            true,
        ).toBe(true)
        for (const reference of phrase.references ?? []) {
          if (reference.kind === 'vocabulary') {
            expect(
              stories.some(
                (story) =>
                  story.publication === 'available' &&
                  story.chapters.some(({ vocabulary }) =>
                    vocabulary?.some(({ id }) => id === reference.vocabularyId),
                  ),
              ),
            ).toBe(true)
          }
          if (reference.kind === 'story') {
            expect(
              stories.some(
                ({ id, chapters, publication }) =>
                  publication === 'available' &&
                  id === reference.storyId &&
                  chapters.some(({ id }) => id === reference.chapterId),
              ),
            ).toBe(true)
          }
        }
      }
    }
  }
  expect(ids.has('practical-at-the-hotel-breakfast-time')).toBe(true)
  expect(ids.size).toBe(56)
})

it('searches either language, normalizes apostrophes and accents, and combines contextual search with intent', async () => {
  const hotel = await loadPhrasebook('at-the-hotel')
  const find = (query: string, intent = '') =>
    filterPhrasebook(hotel.groups, query, intent).flatMap(
      ({ expressions }) => expressions,
    )
  expect(find('BREAKFAST INCLUDED').map(({ text }) => text)).toEqual([
    'Is breakfast included?',
  ])
  expect(find('CAFE DA MANHA', 'breakfast')).toHaveLength(3)
  expect(find("what's Wi-Fi", 'facilities').map(({ text }) => text)).toEqual([
    'What’s the Wi-Fi password?',
  ])
  expect(find('internet', 'facilities')).toHaveLength(1)
  expect(find('cafe da manha', 'departure')).toEqual([])
})

it('resolves lazy-loaded details and handles preview-only or unknown identifiers', async () => {
  const airport = await loadPracticalSituation('at-the-airport')
  expect(airport.phrasebook?.situationId).toBe('at-the-airport')
  const shopping = await loadPracticalSituation('shopping')
  expect(shopping.situation?.phrasebook).toBe('planned')
  expect(shopping.phrasebook).toBeUndefined()
  expect((await loadPracticalSituation('unknown')).situation).toBeUndefined()
})

it('keeps the lightweight curriculum index in sync with the full lessons', () => {
  expect(englishA1Index.units).toEqual(
    englishA1.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map(({ blocks, ...metadata }) => {
        if (metadata.availability === 'available')
          expect(blocks?.length).toBeGreaterThan(0)
        return metadata
      }),
    })),
  )
})
