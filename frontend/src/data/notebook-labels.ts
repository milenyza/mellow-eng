import type {
  NotebookContentType,
  NotebookSource,
  VocabularyFamiliarity,
} from '@/types/notebook'

export const notebookSourceLabels: Record<NotebookSource, string> = {
  lesson: 'Aulas',
  story: 'Histórias',
  practical: 'Inglês na prática',
  daily: 'Palavra do dia',
}

export const notebookTypeLabels: Record<NotebookContentType, string> = {
  word: 'Palavra',
  expression: 'Expressão',
  phrase: 'Frase prática',
}

export const familiarityLabels: Record<
  VocabularyFamiliarity | 'unclassified',
  string
> = {
  unclassified: 'Sem classificação',
  learning: 'Aprendendo',
  reviewing: 'Revisando',
  familiar: 'Familiar',
}
