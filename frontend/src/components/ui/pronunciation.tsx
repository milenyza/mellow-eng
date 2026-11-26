import { Square, Volume2 } from 'lucide-react'
import { useId } from 'react'
import type { AudioSource } from '@/types/audio'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'

export function PronunciationButton({
  playback,
  text,
  label = 'Ouvir pronúncia',
  descriptionId,
  textLanguage,
  rate,
  source,
  playbackId,
}: {
  playback: SpeechPlayback
  text: string
  label?: string
  descriptionId: string
  textLanguage?: string
  rate?: number
  source?: AudioSource
  playbackId?: string
}) {
  const generatedId = useId()
  const id = playbackId ?? generatedId
  const active = playback.activeId === id
  const Icon = active ? Square : Volume2

  return (
    <button
      type="button"
      onClick={() => playback.toggle(id, source ?? text, rate)}
      disabled={!playback.supported}
      aria-describedby={playback.supported ? undefined : descriptionId}
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-border px-3 py-1 text-left text-sm font-bold enabled:cursor-pointer enabled:hover:bg-lavender"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {active ? 'Parar pronúncia' : label}
      {textLanguage && (
        <span className="sr-only" lang={textLanguage}>
          : {text}
        </span>
      )}
    </button>
  )
}

export function PronunciationStatus({
  playback,
  id,
}: {
  playback: SpeechPlayback
  id: string
}) {
  return (
    <p
      id={id}
      role="status"
      className={playback.message ? 'text-sm' : 'sr-only'}
    >
      {playback.message}
    </p>
  )
}
