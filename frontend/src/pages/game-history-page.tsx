import { Link, useParams, useSearchParams } from 'react-router'
import { GameHistoryList } from '@/components/games/game-history-list'
import { GameSessionDetail } from '@/components/games/game-session-detail'
import { difficultyLabels } from '@/data/game-labels'
import { games } from '@/data/games'
import { gameHistoryPath, gamesPath } from '@/data/navigation'
import { useProgress } from '@/hooks/use-progress'
import { selectGameHistory } from '@/services/game-history'

const filterClass =
  'min-h-11 w-full rounded-md border border-border bg-cream px-3 py-2'

export function GameHistoryPage() {
  const { data, persistence } = useProgress()
  const { sessionId } = useParams()
  const [query, setQuery] = useSearchParams()
  const history = selectGameHistory(data)
  const gameId = games.find(({ id }) => id === query.get('jogo'))?.id
  const difficulties = [
    ...new Set([
      ...games.flatMap(({ difficulties }) => difficulties.map(({ id }) => id)),
      ...history.map(({ difficulty }) => difficulty),
    ]),
  ]
  const difficulty = difficulties.find((id) => id === query.get('dificuldade'))
  const filtered = selectGameHistory(data, { gameId, difficulty })
  const current = history.find(({ sessionId: id }) => id === sessionId)
  const search = query.size ? `?${query.toString()}` : ''

  function filter(key: string, value: string) {
    setQuery(
      (previous) => {
        const updated = new URLSearchParams(previous)
        if (value) updated.set(key, value)
        else updated.delete(key)
        return updated
      },
      { replace: true },
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <title>Histórico de jogos | Mellow</title>
      <Link
        to={sessionId ? gameHistoryPath + search : gamesPath}
        className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
      >
        {sessionId ? 'Voltar ao histórico' : 'Voltar aos jogos'}
      </Link>
      {persistence === 'unavailable' && (
        <p role="status" className="text-sm">
          O armazenamento está indisponível. Novas sessões ficam nesta aba.
        </p>
      )}
      {sessionId ? (
        current ? (
          <GameSessionDetail session={current} />
        ) : (
          <h1 className="text-3xl font-semibold">Sessão não encontrada</h1>
        )
      ) : (
        <>
          <header className="space-y-2">
            <h1 className="text-4xl font-semibold">Histórico de jogos</h1>
            <p>
              Consulte suas sessões concluídas e retome o conteúdo que praticou.
            </p>
          </header>
          {history.length > 0 ? (
            <>
              <div className="grid gap-3 rounded-lg bg-lavender/45 p-4 sm:grid-cols-2">
                <label className="space-y-1 font-bold">
                  <span>Jogo</span>
                  <select
                    className={filterClass}
                    value={gameId ?? ''}
                    onChange={(event) => filter('jogo', event.target.value)}
                  >
                    <option value="">Todos os jogos</option>
                    {games.map(({ id, title }) => (
                      <option key={id} value={id} lang="en">
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 font-bold">
                  <span>Dificuldade</span>
                  <select
                    className={filterClass}
                    value={difficulty ?? ''}
                    onChange={(event) =>
                      filter('dificuldade', event.target.value)
                    }
                  >
                    <option value="">Todas as dificuldades</option>
                    {difficulties.map((id) => (
                      <option key={id} value={id}>
                        {difficultyLabels[id]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p role="status" className="text-sm font-bold">
                {filtered.length} {filtered.length === 1 ? 'sessão' : 'sessões'}
              </p>
              {filtered.length > 0 ? (
                <GameHistoryList history={filtered} search={search} />
              ) : (
                <p>
                  Nenhuma sessão corresponde aos filtros. Experimente outro jogo
                  ou dificuldade.
                </p>
              )}
            </>
          ) : (
            <p>
              Você ainda não concluiu uma sessão. Escolha um jogo para começar.
            </p>
          )}
        </>
      )}
    </div>
  )
}
