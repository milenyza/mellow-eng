import { Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'
import type { AudioSource } from '@/types/audio'

export function StoryAudioButton({
  playback,
  playbackId,
  source,
  speed,
  label,
  stopLabel,
  statusId,
}: {
  playback: SpeechPlayback
  playbackId: string
  source: AudioSource | string
  speed: number
  label: string
  stopLabel: string
  statusId: string
}) {
  const playing = playback.activeId === playbackId
  const Icon = playing ? Square : Volume2

  return (
    <Button
      variant="secondary"
      disabled={!playback.supported}
      aria-describedby={statusId}
      onClick={() => playback.toggle(playbackId, source, speed)}
      className="gap-2 text-sm"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {playing ? stopLabel : label}
    </Button>
  )
}
