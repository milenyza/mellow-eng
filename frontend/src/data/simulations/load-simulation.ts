import { dialogueSummaries } from '@/data/dialogues'
import { loadPhrasebook } from '@/data/phrasebooks/load-phrasebook'
import { practicalSituations } from '@/data/practical-english'
import { validateConversation } from '@/services/conversation-validation'
import type { GuidedConversation } from '@/types/conversation'
import type { PhrasebookSituationId } from '@/types/practical-english'
import { simulationSummaries } from './index'

const loaders: Record<
  PhrasebookSituationId,
  () => Promise<readonly GuidedConversation[]>
> = {
  'at-the-airport': () =>
    import('./airport-simulations').then(
      ({ airportSimulations }) => airportSimulations,
    ),
  'at-the-hotel': () =>
    import('./hotel-simulations').then(
      ({ hotelSimulations }) => hotelSimulations,
    ),
  'restaurants-and-coffee-shops': () =>
    import('./food-and-drink-simulations').then(
      ({ foodAndDrinkSimulations }) => foodAndDrinkSimulations,
    ),
}

export async function loadSimulation(
  situationId?: string,
  scenarioId?: string,
) {
  const situation = practicalSituations.find(({ id }) => id === situationId)
  const summaries = simulationSummaries.filter(
    (scenario) => scenario.situationId === situationId,
  )
  if (
    situation?.phrasebook !== 'available' ||
    !summaries.some(({ id }) => id === scenarioId)
  )
    return { situation, summaries }

  const [scenarios, phrasebook] = await Promise.all([
    loaders[situation.id](),
    loadPhrasebook(situation.id),
  ])
  const scenario = scenarios.find(
    (item) => item.id === scenarioId && item.situationId === situation.id,
  )
  const references = {
    expressionIds: new Set(
      phrasebook.groups.flatMap(({ expressions }) =>
        expressions.map(({ id }) => id),
      ),
    ),
    dialogueIds: new Set(
      dialogueSummaries
        .filter(({ situationId }) => situationId === situation.id)
        .map(({ id }) => id),
    ),
  }
  if (
    !scenario ||
    validateConversation(scenario, references).length ||
    (scenario.outlineId &&
      !situation.scenarios.some(({ id }) => id === scenario.outlineId))
  )
    return { situation, summaries }

  return { situation, summaries, scenario, phrasebook }
}
