import type { CefrCode, Course } from '@/types/curriculum'
import type {
  GameConfiguration,
  GameContentCandidate,
  StandaloneGameVocabulary,
} from '@/types/game'
import type { Story } from '@/types/story'

interface GameContentSources {
  course: Course
  stories: readonly Story[]
  introducedLessonIds?: readonly string[]
  savedWordIds?: readonly string[]
  standaloneVocabulary?: readonly StandaloneGameVocabulary[]
}

/** Finds authored candidates without generating rounds or inferring proficiency. */
export function selectGameContent(
  game: GameConfiguration,
  level: CefrCode,
  {
    course,
    stories,
    introducedLessonIds,
    savedWordIds = [],
    standaloneVocabulary = [],
  }: GameContentSources,
): GameContentCandidate[] {
  if (!game.levels.includes(level)) return []

  const selected: GameContentCandidate[] = []
  const includeSaved = game.content.some(
    ({ kind }) => kind === 'saved-vocabulary',
  )
  const saved = new Set(includeSaved ? savedWordIds : [])
  const introduced =
    introducedLessonIds === undefined ? null : new Set(introducedLessonIds)
  const lessons =
    course.levels
      .find(({ code }) => code === level)
      ?.units.flatMap(({ lessons }) => lessons) ?? []

  for (const lesson of lessons) {
    if (lesson.availability !== 'available') continue
    for (const block of lesson.blocks) {
      if (block.kind !== 'vocabulary' && block.kind !== 'grammar') continue
      if (block.kind === 'grammar' && introduced && !introduced.has(lesson.id))
        continue
      const source =
        block.kind === 'vocabulary' ? 'lesson-vocabulary' : 'lesson-grammar'
      if (
        game.content.some(
          (reference) =>
            reference.kind === source &&
            (reference.lessonId === undefined ||
              reference.lessonId === lesson.id),
        )
      ) {
        selected.push({
          kind: 'lesson-block',
          courseId: course.id,
          lessonId: lesson.id,
          block,
        })
      }
    }
  }

  for (const story of stories) {
    if (story.publication !== 'available' || story.level !== level) continue
    const includeStory = game.content.some(
      (reference) =>
        reference.kind === 'story-vocabulary' &&
        (reference.storyId === undefined || reference.storyId === story.id),
    )
    for (const chapter of story.chapters) {
      for (const entry of chapter.vocabulary ?? []) {
        if (includeStory || saved.has(entry.id))
          selected.push({
            kind: 'story-entry',
            storyId: story.id,
            chapterId: chapter.id,
            entry,
          })
      }
    }
  }

  for (const entry of standaloneVocabulary) {
    if (entry.level === level && saved.has(entry.id))
      selected.push({ kind: 'standalone-entry', entry })
  }

  return selected
}
