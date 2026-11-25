interface ExerciseBase {
  id: string
  instructions: string
  prompt: string
  feedback: string
  hint?: string
  requiredForCompletion?: boolean
}

export interface ExerciseOption {
  id: string
  text: string
  language?: string
}

export type MultipleChoiceExercise = ExerciseBase & {
  kind: 'multiple-choice'
  options: readonly ExerciseOption[]
  correctOptionId: string
}

export type FillInTheBlanksExercise = ExerciseBase & {
  kind: 'fill-in-the-blanks'
  blanks: readonly {
    id: string
    before: string
    after: string
    acceptedAnswers: readonly [string, ...string[]]
  }[]
}

export type SentenceBuilderExercise = ExerciseBase & {
  kind: 'sentence-builder'
  tiles: readonly ExerciseOption[]
  correctOrder: readonly string[]
}

export type MatchingPairsExercise = ExerciseBase & {
  kind: 'matching-pairs'
  left: readonly ExerciseOption[]
  right: readonly ExerciseOption[]
  correctPairs: Readonly<Record<string, string>>
}

export type TrueOrFalseExercise = ExerciseBase & {
  kind: 'true-or-false'
  correctValue: boolean
}

export type Exercise =
  | MultipleChoiceExercise
  | FillInTheBlanksExercise
  | SentenceBuilderExercise
  | MatchingPairsExercise
  | TrueOrFalseExercise

export type ExerciseAnswer =
  | { kind: 'multiple-choice'; optionId: string }
  | { kind: 'fill-in-the-blanks'; values: Readonly<Record<string, string>> }
  | { kind: 'sentence-builder'; tileIds: readonly string[] }
  | { kind: 'matching-pairs'; pairs: Readonly<Record<string, string>> }
  | { kind: 'true-or-false'; value: boolean }

export type ExerciseResult = 'incomplete' | 'incorrect' | 'correct'

export type SubmissionMode =
  'practice' | 'listening' | 'text-alternative' | 'no-audio'

export interface ExerciseSubmission {
  answer: ExerciseAnswer
  correct: boolean
  submittedAt: number
  mode: SubmissionMode
}

export interface ExerciseAttempt {
  answer: ExerciseAnswer | null
  status: 'editing' | 'incorrect' | 'correct' | 'reviewed'
  submissions: readonly ExerciseSubmission[]
  reviewedAt?: number
}

export interface PracticeSession {
  index: number
  attempts: Readonly<Record<string, ExerciseAttempt | undefined>>
  finished: boolean
}
