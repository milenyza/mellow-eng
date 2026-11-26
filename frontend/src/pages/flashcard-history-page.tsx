import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { SessionDate } from '@/components/ui/session-date'
import {
  flashcardHistoryPath,
  flashcardsPath,
  getFlashcardHistoryPath,
  notebookPath,
} from '@/data/navigation'
import { recallRatings, reviewDirections } from '@/data/flashcard-labels'
import {
  familiarityLabels,
  notebookSourceLabels,
  notebookTypeLabels,
} from '@/data/notebook-labels'
import { useFavoriteWords } from '@/hooks/use-favorite-words'
import { useNotebookVocabulary } from '@/hooks/use-notebook-vocabulary'
import { useProgress } from '@/hooks/use-progress'
import {
  selectFlashcardHistory,
  summarizeRecall,
} from '@/services/flashcard-history'
import { formatStudyTime } from '@/services/study-time'
import type {
  CompletedFlashcardSession,
  ReviewDirection,
} from '@/types/flashcards'

const linkClass =
  'inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4'

export function FlashcardHistoryPage() {
  const { sessionId } = useParams()
  const { data, persistence } = useProgress()
  const [direction, setDirection] = useState<ReviewDirection | ''>('')
  const sessions = selectFlashcardHistory(data, direction || undefined)
  const session =
    sessionId && Object.hasOwn(data.flashcardSessions ?? {}, sessionId)
      ? data.flashcardSessions?.[sessionId]
      : undefined

  return (
    <div className="max-w-3xl space-y-4 max-md:[&_a]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <title>Histórico de cartões | Mellow</title>
      <div className="flex flex-wrap gap-x-4">
        <Link to={notebookPath} className={linkClass}>
          Voltar ao caderno
        </Link>
        {sessionId && (
          <Link to={flashcardHistoryPath} className={linkClass}>
            Todas as revisões
          </Link>
        )}
      </div>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        Histórico de cartões
      </h1>
      {persistence === 'unavailable' && (
        <p role="status">
          O armazenamento está indisponível. Veja as sessões disponíveis nesta
          aba.
        </p>
      )}
      {sessionId ? (
        session ? (
          <SessionDetail key={session.sessionId} session={session} />
        ) : (
          <p>
            Esta sessão não está disponível. Você pode consultar as outras
            revisões.
          </p>
        )
      ) : (
        <>
          <label className="block space-y-1 text-sm font-bold">
            <span className="block">Filtrar por direção</span>
            <select
              className="min-h-11 max-w-full rounded-md border border-border bg-cream px-3"
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as ReviewDirection | '')
              }
            >
              <option value="">Todas as direções</option>
              {Object.entries(reviewDirections).map(([id, text]) => (
                <option key={id} value={id}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          {sessions.length ? (
            <ol
              aria-label="Sessões da mais recente à mais antiga"
              className="divide-y divide-plum/20"
            >
              {sessions.map((entry) => (
                <li key={entry.sessionId} className="py-2">
                  <Link
                    to={getFlashcardHistoryPath(entry.sessionId)}
                    className={`${linkClass} flex-wrap gap-x-2`}
                  >
                    {reviewDirections[entry.configuration.direction]} ·{' '}
                    <SessionDate timestamp={entry.completedAt} />
                  </Link>
                  <p className="text-sm">
                    {entry.observations.length}{' '}
                    {entry.observations.length === 1 ? 'cartão' : 'cartões'} ·{' '}
                    {formatStudyTime(entry.activeMs)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p>
              {direction
                ? 'Ainda não há revisões nesta direção.'
                : 'Conclua uma revisão com cartões para começar seu histórico.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function SessionDetail({ session }: { session: CompletedFlashcardSession }) {
  const ids = useMemo(
    () => session.observations.map(({ vocabularyId }) => vocabularyId),
    [session],
  )
  const { loaded, loading, retry } = useNotebookVocabulary(ids)
  const favorites = useFavoriteWords().ids
  const {
    configuration: { direction, length, scope, filters, usedSearch },
  } = session
  const counts = summarizeRecall(session.observations)
  const repeatable = ids.some(
    (id) => favorites.includes(id) && loaded?.vocabulary.has(id),
  )
  const details = [
    length === 'all' ? 'Todos os disponíveis' : `${length} cartões`,
    scope === 'difficult' && 'Repetição de itens difíceis',
    scope === 'recommended' && 'Revisão sugerida',
    scope === 'history' && 'Revisão anterior',
    filters.source && notebookSourceLabels[filters.source],
    filters.type && notebookTypeLabels[filters.type],
    filters.level,
    filters.familiarity && familiarityLabels[filters.familiarity],
    usedSearch && 'Busca aplicada',
  ].filter(Boolean)
  return (
    <>
      <section
        className="space-y-2 rounded-xl bg-sage/45 p-4"
        aria-labelledby="review-details"
      >
        <h2 id="review-details" className="text-xl font-semibold">
          {reviewDirections[direction]}
        </h2>
        <p>
          <SessionDate timestamp={session.completedAt} /> ·{' '}
          {formatStudyTime(session.activeMs)} de atividade
        </p>
        <p className="text-sm">{details.join(' · ')}</p>
        <dl className="grid gap-2 border-t border-plum/20 pt-2 sm:grid-cols-3">
          {Object.entries(recallRatings).map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd className="font-bold">
                {counts[key as keyof typeof counts]}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-sm">
          As avaliações registram como você se lembrou dos itens.
        </p>
        {repeatable && !loading ? (
          <Button asChild>
            <Link
              to={`${flashcardsPath}?revisao=${encodeURIComponent(session.sessionId)}`}
            >
              Revisar favoritos desta sessão
            </Link>
          </Button>
        ) : (
          !loading && (
            <p className="text-sm">
              Nenhum item desta sessão está disponível nos favoritos para uma
              nova revisão.
            </p>
          )
        )}
      </section>
      {loading && <p role="status">Buscando o conteúdo revisado…</p>}
      {!loading && !!loaded?.failedIds.size && (
        <Button variant="secondary" onClick={retry}>
          Tentar carregar novamente
        </Button>
      )}
      <section className="space-y-2" aria-labelledby="review-items">
        <h2 id="review-items" className="text-xl font-semibold">
          Vocabulário revisado
        </h2>
        <ul className="divide-y divide-plum/20 [overflow-wrap:anywhere]">
          {session.observations.map(({ vocabularyId, direction, rating }) => {
            const item = loaded?.vocabulary.get(vocabularyId)
            return (
              <li key={vocabularyId} className="space-y-1 py-3">
                {item ? (
                  <Link className={linkClass} to={item.source.href}>
                    <span lang="en">{item.text}</span>
                  </Link>
                ) : (
                  <p>
                    Referência {vocabularyId}
                    {!loading && ' · Conteúdo indisponível'}
                  </p>
                )}
                {item && <p>{item.translation}</p>}
                <p className="text-sm">
                  {reviewDirections[direction]} · {recallRatings[rating]}
                </p>
                {!favorites.includes(vocabularyId) && (
                  <p className="text-sm">Fora dos favoritos atuais</p>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      {session.observations.some(({ rating }) => rating !== 'easy') && (
        <section aria-labelledby="review-difficult" className="space-y-2">
          <h2 id="review-difficult" className="text-xl font-semibold">
            Itens que custaram a lembrar
          </h2>
          <ul className="list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">
            {session.observations
              .filter(({ rating }) => rating !== 'easy')
              .map(({ vocabularyId, rating }) => {
                const item = loaded?.vocabulary.get(vocabularyId)
                return (
                  <li key={vocabularyId}>
                    <span lang={item ? 'en' : undefined}>
                      {item?.text ?? vocabularyId}
                    </span>{' '}
                    · {recallRatings[rating]}
                  </li>
                )
              })}
          </ul>
        </section>
      )}
    </>
  )
}
