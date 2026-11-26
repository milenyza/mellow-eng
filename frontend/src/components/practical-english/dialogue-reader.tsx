import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  PronunciationButton,
  PronunciationStatus,
} from '@/components/ui/pronunciation'
import { cn } from '@/components/utils'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import { createDialogueAudio } from '@/services/dialogue-audio'
import type { PracticalDialogue } from '@/types/practical-english'

export function DialogueReader({ dialogue }: { dialogue: PracticalDialogue }) {
  const [showAll, setShowAll] = useState(false)
  const [overrides, setOverrides] = useState<
    Readonly<Record<string, boolean | undefined>>
  >({})
  const [rate, setRate] = useState(1)
  const playback = useSpeechPlayback(dialogue.audioLanguage)
  const statusId = useId()
  const narrationId = `full-${dialogue.id}`
  const allShown = dialogue.turns.every(({ id }) => overrides[id] ?? showAll)
  const paused = playback.status === 'paused'

  return (
    <section aria-labelledby="dialogue-turns-title" className="space-y-4">
      <h2 id="dialogue-turns-title" className="text-2xl font-semibold">
        Conversa
      </h2>
      <div className="space-y-3 rounded-xl bg-lavender/50 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="block text-sm font-bold">
              Velocidade da narração
            </span>
            <select
              className="min-h-11 rounded-md border border-border bg-background px-3 py-2"
              value={rate}
              onChange={(event) => {
                if (playback.activeId) playback.stop(playback.activeId)
                setRate(Number(event.target.value))
              }}
            >
              <option value={1}>Normal</option>
              <option value={0.75}>Reduzida</option>
            </select>
          </label>
          <Button
            className="motion-reduce:transition-none"
            aria-describedby={statusId}
            disabled={!playback.supported || playback.activeId === narrationId}
            onClick={() =>
              playback.toggle(narrationId, createDialogueAudio(dialogue), rate)
            }
          >
            Ouvir diálogo completo
          </Button>
          {playback.canPause && (
            <Button
              variant="secondary"
              disabled={!playback.activeId}
              className="motion-reduce:transition-none"
              onClick={() => (paused ? playback.resume() : playback.pause())}
            >
              {paused ? 'Continuar áudio' : 'Pausar áudio'}
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={!playback.activeId}
            className="motion-reduce:transition-none"
            onClick={() => {
              if (playback.activeId) playback.stop(playback.activeId)
            }}
          >
            Parar áudio
          </Button>
        </div>
        <PronunciationStatus id={statusId} playback={playback} />
        <Button
          variant="secondary"
          className="motion-reduce:transition-none"
          onClick={() => {
            setShowAll(!allShown)
            setOverrides({})
          }}
        >
          {allShown
            ? 'Ocultar todas as traduções'
            : 'Mostrar todas as traduções'}
        </Button>
      </div>

      <ol aria-label="Falas em ordem" className="space-y-3">
        {dialogue.turns.map((turn, index) => {
          const speakerIndex = dialogue.participants.findIndex(
            ({ id }) => id === turn.participantId,
          )
          const participant = dialogue.participants[speakerIndex]
          const active = playback.activePartId === turn.id
          const visible = overrides[turn.id] ?? showAll
          const translationId = `${dialogue.id}-${turn.id}-translation`
          return (
            <li
              key={turn.id}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'min-w-0 space-y-2 rounded-xl border p-4 sm:w-[92%] sm:p-5',
                speakerIndex === 0 ? 'bg-sage/55' : 'bg-lavender/45 sm:ml-auto',
                active ? 'border-plum ring-1 ring-plum' : 'border-plum/20',
              )}
            >
              <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
                {participant?.role}
                {active && (
                  <span className="rounded-md bg-cream px-2 py-0.5 text-xs">
                    {paused ? 'Em pausa' : 'Em reprodução'}
                  </span>
                )}
              </p>
              <p
                lang="en"
                className="font-heading text-xl leading-snug font-semibold"
              >
                {turn.text}
              </p>
              {turn.pronunciation && (
                <p lang="en" className="text-sm">
                  {turn.pronunciation}
                </p>
              )}
              <p
                id={translationId}
                hidden={!visible}
                className="border-l-2 border-terracotta pl-3 leading-relaxed"
              >
                {turn.translation}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <PronunciationButton
                  label={`Ouvir fala ${index + 1}`}
                  text={turn.text}
                  textLanguage="en"
                  playbackId={turn.id}
                  playback={playback}
                  rate={rate}
                  source={createDialogueAudio(dialogue, turn.id)}
                  descriptionId={statusId}
                />
                <Button
                  variant="secondary"
                  aria-expanded={visible}
                  aria-controls={translationId}
                  className="text-sm motion-reduce:transition-none"
                  onClick={() =>
                    setOverrides((previous) => ({
                      ...previous,
                      [turn.id]: !visible,
                    }))
                  }
                >
                  {visible ? 'Ocultar tradução' : 'Mostrar tradução'}
                  <span className="sr-only"> da fala {index + 1}</span>
                </Button>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
