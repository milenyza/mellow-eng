import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { SessionDate } from '@/components/ui/session-date'
import {
  flashcardsPath,
  memoryGamePath,
  wordMatchPath,
} from '@/data/navigation'
import { usePracticalFavorites } from '@/hooks/use-practical-favorites'
import { useProgress } from '@/hooks/use-progress'
import { loadReviewRecommendations } from '@/services/review-recommendations'
import type { VocabularyAnnotation } from '@/types/notebook'
import type {
  RecommendationSource,
  ReviewRecommendation,
} from '@/types/recommendation'

const sourceLabels: Record<RecommendationSource, string> = {
  flashcards: 'Cartões',
  'word-match': 'Word Match',
  'sentence-builder': 'Sentence Builder',
  simulation: 'Inglês na prática',
  familiarity: 'Familiaridade escolhida',
}
const linkClass =
  'inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4'

export function SuggestedReview({
  ids,
  annotations,
}: {
  ids: readonly string[]
  annotations: ReadonlyMap<string, VocabularyAnnotation>
}) {
  const { data } = useProgress()
  const { saved, feedback, toggleFavorite } = usePracticalFavorites()
  const [result, setResult] = useState<{
    items: readonly ReviewRecommendation[]
    data: typeof data
    ids: typeof ids
    annotations: typeof annotations
  }>()
  const [source, setSource] = useState<RecommendationSource | ''>('')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let active = true
    void loadReviewRecommendations(data, ids, annotations).then((items) => {
      if (active) setResult({ items, data, ids, annotations })
    })
    return () => {
      active = false
    }
  }, [data, ids, annotations])

  const loading =
    !result ||
    result.data !== data ||
    result.ids !== ids ||
    result.annotations !== annotations
  const visible = (result?.items ?? []).filter(
    ({ reasons }) =>
      !source || reasons.some((reason) => reason.source === source),
  )
  const favorites = visible.filter(
    (item) => item.kind === 'vocabulary' && saved.has(item.id),
  )
  const other = visible.filter(
    (item) => item.kind === 'sentence' || !saved.has(item.id),
  )

  function group(title: string, items: readonly ReviewRecommendation[]) {
    if (!items.length) return null
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ul className="divide-y divide-plum/20 [overflow-wrap:anywhere]">
          {(expanded ? items : items.slice(0, 4)).map((item) => (
            <li key={`${item.kind}-${item.id}`} className="space-y-1 py-3">
              <p lang="en" className="font-heading font-semibold">
                {item.kind === 'vocabulary' ? item.item.text : item.text}
              </p>
              <p className="text-sm">
                {item.kind === 'vocabulary'
                  ? item.item.translation
                  : item.explanation}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {item.reasons.map((reason) => (
                  <li key={`${reason.source}-${reason.explanation}`}>
                    <strong>{sourceLabels[reason.source]}</strong> ·{' '}
                    {reason.explanation}
                    {reason.count > 1 && <> Em {reason.count} sessões.</>}
                    {reason.at !== undefined && (
                      <>
                        {' '}
                        <SessionDate timestamp={reason.at} />
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link
                  to={
                    item.kind === 'vocabulary'
                      ? item.item.source.href
                      : item.href
                  }
                  className={linkClass}
                >
                  Abrir conteúdo{' '}
                  <span lang="en" className="sr-only">
                    {' '}
                    · {item.kind === 'vocabulary' ? item.item.text : item.text}
                  </span>
                </Link>
                {item.reasons.find(({ href }) => href)?.href && (
                  <Link
                    className={linkClass}
                    to={item.reasons.find(({ href }) => href)!.href!}
                  >
                    Rever na simulação
                  </Link>
                )}
                {item.kind === 'vocabulary' && !saved.has(item.id) && (
                  <Button
                    variant="secondary"
                    className="text-sm motion-reduce:transition-none"
                    onClick={() => toggleFavorite(item.id)}
                  >
                    Salvar nos favoritos
                    <span lang="en" className="sr-only">
                      {' '}
                      · {item.item.text}
                    </span>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="suggested-review"
      className="space-y-3 border-t border-plum/20 pt-4"
    >
      <h2 id="suggested-review" className="text-xl font-semibold">
        Revisão sugerida
      </h2>
      <p className="text-sm">
        Escolha o que quer praticar com base nas suas revisões, atividades e
        classificações pessoais.
      </p>
      {loading ? (
        <p role="status">Buscando sugestões…</p>
      ) : (
        <>
          {result.items.length > 0 && (
            <label className="block space-y-1 text-sm font-bold">
              <span className="block">Filtrar sugestões por origem</span>
              <select
                className="min-h-11 max-w-full rounded-md border border-border bg-cream px-3"
                value={source}
                onChange={(event) =>
                  setSource(event.target.value as RecommendationSource | '')
                }
              >
                <option value="">Todas as origens</option>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!visible.length && (
            <p className="text-sm">
              {source
                ? 'Ainda não há sugestões nesta origem.'
                : 'Suas atividades e escolhas de familiaridade podem gerar sugestões aqui.'}
            </p>
          )}
          {favorites.length > 0 && (
            <Button asChild>
              <Link
                to={`${flashcardsPath}?sugestao=1`}
                state={{ vocabularyIds: favorites.map(({ id }) => id) }}
              >
                Revisar favoritos sugeridos
              </Link>
            </Button>
          )}
          {group('Nos seus favoritos', favorites)}
          {group('Outros conteúdos para praticar', other)}
          {(favorites.length > 4 || other.length > 4) && (
            <Button
              variant="secondary"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? 'Mostrar menos sugestões'
                : 'Mostrar todas as sugestões'}
            </Button>
          )}
        </>
      )}
      <p role="status" className={feedback ? 'text-sm' : 'sr-only'}>
        {feedback}
      </p>
      <div className="space-y-1 border-t border-plum/20 pt-3">
        <h3 className="text-lg font-semibold">Praticar favoritos em jogos</h3>
        <p className="text-sm">
          Cada jogo mostra quantos pares compatíveis estão disponíveis e o
          mínimo necessário.
        </p>
        <div className="flex flex-wrap gap-x-4">
          <Link
            className={linkClass}
            to={`${wordMatchPath}?fonte=saved`}
            lang="en"
          >
            Word Match
          </Link>
          <Link
            className={linkClass}
            to={`${memoryGamePath}?fonte=saved`}
            lang="en"
          >
            Memory Game
          </Link>
        </div>
      </div>
    </section>
  )
}
