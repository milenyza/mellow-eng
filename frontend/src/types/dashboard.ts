import type { LessonStatus } from '@/types/curriculum'

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface NextLessonData {
  id: string
  title: string
  description: string
  unit: string
  durationMinutes: number
  status: LessonStatus
}

export interface DailyWordData {
  id: string
  word: string
  pronunciation: string
  translation: string
  example: string
  exampleTranslation: string
}

export interface LearningTotals {
  completedLessons: number
  studyMs: number
  reading: { stories: number; chapters: number; activeMs: number }
}
