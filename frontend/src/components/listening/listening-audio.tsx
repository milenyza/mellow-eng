import { Square, Volume2 } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import type { AudioSource } from '@/types/audio'

export type ListeningSpeed = 1 | 0.75

const speedOptions = [
  { value: 1, label: 'Normal (1×)' },
  { value: 0.75, label: 'Reduzida (0,75×)' },
] as const

export function ListeningAudio({
  source,
  speed,
  onSpeedChange,
  onUseText,
  onHeard,
}: {
  source: AudioSource
  speed: ListeningSpeed
  onSpeedChange: (speed: ListeningSpeed) => void
  onUseText: () => void
  onHeard: () => void
}) {
  const id = useId()
  const playback = useSpeechPlayback()
  const playing = playback.activeId === id
  const Icon = playing ? Square : Volume2

  return (
    <div className="space-y-3 rounded-lg bg-lavender/55 p-3 sm:p-4">
      <fieldset disabled={!playback.supported || playing}>
        <legend className="text-sm font-bold">Velocidade do áudio</legend>
        <div className="mt-1 flex flex-wrap gap-x-4">
          {speedOptions.map(({ value, label }) => (
            <label
              key={value}
              className="inline-flex min-h-11 items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={id}
                value={value}
                checked={speed === value}
                onChange={() => onSpeedChange(value)}
                className="size-4 shrink-0 accent-plum"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!playback.supported}
          onClick={() => playback.toggle(id, source, speed, onHeard)}
          aria-describedby={`${id}-status`}
          className="gap-2"
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {playing ? 'Parar áudio' : 'Ouvir áudio'}
        </Button>
        <Button variant="secondary" onClick={onUseText}>
          Usar alternativa em texto
        </Button>
      </div>
      <PronunciationStatus playback={playback} id={`${id}-status`} />
    </div>
  )
}
