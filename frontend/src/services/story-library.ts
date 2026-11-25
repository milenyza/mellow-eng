import { getReadingStatus } from '@/services/reading-progress'
import type { ReadingProgress, ReadingStatus } from '@/types/progress'
import type { CefrCode } from '@/types/curriculum'
import type { Story, StoryGenre } from '@/types/story'

export interface StoryFilters {
  title: string
  level: CefrCode | ''
  genre: StoryGenre | ''
  status?: ReadingStatus | ''
}

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function filterStories(
  stories: readonly Story[],
  filters: StoryFilters,
  progress: ReadingProgress['stories'] = {},
) {
  const title = normalizeTitle(filters.title)
  return stories.filter(
    (story) =>
      (!filters.level || story.level === filters.level) &&
      (!filters.genre || story.genres.includes(filters.genre)) &&
      (!filters.status ||
        (story.publication === 'available' &&
          getReadingStatus(progress[story.id]) === filters.status)) &&
      normalizeTitle(story.title).includes(title),
  )
}
