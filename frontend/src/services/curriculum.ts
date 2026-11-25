import { lessonProgressStatus } from '@/services/lesson-progress'
import type { LearnerProgress, LessonProgress } from '@/types/progress'
import type {
  AvailableLesson,
  CefrLevel,
  Course,
  LessonOutline,
  LessonStatus,
} from '@/types/curriculum'

export function getLessonStatus(
  lesson: LessonOutline,
  progress?: LessonProgress,
): LessonStatus {
  if (lesson.availability === 'planned') return 'planned'
  const status = lessonProgressStatus(progress)
  return status === 'not-started' ? 'available' : status
}

export function getCurriculumOverview(
  level: CefrLevel,
  progress: LearnerProgress,
) {
  const lessons = level.units.flatMap((unit, unitIndex) =>
    unit.lessons.map((lesson) => ({
      unit,
      unitNumber: unitIndex + 1,
      lesson,
      status: getLessonStatus(lesson, progress.lessons[lesson.id]),
    })),
  )
  const completedCount = lessons.filter(
    ({ status }) => status === 'completed',
  ).length
  return {
    completedCount,
    totalCount: lessons.length,
    recommended:
      lessons.find(({ status }) => status === 'in-progress') ??
      lessons.find(({ status }) => status === 'available'),
  }
}

export function getNextPublishedLesson(course: Course, lessonId: string) {
  const lessons = course.levels.flatMap(({ units }) =>
    units.flatMap(({ lessons }) => lessons),
  )
  const after = lessons.findIndex(({ id }) => id === lessonId)
  if (after < 0) return undefined
  return lessons
    .slice(after + 1)
    .find(
      (lesson): lesson is AvailableLesson =>
        lesson.availability === 'available',
    )
}

export function findCourseLesson(course: Course, lessonId: string) {
  for (const level of course.levels) {
    for (const [unitIndex, unit] of level.units.entries()) {
      const lessonIndex = unit.lessons.findIndex(({ id }) => id === lessonId)
      if (lessonIndex !== -1) {
        return {
          lesson: unit.lessons[lessonIndex],
          level: level.code,
          unitNumber: unitIndex + 1,
          lessonNumber: lessonIndex + 1,
        }
      }
    }
  }
}
