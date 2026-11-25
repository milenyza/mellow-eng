import { PracticePlayer } from '@/components/exercise/practice-player'
import { storyParagraphAnchor } from '@/services/story-reader'
import type { PracticeSession } from '@/types/exercise'
import type { ChapterComprehension, StoryParagraph } from '@/types/story'

export function StoryComprehension({
  activity,
  paragraphs,
  session,
  onChange,
}: {
  activity: ChapterComprehension
  paragraphs: readonly StoryParagraph[]
  session?: PracticeSession
  onChange: (session: PracticeSession) => void
}) {
  return (
    <section
      aria-labelledby={activity.id}
      className="space-y-4 border-t border-plum/20 pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={activity.id} className="font-heading text-2xl font-semibold">
          Compreensão da leitura
        </h2>
        <a
          href="#story-chapter-heading"
          className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        >
          Voltar ao texto do capítulo
        </a>
      </div>
      <PracticePlayer
        block={activity}
        language="en"
        session={session}
        onChange={onChange}
        finishedDescription="Você pode reler o capítulo ou seguir na história."
        renderContext={(exercise) => {
          const references = activity.exercises.find(
            ({ id }) => id === exercise.id,
          )?.paragraphIds
          return references?.length ? (
            <ul
              aria-label="Trechos para consultar"
              className="flex flex-wrap gap-x-4"
            >
              {paragraphs.map(
                ({ id }, index) =>
                  references.includes(id) && (
                    <li key={id}>
                      <a
                        href={`#${storyParagraphAnchor(id)}`}
                        className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
                      >
                        Reler parágrafo {index + 1}
                      </a>
                    </li>
                  ),
              )}
            </ul>
          ) : null
        }}
      />
    </section>
  )
}
