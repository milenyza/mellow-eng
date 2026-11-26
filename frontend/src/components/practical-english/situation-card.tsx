import { ChevronDown, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { SituationIllustration } from './situation-illustration'
import { getPracticalSituationPath } from '@/data/navigation'
import { cn } from '@/components/utils'
import type { PracticalSituation } from '@/types/practical-english'

export function SituationCard({
  situation,
}: {
  situation: PracticalSituation
}) {
  const available = situation.phrasebook === 'available'

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-plum/20 bg-cream">
      <SituationIllustration
        category={situation.categoryId}
        className="aspect-[5/2] w-full rounded-t-[inherit]"
      />
      <div className="flex grow flex-col gap-3 px-4 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5',
              available ? 'bg-sage' : 'bg-lavender',
            )}
          >
            {available ? 'Expressões disponíveis' : 'Em breve'}
          </span>
          <span>Nível {situation.level}</span>
        </div>
        <div>
          <h2 className="text-xl leading-snug font-semibold">
            {situation.title}
          </h2>
          <p lang="en" className="mt-0.5 text-sm">
            {situation.englishTitle}
          </p>
        </div>
        <p className="leading-relaxed">{situation.description}</p>
        <ul
          aria-label="Objetivos de aprendizagem"
          className="list-disc space-y-1 pl-5 text-sm leading-relaxed"
        >
          {situation.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
        <p className="mt-auto flex items-center gap-2 pt-1 text-sm font-bold">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          {situation.estimatedMinutes} min estimados
        </p>
      </div>

      {available && (
        <Link
          to={getPracticalSituationPath(situation.id)}
          className="mx-4 mt-3 inline-flex min-h-11 w-fit items-center rounded-sm font-bold underline underline-offset-4"
        >
          Consultar expressões
          <span className="sr-only"> de {situation.title}</span>
        </Link>
      )}
      <details className="group mt-4 border-t border-plum/20">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-b-xl px-4 py-2 text-sm font-bold underline underline-offset-4 group-open:rounded-none [&::-webkit-details-marker]:hidden">
          <span>
            Ver prévia<span className="sr-only"> de {situation.title}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 group-open:rotate-180"
          />
        </summary>
        <dl className="mx-4 space-y-3 border-l-2 border-terracotta pb-4 pl-3">
          {situation.scenarios.map((scenario) => (
            <div key={scenario.id} className="space-y-0.5">
              <dt className="font-bold">{scenario.title}</dt>
              <dd className="text-sm leading-relaxed">
                {scenario.context} {scenario.goal}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  )
}
