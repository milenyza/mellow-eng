import type { Ref } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { recallRatings, reviewDirections } from '@/data/flashcard-labels'
import {
  familiarityLabels,
  notebookSourceLabels,
  notebookTypeLabels,
} from '@/data/notebook-labels'
import { summarizeRecall } from '@/services/flashcard-history'
import type { ProgressSnapshot } from '@/services/progress-repository'
import { getFlashcardHistoryPath, notebookPath } from '@/data/navigation'
import { selectDifficultCards } from '@/services/flashcards'
import { formatStudyTime } from '@/services/study-time'
import type {
  Flashcard,
  FlashcardResult,
  RecallRating,
} from '@/types/flashcards'

export function FlashcardResults({
  result,
  persistence,
  cards,
  heading,
  onDifficult,
  onConfigure,
}: {
  result: FlashcardResult
  persistence: ProgressSnapshot['persistence']
  cards: readonly Flashcard[]
  heading: Ref<HTMLHeadingElement>
  onDifficult: (cards: readonly Flashcard[]) => void
  onConfigure: () => void
}) {
  const { configuration, observations } = result
  const { filters } = configuration
  const difficult = selectDifficultCards(cards, observations)
  const ratings = new Map(
    observations.map(({ vocabularyId, rating }) => [vocabularyId, rating]),
  )
  const totals = summarizeRecall(observations)
  const selection = [
    configuration.scope === 'difficult'
      ? 'Itens que você quis rever'
      : configuration.scope === 'history'
        ? 'Itens de uma revisão anterior'
        : configuration.scope === 'recommended'
          ? 'Revisão sugerida'
          : 'Vocabulário salvo',
    configuration.length === 'all'
      ? 'Todos os disponíveis'
      : `${configuration.length} cartões`,
    filters.source && notebookSourceLabels[filters.source],
    filters.type && notebookTypeLabels[filters.type],
    filters.level && `Nível ${filters.level}`,
    filters.familiarity && familiarityLabels[filters.familiarity],
    filters.query && 'Busca do caderno',
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <section
        aria-labelledby="flashcard-result"
        className="space-y-3 rounded-xl bg-sage/55 p-4 sm:p-6"
      >
        <h2
          id="flashcard-result"
          ref={heading}
          tabIndex={-1}
          className="w-fit rounded-sm text-2xl font-semibold"
        >
          Revisão concluída
        </h2>
        <p>
          {observations.length === 1
            ? 'Você revisou 1 item.'
            : `Você revisou ${observations.length} itens.`}{' '}
          Use suas próprias impressões para escolher o que rever.
        </p>
        <p>
          <strong>{reviewDirections[configuration.direction]}</strong> ·{' '}
          {selection.join(' · ')}
        </p>
        <p>Tempo ativo estimado · {formatStudyTime(result.activeMs)}</p>
        <dl className="grid gap-2 border-t border-plum/20 pt-3 sm:grid-cols-3">
          {(Object.keys(recallRatings) as RecallRating[]).map((rating) => (
            <div key={rating}>
              <dt className="text-sm font-bold">{recallRatings[rating]}</dt>
              <dd className="font-heading text-2xl">{totals[rating]}</dd>
            </div>
          ))}
        </dl>
        {persistence === 'unavailable' && (
          <p role="status">
            O navegador não conseguiu salvar a sessão. O resultado está
            disponível nesta aba.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {difficult.length > 0 && (
            <Button onClick={() => onDifficult(difficult)}>
              Rever os itens que custaram a lembrar
            </Button>
          )}
          <Button variant="secondary" onClick={onConfigure}>
            Configurar outra sessão
          </Button>
          <Button asChild variant="secondary">
            <Link to={getFlashcardHistoryPath(result.sessionId)}>
              Ver sessão no histórico
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to={notebookPath}>Voltar ao caderno</Link>
          </Button>
        </div>
      </section>
      <section className="space-y-2" aria-labelledby="flashcard-reviewed">
        <h2 id="flashcard-reviewed" className="text-xl font-semibold">
          Vocabulário revisado
        </h2>
        <ul className="divide-y divide-plum/20">
          {cards.map(({ item }) => {
            const rating = ratings.get(item.vocabularyId)
            return (
              <li
                key={item.vocabularyId}
                className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2 [overflow-wrap:anywhere]"
              >
                <span>
                  <strong lang="en">{item.vocabulary.text}</strong> ·{' '}
                  {item.vocabulary.translation}
                </span>
                {rating && (
                  <span className="text-sm">{recallRatings[rating]}</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      {difficult.length > 0 && (
        <section
          aria-labelledby="flashcard-difficult"
          className="space-y-2 border-t border-plum/20 pt-3"
        >
          <h2 id="flashcard-difficult" className="text-xl font-semibold">
            Itens para rever
          </h2>
          <ul className="list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">
            {difficult.map(({ item }) => (
              <li key={item.vocabularyId}>
                <span lang="en">{item.vocabulary.text}</span> ·{' '}
                {item.vocabulary.translation}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
