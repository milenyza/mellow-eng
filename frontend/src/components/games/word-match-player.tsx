import { useEffect, useId, useRef, useState } from 'react'
import { MatchBoard } from '@/components/games/match-board'
import { VocabularyPairReview } from '@/components/games/vocabulary-pair-review'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { difficultyLabels } from '@/data/game-labels'
import { vocabularySources } from '@/data/vocabulary-sources'
import { useGameClock } from '@/hooks/use-game-clock'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import {
  chooseWordMatchItem,
  initialWordMatchRun,
  nextWordMatchRound,
  summarizeMatches,
} from '@/services/word-match-session'
import type { GameDifficulty, VocabularySource } from '@/types/game'
import type { WordMatchResult, WordMatchRound } from '@/types/word-match'

export interface WordMatchSession {
  id: string
  startedAt: number
  difficulty: GameDifficulty
  source: VocabularySource
  rounds: readonly WordMatchRound[]
}

export function WordMatchPlayer({
  session,
  onRestart,
  onFinish,
  onComplete,
}: {
  session: WordMatchSession
  onRestart: () => void
  onComplete: (result: WordMatchResult) => void
  onFinish: (result: WordMatchResult) => void
}) {
  const [run, setRun] = useState(initialWordMatchRun)
  const readTime = useGameClock()
  const [completed, setCompleted] = useState<WordMatchResult | null>(null)
  const audioDescription = useId()
  const playback = useSpeechPlayback()
  const heading = useRef<HTMLHeadingElement>(null)
  const { rounds, difficulty, source } = session
  const round = rounds[run.roundIndex]
  const roundOver = run.matched.length === round.english.length
  const finalRound = run.roundIndex === rounds.length - 1
  const lastMatch = round.english.find(({ id }) => id === run.matched.at(-1))

  useEffect(() => {
    heading.current?.focus()
  }, [run.roundIndex])

  function advance() {
    if (!roundOver) return
    if (finalRound) {
      if (completed) onFinish(completed)
    } else {
      if (playback.activeId) playback.stop(playback.activeId)
      setRun(nextWordMatchRound(run))
    }
  }

  return (
    <section aria-labelledby="word-match-round" className="space-y-4">
      <div className="space-y-2 rounded-lg bg-lavender/60 p-4">
        <p className="font-bold">
          {difficultyLabels[difficulty]} · {vocabularySources[source]}
        </p>
        <h2
          id="word-match-round"
          tabIndex={-1}
          ref={heading}
          className="w-fit text-2xl font-semibold"
        >
          Rodada {run.roundIndex + 1} de {rounds.length}
        </h2>
        <label className="block">
          {run.roundIndex * round.english.length + run.matched.length} de{' '}
          {rounds.length * round.english.length} pares na sessão
          <progress
            className="mt-1 block h-2 w-full accent-plum"
            max={rounds.length * round.english.length}
            value={run.roundIndex * round.english.length + run.matched.length}
          />
        </label>
        <p>Tentativas na sessão: {run.attempts.length}</p>
      </div>
      <p>Escolha um cartão em qualquer coluna e procure seu par na outra.</p>
      <p
        role="status"
        aria-atomic="true"
        className="min-h-12 rounded-md border-l-4 border-terracotta bg-cream px-3 py-2"
      >
        {run.selected ? (
          'Cartão selecionado. Escolha na outra coluna.'
        ) : run.lastAttempt?.correct ? (
          <>
            <span lang="en">Nice match!</span> Par formado.{' '}
            {roundOver && 'Rodada concluída.'}
          </>
        ) : run.lastAttempt ? (
          'Esses cartões não formam um par. Você pode tentar de novo.'
        ) : (
          'Selecione um cartão para começar.'
        )}
      </p>
      <MatchBoard
        round={round}
        run={run}
        onSelect={(side, id) => {
          const next = chooseWordMatchItem(run, round, { side, id })
          if (next.matched !== run.matched && playback.activeId)
            playback.stop(playback.activeId)
          if (
            !completed &&
            finalRound &&
            next.matched.length === round.english.length
          ) {
            const result: WordMatchResult = {
              ...summarizeMatches(next, rounds),
              ...readTime(),
              sessionId: session.id,
              gameId: 'word-match',
              level: 'A1',
              difficulty,
              source,
              roundsCompleted: rounds.length,
              startedAt: session.startedAt,
              endedAt: Math.max(Date.now(), session.startedAt),
              outcome: 'completed',
            }
            setCompleted(result)
            onComplete(result)
          }
          setRun(next)
        }}
      />
      <div className="flex flex-wrap gap-2 max-md:[&_button]:scroll-mb-28">
        {roundOver && (
          <Button onClick={advance}>
            {finalRound ? 'Ver resultados' : 'Próxima rodada'}
          </Button>
        )}
        <Button variant="secondary" onClick={onRestart}>
          Reiniciar sessão
        </Button>
      </div>
      {lastMatch && (
        <details
          key={lastMatch.id}
          className="space-y-3 rounded-lg bg-sage/60 p-4"
        >
          <summary className="cursor-pointer rounded-sm font-bold underline underline-offset-4">
            Revisar <span lang="en">{lastMatch.english}</span>
          </summary>
          <VocabularyPairReview
            pair={lastMatch}
            playback={playback}
            audioDescription={audioDescription}
          />
        </details>
      )}
      <PronunciationStatus playback={playback} id={audioDescription} />
    </section>
  )
}
