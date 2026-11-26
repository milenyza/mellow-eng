import { Search } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import {
  familiarityLabels,
  notebookSourceLabels,
  notebookTypeLabels,
} from '@/data/notebook-labels'
import {
  initialNotebookFilters,
  type NotebookFilters,
} from '@/services/notebook-selectors'
import type { CefrCode } from '@/types/curriculum'

const field =
  'min-h-11 w-full min-w-0 rounded-md border border-border bg-cream px-3 py-1.5 text-base'
const label = 'block space-y-1 text-sm font-bold'

export function NotebookControls({
  filters,
  setFilters,
  levels,
  hasDates,
  searchRef,
  showSorting = true,
}: {
  filters: NotebookFilters
  setFilters: (filters: NotebookFilters) => void
  levels: readonly CefrCode[]
  hasDates?: boolean
  showSorting?: boolean
  searchRef: RefObject<HTMLInputElement | null>
}) {
  return (
    <div
      className="space-y-3 rounded-xl bg-sage/55 p-4"
      role="search"
      aria-label="Buscar vocabulário salvo"
    >
      <label className={label}>
        <span>Buscar no caderno</span>
        <span className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4"
          />
          <input
            type="search"
            ref={searchRef}
            value={filters.query}
            onChange={(event) =>
              setFilters({ ...filters, query: event.target.value })
            }
            className={`${field} pl-9`}
          />
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={label}>
          Origem
          <select
            className={field}
            value={filters.source}
            onChange={(event) =>
              setFilters({
                ...filters,
                source: event.target.value as NotebookFilters['source'],
              })
            }
          >
            <option value="">Todas as origens</option>
            {Object.entries(notebookSourceLabels).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Tipo de conteúdo
          <select
            className={field}
            value={filters.type}
            onChange={(event) =>
              setFilters({
                ...filters,
                type: event.target.value as NotebookFilters['type'],
              })
            }
          >
            <option value="">Todos os tipos</option>
            {Object.entries(notebookTypeLabels).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Nível
          <select
            className={field}
            value={filters.level}
            onChange={(event) =>
              setFilters({
                ...filters,
                level: event.target.value as NotebookFilters['level'],
              })
            }
          >
            <option value="">Todos os níveis</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Filtrar por familiaridade
          <select
            className={field}
            value={filters.familiarity ?? ''}
            onChange={(event) =>
              setFilters({
                ...filters,
                familiarity: event.target
                  .value as NotebookFilters['familiarity'],
              })
            }
          >
            <option value="">Todas as classificações</option>
            {Object.entries(familiarityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {showSorting && (
          <label className={label}>
            Ordenar por
            <select
              className={field}
              value={hasDates ? filters.sort : 'alphabetical'}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  sort: event.target.value as NotebookFilters['sort'],
                })
              }
            >
              <option value="alphabetical">Ordem alfabética</option>
              <option value="recent" disabled={!hasDates}>
                Salvos recentemente
              </option>
            </select>
          </label>
        )}
      </div>
      {(filters.query ||
        filters.type ||
        filters.source ||
        filters.level ||
        filters.familiarity) && (
        <Button
          variant="secondary"
          className="bg-cream motion-reduce:transition-none"
          onClick={() => {
            setFilters({ ...initialNotebookFilters, sort: filters.sort })
            searchRef.current?.focus()
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
