import { expect, it, vi } from 'vitest'
import { createLegacySnapshot } from './legacy-snapshot'

it('exports only known keys and preserves raw storage and version metadata', () => {
  const progress = '{ "version": 4, "data": {} }'
  const annotations = '{ broken raw'
  const getItem = vi.fn((key: string) => {
    const stored: Record<string, string> = {
      'mellow:learner-progress': progress,
      'mellow:favorite-words': '["vocab"]',
      'mellow:vocabulary-annotations': annotations,
      'unrelated-auth-token': 'do not read',
    }
    return stored[key] ?? null
  })
  const setItem = vi.fn()
  const storage = { getItem, setItem }
  expect(createLegacySnapshot(storage, 'fixture')).toEqual({
    formatVersion: 1,
    requestId: 'fixture',
    storage: {
      'mellow:learner-progress': { schemaVersion: 4, raw: progress },
      'mellow:favorite-words': { schemaVersion: null, raw: '["vocab"]' },
      'mellow:vocabulary-annotations': {
        schemaVersion: null,
        raw: annotations,
      },
    },
  })
  expect(getItem.mock.calls.map(([key]) => key)).toEqual([
    'mellow:learner-progress',
    'mellow:favorite-words',
    'mellow:favorite-words-saved-at',
    'mellow:vocabulary-annotations',
  ])
  expect(setItem).not.toHaveBeenCalled()
})

it('retains unsupported versions and an explicitly supplied export timestamp', () => {
  const getItem = (key: string) =>
    key === 'mellow:learner-progress' ? '{"version":23}' : null
  expect(
    createLegacySnapshot(
      { getItem },
      'fixture',
      new Date('2025-01-02T06:00:00.000Z'),
    ),
  ).toEqual({
    formatVersion: 1,
    requestId: 'fixture',
    exportedAt: '2025-01-02T06:00:00.000Z',
    storage: {
      'mellow:learner-progress': {
        schemaVersion: 23,
        raw: '{"version":23}',
      },
    },
  })
})
