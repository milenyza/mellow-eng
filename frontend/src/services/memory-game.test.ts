import { expect, it } from 'vitest'
import { englishCourse } from '@/data/curriculum/english-course'
import { dailyWord } from '@/data/dashboard'
import { memoryGame } from '@/data/games'
import { stories } from '@/data/stories'
import { getVocabularyPool } from '@/services/game-vocabulary'
import { generateMemoryBoard } from '@/services/memory-board'
import {
  dismissMemoryMismatch,
  initialMemoryRun,
  revealMemoryCard,
} from '@/services/memory-session'
import type { VocabularyPair } from '@/types/game'

const sources = { course: englishCourse, stories }
const identity = () => 0.99999

it('selects vocabulary from each eligible source using stable references and authored context', () => {
  const savedSources = {
    ...sources,
    savedWordIds: [
      'story-first-trip-ticket',
      'en-a-little',
      'missing',
      'story-first-trip-ticket',
    ],
    standaloneVocabulary: [dailyWord],
  }
  const saved = getVocabularyPool(memoryGame, 'saved', savedSources)
  expect(saved.map(({ id }) => id)).toEqual([
    'story-first-trip-ticket',
    'en-a-little',
  ])
  expect(saved[0]).toMatchObject({
    english: 'ticket',
    portuguese: 'Passagem / Bilhete',
    context: expect.stringContaining('Caio'),
  })
  expect(saved[1].example).toMatchObject({
    text: dailyWord.example,
    translation: dailyWord.exampleTranslation,
  })
  expect(
    getVocabularyPool(memoryGame, 'lessons', sources).some(({ id }) =>
      id.startsWith(englishCourse.id),
    ),
  ).toBe(true)
  expect(
    getVocabularyPool(memoryGame, 'stories', sources).every(({ id }) =>
      id.startsWith('story-'),
    ),
  ).toBe(true)
  const mixed = getVocabularyPool(memoryGame, 'mixed', savedSources)
  expect(mixed.filter(({ id }) => id === saved[0].id)).toHaveLength(1)
  expect(mixed.some(({ id }) => id === dailyWord.id)).toBe(true)
  expect(generateMemoryBoard(saved, 4)).toBeNull()
})

it.each(memoryGame.difficulties)(
  'builds a reproducible $id board with one card per language and pair',
  ({ roundSize }) => {
    const pool = getVocabularyPool(memoryGame, 'stories', sources)
    const board = generateMemoryBoard(pool, roundSize, () => 0.37)!
    expect(board).toEqual(generateMemoryBoard(pool, roundSize, () => 0.37))
    expect(board.cards.map(({ id }) => id)).not.toEqual(
      generateMemoryBoard(pool, roundSize, identity)?.cards.map(({ id }) => id),
    )
    expect(board.vocabulary).toHaveLength(roundSize)
    expect(board.cards).toHaveLength(roundSize * 2)
    expect(new Set(board.cards.map(({ id }) => id)).size).toBe(roundSize * 2)
    for (const pair of board.vocabulary) {
      expect(
        board.cards
          .filter((card) => card.pair === pair)
          .map(({ language }) => language)
          .sort(),
      ).toEqual(['en', 'pt-BR'])
    }
  },
)

it('excludes equivalent terms, competing translations and duplicate IDs before sizing a board', () => {
  const pool: VocabularyPair[] = [
    {
      id: 'hello',
      english: 'Hello!',
      portuguese: 'Olá / Oi',
      matchGroup: 'greeting',
    },
    { id: 'duplicate', english: '  hello', portuguese: 'Saudação' },
    { id: 'competing', english: 'Greetings', portuguese: 'ola' },
    { id: 'hi', english: 'Hi', portuguese: 'Tudo bem', matchGroup: 'greeting' },
    { id: 'hello', english: 'Morning', portuguese: 'Manhã' },
    { id: 'seat', english: 'Seat', portuguese: 'Assento' },
  ]
  expect(generateMemoryBoard(pool, 3)).toBeNull()
  expect(
    generateMemoryBoard(pool, 2, identity)?.vocabulary.map(({ id }) => id),
  ).toEqual(['hello', 'seat'])
  expect(generateMemoryBoard(pool, 0)).toBeNull()
})

it('counts only distinct eligible reveals, locks mismatches until dismissed and keeps matches completed', () => {
  const pool = getVocabularyPool(memoryGame, 'stories', sources)
  const board = generateMemoryBoard(pool, 4, identity)!
  const [first, match, other, otherMatch] = board.cards
  let run = initialMemoryRun()
  expect(dismissMemoryMismatch(run)).toBe(run)
  expect(revealMemoryCard(run, board, 'bogus')).toBe(run)
  run = revealMemoryCard(run, board, first.id)
  expect(run.pending).toEqual({ kind: 'first', id: first.id })
  expect(run.attemptCount).toBe(0)
  expect(revealMemoryCard(run, board, first.id)).toBe(run)
  run = revealMemoryCard(run, board, other.id)
  expect(run.pending).toEqual({ kind: 'mismatch', ids: [first.id, other.id] })
  expect(run).toMatchObject({
    attemptCount: 1,
    incorrectAttempts: 1,
    matchedIds: [],
  })
  expect(revealMemoryCard(run, board, match.id)).toBe(run)
  run = dismissMemoryMismatch(run)
  expect(run.pending.kind).toBe('none')
  run = revealMemoryCard(run, board, match.id)
  run = revealMemoryCard(run, board, first.id)
  expect(run).toMatchObject({
    attemptCount: 2,
    incorrectAttempts: 1,
    matchedIds: [first.pair.id],
  })
  expect(revealMemoryCard(run, board, first.id)).toBe(run)
  run = revealMemoryCard(run, board, other.id)
  run = revealMemoryCard(run, board, otherMatch.id)
  expect(run).toMatchObject({
    attemptCount: 3,
    incorrectAttempts: 1,
    matchedIds: [first.pair.id, other.pair.id],
  })
})
