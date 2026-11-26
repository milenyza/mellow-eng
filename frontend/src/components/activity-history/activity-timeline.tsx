import { Link } from 'react-router'
import { describeActivity } from '@/services/activity-description'
import { groupActivityByDay } from '@/services/activity-history'
import { formatAnalyticsDate, shiftStudyDay } from '@/services/study-calendar'
import { formatStudyTime } from '@/services/study-time'
import type { RecordedActivity } from '@/types/activity-history'

function details(event: RecordedActivity) {
  switch (event.kind) {
    case 'game':
      return [
        [
          event.contentId === 'sentence-builder'
            ? 'Frases praticadas'
            : 'Pares encontrados',
          event.completedItems,
        ],
        ['Tentativas registradas', event.attempts],
      ] as const
    case 'simulation':
      return [
        ['Decisões concluídas', event.decisions],
        ['Respostas registradas', event.attempts],
        ['Correções revisadas', event.corrections],
      ] as const
    case 'flashcard':
      return [['Itens distintos revisados', event.vocabulary]] as const
    default:
      return []
  }
}

export function ActivityTimeline({
  entries,
  today,
}: {
  entries: readonly RecordedActivity[]
  today: string
}) {
  const yesterday = shiftStudyDay(today, -1)
  return (
    <div className="space-y-6">
      {groupActivityByDay(entries).map(({ day, entries }) => (
        <section
          key={day}
          aria-labelledby={`activity-day-${day}`}
          className="space-y-2"
        >
          <h2 id={`activity-day-${day}`} className="text-xl font-semibold">
            {day === today ? 'Hoje · ' : day === yesterday ? 'Ontem · ' : null}
            <time dateTime={day}>
              {formatAnalyticsDate(day, { dateStyle: 'long' })}
            </time>
          </h2>
          <ol className="divide-y divide-plum/20 rounded-xl border border-plum/20 px-3 sm:px-4">
            {entries.map((event) => {
              const { title, label, language, destination, context } =
                describeActivity(event)
              const metrics = details(event)
              const duration = event.durationMs ?? 0
              return (
                <li
                  key={event.id}
                  className="min-w-0 space-y-1 py-3 [overflow-wrap:anywhere]"
                >
                  <p className="text-sm">
                    {title
                      ? label
                      : event.kind === 'flashcard'
                        ? 'Revisão com cartões'
                        : 'Registro de conclusão'}
                  </p>
                  <h3
                    className="text-lg font-semibold"
                    lang={title ? language : undefined}
                  >
                    {title ?? label}
                  </h3>
                  {context && (
                    <p className="text-sm">
                      História · <span lang="en">{context}</span>
                    </p>
                  )}
                  {(metrics.length > 0 || duration > 0) && (
                    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {metrics.map(([label, value]) => (
                        <div key={label} className="flex flex-wrap gap-x-1">
                          <dt>{label}</dt>
                          <dd className="font-bold">{value}</dd>
                        </div>
                      ))}
                      {duration > 0 && (
                        <div className="flex flex-wrap gap-x-1">
                          <dt>
                            Tempo ativo estimado
                            {event.kind === 'story'
                              ? ' até a primeira conclusão'
                              : ''}
                          </dt>
                          <dd className="font-bold">
                            {formatStudyTime(duration)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}
                  {destination ? (
                    <Link
                      className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
                      to={destination.to}
                    >
                      {destination.label}
                      {title && (
                        <span className="sr-only" lang={language}>
                          {' '}
                          · {title}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <p className="text-sm">
                      Conteúdo indisponível no catálogo atual.
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
