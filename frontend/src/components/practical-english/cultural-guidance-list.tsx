import { useId, useState } from 'react'
import { Link } from 'react-router'
import {
  PronunciationButton,
  PronunciationStatus,
} from '@/components/ui/pronunciation'
import { dialogueSummaries } from '@/data/dialogues'
import {
  getPracticalDialoguePath,
  getPracticalSimulationPath,
  getPracticalSituationPath,
} from '@/data/navigation'
import { simulationSummaries } from '@/data/simulations'
import { usePracticalFavorites } from '@/hooks/use-practical-favorites'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import type {
  CulturalGuidance,
  GuidanceCategory,
  Phrasebook,
} from '@/types/practical-english'
import { ExpressionFavoriteButton } from './expression-favorite-button'

const categories: Record<GuidanceCategory, string> = {
  politeness: 'Cortesia',
  clarification: 'Confirmação',
  vocabulary: 'Vocabulário',
  context: 'Uso no contexto',
}
const regions = { 'en-US': 'Inglês americano', 'en-GB': 'Inglês britânico' }
const linkClass =
  'inline-flex min-h-11 items-center self-start rounded-sm text-sm font-bold underline underline-offset-4'

export function CulturalGuidanceList({
  guidance,
  phrasebook,
}: {
  guidance: readonly CulturalGuidance[]
  phrasebook: Phrasebook
}) {
  const playback = useSpeechPlayback()
  const { saved, feedback, toggleFavorite } = usePracticalFavorites()
  const audioStatus = useId()
  const [rate, setRate] = useState(1)
  const expressions = new Map(
    phrasebook.groups.flatMap(({ expressions }) =>
      expressions.map((expression) => [expression.id, expression] as const),
    ),
  )
  const situationId = phrasebook.situationId

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-lg bg-lavender/45 p-3">
        <label className="flex flex-wrap items-center gap-2 text-sm font-bold">
          Velocidade do áudio
          <select
            value={rate}
            className="min-h-11 rounded-md border border-border bg-background px-3 py-2"
            onChange={(event) => {
              if (playback.activeId) playback.stop(playback.activeId)
              setRate(Number(event.target.value))
            }}
          >
            <option value={1}>Normal</option>
            <option value={0.75}>Reduzida</option>
          </select>
        </label>
        <PronunciationStatus playback={playback} id={audioStatus} />
      </div>
      <p role="status" className={feedback ? 'text-sm' : 'sr-only'}>
        {feedback}
      </p>
      {guidance.map((entry) => (
        <article
          key={entry.id}
          id={entry.id}
          tabIndex={-1}
          aria-labelledby={`${entry.id}-title`}
          className="space-y-3 scroll-mt-5 border-t border-plum/20 py-4"
        >
          <header className="space-y-1">
            <p className="text-sm font-bold">{categories[entry.category]}</p>
            <h2
              id={`${entry.id}-title`}
              className="text-2xl leading-snug font-semibold"
            >
              {entry.title}
            </h2>
          </header>
          <p className="leading-relaxed">{entry.explanation}</p>
          <ul
            className="grid min-w-0 gap-2 sm:grid-cols-2"
            aria-label="Exemplos em inglês"
          >
            {entry.examples.map((example) => {
              const expression =
                example.kind === 'phrasebook'
                  ? expressions.get(example.expressionId)
                  : undefined
              const line = example.kind === 'example' ? example : expression
              if (!line) return null
              const region =
                example.kind === 'example' ? example.region : undefined
              return (
                <li
                  key={example.id}
                  className="min-w-0 space-y-2 rounded-lg bg-sage/50 p-3 only:col-span-full"
                >
                  {region && (
                    <p className="text-xs font-extrabold">{regions[region]}</p>
                  )}
                  <p
                    lang={region ?? 'en'}
                    className="font-heading text-lg font-semibold"
                  >
                    {line.text}
                  </p>
                  <p>{line.translation}</p>
                  <div className="flex flex-wrap gap-2">
                    <PronunciationButton
                      playback={playback}
                      descriptionId={audioStatus}
                      text={line.text}
                      textLanguage={region ?? 'en'}
                      playbackId={`${entry.id}-${example.id}`}
                      rate={rate}
                      source={
                        expression?.audio ?? {
                          kind: 'speech',
                          language: region ?? 'en-US',
                          parts: [{ text: line.text }],
                        }
                      }
                    />
                    {expression && (
                      <ExpressionFavoriteButton
                        expression={expression}
                        saved={saved.has(expression.id)}
                        onToggle={toggleFavorite}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="border-l-2 border-terracotta pl-3">
            <strong>Dica de uso</strong> · {entry.usage}
          </p>
          <ul
            aria-label="Conteúdo relacionado"
            className="flex flex-wrap gap-x-4"
          >
            {entry.references.expressionIds.map((id) => {
              const expression = expressions.get(id)
              return (
                expression && (
                  <li key={id}>
                    <Link
                      className={linkClass}
                      to={`${getPracticalSituationPath(situationId)}#${id}`}
                    >
                      No guia<span lang="en"> · {expression.text}</span>
                    </Link>
                  </li>
                )
              )
            })}
            {entry.references.dialogueIds?.map((id) => {
              const dialogue = dialogueSummaries.find(
                (item) => item.id === id && item.situationId === situationId,
              )
              return (
                dialogue && (
                  <li key={id}>
                    <Link
                      className={linkClass}
                      to={getPracticalDialoguePath(situationId, id)}
                    >
                      Diálogo · {dialogue.title}
                    </Link>
                  </li>
                )
              )
            })}
            {entry.references.simulationIds?.map((id) => {
              const simulation = simulationSummaries.find(
                (item) => item.id === id && item.situationId === situationId,
              )
              return (
                simulation && (
                  <li key={id}>
                    <Link
                      className={linkClass}
                      to={getPracticalSimulationPath(situationId, id)}
                    >
                      Simulação · {simulation.title}
                    </Link>
                  </li>
                )
              )
            })}
          </ul>
        </article>
      ))}
    </div>
  )
}
