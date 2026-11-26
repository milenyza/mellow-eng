import { getPracticalExpressionId } from '@/data/phrasebooks/authoring'
import type {
  CulturalGuidance,
  GuidanceCategory,
  GuidanceExample,
  PhrasebookSituationId,
} from '@/types/practical-english'

type ExampleInput =
  | string
  | readonly [
      id: string,
      text: string,
      translation: string,
      region?: 'en-US' | 'en-GB',
    ]

export function defineGuidance(situationId: PhrasebookSituationId) {
  return (
    id: string,
    category: GuidanceCategory,
    title: string,
    explanation: string,
    usage: string,
    examples: readonly [ExampleInput, ...ExampleInput[]],
    related: {
      expressions?: readonly string[]
      dialogue?: string
      simulation?: string
    },
  ): CulturalGuidance => {
    function example(input: ExampleInput): GuidanceExample {
      if (typeof input === 'string')
        return {
          kind: 'phrasebook',
          id: input,
          expressionId: getPracticalExpressionId(situationId, input),
        }
      const [id, text, translation, region] = input
      return { kind: 'example', id, text, translation, region }
    }
    const [first, ...rest] = examples
    const expressionIds = [
      ...new Set([
        ...examples.filter((input) => typeof input === 'string'),
        ...(related.expressions ?? []),
      ]),
    ].map((slug) => getPracticalExpressionId(situationId, slug))
    return {
      id,
      situationId,
      category,
      title,
      explanation,
      usage,
      examples: [example(first), ...rest.map(example)],
      references: {
        expressionIds,
        dialogueIds: related.dialogue ? [related.dialogue] : undefined,
        simulationIds: related.simulation ? [related.simulation] : undefined,
      },
    }
  }
}
