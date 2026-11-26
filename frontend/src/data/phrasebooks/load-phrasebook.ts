import { practicalSituations } from '@/data/practical-english'
import type {
  Phrasebook,
  PhrasebookSituationId,
} from '@/types/practical-english'

const loaders: Record<PhrasebookSituationId, () => Promise<Phrasebook>> = {
  'at-the-airport': () =>
    import('./airport').then(({ airportPhrasebook }) => airportPhrasebook),
  'at-the-hotel': () =>
    import('./hotel').then(({ hotelPhrasebook }) => hotelPhrasebook),
  'restaurants-and-coffee-shops': () =>
    import('./food-and-drink').then(
      ({ foodAndDrinkPhrasebook }) => foodAndDrinkPhrasebook,
    ),
}

export function loadPhrasebook(situationId: PhrasebookSituationId) {
  return loaders[situationId]()
}

export async function loadPracticalSituation(situationId: string | undefined) {
  const situation = practicalSituations.find(({ id }) => id === situationId)
  return {
    situation,
    phrasebook:
      situation?.phrasebook === 'available'
        ? await loadPhrasebook(situation.id)
        : undefined,
  }
}
