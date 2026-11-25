import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { gamesPath } from '@/data/navigation'
import { sentenceTopics } from '@/data/sentence-challenges'
import { difficultyLabels } from '@/data/game-labels'
import { formatStudyTime } from '@/services/study-time'
import type { SentenceBuilderResult } from '@/types/sentence-builder'

export function SentenceBuilderResults({
  result,
  onPlayAgain,
}: {
  result: SentenceBuilderResult
  onPlayAgain: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const incorrect = result.challenges.filter(
    ({ incorrectAnswers }) => incorrectAnswers.length,
  )
  const reviewTopics = [...new Set(incorrect.flatMap(({ topics }) => topics))]

  return (
    <section aria-labelledby="sentence-result-heading" className="space-y-5">
      <header className="space-y-2 rounded-xl bg-sage p-4 sm:p-6">
        <h2
          id="sentence-result-heading"
          ref={heading}
          tabIndex={-1}
          className="w-fit text-3xl font-semibold"
        >
          <span lang="en">Well done!</span> Sessão concluída
        </h2>
        <p>
          {difficultyLabels[result.difficulty]} · {sentenceTopics[result.topic]}
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-lavender/60 p-4 sm:p-6">
        <div>
          <dt className="font-bold">Desafios concluídos</dt>
          <dd>{result.completedCount}</dd>
        </div>
        <div>
          <dt className="font-bold">Tentativas</dt>
          <dd>{result.answeredCount}</dd>
        </div>
        <div>
          <dt className="font-bold">Acertos na primeira tentativa</dt>
          <dd>
            {result.firstAttemptCorrect} de {result.completedCount}
          </dd>
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
      {incorrect.length > 0 && (
        <section
          className="space-y-3"
          aria-labelledby="sentence-review-heading"
        >
          <h3 id="sentence-review-heading" className="text-xl font-semibold">
            O que vale rever
          </h3>
          <p>
            {reviewTopics.map((topic) => sentenceTopics[topic]).join(' · ')}
          </p>
          <ul className="space-y-3">
            {incorrect.map(({ id, sentence, feedback, incorrectAnswers }) => (
              <li key={id} className="space-y-1 rounded-lg bg-lavender/50 p-4">
                <p className="font-bold">Suas tentativas</p>
                <ul className="list-disc pl-5" lang="en">
                  {[...new Set(incorrectAnswers)].map((answer) => (
                    <li key={answer}>{answer}</li>
                  ))}
                </ul>
                <p>
                  <strong>Correção</strong> <span lang="en">{sentence}</span>
                </p>
                <p>{feedback}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <details className="space-y-3 rounded-lg bg-sage/50 p-4">
        <summary className="cursor-pointer rounded-sm font-bold underline underline-offset-4">
          Frases praticadas
        </summary>
        <ol lang="en" className="list-decimal space-y-2 pl-5">
          {result.challenges.map(({ id, sentence }) => (
            <li key={id}>{sentence}</li>
          ))}
        </ol>
      </details>
    </section>
  )
}
