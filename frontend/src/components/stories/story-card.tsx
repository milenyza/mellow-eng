import { BookOpen, ChevronDown, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { getStoryPath } from '@/data/navigation'
import { cn } from '@/components/utils'
import { storyGenreLabels } from '@/data/stories'
import type { Story } from '@/types/story'

export function StoryCard({ story }: { story: Story }) {
  const available = story.publication === 'available'
  const chapterCount = story.chapters.length

  return (
    <article className="min-w-0 border-b border-plum/20 pb-5">
      <div className="relative">
        <img
          src={story.cover}
          alt=""
          width={480}
          height={300}
          className="aspect-[8/5] w-full rounded-t-lg"
        />
        <span className="absolute bottom-3 left-3 rounded-md bg-cream px-2.5 py-1 text-sm font-extrabold">
          {story.level}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold">
          {story.genres.map((genre) => storyGenreLabels[genre]).join(' · ')}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs',
              available ? 'bg-sage' : 'bg-lavender',
            )}
          >
            {available ? 'Disponível' : 'Em breve'}
          </span>
        </p>
        <h2
          lang="en"
          className="font-heading text-xl leading-snug font-semibold sm:text-2xl"
        >
          {story.title}
        </h2>
        <p className="leading-relaxed">{story.description}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
          <li className="flex items-center gap-1.5">
            <BookOpen aria-hidden="true" className="size-4 shrink-0" />
            {chapterCount} {chapterCount === 1 ? 'capítulo' : 'capítulos'}
          </li>
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            {story.readingMinutes} min de leitura estimada
          </li>
        </ul>
      </div>
      {available && (
        <Button asChild className="mt-3">
          <Link to={getStoryPath(story.id)}>
            Ler história
            <span lang="en" className="sr-only">
              : {story.title}
            </span>
          </Link>
        </Button>
      )}
      <details className="group mt-3">
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm py-2 text-sm font-extrabold underline underline-offset-4 [&::-webkit-details-marker]:hidden">
          Prévia da história
          <span className="sr-only" lang="en">
            : {story.title}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 group-open:rotate-180"
          />
        </summary>
        <div className="space-y-4 border-l-2 border-terracotta py-2 pl-3">
          <div>
            <h3 className="font-heading text-base font-semibold">
              Objetivos de leitura
            </h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-relaxed">
              {story.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold">
              Roteiro dos capítulos
            </h3>
            <ol className="mt-1.5 list-decimal space-y-2.5 pl-4 text-sm leading-relaxed">
              {story.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <p lang="en" className="font-extrabold">
                    {chapter.title}
                  </p>
                  <p>{chapter.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </details>
    </article>
  )
}
