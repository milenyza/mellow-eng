import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { formatStudyTime } from '@/services/study-time'
import type { collectPerformance } from '@/services/learning-analytics'
import type { SubmissionMode } from '@/types/exercise'

const modeLabels: Record<SubmissionMode, string> = {
  practice: 'Exercícios de prática',
  listening: 'Escuta com reprodução registrada',
  'text-alternative': 'Alternativa em texto',
  'no-audio': 'Escuta sem reprodução completa registrada',
}

export function ReportLink({
  to,
  children,
  lang,
}: {
  to: string
  children: ReactNode
  lang?: string
}) {
  return (
    <Link
      to={to}
      lang={lang}
      className="inline-flex min-h-11 max-w-full items-center rounded-sm text-sm font-bold underline underline-offset-4"
    >
      {children}
    </Link>
  )
}

export function ReportMetrics({
  items,
}: {
  items: readonly (readonly [string, ReactNode])[]
}) {
  return (
    <dl className="grid gap-2 rounded-lg bg-lavender/35 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-sm">{label}</dt>
          <dd className="font-heading text-lg font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ReportDuration({
  duration,
  label,
}: {
  duration?: number
  label: string
}) {
  return duration === undefined ? (
    <p className="text-sm">
      Tempo de {label} indisponível separadamente neste recorte. Consulte a
      categoria Aulas e leitura na distribuição do tempo ativo.
    </p>
  ) : (
    <p className="text-sm">
      Tempo ativo estimado de {label} ·{' '}
      <strong>{formatStudyTime(duration)}</strong>
    </p>
  )
}

export function ExerciseReport({
  practice,
  showModes = false,
}: {
  practice: ReturnType<typeof collectPerformance>
  showModes?: boolean
}) {
  if (!practice.submissions && !practice.corrections) {
    return (
      <p className="text-sm">
        Nenhuma resposta ou correção com data registrada no período.
      </p>
    )
  }
  return (
    <div className="space-y-2">
      <ReportMetrics
        items={[
          ['Respostas enviadas', practice.submissions],
          [
            'Exercícios resolvidos com resposta correta',
            practice.independentlyCorrect,
          ],
          ['Correções revisadas', practice.corrections],
        ]}
      />
      {practice.attempted ? (
        <div className="space-y-1 text-sm">
          {showModes ? (
            <ul className="list-disc space-y-1 pl-5">
              {Object.entries(practice.byMode).map(([mode, counts]) => (
                <li key={mode}>
                  {modeLabels[mode as SubmissionMode]} · {counts.correct} de{' '}
                  {counts.attempted} primeiras respostas corretas
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {practice.correct} de {practice.attempted} primeiras respostas
              corretas
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm">
          Sem primeiras respostas registradas neste período.
        </p>
      )}
    </div>
  )
}
