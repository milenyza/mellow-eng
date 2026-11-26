import { PronunciationButton } from '@/components/ui/pronunciation'
import { cn } from '@/components/utils'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'
import type {
  ConversationMessage,
  GuidedConversation,
} from '@/types/conversation'
import type { TranscriptMessage } from '@/services/conversation-session'

export interface SimulationAudio {
  scenario: GuidedConversation
  playback: SpeechPlayback
  statusId: string
  rate: number
}

export function SimulationPronunciation({
  audio,
  id,
  message,
  label,
}: {
  audio: SimulationAudio
  id: string
  message: ConversationMessage
  label: string
}) {
  return (
    <PronunciationButton
      label={label}
      text={message.text}
      textLanguage="en"
      playbackId={id}
      playback={audio.playback}
      rate={audio.rate}
      descriptionId={audio.statusId}
      source={{
        kind: 'speech',
        language: 'en-US',
        speakerIds: audio.scenario.participants.map(({ id }) => id),
        parts: [{ id, text: message.text, speakerId: message.participantId }],
      }}
    />
  )
}

export function SimulationTurn({
  audio,
  message,
  translated,
  audioId,
  compact,
}: {
  audio: SimulationAudio
  message: TranscriptMessage
  translated: boolean
  audioId: string
  compact?: boolean
}) {
  const learner = message.participantId === audio.scenario.learnerId
  const role = audio.scenario.participants.find(
    ({ id }) => id === message.participantId,
  )?.role
  return (
    <div
      className={cn(
        'min-w-0 space-y-2 rounded-xl border border-plum/20 p-4',
        learner ? 'bg-lavender/45 sm:ml-auto' : 'bg-sage/50',
        compact && 'sm:w-[92%]',
      )}
    >
      <p className="text-sm font-extrabold">
        {learner ? `Você · ${role}` : role}
        {message.reviewed && (
          <span className="font-normal"> · Correção revisada</span>
        )}
      </p>
      <p lang="en" className="font-heading text-xl leading-snug font-semibold">
        {message.text}
      </p>
      {translated && (
        <p className="border-l-2 border-terracotta pl-3">
          {message.translation}
        </p>
      )}
      <SimulationPronunciation
        audio={audio}
        id={audioId}
        message={message}
        label={learner ? 'Ouvir sua fala' : 'Ouvir fala'}
      />
    </div>
  )
}

export function SimulationTranscript({
  audio,
  messages,
  translated,
}: {
  audio: SimulationAudio
  messages: readonly TranscriptMessage[]
  translated: boolean
}) {
  return (
    <ol className="space-y-3" aria-label="Falas em ordem">
      {messages.map((message) => (
        <li key={message.id}>
          <SimulationTurn
            audio={audio}
            message={message}
            audioId={`transcript-${message.id}`}
            translated={translated}
            compact
          />
        </li>
      ))}
    </ol>
  )
}
