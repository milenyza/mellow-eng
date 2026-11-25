import { useRef } from 'react'
import { cn } from '@/components/utils'
import type {
  Exercise,
  ExerciseAnswer,
  ExerciseOption,
  FillInTheBlanksExercise,
  MatchingPairsExercise,
} from '@/types/exercise'

const inputClass =
  'min-h-11 min-w-0 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground'
const tileClass =
  'min-h-11 max-w-full cursor-pointer rounded-md border border-border bg-background px-3 py-1.5 text-left font-bold enabled:hover:bg-lavender disabled:cursor-default'

function ChoiceFields({
  name,
  options,
  value,
  language,
  onSelect,
}: {
  name: string
  options: readonly ExerciseOption[]
  value?: string
  language?: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map(({ id, text, language: optionLanguage }) => (
        <label
          key={id}
          className={cn(
            'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-plum/30 px-3 py-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-plum',
            value === id && 'border-plum bg-lavender font-bold',
          )}
        >
          <input
            type="radio"
            name={name}
            value={id}
            checked={value === id}
            onChange={() => onSelect(id)}
            className="size-4 shrink-0 accent-plum"
          />
          <span lang={optionLanguage ?? language}>{text}</span>
        </label>
      ))}
    </div>
  )
}

function FillInTheBlanks({
  exercise,
  values,
  language,
  onChange,
}: {
  exercise: FillInTheBlanksExercise
  values: Readonly<Record<string, string>>
  language: string
  onChange: (values: Readonly<Record<string, string>>) => void
}) {
  return (
    <div className="space-y-4">
      {exercise.blanks.map(({ id, before, after }, index) => (
        <label key={id} className="block space-y-1.5">
          {before || after ? (
            <>
              <span lang={language} className="block font-bold">
                {before} ___{after}
              </span>
              <span className="sr-only">Lacuna {index + 1}</span>
            </>
          ) : (
            <span className="block font-bold">Resposta em inglês</span>
          )}
          <input
            lang={language}
            type="text"
            value={values[id] ?? ''}
            onChange={(event) =>
              onChange({ ...values, [id]: event.target.value })
            }
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  )
}

function OrderedOptions({
  options,
  count,
  sequence = false,
  tileIds,
  language,
  onChange,
}: {
  options: readonly ExerciseOption[]
  count: number
  sequence?: boolean
  tileIds: readonly string[]
  language: string
  onChange: (tileIds: readonly string[]) => void
}) {
  const wordButtons = useRef(new Map<string, HTMLButtonElement>())
  const tiles = new Map(options.map((option) => [option.id, option]))
  const isFull = tileIds.length >= count

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-lavender/50 p-3">
        <p className="mb-2 text-sm font-bold">
          {sequence ? 'Sua sequência' : 'Sua frase'}
        </p>
        {tileIds.length === 0 ? (
          <p className="text-sm">
            {sequence
              ? 'Selecione os acontecimentos do primeiro ao último.'
              : 'Selecione as palavras na ordem da frase.'}
          </p>
        ) : (
          <ol
            aria-label={
              sequence ? 'Ordem dos acontecimentos' : 'Ordem das palavras'
            }
            className={
              sequence
                ? 'flex list-decimal flex-col gap-2 pl-6'
                : 'flex flex-wrap gap-2'
            }
          >
            {tileIds.map((id, index) => (
              <li key={id}>
                <button
                  type="button"
                  className={tileClass}
                  onClick={() => {
                    wordButtons.current.get(id)?.focus()
                    onChange(tileIds.filter((tileId) => tileId !== id))
                  }}
                >
                  <span className="sr-only">
                    Remover {sequence ? 'acontecimento' : 'palavra'} {index + 1}
                    :{' '}
                  </span>
                  <span lang={tiles.get(id)?.language ?? language}>
                    {tiles.get(id)?.text}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div
        aria-label={
          sequence ? 'Acontecimentos disponíveis' : 'Palavras disponíveis'
        }
        role="group"
        className={
          sequence ? 'flex flex-col items-start gap-2' : 'flex flex-wrap gap-2'
        }
      >
        {options.map(({ id, text, language: optionLanguage }) => {
          const selected = tileIds.includes(id)
          return (
            <button
              key={id}
              type="button"
              ref={(button) => {
                if (button) wordButtons.current.set(id, button)
                else wordButtons.current.delete(id)
              }}
              aria-pressed={selected}
              disabled={isFull && !selected}
              onClick={() =>
                onChange(
                  selected
                    ? tileIds.filter((tileId) => tileId !== id)
                    : [...tileIds, id],
                )
              }
              className={cn(tileClass, selected && 'border-plum bg-lavender')}
            >
              <span lang={optionLanguage ?? language}>{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MatchingPairs({
  exercise,
  pairs,
  language,
  onChange,
}: {
  exercise: MatchingPairsExercise
  pairs: Readonly<Record<string, string>>
  language: string
  onChange: (pairs: Readonly<Record<string, string>>) => void
}) {
  return (
    <div className="space-y-3">
      {exercise.left.map(({ id, text }) => (
        <label
          key={id}
          className="grid min-w-0 gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
        >
          <span>
            <span className="sr-only">Par para </span>
            <span lang={language} className="font-bold">
              {text}
            </span>
          </span>
          <select
            value={pairs[id] ?? ''}
            onChange={(event) =>
              onChange({ ...pairs, [id]: event.target.value })
            }
            className={inputClass}
          >
            <option value="">Selecione uma tradução</option>
            {exercise.right.map((option) => (
              <option
                key={option.id}
                value={option.id}
                disabled={exercise.left.some(
                  (item) => item.id !== id && pairs[item.id] === option.id,
                )}
              >
                {option.text}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

export function ExerciseFields({
  exercise,
  answer,
  language,
  onChange,
}: {
  exercise: Exercise
  answer: ExerciseAnswer | null
  language: string
  onChange: (answer: ExerciseAnswer) => void
}) {
  switch (exercise.kind) {
    case 'multiple-choice':
      return (
        <ChoiceFields
          name={exercise.id}
          options={exercise.options}
          language={language}
          value={answer?.kind === exercise.kind ? answer.optionId : undefined}
          onSelect={(optionId) => onChange({ kind: exercise.kind, optionId })}
        />
      )
    case 'true-or-false':
      return (
        <ChoiceFields
          name={exercise.id}
          options={[
            { id: 'true', text: 'Verdadeiro' },
            { id: 'false', text: 'Falso' },
          ]}
          value={
            answer?.kind === exercise.kind ? String(answer.value) : undefined
          }
          onSelect={(id) =>
            onChange({ kind: exercise.kind, value: id === 'true' })
          }
        />
      )
    case 'fill-in-the-blanks':
      return (
        <FillInTheBlanks
          exercise={exercise}
          language={language}
          values={answer?.kind === exercise.kind ? answer.values : {}}
          onChange={(values) => onChange({ kind: exercise.kind, values })}
        />
      )
    case 'sentence-builder':
      return (
        <OrderedOptions
          options={exercise.tiles}
          count={exercise.correctOrder.length}
          language={language}
          tileIds={answer?.kind === exercise.kind ? answer.tileIds : []}
          onChange={(tileIds) => onChange({ kind: exercise.kind, tileIds })}
        />
      )
    case 'sequence-ordering':
      return (
        <OrderedOptions
          sequence
          options={exercise.items}
          count={exercise.items.length}
          language={language}
          tileIds={answer?.kind === exercise.kind ? answer.itemIds : []}
          onChange={(itemIds) => onChange({ kind: exercise.kind, itemIds })}
        />
      )
    case 'matching-pairs':
      return (
        <MatchingPairs
          exercise={exercise}
          language={language}
          pairs={answer?.kind === exercise.kind ? answer.pairs : {}}
          onChange={(pairs) => onChange({ kind: exercise.kind, pairs })}
        />
      )
  }
}
