import { describe, expect, it } from 'vitest'
import { stories, storyGenreLabels } from '@/data/stories'
import { filterStories, type StoryFilters } from './story-library'

const filters: StoryFilters = { title: '', level: '', genre: '' }

describe('story collection', () => {
  it('contains two published stories and four planned outlines and keeps identifiers and covers unique', () => {
    expect(
      stories.map(({ title, level, genres }) => ({ title, level, genres })),
    ).toEqual([
      { title: 'A Rainy Morning', level: 'A1', genres: ['everyday-life'] },
      { title: 'The First Trip', level: 'A1', genres: ['travel'] },
      { title: 'The New Neighbor', level: 'A1', genres: ['friendship'] },
      {
        title: 'A Letter from London',
        level: 'A2',
        genres: ['travel', 'everyday-life'],
      },
      {
        title: 'The Bookshop on the Corner',
        level: 'A2',
        genres: ['slice-of-life'],
      },
      { title: 'A Weekend Away', level: 'B1', genres: ['adventure'] },
    ])
    expect(new Set(stories.map(({ id }) => id)).size).toBe(stories.length)
    expect(new Set(stories.map(({ cover }) => cover)).size).toBe(stories.length)

    expect(
      stories
        .filter(({ publication }) => publication === 'available')
        .map(({ id }) => id),
    ).toEqual(['a-rainy-morning', 'the-first-trip'])
    for (const story of stories) {
      expect(story.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
      expect(story.cover).toMatch(
        /^(data:image\/svg\+xml[,;]|\/.*\.svg(?:\?.*)?$)/,
      )
      expect(story.description.trim()).not.toBe('')
      expect(
        story.objectives.every((objective) => objective.trim().length > 0),
      ).toBe(true)
      expect(story.readingMinutes).toBeGreaterThan(0)
      expect(new Set(story.genres).size).toBe(story.genres.length)
      expect(
        story.genres.every((genre) => Object.hasOwn(storyGenreLabels, genre)),
      ).toBe(true)
      expect(story.chapters.length).toBeGreaterThanOrEqual(3)
      expect(story.chapters.length).toBeLessThanOrEqual(4)
      expect(new Set(story.chapters.map(({ id }) => id)).size).toBe(
        story.chapters.length,
      )
      for (const chapter of story.chapters) {
        expect(chapter.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
        expect(chapter.title.trim()).not.toBe('')
        expect(chapter.description.trim()).not.toBe('')
        if (story.publication === 'planned')
          expect(chapter).not.toHaveProperty('paragraphs')
      }
    }
  })

  it('filters stories by CEFR level and by either genre on a multi-genre story', () => {
    expect(filterStories(stories, { ...filters, level: 'A1' })).toHaveLength(3)
    expect(
      filterStories(stories, { ...filters, genre: 'travel' }).map(
        ({ id }) => id,
      ),
    ).toEqual(['the-first-trip', 'a-letter-from-london'])
    expect(
      filterStories(stories, { ...filters, genre: 'everyday-life' }).map(
        ({ id }) => id,
      ),
    ).toEqual(['a-rainy-morning', 'a-letter-from-london'])
  })

  it('matches only titles while ignoring case and redundant whitespace', () => {
    expect(
      filterStories(stories, { ...filters, title: '  BOOKSHOP  ON ' }).map(
        ({ id }) => id,
      ),
    ).toEqual(['the-bookshop-on-the-corner'])
    expect(filterStories(stories, { ...filters, title: 'plataforma' })).toEqual(
      [],
    )
    expect(filterStories(stories, { ...filters, title: '  ' })).toEqual(stories)
  })

  it('combines all filters and can return no matches', () => {
    expect(
      filterStories(stories, {
        title: 'london',
        level: 'A2',
        genre: 'everyday-life',
      }),
    ).toEqual([stories[3]])
    expect(
      filterStories(stories, { title: 'london', level: 'A1', genre: 'travel' }),
    ).toEqual([])
  })
})
