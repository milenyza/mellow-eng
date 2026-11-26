import { Search } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  PronunciationButton,
  PronunciationStatus,
} from '@/components/ui/pronunciation'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import { filterPhrasebook } from '@/services/practical-english-catalog'
import { usePracticalFavorites } from '@/hooks/use-practical-favorites'
import { ExpressionFavoriteButton } from './expression-favorite-button'
import type { Phrasebook } from '@/types/practical-english'

const field =
  'min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-base'
const formalities = {
  informal: 'Informal',
  neutral: 'Neutro',
  formal: 'Formal',
}

export function PhrasebookExplorer({ phrasebook }: { phrasebook: Phrasebook }) {
  const [query, setQuery] = useState('')
  const [intent, setIntent] = useState('')
  const [rate, setRate] = useState(1)
  const { saved, feedback, toggleFavorite } = usePracticalFavorites()
  const input = useRef<HTMLInputElement>(null)
  const fieldId = useId()
  const playback = useSpeechPlayback()
  const audioId = `${fieldId}-audio`
  const groups = filterPhrasebook(phrasebook.groups, query, intent)
  const count = groups.reduce(
    (total, group) => total + group.expressions.length,
    0,
  )

  function stopPlayback() {
    if (playback.activeId) playback.stop(playback.activeId)
  }

  return (
    <section
      id="expressoes"
      tabIndex={-1}
      aria-labelledby="phrasebook-heading"
      className="space-y-4 scroll-mt-5 max-md:[&_button]:scroll-mb-28 max-md:[&_select]:scroll-mb-28 max-md:[&_input]:scroll-mb-28"
    >
      <h2 id="phrasebook-heading" className="text-3xl font-semibold">
        Expressões essenciais
      </h2>
      <div
        role="search"
        aria-label="Consultar expressões"
        className="grid gap-3 rounded-xl bg-sage/65 p-4 sm:grid-cols-2"
      >
        <label className="min-w-0 space-y-1.5">
          <span className="block text-sm font-bold">
            Expressão ou palavra-chave
          </span>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              ref={input}
              type="search"
              value={query}
              className={`${field} pl-9`}
              onChange={(event) => {
                stopPlayback()
                setQuery(event.target.value)
              }}
            />
          </span>
        </label>
        <label className="min-w-0 space-y-1.5">
          <span className="block text-sm font-bold">
            Objetivo de comunicação
          </span>
          <select
            className={field}
            value={intent}
            onChange={(event) => {
              stopPlayback()
              setIntent(event.target.value)
            }}
          >
            <option value="">Todos os objetivos</option>
            {phrasebook.groups.map(({ id, title }) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-plum/20 pb-3">
        <label className="min-w-0 space-y-1">
          <span className="block text-sm font-bold">
            Velocidade da pronúncia
          </span>
          <select
            className={field}
            value={rate}
            onChange={(event) => {
              stopPlayback()
              setRate(Number(event.target.value))
            }}
          >
            <option value={1}>Normal</option>
            <option value={0.75}>Reduzida</option>
          </select>
        </label>
        {(query || intent) && (
          <Button
            variant="secondary"
            className="motion-reduce:transition-none"
            onClick={() => {
              stopPlayback()
              setQuery('')
              setIntent('')
              input.current?.focus()
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      <PronunciationStatus id={audioId} playback={playback} />
      <p role="status" aria-atomic="true" className="text-sm font-bold">
        {count} {count === 1 ? 'expressão' : 'expressões'}
      </p>
      <p role="status" className={feedback ? 'text-sm' : 'sr-only'}>
        {feedback}
      </p>

      {groups.length === 0 ? (
        <div className="space-y-2 rounded-lg bg-lavender/55 p-4">
          <h3 className="text-xl font-semibold">
            Nenhuma expressão encontrada
          </h3>
          <p>Tente outra palavra-chave ou selecione outro objetivo.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`${fieldId}-${group.id}`}
            className="space-y-3 pt-3"
          >
            <h3
              id={`${fieldId}-${group.id}`}
              className="border-l-4 border-terracotta pl-3 text-xl font-semibold"
            >
              {group.title}
            </h3>
            <ul className="divide-y divide-plum/20 rounded-xl border border-plum/20 bg-cream">
              {group.expressions.map((expression) => (
                <li
                  key={expression.id}
                  className="space-y-2 p-4 sm:p-5"
                  id={expression.id}
                  tabIndex={-1}
                >
                  <p
                    lang="en"
                    className="font-heading text-xl leading-snug font-semibold"
                  >
                    {expression.text}
                  </p>
                  <p className="font-bold">{expression.translation}</p>
                  {expression.pronunciation && (
                    <p className="text-sm" lang="en">
                      {expression.pronunciation}
                    </p>
                  )}
                  <p className="leading-relaxed">{expression.usage}</p>
                  <p className="text-sm">
                    {formalities[expression.formality]}
                    {expression.register && ` · ${expression.register}`}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <PronunciationButton
                      playback={playback}
                      text={expression.text}
                      textLanguage="en"
                      rate={rate}
                      source={expression.audio}
                      playbackId={expression.id}
                      descriptionId={audioId}
                    />
                    <ExpressionFavoriteButton
                      expression={expression}
                      saved={saved.has(expression.id)}
                      onToggle={toggleFavorite}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  )
}
