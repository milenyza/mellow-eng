import { useEffect, useId, useRef, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { GameSessionConfirmation } from '@/components/games/game-session-confirmation'
import { FlashcardResults } from './flashcard-results'
import { Button } from '@/components/ui/button'
import {
  PronunciationButton,
  PronunciationStatus,
} from '@/components/ui/pronunciation'
import { recallRatings, reviewDirections } from '@/data/flashcard-labels'
import { useProgress } from '@/hooks/use-progress'
import { recordFlashcardSession } from '@/services/flashcard-history'
import { useGameClock } from '@/hooks/use-game-clock'
import type { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import {
  finishFlashcardSession,
  generateFlashcards,
  startFlashcardSession,
  updateFlashcardSession,
  type FlashcardAction,
} from '@/services/flashcards'
import type {
  Flashcard,
  FlashcardResult,
  FlashcardSession,
  RecallRating,
} from '@/types/flashcards'

export function FlashcardPlayer({
  initialSession,
  blocker,
  onFinish,
  onStart,
  onConfigure,
}: {
  initialSession: FlashcardSession
  blocker: ReturnType<typeof useGameSessionGuard>
  onFinish: () => void
  onStart: (session: FlashcardSession) => void
  onConfigure: () => void
}) {
  const [session, setSession] = useState(initialSession)
  const [result, setResult] = useState<FlashcardResult>()
  const [restarting, setRestarting] = useState(false)
  const [rate, setRate] = useState(1)
  const readTime = useGameClock()
  const { repository, persistence } = useProgress()
  const playback = useSpeechPlayback()
  const heading = useRef<HTMLHeadingElement>(null)
  const audioStatusId = useId()
  const card = session.cards[session.position]
  const { item, direction } = card
  const { vocabulary, annotation, vocabularyId } = item
  const englishFront = direction === 'en-pt'
  const revealed = session.revealedIds.includes(vocabularyId)
  const rated = session.observations.find(
    (observation) => observation.vocabularyId === vocabularyId,
  )
  const showAudio = englishFront || revealed

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [session.position, revealed, result])

  function stopAudio() {
    if (playback.activeId) playback.stop(playback.activeId)
  }

  function act(action: FlashcardAction) {
    const next = updateFlashcardSession(session, action)
    if (next === session) return
    if (next.position !== session.position || next.completedAt !== undefined)
      stopAudio()
    if (next.completedAt !== undefined) {
      const { activeMs, dailyPracticeMs } = readTime()
      const finished = finishFlashcardSession(next, activeMs)
      if (finished) {
        repository.update((data) =>
          recordFlashcardSession(data, finished, dailyPracticeMs),
        )
        setResult(finished)
      }
      onFinish()
    }
    setSession(next)
  }

  function reviewDifficult(cards: readonly Flashcard[]) {
    const configuration = {
      ...session.configuration,
      scope: 'difficult',
      length: 'all',
    } as const
    const deck = generateFlashcards(
      cards.map(({ item }) => item),
      configuration,
    )
    onStart(startFlashcardSession(deck, configuration))
  }

  const leaving = blocker.state === 'blocked'

  return result ? (
    <FlashcardResults
      result={result}
      persistence={persistence}
      cards={session.cards}
      heading={heading}
      onConfigure={onConfigure}
      onDifficult={reviewDifficult}
    />
  ) : (
    <section className="space-y-4" aria-label="Sessão de cartões">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">
            Cartão {session.position + 1} de {session.cards.length}
          </p>
          <p className="text-sm">{reviewDirections[direction]}</p>
        </div>
        <Button variant="secondary" onClick={() => setRestarting(true)}>
          Reiniciar sessão
        </Button>
      </div>
      <div className="space-y-1">
        <p role="status" className="text-sm">
          Cartões avaliados por você · {session.observations.length} de{' '}
          {session.cards.length}
        </p>
        <progress
          className="block h-2 w-full overflow-hidden rounded-full accent-plum"
          aria-label="Progresso da revisão"
          value={session.observations.length}
          max={session.cards.length}
        />
      </div>
      <div
        className={`space-y-4 rounded-xl border border-plum/20 p-4 [overflow-wrap:anywhere] sm:p-6 ${revealed ? 'bg-sage/50' : 'bg-lavender/65'}`}
      >
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold">
            <BookOpen className="size-4 shrink-0" aria-hidden="true" />{' '}
            Enunciado
          </p>
          {revealed ? (
            <p
              lang={englishFront ? 'en' : 'pt-BR'}
              className="font-heading text-lg"
            >
              {englishFront ? vocabulary.text : vocabulary.translation}
            </p>
          ) : (
            <h2
              ref={heading}
              tabIndex={-1}
              lang={englishFront ? 'en' : 'pt-BR'}
              className="w-fit rounded-sm text-3xl font-semibold sm:text-4xl"
            >
              {englishFront ? vocabulary.text : vocabulary.translation}
            </h2>
          )}
        </div>
        {revealed ? (
          <div className="space-y-3 border-t border-plum/20 pt-3">
            <p className="text-sm font-bold">Resposta</p>
            <h2
              ref={heading}
              tabIndex={-1}
              lang={englishFront ? 'pt-BR' : 'en'}
              className="w-fit rounded-sm text-3xl font-semibold sm:text-4xl"
            >
              {englishFront ? vocabulary.translation : vocabulary.text}
            </h2>
            {vocabulary.pronunciation && (
              <p lang="en" className="text-sm">
                {vocabulary.pronunciation}
              </p>
            )}
            {vocabulary.usage && <p>{vocabulary.usage}</p>}
            {vocabulary.example && (
              <div className="space-y-1 border-l-2 border-terracotta pl-3">
                <p className="text-sm font-bold">Exemplo do Mellow</p>
                <p lang="en" className="font-heading">
                  {vocabulary.example.text}
                </p>
                <p>{vocabulary.example.translation}</p>
              </div>
            )}
            {annotation?.note && (
              <div>
                <p className="text-sm font-bold">Nota pessoal</p>
                <p className="whitespace-pre-wrap">{annotation.note}</p>
              </div>
            )}
            {annotation?.personalExample && (
              <div>
                <p className="text-sm font-bold">Meu exemplo em inglês</p>
                <p lang="en" className="whitespace-pre-wrap">
                  {annotation.personalExample}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p>
            Tente lembrar{' '}
            {englishFront
              ? 'o significado em português'
              : 'a expressão em inglês'}{' '}
            antes de ver a resposta.
          </p>
        )}
        {showAudio && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <label className="space-y-1 text-sm font-bold">
                <span className="block">Velocidade do áudio</span>
                <select
                  className="min-h-11 rounded-md border border-border bg-cream px-3 py-2"
                  value={rate}
                  onChange={(event) => {
                    stopAudio()
                    setRate(Number(event.target.value))
                  }}
                >
                  <option value={1}>Normal</option>
                  <option value={0.75}>Reduzida</option>
                </select>
              </label>
              <PronunciationButton
                playback={playback}
                playbackId={vocabularyId}
                text={vocabulary.text}
                textLanguage="en"
                rate={rate}
                descriptionId={audioStatusId}
                source={revealed ? vocabulary.audio : undefined}
              />
            </div>
            <PronunciationStatus id={audioStatusId} playback={playback} />
          </div>
        )}
        {!revealed && (
          <Button onClick={() => act({ kind: 'reveal' })}>
            Revelar resposta
          </Button>
        )}
      </div>
      {revealed &&
        (rated ? (
          <p className="rounded-lg bg-cream p-3">
            <strong>Sua avaliação</strong> · {recallRatings[rated.rating]}
          </p>
        ) : (
          <fieldset className="min-w-0 space-y-2 rounded-lg border border-plum/20 p-3">
            <legend className="px-1 font-bold">Como foi lembrar?</legend>
            <p className="text-sm">
              Escolha a opção que descreve sua lembrança e avance.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(recallRatings) as RecallRating[]).map((rating) => (
                <Button
                  key={rating}
                  variant="secondary"
                  onClick={() =>
                    act({ kind: 'rate', vocabularyId, rating, at: Date.now() })
                  }
                >
                  {recallRatings[rating]}
                </Button>
              ))}
            </div>
          </fieldset>
        ))}
      {(session.position > 0 || rated) && (
        <div className="flex flex-wrap gap-2">
          {session.position > 0 && (
            <Button
              variant="secondary"
              onClick={() => act({ kind: 'previous' })}
            >
              Cartão anterior
            </Button>
          )}
          {rated && (
            <Button variant="secondary" onClick={() => act({ kind: 'next' })}>
              Próximo cartão
            </Button>
          )}
        </div>
      )}
      {(leaving || restarting) && (
        <GameSessionConfirmation
          action={leaving ? 'leave' : 'restart'}
          continueLabel="Continuar revisão"
          restartDescription="A sessão vai voltar ao primeiro cartão. As avaliações desta sessão serão descartadas."
          onCancel={() => {
            if (leaving) blocker.reset()
            else setRestarting(false)
          }}
          onConfirm={() => {
            stopAudio()
            if (leaving) blocker.proceed()
            else
              onStart(
                startFlashcardSession(session.cards, session.configuration),
              )
          }}
        />
      )}
    </section>
  )
}
