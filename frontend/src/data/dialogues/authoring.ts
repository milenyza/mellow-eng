import { dialogueSummaries } from './index'
import { getPracticalExpressionId } from '@/data/phrasebooks/authoring'
import type {
  CommunicationNote,
  DialogueTurn,
  PracticalDialogue,
} from '@/types/practical-english'

type Turn = PracticalDialogue['turns'][number]
type TurnInput = readonly [
  id: string,
  participantId: string,
  text: string,
  translation: string,
  expressions?: readonly string[],
  pronunciation?: DialogueTurn['pronunciation'],
]
type NoteInput = readonly [
  id: string,
  text: string,
  expressions?: readonly string[],
]

export function defineDialogue(
  id: (typeof dialogueSummaries)[number]['id'],
  objectives: PracticalDialogue['objectives'],
  participants: PracticalDialogue['participants'],
  [first, ...remaining]: readonly [TurnInput, ...TurnInput[]],
  [firstNote, ...remainingNotes]: readonly [NoteInput, ...NoteInput[]],
): PracticalDialogue {
  const summary = dialogueSummaries.find((dialogue) => dialogue.id === id)!
  const references = (slugs: readonly string[] | undefined) =>
    slugs?.map((slug) => getPracticalExpressionId(summary.situationId, slug))
  const turn = ([
    id,
    participantId,
    text,
    translation,
    slugs,
    pronunciation,
  ]: TurnInput): Turn => ({
    id,
    participantId,
    text,
    translation,
    expressionIds: references(slugs),
    pronunciation,
  })
  const note = ([id, text, slugs]: NoteInput): CommunicationNote => ({
    id,
    text,
    expressionIds: references(slugs),
  })
  return {
    ...summary,
    objectives,
    participants,
    turns: [turn(first), ...remaining.map(turn)],
    notes: [note(firstNote), ...remainingNotes.map(note)],
    audioLanguage: 'en-US',
  }
}
