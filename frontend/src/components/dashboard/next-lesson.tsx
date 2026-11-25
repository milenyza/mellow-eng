import { BookOpen, Clock } from 'lucide-react'
import { Link } from 'react-router'
import notebook from '@/assets/curriculum-notebook.svg'
import { LessonStatusBadge } from '@/components/curriculum/lesson-status-badge'
import { Button } from '@/components/ui/button'
import { getLessonPath, lessonsPath } from '@/data/navigation'
import type { NextLessonData } from '@/types/dashboard'

export function NextLesson({ lesson }: { lesson?: NextLessonData }) {
  if (!lesson) {
    return (
      <section
        aria-labelledby="proxima-aula"
        className="rounded-xl bg-lavender p-5 sm:p-7"
      >
        <h2 id="proxima-aula" className="text-lg font-semibold">
          Próxima aula
        </h2>
        <p className="mt-3 leading-relaxed">
          Você já concluiu as aulas publicadas. O roteiro do curso mostra o que
          vem a seguir.
        </p>
        <Button asChild className="mt-4">
          <Link to={lessonsPath}>Ver roteiro de aulas</Link>
        </Button>
      </section>
    )
  }

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
          src={notebook}
          width={222}
          height={164}
          className="mx-auto h-auto w-full max-w-52"
        />
        <p className="col-span-2 max-w-prose leading-relaxed">
          {lesson.description}
        </p>
      </div>
      <div className="mt-3">
        <LessonStatusBadge status={lesson.status} />
      </div>
      <Button asChild className="mt-5 min-h-12 w-full gap-2 px-5 sm:w-fit">
        <Link to={getLessonPath(lesson.id)}>
          <BookOpen aria-hidden="true" className="size-4 shrink-0" />
          {lesson.status === 'in-progress' ? 'Continuar aula' : 'Iniciar aula'}
        </Link>
      </Button>
    </section>
  )
}
