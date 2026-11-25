import { BookOpenCheck, Clock } from 'lucide-react'
import { formatStudyTime } from '@/services/study-time'
import type { LearningTotals } from '@/types/dashboard'

export function LearningSummary({ totals }: { totals: LearningTotals }) {
  const metrics = [
    {
      label: 'Aulas concluídas',
      value: totals.completedLessons,
      icon: BookOpenCheck,
    },
    {
      label: 'Tempo de estudo ativo',
      value: formatStudyTime(totals.studyMs),
      icon: Clock,
    },
  ]

  return (
    <section
      aria-labelledby="resumo-aprendizado"
      className="border-t border-plum/20 pt-5"
    >
      <h2
        id="resumo-aprendizado"
        className="font-heading text-2xl font-semibold"
      >
        Resumo do aprendizado
      </h2>
      <dl className="mt-4 grid divide-y divide-plum/20 rounded-xl bg-lavender/45 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-0">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col gap-2 py-4 sm:px-4 lg:px-6"
          >
            <dt className="flex items-center gap-2 text-sm font-bold">
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </dt>
            <dd className="order-first flex flex-wrap items-baseline gap-x-1.5 font-heading text-4xl leading-none font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
