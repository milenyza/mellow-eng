import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import {
  StoryChapter,
  type StorySpeed,
} from '@/components/stories/story-chapter'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/utils'
import { getStoryPath, storiesPath } from '@/data/navigation'
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
  const [size, setSize] = useState<(typeof readingSizes)[number]>(
    readingSizes[0],
  )
  const [translations, setTranslations] = useState(false)
  const [speed, setSpeed] = useState<StorySpeed>(1)
  const sizeId = useId()
  const chapter = story.chapters[chapterIndex]
  const previous = story.chapters[chapterIndex - 1]
  const next = story.chapters[chapterIndex + 1]
  const hasTranslation = chapter.paragraphs.some(({ translation }) =>
    Boolean(translation),
  )

  return (
    <article className="mx-auto max-w-2xl space-y-6 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <header className="space-y-4 border-b border-plum/20 pb-5">
        <Link
          to={storiesPath}
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        >
          Voltar à biblioteca
        </Link>
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
            lang="en"
            className="mt-1 font-heading text-2xl leading-tight font-semibold sm:text-3xl"
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
                onChange={(event) =>
                  setSize(
                    readingSizes.find(({ id }) => id === event.target.value) ??
                      readingSizes[0],
                  )
                }
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
                checked={translations}
                onChange={(event) => setTranslations(event.target.checked)}
                className="size-4 shrink-0 accent-plum"
              />
              Mostrar traduções
            </label>
          )}
        </div>
        <StoryChapter
          key={chapter.id}
          chapter={chapter}
          translations={translations}
          readingClass={cn('font-heading leading-relaxed', size.className)}
          speed={speed}
          setSpeed={setSpeed}
        />
      </section>

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
