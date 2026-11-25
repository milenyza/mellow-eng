import type { ExerciseAttempt, PracticeSession } from '@/types/exercise'

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
  reading?: ReadingProgress
  lessons: Readonly<Record<string, LessonProgress | undefined>>
  dailyStudyMs: Readonly<Record<string, number | undefined>>
}

export type ReadingStatus = 'not-started' | 'in-progress' | 'completed'

export interface ReadingPreferences {
  fontSize: 'normal' | 'large' | 'extra-large'
  translations: boolean
}

export interface ReadingChapterProgress {
  paragraphId?: string
  readAt?: number
  practice?: PracticeSession
}

export interface ReadingRun {
  id: string
  startedAt: number
  chapterId: string
  chapters: Readonly<Record<string, ReadingChapterProgress | undefined>>
  activeMs: number
}

export interface StoryProgress {
  run: ReadingRun
  readChapterIds: readonly string[]
  activeMs: number
  completion?: { completedAt: number; run: ReadingRun }
}

export interface ReadingProgress {
  preferences: ReadingPreferences
  stories: Readonly<Record<string, StoryProgress | undefined>>
}
