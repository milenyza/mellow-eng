import { ReviewActivity } from '@/components/flashcards/review-activity'
import { SuggestedReview } from '@/components/notebook/suggested-review'
import { useProgress } from '@/hooks/use-progress'
import { selectFlashcardHistory } from '@/services/flashcard-history'
import { PersonalStudy } from '@/components/notebook/personal-study'
import { PersonalStudyEditor } from '@/components/notebook/personal-study-editor'
import { familiarityLabels } from '@/data/notebook-labels'
import {
  getVocabularyAnnotations,
  subscribeVocabularyAnnotations,
} from '@/services/vocabulary-annotations'
import { Bookmark } from 'lucide-react'
import { useId, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { NotebookControls } from '@/components/notebook/notebook-controls'
import { VocabularyCard } from '@/components/notebook/vocabulary-card'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import {
  flashcardsPath,
  lessonsPath,
  practicalEnglishPath,
  storiesPath,
} from '@/data/navigation'
import { useFavoriteWords } from '@/hooks/use-favorite-words'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import { useNotebookVocabulary } from '@/hooks/use-notebook-vocabulary'
import { getFlashcardSearch } from '@/services/flashcard-filters'
import {
  filterNotebook,
  initialNotebookFilters,
  matchesAnnotationFilters,
  summarizeFamiliarity,
  selectSavedVocabulary,
  type NotebookFilters,
} from '@/services/notebook-selectors'
import { setWordFavorite } from '@/services/word-favorites'

export function NotebookPage() {
  const { data } = useProgress()
  const { ids, savedAt, available } = useFavoriteWords()
  const { records: annotations, status: annotationsStatus } =
    useSyncExternalStore(
      subscribeVocabularyAnnotations,
      getVocabularyAnnotations,
    )
  const [editing, setEditing] = useState<{
    id: string
    label: string
    english?: boolean
  }>()
  const editorTrigger = useRef<HTMLElement | null>(null)
  const { loaded, loading, retry } = useNotebookVocabulary(ids)
  const [filters, setFilters] = useState<NotebookFilters>(
    initialNotebookFilters,
  )
  const [rate, setRate] = useState(1)
  const [notice, setNotice] = useState('')
  const search = useRef<HTMLInputElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const playback = useSpeechPlayback()
  const audioStatusId = useId()

  const items = loaded
    ? selectSavedVocabulary(ids, loaded.vocabulary, savedAt, annotations)
    : []
  const hasDates = items.some((item) => item.savedAt !== undefined)
  const levels = [
    ...new Set(items.map(({ vocabulary }) => vocabulary.level)),
  ].sort()
  const visible = filterNotebook(
    items,
    hasDates ? filters : { ...filters, sort: 'alphabetical' },
  )
  const unavailable =
    loading || filters.source || filters.type || filters.level
      ? []
      : ids.filter(
          (id) =>
            !loaded?.vocabulary.has(id) &&
            matchesAnnotationFilters(filters, annotations.get(id), [id]),
        )
  const familiaritySummary = summarizeFamiliarity(ids, annotations)
  const failed = !loading && ids.some((id) => loaded?.failedIds.has(id))

  function stopAudio() {
    if (playback.activeId) playback.stop(playback.activeId)
  }

  function remove(id: string) {
    try {
      if (!setWordFavorite(id, false)) return
      if (playback.activeId === id) playback.stop(id)
      setNotice('Item removido dos favoritos.')
      if (ids.length > 1) (search.current ?? heading.current)?.focus()
      else heading.current?.focus()
    } catch {
      setNotice('Não foi possível remover o item neste navegador.')
    }
  }

  function edit(id: string, label: string, english?: boolean) {
    stopAudio()
    editorTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setNotice('')
    setEditing({ id, label, english })
  }

  function closeEditor(saved: boolean) {
    setEditing(undefined)
    if (saved) setNotice('Estudo pessoal salvo.')
    window.requestAnimationFrame(() => {
      if (editorTrigger.current?.isConnected) editorTrigger.current.focus()
      else (search.current ?? heading.current)?.focus()
    })
  }

  return (
    <div className="space-y-5 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28 max-md:[&_summary]:scroll-mb-28">
      <title>Meu caderno | Mellow</title>
      <header className="space-y-2 border-b border-plum/25 pb-5">
        <p lang="en" className="flex items-center gap-2 font-bold">
          <Bookmark aria-hidden="true" className="size-4" /> Vocabulary notebook
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="w-fit rounded-sm text-4xl font-semibold"
        >
          Meu caderno
        </h1>
        <p className="max-w-prose">
          Relembre palavras e expressões que você salvou enquanto estudava.
        </p>
        <p className="text-sm font-bold">
          {ids.length === 1 ? '1 item salvo' : `${ids.length} itens salvos`}
        </p>
      </header>
      {ids.length > 0 && (
        <section aria-labelledby="notebook-familiarity" className="space-y-2">
          <h2 id="notebook-familiarity" className="text-xl font-semibold">
            Familiaridade no caderno
          </h2>
          <p className="text-sm">Os níveis refletem a sua autoavaliação.</p>
          <dl className="grid grid-cols-2 gap-2 rounded-xl bg-lavender/45 p-3 sm:grid-cols-4">
            {(
              Object.keys(
                familiarityLabels,
              ) as (keyof typeof familiarityLabels)[]
            ).map((key) => (
              <div key={key} className="min-w-0 px-1">
                <dt className="text-sm">{familiarityLabels[key]}</dt>
                <dd className="font-heading text-xl font-bold">
                  {familiaritySummary[key]}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!available && (
        <p role="status">
          Não foi possível acessar os favoritos neste navegador.
        </p>
      )}
      {annotationsStatus === 'recovered' && (
        <p role="status" className="text-sm">
          Alguns dados do estudo pessoal não puderam ser recuperados.
        </p>
      )}
      {(annotationsStatus === 'unavailable' ||
        annotationsStatus === 'unsupported') && (
        <p role="status" className="text-sm">
          As anotações pessoais não estão disponíveis neste navegador.
        </p>
      )}
      <p role="status" className={notice ? 'text-sm' : 'sr-only'}>
        {notice}
      </p>
      {ids.length > 0 ? (
        <>
          <NotebookControls
            filters={filters}
            setFilters={(next) => {
              stopAudio()
              setFilters(next)
            }}
            levels={levels}
            hasDates={hasDates}
            searchRef={search}
          />
          {!loading && items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={flashcardsPath}>Revisar com cartões</Link>
              </Button>
              {visible.length > 0 &&
                (filters.query || getFlashcardSearch(filters)) && (
                  <Button asChild variant="secondary">
                    <Link
                      to={flashcardsPath + getFlashcardSearch(filters)}
                      state={{ query: filters.query }}
                    >
                      Revisar com os filtros atuais
                    </Link>
                  </Button>
                )}
            </div>
          )}
          {(loading || items.length > 0) && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex flex-wrap items-center gap-2 text-sm font-bold">
                Velocidade do áudio
                <select
                  className="min-h-11 rounded-md border border-border bg-cream px-3 py-2"
                  value={rate}
                  onChange={(event) => {
                    stopAudio()
                    setRate(Number(event.target.value))
                  }}
                >
                  <option value={1}>Normal</option>
                  <option value={0.75}>Reduzida</option>
                </select>
              </label>
              <PronunciationStatus playback={playback} id={audioStatusId} />
            </div>
          )}
          <p role="status" className="text-sm">
            {loading
              ? 'Carregando vocabulário…'
              : visible.length === 1
                ? '1 item encontrado'
                : `${visible.length} itens encontrados`}
          </p>
          {visible.length > 0 && (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {visible.map((item) => (
                <VocabularyCard
                  key={item.vocabularyId}
                  item={item}
                  playback={playback}
                  rate={rate}
                  statusId={audioStatusId}
                  onRemove={remove}
                  onEdit={() =>
                    edit(item.vocabularyId, item.vocabulary.text, true)
                  }
                />
              ))}
            </div>
          )}
          {!loading && !visible.length && !unavailable.length && !failed && (
            <div className="space-y-1 rounded-xl bg-lavender/50 p-4">
              <h2 className="text-xl font-semibold">
                Nenhum item corresponde à busca
              </h2>
              <p>Experimente outra palavra ou limpe os filtros.</p>
            </div>
          )}
          {failed && (
            <div className="space-y-2" role="status">
              <p>
                Alguns itens não puderam ser carregados. Seus favoritos
                continuam salvos.
              </p>
              <Button variant="secondary" onClick={retry}>
                Tentar novamente
              </Button>
            </div>
          )}
          {unavailable.length > 0 && (
            <section
              aria-labelledby="unavailable-vocab"
              className="space-y-2 border-t border-plum/20 pt-4"
            >
              <h2 id="unavailable-vocab" className="text-xl font-semibold">
                Itens indisponíveis
              </h2>
              <p>
                Esses favoritos e suas anotações foram mantidos. O material de
                origem está indisponível.
              </p>
              <ul className="divide-y divide-plum/20">
                {unavailable.map((id) => (
                  <li
                    key={id}
                    className="min-w-0 space-y-2 py-3 [overflow-wrap:anywhere]"
                  >
                    <p className="min-w-0 text-sm">{id}</p>
                    <PersonalStudy
                      label={id}
                      annotation={annotations.get(id)}
                      onEdit={() => edit(id, id)}
                    />
                    <Button
                      variant="secondary"
                      className="text-sm"
                      onClick={() => remove(id)}
                    >
                      Remover item <span className="sr-only">· {id}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : available ? (
        <section
          aria-labelledby="empty-notebook"
          className="space-y-3 rounded-xl bg-lavender/50 p-5"
        >
          <h2 id="empty-notebook" className="text-2xl font-semibold">
            O caderno está vazio
          </h2>
          <p>Use o botão de favorito ao encontrar algo que queira rever.</p>
          <ul className="flex flex-wrap gap-x-4">
            {[
              [lessonsPath, 'Explorar aulas'],
              [storiesPath, 'Explorar histórias'],
              [practicalEnglishPath, 'Explorar Inglês na prática'],
            ].map(([path, label]) => (
              <li key={path}>
                <Link
                  className="inline-flex min-h-11 items-center rounded-sm font-bold underline underline-offset-4"
                  to={path}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ReviewActivity history={selectFlashcardHistory(data)} />
      <SuggestedReview ids={ids} annotations={annotations} />
      {editing && (
        <PersonalStudyEditor
          key={editing.id}
          {...editing}
          annotation={annotations.get(editing.id)}
          onClose={closeEditor}
        />
      )}
    </div>
  )
}
