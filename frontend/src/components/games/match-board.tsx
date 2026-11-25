import { Check } from 'lucide-react'
import { cn } from '@/components/utils'
import type { WordMatchRun } from '@/services/word-match-session'
import type { WordMatchRound, WordMatchSide } from '@/types/word-match'

const columns = [
  { side: 'english', title: 'Inglês', lang: 'en' },
  { side: 'portuguese', title: 'Português', lang: 'pt-BR' },
] as const

export function MatchBoard({
  round,
  run,
  onSelect,
}: {
  round: WordMatchRound
  run: WordMatchRun
  onSelect: (side: WordMatchSide, id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-5">
      {columns.map(({ side, title, lang }) => (
        <section key={side} className="min-w-0 space-y-2" aria-label={title}>
          <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
          <ul className="space-y-2">
            {round[side].map((pair) => {
              const matchedIndex = run.matched.indexOf(pair.id)
              const matched = matchedIndex !== -1
              const selected =
                run.selected?.side === side && run.selected.id === pair.id
              return (
                <li key={pair.id}>
                  <button
                    type="button"
                    aria-pressed={matched ? undefined : selected}
                    aria-disabled={matched || undefined}
                    tabIndex={matched ? -1 : undefined}
                    onClick={() => onSelect(side, pair.id)}
                    className={cn(
                      'flex min-h-12 w-full items-center justify-between gap-1 rounded-md border border-border px-2 py-2 text-left text-base leading-snug font-semibold [overflow-wrap:anywhere] max-md:scroll-mb-28 sm:px-4',
                      matched
                        ? 'bg-sage'
                        : 'cursor-pointer bg-cream hover:bg-lavender',
                      selected &&
                        'border-plum bg-lavender ring-2 ring-inset ring-plum',
                    )}
                  >
                    <span lang={lang}>{pair[side]}</span>
                    {matched && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-sm">
                        <span className="sr-only">Par formado </span>
                        <Check className="size-3.5" aria-hidden="true" />
                        {matchedIndex + 1}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
