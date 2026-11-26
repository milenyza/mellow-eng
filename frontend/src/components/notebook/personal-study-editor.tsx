import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { familiarityLabels } from '@/data/notebook-labels'
import { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import {
  noteLimit,
  personalExampleLimit,
  saveVocabularyAnnotation,
} from '@/services/vocabulary-annotations'
import { readFavoriteWordIds } from '@/services/word-favorites'
import type {
  VocabularyAnnotation,
  VocabularyFamiliarity,
} from '@/types/notebook'

const discard = 'Descartar as alterações que ainda não foram salvas?'
const field =
  'block w-full min-w-0 rounded-md border border-border bg-cream p-2 text-base font-normal'

export function PersonalStudyEditor({
  id,
  label,
  english,
  annotation,
  onClose,
}: {
  id: string
  label: string
  english?: boolean
  annotation?: VocabularyAnnotation
  onClose: (saved: boolean) => void
}) {
  const [baseline] = useState(annotation)
  const [familiarity, setFamiliarity] = useState<VocabularyFamiliarity | ''>(
    baseline?.familiarity ?? '',
  )
  const [note, setNote] = useState(baseline?.note ?? '')
  const [example, setExample] = useState(baseline?.personalExample ?? '')
  const [error, setError] = useState('')
  const dirty =
    familiarity !== (baseline?.familiarity ?? '') ||
    note !== (baseline?.note ?? '') ||
    example !== (baseline?.personalExample ?? '')
  const blocker = useGameSessionGuard(dirty)
  const dialog = useRef<HTMLDialogElement>(null)
  const sectionId = useId()

  useEffect(() => {
    const panel = dialog.current
    panel?.showModal()
    return () => panel?.close()
  }, [])

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(discard)) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  function cancel() {
    if (!dirty || window.confirm(discard)) onClose(false)
  }

  function save() {
    try {
      if (!readFavoriteWordIds().includes(id)) {
        setError(
          'Este item saiu dos favoritos. Salve-o novamente antes de editar a anotação.',
        )
        return
      }
      const result = saveVocabularyAnnotation(
        id,
        {
          familiarity: familiarity || undefined,
          note,
          personalExample: example,
        },
        baseline,
      )
      if (result === 'saved') onClose(true)
      else if (result === 'conflict')
        setError(
          'O estudo pessoal mudou em outra aba. Copie seu texto, feche e reabra a edição antes de salvar.',
        )
      else if (result === 'invalid')
        setError('Confira os limites dos campos antes de salvar.')
      else
        setError(
          'Não foi possível salvar neste navegador. Seu texto continua aqui.',
        )
    } catch {
      setError(
        'Não foi possível salvar neste navegador. Seu texto continua aqui.',
      )
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={sectionId}
      onCancel={(event) => {
        event.preventDefault()
        cancel()
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%_-_1.5rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground backdrop:bg-plum/40 sm:p-6"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <header className="space-y-1">
          <h2 id={sectionId} className="text-2xl font-semibold">
            Editar estudo pessoal
          </h2>
          <p
            lang={english ? 'en' : undefined}
            className="font-bold [overflow-wrap:anywhere]"
          >
            {label}
          </p>
        </header>
        <label className="block space-y-1 text-sm font-bold">
          <span>Familiaridade</span>
          <select
            className={`${field} min-h-11`}
            value={familiarity}
            aria-describedby={`${sectionId}-familiarity`}
            onChange={(event) =>
              setFamiliarity(event.target.value as VocabularyFamiliarity | '')
            }
          >
            {Object.entries(familiarityLabels).map(([value, label]) => (
              <option key={value} value={value === 'unclassified' ? '' : value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <p id={`${sectionId}-familiarity`} className="text-sm">
          Escolha como você se sente em relação ao item. Esta é uma
          autoavaliação.
        </p>
        <div className="space-y-1 text-sm">
          <label htmlFor={`${sectionId}-note`} className="font-bold">
            Nota pessoal
          </label>
          <textarea
            id={`${sectionId}-note`}
            className={`${field} resize-y`}
            rows={3}
            maxLength={noteLimit}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-describedby={`${sectionId}-note-limit`}
          />
          <span id={`${sectionId}-note-limit`} className="font-normal">
            {note.length} de {noteLimit} caracteres
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor={`${sectionId}-example`} className="font-bold">
            Meu exemplo em inglês
          </label>
          <textarea
            id={`${sectionId}-example`}
            className={`${field} resize-y`}
            lang="en"
            spellCheck={false}
            rows={2}
            maxLength={personalExampleLimit}
            value={example}
            onChange={(event) => setExample(event.target.value)}
            aria-describedby={`${sectionId}-example-limit`}
          />
          <span id={`${sectionId}-example-limit`} className="font-normal">
            {example.length} de {personalExampleLimit} caracteres · Texto seu,
            sem correção automática.
          </span>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-lavender p-2 text-sm">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!dirty}>
            Salvar alterações
          </Button>
          <Button type="button" variant="secondary" onClick={cancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </dialog>
  )
}
