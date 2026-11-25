import { useEffect, useRef, useState } from 'react'
import { PracticePlayer } from '@/components/exercise/practice-player'
import {
  ListeningAudio,
  type ListeningSpeed,
} from '@/components/listening/listening-audio'
import type { Exercise } from '@/types/exercise'
import type { ListeningBlock } from '@/types/lesson-content'
import type { ListeningActivity, ListeningSession } from '@/types/listening'

function TextAlternative({ text, focus }: { text: string; focus: boolean }) {
  const heading = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (focus) heading.current?.focus()
  }, [focus])

  return (
    <div className="space-y-1.5 rounded-lg bg-lavender/55 p-3 sm:p-4">
      <p
        ref={heading}
        tabIndex={-1}
        className="w-fit rounded-sm font-extrabold max-md:scroll-mb-28"
      >
        Alternativa em texto
      </p>
      <p className="text-sm">
        Nesta atividade, você está praticando por leitura.
      </p>
      <p className="leading-relaxed">{text}</p>
    </div>
  )
}

function Transcript({ source }: Pick<ListeningActivity, 'source'>) {
  return (
    <details className="rounded-lg border border-plum/25 px-3">
      <summary className="min-h-11 cursor-pointer rounded-sm py-2.5 text-sm font-bold">
        Ver transcrição e tradução
      </summary>
      <ol className="space-y-3 pb-3">
        {source.parts.map(({ id, text, translation, speaker }) => (
          <li key={id}>
            {speaker && <p className="text-sm font-extrabold">{speaker}</p>}
            <p lang={source.language} className="font-semibold">
              {text}
            </p>
            <p className="text-sm">{translation}</p>
          </li>
        ))}
      </ol>
    </details>
  )
}

export function ListeningPlayer({
  block,
  language,
  session,
  onChange,
}: {
  block: ListeningBlock
  language: string
  session?: ListeningSession
  onChange: (change: (session?: ListeningSession) => ListeningSession) => void
}) {
  const [focusedTextId, setFocusedTextId] = useState<string>()
  const [speed, setSpeed] = useState<ListeningSpeed>(1)
  const { answers, textActivityIds, heardActivityIds } = session ?? {
    textActivityIds: [],
    heardActivityIds: [],
  }
  const [first, ...rest] = block.activities
  const activitiesById = new Map(
    block.activities.map((activity) => [activity.exercise.id, activity]),
  )

  function renderAudio(exercise: Exercise) {
    const activity = activitiesById.get(exercise.id)
    if (!activity) return null
    return textActivityIds.includes(exercise.id) ? (
      <TextAlternative
        key={`audio-${exercise.id}`}
        text={activity.textAlternative}
        focus={focusedTextId === exercise.id}
      />
    ) : (
      <ListeningAudio
        key={`audio-${exercise.id}`}
        source={activity.source}
        speed={speed}
        onSpeedChange={setSpeed}
        onHeard={() =>
          onChange((previous) => {
            const heard = previous?.heardActivityIds ?? []
            if (previous && heard.includes(exercise.id)) return previous
            return {
              ...previous,
              textActivityIds: previous?.textActivityIds ?? [],
              heardActivityIds: [...heard, exercise.id],
            }
          })
        }
        onUseText={() => {
          setFocusedTextId(exercise.id)
          onChange((previous) => ({
            ...previous,
            heardActivityIds: previous?.heardActivityIds ?? [],
            textActivityIds: [
              ...(previous?.textActivityIds ?? []),
              exercise.id,
            ],
          }))
        }}
      />
    )
  }

  function renderTranscript(exercise: Exercise) {
    const activity = activitiesById.get(exercise.id)
    return (
      activity && (
        <Transcript
          key={`transcript-${exercise.id}`}
          source={activity.source}
        />
      )
    )
  }

  return (
    <PracticePlayer
      block={{
        instructions: block.instructions,
        exercises: [first.exercise, ...rest.map(({ exercise }) => exercise)],
      }}
      language={language}
      session={answers}
      onChange={(answers) =>
        onChange((previous) => ({
          answers,
          textActivityIds: previous?.textActivityIds ?? [],
          heardActivityIds: previous?.heardActivityIds ?? [],
        }))
      }
      listening={{
        renderAudio,
        renderTranscript,
        submissionMode: ({ id }) =>
          textActivityIds.includes(id)
            ? 'text-alternative'
            : heardActivityIds.includes(id)
              ? 'listening'
              : 'no-audio',
      }}
    />
  )
}
