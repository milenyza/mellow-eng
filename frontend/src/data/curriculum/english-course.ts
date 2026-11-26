import { englishCourseId } from '@/services/lesson-vocabulary-reference'
import { englishTargetLanguage } from '@/data/curriculum/english-a1-index'
import { englishA1 } from '@/data/curriculum/english-a1'
import type { Course } from '@/types/curriculum'

export const englishCourse = {
  id: englishCourseId,
  targetLanguage: englishTargetLanguage,
  interfaceLanguage: 'pt-BR',
  levels: [
    englishA1,
    ...(['A2', 'B1', 'B2', 'C1', 'C2'] as const).map((code) => ({
      code,
      units: [],
    })),
  ],
} satisfies Course
