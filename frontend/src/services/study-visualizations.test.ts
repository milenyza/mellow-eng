import { expect, it } from 'vitest'
import {
  aggregateStudyActivity,
  buildStudyCalendar,
  getStudyBounds,
  previousStudyPeriod,
  resolveStudyPeriod,
  shiftStudyMonth,
  studyIntensity,
  validStudyRange,
  validCustomStudyRange,
} from './study-calendar'
import { studyDistribution, studyInsights } from './study-visualizations'
import { getWeeklyStudyDays, localStudyDay } from './study-time'
import type { DailyLearningActivity } from '@/types/learning-analytics'

const minute = 60_000
const sample = (day: string, minutes: number): DailyLearningActivity => ({
  day,
  totalMs: minutes * minute,
  byModule: {
    lessonsAndReading: minutes * minute,
    games: 0,
    simulations: 0,
    flashcards: 0,
  },
})

it('resolves date presets against the device-local calendar and starts weeks on Monday', () => {
  const now = new Date(2024, 0, 1, 0, 0, 1)
  const today = localStudyDay(now)
  expect(today).toBe('2024-01-01')
  expect(resolveStudyPeriod('week', today)).toEqual({ from: today, to: today })
  expect(resolveStudyPeriod('week', '2023-12-31')).toEqual({
    from: '2023-12-25',
    to: '2023-12-31',
  })
  expect(resolveStudyPeriod('seven', today)).toEqual({
    from: '2023-12-26',
    to: today,
  })
  expect(resolveStudyPeriod('thirty', today)).toEqual({
    from: '2023-12-03',
    to: today,
  })
  expect(resolveStudyPeriod('month', '2024-02-29')).toEqual({
    from: '2024-02-01',
    to: '2024-02-29',
  })
  expect(resolveStudyPeriod('all', today)).toEqual({})
  expect(
    getWeeklyStudyDays(
      { [today]: minute, '2023-12-31': minute, '2024-01-02': minute },
      now,
    ),
  ).toEqual([1])
})

it('accepts inclusive custom boundaries and validates leap days and reversed dates', () => {
  expect(validStudyRange({ from: '2024-02-29', to: '2024-02-29' })).toBe(true)
  expect(validStudyRange({ from: '2023-02-29' })).toBe(false)
  expect(validStudyRange({ from: '2024-03-01', to: '2024-02-29' })).toBe(false)
  expect(validCustomStudyRange({}, '2024-03-01')).toBe(false)
  expect(validCustomStudyRange({ to: '2024-03-02' }, '2024-03-01')).toBe(false)
  expect(validCustomStudyRange({ to: '2024-03-01' }, '2024-03-01')).toBe(true)
  const range = resolveStudyPeriod('custom', '2024-03-01', {
    from: '2024-02-29',
  })
  expect(getStudyBounds(range, [], '2024-03-01')).toEqual({
    from: '2024-02-29',
    to: '2024-03-01',
  })
  expect(
    getStudyBounds({ from: '2024-03-02', to: '2024-03-04' }, [], '2024-03-01'),
  ).toBeUndefined()
})

it('aggregates into daily, Monday-based weekly and monthly buckets with inclusive edges', () => {
  const daily = [
    sample('2024-02-28', 1),
    sample('2024-03-01', 2),
    sample('2024-03-04', 5),
    sample('2024-03-15', 10),
  ]
  expect(
    aggregateStudyActivity(daily, { from: '2024-02-28', to: '2024-03-01' }),
  ).toMatchObject({
    interval: 'day',
    points: [
      { from: '2024-02-28', to: '2024-02-28', ms: minute },
      { from: '2024-02-29', to: '2024-02-29', ms: 0 },
      { from: '2024-03-01', to: '2024-03-01', ms: minute * 2 },
    ],
  })
  expect(
    aggregateStudyActivity(daily, { from: '2024-02-28', to: '2024-03-14' }),
  ).toMatchObject({
    interval: 'week',
    points: [
      { from: '2024-02-28', to: '2024-03-03', ms: minute * 3 },
      { from: '2024-03-04', to: '2024-03-10', ms: minute * 5 },
      { from: '2024-03-11', to: '2024-03-14', ms: 0 },
    ],
  })
  expect(
    aggregateStudyActivity(daily, { from: '2023-12-31', to: '2024-04-01' }),
  ).toMatchObject({
    interval: 'month',
    points: [
      { from: '2023-12-31', to: '2023-12-31', ms: 0 },
      { from: '2024-01-01', to: '2024-01-31', ms: 0 },
      { from: '2024-02-01', to: '2024-02-29', ms: minute },
      { from: '2024-03-01', to: '2024-03-31', ms: minute * 17 },
      { from: '2024-04-01', to: '2024-04-01', ms: 0 },
    ],
  })
  expect(
    aggregateStudyActivity(daily, { from: '2020-01-01', to: '2024-04-01' }),
  ).toMatchObject({
    sparse: true,
    points: [{ from: '2024-02-01' }, { from: '2024-03-01' }],
  })
  expect(aggregateStudyActivity([]).points).toEqual([])
})

it('builds Monday-first leap month weeks and distinguishes zero, future and documented activity', () => {
  const events = ['2024-02-28', '2024-02-29'].map(
    (day, index) =>
      ({
        kind: 'chapter',
        module: 'stories',
        classification: 'milestone',
        contentId: `chapter-${index}`,
        id: `chapter-${index}`,
        parentId: 'story',
        at: new Date(2024, 1, 28 + index, 23, 59).getTime(),
        day,
        status: 'completed',
      }) as const,
  )
  const weeks = buildStudyCalendar(
    '2024-02-01',
    '2024-02-28',
    [sample('2024-02-28', 5), sample('2024-02-29', 20)],
    events,
  )
  expect(weeks[0].slice(0, 3)).toEqual([null, null, null])
  const days = weeks.flat().filter((day) => day !== null)
  expect(days).toHaveLength(29)
  expect(days[0]).toMatchObject({
    day: '2024-02-01',
    ms: 0,
    future: false,
    intensity: 'none',
    events: [],
  })
  expect(days[27]).toMatchObject({
    day: '2024-02-28',
    ms: 5 * minute,
    intensity: 'medium',
    events: [events[0]],
  })
  expect(days[28]).toMatchObject({
    day: '2024-02-29',
    ms: 0,
    future: true,
    events: [],
  })
  expect(shiftStudyMonth('2024-01-23', -1)).toBe('2023-12-01')
  expect(shiftStudyMonth('2023-12-23', 1)).toBe('2024-01-01')
  expect(
    [0, 1, 5 * minute - 1, 5 * minute, 15 * minute].map(studyIntensity),
  ).toEqual(['none', 'light', 'light', 'medium', 'high'])
})

it('reconciles combined and split categories and allocates whole percentages deterministically', () => {
  const byModule = {
    lessonsAndReading: 1,
    games: 1,
    simulations: 1,
    flashcards: 0,
  }
  expect(
    studyDistribution({ byModule }).categories.map(({ category, percent }) => [
      category,
      percent,
    ]),
  ).toEqual([
    ['lessonsAndReading', 34],
    ['games', 33],
    ['simulations', 33],
    ['flashcards', 0],
  ])
  expect(
    studyDistribution({ byModule, lessonsMs: 1, readingMs: 1 }).categories[0]
      .category,
  ).toBe('lessonsAndReading')
  const split = studyDistribution({
    byModule: { ...byModule, lessonsAndReading: 3 },
    lessonsMs: 1,
    readingMs: 2,
  })
  expect(split.total).toBe(5)
  expect(
    split.categories.map(({ category, ms, percent }) => [
      category,
      ms,
      percent,
    ]),
  ).toEqual([
    ['lessons', 1, 20],
    ['reading', 2, 40],
    ['games', 1, 20],
    ['simulations', 1, 20],
    ['flashcards', 0, 0],
  ])
  const empty = studyDistribution({
    byModule: { lessonsAndReading: 0, games: 0, simulations: 0, flashcards: 0 },
  })
  expect(empty.total).toBe(0)
  expect(empty.categories.every(({ percent }) => percent === 0)).toBe(true)
})

it('calculates active-day averages and compares only adjacent periods with recorded duration', () => {
  const current = [
    sample('2024-03-09', 4),
    sample('2024-03-10', 0),
    sample('2024-03-12', 6),
  ]
  const bounds = { from: '2024-03-09', to: '2024-03-12' }
  const history = [
    sample('2024-03-04', 20),
    sample('2024-03-05', 1),
    sample('2024-03-08', 2),
    ...current,
  ]
  const distribution = studyDistribution({
    byModule: {
      lessonsAndReading: 10 * minute,
      games: 0,
      simulations: 0,
      flashcards: 0,
    },
  })
  expect(previousStudyPeriod(bounds)).toEqual({
    from: '2024-03-05',
    to: '2024-03-08',
  })
  expect(studyInsights(current, distribution, history, bounds)).toEqual({
    averageMs: 5 * minute,
    leading: 'Aulas e leitura',
    comparison: {
      from: '2024-03-05',
      to: '2024-03-08',
      previousMs: 3 * minute,
    },
  })
  expect(
    studyInsights(current, distribution, current, bounds).comparison,
  ).toBeUndefined()
  const tied = studyDistribution({
    byModule: {
      lessonsAndReading: 5 * minute,
      games: 5 * minute,
      simulations: 0,
      flashcards: 0,
    },
  })
  expect(studyInsights(current, tied, current).leading).toBeUndefined()
})
