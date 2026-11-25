import { updateStoryProgress } from '@/services/reading-progress'
import type { Weekday } from '@/types/dashboard'
import type { LearnerProgress } from '@/types/progress'

export const studyIdleMs = 60_000

export function createStudyClock(report: (start: number, end: number) => void) {
  let checkpoint: number | undefined
  let deadline = 0

  function flush(now: number) {
    if (checkpoint === undefined) return
    const start = checkpoint
    const end = Math.min(now, deadline)
    checkpoint = Math.max(now, start)
    if (end > start) report(start, end)
  }

  return {
    resume(now: number) {
      if (checkpoint !== undefined) return
      checkpoint = now
      deadline = now + studyIdleMs
    },
    interact(now: number) {
      if (checkpoint === undefined) return
      if (now > deadline) flush(now)
      deadline = now + studyIdleMs
    },
    flush,
    pause(now: number) {
      flush(now)
      checkpoint = undefined
    },
  }
}

function dayKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-')
}

function addDailyTime(
  previous: LearnerProgress['dailyStudyMs'],
  start: number,
  end: number,
) {
  const dailyStudyMs = { ...previous }
  let cursor = start
  while (cursor < end) {
    const date = new Date(cursor)
    const key = dayKey(date)
    const midnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    ).getTime()
    const boundary = Math.min(end, midnight)
    dailyStudyMs[key] = (dailyStudyMs[key] ?? 0) + boundary - cursor
    cursor = boundary
  }

  return dailyStudyMs
}

export function recordReadingInterval(
  data: LearnerProgress,
  storyId: string,
  runId: string,
  start: number,
  end: number,
) {
  if (end <= start) return data
  const updated = updateStoryProgress(data, storyId, (record) => {
    if (!record || record.run.id !== runId) return record
    const elapsed = end - start
    return {
      ...record,
      activeMs: record.activeMs + elapsed,
      run: { ...record.run, activeMs: record.run.activeMs + elapsed },
    }
  })
  return updated === data
    ? data
    : { ...updated, dailyStudyMs: addDailyTime(data.dailyStudyMs, start, end) }
}

export function recordStudyInterval(
  data: LearnerProgress,
  lessonId: string,
  runId: string,
  start: number,
  end: number,
): LearnerProgress {
  const record = data.lessons[lessonId]
  if (
    !record ||
    record.run.id !== runId ||
    record.run.finishedAt !== undefined ||
    end <= start
  )
    return data

  return {
    ...data,
    dailyStudyMs: addDailyTime(data.dailyStudyMs, start, end),
    lessons: {
      ...data.lessons,
      [lessonId]: {
        ...record,
        run: { ...record.run, activeMs: record.run.activeMs + end - start },
      },
    },
  }
}

export function getWeeklyStudyDays(
  dailyStudyMs: LearnerProgress['dailyStudyMs'],
  now: Date,
): Weekday[] {
  const days: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0]
  const todayIndex = (now.getDay() + 6) % 7
  return days.slice(0, todayIndex + 1).filter((_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - todayIndex + index,
    )
    return (dailyStudyMs[dayKey(date)] ?? 0) > 0
  })
}

export function totalStudyMs(data: LearnerProgress) {
  return Object.values(data.dailyStudyMs).reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  )
}

export function formatStudyTime(milliseconds: number) {
  if (milliseconds > 0 && milliseconds < 1000) return 'Menos de 1 s'
  const seconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60) % 60
  const parts = [
    ...(hours ? [`${hours} h`] : []),
    ...(minutes ? [`${minutes} min`] : []),
  ]
  if (seconds % 60 || !parts.length) parts.push(`${seconds % 60} s`)
  return parts.join(' ')
}
