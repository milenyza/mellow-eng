import type { RecordedActivity } from '@/types/activity-history'

export interface StudyDateRange {
  from?: string
  to?: string
}

export type TimedModule =
  'lessonsAndReading' | 'games' | 'simulations' | 'flashcards'

export interface DailyLearningActivity {
  day: string
  totalMs: number
  byModule: Record<TimedModule, number>
}

export interface CurriculumCounts {
  completed: number
  inProgress: number
  ready: number
  published: number
  planned: number
  total: number
}

export type StudyPeriod =
  'all' | 'week' | 'seven' | 'thirty' | 'month' | 'custom'

export type ClosedStudyRange = Required<StudyDateRange>

export type StudyIntensity = 'none' | 'light' | 'medium' | 'high'

export interface StudyCalendarDay {
  day: string
  ms: number
  future: boolean
  intensity: StudyIntensity
  events: RecordedActivity[]
}

export interface StudyChart {
  interval: 'day' | 'week' | 'month'
  points: (ClosedStudyRange & { ms: number })[]
  sparse: boolean
}
