import { ChevronDown } from 'lucide-react'
import type { Ref } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { getLessonPath } from '@/data/navigation'
import { LessonStatusBadge } from '@/components/curriculum/lesson-status-badge'
import { getLessonStatus } from '@/services/curriculum'
import type { LearnerProgress } from '@/types/progress'
import type { CurriculumUnit } from '@/types/curriculum'

export function UnitDisclosure({
  unit,
  number,
  language,
  lessonProgress,
  ref,
}: {
  unit: CurriculumUnit
  number: number
  language: string
  lessonProgress: LearnerProgress['lessons']
  ref?: Ref<HTMLDetailsElement>
}) {
  return (
    <details ref={ref} className="group/unit border-b border-plum/20">
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-sm px-1 py-4 hover:bg-lavender/50 focus-visible:outline-offset-[-2px] sm:items-center sm:gap-4 sm:px-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender text-sm font-bold tabular-nums"
        >
          {String(number).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="sr-only">Unidade {number}. </span>
          <span
            lang={language}
            className="block font-heading text-lg leading-snug font-semibold"
          >
            {unit.title}
          </span>
          <span className="mt-1 block text-sm">
            {unit.focus} · {unit.lessons.length} aulas
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 group-open/unit:rotate-180 sm:mt-0"
        />
      </summary>
      <ul className="ml-3 divide-y divide-plum/15 border-l border-plum/20 pb-2 pl-3 sm:ml-7 sm:pl-5">
        {unit.lessons.map((lesson) => (
          <li key={lesson.id}>
            <details className="group/lesson">
              <summary className="flex cursor-pointer list-none items-start gap-2 rounded-sm px-1 py-3 hover:bg-lavender/40 focus-visible:outline-offset-[-2px] sm:px-2 [&::-webkit-details-marker]:hidden">
                <span className="grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3">
                  <span
                    lang={language}
                    className="col-span-2 font-bold sm:col-span-1"
                  >
                    {lesson.title}
                  </span>
                  <span className="text-sm tabular-nums">
                    {lesson.durationMinutes} min
                  </span>
                  <LessonStatusBadge
                    status={getLessonStatus(lesson, lessonProgress[lesson.id])}
                  />
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 group-open/lesson:rotate-180"
                />
              </summary>
              <div className="space-y-2 px-2 pb-4 text-sm leading-relaxed">
                <p>{lesson.description}</p>
                <p>
                  <strong>Foco:</strong> {lesson.focus}
                </p>
                <p className="font-bold">Objetivos de aprendizagem</p>
                <ul className="list-disc space-y-1 pl-5">
                  {lesson.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
                {lesson.availability === 'available' && (
                  <Button asChild className="mt-2 scroll-mb-28">
                    <Link to={getLessonPath(lesson.id)}>
                      {lessonProgress[lesson.id]?.run.finishedAt !== undefined
                        ? 'Ver conclusão'
                        : lessonProgress[lesson.id]
                          ? 'Continuar aula'
                          : 'Abrir aula'}
                      <span lang={language} className="sr-only">
                        : {lesson.title}
                      </span>
                    </Link>
                  </Button>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </details>
  )
}
