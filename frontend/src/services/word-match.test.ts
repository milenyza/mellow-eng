import { expect, it } from 'vitest'
import { englishCourse } from '@/data/curriculum/english-course'
import { dailyWord } from '@/data/dashboard'
import { wordMatchGame } from '@/data/games'
import { stories } from '@/data/stories'
import type { VocabularyPair } from '@/types/game'
import { getVocabularyPool, uniqueVocabularyPairs } from './game-vocabulary'
import { generateWordMatchRounds } from './word-match-content'
import {
  chooseWordMatchItem,
  initialWordMatchRun,
  nextWordMatchRound,
  summarizeMatches,
} from './word-match-session'

const sources = {
  course: englishCourse,
  stories,
  savedWordIds: ['en-a-little', 'story-first-trip-ticket', 'missing'],
  standaloneVocabulary: [dailyWord],
}

const vocabulary = Array.from({ length: 24 }, (_, index): VocabularyPair => ({
  id: `item-${index}`,
  english: `word ${index}`,
  portuguese: `palavra ${index}`,
}))

function random(seed = 1) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

it('filters published A1 vocab by source and keeps stable identifiers and contextual meanings', () => {
  const lessons = getVocabularyPool(wordMatchGame, 'lessons', sources)
  const story = getVocabularyPool(wordMatchGame, 'stories', sources)
  const saved = getVocabularyPool(wordMatchGame, 'saved', sources)
  const mixed = getVocabularyPool(wordMatchGame, 'mixed', sources)
  expect(lessons.length).toBeGreaterThan(8)
  expect(story.length).toBeGreaterThan(8)
  expect(lessons.every(({ id }) => id.startsWith(`${englishCourse.id}/`))).toBe(
    true,
  )
  expect(new Set(story.map(({ id }) => id)).size).toBe(story.length)
  expect(saved.map(({ id }) => id)).toEqual([
    'story-first-trip-ticket',
    'en-a-little',
  ])
  expect(saved[0]).toMatchObject({
    portuguese: 'Passagem / Bilhete',
    pronunciation: '/ˈtɪk.ɪt/',
    context: expect.stringContaining('Caio'),
  })
  expect(mixed.filter(({ id }) => id === saved[0].id)).toHaveLength(1)
  expect(mixed).toContainEqual(saved[1])
  expect(generateWordMatchRounds(saved, 4)).toBeNull()
  expect(
    getVocabularyPool(wordMatchGame, 'saved', { ...sources, savedWordIds: [] }),
  ).toEqual([])
})

it('excludes copies and ambiguous labels, including shared translations and authored synonyms', () => {
  const pairs = [
    {
      id: 'one',
      english: 'Hello!',
      portuguese: 'Olá / Oi',
      matchGroup: 'greeting',
    },
    { id: 'one', english: 'Other', portuguese: 'Outro' },
    { id: 'two', english: ' hello ', portuguese: 'Tudo bem' },
    { id: 'three', english: 'Greetings', portuguese: ' ola. ' },
    { id: 'four', english: 'Hi', portuguese: 'E aí', matchGroup: 'greeting' },
    { id: 'five', english: 'Ticket', portuguese: 'Bilhete' },
  ]
  expect(uniqueVocabularyPairs(pairs).map(({ id }) => id)).toEqual([
    'one',
    'five',
  ])
  expect(generateWordMatchRounds(pairs, 4)).toBeNull()
})

it.each([4, 6, 8])(
  'builds three deterministic rounds of %i with independently shuffled columns',
  (size) => {
    expect(
      wordMatchGame.difficulties.map(({ roundSize }) => roundSize),
    ).toEqual([4, 6, 8])
    const rounds = generateWordMatchRounds(vocabulary, size, random())!
    expect(rounds).toEqual(generateWordMatchRounds(vocabulary, size, random()))
    expect(rounds).toHaveLength(3)
    for (const round of rounds) {
      expect(round.english).toHaveLength(size)
      expect(new Set(round.english.map(({ id }) => id))).toEqual(
        new Set(round.portuguese.map(({ id }) => id)),
      )
    }
    expect(
      rounds.some(({ english, portuguese }) =>
        english.some((pair, index) => pair.id !== portuguese[index].id),
      ),
    ).toBe(true)
    expect(
      new Set(rounds.flatMap(({ english }) => english.map(({ id }) => id)))
        .size,
    ).toBe(size * 3)
  },
)

it('uses all available pairs before repeating when a source is small', () => {
  const rounds = generateWordMatchRounds(vocabulary.slice(0, 6), 4, random())!
  expect(
    new Set(
      rounds.slice(0, 2).flatMap(({ english }) => english.map(({ id }) => id)),
    ).size,
  ).toBe(6)
  expect(new Set(rounds[2].english.map(({ id }) => id)).size).toBe(4)
})

it('tracks attempts from either side, guards finished pairs and resets per-round accuracy', () => {
  const rounds = generateWordMatchRounds(vocabulary.slice(0, 4), 4, random())!
  const [first, second] = vocabulary
  let run = initialWordMatchRun()
  const choose = (side: 'english' | 'portuguese', id: string) => {
    run = chooseWordMatchItem(run, rounds[run.roundIndex], { side, id })
  }
  choose('portuguese', second.id)
  choose('english', first.id)
  expect(run.lastAttempt?.correct).toBe(false)
  choose('english', first.id)
  choose('portuguese', first.id)
  expect(run.lastAttempt).toMatchObject({ correct: true, firstForPair: false })
  const previous = run
  choose('english', first.id)
  expect(run).toBe(previous)
  run = nextWordMatchRound(run)
  choose('portuguese', first.id)
  choose('english', first.id)
  expect(run.lastAttempt).toMatchObject({ correct: true, firstForPair: true })
  expect(summarizeMatches(run, rounds)).toMatchObject({
    answeredCount: 3,
    correctCount: 2,
    firstAttemptCorrect: 1,
    reviewIds: [first.id, second.id],
  })
})
