import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { GameSessionConfirmation } from '@/components/games/game-session-confirmation'
import {
  SentenceBuilderPlayer,
  type SentenceBuilderSession,
} from '@/components/games/sentence-builder-player'
import { SentenceBuilderResults } from '@/components/games/sentence-builder-results'
import { SentenceBuilderSetup } from '@/components/games/sentence-builder-setup'
import { englishCourse } from '@/data/curriculum/english-course'
import { gamesPath, getGameSessionPath } from '@/data/navigation'
import { sentenceChallenges } from '@/data/sentence-challenges'
import { stories } from '@/data/stories'
import { useGameCompletion } from '@/hooks/use-game-completion'
import { createGameSessionId } from '@/services/game-history'
import { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import {
  eligibleSentenceChallenges,
  generateSentenceSession,
  hasPublishedSentenceReference,
} from '@/services/sentence-challenges'
import type {
  SentenceBuilderResult,
  SentenceDifficulty,
  SentenceTopicSelection,
} from '@/types/sentence-builder'

const publishedChallenges = sentenceChallenges.filter((challenge) =>
  hasPublishedSentenceReference(challenge, englishCourse, stories),
)

export function SentenceBuilderPage() {
  const [topic, setTopic] = useState<SentenceTopicSelection>('mixed')
  const [session, setSession] = useState<SentenceBuilderSession | null>(null)
  const [result, setResult] = useState<SentenceBuilderResult | null>(null)
  const [restart, setRestart] = useState(false)
  const { record, completed, persistence } = useGameCompletion(session?.id)
  const blocker = useGameSessionGuard(session !== null && !completed)
  const heading = useRef<HTMLHeadingElement>(null)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (!session && !result && returnFocus.current) {
      returnFocus.current = false
      heading.current?.focus()
    }
  }, [session, result])

  const eligible = {
    easy: eligibleSentenceChallenges(publishedChallenges, topic, 'easy'),
    medium: eligibleSentenceChallenges(publishedChallenges, topic, 'medium'),
    hard: eligibleSentenceChallenges(publishedChallenges, topic, 'hard'),
  }

  function start(difficulty: SentenceDifficulty) {
    const generated = generateSentenceSession(eligible[difficulty], difficulty)
    if (!generated?.length) return
    const [first, ...rest] = generated
    const startedAt = Date.now()
    setResult(null)
    setSession({
      id: createGameSessionId('sentence-builder', startedAt),
      startedAt,
      difficulty,
      topic,
      challenges: [first, ...rest],
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <title>Sentence Builder | Mellow</title>
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
          Sentence Builder
        </h1>
      </header>
      {session ? (
        <SentenceBuilderPlayer
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
        <SentenceBuilderResults
          result={result}
          onPlayAgain={() => {
            returnFocus.current = true
            setResult(null)
          }}
        />
      ) : (
        <SentenceBuilderSetup
          topic={topic}
          onTopic={setTopic}
          counts={{
            easy: eligible.easy.length,
            medium: eligible.medium.length,
            hard: eligible.hard.length,
          }}
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
            restartDescription="Você começará uma nova sessão com o mesmo tema e a mesma dificuldade."
            onCancel={() => setRestart(false)}
            onConfirm={() => {
              setRestart(false)
              start(session.difficulty)
            }}
          />
        )
      )}
    </div>
  )
}
