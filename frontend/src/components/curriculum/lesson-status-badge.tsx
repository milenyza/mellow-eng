import { BookOpen, Check, Clock } from 'lucide-react'
import { cn } from '@/components/utils'
import type { LessonStatus } from '@/types/curriculum'

const statuses = {
  completed: { label: 'Concluída', icon: Check, tone: 'bg-sage' },
  'in-progress': {
    label: 'Em andamento',
    icon: BookOpen,
    tone: 'border border-plum/30 bg-lavender',
  },
  available: { label: 'Disponível', icon: BookOpen, tone: 'bg-lavender' },
  planned: {
    label: 'Em breve',
    icon: Clock,
    tone: 'border border-plum/30 bg-cream',
  },
} satisfies Record<
  LessonStatus,
  { label: string; icon: typeof Clock; tone: string }
>

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const { label, icon: Icon, tone } = statuses[status]
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold',
        tone,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  )
}
