import { ChevronDown, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { difficultyLabels } from '@/data/game-labels'
import type { GameConfiguration } from '@/types/game'

const difficultyList = new Intl.ListFormat('pt-BR')

export function GameCard({
  game,
  illustration,
  instructions,
  playPath,
}: {
  game: GameConfiguration
  illustration: string
  instructions: readonly string[]
  playPath?: string
}) {
  return (
    <article className="flex h-full min-w-0 flex-col">
      <img
        src={illustration}
        alt=""
        width={480}
        height={240}
        className="aspect-[2/1] w-full rounded-lg"
      />
      <div className="flex grow flex-col pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold">
          <span
            className={
              game.publication === 'available'
                ? 'rounded-full bg-sage px-2.5 py-1'
                : 'rounded-full bg-lavender px-2.5 py-1'
            }
          >
            {game.publication === 'planned' ? 'Em breve' : 'Disponível'}
          </span>
          <span>CEFR {game.levels.join(' · ')}</span>
        </div>
        <h2 lang="en" className="mt-3 text-2xl font-semibold">
          {game.title}
        </h2>
        <p className="mt-2 leading-relaxed">{game.description}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 leading-snug">
          {game.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
        <dl className="mt-auto space-y-1 pt-5 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="flex items-center gap-1.5 font-bold">
              <Clock aria-hidden="true" className="size-4" />
              Tempo estimado
            </dt>
            <dd>{game.estimatedMinutes} min</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-bold">Dificuldade</dt>
            <dd>
              {difficultyList.format(
                game.difficulties.map(({ id }) => difficultyLabels[id]),
              )}
            </dd>
          </div>
        </dl>
      </div>
      <details className="group mt-4 border-y border-plum/25">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm py-2 text-sm font-extrabold underline underline-offset-4 [&::-webkit-details-marker]:hidden">
          Como funciona
          <span className="sr-only" lang="en">
            : {game.title}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 group-open:rotate-180"
          />
        </summary>
        <ol className="list-decimal space-y-2 pt-1 pb-4 pl-5 leading-relaxed">
          {instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
      {game.publication === 'available' && playPath && (
        <Button asChild className="mt-3 w-fit motion-reduce:transition-none">
          <Link to={playPath}>
            Jogar{' '}
            <span className="ml-1" lang="en">
              {game.title}
            </span>
          </Link>
        </Button>
      )}
    </article>
  )
}
