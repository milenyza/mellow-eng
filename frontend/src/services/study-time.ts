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

export function localStudyDay(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-')
}

export function addDailyTime(
  previous: LearnerProgress['dailyStudyMs'],
  start: number,
  end: number,
) {
  const dailyStudyMs = { ...previous }
  let cursor = start
  while (cursor < end) {
    const date = new Date(cursor)
    const key = localStudyDay(date)
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
    return (dailyStudyMs[localStudyDay(date)] ?? 0) > 0
  })
}

export function isStudyDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function recordedSessions<T extends { sessionId: string }>(
  records?: Readonly<Record<string, T | undefined>>,
) {
  return Object.entries(records ?? {}).flatMap(([id, session]) =>
    session?.sessionId === id ? [session] : [],
  )
}

export function getDailyStudySources(data: LearnerProgress) {
  return {
    lessonsAndReading: addStudyDays([data.dailyStudyMs]),
    games: addStudyDays(
      recordedSessions(data.gameSessions).map(
        ({ dailyPracticeMs }) => dailyPracticeMs,
      ),
    ),
    simulations: addStudyDays(
      recordedSessions(data.simulationSessions).map(
        ({ dailyPracticeMs }) => dailyPracticeMs,
      ),
    ),
    flashcards: addStudyDays(
      recordedSessions(data.flashcardSessions).map(
        ({ dailyPracticeMs }) => dailyPracticeMs,
      ),
    ),
  }
}

function addStudyDays(sources: readonly LearnerProgress['dailyStudyMs'][]) {
  const days: Record<string, number> = {}
  for (const source of sources) {
    for (const [day, duration] of Object.entries(source)) {
      if (
        isStudyDay(day) &&
        typeof duration === 'number' &&
        Number.isFinite(duration) &&
        duration > 0
      )
        days[day] = (days[day] ?? 0) + duration
    }
  }
  return days
}

export function getSharedStudySplit(data: LearnerProgress, readingMs: number) {
  const shared = Object.values(addStudyDays([data.dailyStudyMs])).reduce(
    (sum, duration) => sum + duration,
    0,
  )
  const minimumLessons = Object.values(data.lessons).reduce((sum, lesson) => {
    if (!lesson) return sum
    const original = lesson.completion?.run
    return (
      sum +
      lesson.run.activeMs +
      (original && original.id !== lesson.run.id ? original.activeMs : 0)
    )
  }, 0)
  const lessonsMs = shared - readingMs
  return lessonsMs >= minimumLessons ? { lessonsMs, readingMs } : undefined
}

export function combinedDailyStudyMs(data: LearnerProgress) {
  return addStudyDays(Object.values(getDailyStudySources(data)))
}

export function totalStudyMs(data: LearnerProgress) {
  return Object.values(combinedDailyStudyMs(data)).reduce<number>(
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
