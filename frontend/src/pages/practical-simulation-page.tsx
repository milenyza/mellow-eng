import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { SimulationList } from '@/components/practical-english/simulation-list'
import { SimulationPlayer } from '@/components/practical-english/simulation-player'
import { Button } from '@/components/ui/button'
import {
  getPracticalDialoguePath,
  getPracticalSituationPath,
  practicalEnglishPath,
} from '@/data/navigation'
import type { loadSimulation } from '@/data/simulations/load-simulation'
import type { GuidedConversation } from '@/types/conversation'
import type { Phrasebook } from '@/types/practical-english'

const linkClass =
  'inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4'

export function PracticalSimulationPage() {
  const { situation, summaries, scenario, phrasebook } =
    useLoaderData<typeof loadSimulation>()
  const returnPath = situation
    ? `${getPracticalSituationPath(situation.id)}#simulacoes`
    : practicalEnglishPath

  return (
    <div className="max-w-3xl space-y-5 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <title>{`${scenario?.title ?? 'Simulação não encontrada'} | Mellow`}</title>
      <Link to={returnPath} className={linkClass}>
        {situation ? 'Voltar à situação' : 'Voltar às situações'}
      </Link>
      <header className="space-y-2 border-b border-plum/20 pb-5">
        {scenario && (
          <p className="text-sm font-bold">
            {situation?.title} · Simulação · {scenario.level}
          </p>
        )}
        <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
          {scenario?.title ?? 'Simulação não encontrada'}
        </h1>
        {!scenario && (
          <p>
            {summaries.length
              ? 'Escolha uma das simulações disponíveis nesta situação.'
              : 'Explore as situações para encontrar simulações disponíveis.'}
          </p>
        )}
      </header>
      {scenario && phrasebook ? (
        <SimulationFlow
          key={scenario.id}
          scenario={scenario}
          phrasebook={phrasebook}
          returnPath={returnPath}
        />
      ) : (
        <SimulationList simulations={summaries} />
      )}
    </div>
  )
}

function SimulationFlow({
  scenario,
  phrasebook,
  returnPath,
}: {
  scenario: GuidedConversation
  phrasebook: Phrasebook
  returnPath: string
}) {
  const [sessionNumber, setSessionNumber] = useState(0)

  return sessionNumber > 0 ? (
    <SimulationPlayer
      key={sessionNumber}
      scenario={scenario}
      phrasebook={phrasebook}
      returnPath={returnPath}
      onRestart={() => setSessionNumber((number) => number + 1)}
    />
  ) : (
    <section
      className="space-y-4 rounded-xl border-l-4 border-sage bg-sage/25 p-4 sm:p-5"
      aria-labelledby="scenario-intro"
    >
      <h2 id="scenario-intro" className="text-2xl font-semibold">
        Antes de começar
      </h2>
      <p>{scenario.context}</p>
      <p>
        <strong>Seu papel</strong> ·{' '}
        {
          scenario.participants.find(({ id }) => id === scenario.learnerId)
            ?.role
        }
      </p>
      <p>
        <strong>Objetivo</strong> · {scenario.goal}
      </p>
      <ul
        aria-label="Objetivos de aprendizagem"
        className="list-disc space-y-1 pl-5"
      >
        {scenario.objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Button onClick={() => setSessionNumber(1)}>Começar conversa</Button>
        <Link
          to={getPracticalDialoguePath(
            scenario.situationId,
            scenario.dialogueId,
          )}
          className={linkClass}
        >
          Consultar diálogo relacionado
        </Link>
      </div>
    </section>
  )
}
