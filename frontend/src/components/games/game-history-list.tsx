import { Link } from 'react-router'
import { difficultyLabels, gameTitle } from '@/data/game-labels'
import { getGameSessionPath } from '@/data/navigation'
import { formatStudyTime } from '@/services/study-time'
import type { CompletedGameSession } from '@/types/game-history'

const localDate = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function SessionDate({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp)
  return <time dateTime={date.toISOString()}>{localDate.format(date)}</time>
}

export function GameHistoryList({
  history,
  search = '',
}: {
  history: readonly CompletedGameSession[]
  search?: string
}) {
  return (
    <ol className="divide-y divide-plum/20">
      {history.map((session) => (
        <li
          key={session.sessionId}
          className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 py-1"
        >
          <Link
            to={getGameSessionPath(session.sessionId) + search}
            className="inline-flex min-h-11 items-center rounded-sm font-bold underline underline-offset-4"
          >
            <span lang="en">{gameTitle(session.gameId)}</span>
            <span className="sr-only">
              {' '}
              · <SessionDate timestamp={session.endedAt} />
            </span>
          </Link>
          <p className="pb-2 text-sm sm:pb-0">
            {difficultyLabels[session.difficulty]} ·{' '}
            <SessionDate timestamp={session.endedAt} /> ·{' '}
            {formatStudyTime(session.activeMs)}
          </p>
        </li>
      ))}
    </ol>
  )
}
