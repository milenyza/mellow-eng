import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { GameSessionConfirmation } from '@/components/games/game-session-confirmation'
import {
  MemoryGamePlayer,
  type MemoryGameSession,
} from '@/components/games/memory-game-player'
import { MemoryGameResults } from '@/components/games/memory-game-results'
import { VocabularyGameSetup } from '@/components/games/vocabulary-game-setup'
import { memoryGame } from '@/data/games'
import { gamesPath, getGameSessionPath } from '@/data/navigation'
import { useGameCompletion } from '@/hooks/use-game-completion'
import { createGameSessionId } from '@/services/game-history'
import { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import { useGameVocabulary } from '@/hooks/use-game-vocabulary'
import { generateMemoryBoard } from '@/services/memory-board'
import type { VocabularySource } from '@/types/game'
import type { MemoryGameResult } from '@/types/memory-game'

export function MemoryGamePage() {
  const { search } = useLocation()
  const [source, setSource] = useState<VocabularySource>(() =>
    new URLSearchParams(search).get('fonte') === 'saved' ? 'saved' : 'mixed',
  )
  const [session, setSession] = useState<MemoryGameSession | null>(null)
  const [result, setResult] = useState<MemoryGameResult | null>(null)
  const [restart, setRestart] = useState(false)
  const { record, completed, persistence } = useGameCompletion(session?.id)
  const blocker = useGameSessionGuard(session !== null && !completed)
  const heading = useRef<HTMLHeadingElement>(null)
  const setupFocus = useRef(false)
  const pool = useGameVocabulary(memoryGame, source)

  useEffect(() => {
    if (!session && !result && setupFocus.current) {
      setupFocus.current = false
      heading.current?.focus()
    }
  }, [session, result])

  function start(pairCount: number) {
    const setting = memoryGame.difficulties.find(
      ({ roundSize }) => roundSize === pairCount,
    )
    if (!setting) return
    const board = generateMemoryBoard(pool, pairCount)
    if (!board) return
    const startedAt = Date.now()
    setResult(null)
    setSession({
      id: createGameSessionId('memory-game', startedAt),
      difficulty: setting.id,
      startedAt,
      source,
      board,
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <title>Memory Game | Mellow</title>
      <header className="space-y-3 border-b border-plum/20 pb-4">
        <Link
          to={gamesPath}
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        >
          Voltar aos jogos
        </Link>
        <h1
          ref={heading}
          tabIndex={-1}
          lang="en"
          className="w-fit text-4xl font-semibold"
        >
          Memory Game
        </h1>
      </header>
      {session ? (
        <MemoryGamePlayer
          key={session.id}
          session={session}
          onRestart={() => setRestart(true)}
          onComplete={record}
          onFinish={(summary) => {
            setSession(null)
            setResult(summary)
          }}
        />
      ) : result ? (
        <MemoryGameResults
          result={result}
          onPlayAgain={() => {
            setupFocus.current = true
            setResult(null)
          }}
        />
      ) : (
        <VocabularyGameSetup
          difficulties={memoryGame.difficulties}
          description="Encontre os pares de vocabulário A1 em um único tabuleiro. Você decide quando virar as cartas de volta."
          source={source}
          onSource={setSource}
          poolSize={pool.length}
          showCardCount
          onStart={start}
        />
      )}
      {result && (
        <p className="text-sm">
          {persistence === 'unavailable' ? (
            'O navegador não conseguiu salvar a sessão. O resultado está disponível nesta aba.'
          ) : (
            <Link
              className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
              to={getGameSessionPath(result.sessionId)}
            >
              Ver sessão no histórico
            </Link>
          )}
        </p>
      )}
      {blocker.state === 'blocked' ? (
        <GameSessionConfirmation
          action="leave"
          onCancel={blocker.reset}
          onConfirm={blocker.proceed}
        />
      ) : (
        restart &&
        session && (
          <GameSessionConfirmation
            action="restart"
            restartDescription="As cartas serão embaralhadas novamente com a mesma fonte e dificuldade."
            onCancel={() => setRestart(false)}
            onConfirm={() => {
              setRestart(false)
              start(session.board.vocabulary.length)
            }}
          />
        )
      )}
    </div>
  )
}
