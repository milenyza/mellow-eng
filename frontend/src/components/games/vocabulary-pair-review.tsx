import { PronunciationButton } from '@/components/ui/pronunciation'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'
import type { VocabularyPair } from '@/types/game'

export function VocabularyPairReview({
  pair,
  playback,
  audioDescription,
}: {
  pair: VocabularyPair
  playback: SpeechPlayback
  audioDescription: string
}) {
  return (
    <div className="space-y-2">
      <p className="font-bold">
        <span lang="en">{pair.english}</span> · {pair.portuguese}
      </p>
      {pair.context && <p>{pair.context}</p>}
      {pair.example && (
        <p>
          <span lang="en" className="block">
            {pair.example.text}
          </span>
          {pair.example.translation}
        </p>
      )}
      {pair.pronunciation && <p lang="en">{pair.pronunciation}</p>}
      <PronunciationButton
        playback={playback}
        text={pair.english}
        textLanguage="en"
        descriptionId={audioDescription}
      />
    </div>
  )
}
