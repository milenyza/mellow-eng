import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { getStoryPath, storiesPath } from '@/data/navigation'
import { formatStudyTime } from '@/services/study-time'
import type { StoryProgress } from '@/types/progress'
import type { PublishedStory } from '@/types/story'

export function StoryCompletion({
  story,
  record,
}: {
  story: PublishedStory
  record: StoryProgress
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const completion = record.completion
  if (!completion) return null
  const run = story.chapters.every(
    ({ id }) => record.run.chapters[id]?.readAt !== undefined,
  )
    ? record.run
    : completion.run
  const attempts = story.chapters.flatMap(({ id, comprehension }) =>
    (comprehension?.exercises ?? []).flatMap((exercise) => {
      const attempt = run.chapters[id]?.practice?.attempts[exercise.id]
      return attempt?.submissions.length ? [attempt] : []
    }),
  )
  const reviewed = attempts.filter(
    ({ status }) => status === 'correct' || status === 'reviewed',
  ).length
  const firstCorrect = attempts.filter(
    ({ submissions }) => submissions[0].correct,
  ).length

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3 rounded-xl bg-sage p-5 sm:p-7">
        <img
          src={story.cover}
          alt=""
          width={480}
          height={300}
          className="w-40 rounded-lg"
        />
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-heading text-3xl font-semibold"
        >
          Parabéns pela leitura!
        </h1>
        <p lang="en" className="font-heading text-xl font-semibold">
          {story.title}
        </p>
      </header>
      <dl className="grid gap-3 rounded-lg bg-lavender/50 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-bold">Capítulos lidos</dt>
          <dd>
            {
              story.chapters.filter(
                ({ id }) => run.chapters[id]?.readAt !== undefined,
              ).length
            }{' '}
            de {story.chapters.length}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-bold">Tempo ativo estimado</dt>
          <dd>{formatStudyTime(run.activeMs)}</dd>
        </div>
        {attempts.length > 0 && (
          <>
            <div>
              <dt className="text-sm font-bold">Exercícios revisados</dt>
              <dd>{reviewed}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold">
                Acertos na primeira tentativa
              </dt>
              <dd>
                {firstCorrect} de {attempts.length}
              </dd>
            </div>
          </>
        )}
      </dl>
      <section aria-labelledby="reading-objectives">
        <h2
          id="reading-objectives"
          className="font-heading text-xl font-semibold"
        >
          Objetivos da leitura
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {story.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>
      <nav aria-label="Após a leitura" className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={getStoryPath(story.id, story.chapters[0].id)}>
            Reler história
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to={storiesPath}>Voltar à biblioteca</Link>
        </Button>
      </nav>
      {story.chapters.some(({ comprehension }) => comprehension) && (
        <section aria-labelledby="review-story-exercises">
          <h2
            id="review-story-exercises"
            className="font-heading text-lg font-semibold"
          >
            Revisar exercícios de compreensão
          </h2>
          <ul className="mt-2 space-y-1">
            {story.chapters.map(
              ({ id, title, comprehension }) =>
                comprehension && (
                  <li key={id}>
                    <Link
                      className="inline-flex min-h-11 items-center rounded-sm font-bold underline"
                      to={`${getStoryPath(story.id, id)}#${comprehension.id}`}
                      lang="en"
                    >
                      {title}
                    </Link>
                  </li>
                ),
            )}
          </ul>
        </section>
      )}
    </article>
  )
}
