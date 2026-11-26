import { Link } from 'react-router'
import { SessionDate } from '@/components/ui/session-date'
import {
  flashcardHistoryPath,
  getFlashcardHistoryPath,
} from '@/data/navigation'
import { reviewDirections } from '@/data/flashcard-labels'
import { summarizeFlashcardHistory } from '@/services/flashcard-history'
import { formatStudyTime } from '@/services/study-time'
import type { CompletedFlashcardSession } from '@/types/flashcards'

export function ReviewActivity({
  history,
  compact = false,
}: {
  history: readonly CompletedFlashcardSession[]
  compact?: boolean
}) {
  if (compact && history.length === 0) return null
  const totals = summarizeFlashcardHistory(history)
  return (
    <section
      aria-labelledby="review-activity-title"
      className="space-y-2 border-t border-plum/20 pt-4"
    >
      <h2 id="review-activity-title" className="text-xl font-semibold">
        Atividade com cartões
      </h2>
      <dl className="grid gap-x-4 gap-y-2 rounded-lg bg-sage/45 p-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm">Sessões concluídas</dt>
          <dd className="font-bold">{totals.sessions}</dd>
        </div>
        <div>
          <dt className="text-sm">Itens distintos revisados</dt>
          <dd className="font-bold">{totals.vocabulary}</dd>
        </div>
        <div>
          <dt className="text-sm">Tempo ativo de revisão</dt>
          <dd className="font-bold">{formatStudyTime(totals.activeMs)}</dd>
        </div>
      </dl>
      {history.length > 0 ? (
        <ul aria-label="Revisões recentes" className="flex flex-wrap gap-x-4">
          {history.slice(0, compact ? 1 : 3).map((session) => (
            <li key={session.sessionId}>
              <Link
                className="inline-flex min-h-11 flex-wrap items-center gap-x-2 rounded-sm text-sm font-bold underline underline-offset-4"
                to={getFlashcardHistoryPath(session.sessionId)}
              >
                {reviewDirections[session.configuration.direction]} ·{' '}
                <SessionDate timestamp={session.completedAt} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">Suas revisões concluídas aparecerão aqui.</p>
      )}
      <Link
        to={flashcardHistoryPath}
        className="inline-flex min-h-11 items-center rounded-sm font-bold underline underline-offset-4"
      >
        Ver histórico de cartões
      </Link>
    </section>
  )
}
