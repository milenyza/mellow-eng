import { dailyWord } from '@/data/dashboard'
import {
  getLessonPath,
  getPracticalSituationPath,
  getStoryPath,
} from '@/data/navigation'
import { practicalSituations } from '@/data/practical-english'
import {
  englishCourseId,
  getLessonVocabularyId,
} from '@/services/lesson-vocabulary-reference'
import { getNotebookContentType } from '@/services/notebook-selectors'
import type { NotebookResolution, NotebookVocabulary } from '@/types/notebook'

async function loadLessonVocabulary(
  ids: ReadonlySet<string>,
): Promise<NotebookVocabulary[]> {
  const { englishCourse } = await import('@/data/curriculum/english-course')
  return englishCourse.levels.flatMap(({ code, units }) =>
    units.flatMap(({ lessons }) =>
      lessons.flatMap((lesson) =>
        lesson.availability === 'available'
          ? lesson.blocks.flatMap((block) =>
              block.kind === 'vocabulary'
                ? block.entries.flatMap(
                    ({ id, expression, usage, example }) => {
                      const key = getLessonVocabularyId(
                        englishCourse.id,
                        lesson.id,
                        block.id,
                        id,
                      )
                      return ids.has(key)
                        ? [
                            {
                              ...expression,
                              id: key,
                              type: getNotebookContentType(expression.text),
                              level: code,
                              usage,
                              example,
                              source: {
                                kind: 'lesson',
                                title: lesson.title,
                                language: 'en',
                                href: getLessonPath(lesson.id),
                              },
                            } satisfies NotebookVocabulary,
                          ]
                        : []
                    },
                  )
                : [],
            )
          : [],
      ),
    ),
  )
}

async function loadStoryVocabulary(
  ids: ReadonlySet<string>,
): Promise<NotebookVocabulary[]> {
  const { stories } = await import('@/data/stories')
  return stories.flatMap((story) =>
    story.publication === 'available'
      ? story.chapters.flatMap((chapter) =>
          (chapter.vocabulary ?? []).flatMap((entry) =>
            ids.has(entry.id)
              ? [
                  {
                    id: entry.id,
                    text: entry.word,
                    type: getNotebookContentType(entry.word),
                    level: story.level,
                    translation: entry.matchingTranslation ?? entry.meaning,
                    usage: entry.matchingTranslation
                      ? entry.meaning
                      : undefined,
                    pronunciation: entry.pronunciation,
                    example: entry.example,
                    source: {
                      kind: 'story',
                      title: story.title,
                      language: 'en',
                      href: getStoryPath(story.id, chapter.id),
                    },
                  } satisfies NotebookVocabulary,
                ]
              : [],
          ),
        )
      : [],
  )
}

export async function resolveNotebookVocabulary(
  ids: readonly string[],
): Promise<NotebookResolution> {
  const vocabulary = new Map<string, NotebookVocabulary>()
  const failedIds = new Set<string>()
  const requested = new Set(ids)
  const requests: Promise<void>[] = []
  function resolve(
    sourceIds: string[],
    load: (ids: ReadonlySet<string>) => Promise<NotebookVocabulary[]>,
  ) {
    if (!sourceIds.length) return
    requests.push(
      load(new Set(sourceIds)).then(
        (entries) => {
          for (const entry of entries) vocabulary.set(entry.id, entry)
        },
        () => sourceIds.forEach((id) => failedIds.add(id)),
      ),
    )
  }

  if (requested.has(dailyWord.id)) {
    vocabulary.set(dailyWord.id, {
      id: dailyWord.id,
      text: dailyWord.word,
      translation: dailyWord.translation,
      type: getNotebookContentType(dailyWord.word),
      level: dailyWord.level,
      pronunciation: dailyWord.pronunciation,
      example: {
        text: dailyWord.example,
        translation: dailyWord.exampleTranslation,
      },
      source: { kind: 'daily', href: '/#palavra-do-dia' },
    })
  }
  resolve(
    [...requested].filter((id) => id.startsWith(`${englishCourseId}/`)),
    loadLessonVocabulary,
  )
  resolve(
    [...requested].filter((id) => id.startsWith('story-')),
    loadStoryVocabulary,
  )

  for (const situation of practicalSituations) {
    if (situation.phrasebook !== 'available') continue
    resolve(
      [...requested].filter((id) =>
        id.startsWith(`practical-${situation.id}-`),
      ),
      async (matches) => {
        const { loadPhrasebook } =
          await import('@/data/phrasebooks/load-phrasebook')
        const phrasebook = await loadPhrasebook(situation.id)
        return phrasebook.groups.flatMap((group) =>
          group.expressions.flatMap((expression) =>
            matches.has(expression.id)
              ? [
                  {
                    ...expression,
                    type: 'phrase',
                    level: situation.level,
                    keywords: [
                      group.title,
                      ...situation.keywords,
                      ...(expression.keywords ?? []),
                    ],
                    source: {
                      kind: 'practical',
                      title: situation.title,
                      language: 'pt-BR',
                      href: `${getPracticalSituationPath(situation.id)}#${expression.id}`,
                    },
                  } satisfies NotebookVocabulary,
                ]
              : [],
          ),
        )
      },
    )
  }
  await Promise.all(requests)
  return { vocabulary, failedIds }
}
