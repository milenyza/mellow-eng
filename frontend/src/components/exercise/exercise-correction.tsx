import type { Exercise } from '@/types/exercise'

export function ExerciseCorrection({
  exercise,
  language,
}: {
  exercise: Exercise
  language: string
}) {
  switch (exercise.kind) {
    case 'multiple-choice': {
      const option = exercise.options.find(
        ({ id }) => id === exercise.correctOptionId,
      )
      return <p lang={option?.language ?? language}>{option?.text}</p>
    }
    case 'fill-in-the-blanks':
      return (
        <ul lang={language} className="space-y-1">
          {exercise.blanks.map(({ id, before, after, acceptedAnswers }) => (
            <li key={id}>
              {before} <strong>{acceptedAnswers[0]}</strong>
              {after}
            </li>
          ))}
        </ul>
      )
    case 'sentence-builder':
      return (
        <p lang={language}>
          {exercise.correctOrder
            .map((id) => exercise.tiles.find((tile) => tile.id === id)?.text)
            .join(' ')}
        </p>
      )
    case 'matching-pairs':
      return (
        <ul className="space-y-1">
          {exercise.left.map(({ id, text }) => (
            <li key={id}>
              <span lang={language}>{text}</span>
              {' — '}
              {
                exercise.right.find(
                  (option) => option.id === exercise.correctPairs[id],
                )?.text
              }
            </li>
          ))}
        </ul>
      )
    case 'true-or-false':
      return <p>{exercise.correctValue ? 'Verdadeiro' : 'Falso'}</p>
  }
}
