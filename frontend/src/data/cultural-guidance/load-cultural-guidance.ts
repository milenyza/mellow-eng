import { loadPhrasebook } from '@/data/phrasebooks/load-phrasebook'
import { practicalSituations } from '@/data/practical-english'
import type {
  CulturalGuidance,
  PhrasebookSituationId,
} from '@/types/practical-english'

const loaders: Record<
  PhrasebookSituationId,
  () => Promise<{ default: readonly CulturalGuidance[] }>
> = {
  'at-the-airport': () => import('./airport-guidance'),
  'at-the-hotel': () => import('./hotel-guidance'),
  'restaurants-and-coffee-shops': () => import('./food-and-drink-guidance'),
  shopping: () => import('./shopping-guidance'),
  'getting-around': () => import('./transportation-guidance'),
  'meeting-people': () => import('./meeting-people-guidance'),
  'health-and-emergencies': () => import('./health-and-emergencies-guidance'),
  'around-the-city': () => import('./around-the-city-guidance'),
}

export async function loadCulturalGuidance(situationId?: string) {
  const situation = practicalSituations.find(({ id }) => id === situationId)
  if (
    situation?.phrasebook !== 'available' ||
    situation.publication !== 'available'
  )
    return { situation }
  const [{ default: guidance }, phrasebook] = await Promise.all([
    loaders[situation.id](),
    loadPhrasebook(situation.id),
  ])
  return { situation, guidance, phrasebook }
}
