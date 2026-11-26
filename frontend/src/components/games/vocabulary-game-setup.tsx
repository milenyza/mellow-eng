import { Button } from '@/components/ui/button'
import { difficultyLabels } from '@/data/game-labels'
import { vocabularySources } from '@/data/vocabulary-sources'
import type { GameConfiguration, VocabularySource } from '@/types/game'
import { useId } from 'react'

export function VocabularyGameSetup({
  source,
  difficulties,
  description,
  showCardCount = false,
  onSource,
  poolSize,
  onStart,
}: {
  source: VocabularySource
  difficulties: GameConfiguration['difficulties']
  description: string
  showCardCount?: boolean
  onSource: (source: VocabularySource) => void
  poolSize: number
  onStart: (roundSize: number) => void
}) {
  const id = useId()
  const options = difficulties.filter(({ roundSize }) => roundSize <= poolSize)

  const minimum = Math.min(...difficulties.map(({ roundSize }) => roundSize))
  const available =
    poolSize === 1 ? '1 par disponível' : `${poolSize} pares disponíveis`

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="max-w-xl space-y-5 rounded-xl bg-lavender/60 p-4 sm:p-6"
    >
      <h2 id={`${id}-title`} className="text-2xl font-semibold">
        Prepare sua sessão
      </h2>
      <p>{description}</p>
      <div className="space-y-1.5">
        <label className="block font-bold" htmlFor={`${id}-source`}>
          Fonte de vocabulário
        </label>
        <select
          id={`${id}-source`}
          value={source}
          onChange={(event) => onSource(event.target.value as VocabularySource)}
          className="min-h-11 w-full rounded-md border border-border bg-cream px-3 py-2"
        >
          {Object.entries(vocabularySources).map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p role="status">
        {options.length === 0
          ? `Há ${available}. Você precisa de pelo menos ${minimum} para jogar. Escolha outra fonte${source === 'saved' ? ' ou salve mais palavras compatíveis nas aulas, nas histórias ou na Palavra do dia' : ''}.`
          : `${available} nesta fonte.`}
      </p>
      {options.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">
            Escolha a dificuldade para começar
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map(({ id, roundSize }) => (
              <div key={id} className="space-y-1">
                <Button onClick={() => onStart(roundSize)}>
                  {difficultyLabels[id]} · {roundSize} pares
                </Button>
                {showCardCount && (
                  <p className="text-center text-sm">{roundSize * 2} cartas</p>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      )}
    </section>
  )
}
