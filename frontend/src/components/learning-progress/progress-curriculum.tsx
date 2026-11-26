import { Link } from 'react-router'
import { LessonStatusBadge } from '@/components/curriculum/lesson-status-badge'
import { getLessonPath, lessonsPath } from '@/data/navigation'
import type { selectCurriculumAnalytics } from '@/services/learning-analytics'

function CompletionMeasure({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total: number
}) {
  return (
    <div className="min-w-0 space-y-1">
      <h3 className="text-base font-semibold">{label}</h3>
      <p className="text-sm font-bold">
        {value} de {total}
      </p>
      {total > 0 && (
        <progress
          className="h-2 w-full accent-plum"
          aria-label={label}
          value={value}
          max={total}
        />
      )}
    </div>
  )
}

export function ProgressCurriculum({
  curriculum,
}: {
  curriculum: ReturnType<typeof selectCurriculumAnalytics>
}) {
  return (
    <section
      aria-labelledby="progress-curriculum"
      className="space-y-3 border-t border-plum/20 pt-4"
    >
      <h2
        id="progress-curriculum"
        tabIndex={-1}
        className="text-2xl font-semibold"
      >
        Currículo A1
      </h2>
      <div className="grid gap-4 rounded-xl bg-lavender/45 p-4 sm:grid-cols-3">
        <CompletionMeasure
          label="Aulas publicadas concluídas"
          value={curriculum.completed}
          total={curriculum.published}
        />
        <CompletionMeasure
          label="Conclusão no currículo completo"
          value={curriculum.completed}
          total={curriculum.total}
        />
        <CompletionMeasure
          label="Cobertura de publicação"
          value={curriculum.published}
          total={curriculum.total}
        />
      </div>
      <p className="text-sm">
        {curriculum.published} publicadas · {curriculum.planned} planejadas
      </p>
      <p className="text-sm">
        O percurso acompanha suas conclusões no Mellow. O nível A1 identifica o
        conteúdo do curso.
      </p>
      <details className="rounded-lg border border-plum/20 px-3">
        <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold">
          Ver progresso por unidade
        </summary>
        <ol className="divide-y divide-plum/20">
          {curriculum.units.map((unit, index) => (
            <li key={unit.id} className="py-1">
              <details>
                <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold">
                  <span>
                    Unidade {index + 1} · <span lang="en">{unit.title}</span>
                  </span>
                  {unit.titlePtBr && (
                    <span className="ml-1 text-sm font-normal">
                      · {unit.titlePtBr}
                    </span>
                  )}
                </summary>
                <div className="space-y-2 pb-3">
                  <p className="text-sm">{unit.focus}</p>
                  <p className="text-sm font-bold">
                    {unit.published === 0
                      ? 'Publicação em breve'
                      : unit.completed === unit.published
                        ? 'Todas as aulas publicadas concluídas'
                        : unit.inProgress || unit.completed
                          ? 'Unidade em andamento'
                          : 'Unidade disponível para começar'}
                  </p>
                  <p className="text-sm">
                    {unit.published} publicadas · {unit.planned} planejadas ·{' '}
                    {unit.completed} concluídas · {unit.ready + unit.inProgress}{' '}
                    publicadas a concluir
                  </p>
                  {unit.published > 0 && (
                    <progress
                      className="h-2 w-full accent-plum"
                      aria-label={`Aulas publicadas concluídas na unidade ${index + 1}`}
                      value={unit.completed}
                      max={unit.published}
                    />
                  )}
                  <h3 className="font-semibold">
                    Aulas e objetivos da unidade
                  </h3>
                  <ol className="space-y-3">
                    {unit.lessons.map(({ lesson, status }) => (
                      <li
                        key={lesson.id}
                        className="space-y-1 border-t border-plum/15 pt-2 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {status === 'planned' ? (
                            <strong lang="en">{lesson.title}</strong>
                          ) : (
                            <Link
                              className="inline-flex min-h-11 items-center rounded-sm font-bold underline underline-offset-4"
                              to={getLessonPath(lesson.id)}
                              lang="en"
                            >
                              {lesson.title}
                            </Link>
                          )}
                          <LessonStatusBadge status={status} />
                          {status === 'available' && <span>Por começar</span>}
                        </div>
                        <p>
                          {lesson.description} · {lesson.durationMinutes} min
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                          {lesson.objectives.map((objective) => (
                            <li key={objective}>{objective}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </li>
          ))}
        </ol>
      </details>
      <Link
        className="inline-flex min-h-11 items-center rounded-sm font-bold underline underline-offset-4"
        to={lessonsPath}
      >
        Abrir catálogo de aulas
      </Link>
    </section>
  )
}
