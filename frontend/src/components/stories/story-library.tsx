import { BookOpen, ChevronDown, Search } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getStoryPath } from '@/data/navigation'
import { resolveReadingChapter } from '@/services/reading-progress'
import type { ReadingProgress, ReadingStatus } from '@/types/progress'
import { StoryCard } from '@/components/stories/story-card'
import { Button } from '@/components/ui/button'
import { storyGenreLabels } from '@/data/stories'
import { filterStories, type StoryFilters } from '@/services/story-library'
import type { Story } from '@/types/story'

const emptyFilters: StoryFilters = { title: '', level: '', genre: '' }
const statusOptions: readonly { id: ReadingStatus; label: string }[] = [
  { id: 'not-started', label: 'Não iniciadas' },
  { id: 'in-progress', label: 'Em andamento' },
  { id: 'completed', label: 'Concluídas' },
]
const controlClass =
  'min-h-11 w-full min-w-0 rounded-md border border-border bg-background text-base text-foreground'

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} appearance-none py-2 pr-9 pl-3 forced-colors:appearance-auto`}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 forced-colors:hidden"
        />
      </div>
    </div>
  )
}

export function StoryLibrary({
  stories,
  progress = {},
}: {
  stories: readonly Story[]
  progress?: ReadingProgress['stories']
}) {
  const [filters, setFilters] = useState(emptyFilters)
  const input = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const levels = [...new Set(stories.map(({ level }) => level))].sort()
  const genres = [...new Set(stories.flatMap(({ genres }) => genres))].sort(
    (left, right) =>
      storyGenreLabels[left].localeCompare(storyGenreLabels[right], 'pt-BR'),
  )
  const matches = filterStories(stories, filters, progress)
  const hasFilters = Boolean(
    filters.title || filters.level || filters.genre || filters.status,
  )

  const ongoing = stories.flatMap((story) => {
    const record = progress[story.id]
    if (
      story.publication !== 'available' ||
      !record ||
      story.chapters.every(
        ({ id }) => record.run.chapters[id]?.readAt !== undefined,
      )
    )
      return []
    return [{ story, chapter: resolveReadingChapter(story, record) }]
  })

  if (stories.length === 0) {
    return (
      <div className="rounded-lg bg-lavender/45 p-5">
        <h2 className="font-heading text-xl font-semibold">
          A coleção está sendo preparada
        </h2>
        <p className="mt-2">
          As histórias aparecerão aqui quando seus roteiros estiverem prontos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28 max-md:[&_summary]:scroll-mb-28">
      {ongoing.length > 0 && (
        <section
          aria-labelledby="continue-reading"
          className="space-y-3 rounded-lg border border-plum/20 p-4"
        >
          <h2
            id="continue-reading"
            className="font-heading text-xl font-semibold"
          >
            Continuar lendo
          </h2>
          <ul className="space-y-2">
            {ongoing.map(({ story, chapter }) => (
              <li key={story.id}>
                <Link
                  className="inline-flex min-h-11 flex-wrap items-baseline gap-x-2 rounded-sm py-2 underline underline-offset-4"
                  to={getStoryPath(story.id, chapter.id)}
                >
                  <span lang="en" className="font-bold">
                    {story.title}
                  </span>
                  <span lang="en" className="text-sm">
                    {chapter.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div
        role="search"
        aria-label="Filtrar histórias"
        className="grid gap-3 rounded-lg bg-sage/65 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(0,1fr))] lg:gap-4"
      >
        <div className="min-w-0 space-y-1.5 sm:col-span-2 xl:col-span-1">
          <label htmlFor={titleId} className="block text-sm font-bold">
            Buscar por título
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              id={titleId}
              ref={input}
              type="search"
              value={filters.title}
              onChange={(event) =>
                setFilters({ ...filters, title: event.target.value })
              }
              className={`${controlClass} py-2 pr-3 pl-9`}
            />
          </div>
        </div>
        <FilterSelect
          label="Nível CEFR"
          value={filters.level}
          onChange={(value) =>
            setFilters({
              ...filters,
              level: levels.find((level) => level === value) ?? '',
            })
          }
        >
          <option value="">Todos os níveis</option>
          {levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Gênero"
          value={filters.genre}
          onChange={(value) =>
            setFilters({
              ...filters,
              genre: genres.find((genre) => genre === value) ?? '',
            })
          }
        >
          <option value="">Todos os gêneros</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {storyGenreLabels[genre]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Estado da leitura"
          value={filters.status ?? ''}
          onChange={(value) =>
            setFilters({
              ...filters,
              status: statusOptions.find(({ id }) => id === value)?.id ?? '',
            })
          }
        >
          <option value="">Todos os estados</option>
          {statusOptions.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </FilterSelect>
      </div>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-plum/20 pb-2">
        <p role="status" aria-atomic="true" className="text-sm font-bold">
          {matches.length} {matches.length === 1 ? 'história' : 'histórias'}
        </p>
        {hasFilters && (
          <Button
            variant="secondary"
            onClick={() => {
              setFilters(emptyFilters)
              input.current?.focus()
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      {matches.length > 0 ? (
        <ul className="grid items-start gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((story) => (
            <li key={story.id}>
              <StoryCard story={story} progress={progress[story.id]} />
            </li>
          ))}
        </ul>
      ) : (
        <section
          aria-labelledby="sem-historias"
          className="rounded-lg bg-lavender/45 p-5"
        >
          <BookOpen aria-hidden="true" className="mb-3 size-5" />
          <h2 id="sem-historias" className="font-heading text-xl font-semibold">
            Nenhuma história encontrada
          </h2>
          <p className="mt-2">
            Tente outro título ou limpe os filtros para ver a coleção completa.
          </p>
        </section>
      )}
    </div>
  )
}
