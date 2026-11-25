import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  StoryChapter,
  type StorySpeed,
} from '@/components/stories/story-chapter'
import { StoryCompletion } from '@/components/stories/story-completion'
import { StoryComprehension } from '@/components/stories/story-comprehension'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/utils'
import { getStoryPath, storiesPath } from '@/data/navigation'
import { useActiveStudy } from '@/hooks/use-active-study'
import { useProgress } from '@/hooks/use-progress'
import { useReadingPosition } from '@/hooks/use-reading-position'
import {
  getReadingProgress,
  markChapterRead,
  startReading,
  updateReading,
  updateReadingChapter,
  updateStoryProgress,
} from '@/services/reading-progress'
import type { PublishedStory } from '@/types/story'

const readingSizes = [
  { id: 'normal', label: 'Padrão', className: 'text-lg' },
  { id: 'large', label: 'Grande', className: 'text-xl' },
  { id: 'extra-large', label: 'Maior', className: 'text-2xl' },
] as const

export function StoryReader({
  story,
  chapterIndex,
}: {
  story: PublishedStory
  chapterIndex: number
}) {
  const { data, repository, persistence } = useProgress()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useSearchParams()
  const { preferences, stories } = getReadingProgress(data)
  const record = stories[story.id]
  const showingCompletion = !!record?.completion && query.has('conclusao')
  const size =
    readingSizes.find(({ id }) => id === preferences.fontSize) ??
    readingSizes[0]
  const [speed, setSpeed] = useState<StorySpeed>(1)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const sizeId = useId()
  const chapter = story.chapters[chapterIndex]
  const previous = story.chapters[chapterIndex - 1]
  const next = story.chapters[chapterIndex + 1]
  const hasTranslation = chapter.paragraphs.some(({ translation }) =>
    Boolean(translation),
  )

  const runId = showingCompletion ? undefined : record?.run.id
  const flushTime = useActiveStudy(repository, story.id, runId, 'reading')
  useReadingPosition(repository, story.id, chapter, runId, hash)
  useEffect(() => {
    if (showingCompletion) return
    repository.update((data) =>
      updateStoryProgress(data, story.id, (current) => {
        if (!current) return startReading(chapter.id)
        return current.run.chapterId === chapter.id
          ? current
          : { ...current, run: { ...current.run, chapterId: chapter.id } }
      }),
    )
  }, [repository, story.id, chapter.id, showingCompletion])

  function markRead() {
    flushTime.current?.()
    const wasRead = story.chapters.every(
      ({ id }) => record?.run.chapters[id]?.readAt !== undefined,
    )
    repository.update((data) =>
      updateStoryProgress(data, story.id, (current) =>
        current && current.run.id === runId
          ? markChapterRead(story, current, chapter.id)
          : current,
      ),
    )
    const updated = getReadingProgress(repository.getSnapshot().data).stories[
      story.id
    ]
    if (
      !wasRead &&
      updated?.completion &&
      story.chapters.every(
        ({ id }) => updated.run.chapters[id]?.readAt !== undefined,
      )
    )
      setQuery({ conclusao: '1' })
  }

  function restart() {
    flushTime.current?.()
    const first = story.chapters[0].id
    repository.update((data) =>
      updateStoryProgress(data, story.id, (current) =>
        startReading(first, current),
      ),
    )
    setConfirmRestart(false)
    void navigate(getStoryPath(story.id, first))
    window.scrollTo(0, 0)
  }

  const chapterProgress = record?.run.chapters[chapter.id]
  const read = chapterProgress?.readAt !== undefined
  const practice = chapterProgress?.practice
  const notice =
    persistence === 'unavailable'
      ? 'O navegador não conseguiu salvar a leitura. Os dados ficam disponíveis nesta aba.'
      : null

  if (showingCompletion && record)
    return <StoryCompletion story={story} record={record} />

  return (
    <article className="mx-auto max-w-2xl space-y-6 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <header className="space-y-4 border-b border-plum/20 pb-5">
        <Link
          to={storiesPath}
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        >
          Voltar à biblioteca
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            aria-expanded={confirmRestart}
            onClick={() => setConfirmRestart(!confirmRestart)}
          >
            Reiniciar leitura
          </Button>
          {record?.completion && (
            <Button variant="secondary" asChild>
              <Link to={`${getStoryPath(story.id, chapter.id)}?conclusao=1`}>
                Ver conclusão
              </Link>
            </Button>
          )}
        </div>
        {confirmRestart && (
          <div
            role="group"
            aria-label="Confirmação de reinício"
            className="space-y-3 rounded-lg bg-lavender p-4"
          >
            <p>
              A leitura volta ao primeiro capítulo e os rascunhos desta leitura
              são descartados. O histórico já registrado é preservado.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmRestart(false)}
              >
                Cancelar
              </Button>
              <Button onClick={restart}>Confirmar reinício</Button>
            </div>
          </div>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div>
            <p className="mb-2 text-sm font-bold">Nível {story.level}</p>
            <h1
              lang="en"
              className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
            >
              {story.title}
            </h1>
          </div>
          <img
            src={story.cover}
            alt=""
            width={480}
            height={300}
            className="aspect-[8/5] w-full rounded-md"
          />
        </div>
      </header>

      <section aria-labelledby="story-chapter-heading" className="space-y-4">
        <div>
          <p className="text-sm font-extrabold">
            Capítulo {chapterIndex + 1} de {story.chapters.length}
          </p>
          <h2
            id="story-chapter-heading"
            tabIndex={-1}
            lang="en"
            className="mt-1 scroll-mt-6 rounded-sm font-heading text-2xl leading-tight font-semibold sm:text-3xl"
          >
            {chapter.title}
          </h2>
        </div>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-lg bg-sage/60 p-4">
          <div className="space-y-1">
            <label htmlFor={sizeId} className="block text-sm font-bold">
              Tamanho do texto
            </label>
            <div className="relative">
              <select
                id={sizeId}
                value={size.id}
                onChange={(event) => {
                  const fontSize =
                    readingSizes.find(({ id }) => id === event.target.value)
                      ?.id ?? 'normal'
                  repository.update((data) =>
                    updateReading(data, (reading) => ({
                      ...reading,
                      preferences: { ...reading.preferences, fontSize },
                    })),
                  )
                }}
                className="min-h-11 w-full appearance-none rounded-md border border-border bg-background py-2 pr-9 pl-3 text-base forced-colors:appearance-auto"
              >
                {readingSizes.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 forced-colors:hidden"
              />
            </div>
          </div>
          {hasTranslation && (
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={preferences.translations}
                onChange={(event) => {
                  const translations = event.target.checked
                  repository.update((data) =>
                    updateReading(data, (reading) => ({
                      ...reading,
                      preferences: { ...reading.preferences, translations },
                    })),
                  )
                }}
                className="size-4 shrink-0 accent-plum"
              />
              Mostrar traduções
            </label>
          )}
        </div>
        <StoryChapter
          key={chapter.id}
          chapter={chapter}
          translations={preferences.translations}
          readingClass={cn('font-heading leading-relaxed', size.className)}
          speed={speed}
          setSpeed={setSpeed}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-plum/20 pt-4">
        {read ? (
          <p className="font-bold">Capítulo marcado como lido</p>
        ) : (
          <Button onClick={markRead} disabled={!runId}>
            Marcar capítulo como lido
          </Button>
        )}
        <p className="text-sm">Os exercícios são opcionais.</p>
      </div>

      {chapter.comprehension && (
        <StoryComprehension
          key={chapter.id}
          activity={chapter.comprehension}
          paragraphs={chapter.paragraphs}
          session={
            practice && practice.index < chapter.comprehension.exercises.length
              ? practice
              : undefined
          }
          onChange={(session) =>
            repository.update((data) =>
              updateStoryProgress(data, story.id, (current) =>
                current && current.run.id === runId
                  ? updateReadingChapter(current, chapter.id, (saved) => ({
                      ...saved,
                      practice: session,
                    }))
                  : current,
              ),
            )
          }
        />
      )}

      <nav
        aria-label="Navegação entre capítulos"
        className="flex flex-wrap gap-2 border-t border-plum/20 pt-4"
      >
        {previous && (
          <Button asChild variant="secondary">
            <Link to={getStoryPath(story.id, previous.id)}>
              Capítulo anterior
            </Link>
          </Button>
        )}
        {next ? (
          <Button asChild>
            <Link to={getStoryPath(story.id, next.id)}>Próximo capítulo</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to={storiesPath}>Voltar à biblioteca</Link>
          </Button>
        )}
      </nav>
    </article>
  )
}
