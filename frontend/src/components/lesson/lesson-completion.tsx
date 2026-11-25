import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ExerciseCorrection } from '@/components/exercise/exercise-correction'
import { RestartLesson } from '@/components/lesson/restart-lesson'
import { Button } from '@/components/ui/button'
import { getLessonPath, lessonsPath } from '@/data/navigation'
import { getLessonResults } from '@/services/lesson-progress'
import { formatStudyTime } from '@/services/study-time'
import type { AvailableLesson } from '@/types/curriculum'
import type { SubmissionMode } from '@/types/exercise'
import type { StudyRun } from '@/types/progress'

const accuracyLabels = {
  practice: 'Prática',
  listening: 'Escuta com áudio',
  'text-alternative': 'Alternativa em texto',
  'no-audio': 'Escuta sem reprodução completa registrada',
} satisfies Record<SubmissionMode, string>

export function LessonCompletion({
  lesson,
  unitNumber,
  lessonNumber,
  language,
  run,
  nextLesson,
  onRestart,
}: {
  lesson: AvailableLesson
  unitNumber: number
  lessonNumber: number
  language: string
  run: StudyRun
  nextLesson?: AvailableLesson
  onRestart: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])

  const { reviewed, accuracy, mistakes } = getLessonResults(lesson, run)
  const accuracyRows = (
    Object.keys(accuracyLabels) as SubmissionMode[]
  ).flatMap((mode) => {
    const result = accuracy[mode]
    return result ? [{ ...result, label: accuracyLabels[mode] }] : []
  })

  return (
    <article className="mx-auto max-w-2xl space-y-6 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_summary]:scroll-mb-28">
      <header className="space-y-3 rounded-xl bg-sage p-5 sm:p-7">
        <p className="text-sm font-bold">
          Unidade {unitNumber} · Aula {lessonNumber}
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="w-fit rounded-sm text-3xl font-semibold sm:text-4xl"
        >
          Parabéns pela aula concluída!
        </h1>
        <p lang={language} className="font-heading text-xl font-semibold">
          {lesson.title}
        </p>
      </header>
      <section aria-labelledby="lesson-results" className="space-y-3">
        <h2 id="lesson-results" className="text-xl font-semibold">
          Resumo da primeira conclusão
        </h2>
        <dl className="grid gap-3 rounded-lg bg-lavender/50 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold">Atividades revisadas</dt>
            <dd className="font-heading text-2xl font-semibold">{reviewed}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold">Tempo de estudo ativo</dt>
            <dd className="font-heading text-2xl font-semibold">
              {formatStudyTime(run.activeMs)}
            </dd>
          </div>
        </dl>
        {accuracyRows.length > 0 && (
          <div>
            <h3 className="text-base font-semibold">
              Acertos na primeira tentativa
            </h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              {accuracyRows.map(({ label, correct, attempted }) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-plum/20 pb-1"
                >
                  <dt>{label}</dt>
                  <dd className="shrink-0 font-bold">
                    {correct} de {attempted}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
      <section aria-labelledby="covered-objectives">
        <h2 id="covered-objectives" className="text-xl font-semibold">
          Objetivos trabalhados
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {lesson.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>
      <details className="rounded-lg border border-plum/25 px-4">
        <summary className="min-h-11 cursor-pointer py-3 font-bold">
          Revisar erros
        </summary>
        {mistakes.length ? (
          <ul className="divide-y divide-plum/20 pb-3">
            {mistakes.map((exercise) => (
              <li key={exercise.id} className="space-y-1 py-3">
                <p className="font-bold">{exercise.prompt}</p>
                <ExerciseCorrection exercise={exercise} language={language} />
                <p className="text-sm">{exercise.feedback}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pb-3 text-sm">
            Nenhuma resposta incorreta foi registrada.
          </p>
        )}
      </details>
      <div className="flex flex-wrap gap-2">
        {nextLesson && (
          <Button asChild>
            <Link to={getLessonPath(nextLesson.id)}>Iniciar próxima aula</Link>
          </Button>
        )}
        <Button asChild variant={nextLesson ? 'secondary' : 'default'}>
          <Link to={lessonsPath}>Voltar ao catálogo</Link>
        </Button>
        <RestartLesson completed onRestart={onRestart} />
      </div>
    </article>
  )
}
