import { firstTripStory } from '@/data/stories/first-trip'
import { evaluateExercise } from '@/services/exercise-evaluation'
import type { ReadingExercise } from '@/types/story'
import type { ExerciseAnswer } from '@/types/exercise'
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

it('keeps five valid comprehension exercises per chapter with stable, local paragraph references', () => {
  const ids = new Set<string>()
  const kinds = new Set<string>()
  for (const chapter of rainyMorningStory.chapters) {
    const { comprehension } = chapter
    expect(comprehension.exercises).toHaveLength(5)
    expect(ids.has(comprehension.id)).toBe(false)
    ids.add(comprehension.id)
    const paragraphs = new Set(chapter.paragraphs.map(({ id }) => id))
    for (const exercise of comprehension.exercises) {
      expect(ids.has(exercise.id)).toBe(false)
      ids.add(exercise.id)
      expect(exercise.feedback.trim()).not.toBe('')
      for (const id of exercise.paragraphIds)
        expect(paragraphs.has(id)).toBe(true)
      kinds.add(exercise.kind)
      const answer = correctReadingAnswer(exercise)
      expect(evaluateExercise(exercise, answer)).toBe('correct')
    }
  }
  expect(kinds).toEqual(
    new Set([
      'multiple-choice',
      'true-or-false',
      'fill-in-the-blanks',
      'matching-pairs',
      'sequence-ordering',
    ]),
  )
})

function correctReadingAnswer(exercise: ReadingExercise): ExerciseAnswer {
  switch (exercise.kind) {
    case 'multiple-choice':
      return { kind: exercise.kind, optionId: exercise.correctOptionId }
    case 'true-or-false':
      return { kind: exercise.kind, value: exercise.correctValue }
    case 'fill-in-the-blanks':
      return {
        kind: exercise.kind,
        values: Object.fromEntries(
          exercise.blanks.map(({ id, acceptedAnswers }) => [
            id,
            acceptedAnswers[0],
          ]),
        ),
      }
    case 'matching-pairs':
      return { kind: exercise.kind, pairs: exercise.correctPairs }
    case 'sequence-ordering':
      return { kind: exercise.kind, itemIds: exercise.correctOrder }
    case 'sentence-builder':
      return { kind: exercise.kind, tileIds: exercise.correctOrder }
  }
}

it.each([rainyMorningStory, firstTripStory])(
  'checks all vocabulary and exercise references for $title',
  (record) => {
    expect(record.chapters).toHaveLength(3)
    const ids = new Set<string>()
    for (const chapter of record.chapters) {
      const paragraphs = new Set(chapter.paragraphs.map(({ id }) => id))
      const words = new Set(chapter.vocabulary.map(({ id }) => id))
      expect(words.size).toBe(chapter.vocabulary.length)
      const referenced = new Set<string>()
      for (const paragraph of chapter.paragraphs) {
        const segments = getStorySegments(paragraph)
        expect(paragraph.translation.trim()).not.toBe('')
        expect(segments.map(({ text }) => text).join('')).toBe(paragraph.text)
        const references = segments.flatMap(({ vocabularyId }) =>
          vocabularyId ? [vocabularyId] : [],
        )
        expect(references.length).toBe(
          'vocabularyReferences' in paragraph
            ? paragraph.vocabularyReferences.length
            : 0,
        )
        for (const id of references) {
          expect(words.has(id)).toBe(true)
          referenced.add(id)
        }
      }
      expect(referenced).toEqual(words)
      for (const word of chapter.vocabulary) {
        expect(word.pronunciation).toMatch(/^\/.+\/$/)
        expect(word.meaning.trim()).not.toBe('')
        expect(word.example.text.trim()).not.toBe('')
        expect(word.example.translation.trim()).not.toBe('')
      }
      const exercises = chapter.comprehension.exercises
      expect(exercises.length).toBeGreaterThanOrEqual(4)
      expect(exercises.length).toBeLessThanOrEqual(6)
      for (const exercise of exercises) {
        expect(ids.has(exercise.id)).toBe(false)
        ids.add(exercise.id)
        expect(exercise.paragraphIds.every((id) => paragraphs.has(id))).toBe(
          true,
        )
        expect(evaluateExercise(exercise, correctReadingAnswer(exercise))).toBe(
          'correct',
        )
      }
    }
    if (record.id === 'the-first-trip') {
      expect(record.chapters.map(({ id }) => id)).toEqual([
        'a-ticket-to-the-coast',
        'the-right-platform',
        'by-the-window',
      ])
    }
  },
)
