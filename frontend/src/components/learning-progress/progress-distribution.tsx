import { formatStudyTime } from '@/services/study-time'
import {
  studyCategoryLabels,
  type studyDistribution,
} from '@/services/study-visualizations'

const accents = {
  lessons: 'bg-plum',
  reading: 'bg-sage',
  lessonsAndReading: 'bg-plum',
  games: 'bg-lavender',
  simulations: 'bg-terracotta',
  flashcards: 'bg-plum/55',
}

export function ProgressDistribution({
  distribution,
  sharedTimeCombined,
}: {
  distribution: ReturnType<typeof studyDistribution>
  sharedTimeCombined: boolean
}) {
  const { total, categories } = distribution
  return (
    <section aria-labelledby="progress-distribution" className="space-y-3">
      <h3 id="progress-distribution" className="text-xl font-semibold">
        Distribuição do tempo ativo
      </h3>
      {total > 0 ? (
        <>
          <p className="text-sm">
            Total do período <strong>{formatStudyTime(total)}</strong>
          </p>
          <div
            aria-hidden="true"
            className="flex h-4 overflow-hidden rounded-md border border-plum/25"
          >
            {categories
              .filter(({ share }) => share > 0)
              .map(({ category, share }) => (
                <span
                  key={category}
                  className={accents[category]}
                  style={{ width: `${share}%` }}
                />
              ))}
          </div>
          <dl className="divide-y divide-plum/20 rounded-lg border border-plum/20 px-3">
            {categories.map(({ category, ms, percent }) => (
              <div
                key={category}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
              >
                <dt className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-3 shrink-0 rounded-sm border border-plum/30 ${accents[category]}`}
                  />
                  {studyCategoryLabels[category]}
                </dt>
                <dd className="font-bold">
                  {formatStudyTime(ms)} ·{' '}
                  {ms > 0 && percent === 0 ? '<1%' : `${percent}%`}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="text-sm">
          Não há tempo registrado para distribuir neste período.
        </p>
      )}
      {sharedTimeCombined && (
        <p className="text-sm">
          O histórico diário registra aulas e leitura de histórias juntas. A
          separação aparece no total de toda a atividade quando os registros são
          compatíveis.
        </p>
      )}
    </section>
  )
}
