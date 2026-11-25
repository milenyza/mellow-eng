import { Check } from 'lucide-react'
import { cn } from '@/components/utils'
import type { Weekday } from '@/types/dashboard'

const weekdays = [
  { day: 1, short: 'Seg', label: 'Segunda-feira' },
  { day: 2, short: 'Ter', label: 'Terça-feira' },
  { day: 3, short: 'Qua', label: 'Quarta-feira' },
  { day: 4, short: 'Qui', label: 'Quinta-feira' },
  { day: 5, short: 'Sex', label: 'Sexta-feira' },
  { day: 6, short: 'Sáb', label: 'Sábado' },
  { day: 0, short: 'Dom', label: 'Domingo' },
] as const

export function WeeklyProgress({
  studiedDays,
  today,
}: {
  studiedDays: readonly Weekday[]
  today: number
}) {
  const todayIndex = weekdays.findIndex(({ day }) => day === today)
  const week = weekdays.map((day, index) => ({
    ...day,
    studied: index <= todayIndex && studiedDays.includes(day.day),
  }))
  const count = week.filter(({ studied }) => studied).length

  return (
    <section
      aria-labelledby="progresso-semanal"
      className="flex flex-col rounded-xl bg-sage p-5 sm:p-7 xl:p-8"
    >
      <h2 id="progresso-semanal" className="text-lg font-semibold">
        Progresso semanal
      </h2>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-lg">
        <strong className="font-heading text-5xl leading-none font-semibold tabular-nums">
          {count}
        </strong>{' '}
        {count === 1 ? 'dia de estudo' : 'dias de estudo'}
      </p>
      <ol className="mt-5 grid grid-cols-7 gap-1 py-2 text-center lg:my-auto lg:py-5">
        {week.map(({ day, short, label, studied }) => (
          <li
            key={day}
            aria-current={day === today ? 'date' : undefined}
            className="flex min-w-0 flex-col items-center gap-2"
          >
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full border border-plum/35',
                studied && 'border-plum bg-plum text-cream',
                day === today && 'outline-1 outline-offset-2 outline-plum',
              )}
            >
              {studied && <Check aria-hidden="true" className="size-4" />}
            </span>
            <span aria-hidden="true" className="text-xs font-bold sm:text-sm">
              {short}
            </span>
            <span className="sr-only">
              {label}
              {day === today ? ', hoje' : ''}
              {studied ? ', estudado' : ''}
            </span>
          </li>
        ))}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-plum/20 pt-3 text-sm font-semibold">
        <li className="flex items-center gap-2">
          <Check
            aria-hidden="true"
            className="size-4 rounded-full bg-plum p-0.5 text-cream"
          />
          Dia estudado
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3.5 rounded-full border border-plum outline-1 outline-offset-2 outline-plum"
          />
          Hoje
        </li>
      </ul>
    </section>
  )
}
