import cornerBookshop from '@/assets/stories/corner-bookshop.svg'
import letterFromLondon from '@/assets/stories/letter-from-london.svg'
import newNeighbor from '@/assets/stories/new-neighbor.svg'
import weekendAway from '@/assets/stories/weekend-away.svg'
import type { Story, StoryGenre } from '@/types/story'
import { plannedStories } from './story-index'
import { firstTripStory } from './stories/first-trip'
import { rainyMorningStory } from './stories/rainy-morning'

export const storyGenreLabels = {
  'everyday-life': 'Vida cotidiana',
  travel: 'Viagem',
  friendship: 'Amizade',
  'slice-of-life': 'Retrato do cotidiano',
  adventure: 'Aventura',
} satisfies Record<StoryGenre, string>

const plannedStoryCovers = {
  'the-new-neighbor': newNeighbor,
  'a-letter-from-london': letterFromLondon,
  'the-bookshop-on-the-corner': cornerBookshop,
  'a-weekend-away': weekendAway,
} satisfies Record<(typeof plannedStories)[number]['id'], string>

export const stories: readonly Story[] = [
  rainyMorningStory,
  firstTripStory,
  ...plannedStories.map((story) => ({
    ...story,
    cover: plannedStoryCovers[story.id],
  })),
]
