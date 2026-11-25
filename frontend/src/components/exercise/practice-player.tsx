import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { ExerciseCorrection } from '@/components/exercise/exercise-correction'
import { ExerciseFields } from '@/components/exercise/exercise-fields'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/utils'
import { evaluateExercise } from '@/services/exercise-evaluation'
import type {
  Exercise,
  ExerciseAttempt,
  PracticeSession,
  SubmissionMode,
} from '@/types/exercise'
import type { PracticeBlock } from '@/types/lesson-content'

const emptyAttempt: ExerciseAttempt = {
  answer: null,
  status: 'editing',
  submissions: [],
}

export function PracticePlayer({
  block,
  language,
  session,
  onChange,
  listening,
  renderContext,
  presentation,
  finishedDescription = 'Você pode seguir para a próxima etapa da aula.',
}: {
  block: Pick<PracticeBlock, 'instructions' | 'exercises'>
  language: string
  session?: PracticeSession
  onChange: (session: PracticeSession) => void
  renderContext?: (exercise: Exercise) => ReactNode
  finishedDescription?: string
  presentation?: {
    activityLabel: string
    nextLabel: string
    finishLabel: string
    orderingTools?: boolean
    renderCorrection?: (
      exercise: Exercise,
      attempt: ExerciseAttempt,
    ) => ReactNode
    renderReview?: (exercise: Exercise, attempt: ExerciseAttempt) => ReactNode
  }
  listening?: {
    renderAudio: (exercise: Exercise) => ReactNode
    renderTranscript: (exercise: Exercise) => ReactNode
    submissionMode: (exercise: Exercise) => SubmissionMode
  }
}) {
  const { index, attempts, finished } = session ?? {
    index: 0,
    attempts: {},
    finished: false,
  }
  const exercise = block.exercises[index]
  const total = block.exercises.length
  const progressText = finished
    ? listening
      ? `${total} de ${total} atividades revisadas`
      : `${total} de ${total} exercícios revisados`
    : `${presentation?.activityLabel ?? (listening ? 'Atividade' : 'Exercício')} ${index + 1} de ${total}`
  const attempt = attempts[exercise.id] ?? emptyAttempt
  const { answer, status } = attempt
  const editing = status === 'editing'
  const currentResult = evaluateExercise(exercise, answer)
  const heading = useRef<HTMLHeadingElement>(null)
  const feedback = useRef<HTMLDivElement>(null)
  const questionId = useId()
  const progressId = useId()
  const previous = useRef({
    index: presentation ? -1 : index,
    status,
    finished,
  })

  useEffect(() => {
    const last = previous.current
    previous.current = { index, status, finished }
    if (
      last.index !== index ||
      last.finished !== finished ||
      (last.status !== status && editing)
    ) {
      heading.current?.focus()
    } else if (last.status !== status) {
      feedback.current?.focus()
    }
  }, [index, status, finished, editing])

  function updateAttempt(update: ExerciseAttempt) {
    onChange({
      index,
      finished,
      attempts: { ...attempts, [exercise.id]: update },
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!answer || !editing || currentResult === 'incomplete') return
    updateAttempt({
      answer,
      status: currentResult,
      submissions: [
        ...attempt.submissions,
        {
          answer,
          correct: currentResult === 'correct',
          submittedAt: Date.now(),
          mode: listening?.submissionMode(exercise) ?? 'practice',
        },
      ],
    })
  }

  return (
    <div className="space-y-4 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28 max-md:[&_summary]:scroll-mb-28">
      <p className="leading-relaxed">{block.instructions}</p>
      <div className="rounded-lg bg-sage p-3 sm:p-4">
        <label htmlFor={progressId} className="block text-sm font-bold">
          {progressText}
        </label>
        <progress
          id={progressId}
          aria-valuetext={progressText}
          max={total}
          value={index + 1}
          className="mt-2 block h-2 w-full appearance-none overflow-hidden rounded-full bg-cream [&::-moz-progress-bar]:bg-plum [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:bg-plum forced-colors:appearance-auto"
        />
      </div>
      {finished ? (
        <div className="space-y-1 rounded-lg bg-lavender/45 p-4">
          <h3 ref={heading} tabIndex={-1} className="text-xl font-semibold">
            {listening ? 'Atividades de escuta revisadas' : 'Prática revisada'}
          </h3>
          <p>{finishedDescription}</p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-plum/25 p-3 sm:p-5"
        >
          <div className="space-y-1.5">
            <h3
              ref={heading}
              id={questionId}
              lang={exercise.promptLanguage}
              tabIndex={-1}
              className="text-xl leading-snug font-semibold"
            >
              {exercise.prompt}
            </h3>
            <p className="text-sm leading-relaxed">{exercise.instructions}</p>
          </div>
          {renderContext?.(exercise)}
          {listening?.renderAudio(exercise)}
          <fieldset
            disabled={!editing}
            aria-labelledby={questionId}
            className="min-w-0"
          >
            <ExerciseFields
              key={exercise.id}
              orderingTools={presentation?.orderingTools}
              exercise={exercise}
              answer={answer}
              language={language}
              onChange={(answer) =>
                updateAttempt({ ...attempt, answer, status: 'editing' })
              }
            />
          </fieldset>
          {editing && exercise.hint && (
            <details key={exercise.id} className="text-sm">
              <summary className="w-fit cursor-pointer rounded-sm py-2 font-bold underline underline-offset-4">
                Ver dica
              </summary>
              <p className="mt-1 leading-relaxed">{exercise.hint}</p>
            </details>
          )}
          <div
            role="status"
            aria-atomic="true"
            ref={feedback}
            tabIndex={-1}
            className={cn(
              !editing && 'space-y-1.5 rounded-lg p-3 text-sm leading-relaxed',
              status === 'correct' ? 'bg-sage' : !editing && 'bg-lavender/60',
            )}
          >
            {!editing && (
              <>
                <p className="font-extrabold">
                  {status === 'correct'
                    ? 'Resposta correta'
                    : status === 'reviewed'
                      ? 'Correção revisada'
                      : 'Vamos revisar a resposta'}
                </p>
                <p className="font-bold">Resposta esperada</p>
                {presentation?.renderCorrection?.(exercise, attempt) ?? (
                  <ExerciseCorrection exercise={exercise} language={language} />
                )}
                <p>{exercise.feedback}</p>
              </>
            )}
          </div>
          {!editing && listening?.renderTranscript(exercise)}
          {(status === 'correct' || status === 'reviewed') &&
            presentation?.renderReview?.(exercise, attempt)}
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <Button
                key="submit"
                type="submit"
                disabled={currentResult === 'incomplete'}
              >
                Conferir resposta
              </Button>
            ) : status === 'incorrect' ? (
              <>
                <Button
                  onClick={() =>
                    updateAttempt({ ...attempt, answer, status: 'editing' })
                  }
                >
                  Tentar novamente
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateAttempt({
                      ...attempt,
                      status: 'reviewed',
                      reviewedAt: Math.max(
                        Date.now(),
                        attempt.submissions.at(-1)?.submittedAt ?? 0,
                      ),
                    })
                  }
                >
                  Revisei a correção
                </Button>
              </>
            ) : (
              <Button
                onClick={() =>
                  onChange({
                    attempts,
                    index: index === total - 1 ? index : index + 1,
                    finished: index === total - 1,
                  })
                }
              >
                {presentation
                  ? index === total - 1
                    ? presentation.finishLabel
                    : presentation.nextLabel
                  : listening
                    ? index === total - 1
                      ? 'Encerrar atividades'
                      : 'Próxima atividade'
                    : index === total - 1
                      ? 'Encerrar prática'
                      : 'Próximo exercício'}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
