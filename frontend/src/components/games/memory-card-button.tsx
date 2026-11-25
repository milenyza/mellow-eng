import { Check } from 'lucide-react'
import { MellowSprout } from '@/components/navigation/mellow-sprout'
import { cn } from '@/components/utils'
import type { MemoryCard } from '@/types/memory-game'

export function MemoryCardButton({
  card,
  position,
  state,
  locked,
  onReveal,
}: {
  card: MemoryCard
  position: number
  state: 'concealed' | 'revealed' | 'matched'
  locked: boolean
  onReveal: (button: HTMLButtonElement) => void
}) {
  const concealed = state === 'concealed'
  const disabled = locked || !concealed
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onMouseDown={(event) => {
        if (disabled) event.preventDefault()
      }}
      onClick={(event) => {
        if (!disabled) onReveal(event.currentTarget)
      }}
      className={cn(
        'flex h-full min-h-36 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-border px-2 py-2 text-center scroll-mt-44 max-md:scroll-mb-28 sm:scroll-mt-28 sm:px-3',
        concealed
          ? 'bg-lavender'
          : state === 'matched'
            ? 'bg-sage'
            : 'bg-cream',
        !disabled && 'cursor-pointer hover:border-plum',
      )}
    >
      <span className="text-xs font-bold tabular-nums">
        <span className="sr-only">Carta </span>
        {position}
      </span>
      {concealed ? (
        <>
          <MellowSprout className="size-8" />
          <span className="sr-only">Virada para baixo</span>
        </>
      ) : (
        <>
          <span className="text-xs font-bold">
            {card.language === 'en' ? 'Inglês' : 'Português'}
          </span>
          <span
            lang={card.language}
            className="font-heading text-base leading-snug font-semibold [overflow-wrap:anywhere]"
          >
            {card.language === 'en' ? card.pair.english : card.pair.portuguese}
          </span>
          {state === 'matched' && (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold">
              <Check aria-hidden="true" className="size-3 shrink-0" /> Par
              encontrado
            </span>
          )}
        </>
      )}
    </button>
  )
}
