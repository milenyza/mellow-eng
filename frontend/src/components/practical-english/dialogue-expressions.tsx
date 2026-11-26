import { PracticalExpressionReview } from './practical-expression-review'
import type { Phrasebook, PracticalDialogue } from '@/types/practical-english'

export function DialogueExpressions({
  dialogue,
  phrasebook,
}: {
  dialogue: PracticalDialogue
  phrasebook: Phrasebook
}) {
  return (
    <PracticalExpressionReview
      expressionIds={[...dialogue.turns, ...dialogue.notes].flatMap(
        ({ expressionIds }) => expressionIds ?? [],
      )}
      phrasebook={phrasebook}
      sectionId="expressoes-do-dialogo"
      title="Expressões do diálogo"
    />
  )
}
