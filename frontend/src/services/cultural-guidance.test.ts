import { expect, it } from 'vitest'
import { loadCulturalGuidance } from '@/data/cultural-guidance/load-cultural-guidance'
import { dialogueSummaries } from '@/data/dialogues'
import { practicalSituations } from '@/data/practical-english'
import { simulationSummaries } from '@/data/simulations'

const expected = {
  'at-the-airport': [
    'polite-airport-requests',
    'repeat-flight-information',
    'boarding-announcements',
    'baggage-claim-words',
  ],
  'at-the-hotel': [
    'polite-reception-requests',
    'clarify-hotel-information',
    'arrival-and-departure',
    'register-at-reception',
  ],
  'restaurants-and-coffee-shops': [
    'order-with-please',
    'ask-for-the-bill',
    'communicate-dietary-needs',
    'bill-and-check',
  ],
  shopping: [
    'ask-for-shop-assistance',
    'prices-and-sizes',
    'state-a-preference',
    'decline-help',
  ],
  'getting-around': [
    'confirm-the-destination',
    'repeat-the-stop-name',
    'platform-and-stop',
    'return-and-round-trip',
  ],
  'meeting-people': [
    'start-an-introduction',
    'greetings-and-register',
    'keep-a-conversation-going',
    'respect-conversation-boundaries',
  ],
  'health-and-emergencies': [
    'describe-a-symptom',
    'ask-for-immediate-help',
    'confirm-what-you-heard',
    'give-a-specific-location',
  ],
  'around-the-city': [
    'approach-someone',
    'ask-for-directions',
    'check-the-turn',
    'say-you-are-lost',
  ],
}
const regionalPairs = {
  'baggage-claim-words': ['baggage claim', 'baggage reclaim'],
  'bill-and-check': ['the check', 'the bill'],
  'return-and-round-trip': ['round-trip ticket', 'return ticket'],
}
const stableId = /^[a-z]+(?:-[a-z]+)*$/

it.each(practicalSituations)(
  'loads bilingual guidance and authentic references for $id',
  async ({ id }) => {
    const { guidance, phrasebook, situation } = await loadCulturalGuidance(id)
    expect(situation?.id).toBe(id)
    expect(guidance?.map((entry) => entry.id)).toEqual(expected[id])
    const expressions = phrasebook!.groups.flatMap((group) => group.expressions)
    const expressionIds = new Set(
      expressions.map((expression) => expression.id),
    )
    for (const entry of guidance!) {
      expect(entry.situationId).toBe(id)
      expect(
        [entry.title, entry.explanation, entry.usage].every((text) =>
          text.trim(),
        ),
      ).toBe(true)
      expect(entry.id).toMatch(stableId)
      expect(entry.examples.length).toBeGreaterThan(0)
      expect(new Set(entry.examples.map((example) => example.id)).size).toBe(
        entry.examples.length,
      )
      expect(entry.references.expressionIds.length).toBeGreaterThan(0)
      expect(
        entry.references.expressionIds.every((id) => expressionIds.has(id)),
      ).toBe(true)
      expect(
        entry.references.dialogueIds?.every((ref) =>
          dialogueSummaries.some(
            ({ id: target, situationId }) =>
              target === ref && situationId === id,
          ),
        ),
      ).toBe(true)
      expect(
        entry.references.simulationIds?.every((ref) =>
          simulationSummaries.some(
            ({ id: target, situationId }) =>
              target === ref && situationId === id,
          ),
        ) ?? true,
      ).toBe(true)
      for (const example of entry.examples) {
        expect(example.id).toMatch(stableId)
        if (example.kind === 'phrasebook') {
          expect(entry.references.expressionIds).toContain(example.expressionId)
        } else {
          expect(example.text.trim() && example.translation.trim()).toBeTruthy()
          expect(expressions.some(({ text }) => text === example.text)).toBe(
            false,
          )
        }
      }
      if (Object.hasOwn(regionalPairs, entry.id)) {
        const examples = entry.examples.filter(
          (example) => example.kind === 'example',
        )
        expect(examples.map(({ region }) => region)).toEqual(['en-US', 'en-GB'])
        expect(examples.map(({ text }) => text.toLowerCase())).toEqual(
          regionalPairs[entry.id as keyof typeof regionalPairs].map((text) =>
            expect.stringContaining(text),
          ),
        )
        expect(examples[0].translation).toBe(examples[1].translation)
      }
    }
  },
)

it('handles invalid situation IDs without resolving content', async () => {
  expect(await loadCulturalGuidance('unknown')).toEqual({
    situation: undefined,
  })
})
