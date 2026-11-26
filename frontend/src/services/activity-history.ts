import { getReadingProgress } from '@/services/reading-progress'
import { validStudyRange } from '@/services/study-calendar'
import { localStudyDay, recordedSessions } from '@/services/study-time'
import type { ActivityModule, RecordedActivity } from '@/types/activity-history'
import type { StudyDateRange } from '@/types/learning-analytics'
import type { LearnerProgress } from '@/types/progress'

type ActivityInput = RecordedActivity extends infer Event
  ? Event extends RecordedActivity
    ? Omit<Event, 'day' | 'id' | 'status'>
    : never
  : never

function recordedDay(at: number | undefined) {
  if (at === undefined || !Number.isSafeInteger(at) || at < 0) return undefined
  const date = new Date(at)
  return Number.isFinite(date.getTime()) ? localStudyDay(date) : undefined
}

export function selectActivityHistory(data: LearnerProgress, through?: string) {
  const byId = new Map<string, RecordedActivity>()
  let undatedChapters = 0

  function add(entry: ActivityInput, identifiers: readonly string[]) {
    const day = recordedDay(entry.at)
    if (!day || (through && day > through)) return
    const id = JSON.stringify([entry.kind, ...identifiers])
    if (!byId.has(id)) byId.set(id, { ...entry, day, id, status: 'completed' })
  }

  for (const [contentId, record] of Object.entries(data.lessons)) {
    if (!record) continue
    const { completion, run } = record
    if (completion) {
      add(
        {
          kind: 'lesson',
          module: 'lessons',
          classification: 'milestone',
          contentId,
          sessionId: completion.run.id,
          at: completion.completedAt,
          durationMs: completion.run.activeMs,
        },
        [contentId, completion.run.id],
      )
    }
    if (run.finishedAt !== undefined && run.id !== completion?.run.id) {
      add(
        {
          kind: 'lesson',
          module: 'lessons',
          classification: 'session',
          contentId,
          sessionId: run.id,
          at: run.finishedAt,
          durationMs: run.activeMs,
        },
        [contentId, run.id],
      )
    }
  }

  for (const [contentId, record] of Object.entries(
    getReadingProgress(data).stories,
  )) {
    if (!record) continue
    const { completion, run } = record
    if (completion) {
      add(
        {
          kind: 'story',
          module: 'stories',
          classification: 'milestone',
          contentId,
          at: completion.completedAt,
          durationMs: completion.run.activeMs,
        },
        [contentId],
      )
    }
    const marks = new Map<string, number>()
    // The same run can have a mark in only one of its retained snapshots.
    for (const snapshot of completion ? [completion.run, run] : [run]) {
      for (const [chapterId, chapter] of Object.entries(snapshot.chapters)) {
        const at = chapter?.readAt
        const day = recordedDay(at)
        if (at !== undefined && day && (!through || day <= through)) {
          marks.set(chapterId, Math.max(marks.get(chapterId) ?? 0, at))
        }
      }
    }
    for (const chapterId of new Set(record.readChapterIds)) {
      const at = marks.get(chapterId)
      if (at === undefined) undatedChapters++
      else
        add(
          {
            kind: 'chapter',
            module: 'stories',
            classification: 'milestone',
            contentId: chapterId,
            parentId: contentId,
            at,
          },
          [contentId, chapterId],
        )
    }
  }

  for (const game of recordedSessions(data.gameSessions)) {
    add(
      {
        kind: 'game',
        module: 'games',
        classification: 'session',
        contentId: game.gameId,
        sessionId: game.sessionId,
        at: game.endedAt,
        durationMs: game.activeMs,
        attempts: game.answeredCount,
        completedItems:
          game.gameId === 'word-match'
            ? game.correctCount
            : game.gameId === 'sentence-builder'
              ? game.challenges.length
              : game.totalPairs,
      },
      [game.sessionId],
    )
  }
  for (const simulation of recordedSessions(data.simulationSessions)) {
    add(
      {
        kind: 'simulation',
        module: 'practical',
        classification: 'session',
        contentId: simulation.scenarioId,
        parentId: simulation.situationId,
        sessionId: simulation.sessionId,
        at: simulation.completedAt,
        durationMs: simulation.activeMs,
        attempts: simulation.attempts.length,
        decisions: simulation.decisionsCompleted,
        corrections: simulation.reviewedCorrections,
      },
      [simulation.sessionId],
    )
  }
  for (const review of recordedSessions(data.flashcardSessions)) {
    add(
      {
        kind: 'flashcard',
        module: 'notebook',
        classification: 'session',
        contentId: review.sessionId,
        sessionId: review.sessionId,
        at: review.completedAt,
        durationMs: review.activeMs,
        vocabulary: new Set(
          review.observations.map(({ vocabularyId }) => vocabularyId),
        ).size,
      },
      [review.sessionId],
    )
  }
  return {
    entries: [...byId.values()].sort(
      (a, b) => b.at - a.at || a.id.localeCompare(b.id),
    ),
    undatedChapters,
  }
}

export function filterActivityHistory(
  activities: readonly RecordedActivity[],
  range: StudyDateRange = {},
  module?: ActivityModule,
) {
  if (!validStudyRange(range)) return []
  return activities.filter(
    ({ day, module: source }) =>
      (!module || source === module) &&
      (!range.from || day >= range.from) &&
      (!range.to || day <= range.to),
  )
}

export function groupActivityByDay(activities: readonly RecordedActivity[]) {
  const grouped = new Map<string, RecordedActivity[]>()
  for (const entry of activities) {
    const group = grouped.get(entry.day)
    if (group) group.push(entry)
    else grouped.set(entry.day, [entry])
  }
  return [...grouped].map(([day, entries]) => ({ day, entries }))
}
