import type { AudioSource } from '@/types/audio'
import type {
  FillInTheBlanksExercise,
  MultipleChoiceExercise,
  PracticeSession,
  TrueOrFalseExercise,
} from '@/types/exercise'

interface ListeningLine {
  id: string
  text: string
  translation: string
  speaker?: string
}

interface ListeningActivityBase {
  source: Omit<AudioSource, 'parts'> & {
    parts: readonly [ListeningLine, ...ListeningLine[]]
  }
  textAlternative: string
}

export type ListeningActivity = ListeningActivityBase &
  (
    | { format: 'listen-and-choose'; exercise: MultipleChoiceExercise }
    | { format: 'listen-and-write'; exercise: FillInTheBlanksExercise }
    | {
        format: 'dialogue-comprehension'
        exercise: MultipleChoiceExercise | TrueOrFalseExercise
      }
  )

export interface ListeningSession {
  answers?: PracticeSession
  textActivityIds: readonly string[]
  heardActivityIds: readonly string[]
}
