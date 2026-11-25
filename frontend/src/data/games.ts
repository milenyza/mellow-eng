import { gameTitles } from '@/data/game-labels'
import type { GameConfiguration } from '@/types/game'

export const games = [
  {
    id: 'word-match',
    type: 'word-match',
    title: gameTitles['word-match'],
    description: 'Ligue palavras em inglês aos seus significados em português.',
    levels: ['A1'],
    estimatedMinutes: 3,
    objectives: ['Reconhecer palavras e expressões do dia a dia.'],
    difficulties: [
      { id: 'easy', roundSize: 4 },
      { id: 'medium', roundSize: 6 },
      { id: 'hard', roundSize: 8 },
    ],
    content: [
      { kind: 'lesson-vocabulary' },
      { kind: 'story-vocabulary' },
      { kind: 'saved-vocabulary' },
    ],
    publication: 'available',
  },
  {
    id: 'sentence-builder',
    type: 'sentence-builder',
    title: gameTitles['sentence-builder'],
    description: 'Organize palavras para formar frases em inglês.',
    levels: ['A1'],
    estimatedMinutes: 5,
    objectives: ['Praticar a ordem das palavras em frases curtas.'],
    difficulties: [
      { id: 'easy', roundSize: 5 },
      { id: 'medium', roundSize: 8 },
      { id: 'hard', roundSize: 10 },
    ],
    content: [{ kind: 'lesson-grammar' }],
    publication: 'available',
  },
  {
    id: 'memory-game',
    type: 'memory',
    title: gameTitles['memory-game'],
    description:
      'Vire cartas e encontre cada expressão em inglês com seu significado em português.',
    levels: ['A1'],
    estimatedMinutes: 6,
    objectives: ['Relembrar palavras em inglês e seus significados.'],
    difficulties: [
      { id: 'easy', roundSize: 4 },
      { id: 'medium', roundSize: 6 },
      { id: 'hard', roundSize: 8 },
    ],
    content: [
      { kind: 'lesson-vocabulary' },
      { kind: 'story-vocabulary' },
      { kind: 'saved-vocabulary' },
    ],
    publication: 'available',
  },
] as const satisfies readonly GameConfiguration[]

export const wordMatchGame = games[0]
export const sentenceBuilderGame = games[1]
export const memoryGame = games[2]
