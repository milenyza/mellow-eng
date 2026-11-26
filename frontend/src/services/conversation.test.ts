import { describe, expect, it } from 'vitest'
import { dialogueSummaries } from '@/data/dialogues'
import { simulationSummaries } from '@/data/simulations'
import { loadSimulation } from '@/data/simulations/load-simulation'
import type { GuidedConversation } from '@/types/conversation'
import {
  conversationTranscript,
  currentConversationNode,
  finishConversation,
  startConversation,
  updateConversation,
  type ConversationSession,
} from './conversation-session'
import { validateConversation } from './conversation-validation'

const { scenario: checkIn, phrasebook } = await loadSimulation(
  'at-the-airport',
  'flight-check-in',
)
if (!checkIn || !phrasebook)
  throw new Error('Airport simulation could not load')
const references = {
  expressionIds: new Set(
    phrasebook.groups.flatMap(({ expressions }) =>
      expressions.map(({ id }) => id),
    ),
  ),
  dialogueIds: new Set(
    dialogueSummaries
      .filter(({ situationId }) => situationId === checkIn.situationId)
      .map(({ id }) => id),
  ),
}

describe('published conversation graphs', () => {
  it('has sixteen stable links only for situations with published content', async () => {
    expect(
      simulationSummaries.map(({ situationId, id }) => [situationId, id]),
    ).toEqual([
      ['at-the-airport', 'flight-check-in'],
      ['at-the-airport', 'find-the-gate'],
      ['at-the-hotel', 'check-in-at-reception'],
      ['at-the-hotel', 'reception-information'],
      ['restaurants-and-coffee-shops', 'restaurant-meal'],
      ['restaurants-and-coffee-shops', 'order-at-the-counter'],
      ['shopping', 'ask-the-price'],
      ['shopping', 'ask-for-a-size'],
      ['getting-around', 'buy-a-ticket'],
      ['getting-around', 'confirm-the-stop'],
      ['meeting-people', 'meet-a-classmate'],
      ['meeting-people', 'talk-about-origins'],
      ['health-and-emergencies', 'say-how-you-feel'],
      ['health-and-emergencies', 'give-your-location'],
      ['around-the-city', 'find-a-place'],
      ['around-the-city', 'confirm-a-direction'],
    ])
    for (const { situationId, id } of simulationSummaries) {
      const loaded = await loadSimulation(situationId, id)
      expect(loaded.scenario?.id, id).toBe(id)
      expect(loaded.phrasebook?.situationId).toBe(situationId)
    }
    expect(
      (await loadSimulation('at-the-hotel', 'find-the-gate')).scenario,
    ).toBeUndefined()
    expect(
      (await loadSimulation('shopping', 'find-a-place')).scenario,
    ).toBeUndefined()
    expect(
      (await loadSimulation('unknown', 'unknown')).situation,
    ).toBeUndefined()
  })

  it.each(simulationSummaries)(
    'reaches successful endings with alternative paths in $id',
    async ({ id, situationId }) => {
      const { scenario } = await loadSimulation(situationId, id)
      expect(scenario).toBeDefined()
      if (!scenario) return
      expect(
        scenario.nodes.some((node) => node.kind === 'decision' && !!node.hint),
      ).toBe(true)
      const feedbackTypes = scenario.nodes.flatMap((node) =>
        node.kind === 'decision' ? node.choices.map(({ fit }) => fit) : [],
      )
      expect(feedbackTypes).toContain('context')
      expect(feedbackTypes).toContain('language')
      const paths: string[][] = []
      function walk(session: ConversationSession) {
        const node = currentConversationNode(scenario!, session)
        if (node.kind === 'success') {
          expect(session.decisions).toHaveLength(4)
          expect(
            conversationTranscript(scenario!, session.decisions, node.id).some(
              ({ expressionIds }) => expressionIds?.length,
            ),
          ).toBe(true)
          expect(
            finishConversation(scenario!, session, 1800)?.terminalNodeId,
          ).toBe(node.id)
          paths.push([
            ...session.decisions.map(({ nodeId }) => nodeId),
            node.id,
          ])
          return
        }
        for (const choice of node.choices.filter(
          ({ fit }) => fit === 'appropriate',
        )) {
          walk(answer(scenario!, session, choice.id))
        }
      }
      walk(startConversation(scenario))
      expect(
        new Set(paths.map((path) => path.join('/'))).size,
      ).toBeGreaterThanOrEqual(2)
      expect(
        paths.some((path, index) =>
          paths
            .slice(index + 1)
            .some((other) =>
              path.some(
                (id, step) =>
                  step > 0 &&
                  id !== other[step] &&
                  path
                    .slice(step + 1)
                    .some((later) => other.slice(step + 1).includes(later)),
              ),
            ),
        ),
      ).toBe(true)
    },
  )

  it('rejects bad references, duplicate and unreachable nodes, cycles and missing bilingual text, feedback or success', () => {
    const [start, ...tail] = checkIn.nodes
    if (start.kind !== 'decision') throw new Error('Expected decision')
    const [first, ...choices] = start.choices
    if (first.fit !== 'appropriate') throw new Error('Expected valid branch')
    const invalidFirst = {
      ...first,
      feedback: '',
      translation: '',
      expressionIds: ['foreign'],
      nextNodeId: 'missing',
    }
    const orphan = { ...tail[0], id: 'orphan' }
    const invalid: GuidedConversation = {
      ...checkIn,
      dialogueId: 'foreign',
      nodes: [
        {
          ...start,
          choices: [
            invalidFirst,
            invalidFirst,
            ...choices,
            { ...first, id: 'loop', nextNodeId: start.id },
          ],
        },
        orphan,
        orphan,
        ...tail.filter(({ kind }) => kind !== 'success'),
      ],
    }
    const errors = validateConversation(invalid, references)
    for (const expected of [
      'Duplicate ID in nodes',
      'Duplicate ID in choices',
      'Unknown related dialogue',
      'No successful ending',
      'Unreachable node flight-number',
      'Cycle at documents',
    ]) {
      expect(errors).toContain(expected)
    }
    for (const expected of [
      'Missing bilingual text',
      'Missing feedback',
      'Unknown next node',
      'Unknown expression',
    ]) {
      expect(errors.some((error) => error.startsWith(expected))).toBe(true)
    }
  })
})

function answer(
  scenario: GuidedConversation,
  session: ConversationSession,
  choiceId: string,
) {
  const selected = updateConversation(scenario, session, {
    kind: 'select',
    choiceId,
  })
  const submitted = updateConversation(scenario, selected, { kind: 'submit' })
  return updateConversation(scenario, submitted, { kind: 'continue' })
}

it('requires explicit valid submission or correction review and records attempts, hints and visited turns', () => {
  let session = startConversation(checkIn, () => 0)
  const act = (action: Parameters<typeof updateConversation>[2]) => {
    session = updateConversation(checkIn, session, action)
  }
  expect(finishConversation(checkIn, session, 0)).toBeUndefined()
  expect(session.orders.documents).toEqual([
    'documents-flight',
    'documents-hotel',
    'documents-passport',
  ])
  act({ kind: 'submit' })
  act({ kind: 'select', choiceId: 'foreign' })
  act({ kind: 'continue', reviewedChoiceId: 'documents-flight' })
  expect(session.attempts).toEqual([])
  expect(conversationTranscript(checkIn, session.decisions)).toEqual([])
  act({ kind: 'hint' })
  act({ kind: 'hint' })
  expect(session.hintNodeIds).toEqual(['documents'])
  for (let index = 0; index < 12; index++) {
    act({ kind: 'select', choiceId: 'documents-hotel' })
    act({ kind: 'submit' })
    act({ kind: 'continue' })
    if (index < 11) act({ kind: 'retry' })
  }
  expect(session.attempts).toHaveLength(12)
  expect(session.attempts.every(({ fit }) => fit === 'context')).toBe(true)
  act({ kind: 'review' })
  act({ kind: 'continue', reviewedChoiceId: 'documents-hotel' })
  expect(session.nodeId).toBe('documents')
  act({ kind: 'continue', reviewedChoiceId: 'documents-passport' })
  expect(session.nodeId).toBe('flight-number')
  act({ kind: 'select', choiceId: 'flight-number-omit-verb' })
  act({ kind: 'submit' })
  expect(session.attempts.at(-1)?.fit).toBe('language')
  act({ kind: 'retry' })
  session = answer(checkIn, session, 'flight-number-number')
  expect(session.nodeId).toBe('luggage')
  session = answer(checkIn, session, 'luggage-check')
  session = answer(checkIn, session, 'gate-confirm')
  expect(finishConversation(checkIn, session, 4900)).toMatchObject({
    terminalNodeId: 'done',
    hintNodeIds: ['documents'],
    firstAttemptAppropriate: 2,
    reviewedCorrections: 1,
    activeMs: 4900,
  })
  expect(session.attempts).toHaveLength(16)
  const transcript = conversationTranscript(
    checkIn,
    session.decisions,
    session.nodeId,
  )
  expect(transcript.map(({ id }) => id)).toEqual([
    'documents',
    'documents-passport',
    'flight-number',
    'flight-number-number',
    'luggage',
    'luggage-check',
    'gate',
    'gate-confirm',
    'done',
  ])
  expect(transcript[1].reviewed).toBe(true)
  expect(startConversation(checkIn).attempts).toEqual([])
})
