import { describe, expect, it } from 'vitest'
import { introductionsExercises } from '@/data/curriculum/introductions-exercises'
import { evaluateExercise, normalizeTextAnswer } from './exercise-evaluation'

const [
  choice,
  blanks,
  builder,
  matching,
  affirmation,
  ,
  alternatives,
  ,
  ,
  negation,
] = introductionsExercises

describe('evaluateExercise', () => {
  it('evaluates a multiple choice option by its stable identifier', () => {
    expect(
      evaluateExercise(choice, {
        kind: 'multiple-choice',
        optionId: 'morning',
      }),
    ).toBe('correct')
    expect(
      evaluateExercise(choice, {
        kind: 'multiple-choice',
        optionId: 'goodbye',
      }),
    ).toBe('incorrect')
    expect(
      evaluateExercise(choice, {
        kind: 'multiple-choice',
        optionId: 'unknown',
      }),
    ).toBe('incomplete')
  })

  it('normalizes case and whitespace but does not silently fix spelling or punctuation', () => {
    expect(normalizeTextAnswer('  I \t AM \n')).toBe('i am')
    expect(
      evaluateExercise(blanks, {
        kind: 'fill-in-the-blanks',
        values: { verb: ' IS ' },
      }),
    ).toBe('correct')
    expect(
      evaluateExercise(blanks, {
        kind: 'fill-in-the-blanks',
        values: { verb: 'iz' },
      }),
    ).toBe('incorrect')
    expect(
      evaluateExercise(blanks, {
        kind: 'fill-in-the-blanks',
        values: { verb: 'is.' },
      }),
    ).toBe('incorrect')
  })

  it.each(['I am', ' I  AM ', 'I’m', "I'm"])(
    'accepts the configured text alternative %s',
    (value) => {
      expect(
        evaluateExercise(alternatives, {
          kind: 'fill-in-the-blanks',
          values: { 'subject-verb': value },
        }),
      ).toBe('correct')
    },
  )

  it('requires every blank and rejects whitespace-only answers', () => {
    const multiBlank = {
      ...blanks,
      blanks: [...blanks.blanks, ...alternatives.blanks],
    }
    expect(
      evaluateExercise(multiBlank, {
        kind: 'fill-in-the-blanks',
        values: { verb: 'is' },
      }),
    ).toBe('incomplete')
    expect(
      evaluateExercise(blanks, {
        kind: 'fill-in-the-blanks',
        values: { verb: ' \t ' },
      }),
    ).toBe('incomplete')
    expect(
      evaluateExercise(multiBlank, {
        kind: 'fill-in-the-blanks',
        values: { verb: 'is', 'subject-verb': "I'm" },
      }),
    ).toBe('correct')
  })

  it('uses the exact tile order and rejects partial or reused tiles', () => {
    expect(
      evaluateExercise(builder, {
        kind: 'sentence-builder',
        tileIds: ['whats', 'your', 'name'],
      }),
    ).toBe('correct')
    expect(
      evaluateExercise(builder, {
        kind: 'sentence-builder',
        tileIds: ['your', 'whats', 'name'],
      }),
    ).toBe('incorrect')
    expect(
      evaluateExercise(builder, {
        kind: 'sentence-builder',
        tileIds: ['whats', 'your'],
      }),
    ).toBe('incomplete')
    expect(
      evaluateExercise(builder, {
        kind: 'sentence-builder',
        tileIds: ['whats', 'your', 'your'],
      }),
    ).toBe('incomplete')
  })

  it('requires a unique valid translation for each matching row', () => {
    expect(
      evaluateExercise(matching, {
        kind: 'matching-pairs',
        pairs: { morning: 'morning', afternoon: 'afternoon', evening: 'night' },
      }),
    ).toBe('correct')
    expect(
      evaluateExercise(matching, {
        kind: 'matching-pairs',
        pairs: { morning: 'night', afternoon: 'afternoon', evening: 'morning' },
      }),
    ).toBe('incorrect')
    expect(
      evaluateExercise(matching, {
        kind: 'matching-pairs',
        pairs: { morning: 'morning', afternoon: 'morning', evening: 'night' },
      }),
    ).toBe('incomplete')
    expect(
      evaluateExercise(matching, {
        kind: 'matching-pairs',
        pairs: { morning: 'morning', afternoon: 'afternoon' },
      }),
    ).toBe('incomplete')
  })

  it('accepts false as a complete answer and checks either truth value accurately', () => {
    expect(
      evaluateExercise(affirmation, { kind: 'true-or-false', value: true }),
    ).toBe('correct')
    expect(
      evaluateExercise(affirmation, { kind: 'true-or-false', value: false }),
    ).toBe('incorrect')
    expect(
      evaluateExercise(negation, { kind: 'true-or-false', value: false }),
    ).toBe('correct')
  })

  it('treats a missing or mismatched answer as incomplete', () => {
    for (const exercise of introductionsExercises) {
      expect(evaluateExercise(exercise, null)).toBe('incomplete')
    }
    expect(
      evaluateExercise(choice, { kind: 'true-or-false', value: true }),
    ).toBe('incomplete')
  })
})
