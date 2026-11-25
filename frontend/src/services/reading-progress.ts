import type {
  LearnerProgress,
  ReadingChapterProgress,
  ReadingProgress,
  ReadingStatus,
  StoryProgress,
} from '@/types/progress'
import type { PublishedStory, ReadableStoryChapter } from '@/types/story'

export function getReadingProgress(data: LearnerProgress): ReadingProgress {
  return (
    data.reading ?? {
      stories: {},
      preferences: { fontSize: 'normal', translations: false },
    }
  )
}

export function getReadingStatus(record?: StoryProgress): ReadingStatus {
  return record?.completion
    ? 'completed'
    : record
      ? 'in-progress'
      : 'not-started'
}

export function updateReading(
  data: LearnerProgress,
  change: (reading: ReadingProgress) => ReadingProgress,
): LearnerProgress {
  const current = getReadingProgress(data)
  const reading = change(current)
  return current === reading ? data : { ...data, reading }
}

export function updateStoryProgress(
  data: LearnerProgress,
  storyId: string,
  change: (current?: StoryProgress) => StoryProgress | undefined,
) {
  return updateReading(data, (reading) => {
    const current = reading.stories[storyId]
    const next = change(current)
    return !next || next === current
      ? reading
      : { ...reading, stories: { ...reading.stories, [storyId]: next } }
  })
}

export function startReading(
  chapterId: string,
  previous?: StoryProgress,
  now = Date.now(),
): StoryProgress {
  return {
    ...previous,
    activeMs: previous?.activeMs ?? 0,
    readChapterIds: previous?.readChapterIds ?? [],
    run: {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `reading-${now}-${Math.random().toString(36).slice(2)}`,
      startedAt: now,
      chapterId,
      chapters: {},
      activeMs: 0,
    },
  }
}

export function updateReadingChapter(
  record: StoryProgress,
  chapterId: string,
  change: (current: ReadingChapterProgress) => ReadingChapterProgress,
) {
  const current = record.run.chapters[chapterId] ?? {}
  const next = change(current)
  return current === next
    ? record
    : {
        ...record,
        run: {
          ...record.run,
          chapters: { ...record.run.chapters, [chapterId]: next },
        },
      }
}

export function markChapterRead(
  story: PublishedStory,
  record: StoryProgress,
  chapterId: string,
  now = Date.now(),
) {
  if (
    !story.chapters.some(({ id }) => id === chapterId) ||
    record.run.chapters[chapterId]?.readAt !== undefined
  )
    return record
  const timestamp = Math.max(now, record.run.startedAt)
  const updated = updateReadingChapter(record, chapterId, (chapter) => ({
    ...chapter,
    readAt: timestamp,
  }))
  const allRead = story.chapters.every(
    ({ id }) => updated.run.chapters[id]?.readAt !== undefined,
  )
  return {
    ...updated,
    readChapterIds: [...new Set([...record.readChapterIds, chapterId])],
    completion:
      record.completion ??
      (allRead ? { completedAt: timestamp, run: updated.run } : undefined),
  }
}

export function resolveReadingChapter(
  story: PublishedStory,
  record?: StoryProgress,
) {
  return (
    story.chapters.find(({ id }) => id === record?.run.chapterId) ??
    story.chapters[0]
  )
}

export function resolveReadingParagraph(
  chapter: ReadableStoryChapter,
  position?: string,
) {
  return chapter.paragraphs.find(({ id }) => id === position)?.id
}

export function readingTotals(data: LearnerProgress) {
  return Object.values(getReadingProgress(data).stories).reduce(
    (totals, story) => {
      if (story) {
        totals.stories += Number(Boolean(story.completion))
        totals.chapters += new Set(story.readChapterIds).size
        totals.activeMs += story.activeMs
      }
      return totals
    },
    { stories: 0, chapters: 0, activeMs: 0 },
  )
}
