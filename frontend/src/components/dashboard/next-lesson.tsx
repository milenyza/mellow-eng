import { Clock, Play } from 'lucide-react'
import { Link } from 'react-router'
import coffeeNotebook from '@/assets/coffee-notebook.svg'
import { Button } from '@/components/ui/button'
import type { NextLessonData } from '@/types/dashboard'

export function NextLesson({ lesson }: { lesson: NextLessonData }) {
  return (
    <section
      aria-labelledby="proxima-aula"
      className="rounded-xl bg-lavender p-5 sm:p-7 xl:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="proxima-aula" className="text-lg font-semibold">
          Próxima aula
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-sm font-bold">
          <Clock aria-hidden="true" className="size-4" />
          {lesson.durationMinutes} min
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(4rem,30%)] items-center gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold">{lesson.unit}</p>
          <p
            lang="en"
            className="mt-1 font-heading text-2xl leading-tight font-semibold sm:text-3xl xl:text-4xl"
          >
            {lesson.title}
          </p>
        </div>
        <img
          alt=""
          src={coffeeNotebook}
          width={222}
          height={164}
          className="mx-auto h-auto w-full max-w-52"
        />
        <p className="col-span-2 max-w-prose leading-relaxed">
          {lesson.description}
        </p>
      </div>
      {lesson.progressPercent !== undefined && (
        <div className="mt-5">
          <label
            htmlFor="progresso-aula"
            className="flex flex-wrap justify-between gap-x-2 text-sm font-bold"
          >
            Progresso da aula <span>{lesson.progressPercent}%</span>
          </label>
          <progress
            id="progresso-aula"
            max={100}
            value={lesson.progressPercent}
            className="mt-2 block h-2 w-full appearance-none overflow-hidden rounded-full bg-cream [&::-moz-progress-bar]:bg-plum [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:bg-plum forced-colors:appearance-auto"
          />
        </div>
      )}
      <Button asChild className="mt-5 min-h-12 w-full gap-2 px-5 sm:w-fit">
        <Link to="/aulas">
          <Play aria-hidden="true" className="size-4 shrink-0" />
          Continuar aprendendo
        </Link>
      </Button>
    </section>
  )
}
