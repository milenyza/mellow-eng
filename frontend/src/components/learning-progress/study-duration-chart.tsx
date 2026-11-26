import { useId, useState } from 'react'
import { describeStudyDates } from '@/services/study-calendar'
import { formatStudyTime } from '@/services/study-time'
import type { StudyChart } from '@/types/learning-analytics'

const intervals = { day: 'dia', week: 'semana', month: 'mês' }

export function StudyDurationChart({
  chart,
  total,
}: {
  chart: StudyChart
  total: number
}) {
  const titleId = useId()
  const detailId = useId()
  const [selection, setSelection] = useState<string>()
  const { points, interval, sparse } = chart
  const selected = points.find(({ from }) => from === selection)
  const maximum = points.reduce((peak, { ms }) => Math.max(peak, ms), 0)

  return (
    <section aria-labelledby={titleId} className="min-w-0 space-y-3">
      <h3 id={titleId} className="text-xl font-semibold">
        Tempo de estudo ao longo do tempo
      </h3>
      {!total ? (
        <p className="rounded-lg bg-sage/35 p-3">
          Sem tempo de estudo registrado neste período.
        </p>
      ) : (
        <>
          <p className="text-sm">
            Tempo ativo estimado por {intervals[interval]}. As barras começam em
            zero e a maior representa {formatStudyTime(maximum)}.
            {sparse &&
              ' Neste intervalo longo, aparecem somente os meses com tempo registrado.'}
          </p>
          <ol className="divide-y divide-plum/15 rounded-lg border border-plum/20 px-2 sm:px-3">
            {points.map(({ from, to, ms }) => (
              <li key={from}>
                <button
                  type="button"
                  className="grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-sm px-1.5 py-2 text-left text-sm hover:bg-lavender/50 aria-pressed:bg-lavender sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_7rem]"
                  aria-controls={detailId}
                  aria-pressed={selected?.from === from}
                  onClick={() => setSelection(from)}
                >
                  <span>{describeStudyDates(from, to)}</span>
                  <span
                    aria-hidden="true"
                    className="col-span-2 row-start-2 h-2 w-full rounded-full bg-lavender/60 sm:col-span-1 sm:row-start-auto"
                  >
                    <span
                      className="block h-full rounded-full bg-plum/70"
                      style={{ width: `${(ms / maximum) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-bold">
                    {formatStudyTime(ms)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p id={detailId} role="status" className="text-sm">
            {selected
              ? `${describeStudyDates(selected.from, selected.to)} · ${selected.ms ? formatStudyTime(selected.ms) + ' de estudo ativo estimado' : 'Sem tempo registrado'}.`
              : 'Selecione uma data ou intervalo para consultar o valor.'}
          </p>
        </>
      )}
    </section>
  )
}
