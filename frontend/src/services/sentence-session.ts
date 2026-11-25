import { sentenceForOrder } from '@/services/sentence-challenges'
import type { PracticeSession } from '@/types/exercise'
import type {
  PreparedSentenceChallenge,
  SentenceBuilderResult,
} from '@/types/sentence-builder'

export function summarizeSentences(
  session: PracticeSession,
  challenges: readonly PreparedSentenceChallenge[],
): Pick<
  SentenceBuilderResult,
  | 'completedCount'
  | 'answeredCount'
  | 'correctCount'
  | 'firstAttemptCorrect'
  | 'challenges'
> {
  let completedCount = 0
  let answeredCount = 0
  let correctCount = 0
  let firstAttemptCorrect = 0
  const practiced: SentenceBuilderResult['challenges'][number][] = []

  for (const challenge of challenges) {
    const { definition } = challenge
    const attempt = session.attempts[definition.id]
    if (!attempt?.submissions.length) continue
    const { submissions, status } = attempt
    completedCount += Number(status === 'correct' || status === 'reviewed')
    answeredCount += submissions.length
    correctCount += Number(status === 'correct')
    firstAttemptCorrect += Number(submissions[0].correct)
    practiced.push({
      id: definition.id,
      sentence:
        attempt.status === 'correct' &&
        attempt.answer?.kind === 'sentence-builder'
          ? sentenceForOrder(challenge, attempt.answer.tileIds)
          : definition.sentence,
      topics: definition.topics,
      incorrectAnswers: submissions.flatMap(({ correct, answer }) =>
        !correct && answer.kind === 'sentence-builder'
          ? [sentenceForOrder(challenge, answer.tileIds)]
          : [],
      ),
      feedback: definition.feedback,
      reviewed: status === 'reviewed',
    })
  }
  return {
    completedCount,
    answeredCount,
    correctCount,
    firstAttemptCorrect,
    challenges: practiced,
  }
}
