import { previousStudyPeriod } from '@/services/study-calendar'
import type {
  ClosedStudyRange,
  DailyLearningActivity,
  TimedModule,
} from '@/types/learning-analytics'

export const studyCategoryLabels = {
  lessons: 'Aulas',
  reading: 'Leitura de histórias',
  lessonsAndReading: 'Aulas e leitura',
  games: 'Jogos',
  simulations: 'Simulações de inglês na prática',
  flashcards: 'Revisão com cartões',
}

type StudyCategory = keyof typeof studyCategoryLabels
type CategoryDuration = readonly [StudyCategory, number]

export function studyDistribution({
  byModule,
  lessonsMs,
  readingMs,
}: {
  byModule: Record<TimedModule, number>
  lessonsMs?: number
  readingMs?: number
}) {
  const amounts: CategoryDuration[] = [
    ...(lessonsMs === undefined ||
    readingMs === undefined ||
    lessonsMs + readingMs !== byModule.lessonsAndReading
      ? [['lessonsAndReading', byModule.lessonsAndReading] as const]
      : [['lessons', lessonsMs] as const, ['reading', readingMs] as const]),
    ['games', byModule.games],
    ['simulations', byModule.simulations],
    ['flashcards', byModule.flashcards],
  ]
  const total = amounts.reduce((sum, [, ms]) => sum + ms, 0)
  const categories = amounts.map(([category, ms], index) => {
    const share = total ? (ms / total) * 100 : 0
    return { category, ms, share, index, percent: Math.floor(share) }
  })
  if (total) {
    const points =
      100 - categories.reduce((sum, entry) => sum + entry.percent, 0)
    const ordered = [...categories].sort(
      (a, b) =>
        b.share - b.percent - (a.share - a.percent) || a.index - b.index,
    )
    for (const entry of ordered.slice(0, points)) entry.percent++
  }
  return { total, categories }
}

export function studyInsights(
  daily: readonly DailyLearningActivity[],
  distribution: ReturnType<typeof studyDistribution>,
  history: readonly DailyLearningActivity[],
  bounds?: ClosedStudyRange,
) {
  const { total, categories } = distribution
  const activeDays = daily.filter(({ totalMs }) => totalMs > 0).length
  const highest = Math.max(...categories.map(({ ms }) => ms))
  const leading = categories.filter(({ ms }) => ms > 0 && ms === highest)
  const previous = bounds && previousStudyPeriod(bounds)
  const previousMs = previous
    ? history.reduce(
        (sum, { day, totalMs }) =>
          day >= previous.from && day <= previous.to ? sum + totalMs : sum,
        0,
      )
    : 0
  return {
    averageMs: activeDays ? total / activeDays : 0,
    leading:
      leading.length === 1
        ? studyCategoryLabels[leading[0].category]
        : undefined,
    comparison:
      previous && previousMs > 0 && total > 0
        ? { ...previous, previousMs }
        : undefined,
  }
}
