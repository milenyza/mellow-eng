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
  shopping: () =>
    import('./shopping').then(({ shoppingPhrasebook }) => shoppingPhrasebook),
  'getting-around': () =>
    import('./transportation').then(
      ({ transportationPhrasebook }) => transportationPhrasebook,
    ),
  'meeting-people': () =>
    import('./meeting-people').then(
      ({ meetingPeoplePhrasebook }) => meetingPeoplePhrasebook,
    ),
  'health-and-emergencies': () =>
    import('./health-and-emergencies').then(
      ({ healthAndEmergenciesPhrasebook }) => healthAndEmergenciesPhrasebook,
    ),
  'around-the-city': () =>
    import('./around-the-city').then(
      ({ aroundTheCityPhrasebook }) => aroundTheCityPhrasebook,
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
