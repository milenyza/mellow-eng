import { expect, it } from 'vitest'
import {
  getFlashcardFilters,
  getFlashcardSearch,
  selectFlashcardIds,
} from './flashcard-filters'
import {
  finishFlashcardSession,
  generateFlashcards,
  getReviewLengths,
  selectDifficultCards,
  startFlashcardSession,
  updateFlashcardSession,
} from './flashcards'
import type { FlashcardConfiguration } from '@/types/flashcards'
import type { NotebookItem, VocabularyAnnotation } from '@/types/notebook'

const filters = {
  query: '',
  source: '',
  type: '',
  level: '',
  familiarity: '',
} as const
const config: FlashcardConfiguration = {
  filters,
  scope: 'saved',
  direction: 'mixed',
  length: 'all',
}

function item(
  id: string,
  text = 'ticket',
  translation = 'passagem',
): NotebookItem {
  return {
    vocabularyId: id,
    vocabulary: {
      id,
      text,
      translation,
      type: 'word',
      level: 'A1',
      source: { kind: 'story', href: '/' },
    },
  }
}

it('offers supported sizes and excludes duplicates and missing answers without combining word senses', () => {
  expect(getReviewLengths(0)).toEqual([])
  expect(getReviewLengths(4)).toEqual(['all'])
  expect(getReviewLengths(12)).toEqual([5, 10, 'all'])
  expect(getReviewLengths(24)).toEqual([5, 10, 20, 'all'])
  const regular = item('ticket-train')
  const inputs = [
    regular,
    regular,
    item('ticket-fine', 'ticket', 'multa'),
    item('broken', 'empty', ''),
  ]
  expect(generateFlashcards(inputs, { ...config, length: 5 })).toEqual([])
  const cards = generateFlashcards(inputs, config, () => 0.9)
  expect(cards.map(({ item }) => item.vocabularyId)).toEqual([
    'ticket-train',
    'ticket-fine',
  ])
  expect(cards.map(({ item }) => item.vocabulary.translation)).toEqual([
    'passagem',
    'multa',
  ])
})

it('shuffles deterministically and assigns balanced directions, including an odd-card tie choice', () => {
  const inputs = Array.from({ length: 9 }, (_, index) => item(`item-${index}`))
  const first = generateFlashcards(inputs, config, () => 0)
  expect(first).toEqual(generateFlashcards(inputs, config, () => 0))
  expect(first.map(({ item }) => item)).not.toEqual(inputs)
  expect(first.filter(({ direction }) => direction === 'en-pt')).toHaveLength(5)
  expect(
    generateFlashcards(inputs, config, () => 0.75).filter(
      ({ direction }) => direction === 'en-pt',
    ),
  ).toHaveLength(4)
  expect(
    generateFlashcards(
      inputs,
      { ...config, direction: 'pt-en', length: 5 },
      () => 0,
    ).map(({ direction }) => direction),
  ).toEqual(Array(5).fill('pt-en'))
})

it('validates filters, preselects source and familiarity and leaves the private query out of the URL', () => {
  const inputs = [
    'en-a-little',
    'story-first-trip-ticket',
    'story-rainy-morning-loaf',
    'practical-shopping-receipt',
  ]
  const annotations = new Map<string, VocabularyAnnotation>([
    [
      inputs[1],
      {
        vocabularyId: inputs[1],
        familiarity: 'reviewing',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  ])
  const settings = {
    ...filters,
    source: 'story',
    familiarity: 'reviewing',
    query: 'uma nota pessoal',
  } as const
  const search = getFlashcardSearch(settings)
  expect(search).toBe('?origem=story&familiaridade=reviewing')
  expect(
    getFlashcardFilters(new URLSearchParams(search), settings.query),
  ).toEqual(settings)
  expect(selectFlashcardIds(inputs, settings, annotations)).toEqual([inputs[1]])
  expect(
    selectFlashcardIds(
      inputs,
      { source: 'story', familiarity: 'unclassified' },
      annotations,
    ),
  ).toEqual([inputs[2]])
  expect(
    getFlashcardFilters(
      new URLSearchParams(
        'origem=constructor&tipo=bad&nivel=Z7&familiaridade=mastered',
      ),
    ),
  ).toEqual(filters)
})

it('requires reveal, preserves previous observations and creates a separate review of difficult items', () => {
  const cards = generateFlashcards(
    [item('first'), item('second'), item('third')],
    { ...config, direction: 'en-pt' },
    () => 0.9,
  )
  const session = startFlashcardSession(cards, config, 100)
  const rateFirst = {
    kind: 'rate',
    vocabularyId: 'first',
    rating: 'effort',
    at: 200,
  } as const
  expect(updateFlashcardSession(session, rateFirst)).toBe(session)
  expect(updateFlashcardSession(session, { kind: 'next' })).toBe(session)
  const revealed = updateFlashcardSession(session, { kind: 'reveal' })
  expect(
    updateFlashcardSession(revealed, { ...rateFirst, vocabularyId: 'stale' }),
  ).toBe(revealed)
  const second = updateFlashcardSession(revealed, rateFirst)
  expect(second.position).toBe(1)
  const previous = updateFlashcardSession(second, { kind: 'previous' })
  expect(previous.revealedIds).toEqual(['first'])
  expect(updateFlashcardSession(previous, rateFirst)).toBe(previous)
  expect(updateFlashcardSession(previous, { kind: 'next' })).toEqual(second)
  expect(finishFlashcardSession(second, 25)).toBeUndefined()
  const third = updateFlashcardSession(
    updateFlashcardSession(second, { kind: 'reveal' }),
    { kind: 'rate', vocabularyId: 'second', rating: 'easy', at: 300 },
  )
  const done = updateFlashcardSession(
    updateFlashcardSession(third, { kind: 'reveal' }),
    { kind: 'rate', vocabularyId: 'third', rating: 'forgot', at: 400 },
  )
  const result = finishFlashcardSession(done, 250)!
  expect(result).toMatchObject({
    sessionId: session.id,
    startedAt: 100,
    completedAt: 400,
    activeMs: 250,
  })
  const difficult = selectDifficultCards(cards, result.observations)
  expect(difficult.map(({ item }) => item.vocabularyId)).toEqual([
    'first',
    'third',
  ])
  const retry = startFlashcardSession(
    difficult,
    { ...config, scope: 'difficult' },
    425,
  )
  expect(retry.id).not.toBe(session.id)
  expect(retry.observations).toEqual([])
  expect(retry.revealedIds).toEqual([])
})
