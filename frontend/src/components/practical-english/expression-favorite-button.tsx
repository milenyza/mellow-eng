import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PracticalExpression } from '@/types/practical-english'

export function ExpressionFavoriteButton({
  expression,
  saved,
  onToggle,
}: {
  expression: PracticalExpression
  saved: boolean
  onToggle: (id: string) => void
}) {
  return (
    <Button
      variant="secondary"
      aria-pressed={saved}
      onClick={() => onToggle(expression.id)}
      className="gap-2 px-3 text-sm motion-reduce:transition-none"
    >
      <Bookmark
        aria-hidden="true"
        className={saved ? 'size-4 fill-current' : 'size-4'}
      />
      Favorito
      <span className="sr-only" lang="en">
        : {expression.text}
      </span>
    </Button>
  )
}
