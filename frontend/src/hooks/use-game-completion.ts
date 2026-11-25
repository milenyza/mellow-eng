import { useProgress } from '@/hooks/use-progress'
import { recordGameSession } from '@/services/game-history'
import type { GameSessionResult } from '@/types/game'

export function useGameCompletion(sessionId?: string) {
  const { data, persistence, repository } = useProgress()
  return {
    completed:
      sessionId !== undefined &&
      Object.hasOwn(data.gameSessions ?? {}, sessionId),
    persistence,
    record: (result: GameSessionResult) =>
      repository.update((data) => recordGameSession(data, result)),
  }
}
