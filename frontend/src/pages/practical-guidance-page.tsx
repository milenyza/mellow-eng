import { useEffect } from 'react'
import { Link, useLoaderData, useLocation } from 'react-router'
import { CulturalGuidanceList } from '@/components/practical-english/cultural-guidance-list'
import {
  getPracticalSituationPath,
  practicalEnglishPath,
} from '@/data/navigation'
import type { loadCulturalGuidance } from '@/data/cultural-guidance/load-cultural-guidance'

export function PracticalGuidancePage() {
  const { situation, guidance, phrasebook } =
    useLoaderData<typeof loadCulturalGuidance>()
  const { hash } = useLocation()
  const available = !!(guidance?.length && phrasebook)
  const title = available
    ? 'Orientações culturais'
    : 'Orientações indisponíveis'

  useEffect(() => {
    if (!hash || !available) return
    const frame = window.requestAnimationFrame(() => {
      const entry = document.getElementById(hash.slice(1))
      entry?.scrollIntoView?.({ block: 'start' })
      entry?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [guidance, hash, available])

  return (
    <div className="max-w-3xl space-y-5 max-md:[&_a]:scroll-mb-28 max-md:[&_button]:scroll-mb-28 max-md:[&_select]:scroll-mb-28">
      <title>{`${title} | Mellow`}</title>
      <Link
        to={
          situation
            ? `${getPracticalSituationPath(situation.id)}#orientacoes`
            : practicalEnglishPath
        }
        className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
      >
        {situation ? 'Voltar à situação' : 'Voltar às situações'}
      </Link>
      <header className="space-y-2 border-b border-plum/20 pb-4">
        {situation && (
          <p className="text-sm font-bold">
            {situation.title} · Nível {situation.level}
          </p>
        )}
        <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-prose leading-relaxed">
          {available
            ? 'Veja como usar o inglês nesta situação. Ouça os exemplos e escolha uma expressão para experimentar na próxima conversa.'
            : 'Volte ao catálogo para consultar uma situação com orientações disponíveis.'}
        </p>
      </header>
      {available && guidance && phrasebook && (
        <CulturalGuidanceList
          key={phrasebook.situationId}
          guidance={guidance}
          phrasebook={phrasebook}
        />
      )}
    </div>
  )
}
