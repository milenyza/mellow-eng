import { expect, it } from 'vitest'
import { startStudyRun, updateLessonRecord } from '@/services/lesson-progress'
import { emptyProgress } from '@/services/progress-format'
import {
  createStudyClock,
  getWeeklyStudyDays,
  recordStudyInterval,
  totalStudyMs,
} from '@/services/study-time'

it('tracks foreground time once, pauses while hidden and stops at the inactivity deadline', () => {
  const intervals: number[][] = []
  const clock = createStudyClock((start, end) => intervals.push([start, end]))
  clock.resume(1000)
  clock.resume(1200)
  clock.flush(4000)
  clock.pause(5000)
  clock.flush(8000)
  clock.interact(9000)
  clock.resume(10_000)
  clock.flush(90_000)
  clock.interact(95_000)
  clock.flush(98_000)
  clock.pause(98_000)
  expect(intervals).toEqual([
    [1000, 4000],
    [4000, 5000],
    [10_000, 70_000],
    [95_000, 98_000],
  ])
})

it('renews the inactivity window on actual interactions and ignores repeated flushes', () => {
  const intervals: number[][] = []
  const clock = createStudyClock((start, end) => intervals.push([start, end]))
  clock.resume(1000)
  clock.interact(50_000)
  clock.flush(120_000)
  clock.flush(120_000)
  expect(intervals).toEqual([[1000, 110_000]])
})

it('splits intervals at local midnight and selects only positive study days in the current week', () => {
  const sunday = new Date(2026, 10, 22, 23, 59, 59, 500)
  const tuesday = new Date(2026, 10, 24, 10)
  const run = startStudyRun('first', sunday.getTime())
  const initial = updateLessonRecord(emptyProgress(), 'lesson', () => ({ run }))
  const overMidnight = recordStudyInterval(
    initial,
    'lesson',
    run.id,
    sunday.getTime(),
    sunday.getTime() + 2000,
  )
  const studied = recordStudyInterval(
    overMidnight,
    'lesson',
    run.id,
    tuesday.getTime(),
    tuesday.getTime() + 3000,
  )
  expect(studied.dailyStudyMs).toEqual({
    '2026-11-22': 500,
    '2026-11-23': 1500,
    '2026-11-24': 3000,
  })
  expect(studied.lessons.lesson?.run.activeMs).toBe(5000)
  expect(totalStudyMs(studied)).toBe(5000)
  expect(getWeeklyStudyDays(studied.dailyStudyMs, tuesday)).toEqual([1, 2])
  expect(getWeeklyStudyDays(studied.dailyStudyMs, sunday)).toEqual([0])
  expect(
    recordStudyInterval(
      studied,
      'lesson',
      'stale-run',
      tuesday.getTime(),
      tuesday.getTime() + 200,
    ),
  ).toBe(studied)
})
