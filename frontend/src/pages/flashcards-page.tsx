import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router'
import { FlashcardPlayer } from '@/components/flashcards/flashcard-player'
import { NotebookControls } from '@/components/notebook/notebook-controls'
import { Button } from '@/components/ui/button'
import { reviewDirections } from '@/data/flashcard-labels'
import { notebookPath } from '@/data/navigation'
import { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import { useProgress } from '@/hooks/use-progress'
import { useFavoriteWords } from '@/hooks/use-favorite-words'
import { useNotebookVocabulary } from '@/hooks/use-notebook-vocabulary'
import {
  getFlashcardFilters,
  selectFlashcardIds,
} from '@/services/flashcard-filters'
import {
  generateFlashcards,
  getReviewLengths,
  startFlashcardSession,
} from '@/services/flashcards'
import {
  filterNotebook,
  selectSavedVocabulary,
} from '@/services/notebook-selectors'
import {
  getVocabularyAnnotations,
  subscribeVocabularyAnnotations,
} from '@/services/vocabulary-annotations'
import type {
  FlashcardConfiguration,
  FlashcardSession,
  ReviewDirection,
  ReviewLength,
} from '@/types/flashcards'

const field =
  'block min-h-11 w-full min-w-0 rounded-md border border-border bg-cream px-3 py-1.5 text-base font-normal'

export function FlashcardsPage() {
  const location = useLocation()
  const { data } = useProgress()
  const params = new URLSearchParams(location.search)
  const previousId = params.get('revisao')
  const previous =
    previousId && Object.hasOwn(data.flashcardSessions ?? {}, previousId)
      ? data.flashcardSessions?.[previousId]
      : undefined
  const recommended = params.get('sugestao') === '1'
  const proposed = location.state?.vocabularyIds
  const [filters, setFilters] = useState(() =>
    getFlashcardFilters(
      new URLSearchParams(location.search),
      typeof location.state?.query === 'string' ? location.state.query : '',
    ),
  )
  const [direction, setDirection] = useState<ReviewDirection>(
    previous?.configuration.direction ?? 'en-pt',
  )
  const [length, setLength] = useState<ReviewLength>('all')
  const [session, setSession] = useState<FlashcardSession>()
  const [completed, setCompleted] = useState(false)
  const blocker = useGameSessionGuard(!!session && !completed)
  const searchRef = useRef<HTMLInputElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const { ids, savedAt, available } = useFavoriteWords()
  const { records: annotations } = useSyncExternalStore(
    subscribeVocabularyAnnotations,
    getVocabularyAnnotations,
  )
  const { source, familiarity } = filters
  const candidateIds = useMemo(() => {
    const allowed = previousId
      ? new Set(previous?.observations.map(({ vocabularyId }) => vocabularyId))
      : recommended
        ? new Set(
            Array.isArray(proposed)
              ? proposed.filter(
                  (item): item is string => typeof item === 'string',
                )
              : [],
          )
        : undefined
    return selectFlashcardIds(
      allowed ? ids.filter((id) => allowed.has(id)) : ids,
      { source, familiarity },
      annotations,
    )
  }, [
    ids,
    source,
    familiarity,
    annotations,
    previousId,
    previous,
    recommended,
    proposed,
  ])
  const { loaded, loading, retry } = useNotebookVocabulary(candidateIds)
  const items = loaded
    ? selectSavedVocabulary(
        candidateIds,
        loaded.vocabulary,
        savedAt,
        annotations,
      )
    : []
  const levels = [
    ...new Set([
      ...items.map(({ vocabulary }) => vocabulary.level),
      ...(filters.level ? [filters.level] : []),
    ]),
  ].sort()
  const eligible = filterNotebook(items, {
    ...filters,
    sort: 'alphabetical',
  }).filter(
    ({ vocabulary }) => vocabulary.text.trim() && vocabulary.translation.trim(),
  )
  const lengths = getReviewLengths(eligible.length)
  const selection = lengths.includes(length) ? length : 'all'
  const unavailable = !loading && candidateIds.length > items.length

  function begin() {
    const configuration: FlashcardConfiguration = {
      direction,
      length: selection,
      filters,
      scope: previousId ? 'history' : recommended ? 'recommended' : 'saved',
    }
    const cards = generateFlashcards(eligible, configuration)
    if (cards.length) start(startFlashcardSession(cards, configuration))
  }

  function start(next: FlashcardSession) {
    setCompleted(false)
    setSession(next)
  }

  function reset() {
    setSession(undefined)
    window.requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    )
  }

  return (
    <div className="max-w-3xl space-y-5 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <title>Cartões de revisão | Mellow</title>
      <header className="space-y-2 border-b border-plum/25 pb-4">
        <Link
          to={notebookPath}
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        >
          Voltar ao caderno
        </Link>
        <h1
          ref={heading}
          tabIndex={-1}
          className="w-fit rounded-sm text-3xl font-semibold sm:text-4xl"
        >
          Cartões de revisão
        </h1>
      </header>
      {session ? (
        <FlashcardPlayer
          key={session.id}
          initialSession={session}
          blocker={blocker}
          onFinish={() => setCompleted(true)}
          onStart={start}
          onConfigure={reset}
        />
      ) : (
        <section
          aria-label="Configurar sessão de revisão"
          className="space-y-5"
        >
          <p className="max-w-prose">
            Tente lembrar primeiro. Depois de virar o cartão, indique como foi
            para você lembrar.
          </p>
          {(previousId || recommended) && (
            <p className="rounded-lg bg-sage/45 p-3 text-sm">
              {previousId
                ? 'Use os favoritos ainda disponíveis desta revisão anterior.'
                : 'Use os favoritos disponíveis da revisão sugerida.'}
            </p>
          )}
          <NotebookControls
            filters={{ ...filters, sort: 'alphabetical' }}
            setFilters={({ query, source, type, level, familiarity }) =>
              setFilters({ query, source, type, level, familiarity })
            }
            levels={levels}
            searchRef={searchRef}
            showSorting={false}
          />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!loading) begin()
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-bold">
                Direção da revisão
                <select
                  value={direction}
                  className={field}
                  onChange={(event) =>
                    setDirection(event.target.value as ReviewDirection)
                  }
                >
                  {Object.entries(reviewDirections).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-bold">
                Quantidade de cartões
                <select
                  disabled={loading || !lengths.length}
                  value={selection}
                  className={field}
                  onChange={(event) =>
                    setLength(
                      event.target.value === 'all'
                        ? 'all'
                        : (Number(event.target.value) as ReviewLength),
                    )
                  }
                >
                  {!lengths.length && (
                    <option value="all">Nenhum cartão disponível</option>
                  )}
                  {lengths.map((value) => (
                    <option key={value} value={value}>
                      {value === 'all'
                        ? 'Todos os disponíveis'
                        : `${value} cartões`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p role="status" className="text-sm font-bold">
              {loading
                ? 'Carregando vocabulário…'
                : eligible.length === 1
                  ? '1 cartão disponível'
                  : `${eligible.length} cartões disponíveis`}
            </p>
            {unavailable && (
              <p className="text-sm">
                Alguns itens salvos estão sem conteúdo de origem disponível.
                Seus favoritos continuam no caderno.
              </p>
            )}
            {!loading &&
              loaded?.ids === candidateIds &&
              loaded.failedIds.size > 0 && (
                <Button variant="secondary" onClick={retry}>
                  Tentar carregar novamente
                </Button>
              )}
            {!available && (
              <p>Não foi possível acessar os favoritos neste navegador.</p>
            )}
            {!loading && !eligible.length && (
              <p className="rounded-lg bg-lavender/50 p-3">
                {ids.length
                  ? 'Experimente limpar os filtros ou conferir seus itens no caderno.'
                  : 'Salve palavras e expressões no caderno para montar a primeira sessão.'}
              </p>
            )}
            {eligible.length > 0 && (
              <Button type="submit" disabled={loading}>
                Começar revisão
              </Button>
            )}
          </form>
        </section>
      )}
    </div>
  )
}
