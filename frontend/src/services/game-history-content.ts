import { englishCourse } from '@/data/curriculum/english-course'
import { dailyWord } from '@/data/dashboard'
import { wordMatchGame } from '@/data/games'
import { sentenceChallenges } from '@/data/sentence-challenges'
import { stories } from '@/data/stories'
import { collectGameVocabulary } from '@/services/game-vocabulary'
import type { CompletedGameSession } from '@/types/game-history'
import type {
  SentenceContentReference,
  SentenceTopic,
} from '@/types/sentence-builder'

const vocabulary = new Map(
  collectGameVocabulary(wordMatchGame, 'mixed', {
    course: englishCourse,
    stories,
    savedWordIds: [dailyWord.id],
    standaloneVocabulary: [dailyWord],
  }).map((pair) => [pair.id, pair]),
)
const challenges = new Map(
  sentenceChallenges.map((challenge) => [challenge.id, challenge]),
)

export const resolveGameVocabulary = (id: string) => vocabulary.get(id)
export const resolveGameChallenge = (id: string) => challenges.get(id)

export interface GameReviewRecommendations {
  vocabularyIds: readonly string[]
  grammarTopics: readonly SentenceTopic[]
  reviewedSentences: readonly {
    challengeId: string
    reference?: SentenceContentReference
  }[]
}

export function selectGameReview(
  history: readonly CompletedGameSession[],
): GameReviewRecommendations {
  const vocabulary = new Set<string>()
  const topics = new Set<SentenceTopic>()
  const sentences = new Map<string, SentenceContentReference | undefined>()
  for (const session of history) {
    if (session.gameId === 'word-match') {
      session.reviewIds.forEach((id) => vocabulary.add(id))
    }
    if (session.gameId === 'sentence-builder') {
      for (const item of session.challenges) {
        const challenge = resolveGameChallenge(item.id)
        if (item.incorrectAnswers.length)
          challenge?.topics.forEach((topic) => topics.add(topic))
        if (item.reviewed) sentences.set(item.id, challenge?.reference)
      }
    }
  }
  return {
    vocabularyIds: [...vocabulary],
    grammarTopics: [...topics],
    reviewedSentences: [...sentences].map(([challengeId, reference]) => ({
      challengeId,
      reference,
    })),
  }
}
