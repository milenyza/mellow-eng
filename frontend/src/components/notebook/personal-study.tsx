import { ChevronDown, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { familiarityLabels } from '@/data/notebook-labels'
import type { VocabularyAnnotation } from '@/types/notebook'

export function PersonalStudy({
  label,
  english,
  annotation,
  onEdit,
}: {
  label: string
  english?: boolean
  annotation?: VocabularyAnnotation
  onEdit: () => void
}) {
  return (
    <details className="group rounded-lg bg-lavender/45 px-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm py-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <NotebookPen className="size-4 shrink-0" aria-hidden="true" />
          Estudo pessoal
          <span className="sr-only" lang={english ? 'en' : undefined}>
            {' '}
            · {label}
          </span>
          <span className="font-normal">
            {familiarityLabels[annotation?.familiarity ?? 'unclassified']}
          </span>
          {(annotation?.note || annotation?.personalExample) && (
            <span className="rounded-md bg-cream px-1.5">Com anotações</span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 border-t border-plum/20 py-3">
        {annotation?.note && (
          <div>
            <p className="text-sm font-bold">Nota pessoal</p>
            <p className="whitespace-pre-wrap">{annotation.note}</p>
          </div>
        )}
        {annotation?.personalExample && (
          <div>
            <p className="text-sm font-bold">Meu exemplo em inglês</p>
            <p lang="en" className="whitespace-pre-wrap">
              {annotation.personalExample}
            </p>
          </div>
        )}
        <Button
          variant="secondary"
          onClick={onEdit}
          className="text-sm motion-reduce:transition-none"
        >
          Editar estudo pessoal
          <span className="sr-only" lang={english ? 'en' : undefined}>
            {' '}
            · {label}
          </span>
        </Button>
      </div>
    </details>
  )
}
