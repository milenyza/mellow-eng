import { lazy, Suspense, useState } from 'react'
import { recallRatings } from '@/data/flashcard-labels'
import { familiarityLabels } from '@/data/notebook-labels'
import {
  flashcardHistoryPath,
  flashcardsPath,
  notebookPath,
} from '@/data/navigation'
import type { selectNotebookReport } from '@/services/learning-reports'
import type { VocabularyAnnotation } from '@/types/notebook'
import { ReportDuration, ReportLink, ReportMetrics } from './report-elements'

const SuggestedReview = lazy(async () => ({
  default: (await import('@/components/notebook/suggested-review'))
    .SuggestedReview,
}))

export function NotebookReport({
  report,
  ids,
  annotations,
}: {
  report: ReturnType<typeof selectNotebookReport>
  ids: readonly string[]
  annotations: ReadonlyMap<string, VocabularyAnnotation>
}) {
  return (
    <div className="space-y-3">
      <h5 className="font-semibold">Vocabulário salvo e familiaridade atual</h5>
      <p className="text-sm">
        Palavras e expressões salvas · {report.saved}. Você escolhe a
        classificação de cada item no caderno.
      </p>
      {report.saved > 0 && (
        <ReportMetrics
          items={Object.entries(report.familiarity).map(([key, value]) => [
            familiarityLabels[key as keyof typeof familiarityLabels],
            value,
          ])}
        />
      )}
      <h5 className="font-semibold">Revisões com cartões no período</h5>
      <ReportMetrics
        items={[
          ['Sessões de cartões concluídas', report.reviews.sessions],
          ['Itens distintos revisados', report.reviews.vocabulary],
        ]}
      />
      <ReportDuration
        label="revisão com cartões"
        duration={report.reviews.activeMs}
      />
      {report.reviews.sessions > 0 ? (
        <>
          <p className="text-sm">
            Como você registrou sua lembrança dos itens nos cartões
          </p>
          <ReportMetrics
            items={Object.entries(report.reviews.recall).map(([key, value]) => [
              recallRatings[key as keyof typeof recallRatings],
              value,
            ])}
          />
        </>
      ) : (
        <p className="text-sm">
          Nenhuma revisão com cartões concluída neste período.
        </p>
      )}
      <div className="flex flex-wrap gap-x-4">
        <ReportLink to={notebookPath}>Abrir Meu caderno</ReportLink>
        <ReportLink to={flashcardsPath}>Praticar com cartões</ReportLink>
        <ReportLink to={flashcardHistoryPath}>
          Abrir histórico de revisões
        </ReportLink>
      </div>
      <NotebookSuggestions ids={ids} annotations={annotations} />
    </div>
  )
}

function NotebookSuggestions({
  ids,
  annotations,
}: {
  ids: readonly string[]
  annotations: ReadonlyMap<string, VocabularyAnnotation>
}) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className="rounded-lg border border-plum/20 px-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold">
        Ver sugestões de revisão
      </summary>
      {open && (
        <Suspense
          fallback={<p role="status">Carregando sugestões de revisão…</p>}
        >
          <SuggestedReview ids={ids} annotations={annotations} />
        </Suspense>
      )}
    </details>
  )
}
