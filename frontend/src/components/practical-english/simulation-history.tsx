import { SessionDate } from '@/components/ui/session-date'
import { countSimulationAttempts } from '@/services/simulation-progress'
import { formatStudyTime } from '@/services/study-time'
import type { CompletedSimulationSession } from '@/types/simulation-progress'

export function SimulationHistory({
  history,
}: {
  history: readonly CompletedSimulationSession[]
}) {
  if (!history.length) return null

  return (
    <section
      aria-labelledby="simulation-history-title"
      className="space-y-2 border-t border-plum/20 pt-4"
    >
      <h2 id="simulation-history-title" className="text-xl font-semibold">
        Histórico de sessões
      </h2>
      <p className="text-sm">
        Última realização em <SessionDate timestamp={history[0].completedAt} />
      </p>
      <details className="rounded-lg border border-plum/20 px-3">
        <summary className="min-h-11 cursor-pointer rounded-sm py-2.5 font-bold">
          Ver sessões concluídas ({history.length})
        </summary>
        <ol
          aria-label="Sessões da mais recente à mais antiga"
          className="divide-y divide-plum/20"
        >
          {history.map((session) => {
            const { total, correct, incorrect } = countSimulationAttempts(
              session.attempts,
            )
            return (
              <li key={session.sessionId} className="space-y-1 py-3">
                <p className="font-bold">
                  <SessionDate timestamp={session.completedAt} />
                </p>
                <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt>Tentativas</dt>
                    <dd className="font-bold">{total}</dd>
                  </div>
                  <div>
                    <dt>Acertos</dt>
                    <dd className="font-bold">{correct}</dd>
                  </div>
                  <div>
                    <dt>Erros</dt>
                    <dd className="font-bold">{incorrect}</dd>
                  </div>
                  <div>
                    <dt>Tempo ativo</dt>
                    <dd className="font-bold">
                      {formatStudyTime(session.activeMs)}
                    </dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      </details>
    </section>
  )
}
