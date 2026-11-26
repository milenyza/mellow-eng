import { expect, it } from 'vitest'
import { englishCourse } from '@/data/curriculum/english-course'
import {
  practicalSituations,
  situationCategories,
} from '@/data/practical-english'
import { stories } from '@/data/stories'
import { findCourseLesson } from '@/services/curriculum'
import type { PracticalSituation } from '@/types/practical-english'
import { filterSituations } from './practical-english-catalog'

it('keeps the eight published A1 situations and categories under stable IDs', () => {
  expect(situationCategories.map(({ id }) => id)).toEqual([
    'airport',
    'hotel',
    'food-and-drink',
    'shopping',
    'transportation',
    'meeting-people',
    'health-and-emergencies',
    'around-the-city',
  ])
  expect(practicalSituations.map(({ id }) => id)).toEqual([
    'at-the-airport',
    'at-the-hotel',
    'restaurants-and-coffee-shops',
    'shopping',
    'getting-around',
    'meeting-people',
    'health-and-emergencies',
    'around-the-city',
  ])
  expect(practicalSituations.map(({ categoryId }) => categoryId)).toEqual(
    situationCategories.map(({ id }) => id),
  )

  for (const situation of practicalSituations as readonly PracticalSituation[]) {
    expect(situation.publication).toBe('available')
    expect(situation.level).toBe('A1')
    expect(situation.phrasebook).toBe('available')
    expect(situation.estimatedMinutes).toBeGreaterThan(0)
    expect(situation.objectives.every((objective) => objective.trim())).toBe(
      true,
    )
    expect(situation.scenarios).toHaveLength(2)
    for (const outline of situation.scenarios) {
      expect(outline.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
      expect(
        [outline.title, outline.context, outline.goal].every((value) =>
          value.trim(),
        ),
      ).toBe(true)
    }
    expect(new Set(situation.scenarios.map(({ id }) => id)).size).toBe(
      situation.scenarios.length,
    )

    for (const reference of situation.references ?? []) {
      if (reference.kind === 'lesson') {
        const location = findCourseLesson(englishCourse, reference.lessonId)
        expect(location?.lesson.availability).toBe('available')
        if (reference.blockId) {
          expect(
            location?.lesson.blocks?.some(({ id }) => id === reference.blockId),
          ).toBe(true)
        }
      }
      if (reference.kind === 'story') {
        const story = stories.find(({ id }) => id === reference.storyId)
        expect(story?.publication).toBe('available')
        expect(
          story?.chapters.some(({ id }) => id === reference.chapterId),
        ).toBe(true)
      }
    }
  }
})

it('normalizes accented and mixed-case search and combines bilingual terms with the category', () => {
  expect(filterSituations(practicalSituations, '   ', '')).toEqual(
    practicalSituations,
  )
  expect(
    filterSituations(practicalSituations, 'ONIBUS', '').map(({ id }) => id),
  ).toEqual(['getting-around'])
  expect(
    filterSituations(practicalSituations, 'At the airport', '').map(
      ({ id }) => id,
    ),
  ).toEqual(['at-the-airport'])
  expect(
    filterSituations(
      practicalSituations,
      'menu / CARDAPIO',
      'food-and-drink',
    ).map(({ id }) => id),
  ).toEqual(['restaurants-and-coffee-shops'])
  expect(filterSituations(practicalSituations, 'gate', 'shopping')).toEqual([])
  expect(filterSituations(practicalSituations, 'unmatched', '')).toEqual([])
})
