import { useEffect } from 'react'
import { Link, useLoaderData, useLocation } from 'react-router'
import { DialogueList } from '@/components/practical-english/dialogue-list'
import { dialogueSummaries } from '@/data/dialogues'
import { PhrasebookExplorer } from '@/components/practical-english/phrasebook-explorer'
import { SituationIllustration } from '@/components/practical-english/situation-illustration'
import { practicalEnglishPath } from '@/data/navigation'
import { SimulationList } from '@/components/practical-english/simulation-list'
import { simulationSummaries } from '@/data/simulations'
import type { loadPracticalSituation } from '@/data/phrasebooks/load-phrasebook'

export function PracticalSituationPage() {
  const { situation, phrasebook } =
    useLoaderData<typeof loadPracticalSituation>()
  const { hash } = useLocation()
  const dialogues = dialogueSummaries.filter(
    ({ situationId }) => situationId === situation?.id,
  )

  const simulations = simulationSummaries.filter(
    ({ situationId }) => situationId === situation?.id,
  )

  useEffect(() => {
    if (!phrasebook || !hash) return
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1))
      target?.scrollIntoView?.({ block: 'start' })
      target?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [phrasebook, hash])
  return (
    <div className="space-y-7">
      <title>{`${situation?.title ?? 'Situação não encontrada'} | Mellow`}</title>
      <Link
        to={practicalEnglishPath}
        className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
      >
        Voltar às situações
      </Link>
      {situation ? (
        <>
          <header className="grid gap-4 border-b border-plum/20 pb-5 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:items-center">
            <div className="space-y-2">
              <p className="text-sm font-bold">
                Nível {situation.level} ·{' '}
                {phrasebook ? 'Expressões disponíveis' : 'Em breve'}
              </p>
              <h1 className="text-4xl leading-tight font-semibold">
                {situation.title}
              </h1>
              <p lang="en" className="font-bold">
                {situation.englishTitle}
              </p>
              <p className="leading-relaxed">{situation.description}</p>
              {phrasebook && (
                <a
                  href="#expressoes"
                  className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
                >
                  Ir às expressões
                </a>
              )}
              {dialogues.length > 0 && (
                <a
                  href="#dialogos"
                  className="ml-3 inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
                >
                  Ir aos diálogos
                </a>
              )}
              {simulations.length > 0 && (
                <a
                  href="#simulacoes"
                  className="ml-3 inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
                >
                  Ir às simulações
                </a>
              )}
            </div>
            <SituationIllustration
              category={situation.categoryId}
              className="aspect-[5/2] w-full rounded-xl"
            />
          </header>
          <section aria-labelledby="practical-objectives" className="space-y-2">
            <h2 id="practical-objectives" className="text-xl font-semibold">
              Objetivos de aprendizagem
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              {situation.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>
          <section
            id="dialogos"
            tabIndex={-1}
            aria-labelledby="practical-dialogues"
            className="space-y-3 scroll-mt-5"
          >
            <h2 id="practical-dialogues" className="text-xl font-semibold">
              Diálogos
            </h2>
            {dialogues.length > 0 ? (
              <DialogueList dialogues={dialogues} />
            ) : (
              <p className="text-sm font-bold">Em breve</p>
            )}
          </section>
          <section
            id="simulacoes"
            tabIndex={-1}
            aria-labelledby="simulation-list-title"
            className="space-y-3 scroll-mt-5"
          >
            <h2 id="simulation-list-title" className="text-xl font-semibold">
              Simulações de conversa
            </h2>
            {simulations.length > 0 ? (
              <>
                <p>Escolha como responder e acompanhe o caminho da conversa.</p>
                <SimulationList simulations={simulations} />
              </>
            ) : (
              <p className="text-sm font-bold">Em breve</p>
            )}
          </section>
          {phrasebook ? (
            <PhrasebookExplorer
              key={phrasebook.situationId}
              phrasebook={phrasebook}
            />
          ) : (
            <section
              aria-labelledby="practical-preview"
              className="space-y-3 rounded-xl bg-lavender/55 p-4"
            >
              <h2 id="practical-preview" className="text-xl font-semibold">
                Prévia da situação
              </h2>
              <p>
                As expressões essenciais desta situação estão em preparação.
              </p>
              <ul className="space-y-2">
                {situation.scenarios.map((scenario) => (
                  <li key={scenario.id}>
                    <strong>{scenario.title}</strong>
                    <p>
                      {scenario.context} {scenario.goal}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="space-y-1 border-t border-plum/20 pt-5">
            <h2 className="text-lg font-semibold">Orientações culturais</h2>
            <p className="text-sm font-bold">Em breve</p>
          </section>
        </>
      ) : (
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Situação não encontrada</h1>
          <p>Volte ao catálogo para escolher uma situação.</p>
        </header>
      )}
    </div>
  )
}
