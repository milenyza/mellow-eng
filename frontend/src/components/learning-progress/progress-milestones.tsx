import { Link } from 'react-router'
import { SessionDate } from '@/components/ui/session-date'
import { activityHistoryPath } from '@/data/navigation'
import { describeActivity } from '@/services/activity-description'
import type { RecordedActivity } from '@/types/activity-history'

const linkClass =
  'inline-flex min-h-11 max-w-full flex-wrap items-center gap-x-1 rounded-sm font-bold underline underline-offset-4'

export function ProgressMilestones({
  events,
}: {
  events: readonly RecordedActivity[]
}) {
  return (
    <section
      aria-labelledby="progress-recent"
      className="space-y-2 border-t border-plum/20 pt-4"
    >
      <h3 id="progress-recent" className="text-2xl font-semibold">
        Atividade recente
      </h3>
      {events.length ? (
        <MilestoneList events={events.slice(0, 5)} showTime />
      ) : (
        <p className="text-sm">
          As conclusões e sessões com data registrada no período aparecerão
          aqui.
        </p>
      )}
      <Link className={linkClass} to={activityHistoryPath}>
        Ver histórico de atividades
      </Link>
    </section>
  )
}

export function MilestoneList({
  events,
  showTime = false,
}: {
  events: readonly RecordedActivity[]
  showTime?: boolean
}) {
  return (
    <ul className="divide-y divide-plum/20">
      {events.map((event) => {
        const { label, title, language, destination } = describeActivity(event)
        const caption = (
          <>
            {label}
            {title && (
              <>
                {' '}
                · <span lang={language}>{title}</span>
              </>
            )}
          </>
        )
        return (
          <li
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-x-3 py-1 [overflow-wrap:anywhere]"
          >
            {destination ? (
              <Link className={linkClass} to={destination.to}>
                {caption}
              </Link>
            ) : (
              <p>{caption}</p>
            )}
            {showTime && (
              <p className="py-1 text-sm">
                <SessionDate timestamp={event.at} />
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
