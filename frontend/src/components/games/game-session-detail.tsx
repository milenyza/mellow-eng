import { SessionDate } from '@/components/games/game-history-list'
import { difficultyLabels, gameTitle } from '@/data/game-labels'
import { sentenceTopics } from '@/data/sentence-challenges'
import { vocabularySources } from '@/data/vocabulary-sources'
import {
  resolveGameChallenge,
  resolveGameVocabulary,
  selectGameReview,
} from '@/services/game-history-content'
import { formatStudyTime } from '@/services/study-time'
import type { CompletedGameSession } from '@/types/game-history'

export function GameSessionDetail({
  session,
}: {
  session: CompletedGameSession
}) {
  const review = selectGameReview([session])
  const sentence = session.gameId === 'sentence-builder'
  const completed = sentence ? session.challenges.length : session.correctCount

  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <h1 lang="en" className="text-4xl font-semibold">
          {gameTitle(session.gameId)}
        </h1>
        <p>
          {difficultyLabels[session.difficulty]} · {session.level} ·{' '}
          {sentence
            ? sentenceTopics[session.topic]
            : vocabularySources[session.source]}
        </p>
        <p className="text-sm">
          Concluída em <SessionDate timestamp={session.endedAt} />
        </p>
      </header>
      <dl className="grid gap-3 rounded-lg bg-lavender/55 p-4 sm:grid-cols-2">
        <div>
          <dt className="font-bold">
            {sentence ? 'Desafios concluídos' : 'Pares encontrados'}
          </dt>
          <dd>{completed}</dd>
        </div>
        <div>
          <dt className="font-bold">Tentativas</dt>
          <dd>{session.answeredCount}</dd>
        </div>
        <div>
          <dt className="font-bold">Tempo ativo estimado</dt>
          <dd>{formatStudyTime(session.activeMs)}</dd>
        </div>
        {session.gameId === 'word-match' && (
          <div>
            <dt className="font-bold">Rodadas concluídas</dt>
            <dd>{session.roundsCompleted}</dd>
          </div>
        )}
        {session.gameId !== 'memory-game' && (
          <div>
            <dt className="font-bold">Acertos na primeira tentativa</dt>
            <dd>
              {session.firstAttemptCorrect} de {completed}
            </dd>
          </div>
        )}
        {sentence && (
          <>
            <div>
              <dt className="font-bold">Acertos independentes</dt>
              <dd>{session.correctCount}</dd>
            </div>
            <div>
              <dt className="font-bold">Correções revisadas</dt>
              <dd>{completed - session.correctCount}</dd>
            </div>
          </>
        )}
      </dl>
      {sentence ? (
        <section
          className="space-y-3"
          aria-labelledby="history-sentences-title"
        >
          <h2 id="history-sentences-title" className="text-xl font-semibold">
            Frases praticadas
          </h2>
          {review.grammarTopics.length > 0 && (
            <p>
              Temas para rever:{' '}
              {review.grammarTopics
                .map((topic) => sentenceTopics[topic])
                .join(' · ')}
            </p>
          )}
          <ul className="divide-y divide-plum/20">
            {session.challenges.map((item) => {
              const challenge = resolveGameChallenge(item.id)
              return (
                <li key={item.id} className="space-y-1 py-3">
                  {challenge ? (
                    <p lang="en" className="font-bold">
                      {challenge.sentence}
                    </p>
                  ) : (
                    <p>Frase indisponível no material atual.</p>
                  )}
                  <p className="text-sm">
                    {item.reviewed ? 'Correção revisada' : 'Resposta correta'}
                  </p>
                  {item.incorrectAnswers.length > 0 && (
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2 font-bold underline">
                        Rever tentativas
                      </summary>
                      <ul className="list-disc pl-5" lang="en">
                        {item.incorrectAnswers.map((answer, index) => (
                          <li key={index}>{answer}</li>
                        ))}
                      </ul>
                      {challenge && (
                        <p className="mt-2">{challenge.feedback}</p>
                      )}
                    </details>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <section
          aria-labelledby="history-vocabulary-title"
          className="space-y-3"
        >
          <h2 id="history-vocabulary-title" className="text-xl font-semibold">
            Vocabulário praticado
          </h2>
          <ul className="divide-y divide-plum/20">
            {session.vocabularyIds.map((id) => {
              const pair = resolveGameVocabulary(id)
              return (
                <li key={id} className="py-3">
                  {pair ? (
                    <p>
                      <strong lang="en">{pair.english}</strong> ·{' '}
                      {pair.portuguese}
                    </p>
                  ) : (
                    <p>Expressão indisponível no material atual.</p>
                  )}
                  {review.vocabularyIds.includes(id) && (
                    <p className="text-sm font-bold">Vale rever este par</p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </article>
  )
}
