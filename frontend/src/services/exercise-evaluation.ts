import type {
  Exercise,
  ExerciseAnswer,
  ExerciseResult,
  SentenceBuilderExercise,
} from '@/types/exercise'

export function normalizeTextAnswer(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function result(correct: boolean): ExerciseResult {
  return correct ? 'correct' : 'incorrect'
}

function evaluateOrder(
  choices: readonly { id: string }[],
  expected: readonly string[],
  selected: readonly string[],
): ExerciseResult {
  if (
    selected.length === 0 ||
    selected.length !== expected.length ||
    new Set(selected).size !== selected.length ||
    !selected.every((id) => choices.some((choice) => choice.id === id))
  )
    return 'incomplete'
  return result(expected.every((id, index) => id === selected[index]))
}

export function evaluateSentenceOrder(
  exercise: SentenceBuilderExercise,
  selected: readonly string[],
): ExerciseResult {
  const { tiles, correctOrder, alternativeOrders = [] } = exercise
  const text = new Map(tiles.map(({ id, text }) => [id, text]))
  if (
    selected.length === 0 ||
    selected.length !== correctOrder.length ||
    new Set(selected).size !== selected.length ||
    !selected.every((id) => text.has(id))
  )
    return 'incomplete'

  return result(
    [correctOrder, ...alternativeOrders].some(
      (order) =>
        order.length === selected.length &&
        order.every(
          (id, index) =>
            text.has(id) && text.get(id) === text.get(selected[index]),
        ),
    ),
  )
}

export function evaluateExercise(
  exercise: Exercise,
  answer: ExerciseAnswer | null,
): ExerciseResult {
  switch (exercise.kind) {
    case 'multiple-choice': {
      if (
        answer?.kind !== exercise.kind ||
        !exercise.options.some(({ id }) => id === answer.optionId)
      )
        return 'incomplete'
      return result(answer.optionId === exercise.correctOptionId)
    }
    case 'fill-in-the-blanks': {
      if (answer?.kind !== exercise.kind) return 'incomplete'
      const blanks = exercise.blanks.map(({ id, acceptedAnswers }) => ({
        value: normalizeTextAnswer(answer.values[id] ?? ''),
        acceptedAnswers,
      }))
      if (blanks.length === 0 || blanks.some(({ value }) => !value))
        return 'incomplete'
      return result(
        blanks.every(({ value, acceptedAnswers }) =>
          acceptedAnswers.some(
            (alternative) => normalizeTextAnswer(alternative) === value,
          ),
        ),
      )
    }
    case 'sentence-builder':
      return answer?.kind === exercise.kind
        ? evaluateSentenceOrder(exercise, answer.tileIds)
        : 'incomplete'
    case 'sequence-ordering':
      return answer?.kind === exercise.kind &&
        exercise.correctOrder.length === exercise.items.length
        ? evaluateOrder(exercise.items, exercise.correctOrder, answer.itemIds)
        : 'incomplete'
    case 'matching-pairs': {
      if (answer?.kind !== exercise.kind) return 'incomplete'
      const selected = exercise.left.map(({ id }) => answer.pairs[id])
      if (
        selected.length === 0 ||
        new Set(selected).size !== selected.length ||
        !selected.every((id) =>
          exercise.right.some((option) => option.id === id),
        )
      )
        return 'incomplete'
      return result(
        exercise.left.every(
          ({ id }) => answer.pairs[id] === exercise.correctPairs[id],
        ),
      )
    }
    case 'true-or-false':
      return answer?.kind === exercise.kind
        ? result(answer.value === exercise.correctValue)
        : 'incomplete'
  }
}
