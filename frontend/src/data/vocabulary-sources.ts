import type { VocabularySource } from '@/types/game'

export const vocabularySources = {
  mixed: 'Vocabulário misto',
  lessons: 'Aulas publicadas',
  stories: 'Histórias publicadas',
  saved: 'Vocabulário salvo',
} satisfies Record<VocabularySource, string>
