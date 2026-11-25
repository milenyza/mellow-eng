import type { MemoryBoard } from '@/types/memory-game'

type PendingCards =
  | { kind: 'none' }
  | { kind: 'first'; id: string }
  | { kind: 'mismatch'; ids: readonly [string, string] }

export interface MemoryRun {
  pending: PendingCards
  matchedIds: readonly string[]
  attemptCount: number
  incorrectAttempts: number
  feedback: 'ready' | 'matched' | 'continue'
}

export function initialMemoryRun(): MemoryRun {
  return {
    pending: { kind: 'none' },
    matchedIds: [],
    attemptCount: 0,
    incorrectAttempts: 0,
    feedback: 'ready',
  }
}

export function revealMemoryCard(
  run: MemoryRun,
  board: MemoryBoard,
  id: string,
): MemoryRun {
  const { pending } = run
  if (pending.kind === 'mismatch') return run
  const card = board.cards.find((candidate) => candidate.id === id)
  if (!card || run.matchedIds.includes(card.pair.id)) return run

  if (pending.kind === 'none') return { ...run, pending: { kind: 'first', id } }
  const first = board.cards.find((candidate) => candidate.id === pending.id)
  if (!first || first.id === id) return run

  const attemptCount = run.attemptCount + 1
  if (first.pair.id === card.pair.id && first.language !== card.language) {
    return {
      ...run,
      attemptCount,
      matchedIds: [...run.matchedIds, card.pair.id],
      pending: { kind: 'none' },
      feedback: 'matched',
    }
  }
  return {
    ...run,
    attemptCount,
    incorrectAttempts: run.incorrectAttempts + 1,
    pending: { kind: 'mismatch', ids: [first.id, id] },
  }
}

export function dismissMemoryMismatch(run: MemoryRun): MemoryRun {
  return run.pending.kind === 'mismatch'
    ? { ...run, pending: { kind: 'none' }, feedback: 'continue' }
    : run
}
