import type { DashboardData } from '@/types/dashboard'

export const dashboardData: DashboardData = {
  learner: { firstName: 'Ana' },
  nextLesson: {
    title: 'A coffee, please!',
    description:
      'Aprenda a pedir um café, escolher o tamanho da bebida e agradecer em inglês.',
    unit: 'Unidade 2 · Na cafeteria',
    durationMinutes: 15,
    progressPercent: 40,
  },
  studiedWeekdays: [1, 2, 4],
  dailyWord: {
    id: 'en-a-little',
    word: 'a little',
    pronunciation: '/ə ˈlɪt̬.əl/',
    translation: 'um pouco',
    example: 'A little milk, please.',
    exampleTranslation: 'Um pouco de leite, por favor.',
  },
  summary: {
    completedLessons: 4,
    learnedWords: 18,
    studyMinutes: 65,
  },
}
