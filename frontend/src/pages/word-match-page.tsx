import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { GameSessionConfirmation } from '@/components/games/game-session-confirmation'
import {
  WordMatchPlayer,
  type WordMatchSession,
} from '@/components/games/word-match-player'
import { WordMatchResults } from '@/components/games/word-match-results'
import { VocabularyGameSetup } from '@/components/games/vocabulary-game-setup'
import { wordMatchGame } from '@/data/games'
import { gamesPath, getGameSessionPath } from '@/data/navigation'
import { useGameCompletion } from '@/hooks/use-game-completion'
import { createGameSessionId } from '@/services/game-history'
import { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import { useGameVocabulary } from '@/hooks/use-game-vocabulary'
import {
  generateWordMatchRounds,
  wordMatchRoundCount,
} from '@/services/word-match-content'
import type { VocabularySource } from '@/types/game'
import type { WordMatchResult } from '@/types/word-match'

export function WordMatchPage() {
  const { search } = useLocation()
  const [source, setSource] = useState<VocabularySource>(() =>
    new URLSearchParams(search).get('fonte') === 'saved' ? 'saved' : 'mixed',
  )
  const [session, setSession] = useState<WordMatchSession | null>(null)
  const [result, setResult] = useState<WordMatchResult | null>(null)
  const [restart, setRestart] = useState(false)
  const { record, completed, persistence } = useGameCompletion(session?.id)
  const blocker = useGameSessionGuard(session !== null && !completed)
  const setupFocus = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!session && !result && setupFocus.current) {
      setupFocus.current = false
      heading.current?.focus()
    }
  }, [session, result])

  const pool = useGameVocabulary(wordMatchGame, source)

  function start(roundSize: number) {
    const setting = wordMatchGame.difficulties.find(
      (item) => item.roundSize === roundSize,
    )
    const rounds = generateWordMatchRounds(pool, roundSize)
    if (!setting || !rounds) return
    const startedAt = Date.now()
    setResult(null)
    setSession({
      id: createGameSessionId('word-match', startedAt),
      difficulty: setting.id,
      startedAt,
      source,
      rounds,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <title>Word Match | Mellow</title>
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
          Word Match
        </h1>
      </header>
      {session ? (
        <WordMatchPlayer
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
        <WordMatchResults
          result={result}
          onPlayAgain={() => {
            setupFocus.current = true
            setResult(null)
          }}
        />
      ) : (
        <VocabularyGameSetup
          difficulties={wordMatchGame.difficulties}
          description={`Você vai jogar ${wordMatchRoundCount} rodadas com vocabulário A1. A dificuldade define quantos pares aparecem de cada vez.`}
          source={source}
          onSource={setSource}
          poolSize={pool.length}
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
            restartDescription="Você começará três novas rodadas com a mesma fonte e dificuldade."
            onCancel={() => setRestart(false)}
            onConfirm={() => {
              setRestart(false)
              start(session.rounds[0].english.length)
            }}
          />
        )
      )}
    </div>
  )
}
