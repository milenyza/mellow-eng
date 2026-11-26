import { SituationCatalog } from '@/components/practical-english/situation-catalog'
import { practicalSituations } from '@/data/practical-english'

export function PracticalEnglishPage() {
  return (
    <>
      <title>Inglês na prática | Mellow</title>
      <div className="space-y-6 sm:space-y-8">
        <header className="border-t border-plum/20 pt-7 sm:pt-8">
          <h1 className="max-w-prose text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Inglês na prática
          </h1>
          <p className="mt-3 max-w-[58ch] text-lg leading-relaxed">
            O que dizer ao chegar a um hotel, pedir um café ou conhecer alguém?
            Explore os roteiros de conversas do dia a dia que estamos
            preparando.
          </p>
        </header>
        <SituationCatalog situations={practicalSituations} />
      </div>
    </>
  )
}
