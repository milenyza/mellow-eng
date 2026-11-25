import { expect, it } from 'vitest'
import { stories } from '@/data/stories'
import { rainyMorningStory } from '@/data/stories/rainy-morning'
import { startStudyRun } from '@/services/lesson-progress'
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
} from '@/services/progress-format'
import {
  getReadingProgress,
  markChapterRead,
  readingTotals,
  resolveReadingChapter,
  resolveReadingParagraph,
  startReading,
  updateReadingChapter,
  updateStoryProgress,
} from '@/services/reading-progress'
import { filterStories } from '@/services/story-library'
import {
  getWeeklyStudyDays,
  recordReadingInterval,
  recordStudyInterval,
  totalStudyMs,
} from '@/services/study-time'
import type { ExerciseAttempt } from '@/types/exercise'

const story = rainyMorningStory
const [first, second, third] = story.chapters

it('round-trips preferences, stable positions and reviewed attempts and preserves version 1 lessons', () => {
  const legacy = {
    lessons: { old: { run: startStudyRun('intro', 100) } },
    dailyStudyMs: { '2026-11-25': 1000 },
  }
  const restored = parseProgress(JSON.stringify({ version: 1, data: legacy }))
  expect(restored).toEqual(legacy)
  if (!restored) throw new Error('Legacy record did not load')
  const answer = { kind: 'true-or-false', value: false } as const
  const attempt: ExerciseAttempt = {
    answer,
    status: 'reviewed',
    reviewedAt: 300,
    submissions: [
      { answer, correct: false, submittedAt: 200, mode: 'practice' },
    ],
  }
  const record = updateReadingChapter(
    startReading(second.id, undefined, 100),
    second.id,
    () => ({
      paragraphId: second.paragraphs[1].id,
      practice: { index: 1, attempts: { question: attempt }, finished: false },
    }),
  )
  const data = {
    ...restored,
    reading: {
      preferences: { fontSize: 'extra-large', translations: true },
      stories: { [story.id]: record },
    },
  } as const
  expect(parseProgress(serializeProgress(data))).toEqual(data)
  expect(resolveReadingChapter(story, record).id).toBe(second.id)
  expect(
    resolveReadingParagraph(
      second,
      record.run.chapters[second.id]?.paragraphId,
    ),
  ).toBe(second.paragraphs[1].id)
  expect(resolveReadingParagraph(second, 'removed-paragraph')).toBeUndefined()
})

it('recovers malformed reading independently of saved lesson progress', () => {
  const lesson = { run: startStudyRun('intro', 100) }
  const result = parseProgress(
    JSON.stringify({
      version: 2,
      data: {
        lessons: { old: lesson },
        dailyStudyMs: {},
        reading: {
          preferences: { translations: 123 },
          stories: {
            broken: { run: 'invalid' },
            valid: startReading(first.id),
          },
        },
      },
    }),
  )
  expect(result?.lessons.old).toEqual(lesson)
  expect(result?.reading?.preferences).toEqual({
    fontSize: 'normal',
    translations: false,
  })
  expect(result?.reading?.stories.broken).toBeUndefined()
  expect(result?.reading?.stories.valid).toBeTruthy()
})

it('completes only when every chapter is marked and keeps lifetime counts stable on reread', () => {
  let record = startReading(first.id, undefined, 100)
  record = markChapterRead(story, record, third.id, 200)
  expect(record.completion).toBeUndefined()
  expect(markChapterRead(story, record, third.id, 300)).toBe(record)
  record = markChapterRead(story, record, second.id, 300)
  record = markChapterRead(story, record, first.id, 400)
  expect(record.completion?.completedAt).toBe(400)
  let replay = startReading(first.id, record, 500)
  for (const chapter of story.chapters)
    replay = markChapterRead(story, replay, chapter.id, 600)
  expect(replay.completion).toBe(record.completion)
  expect(
    readingTotals(updateStoryProgress(emptyProgress(), story.id, () => replay)),
  ).toEqual({ stories: 1, chapters: 3, activeMs: 0 })
})

it('combines reading and lesson time in the same week and rejects a stale reading run', () => {
  const start = new Date(2026, 10, 25, 10).getTime()
  const lesson = startStudyRun('intro', start)
  const reading = startReading(first.id, undefined, start)
  const data = updateStoryProgress(
    { ...emptyProgress(), lessons: { old: { run: lesson } } },
    story.id,
    () => reading,
  )
  const studied = recordStudyInterval(
    data,
    'old',
    lesson.id,
    start,
    start + 3000,
  )
  const both = recordReadingInterval(
    studied,
    story.id,
    reading.run.id,
    start + 3000,
    start + 8000,
  )
  expect(totalStudyMs(both)).toBe(8000)
  expect(readingTotals(both).activeMs).toBe(5000)
  expect(getWeeklyStudyDays(both.dailyStudyMs, new Date(start))).toEqual([3])
  expect(
    recordReadingInterval(both, story.id, 'stale', start, start + 5000),
  ).toBe(both)
})

it('filters personal states independently of planned stories', () => {
  const data = updateStoryProgress(emptyProgress(), story.id, () =>
    startReading(first.id),
  )
  const filters = { title: '', level: '', genre: '' } as const
  expect(
    filterStories(
      stories,
      { ...filters, status: 'in-progress' },
      getReadingProgress(data).stories,
    ),
  ).toEqual([story])
  expect(
    filterStories(
      stories,
      { ...filters, status: 'not-started' },
      getReadingProgress(data).stories,
    ).map(({ id }) => id),
  ).toEqual(['the-first-trip'])
  expect(
    filterStories(
      stories,
      { ...filters, status: 'completed' },
      getReadingProgress(data).stories,
    ),
  ).toEqual([])
})
