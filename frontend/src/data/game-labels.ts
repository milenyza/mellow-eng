import type { CompletedGameSession } from '@/types/game-history'
import type { GameDifficulty } from '@/types/game'

export const difficultyLabels: Record<GameDifficulty, string> = {
  basic: 'Básica',
  intermediate: 'Intermediária',
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
}

export const gameTitles = {
  'word-match': 'Word Match',
  'sentence-builder': 'Sentence Builder',
  'memory-game': 'Memory Game',
} satisfies Record<CompletedGameSession['gameId'], string>

export function gameTitle(gameId: CompletedGameSession['gameId']) {
  return gameTitles[gameId]
}
