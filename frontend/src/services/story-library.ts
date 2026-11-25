import type { CefrCode } from '@/types/curriculum'
import type { Story, StoryGenre } from '@/types/story'

export interface StoryFilters {
  title: string
  level: CefrCode | ''
  genre: StoryGenre | ''
}

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function filterStories(
  stories: readonly Story[],
  filters: StoryFilters,
) {
  const title = normalizeTitle(filters.title)
  return stories.filter(
    (story) =>
      (!filters.level || story.level === filters.level) &&
      (!filters.genre || story.genres.includes(filters.genre)) &&
      normalizeTitle(story.title).includes(title),
  )
}
