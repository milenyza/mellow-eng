import { useId } from 'react'
import { VocabularyPairReview } from '@/components/games/vocabulary-pair-review'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import type { VocabularyPair } from '@/types/game'

export function MemoryVocabularyReview({
  pairs,
  label,
}: {
  pairs: readonly VocabularyPair[]
  label: string
}) {
  const playback = useSpeechPlayback()
  const audioDescription = useId()

  return (
    <details
      className="space-y-3 rounded-lg bg-sage/50 px-4 pb-3"
      onToggle={(event) => {
        if (!event.currentTarget.open && playback.activeId)
          playback.stop(playback.activeId)
      }}
    >
      <summary className="min-h-11 cursor-pointer rounded-sm py-3 font-bold underline underline-offset-4">
        {label}
      </summary>
      <ul className="space-y-4">
        {pairs.map((pair) => (
          <li key={pair.id} className="border-t border-plum/20 pt-3">
            <VocabularyPairReview
              pair={pair}
              playback={playback}
              audioDescription={audioDescription}
            />
          </li>
        ))}
      </ul>
      <PronunciationStatus playback={playback} id={audioDescription} />
    </details>
  )
}
