import type { ConversationAttempt } from '@/types/conversation'
import type { DailyStudyTime } from '@/types/game'

export interface CompletedSimulationSession {
  sessionId: string
  situationId: string
  scenarioId: string
  startedAt: number
  completedAt: number
  decisionsCompleted: number
  reviewedCorrections: number
  attempts: readonly ConversationAttempt[]
  activeMs: number
  dailyPracticeMs: DailyStudyTime
}
