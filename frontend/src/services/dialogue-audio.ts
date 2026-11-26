import type { AudioSource } from '@/types/audio'
import type { PracticalDialogue } from '@/types/practical-english'

export function createDialogueAudio(
  dialogue: PracticalDialogue,
  turnId?: string,
): AudioSource {
  const turns = turnId
    ? dialogue.turns.filter(({ id }) => id === turnId)
    : dialogue.turns
  return {
    kind: 'speech',
    language: dialogue.audioLanguage ?? 'en-US',
    speakerIds: dialogue.participants.map(({ id }) => id),
    parts: turns.flatMap((turn) =>
      (turn.audio?.parts ?? [{ text: turn.text }]).map(({ text }) => ({
        text,
        id: turn.id,
        speakerId: turn.participantId,
      })),
    ),
  }
}
