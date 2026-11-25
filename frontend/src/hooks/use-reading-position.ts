import { useEffect } from 'react'
import {
  getReadingProgress,
  resolveReadingParagraph,
  updateReadingChapter,
  updateStoryProgress,
} from '@/services/reading-progress'
import type { ProgressRepository } from '@/services/progress-repository'
import { storyParagraphAnchor } from '@/services/story-reader'
import type { ReadableStoryChapter } from '@/types/story'

export function useReadingPosition(
  repository: ProgressRepository,
  storyId: string,
  chapter: ReadableStoryChapter,
  runId: string | undefined,
  hash: string,
) {
  useEffect(() => {
    if (!runId) return
    const record = getReadingProgress(repository.getSnapshot().data).stories[
      storyId
    ]
    const saved = resolveReadingParagraph(
      chapter,
      record?.run.chapters[chapter.id]?.paragraphId,
    )
    const target = hash.slice(1) || (saved && storyParagraphAnchor(saved))
    let restoreFrame = window.requestAnimationFrame(() => {
      if (target)
        document.getElementById(target)?.scrollIntoView({ block: 'start' })
      restoreFrame = window.requestAnimationFrame(() => {
        restoreFrame = 0
      })
    })
    let frame = 0

    function savePosition() {
      frame = 0
      const readingLine = window.innerHeight * 0.45
      let visible: string | undefined
      for (const { id } of chapter.paragraphs) {
        const bounds = document
          .getElementById(storyParagraphAnchor(id))
          ?.getBoundingClientRect()
        if (bounds && bounds.bottom > 0 && bounds.top <= readingLine)
          visible = id
      }
      if (!visible) return
      repository.update((data) =>
        updateStoryProgress(data, storyId, (record) => {
          if (
            !record ||
            record.run.id !== runId ||
            record.run.chapterId !== chapter.id
          )
            return record
          return updateReadingChapter(record, chapter.id, (current) =>
            current.paragraphId === visible
              ? current
              : { ...current, paragraphId: visible },
          )
        }),
      )
    }

    function schedule() {
      if (!frame && !restoreFrame)
        frame = window.requestAnimationFrame(savePosition)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(restoreFrame)
      window.removeEventListener('scroll', schedule)
    }
  }, [repository, storyId, chapter, runId, hash])
}
