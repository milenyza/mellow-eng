import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ActivityTimeline } from '@/components/activity-history/activity-timeline'
import { StudyPeriodFilter } from '@/components/learning-progress/study-period-filter'
import { Button } from '@/components/ui/button'
import { learningProgressPath } from '@/data/navigation'
import { useProgress } from '@/hooks/use-progress'
import {
  filterActivityHistory,
  selectActivityHistory,
} from '@/services/activity-history'
import {
  describeStudyDates,
  resolveStudyPeriod,
} from '@/services/study-calendar'
import { localStudyDay } from '@/services/study-time'
import type { ActivityModule } from '@/types/activity-history'
import type { StudyDateRange, StudyPeriod } from '@/types/learning-analytics'

const pageSize = 12
const modules = {
  lessons: 'Aulas',
  stories: 'Histórias',
  games: 'Jogos',
  practical: 'Inglês na prática',
  notebook: 'Meu caderno',
} satisfies Record<ActivityModule, string>

export function ActivityHistoryPage() {
  const { data, persistence } = useProgress()
  const today = localStudyDay(new Date())
  const [filter, setFilter] = useState<{
    preset: StudyPeriod
    custom?: StudyDateRange
  }>({ preset: 'all' })
  const [module, setModule] = useState<ActivityModule | ''>('')
  const [page, setPage] = useState(0)
  const history = useMemo(
    () => selectActivityHistory(data, today),
    [data, today],
  )
  const range = resolveStudyPeriod(filter.preset, today, filter.custom)
  const activities = filterActivityHistory(
    history.entries,
    range,
    module || undefined,
  )
  const lastPage = Math.max(0, Math.ceil(activities.length / pageSize) - 1)
  const currentPage = Math.min(page, lastPage)
  const offset = currentPage * pageSize

  return (
    <div className="min-w-0 space-y-5 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <title>Histórico de atividades | Mellow</title>
      <header className="space-y-2 border-b border-plum/20 pb-4">
        <Link
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
          to={learningProgressPath}
        >
          Voltar a Meu progresso
        </Link>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Histórico de atividades
        </h1>
        <p>
          Revisite aulas, histórias e sessões concluídas, organizadas pela data
          no seu calendário local.
        </p>
      </header>
      {persistence !== 'ready' && (
        <p role="status" className="text-sm">
          {persistence === 'unavailable'
            ? 'O armazenamento está indisponível. O histórico mostra os registros desta aba.'
            : 'Parte do progresso salvo não pôde ser recuperada.'}
        </p>
      )}
      <section aria-labelledby="activity-filters" className="space-y-3">
        <h2 id="activity-filters" className="text-xl font-semibold">
          Filtrar atividades
        </h2>
        <label className="block max-w-sm space-y-1 text-sm font-bold">
          Módulo
          <select
            className="block min-h-11 w-full min-w-0 rounded-md border border-plum/45 bg-cream px-2 py-2 text-base"
            value={module}
            onChange={(event) => {
              setModule(event.target.value as ActivityModule | '')
              setPage(0)
            }}
          >
            <option value="">Todos os módulos</option>
            {Object.entries(modules).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <StudyPeriodFilter
          today={today}
          onApply={(preset, custom) => {
            setFilter({ preset, custom })
            setPage(0)
          }}
        />
      </section>
      <p className="text-sm">
        O histórico reúne conclusões com data registrada.
        {history.undatedChapters > 0 &&
          ' Capítulos sem data disponível continuam nos totais de Histórias em Meu progresso.'}
      </p>
      <section aria-label="Resultados do histórico" className="space-y-4">
        <p role="status" className="text-sm">
          {activities.length
            ? `Mostrando ${offset + 1} a ${Math.min(offset + pageSize, activities.length)} de ${activities.length} registros.`
            : 'Nenhuma atividade com data registrada nos filtros escolhidos.'}
          {range.from &&
            range.to &&
            ` Período de ${describeStudyDates(range.from, range.to)}.`}
          {range.from &&
            !range.to &&
            ` Atividade desde ${describeStudyDates(range.from, range.from)}.`}
          {!range.from &&
            range.to &&
            ` Atividade até ${describeStudyDates(range.to, range.to)}.`}
        </p>
        {lastPage > 0 && (
          <nav
            aria-label="Páginas do histórico"
            className="flex flex-wrap gap-2"
          >
            <Button
              variant="secondary"
              aria-disabled={currentPage === 0}
              className="aria-disabled:opacity-60 motion-reduce:transition-none"
              onClick={() => {
                if (currentPage > 0) setPage(currentPage - 1)
              }}
            >
              Página anterior
            </Button>
            <Button
              variant="secondary"
              aria-disabled={currentPage === lastPage}
              className="aria-disabled:opacity-60 motion-reduce:transition-none"
              onClick={() => {
                if (currentPage < lastPage) setPage(currentPage + 1)
              }}
            >
              Próxima página
            </Button>
          </nav>
        )}
        <ActivityTimeline
          entries={activities.slice(offset, offset + pageSize)}
          today={today}
        />
      </section>
    </div>
  )
}
