import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { validCustomStudyRange } from '@/services/study-calendar'
import { studyPeriods } from '@/data/study-period-labels'
import type { StudyDateRange, StudyPeriod } from '@/types/learning-analytics'

const field =
  'block min-h-11 w-full min-w-0 rounded-md border border-plum/45 bg-cream px-2 py-2 text-base'

export function StudyPeriodFilter({
  today,
  onApply,
}: {
  today: string
  onApply: (preset: StudyPeriod, range?: StudyDateRange) => void
}) {
  const [preset, setPreset] = useState<StudyPeriod>('all')
  const [draft, setDraft] = useState<StudyDateRange>({})
  const [error, setError] = useState(false)

  return (
    <form
      noValidate
      className="min-w-0 space-y-3 rounded-xl bg-lavender/45 p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (preset !== 'custom') return
        const valid = validCustomStudyRange(draft, today)
        setError(!valid)
        if (valid) onApply(preset, draft)
      }}
    >
      <label className="block max-w-sm space-y-1 text-sm font-bold">
        Período de estudo
        <select
          className={field}
          value={preset}
          onChange={(event) => {
            const selected = event.target.value as StudyPeriod
            setPreset(selected)
            setError(false)
            if (selected !== 'custom') onApply(selected)
          }}
        >
          {Object.entries(studyPeriods).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {preset === 'custom' && (
        <>
          <p id="progress-date-help" className="text-sm">
            Use uma ou duas datas até hoje. As datas escolhidas estão incluídas.
          </p>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {(['from', 'to'] as const).map((boundary) => (
              <label
                key={boundary}
                className="min-w-0 space-y-1 text-sm font-bold"
              >
                {boundary === 'from' ? 'Data inicial' : 'Data final'}
                <input
                  className={field}
                  type="date"
                  min="0001-01-01"
                  max={today}
                  value={draft[boundary] ?? ''}
                  aria-describedby={
                    error
                      ? 'progress-date-help progress-date-error'
                      : 'progress-date-help'
                  }
                  aria-invalid={error || undefined}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      [boundary]: event.target.value || undefined,
                    })
                    setError(false)
                  }}
                />
              </label>
            ))}
          </div>
          {error && (
            <p id="progress-date-error" role="alert" className="text-sm">
              Confira as datas. Informe pelo menos uma data até hoje. A data
              final deve ser igual ou posterior à inicial.
            </p>
          )}
          <Button type="submit">Aplicar período</Button>
        </>
      )}
    </form>
  )
}
