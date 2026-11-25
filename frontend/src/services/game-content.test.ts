import { expect, it } from 'vitest'
import { englishCourse } from '@/data/curriculum/english-course'
import { introductionsLesson } from '@/data/curriculum/introductions-lesson'
import { dailyWord } from '@/data/dashboard'
import { games } from '@/data/games'
import { stories } from '@/data/stories'
import type { GameConfiguration } from '@/types/game'
import { selectGameContent } from './game-content'

const sources = { course: englishCourse, stories }

it('defines three distinct games with valid configurations and published content candidates', () => {
  expect(games.map(({ id }) => id)).toEqual([
    'word-match',
    'sentence-builder',
    'memory-game',
  ])
  expect(new Set(games.map(({ type }) => type)).size).toBe(games.length)
  for (const game of games) {
    expect(game.publication).toBe('available')
    expect(game.estimatedMinutes).toBeGreaterThan(0)
    expect(game.objectives.every((objective) => objective.trim())).toBe(true)
    expect(new Set(game.levels).size).toBe(game.levels.length)
    expect(new Set(game.difficulties.map(({ id }) => id)).size).toBe(
      game.difficulties.length,
    )
    expect(
      game.difficulties.every(
        ({ roundSize }) => Number.isInteger(roundSize) && roundSize > 0,
      ),
    ).toBe(true)
    expect(selectGameContent(game, 'A1', sources).length).toBeGreaterThan(0)
    expect(selectGameContent(game, 'A2', sources)).toEqual([])
  }
})

it('selects authentic lesson grammar by stable references without including vocabulary or other lessons', () => {
  const game: GameConfiguration = {
    ...games[1],
    content: [{ kind: 'lesson-grammar', lessonId: introductionsLesson.id }],
  }
  const [candidate, ...others] = selectGameContent(game, 'A1', sources)
  expect(others).toEqual([])
  expect(candidate).toEqual({
    kind: 'lesson-block',
    courseId: englishCourse.id,
    lessonId: introductionsLesson.id,
    block: introductionsLesson.blocks.find(({ id }) => id === 'pronouns'),
  })
  expect(
    selectGameContent(game, 'A1', { ...sources, introducedLessonIds: [] }),
  ).toEqual([])
  expect(
    selectGameContent(game, 'A1', {
      ...sources,
      introducedLessonIds: [introductionsLesson.id],
    }),
  ).toEqual([candidate])
})

it('reuses published story entries and respects explicitly scoped story references', () => {
  const game: GameConfiguration = {
    ...games[0],
    content: [{ kind: 'story-vocabulary', storyId: 'the-first-trip' }],
  }
  const selected = selectGameContent(game, 'A1', sources)
  expect(selected.length).toBeGreaterThan(0)
  expect(
    selected.every(
      (candidate) =>
        candidate.kind === 'story-entry' &&
        candidate.storyId === 'the-first-trip',
    ),
  ).toBe(true)
  expect(selectGameContent({ ...game, levels: ['A2'] }, 'A2', sources)).toEqual(
    [],
  )
})

it('resolves known favorites, skips unknown or off-level content, and includes a story entry once', () => {
  const savedSources = {
    ...sources,
    savedWordIds: [
      'story-first-trip-ticket',
      'story-first-trip-ticket',
      dailyWord.id,
      'missing-id',
      'off-level',
    ],
    standaloneVocabulary: [
      dailyWord,
      { id: 'off-level', level: 'A2', word: 'example', translation: 'exemplo' },
    ] as const,
  }
  const game: GameConfiguration = {
    ...games[2],
    content: [{ kind: 'saved-vocabulary' }],
  }
  const selected = selectGameContent(game, 'A1', savedSources)
  expect(selected).toMatchObject([
    {
      kind: 'story-entry',
      storyId: 'the-first-trip',
      chapterId: 'a-ticket-to-the-coast',
      entry: { id: 'story-first-trip-ticket' },
    },
    { kind: 'standalone-entry', entry: dailyWord },
  ])
  expect(
    selectGameContent(games[2], 'A1', savedSources).filter(
      (candidate) =>
        candidate.kind === 'story-entry' &&
        candidate.entry.id === 'story-first-trip-ticket',
    ),
  ).toHaveLength(1)
})
