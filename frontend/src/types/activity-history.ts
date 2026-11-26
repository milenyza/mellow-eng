import type { CompletedGameSession } from '@/types/game-history'

export type ActivityModule =
  'lessons' | 'stories' | 'games' | 'practical' | 'notebook'

type ActivityDescription =
  | {
      kind: 'lesson'
      module: 'lessons'
      sessionId: string
      classification: 'milestone' | 'session'
    }
  | { kind: 'story'; module: 'stories'; classification: 'milestone' }
  | {
      kind: 'chapter'
      module: 'stories'
      classification: 'milestone'
      parentId: string
    }
  | {
      kind: 'game'
      module: 'games'
      classification: 'session'
      contentId: CompletedGameSession['gameId']
      sessionId: string
      completedItems: number
      attempts: number
    }
  | {
      kind: 'simulation'
      module: 'practical'
      classification: 'session'
      parentId: string
      sessionId: string
      decisions: number
      attempts: number
      corrections: number
    }
  | {
      kind: 'flashcard'
      module: 'notebook'
      classification: 'session'
      sessionId: string
      vocabulary: number
    }

export type RecordedActivity = ActivityDescription & {
  id: string
  contentId: string
  at: number
  day: string
  status: 'completed'
  durationMs?: number
}
