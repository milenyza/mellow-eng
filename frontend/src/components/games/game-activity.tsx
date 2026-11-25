import { Link } from 'react-router'
import { GameHistoryList } from '@/components/games/game-history-list'
import { gameHistoryPath } from '@/data/navigation'
import { selectGameTotals } from '@/services/game-history'
import { formatStudyTime } from '@/services/study-time'
import type { CompletedGameSession } from '@/types/game-history'

export function GameActivity({
  history,
  compact = false,
  storageUnavailable = false,
}: {
  history: readonly CompletedGameSession[]
  compact?: boolean
  storageUnavailable?: boolean
}) {
  const totals = selectGameTotals(history)
  const recent = history.slice(0, compact ? 1 : 3)

  return (
    <section
      aria-labelledby="game-activity-heading"
      className="space-y-3 border-t border-plum/20 pt-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h2 id="game-activity-heading" className="text-2xl font-semibold">
          Prática em jogos
        </h2>
        <Link
          to={gameHistoryPath}
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        >
          Ver histórico de jogos
        </Link>
      </div>
      <dl className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg bg-lavender/50 p-4">
        <div>
          <dt className="text-sm font-bold">Sessões de jogo concluídas</dt>
          <dd className="font-heading text-2xl font-semibold">
            {totals.completed}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Tempo ativo em jogos</dt>
          <dd className="font-heading text-2xl font-semibold">
            {formatStudyTime(totals.activeMs)}
          </dd>
        </div>
        {!compact && (
          <div>
            <dt className="text-sm font-bold">
              Itens de vocabulário praticados
            </dt>
            <dd className="font-heading text-2xl font-semibold">
              {totals.uniqueVocabulary}
            </dd>
          </div>
        )}
      </dl>
      {storageUnavailable && (
        <p role="status" className="text-sm">
          O armazenamento está indisponível. Novas sessões ficam nesta aba.
        </p>
      )}
      {recent.length > 0 ? (
        <div>
          <h3 className="font-heading text-lg font-semibold">
            {compact ? 'Última sessão' : 'Sessões recentes'}
          </h3>
          <GameHistoryList history={recent} />
        </div>
      ) : (
        <p className="text-sm">Sua primeira sessão concluída aparecerá aqui.</p>
      )}
    </section>
  )
}
