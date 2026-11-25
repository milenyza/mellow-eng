import { BookOpen, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { getLessonPath } from '@/data/navigation'
import notebook from '@/assets/curriculum-notebook.svg'
import { LessonStatusBadge } from '@/components/curriculum/lesson-status-badge'
import { Button } from '@/components/ui/button'
import type { getCurriculumOverview } from '@/services/curriculum'
import type { CefrCode } from '@/types/curriculum'

export function CurriculumOverview({
  level,
  language,
  overview,
  onShowUnit,
}: {
  level: CefrCode
  language: string
  overview: ReturnType<typeof getCurriculumOverview>
  onShowUnit: () => void
}) {
  const { completedCount, totalCount, recommended } = overview
  const percent = totalCount
    ? Math.floor((completedCount * 100) / totalCount)
    : 0

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <section aria-labelledby="curso-atual" className="rounded-xl bg-sage p-5">
        <h2
          id="curso-atual"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <BookOpen aria-hidden="true" className="size-5" /> Inglês · {level}
        </h2>
        <p className="mt-1 text-sm">Nível do CEFR</p>
        <label
          htmlFor="progresso-curriculo"
          className="mt-5 block text-sm font-bold"
        >
          Progresso no nível
        </label>
        <p className="mt-1">
          <strong className="text-xl tabular-nums">{completedCount}</strong> de{' '}
          {totalCount} aulas concluídas · {percent}%
        </p>
        <progress
          id="progresso-curriculo"
          max={totalCount || 1}
          value={completedCount}
          className="mt-3 block h-2 w-full appearance-none overflow-hidden rounded-full bg-cream [&::-moz-progress-bar]:bg-plum [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:bg-plum forced-colors:appearance-auto"
        />
      </section>
      {recommended && (
        <section
          aria-labelledby="aula-recomendada"
          className="relative rounded-xl bg-lavender p-5"
        >
          <h2 id="aula-recomendada" className="text-lg font-semibold">
            Próxima aula recomendada
          </h2>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div>
              <p className="text-sm font-bold">
                Unidade {recommended.unitNumber}
              </p>
              <p
                lang={language}
                className="mt-1 font-heading text-xl leading-snug font-semibold"
              >
                {recommended.lesson.title}
              </p>
            </div>
            <img
              src={notebook}
              width={222}
              height={164}
              alt=""
              className="h-auto w-16 sm:w-25"
            />
          </div>
          <p className="mt-2 leading-relaxed">
            {recommended.lesson.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold">
              <Clock aria-hidden="true" className="size-4" />
              {recommended.lesson.durationMinutes} min
            </span>
            <LessonStatusBadge status={recommended.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {recommended.lesson.availability === 'available' && (
              <Button asChild className="scroll-mb-28">
                <Link to={getLessonPath(recommended.lesson.id)}>
                  Iniciar aula
                </Link>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onShowUnit}
              className="scroll-mb-28"
            >
              Ver unidade
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
