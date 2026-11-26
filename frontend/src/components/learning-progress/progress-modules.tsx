import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/utils'
import {
  selectGamesReport,
  selectLessonReport,
  selectNotebookReport,
  selectPracticalReport,
  selectStoryReport,
} from '@/services/learning-reports'
import type { selectLearningAnalytics } from '@/services/learning-analytics'
import type { StudyDateRange } from '@/types/learning-analytics'
import type { VocabularyAnnotation } from '@/types/notebook'
import type { LearnerProgress } from '@/types/progress'
import { LessonReport, StoryReport } from './reports/lesson-and-story-reports'
import { NotebookReport } from './reports/notebook-report'
import { GamesReport, PracticalReport } from './reports/practice-reports'

const labels = {
  lessons: 'Aulas',
  stories: 'Histórias',
  games: 'Jogos',
  practical: 'Inglês na prática',
  notebook: 'Meu caderno',
}

type ReportKey = keyof typeof labels

export function ProgressModules({
  analytics,
  data,
  range,
  today,
  ids,
  annotations,
}: {
  analytics: ReturnType<typeof selectLearningAnalytics>
  data: LearnerProgress
  range: StudyDateRange
  today: string
  ids: readonly string[]
  annotations: ReadonlyMap<string, VocabularyAnnotation>
}) {
  const [selection, setSelection] = useState<ReportKey>()
  const { period } = analytics
  return (
    <section
      aria-labelledby="progress-modules"
      className="space-y-3 border-t border-plum/20 pt-4"
    >
      <h3 id="progress-modules" className="text-xl font-semibold">
        Relatórios por módulo
      </h3>
      <p className="text-sm">
        Os relatórios seguem o período acima para atividades com data. Os totais
        acumulados e as informações atuais têm indicação própria.
      </p>
      <div
        role="group"
        aria-label="Escolher relatório"
        className="flex flex-wrap gap-2"
      >
        {(Object.keys(labels) as ReportKey[]).map((key) => (
          <Button
            key={key}
            variant={key === selection ? 'default' : 'secondary'}
            className={cn(
              'px-3 text-sm motion-reduce:transition-none',
              key === selection && 'underline underline-offset-4',
            )}
            aria-pressed={key === selection}
            aria-controls="module-report"
            onClick={() => setSelection(key)}
          >
            {labels[key]}
          </Button>
        ))}
      </div>
      <div
        id="module-report"
        role={selection ? 'region' : undefined}
        aria-labelledby={selection ? 'module-report-title' : undefined}
        className="min-w-0 space-y-3 [overflow-wrap:anywhere]"
      >
        {selection ? (
          <h4 id="module-report-title" className="text-xl font-semibold">
            Relatório de {labels[selection]}
          </h4>
        ) : (
          <p className="text-sm">
            Escolha um módulo para consultar seu percurso e revisitar
            atividades.
          </p>
        )}
        {selection === 'lessons' && (
          <LessonReport
            report={selectLessonReport(data, analytics, range, today)}
          />
        )}
        {selection === 'stories' && (
          <StoryReport
            report={selectStoryReport(data, analytics, range, today)}
          />
        )}
        {selection === 'games' && (
          <GamesReport report={selectGamesReport(period)} />
        )}
        {selection === 'practical' && (
          <PracticalReport report={selectPracticalReport(data, period)} />
        )}
        {selection === 'notebook' && (
          <NotebookReport
            report={selectNotebookReport(analytics)}
            ids={ids}
            annotations={annotations}
          />
        )}
      </div>
    </section>
  )
}
