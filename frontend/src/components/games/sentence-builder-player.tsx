import { useId, useState } from 'react'
import { PracticePlayer } from '@/components/exercise/practice-player'
import { Button } from '@/components/ui/button'
import {
  PronunciationButton,
  PronunciationStatus,
} from '@/components/ui/pronunciation'
import { sentenceTopics } from '@/data/sentence-challenges'
import { difficultyLabels } from '@/data/game-labels'
import { useGameClock } from '@/hooks/use-game-clock'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import { sentenceForOrder } from '@/services/sentence-challenges'
import { summarizeSentences } from '@/services/sentence-session'
import type { ExerciseAttempt, PracticeSession } from '@/types/exercise'
import type {
  PreparedSentenceChallenge,
  SentenceBuilderResult,
  SentenceDifficulty,
  SentenceTopicSelection,
} from '@/types/sentence-builder'

export interface SentenceBuilderSession {
  id: string
  startedAt: number
  topic: SentenceTopicSelection
  difficulty: SentenceDifficulty
  challenges: readonly [
    PreparedSentenceChallenge,
    ...PreparedSentenceChallenge[],
  ]
}

export function SentenceBuilderPlayer({
  session,
  onRestart,
  onFinish,
  onComplete,
}: {
  session: SentenceBuilderSession
  onRestart: () => void
  onComplete: (result: SentenceBuilderResult) => void
  onFinish: (result: SentenceBuilderResult) => void
}) {
  const { difficulty, topic, challenges } = session
  const [progress, setProgress] = useState<PracticeSession>({
    index: 0,
    attempts: {},
    finished: false,
  })
  const [first, ...rest] = challenges
  const challenge = challenges[progress.index]
  const status = progress.attempts[challenge.definition.id]?.status
  const completed =
    progress.index + Number(status === 'correct' || status === 'reviewed')
  const readTime = useGameClock()
  const [completedResult, setCompletedResult] =
    useState<SentenceBuilderResult | null>(null)
  const playback = useSpeechPlayback()
  const audioDescription = useId()

  function displaySentence(attempt: ExerciseAttempt) {
    return attempt.status === 'correct' &&
      attempt.answer?.kind === 'sentence-builder'
      ? sentenceForOrder(challenge, attempt.answer.tileIds)
      : challenge.definition.sentence
  }

  function update(next: PracticeSession) {
    if (next.finished) {
      if (completedResult) onFinish(completedResult)
      return
    }
    const finalStatus = next.attempts[challenges.at(-1)!.definition.id]?.status
    if (
      !completedResult &&
      (finalStatus === 'correct' || finalStatus === 'reviewed')
    ) {
      const result: SentenceBuilderResult = {
        ...summarizeSentences(next, challenges),
        ...readTime(),
        sessionId: session.id,
        gameId: 'sentence-builder',
        level: 'A1',
        difficulty,
        topic,
        startedAt: session.startedAt,
        endedAt: Math.max(Date.now(), session.startedAt),
        outcome: 'completed',
      }
      setCompletedResult(result)
      onComplete(result)
    }
    if (next.index !== progress.index && playback.activeId)
      playback.stop(playback.activeId)
    setProgress(next)
  }

  return (
    <section
      aria-label="Sessão de prática"
      className="space-y-4 max-md:[&_button]:scroll-mb-28"
    >
      <p className="font-bold">
        {difficultyLabels[difficulty]} · {sentenceTopics[topic]}
      </p>
      <p className="text-sm">
        {completed} de {challenges.length} desafios concluídos
      </p>
      <PracticePlayer
        block={{
          instructions:
            difficulty === 'hard'
              ? 'Monte a frase. Algumas palavras são extras e podem ficar no banco.'
              : 'Selecione as palavras na ordem em que devem aparecer na frase.',
          exercises: [first.exercise, ...rest.map(({ exercise }) => exercise)],
        }}
        language="en"
        session={progress}
        onChange={update}
        presentation={{
          activityLabel: 'Desafio',
          nextLabel: 'Próximo desafio',
          finishLabel: 'Ver resultados',
          orderingTools: true,
          renderCorrection: (_, attempt) => (
            <p lang="en" className="font-bold">
              {displaySentence(attempt)}
            </p>
          ),
          renderReview: (_, attempt) => (
            <div className="space-y-2">
              <PronunciationButton
                playback={playback}
                text={displaySentence(attempt)}
                textLanguage="en"
                descriptionId={audioDescription}
              />
              <PronunciationStatus id={audioDescription} playback={playback} />
            </div>
          ),
        }}
      />
      <Button variant="secondary" onClick={onRestart}>
        Reiniciar sessão
      </Button>
    </section>
  )
}
