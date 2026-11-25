import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router'
import { VocabularyPairReview } from '@/components/games/vocabulary-pair-review'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { gamesPath } from '@/data/navigation'
import { difficultyLabels } from '@/data/game-labels'
import { vocabularySources } from '@/data/vocabulary-sources'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import { formatStudyTime } from '@/services/study-time'
import type { WordMatchResult } from '@/types/word-match'

export function WordMatchResults({
  result,
  onPlayAgain,
}: {
  result: WordMatchResult
  onPlayAgain: () => void
}) {
  const playback = useSpeechPlayback()
  const audioDescription = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])

  return (
    <section aria-labelledby="word-match-result" className="space-y-5">
      <header className="space-y-2 rounded-xl bg-sage p-4 sm:p-6">
        <h2
          tabIndex={-1}
          id="word-match-result"
          ref={heading}
          className="w-fit text-3xl font-semibold"
        >
          <span lang="en">Well done!</span> Sessão concluída
        </h2>
        <p>
          {difficultyLabels[result.difficulty]} ·{' '}
          {vocabularySources[result.source]}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-lavender/60 p-4 sm:p-6">
        <div>
          <dt className="font-bold">Rodadas concluídas</dt>
          <dd>{result.roundsCompleted}</dd>
        </div>
        <div>
          <dt className="font-bold">Pares formados</dt>
          <dd>{result.correctCount}</dd>
        </div>
        <div>
          <dt className="font-bold">Tentativas de formar pares</dt>
          <dd>{result.answeredCount}</dd>
        </div>
        {result.correctCount > 0 && (
          <div>
            <dt className="font-bold">Pares na primeira tentativa</dt>
            <dd>
              {result.firstAttemptCorrect} de {result.correctCount}
            </dd>
          </div>
        )}
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

      {result.reviewIds.length > 0 && (
        <section className="space-y-2" aria-labelledby="word-match-review">
          <h3 id="word-match-review" className="text-xl font-semibold">
            Palavras que vale rever
          </h3>
          <ul className="flex flex-wrap gap-2">
            {result.vocabulary
              .filter(({ id }) => result.reviewIds.includes(id))
              .map(({ id, english }) => (
                <li
                  key={id}
                  lang="en"
                  className="rounded-md bg-lavender px-2 py-1"
                >
                  {english}
                </li>
              ))}
          </ul>
        </section>
      )}
      <details className="space-y-3 rounded-lg bg-sage/50 p-4">
        <summary className="cursor-pointer rounded-sm font-bold underline underline-offset-4">
          Vocabulário da sessão
        </summary>
        <ul className="space-y-4">
          {result.vocabulary.map((pair) => (
            <li key={pair.id} className="border-t border-plum/20 pt-3">
              <VocabularyPairReview
                pair={pair}
                playback={playback}
                audioDescription={audioDescription}
              />
            </li>
          ))}
        </ul>
      </details>
      <PronunciationStatus playback={playback} id={audioDescription} />
    </section>
  )
}
