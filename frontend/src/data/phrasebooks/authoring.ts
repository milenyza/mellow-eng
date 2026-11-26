import type {
  PhrasebookGroup,
  PhrasebookSituationId,
  PracticalExpression,
} from '@/types/practical-english'

type PhraseOptions = Pick<
  PracticalExpression,
  | 'formality'
  | 'register'
  | 'keywords'
  | 'pronunciation'
  | 'references'
  | 'audio'
  | 'example'
>
type PhraseEntry = readonly [
  id: string,
  text: string,
  translation: string,
  usage: string,
  details?: Partial<PhraseOptions> & { related?: readonly string[] },
]

export function getPracticalExpressionId(
  situationId: PhrasebookSituationId,
  slug: string,
) {
  return `practical-${situationId}-${slug}`
}

export function definePhrasebook(situationId: PhrasebookSituationId) {
  const expressionId = (id: string) => getPracticalExpressionId(situationId, id)

  return (
    id: string,
    title: string,
    entries: readonly [PhraseEntry, ...PhraseEntry[]],
  ): PhrasebookGroup => {
    function expression([
      slug,
      text,
      translation,
      usage,
      details = {},
    ]: PhraseEntry): PracticalExpression {
      const { related, formality = 'neutral', ...metadata } = details
      return {
        id: expressionId(slug),
        text,
        translation,
        usage,
        formality,
        intent: id,
        ...metadata,
        relatedIds: related?.map(expressionId),
      }
    }
    const [first, ...rest] = entries
    return {
      id,
      title,
      expressions: [expression(first), ...rest.map(expression)],
    }
  }
}
