import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { MemoryVocabularyReview } from '@/components/games/memory-vocabulary-review'
import { Button } from '@/components/ui/button'
import { difficultyLabels } from '@/data/game-labels'
import { gamesPath } from '@/data/navigation'
import { vocabularySources } from '@/data/vocabulary-sources'
import { formatStudyTime } from '@/services/study-time'
import type { MemoryGameResult } from '@/types/memory-game'

export function MemoryGameResults({
  result,
  onPlayAgain,
}: {
  result: MemoryGameResult
  onPlayAgain: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])

  return (
    <section aria-labelledby="memory-result-title" className="space-y-5">
      <header className="space-y-2 rounded-xl bg-sage p-4 sm:p-6">
        <h2
          id="memory-result-title"
          ref={heading}
          tabIndex={-1}
          className="w-fit text-3xl font-semibold"
        >
          Você encontrou todos os pares!
        </h2>
        <p>
          {difficultyLabels[result.difficulty]} ·{' '}
          {vocabularySources[result.source]}
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-lavender/60 p-4 sm:p-6">
        <div>
          <dt className="font-bold">Pares encontrados</dt>
          <dd>
            {result.correctCount} de {result.totalPairs}
          </dd>
        </div>
        <div>
          <dt className="font-bold">Tentativas</dt>
          <dd>{result.answeredCount}</dd>
        </div>
        <div>
          <dt className="font-bold">Tempo ativo estimado</dt>
          <dd>{formatStudyTime(result.activeMs)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onPlayAgain}>Jogar novamente</Button>
        <Button asChild variant="secondary">
          <Link to={gamesPath}>Voltar aos jogos</Link>
        </Button>
      </div>
      <section aria-labelledby="memory-practiced-title" className="space-y-3">
        <h3 id="memory-practiced-title" className="text-xl font-semibold">
          Vocabulário praticado
        </h3>
        <ul lang="en" className="flex flex-wrap gap-2">
          {result.vocabulary.map(({ id, english }) => (
            <li key={id} className="rounded-md bg-lavender/60 px-2 py-1">
              {english}
            </li>
          ))}
        </ul>
        <MemoryVocabularyReview
          pairs={result.vocabulary}
          label="Revisar significados e pronúncia"
        />
      </section>
    </section>
  )
}
