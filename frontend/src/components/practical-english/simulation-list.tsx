import { ArrowUpRight, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router'
import { getPracticalSimulationPath } from '@/data/navigation'
import type { SimulationSummary } from '@/types/conversation'

export function SimulationList({
  simulations,
}: {
  simulations: readonly SimulationSummary[]
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {simulations.map(({ id, situationId, title, goal, level }) => (
        <li key={id}>
          <Link
            to={getPracticalSimulationPath(situationId, id)}
            className="group flex h-full items-start gap-3 rounded-xl border border-plum/20 bg-sage/50 p-4 hover:border-plum motion-safe:transition-colors"
          >
            <MessagesSquare
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <span className="flex-1 space-y-1">
              <span className="block text-xs font-bold">
                Simulação · {level}
              </span>
              <span className="block font-heading text-lg font-semibold group-hover:underline">
                {title}
              </span>
              <span className="block text-sm">{goal}</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
