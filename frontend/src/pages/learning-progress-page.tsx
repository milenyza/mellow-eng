import { BookOpenCheck } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { ProgressCurriculum } from '@/components/learning-progress/progress-curriculum'
import { ProgressDistribution } from '@/components/learning-progress/progress-distribution'
import { ProgressMilestones } from '@/components/learning-progress/progress-milestones'
import { ProgressModules } from '@/components/learning-progress/progress-modules'
import { StudyCalendar } from '@/components/learning-progress/study-calendar'
import { StudyDurationChart } from '@/components/learning-progress/study-duration-chart'
import { StudyPeriodFilter } from '@/components/learning-progress/study-period-filter'
import { studyPeriods } from '@/data/study-period-labels'
import { englishA1Index } from '@/data/curriculum/english-a1-index'
import { useFavoriteWords } from '@/hooks/use-favorite-words'
import { useProgress } from '@/hooks/use-progress'
import { selectLearningAnalytics } from '@/services/learning-analytics'
import {
  aggregateStudyActivity,
  getStudyBounds,
  resolveStudyPeriod,
  describeStudyDates,
} from '@/services/study-calendar'
import { formatStudyTime, localStudyDay } from '@/services/study-time'
import {
  studyDistribution,
  studyInsights,
} from '@/services/study-visualizations'
import {
  getVocabularyAnnotations,
  subscribeVocabularyAnnotations,
} from '@/services/vocabulary-annotations'
import type { StudyDateRange, StudyPeriod } from '@/types/learning-analytics'

export function LearningProgressPage() {
  const { data, persistence } = useProgress()
  const favorites = useFavoriteWords()
  const annotations = useSyncExternalStore(
    subscribeVocabularyAnnotations,
    getVocabularyAnnotations,
  )
  const today = localStudyDay(new Date())
  const [filter, setFilter] = useState<{
    preset: StudyPeriod
    custom?: StudyDateRange
  }>({ preset: 'all' })
  const range = useMemo(
    () => resolveStudyPeriod(filter.preset, today, filter.custom),
    [filter, today],
  )
  const analytics = useMemo(
    () =>
      selectLearningAnalytics(
        data,
        englishA1Index,
        favorites.ids,
        annotations.records,
        range,
        today,
      ),
    [data, favorites.ids, annotations.records, range, today],
  )
  const { allTime, period } = analytics
  const bounds = getStudyBounds(range, period.daily, today)
  const distribution = studyDistribution(period)
  const chart = aggregateStudyActivity(period.daily, bounds)
  const insights = studyInsights(
    period.daily,
    distribution,
    analytics.calendar.daily,
    filter.preset !== 'all' && range.from && range.to ? bounds : undefined,
  )
  const completed = [
    ['Aulas concluídas', allTime.curriculum.completed],
    ['Histórias concluídas', allTime.reading.stories],
    ['Sessões de jogos concluídas', allTime.games.completed],
    ['Simulações distintas concluídas', allTime.simulations.distinct],
    ['Itens distintos revisados com cartões', allTime.flashcards.vocabulary],
  ] as const
  const hasDatedActivity = Boolean(
    period.activeDays ||
    period.recent.length ||
    period.lessonPerformance.attempted ||
    period.comprehension.attempted,
  )
  const hasProgress =
    completed.some(([, count]) => count > 0) ||
    hasDatedActivity ||
    allTime.reading.chapters > 0

  return (
    <div className="min-w-0 space-y-6 max-md:[&_a]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_summary]:scroll-mb-28">
      <title>Meu progresso | Mellow</title>
      <header className="space-y-2 border-b border-plum/20 pb-5">
        <p lang="en" className="flex items-center gap-2 font-bold">
          <BookOpenCheck aria-hidden="true" className="size-4" /> My progress
        </p>
        <h1 className="text-4xl leading-tight font-semibold">Meu progresso</h1>
        <p className="max-w-prose">
          Veja o tempo que você dedicou ao inglês e as atividades registradas no
          seu percurso.
        </p>
      </header>
      {persistence === 'unavailable' && (
        <p role="status">
          O armazenamento está indisponível. A página mostra os dados
          disponíveis nesta aba.
        </p>
      )}
      {persistence === 'recovered' && (
        <p role="status">Parte do progresso salvo não pôde ser recuperada.</p>
      )}
      <section aria-labelledby="progress-all-time" className="space-y-3">
        <h2 id="progress-all-time" className="text-2xl font-semibold">
          Seu percurso até aqui
        </h2>
        {!hasProgress && filter.preset === 'all' && (
          <p className="rounded-lg bg-sage/55 p-3">
            Seu percurso começa aos poucos. As atividades aparecerão aqui
            conforme você pratica.
          </p>
        )}
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-sage/45 p-4 sm:grid-cols-3">
          {completed.map(([label, count]) => (
            <div key={label} className="min-w-0">
              <dt className="text-sm">{label}</dt>
              <dd className="font-heading text-2xl font-bold">{count}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm">
          Esses totais consideram todo o histórico registrado neste navegador.
        </p>
      </section>
      <ProgressCurriculum curriculum={allTime.curriculum} />
      <section
        aria-labelledby="progress-period"
        className="space-y-4 border-t border-plum/20 pt-4"
      >
        <h2 id="progress-period" className="text-2xl font-semibold">
          Atividade por período
        </h2>
        <p className="text-sm">
          O filtro atualiza o tempo, a distribuição, os detalhes por atividade e
          os registros recentes. O percurso acumulado, os favoritos, a
          familiaridade atual e o calendário ficam disponíveis separadamente.
        </p>
        <StudyPeriodFilter
          today={today}
          onApply={(preset, custom) => setFilter({ preset, custom })}
        />
        <p role="status" className="text-sm">
          {studyPeriods[filter.preset]}
          {range.from &&
            range.to &&
            ` · ${describeStudyDates(range.from, range.to)}`}
          {range.from &&
            !range.to &&
            ` · desde ${describeStudyDates(range.from, range.from)}`}
          {!range.from &&
            range.to &&
            ` · até ${describeStudyDates(range.to, range.to)}`}
          {!hasDatedActivity && ' · Nenhum registro com data no período.'}
        </p>
        <dl className="grid gap-2 rounded-lg bg-terracotta/20 p-4 sm:grid-cols-3">
          <div>
            <dt>Tempo de estudo ativo</dt>
            <dd className="font-heading text-2xl font-bold">
              {formatStudyTime(period.activeMs)}
            </dd>
          </div>
          <div>
            <dt>Dias com estudo ativo</dt>
            <dd className="font-heading text-2xl font-bold">
              {period.activeDays}
            </dd>
          </div>
          <div>
            <dt>Média por dia com estudo ativo</dt>
            <dd className="font-heading text-2xl font-bold">
              {period.activeDays ? formatStudyTime(insights.averageMs) : '—'}
            </dd>
          </div>
        </dl>
        <StudyDurationChart
          key={JSON.stringify(range)}
          chart={chart}
          total={period.activeMs}
        />
        <ProgressDistribution
          distribution={distribution}
          sharedTimeCombined={
            analytics.limitations.splitUnavailable &&
            period.byModule.lessonsAndReading > 0
          }
        />
        {(insights.leading || insights.comparison) && (
          <section
            className="space-y-2 rounded-lg bg-sage/35 p-3"
            aria-labelledby="study-insights"
          >
            <h3 id="study-insights" className="text-xl font-semibold">
              Observações do período
            </h3>
            {insights.leading && (
              <p className="text-sm">
                Atividade com mais tempo registrado neste período:{' '}
                {insights.leading}.
              </p>
            )}
            {insights.comparison && (
              <p className="text-sm">
                Você registrou {formatStudyTime(period.activeMs)} neste período.
                Nos dias imediatamente anteriores, em um intervalo da mesma
                duração (
                {describeStudyDates(
                  insights.comparison.from,
                  insights.comparison.to,
                )}
                ), foram registrados{' '}
                {formatStudyTime(insights.comparison.previousMs)}.
              </p>
            )}
          </section>
        )}
        <ProgressModules
          analytics={analytics}
          data={data}
          range={range}
          today={today}
          ids={favorites.ids}
          annotations={annotations.records}
        />
        <ProgressMilestones events={period.recent} />
      </section>
      <StudyCalendar
        today={today}
        {...analytics.calendar}
        undatedChapters={analytics.limitations.undatedChapters}
      />
    </div>
  )
}
