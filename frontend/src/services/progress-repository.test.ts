import { describe, expect, it } from 'vitest'
import { startStudyRun, updateLessonRecord } from '@/services/lesson-progress'
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
} from '@/services/progress-format'
import {
  createLocalProgressRepository,
  progressStorageKey,
} from '@/services/progress-repository'
import type { ExerciseAttempt } from '@/types/exercise'

const answer = {
  kind: 'fill-in-the-blanks',
  values: { response: '  Good morning  ' },
} as const
const attempt: ExerciseAttempt = {
  answer,
  status: 'editing',
  submissions: [
    { answer, correct: false, submittedAt: 100, mode: 'text-alternative' },
  ],
}

function memoryStorage(value?: string) {
  const entries = new Map(
    value === undefined ? [] : [[progressStorageKey, value]],
  )
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, item: string) => {
      entries.set(key, item)
    },
  }
}

describe('versioned learner progress storage', () => {
  it('serializes and restores drafts, attempt history and stable positions', () => {
    const storage = memoryStorage()
    const repository = createLocalProgressRepository(() => storage)
    const run = {
      ...startStudyRun('listening', 70),
      activeMs: 2000,
      activities: {
        listening: {
          activityId: 'write',
          attempts: { write: attempt },
          finished: false,
          heardActivityIds: [],
          textActivityIds: ['write'],
        },
      },
    }
    repository.update((data) => ({
      ...updateLessonRecord(data, 'greeting', () => ({ run })),
      dailyStudyMs: { '2026-11-24': 2000 },
    }))
    const payload = storage.getItem(progressStorageKey)
    expect(JSON.parse(payload ?? '').version).toBe(4)
    expect(parseProgress(payload)).toEqual(repository.getSnapshot().data)
    expect(
      createLocalProgressRepository(() => storage).getSnapshot().data.lessons
        .greeting?.run,
    ).toEqual(run)
  })

  it.each([
    '{not json',
    '{"version":0,"data":{"lessons":{},"dailyStudyMs":{}}}',
    '{"version":1,"data":{"lessons":{"a":{"run":{"id":123}}},"dailyStudyMs":{}}}',
    '{"version":1,"data":{"lessons":{},"dailyStudyMs":{"2026-11-24":-1}}}',
  ])('recovers invalid or outdated payload %s', (payload) => {
    const storage = memoryStorage(payload)
    const repository = createLocalProgressRepository(() => storage)
    expect(repository.getSnapshot()).toEqual({
      data: emptyProgress(),
      persistence: 'recovered',
    })
    repository.update((data) =>
      updateLessonRecord(data, 'first', () => ({
        run: startStudyRun('intro'),
      })),
    )
    expect(
      parseProgress(storage.getItem(progressStorageKey))?.lessons.first?.run
        .blockId,
    ).toBe('intro')
  })

  it('keeps a working in-memory session when storage access and writes fail', () => {
    const repository = createLocalProgressRepository(() => {
      throw new Error('SecurityError')
    })
    let updates = 0
    const unsubscribe = repository.subscribe(() => {
      updates++
    })
    repository.update((data) =>
      updateLessonRecord(data, 'first', () => ({
        run: startStudyRun('intro'),
      })),
    )
    expect(repository.getSnapshot().persistence).toBe('unavailable')
    expect(repository.getSnapshot().data.lessons.first?.run.blockId).toBe(
      'intro',
    )
    expect(updates).toBe(1)
    unsubscribe()
  })

  it('rejects a claimed correction without an explicit review timestamp', () => {
    const invalid = emptyProgress()
    const data = updateLessonRecord(invalid, 'lesson', () => ({
      run: {
        ...startStudyRun('practice'),
        activities: {
          practice: {
            activityId: 'exercise',
            attempts: { exercise: { ...attempt, status: 'reviewed' } },
            finished: false,
            textActivityIds: [],
            heardActivityIds: [],
          },
        },
      },
    }))
    expect(parseProgress(serializeProgress(data))).toBeNull()
  })

  it('rebases an update on changes persisted by another repository', () => {
    const storage = memoryStorage()
    const first = createLocalProgressRepository(() => storage)
    const second = createLocalProgressRepository(() => storage)
    first.update((data) =>
      updateLessonRecord(data, 'first', () => ({
        run: startStudyRun('intro'),
      })),
    )
    second.update((data) =>
      updateLessonRecord(data, 'second', () => ({
        run: startStudyRun('intro'),
      })),
    )
    expect(Object.keys(second.getSnapshot().data.lessons)).toEqual([
      'first',
      'second',
    ])
  })
})
