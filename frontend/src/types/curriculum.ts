import type { LessonBlock } from '@/types/lesson-content'

export type CefrCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type LessonAvailability = 'planned' | 'available'
export type LessonStatus = LessonAvailability | 'in-progress' | 'completed'

export interface Course {
  id: string
  targetLanguage: string
  interfaceLanguage: string
  levels: readonly CefrLevel[]
}

export interface CefrLevel {
  code: CefrCode
  units: readonly CurriculumUnit[]
}

export interface CurriculumUnit {
  id: string
  title: string
  focus: string
  lessons: readonly LessonOutline[]
}

export type CefrLevelIndex = Omit<CefrLevel, 'units'> & {
  units: readonly CurriculumUnitIndex[]
}

export type CurriculumUnitIndex = Omit<CurriculumUnit, 'lessons'> & {
  lessons: readonly LessonMetadata[]
}

interface LessonBase {
  id: string
  title: string
  description: string
  objectives: readonly string[]
  durationMinutes: number
  focus: string
  activities: readonly LearningActivity[]
}

export type LessonMetadata = LessonBase & { availability: LessonAvailability }

export type AvailableLesson = LessonBase & {
  availability: 'available'
  blocks: readonly [LessonBlock, ...LessonBlock[]]
}

export type LessonOutline =
  AvailableLesson | (LessonBase & { availability: 'planned'; blocks?: never })

export interface LearningActivity {
  id: string
  kind: 'reading' | 'listening' | 'speaking' | 'writing' | 'review'
  title: string
}
