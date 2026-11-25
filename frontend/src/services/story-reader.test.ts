import { describe, expect, it } from 'vitest'
import { rainyMorningStory } from '@/data/stories/rainy-morning'
import { getStorySegments, storySpeechSource } from './story-reader'

describe('A Rainy Morning content', () => {
  it('preserves its story and chapter identifiers and provides complete English and Portuguese paragraphs', () => {
    expect(rainyMorningStory.id).toBe('a-rainy-morning')
    expect(
      rainyMorningStory.chapters.map(({ id, title }) => [id, title]),
    ).toEqual([
      ['rain-at-the-window', 'Rain at the Window'],
      ['inside-the-bakery', 'Inside the Bakery'],
      ['back-on-the-street', 'Back on the Street'],
    ])
    const paragraphs = rainyMorningStory.chapters.flatMap(
      ({ paragraphs }) => paragraphs,
    )
    expect(new Set(paragraphs.map(({ id }) => id)).size).toBe(paragraphs.length)
    for (const { text, translation } of paragraphs) {
      expect(text.trim().length).toBeGreaterThan(0)
      expect(translation.trim().length).toBeGreaterThan(0)
    }
  })

  it('resolves every contextual reference and preserves the original text for narration', () => {
    const ids = new Set<string>()
    for (const chapter of rainyMorningStory.chapters) {
      for (const entry of chapter.vocabulary) {
        expect(ids.has(entry.id)).toBe(false)
        ids.add(entry.id)
        expect(entry.word.trim()).not.toBe('')
        expect(entry.pronunciation).toMatch(/^\/.+\/$/)
        expect(entry.meaning.trim()).not.toBe('')
        expect(entry.example.text.trim()).not.toBe('')
        expect(entry.example.translation.trim()).not.toBe('')
      }

      const referencedIds = new Set<string>()
      for (const paragraph of chapter.paragraphs) {
        const segments = getStorySegments(paragraph)
        expect(segments.map(({ text }) => text).join('')).toBe(paragraph.text)
        expect(
          segments
            .filter(({ vocabularyId }) => vocabularyId)
            .map(({ vocabularyId, text }) => ({
              vocabularyId,
              phrase: text,
            })),
        ).toEqual(
          'vocabularyReferences' in paragraph
            ? paragraph.vocabularyReferences
            : [],
        )
        for (const segment of segments) {
          if (segment.vocabularyId) referencedIds.add(segment.vocabularyId)
        }
      }
      expect(referencedIds).toEqual(
        new Set(chapter.vocabulary.map(({ id }) => id)),
      )
      expect(storySpeechSource(chapter.paragraphs)).toEqual({
        kind: 'speech',
        language: 'en-US',
        parts: chapter.paragraphs.map(({ text }) => ({ text })),
      })
    }
  })
})
