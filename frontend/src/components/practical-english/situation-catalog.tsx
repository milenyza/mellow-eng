import { ChevronDown, Search } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { SituationCard } from '@/components/practical-english/situation-card'
import { Button } from '@/components/ui/button'
import { situationCategories } from '@/data/practical-english'
import { filterSituations } from '@/services/practical-english-catalog'
import type {
  PracticalSituation,
  SituationCategoryId,
} from '@/types/practical-english'

const fieldClass =
  'min-h-11 w-full min-w-0 rounded-md border border-border bg-background text-base'

export function SituationCatalog({
  situations,
}: {
  situations: readonly PracticalSituation[]
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SituationCategoryId | ''>('')
  const search = useRef<HTMLInputElement>(null)
  const searchId = useId()
  const filterId = useId()
  const emptyId = useId()
  const matches = filterSituations(situations, query, category)

  return (
    <div className="space-y-4 max-md:[&_button]:scroll-mb-28 max-md:[&_input]:scroll-mb-28 max-md:[&_select]:scroll-mb-28 max-md:[&_summary]:scroll-mb-28">
      <div
        role="search"
        aria-label="Buscar situações"
        className="grid gap-3 rounded-xl bg-sage/65 p-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:gap-4"
      >
        <div className="min-w-0 space-y-1.5">
          <label htmlFor={searchId} className="block text-sm font-bold">
            Título ou palavra-chave
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              ref={search}
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`${fieldClass} py-2 pr-3 pl-9`}
            />
          </div>
        </div>
        <div className="min-w-0 space-y-1.5">
          <label htmlFor={filterId} className="block text-sm font-bold">
            Categoria
          </label>
          <div className="relative">
            <select
              id={filterId}
              value={category}
              onChange={(event) =>
                setCategory(
                  situationCategories.find(
                    ({ id }) => id === event.target.value,
                  )?.id ?? '',
                )
              }
              className={`${fieldClass} appearance-none py-2 pr-9 pl-3 forced-colors:appearance-auto`}
            >
              <option value="">Todas as categorias</option>
              {situationCategories.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 forced-colors:hidden"
            />
          </div>
        </div>
      </div>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-plum/20 pb-1">
        <p role="status" aria-atomic="true" className="text-sm font-bold">
          {matches.length} {matches.length === 1 ? 'situação' : 'situações'}
        </p>
        {(query || category) && (
          <Button
            variant="secondary"
            className="motion-reduce:transition-none"
            onClick={() => {
              setQuery('')
              setCategory('')
              search.current?.focus()
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {matches.length > 0 ? (
        <ul
          aria-label="Situações de inglês na prática"
          className="grid items-start gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4"
        >
          {matches.map((situation) => (
            <li key={situation.id} className="min-w-0">
              <SituationCard situation={situation} />
            </li>
          ))}
        </ul>
      ) : (
        <section
          aria-labelledby={emptyId}
          className="space-y-2 rounded-xl bg-lavender/55 p-5"
        >
          <h2 id={emptyId} className="text-xl font-semibold">
            Nenhuma situação encontrada
          </h2>
          <p>
            Tente outra palavra-chave ou limpe os filtros para ver todos os
            roteiros.
          </p>
        </section>
      )}
    </div>
  )
}
