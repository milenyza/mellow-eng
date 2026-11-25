import type { ExerciseAttempt } from '@/types/exercise'

export type LearnerLessonStatus = 'not-started' | 'in-progress' | 'completed'

export interface SavedActivitySession {
  activityId: string
  attempts: Readonly<Record<string, ExerciseAttempt | undefined>>
  finished: boolean
  textActivityIds: readonly string[]
  heardActivityIds: readonly string[]
}

export interface StudyRun {
  id: string
  startedAt: number
  finishedAt?: number
  blockId: string
  visitedBlockIds: readonly string[]
  activities: Readonly<Record<string, SavedActivitySession | undefined>>
  activeMs: number
}

export interface LessonProgress {
  run: StudyRun
  completion?: { completedAt: number; run: StudyRun }
}

export interface LearnerProgress {
  lessons: Readonly<Record<string, LessonProgress | undefined>>
  dailyStudyMs: Readonly<Record<string, number | undefined>>
}
