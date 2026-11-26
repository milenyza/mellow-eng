import { expect, it } from 'vitest'
import { dialogueSummaries } from '@/data/dialogues'
import { loadPracticalDialogue } from '@/data/dialogues/load-dialogue'
import { practicalSituations } from '@/data/practical-english'
import { createDialogueAudio } from './dialogue-audio'

it('links six complete A1 dialogues to published phrasebooks without publishing full situations', async () => {
  expect(dialogueSummaries.map(({ id }) => id)).toEqual([
    'flight-check-in',
    'boarding-gate',
    'hotel-reservation',
    'hotel-reception-info',
    'restaurant-meal',
    'coffee-to-go',
  ])
  expect(
    practicalSituations.every(({ publication }) => publication === 'planned'),
  ).toBe(true)
  for (const summary of dialogueSummaries) {
    const { id, situationId } = summary
    const { situation, dialogue, phrasebook, choices } =
      await loadPracticalDialogue(situationId, id)
    expect(situation?.phrasebook).toBe('available')
    expect(choices).toHaveLength(2)
    expect(dialogue).toMatchObject(summary)
    expect(dialogue?.level).toBe('A1')
    expect(dialogue?.objectives.length).toBeGreaterThan(0)
    if (summary && 'scenarioId' in summary) {
      expect(
        situation?.scenarios.some(({ id }) => id === summary.scenarioId),
      ).toBe(true)
    }
    const { turns, participants, notes } = dialogue!
    expect(turns.length).toBeGreaterThanOrEqual(8)
    expect(turns.length).toBeLessThanOrEqual(12)
    expect(notes.length).toBeGreaterThanOrEqual(2)
    expect(notes.length).toBeLessThanOrEqual(4)
    for (const entries of [turns, participants, notes]) {
      expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length)
      expect(entries.every(({ id }) => /^[a-z]+(?:-[a-z]+)*$/.test(id))).toBe(
        true,
      )
    }
    expect(
      turns.every(
        ({ participantId, text, translation }) =>
          text.trim() &&
          translation.trim() &&
          participants.some(({ id }) => id === participantId),
      ),
    ).toBe(true)

    const expressionIds = [...turns, ...notes].flatMap(
      ({ expressionIds }) => expressionIds ?? [],
    )
    expect(expressionIds.length).toBeGreaterThan(0)
    const available = phrasebook!.groups.flatMap(({ expressions }) =>
      expressions.map(({ id }) => id),
    )
    expect(expressionIds.every((id) => available.includes(id))).toBe(true)
    expect(createDialogueAudio(dialogue!).parts.map(({ id }) => id)).toEqual(
      turns.map(({ id }) => id),
    )
  }
})

it('rejects unknown, cross-situation and preview-only dialogue URLs', async () => {
  expect(
    (await loadPracticalDialogue('shopping', 'boarding-gate')).choices,
  ).toHaveLength(0)
  expect(
    (await loadPracticalDialogue('at-the-hotel', 'boarding-gate')).dialogue,
  ).toBeUndefined()
  expect(
    (await loadPracticalDialogue('at-the-airport', 'unknown')).dialogue,
  ).toBeUndefined()
  expect(
    (await loadPracticalDialogue('unknown', 'flight-check-in')).situation,
  ).toBeUndefined()
})
