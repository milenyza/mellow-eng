import type { TranslatedExample } from '@/types/lesson-content'
import type {
  DialogueParticipant,
  PhrasebookSituationId,
  ScenarioOutline,
} from '@/types/practical-english'

export interface SimulationSummary extends ScenarioOutline {
  situationId: PhrasebookSituationId
  level: 'A1'
  objectives: readonly [string, ...string[]]
  dialogueId: string
  outlineId?: string
}

export interface ConversationMessage extends TranslatedExample {
  participantId: string
  expressionIds?: readonly string[]
}

export type ConversationChoice = TranslatedExample & {
  id: string
  feedback: string
  expressionIds?: readonly string[]
} & (
    | { fit: 'appropriate'; nextNodeId: string }
    | { fit: 'context' | 'language'; nextNodeId?: never }
  )

export type ConversationNode = {
  id: string
  message: ConversationMessage
} & (
  | {
      kind: 'decision'
      choices: readonly [ConversationChoice, ...ConversationChoice[]]
      hint?: string
    }
  | { kind: 'success' }
)

export interface GuidedConversation extends SimulationSummary {
  learnerId: string
  participants: readonly [
    DialogueParticipant,
    DialogueParticipant,
    ...DialogueParticipant[],
  ]
  firstNodeId: string
  nodes: readonly [ConversationNode, ...ConversationNode[]]
}

export interface ConversationAttempt {
  nodeId: string
  choiceId: string
  fit: ConversationChoice['fit']
}

export interface ConversationDecision {
  nodeId: string
  choiceId: string
  reviewed: boolean
}

export interface SimulationResult {
  scenarioId: string
  situationId: PhrasebookSituationId
  terminalNodeId: string
  decisions: readonly ConversationDecision[]
  attempts: readonly ConversationAttempt[]
  hintNodeIds: readonly string[]
  firstAttemptAppropriate: number
  reviewedCorrections: number
  activeMs: number
}
