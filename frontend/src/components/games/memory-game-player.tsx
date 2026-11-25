import { useEffect, useRef, useState } from 'react'
import { MemoryCardButton } from '@/components/games/memory-card-button'
import { MemoryVocabularyReview } from '@/components/games/memory-vocabulary-review'
import { Button } from '@/components/ui/button'
import { difficultyLabels } from '@/data/game-labels'
import { vocabularySources } from '@/data/vocabulary-sources'
import { useGameClock } from '@/hooks/use-game-clock'
import {
  dismissMemoryMismatch,
  initialMemoryRun,
  revealMemoryCard,
} from '@/services/memory-session'
import type { GameDifficulty, VocabularySource } from '@/types/game'
import type { MemoryBoard, MemoryGameResult } from '@/types/memory-game'

export interface MemoryGameSession {
  id: string
  startedAt: number
  difficulty: GameDifficulty
  source: VocabularySource
  board: MemoryBoard
}

export function MemoryGamePlayer({
  session,
  onRestart,
  onFinish,
  onComplete,
}: {
  session: MemoryGameSession
  onRestart: () => void
  onComplete: (result: MemoryGameResult) => void
  onFinish: (result: MemoryGameResult) => void
}) {
  const [run, setRun] = useState(initialMemoryRun)
  const readTime = useGameClock()
  const [completed, setCompleted] = useState<MemoryGameResult | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const continueButton = useRef<HTMLButtonElement>(null)
  const summaryButton = useRef<HTMLButtonElement>(null)
  const secondCard = useRef<HTMLButtonElement>(null)
  const { board, difficulty, source } = session
  const totalPairs = board.vocabulary.length
  const complete = run.matchedIds.length === totalPairs
  const { pending } = run
  const locked = pending.kind === 'mismatch'
  const visible =
    pending.kind === 'first' ? [pending.id] : locked ? pending.ids : []
  const matched = board.vocabulary.filter(({ id }) =>
    run.matchedIds.includes(id),
  )

  useEffect(() => heading.current?.focus(), [])
  useEffect(() => {
    if (locked) continueButton.current?.focus({ preventScroll: true })
    if (complete) summaryButton.current?.focus({ preventScroll: true })
  }, [locked, complete])

  function reveal(id: string, now: number) {
    const next = revealMemoryCard(run, board, id)
    setRun(next)
    if (completed || next.matchedIds.length !== totalPairs) return
    const result: MemoryGameResult = {
      ...readTime(),
      sessionId: session.id,
      gameId: 'memory-game',
      level: 'A1',
      difficulty,
      source,
      startedAt: session.startedAt,
      endedAt: Math.max(now, session.startedAt),
      outcome: 'completed',
      totalPairs,
      answeredCount: next.attemptCount,
      correctCount: next.matchedIds.length,
      incorrectAttempts: next.incorrectAttempts,
      vocabulary: board.vocabulary,
    }
    setCompleted(result)
    onComplete(result)
  }

  return (
    <section aria-labelledby="memory-board-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="font-bold">
            {difficultyLabels[difficulty]} · {vocabularySources[source]}
          </p>
          <h2
            id="memory-board-title"
            ref={heading}
            tabIndex={-1}
            className="w-fit text-2xl font-semibold"
          >
            Encontre os pares
          </h2>
        </div>
        <Button variant="secondary" onClick={onRestart}>
          Reiniciar sessão
        </Button>
      </div>
      <p>
        Vire duas cartas e procure a expressão em inglês e seu significado em
        português.
      </p>
      <div className="@container space-y-3">
        <div className="sticky top-0 z-10 space-y-2 rounded-lg border border-plum/20 bg-cream p-3">
          <p className="flex flex-wrap justify-between gap-x-3 text-sm font-bold">
            <span>
              {run.matchedIds.length} de {totalPairs} pares encontrados
            </span>
            <span>Tentativas: {run.attemptCount}</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <p
              role="status"
              aria-atomic="true"
              className="min-h-12 leading-snug"
            >
              {locked
                ? 'As cartas não formam um par. Leia as duas antes de continuar.'
                : complete
                  ? 'Você encontrou todos os pares!'
                  : run.pending.kind === 'first'
                    ? 'Agora vire outra carta.'
                    : run.feedback === 'matched'
                      ? 'Par encontrado! Você pode virar outra carta.'
                      : run.feedback === 'continue'
                        ? 'As duas cartas foram viradas. Escolha outra carta.'
                        : 'Escolha uma carta para começar.'}
            </p>
            <div className="min-h-11">
              {complete ? (
                <Button
                  ref={summaryButton}
                  onClick={() => completed && onFinish(completed)}
                >
                  Ver resumo
                </Button>
              ) : (
                <Button
                  ref={continueButton}
                  variant="secondary"
                  className={locked ? undefined : 'invisible'}
                  disabled={!locked}
                  onClick={() => {
                    setRun(dismissMemoryMismatch(run))
                    secondCard.current?.focus({ preventScroll: true })
                  }}
                >
                  Virar cartas e continuar
                </Button>
              )}
            </div>
          </div>
        </div>
        <ol
          aria-label="Cartas do tabuleiro"
          className="grid auto-rows-fr grid-cols-2 gap-2 @md:grid-cols-3 @xl:grid-cols-4 sm:gap-3"
        >
          {board.cards.map((card, index) => (
            <li key={card.id} className="min-w-0">
              <MemoryCardButton
                card={card}
                position={index + 1}
                locked={locked}
                state={
                  run.matchedIds.includes(card.pair.id)
                    ? 'matched'
                    : visible.includes(card.id)
                      ? 'revealed'
                      : 'concealed'
                }
                onReveal={(button) => {
                  secondCard.current = button
                  reveal(card.id, Date.now())
                }}
              />
            </li>
          ))}
        </ol>
      </div>
      {matched.length > 0 && (
        <MemoryVocabularyReview
          pairs={matched}
          label="Revisar pares encontrados"
        />
      )}
    </section>
  )
}
