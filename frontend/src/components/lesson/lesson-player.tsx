import { ArrowLeft, Clock } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router'
import { PracticePlayer } from '@/components/exercise/practice-player'
import { LessonCompletion } from '@/components/lesson/lesson-completion'
import { RestartLesson } from '@/components/lesson/restart-lesson'
import { LessonBlockContent } from '@/components/lesson/lesson-blocks'
import { ListeningPlayer } from '@/components/listening/listening-player'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { lessonsPath } from '@/data/navigation'
import { useActiveStudy } from '@/hooks/use-active-study'
import { useProgress } from '@/hooks/use-progress'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import type { AvailableLesson, CefrCode } from '@/types/curriculum'
import {
  completeLesson,
  getCompletionRequirements,
  restoreActivitySession,
  saveActivitySession,
  startStudyRun,
  updateLessonRecord,
  visitBlock,
} from '@/services/lesson-progress'
import type { StudyRun } from '@/types/progress'
import type {
  LessonBlock,
  ListeningBlock,
  PracticeBlock,
} from '@/types/lesson-content'

const stageLabels = {
  introduction: 'Introdução',
  vocabulary: 'Vocabulário',
  grammar: 'Gramática',
  dialogue: 'Diálogo',
  listening: 'Escuta',
  practice: 'Prática',
  speaking: 'Fala',
  review: 'Revisão',
} satisfies Record<LessonBlock['kind'], string>

function LessonStage({
  block,
  lessonId,
  language,
  objectives,
}: {
  block: Exclude<LessonBlock, ListeningBlock | PracticeBlock>
  lessonId: string
  language: string
  objectives: readonly string[]
}) {
  const descriptionId = useId()
  const playback = useSpeechPlayback(language === 'en' ? 'en-US' : language)
  return (
    <div className="space-y-4 leading-relaxed">
      {block.kind !== 'introduction' && (
        <PronunciationStatus playback={playback} id={descriptionId} />
      )}
      <LessonBlockContent
        lessonId={lessonId}
        block={block}
        objectives={objectives}
        audio={{ playback, descriptionId, language }}
      />
    </div>
  )
}

export function LessonPlayer({
  lesson,
  language,
  level,
  unitNumber,
  lessonNumber,
  nextLesson,
}: {
  lesson: AvailableLesson
  language: string
  level: CefrCode
  unitNumber: number
  lessonNumber: number
  nextLesson?: AvailableLesson
}) {
  const { data, repository, persistence } = useProgress()
  const record = data.lessons[lesson.id]
  const run = record?.run
  const firstBlockId = lesson.blocks[0].id
  const stageIndex = Math.max(
    0,
    lesson.blocks.findIndex(({ id }) => id === run?.blockId),
  )
  const block = lesson.blocks[stageIndex]
  const total = lesson.blocks.length
  const lastStage = stageIndex === total - 1
  const stageHeading = useRef<HTMLHeadingElement>(null)
  const stageProgress = useRef<HTMLDivElement>(null)
  const previousStage = useRef(stageIndex)
  const previousRunId = useRef(run?.id)
  const activeRunId = run?.finishedAt === undefined ? run?.id : undefined
  const flushStudyTime = useActiveStudy(repository, lesson.id, activeRunId)

  useEffect(() => {
    if (run) return
    repository.update((data) =>
      updateLessonRecord(
        data,
        lesson.id,
        (current) => current ?? { run: startStudyRun(firstBlockId) },
      ),
    )
  }, [firstBlockId, lesson.id, repository, run])

  useEffect(() => {
    const moved =
      stageIndex !== previousStage.current ||
      (previousRunId.current !== undefined && previousRunId.current !== run?.id)
    previousStage.current = stageIndex
    previousRunId.current = run?.id
    if (!moved) return
    stageHeading.current?.focus({ preventScroll: true })
    stageProgress.current?.scrollIntoView({ block: 'start' })
  }, [stageIndex, run?.id])

  function changeRun(change: (run: StudyRun) => StudyRun) {
    repository.update((data) =>
      updateLessonRecord(data, lesson.id, (current) => {
        if (
          !current ||
          current.run.id !== run?.id ||
          current.run.finishedAt !== undefined
        )
          return current
        const next = change(current.run)
        return next === current.run ? current : { ...current, run: next }
      }),
    )
  }

  function goToStage(index: number) {
    changeRun((run) => visitBlock(run, lesson.blocks[index].id))
  }

  function restart() {
    flushStudyTime.current?.()
    repository.update((data) =>
      updateLessonRecord(data, lesson.id, (current) => ({
        ...current,
        run: startStudyRun(firstBlockId),
      })),
    )
  }

  function confirmCompletion() {
    flushStudyTime.current?.()
    repository.update((data) =>
      updateLessonRecord(data, lesson.id, (current) =>
        current && current.run.id === run?.id
          ? completeLesson(lesson, current)
          : current,
      ),
    )
  }

  if (!run) return <p role="status">Preparando a aula…</p>
  const notice =
    persistence === 'unavailable'
      ? 'O armazenamento está indisponível. O progresso fica nesta aba enquanto ela estiver aberta.'
      : persistence === 'recovered'
        ? 'Os dados salvos eram incompatíveis. Foi iniciado um novo registro de progresso.'
        : null

  if (run.finishedAt !== undefined && record?.completion) {
    return (
      <>
        {notice && (
          <p role="status" className="mx-auto mb-4 max-w-2xl text-sm">
            {notice}
          </p>
        )}
        <LessonCompletion
          lesson={lesson}
          unitNumber={unitNumber}
          lessonNumber={lessonNumber}
          language={language}
          run={record.completion.run}
          nextLesson={nextLesson}
          onRestart={restart}
        />
      </>
    )
  }
  const savedSession = run.activities[block.id]
  const requirements = lastStage
    ? getCompletionRequirements(lesson, run)
    : undefined
  const pendingBlock =
    requirements &&
    lesson.blocks.findIndex(
      (block) =>
        requirements.unvisited.some(({ id }) => id === block.id) ||
        requirements.unanswered.some(({ blockId }) => blockId === block.id),
    )

  return (
    <article className="mx-auto max-w-2xl space-y-6 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28">
      <header className="space-y-3 border-b border-plum/20 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={lessonsPath}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-bold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar ao
            catálogo
          </Link>
          <RestartLesson completed={!!record?.completion} onRestart={restart} />
        </div>
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        <p className="text-sm font-extrabold">
          {level} · Unidade {unitNumber} · Aula {lessonNumber}
        </p>
        <h1
          lang={language}
          className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
        >
          {lesson.title}
        </h1>
        <p className="flex items-center gap-2 text-sm font-bold">
          <Clock aria-hidden="true" className="size-4" />{' '}
          {lesson.durationMinutes} min
        </p>
      </header>

      <div
        ref={stageProgress}
        className="scroll-mt-4 rounded-lg bg-lavender p-4"
      >
        <label
          htmlFor="posicao-na-aula"
          className="flex flex-wrap justify-between gap-x-3 text-sm font-bold"
        >
          <span>Progresso na aula</span>
          <span>
            Etapa {stageIndex + 1} de {total}
          </span>
        </label>
        <progress
          id="posicao-na-aula"
          max={total}
          value={stageIndex + 1}
          aria-valuetext={`Etapa ${stageIndex + 1} de ${total}`}
          className="mt-2 block h-2 w-full appearance-none overflow-hidden rounded-full bg-cream [&::-moz-progress-bar]:bg-plum [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:bg-plum forced-colors:appearance-auto"
        />
      </div>
      <section aria-labelledby="etapa-aula" className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-extrabold">{stageLabels[block.kind]}</p>
          <h2
            ref={stageHeading}
            id="etapa-aula"
            tabIndex={-1}
            className="w-fit rounded-sm text-2xl leading-snug font-semibold sm:text-3xl"
          >
            {block.title}
          </h2>
        </div>
        {block.kind === 'practice' ? (
          <PracticePlayer
            key={`${run.id}:${block.id}`}
            block={block}
            language={language}
            session={restoreActivitySession(block, savedSession)}
            onChange={(session) =>
              changeRun((run) => ({
                ...run,
                activities: {
                  ...run.activities,
                  [block.id]: saveActivitySession(block, session),
                },
              }))
            }
          />
        ) : block.kind === 'listening' ? (
          <ListeningPlayer
            key={`${run.id}:${block.id}`}
            block={block}
            language={language}
            session={{
              answers: restoreActivitySession(block, savedSession),
              heardActivityIds: savedSession?.heardActivityIds ?? [],
              textActivityIds: savedSession?.textActivityIds ?? [],
            }}
            onChange={(change) =>
              changeRun((run) => {
                const current = run.activities[block.id]
                const restored = current && {
                  answers: restoreActivitySession(block, current),
                  heardActivityIds: current.heardActivityIds,
                  textActivityIds: current.textActivityIds,
                }
                const updated = change(restored)
                if (updated === restored) return run
                return {
                  ...run,
                  activities: {
                    ...run.activities,
                    [block.id]: saveActivitySession(
                      block,
                      updated.answers,
                      updated.textActivityIds,
                      updated.heardActivityIds,
                    ),
                  },
                }
              })
            }
          />
        ) : (
          <LessonStage
            lessonId={lesson.id}
            key={`${run.id}:${block.id}`}
            block={block}
            language={language}
            objectives={lesson.objectives}
          />
        )}
      </section>
      {requirements && !requirements.eligible && (
        <div className="space-y-2 rounded-lg bg-lavender/55 p-4">
          <p className="font-bold">Antes de concluir</p>
          {requirements.unvisited.length > 0 && (
            <p>
              Etapas obrigatórias ainda não visitadas:{' '}
              {requirements.unvisited.length}.
            </p>
          )}
          {requirements.unanswered.length > 0 && (
            <p>
              Atividades obrigatórias para responder ou revisar:{' '}
              {requirements.unanswered.length}.
            </p>
          )}
          {pendingBlock !== undefined && pendingBlock >= 0 && (
            <Button variant="secondary" onClick={() => goToStage(pendingBlock)}>
              Ir para a etapa pendente
            </Button>
          )}
        </div>
      )}
      <nav
        aria-label="Etapas da aula"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-plum/20 pt-4"
      >
        <Button
          variant="secondary"
          disabled={stageIndex === 0}
          onClick={() => goToStage(stageIndex - 1)}
        >
          Etapa anterior
        </Button>
        {lastStage ? (
          <Button
            disabled={!requirements?.eligible}
            onClick={confirmCompletion}
          >
            Confirmar conclusão
          </Button>
        ) : (
          <Button onClick={() => goToStage(stageIndex + 1)}>
            Próxima etapa
          </Button>
        )}
      </nav>
    </article>
  )
}
