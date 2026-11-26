import type { StudyPeriod } from '@/types/learning-analytics'

export const studyPeriods = {
  all: 'Toda a atividade registrada',
  week: 'Semana atual',
  seven: 'Últimos 7 dias',
  thirty: 'Últimos 30 dias',
  month: 'Mês atual',
  custom: 'Período personalizado',
} satisfies Record<StudyPeriod, string>
