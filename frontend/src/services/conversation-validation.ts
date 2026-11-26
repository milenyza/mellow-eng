import type { GuidedConversation } from '@/types/conversation'

const stableId = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)

export function validateConversation(
  scenario: GuidedConversation,
  references: {
    expressionIds: ReadonlySet<string>
    dialogueIds: ReadonlySet<string>
  },
) {
  const errors: string[] = []
  function checkIds(ids: readonly string[], scope: string) {
    if (ids.some((id) => !stableId(id))) errors.push(`Invalid ID in ${scope}`)
    if (new Set(ids).size !== ids.length)
      errors.push(`Duplicate ID in ${scope}`)
  }
  function checkLine(
    line: {
      text: string
      translation: string
      expressionIds?: readonly string[]
    },
    id: string,
  ) {
    if (!line.text.trim() || !line.translation.trim())
      errors.push(`Missing bilingual text in ${id}`)
    if (line.expressionIds?.some((id) => !references.expressionIds.has(id)))
      errors.push(`Unknown expression in ${id}`)
  }

  checkIds([scenario.id], 'scenario')
  checkIds(
    scenario.nodes.map(({ id }) => id),
    'nodes',
  )
  checkIds(
    scenario.participants.map(({ id }) => id),
    'participants',
  )
  checkIds(
    scenario.nodes.flatMap((node) =>
      node.kind === 'decision' ? node.choices.map(({ id }) => id) : [],
    ),
    'choices',
  )
  if (!references.dialogueIds.has(scenario.dialogueId))
    errors.push('Unknown related dialogue')
  if (
    !scenario.title.trim() ||
    !scenario.context.trim() ||
    !scenario.goal.trim() ||
    !scenario.objectives.length ||
    scenario.objectives.some((objective) => !objective.trim())
  )
    errors.push('Missing scenario details')

  const participants = new Set(scenario.participants.map(({ id }) => id))
  if (
    !participants.has(scenario.learnerId) ||
    scenario.participants.some(({ role }) => !role.trim())
  )
    errors.push('Invalid participant roles')
  const nodes = new Map(scenario.nodes.map((node) => [node.id, node]))
  if (nodes.get(scenario.firstNodeId)?.kind !== 'decision')
    errors.push('Invalid starting node')
  if (!scenario.nodes.some(({ kind }) => kind === 'success'))
    errors.push('No successful ending')

  for (const node of scenario.nodes) {
    checkLine(node.message, node.id)
    if (
      !participants.has(node.message.participantId) ||
      node.message.participantId === scenario.learnerId
    )
      errors.push(`Invalid speaker in ${node.id}`)
    if (node.kind !== 'decision') continue
    if (!node.choices.some(({ fit }) => fit === 'appropriate'))
      errors.push(`No continuation in ${node.id}`)
    if (node.hint !== undefined && !node.hint.trim())
      errors.push(`Empty hint in ${node.id}`)
    for (const choice of node.choices) {
      const { id, fit, nextNodeId } = choice
      checkLine(choice, id)
      if (!choice.feedback.trim())
        errors.push(`Missing feedback in ${choice.id}`)
      if (choice.fit === 'appropriate' && !nodes.has(choice.nextNodeId))
        errors.push(`Unknown next node in ${choice.id}`)
      if (fit !== 'appropriate' && nextNodeId !== undefined)
        errors.push(`Invalid retry branch in ${id}`)
    }
  }

  const visited = new Set<string>()
  const active = new Set<string>()
  function visit(id: string) {
    if (active.has(id)) {
      errors.push(`Cycle at ${id}`)
      return
    }
    const node = nodes.get(id)
    if (visited.has(id) || !node) return
    active.add(id)
    if (node.kind === 'decision') {
      for (const choice of node.choices) {
        if (choice.fit === 'appropriate') visit(choice.nextNodeId)
      }
    }
    active.delete(id)
    visited.add(id)
  }
  visit(scenario.firstNodeId)
  for (const { id } of scenario.nodes)
    if (!visited.has(id)) errors.push(`Unreachable node ${id}`)
  return errors
}
