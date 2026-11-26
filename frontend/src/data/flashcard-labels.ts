import type { RecallRating, ReviewDirection } from '@/types/flashcards'

export const reviewDirections: Record<ReviewDirection, string> = {
  'en-pt': 'Inglês para português',
  'pt-en': 'Português para inglês',
  mixed: 'Direção mista',
}

export const recallRatings: Record<RecallRating, string> = {
  forgot: 'Não lembrei',
  effort: 'Com esforço',
  easy: 'Com facilidade',
}
