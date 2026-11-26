import { getPracticalExpressionId } from '@/data/phrasebooks/authoring'
import type {
  ConversationChoice,
  ConversationNode,
  GuidedConversation,
} from '@/types/conversation'
import { simulationSummaries } from './index'

type Line = readonly [
  text: string,
  translation: string,
  expressions?: readonly string[],
]
type Option = readonly [
  id: string,
  line: Line,
  feedback: string,
  outcome: { next: string } | 'context' | 'language',
]

export function defineConversation(
  id: (typeof simulationSummaries)[number]['id'],
  learnerRole: string,
  characterRole: string,
  author: (tools: {
    decision: (
      id: string,
      line: Line,
      choices: readonly [Option, ...Option[]],
      hint?: string,
    ) => ConversationNode
    success: (id: string, line: Line) => ConversationNode
  }) => GuidedConversation['nodes'],
): GuidedConversation {
  const summary = simulationSummaries.find((item) => item.id === id)!
  const learnerId = 'learner'
  const characterId = 'staff'
  function bilingual([text, translation, expressions]: Line) {
    return {
      text,
      translation,
      expressionIds: expressions?.map((slug) =>
        getPracticalExpressionId(summary.situationId, slug),
      ),
    }
  }

  const nodes = author({
    decision(id, line, [first, ...rest], hint) {
      const option = ([
        slug,
        reply,
        feedback,
        outcome,
      ]: Option): ConversationChoice => {
        const base = { id: `${id}-${slug}`, ...bilingual(reply), feedback }
        return typeof outcome === 'string'
          ? { ...base, fit: outcome }
          : { ...base, fit: 'appropriate', nextNodeId: outcome.next }
      }
      return {
        id,
        kind: 'decision',
        message: { participantId: characterId, ...bilingual(line) },
        hint,
        choices: [option(first), ...rest.map(option)],
      }
    },
    success: (id, line) => ({
      id,
      kind: 'success',
      message: { participantId: characterId, ...bilingual(line) },
    }),
  })
  return {
    ...summary,
    firstNodeId: nodes[0].id,
    learnerId,
    participants: [
      { id: learnerId, role: learnerRole },
      { id: characterId, role: characterRole },
    ],
    nodes,
  }
}
