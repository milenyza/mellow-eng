export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface DashboardData {
  learner: { firstName: string }
  nextLesson: NextLessonData
  studiedWeekdays: readonly Weekday[]
  dailyWord: DailyWordData
  summary: LearningTotals
}

export interface NextLessonData {
  title: string
  description: string
  unit: string
  durationMinutes: number
  progressPercent?: number
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
  learnedWords: number
  studyMinutes: number
}
