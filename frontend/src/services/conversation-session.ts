import { shuffle } from '@/services/shuffle'
import type {
  ConversationAttempt,
  ConversationDecision,
  ConversationMessage,
  GuidedConversation,
  SimulationResult,
} from '@/types/conversation'

export interface ConversationSession {
  nodeId: string
  selectedId?: string
  submittedId?: string
  reviewing: boolean
  orders: Readonly<Record<string, readonly string[]>>
  attempts: readonly ConversationAttempt[]
  decisions: readonly ConversationDecision[]
  hintNodeIds: readonly string[]
}

export function startConversation(
  scenario: GuidedConversation,
  random = Math.random,
): ConversationSession {
  return {
    nodeId: scenario.firstNodeId,
    reviewing: false,
    attempts: [],
    decisions: [],
    hintNodeIds: [],
    orders: Object.fromEntries(
      scenario.nodes.flatMap((node) =>
        node.kind === 'decision'
          ? [
              [
                node.id,
                shuffle(
                  node.choices.map(({ id }) => id),
                  random,
                ),
              ],
            ]
          : [],
      ),
    ),
  }
}

export function currentConversationNode(
  scenario: GuidedConversation,
  session: ConversationSession,
) {
  const node = scenario.nodes.find(({ id }) => id === session.nodeId)
  if (!node) throw new Error(`Unknown conversation node: ${session.nodeId}`)
  return node
}

export type ConversationAction =
  | { kind: 'select'; choiceId: string }
  | { kind: 'submit' }
  | { kind: 'retry' }
  | { kind: 'hint' }
  | { kind: 'review' }
  | { kind: 'continue'; reviewedChoiceId?: string }

export function updateConversation(
  scenario: GuidedConversation,
  session: ConversationSession,
  action: ConversationAction,
): ConversationSession {
  const node = currentConversationNode(scenario, session)
  if (node.kind !== 'decision') return session
  const previous = node.choices.find(({ id }) => id === session.submittedId)

  switch (action.kind) {
    case 'select':
      return !previous && node.choices.some(({ id }) => id === action.choiceId)
        ? { ...session, selectedId: action.choiceId }
        : session
    case 'submit': {
      const choice = node.choices.find(({ id }) => id === session.selectedId)
      return !previous && choice
        ? {
            ...session,
            submittedId: choice.id,
            attempts: [
              ...session.attempts,
              { nodeId: node.id, choiceId: choice.id, fit: choice.fit },
            ],
          }
        : session
    }
    case 'retry':
      return previous && previous.fit !== 'appropriate'
        ? {
            ...session,
            reviewing: false,
            selectedId: undefined,
            submittedId: undefined,
          }
        : session
    case 'hint':
      return node.hint && !session.hintNodeIds.includes(node.id)
        ? { ...session, hintNodeIds: [...session.hintNodeIds, node.id] }
        : session
    case 'review':
      return previous && previous.fit !== 'appropriate'
        ? { ...session, reviewing: true }
        : session
    case 'continue': {
      const choice = action.reviewedChoiceId
        ? session.reviewing
          ? node.choices.find(({ id }) => id === action.reviewedChoiceId)
          : undefined
        : previous
      if (choice?.fit !== 'appropriate') return session
      return {
        ...session,
        nodeId: choice.nextNodeId,
        selectedId: undefined,
        submittedId: undefined,
        reviewing: false,
        decisions: [
          ...session.decisions,
          { nodeId: node.id, choiceId: choice.id, reviewed: session.reviewing },
        ],
      }
    }
  }
}

export interface TranscriptMessage extends ConversationMessage {
  id: string
  reviewed?: boolean
}

export function conversationTranscript(
  scenario: GuidedConversation,
  decisions: readonly ConversationDecision[],
  terminalNodeId?: string,
): TranscriptMessage[] {
  const entries = decisions.flatMap(({ nodeId, choiceId, reviewed }) => {
    const node = scenario.nodes.find(({ id }) => id === nodeId)
    const choice =
      node?.kind === 'decision'
        ? node.choices.find(({ id }) => id === choiceId)
        : undefined
    return node && choice
      ? [
          { ...node.message, id: node.id },
          {
            ...choice,
            id: choice.id,
            participantId: scenario.learnerId,
            reviewed,
          },
        ]
      : []
  })
  const terminal = scenario.nodes.find(({ id }) => id === terminalNodeId)
  if (terminal?.kind === 'success')
    entries.push({ ...terminal.message, id: terminal.id })
  return entries
}

export function finishConversation(
  scenario: GuidedConversation,
  session: ConversationSession,
  activeMs: number,
): SimulationResult | undefined {
  if (currentConversationNode(scenario, session).kind !== 'success') return
  const firstAttempts = new Map<string, ConversationAttempt>()
  for (const attempt of session.attempts) {
    if (!firstAttempts.has(attempt.nodeId))
      firstAttempts.set(attempt.nodeId, attempt)
  }
  return {
    scenarioId: scenario.id,
    situationId: scenario.situationId,
    terminalNodeId: session.nodeId,
    decisions: session.decisions,
    attempts: session.attempts,
    hintNodeIds: session.hintNodeIds,
    firstAttemptAppropriate: [...firstAttempts.values()].filter(
      ({ fit }) => fit === 'appropriate',
    ).length,
    reviewedCorrections: session.decisions.filter(({ reviewed }) => reviewed)
      .length,
    activeMs,
  }
}
