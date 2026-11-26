import { isStudyDay } from '@/services/study-time'
import type { RecordedActivity } from '@/types/activity-history'
import type {
  DailyLearningActivity,
  StudyDateRange,
  StudyCalendarDay,
  StudyChart,
  StudyPeriod,
  ClosedStudyRange,
  StudyIntensity,
} from '@/types/learning-analytics'

const dayMs = 86_400_000
const dateKey = (date: Date) => date.toISOString().slice(0, 10)
const utcDay = (day: string) => new Date(day + 'T00:00:00Z')

export function shiftStudyDay(day: string, count: number) {
  const date = utcDay(day)
  date.setUTCDate(date.getUTCDate() + count)
  return dateKey(date)
}

function monday(day: string) {
  return shiftStudyDay(day, -((utcDay(day).getUTCDay() + 6) % 7))
}

export function shiftStudyMonth(day: string, count: number) {
  const date = utcDay(day.slice(0, 7) + '-01')
  date.setUTCMonth(date.getUTCMonth() + count)
  return dateKey(date)
}

export function validStudyRange({ from, to }: StudyDateRange) {
  return (
    (!from || isStudyDay(from)) &&
    (!to || isStudyDay(to)) &&
    (!from || !to || from <= to)
  )
}

export function validCustomStudyRange(
  { from, to }: StudyDateRange,
  today: string,
) {
  return (
    Boolean(from || to) &&
    validStudyRange({ from, to }) &&
    (!from || from <= today) &&
    (!to || to <= today)
  )
}

export function resolveStudyPeriod(
  preset: StudyPeriod,
  today: string,
  custom: StudyDateRange = {},
): StudyDateRange {
  switch (preset) {
    case 'week':
      return { from: monday(today), to: today }
    case 'seven':
      return { from: shiftStudyDay(today, -6), to: today }
    case 'thirty':
      return { from: shiftStudyDay(today, -29), to: today }
    case 'month':
      return { from: shiftStudyMonth(today, 0), to: today }
    case 'custom':
      return custom
    case 'all':
      return {}
  }
}

export function getStudyBounds(
  range: StudyDateRange,
  daily: readonly DailyLearningActivity[],
  today: string,
): ClosedStudyRange | undefined {
  const from = range.from ?? daily[0]?.day
  const to = range.to ?? (range.from ? today : daily.at(-1)?.day)
  const end = to && to < today ? to : today
  return from && from <= end ? { from, to: end } : undefined
}

function rangeLength({ from, to }: ClosedStudyRange) {
  return (utcDay(to).getTime() - utcDay(from).getTime()) / dayMs + 1
}

export function previousStudyPeriod(range: ClosedStudyRange) {
  const to = shiftStudyDay(range.from, -1)
  const from = shiftStudyDay(range.from, -rangeLength(range))
  return isStudyDay(from) && isStudyDay(to) ? { from, to } : undefined
}

export function aggregateStudyActivity(
  daily: readonly DailyLearningActivity[],
  bounds?: ClosedStudyRange,
): StudyChart {
  const days = bounds ? rangeLength(bounds) : 0
  const interval = days <= 14 ? 'day' : days <= 90 ? 'week' : 'month'
  const sparse = days > 730
  const points = new Map<string, { from: string; to: string; ms: number }>()
  if (!bounds) return { interval, points: [], sparse }

  const { from, to } = bounds

  function bucket(day: string) {
    const start =
      interval === 'month'
        ? shiftStudyMonth(day, 0)
        : interval === 'week'
          ? monday(day)
          : day
    const next =
      interval === 'month'
        ? shiftStudyMonth(start, 1)
        : shiftStudyDay(start, interval === 'week' ? 7 : 1)
    const end = shiftStudyDay(next, -1)
    return {
      from: start < from ? from : start,
      to: end > to ? to : end,
      ms: 0,
    }
  }

  if (!sparse) {
    for (let day = bounds.from; day <= bounds.to;) {
      const point = bucket(day)
      points.set(point.from, point)
      day = shiftStudyDay(point.to, 1)
    }
  }
  for (const day of daily) {
    if (day.day < bounds.from || day.day > bounds.to || day.totalMs <= 0)
      continue
    const period = bucket(day.day)
    const point = points.get(period.from) ?? period
    point.ms += day.totalMs
    points.set(point.from, point)
  }
  return {
    interval,
    points: [...points.values()].sort((a, b) => a.from.localeCompare(b.from)),
    sparse,
  }
}

export function studyIntensity(ms: number): StudyIntensity {
  if (ms <= 0) return 'none'
  if (ms < 5 * 60_000) return 'light'
  if (ms < 15 * 60_000) return 'medium'
  return 'high'
}

export function buildStudyCalendar(
  month: string,
  today: string,
  daily: readonly DailyLearningActivity[],
  milestones: readonly RecordedActivity[],
) {
  const start = shiftStudyMonth(month, 0)
  const end = shiftStudyMonth(start, 1)
  const time = new Map(daily.map(({ day, totalMs }) => [day, totalMs]))
  const byDay = new Map<string, RecordedActivity[]>()
  for (const event of milestones) {
    const { day } = event
    if (day < start || day >= end || day > today) continue
    const events = byDay.get(day) ?? []
    events.push(event)
    byDay.set(day, events)
  }
  const weeks: (StudyCalendarDay | null)[][] = []
  for (
    let first = monday(start);
    first < end;
    first = shiftStudyDay(first, 7)
  ) {
    weeks.push(
      Array.from({ length: 7 }, (_, offset) => {
        const day = shiftStudyDay(first, offset)
        if (day < start || day >= end) return null
        const future = day > today
        const ms = future ? 0 : (time.get(day) ?? 0)
        return {
          day,
          ms,
          future,
          intensity: studyIntensity(ms),
          events: byDay.get(day) ?? [],
        }
      }),
    )
  }
  return weeks
}

export const formatAnalyticsDate = (
  day: string,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(
    utcDay(day),
  )

export function describeStudyDates(from: string, to: string) {
  const format = (day: string) =>
    formatAnalyticsDate(day, { dateStyle: 'medium' })
  return from === to ? format(from) : `${format(from)} a ${format(to)}`
}
