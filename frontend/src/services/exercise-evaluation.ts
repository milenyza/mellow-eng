import type { Exercise, ExerciseAnswer, ExerciseResult } from '@/types/exercise'

export function normalizeTextAnswer(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function result(correct: boolean): ExerciseResult {
  return correct ? 'correct' : 'incorrect'
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
    case 'sentence-builder': {
      if (answer?.kind !== exercise.kind) return 'incomplete'
      const { tileIds } = answer
      if (
        tileIds.length === 0 ||
        tileIds.length !== exercise.correctOrder.length ||
        new Set(tileIds).size !== tileIds.length ||
        !tileIds.every((id) => exercise.tiles.some((tile) => tile.id === id))
      )
        return 'incomplete'
      return result(
        exercise.correctOrder.every((id, index) => id === tileIds[index]),
      )
    }
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
