import type { RecordedActivity } from '@/types/activity-history'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { MilestoneList } from '@/components/learning-progress/progress-milestones'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/utils'
import {
  buildStudyCalendar,
  formatAnalyticsDate,
  shiftStudyDay,
  shiftStudyMonth,
} from '@/services/study-calendar'
import { formatStudyTime } from '@/services/study-time'
import type { DailyLearningActivity } from '@/types/learning-analytics'

const weekdays = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
]
const intensityClasses = {
  none: 'bg-cream',
  light: 'bg-lavender',
  medium: 'bg-sage',
  high: 'bg-plum text-cream',
}

const activityLevels = [
  ['none', 'Sem tempo registrado'],
  ['light', 'Menos de 5 min'],
  ['medium', '5 a menos de 15 min'],
  ['high', '15 min ou mais'],
] as const

const fullDate = (day: string) =>
  formatAnalyticsDate(day, { dateStyle: 'full' })

export function StudyCalendar({
  today,
  daily,
  milestones,
  undatedChapters,
}: {
  today: string
  daily: readonly DailyLearningActivity[]
  milestones: readonly RecordedActivity[]
  undatedChapters: number
}) {
  const labelId = useId()
  const detailsId = useId()
  const dayId = useId()
  const currentMonth = shiftStudyMonth(today, 0)
  const [month, setMonth] = useState(currentMonth)
  const [selection, setSelection] = useState(today)
  const weeks = buildStudyCalendar(month, today, daily, milestones)
  const selected = weeks.flat().find((day) => day?.day === selection)
  const monthLabel = formatAnalyticsDate(month, {
    month: 'long',
    year: 'numeric',
  })
  function browse(next: string) {
    setMonth(next)
    setSelection(next === currentMonth ? today : next)
  }

  return (
    <section
      aria-labelledby="study-calendar-title"
      className="min-w-0 space-y-3 border-t border-plum/20 pt-5"
    >
      <h2 id="study-calendar-title" className="text-2xl font-semibold">
        Calendário de estudo
      </h2>
      <p className="text-sm">
        Consulte qualquer dia do histórico, independentemente do filtro acima.
        As datas seguem o calendário local.
      </p>
      <div className="space-y-3 rounded-xl border border-plum/20 p-2 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Button
              variant="secondary"
              className="size-11 shrink-0 px-0"
              aria-label="Mês anterior"
              disabled={month <= '0001-01-01'}
              onClick={() => browse(shiftStudyMonth(month, -1))}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Button>
            <p
              id={labelId}
              role="status"
              className="text-center font-heading font-bold"
            >
              {monthLabel}
            </p>
            <Button
              variant="secondary"
              className="size-11 shrink-0 px-0"
              aria-label="Próximo mês"
              aria-disabled={month >= currentMonth}
              onClick={() => {
                if (month < currentMonth) browse(shiftStudyMonth(month, 1))
              }}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </Button>
          </div>
          <Button variant="secondary" onClick={() => browse(currentMonth)}>
            Mês atual
          </Button>
        </div>
        <table
          aria-labelledby={labelId}
          className="w-full table-fixed border-separate border-spacing-y-1 text-center"
        >
          <thead>
            <tr>
              {weekdays.map((day) => (
                <th
                  key={day}
                  scope="col"
                  aria-label={day}
                  className="text-xs font-bold capitalize"
                >
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.find(Boolean)?.day}>
                {week.map((date, index) => (
                  <td key={weekdays[index]} className="px-px align-middle">
                    {date &&
                      (date.future ? (
                        <span className="grid min-h-11 place-items-center rounded-sm border border-dashed border-plum/35 text-sm">
                          <span aria-hidden="true">
                            {Number(date.day.slice(-2))}
                          </span>
                          <span className="sr-only">
                            {fullDate(date.day)} · Data futura
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={dayId + date.day}
                          aria-current={date.day === today ? 'date' : undefined}
                          aria-label={`${fullDate(date.day)} · ${date.ms ? formatStudyTime(date.ms) : 'Sem tempo registrado'}`}
                          aria-pressed={date.day === selection}
                          aria-controls={detailsId}
                          tabIndex={date.day === selection ? 0 : -1}
                          className={cn(
                            'min-h-11 w-full rounded-sm border border-plum/25 text-sm font-bold aria-pressed:underline aria-pressed:decoration-2 aria-pressed:underline-offset-4',
                            intensityClasses[date.intensity],
                          )}
                          onClick={() => setSelection(date.day)}
                          onKeyDown={(event) => {
                            const steps = {
                              ArrowLeft: -1,
                              ArrowRight: 1,
                              ArrowUp: -7,
                              ArrowDown: 7,
                            }
                            const step = steps[event.key as keyof typeof steps]
                            if (!step) return
                            event.preventDefault()
                            const target = shiftStudyDay(date.day, step)
                            const button = document.getElementById(
                              dayId + target,
                            )
                            if (button) {
                              setSelection(target)
                              button.focus()
                            }
                          }}
                        >
                          {Number(date.day.slice(-2))}
                        </button>
                      ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs">
          Use as setas do teclado para explorar os dias do mês. Datas futuras
          têm borda tracejada.
        </p>
        <ul
          aria-label="Legenda de intensidade"
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
        >
          {activityLevels.map(([intensity, label]) => (
            <li key={intensity} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'size-3.5 rounded-sm border border-plum/35',
                  intensityClasses[intensity],
                )}
              />
              {label}
            </li>
          ))}
        </ul>
        <div id={detailsId} className="space-y-2 border-t border-plum/20 pt-3">
          {selected && (
            <>
              <p role="status" className="font-bold">
                {fullDate(selected.day)} ·{' '}
                {selected.ms
                  ? formatStudyTime(selected.ms) + ' de estudo ativo estimado'
                  : 'Sem tempo registrado'}
              </p>
              {selected.events.length ? (
                <MilestoneList events={selected.events} />
              ) : (
                <p className="text-sm">
                  Nenhuma conclusão ou sessão com data registrada neste dia.
                </p>
              )}
            </>
          )}
          {undatedChapters > 0 && (
            <p className="text-sm">
              Há capítulos lidos sem data no histórico. Eles aparecem apenas nos
              totais acumulados.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
