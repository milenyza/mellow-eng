import type { WordMatchRound, WordMatchSide } from '@/types/word-match'

interface Choice {
  side: WordMatchSide
  id: string
}

export interface MatchAttempt {
  englishId: string
  portugueseId: string
  correct: boolean
  firstForPair: boolean
}

export interface WordMatchRun {
  roundIndex: number
  selected: Choice | null
  matched: readonly string[]
  attempts: readonly MatchAttempt[]
  lastAttempt: MatchAttempt | null
  roundStart: number
}

export function initialWordMatchRun(): WordMatchRun {
  return {
    roundIndex: 0,
    selected: null,
    matched: [],
    attempts: [],
    lastAttempt: null,
    roundStart: 0,
  }
}

export function chooseWordMatchItem(
  run: WordMatchRun,
  round: WordMatchRound,
  choice: Choice,
): WordMatchRun {
  if (
    run.matched.includes(choice.id) ||
    !round[choice.side].some(({ id }) => id === choice.id)
  )
    return run
  const { selected } = run
  if (!selected || selected.side === choice.side) {
    return {
      ...run,
      selected: selected?.id === choice.id ? null : choice,
    }
  }

  const englishId = choice.side === 'english' ? choice.id : selected.id
  const portugueseId = choice.side === 'portuguese' ? choice.id : selected.id
  const correct = englishId === portugueseId
  const firstForPair = !run.attempts
    .slice(run.roundStart)
    .some(
      (attempt) =>
        attempt.englishId === englishId || attempt.portugueseId === englishId,
    )
  const attempt = { englishId, portugueseId, correct, firstForPair }
  return {
    ...run,
    matched: correct ? [...run.matched, englishId] : run.matched,
    selected: null,
    attempts: [...run.attempts, attempt],
    lastAttempt: attempt,
  }
}

export function nextWordMatchRound(run: WordMatchRun): WordMatchRun {
  return {
    ...run,
    roundIndex: run.roundIndex + 1,
    selected: null,
    matched: [],
    lastAttempt: null,
    roundStart: run.attempts.length,
  }
}

export function summarizeMatches(
  run: WordMatchRun,
  rounds: readonly WordMatchRound[],
) {
  const vocabulary = new Map(
    rounds.flatMap(({ english }) => english).map((pair) => [pair.id, pair]),
  )
  const review = new Set<string>()
  let matched = 0
  let firstAttemptCorrect = 0
  for (const attempt of run.attempts) {
    if (attempt.correct) {
      matched++
      if (attempt.firstForPair) firstAttemptCorrect++
    } else {
      review.add(attempt.englishId)
      review.add(attempt.portugueseId)
    }
  }
  return {
    answeredCount: run.attempts.length,
    correctCount: matched,
    firstAttemptCorrect,
    vocabulary: [...vocabulary.values()],
    reviewIds: [...review],
  }
}
