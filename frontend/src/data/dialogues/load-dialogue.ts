import { practicalSituations } from '@/data/practical-english'
import { loadPhrasebook } from '@/data/phrasebooks/load-phrasebook'
import { dialogueSummaries } from './index'
import type {
  PhrasebookSituationId,
  PracticalDialogue,
} from '@/types/practical-english'

const loaders: Record<
  PhrasebookSituationId,
  () => Promise<readonly PracticalDialogue[]>
> = {
  'at-the-airport': () =>
    import('./airport-dialogues').then(
      ({ airportDialogues }) => airportDialogues,
    ),
  'at-the-hotel': () =>
    import('./hotel-dialogues').then(({ hotelDialogues }) => hotelDialogues),
  'restaurants-and-coffee-shops': () =>
    import('./food-and-drink-dialogues').then(
      ({ foodAndDrinkDialogues }) => foodAndDrinkDialogues,
    ),
}

export async function loadPracticalDialogue(
  situationId: string | undefined,
  dialogueId: string | undefined,
) {
  const situation = practicalSituations.find(({ id }) => id === situationId)
  const choices = dialogueSummaries.filter(
    (dialogue) => dialogue.situationId === situationId,
  )
  if (
    situation?.phrasebook !== 'available' ||
    !choices.some(({ id }) => id === dialogueId)
  )
    return { situation, choices }

  const [dialogues, phrasebook] = await Promise.all([
    loaders[situation.id](),
    loadPhrasebook(situation.id),
  ])
  return {
    situation,
    choices,
    dialogue: dialogues.find(({ id }) => id === dialogueId),
    phrasebook,
  }
}
