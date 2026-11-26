import { Link } from 'react-router'
import { ExpressionFavoriteButton } from './expression-favorite-button'
import { usePracticalFavorites } from '@/hooks/use-practical-favorites'
import { getPracticalSituationPath } from '@/data/navigation'
import type { Phrasebook } from '@/types/practical-english'

export function PracticalExpressionReview({
  expressionIds,
  phrasebook,
  title,
  sectionId,
}: {
  expressionIds: readonly string[]
  phrasebook: Phrasebook
  title: string
  sectionId: string
}) {
  const { saved, feedback, toggleFavorite } = usePracticalFavorites()
  const referencedIds = new Set(expressionIds)
  const phrases = phrasebook.groups
    .flatMap(({ expressions }) => expressions)
    .filter(({ id }) => referencedIds.has(id))
  if (!phrases.length) return null

  return (
    <section
      id={sectionId}
      tabIndex={-1}
      aria-labelledby={`${sectionId}-titulo`}
      className="space-y-3 scroll-mt-5"
    >
      <h2 id={`${sectionId}-titulo`} className="text-2xl font-semibold">
        {title}
      </h2>
      <p role="status" className={feedback ? 'text-sm' : 'sr-only'}>
        {feedback}
      </p>
      <ul className="divide-y divide-plum/20 rounded-xl border border-plum/20 bg-cream px-4">
        {phrases.map((phrase) => (
          <li key={phrase.id} className="space-y-2 py-4">
            <p lang="en" className="font-heading text-lg font-semibold">
              {phrase.text}
            </p>
            <p className="font-bold">{phrase.translation}</p>
            <p>{phrase.usage}</p>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <ExpressionFavoriteButton
                expression={phrase}
                saved={saved.has(phrase.id)}
                onToggle={toggleFavorite}
              />
              <Link
                to={`${getPracticalSituationPath(phrasebook.situationId)}#${phrase.id}`}
                className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
              >
                Consultar no guia
                <span className="sr-only" lang="en">
                  : {phrase.text}
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
