import { PersonalStudy } from './personal-study'
import { BookmarkMinus, ChevronDown } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { PronunciationButton } from '@/components/ui/pronunciation'
import { SessionDate } from '@/components/ui/session-date'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'
import {
  notebookSourceLabels,
  notebookTypeLabels,
} from '@/data/notebook-labels'
import type { NotebookItem } from '@/types/notebook'

export function VocabularyCard({
  item,
  playback,
  rate,
  statusId,
  onRemove,
  onEdit,
}: {
  item: NotebookItem
  playback: SpeechPlayback
  rate: number
  statusId: string
  onRemove: (id: string) => void
  onEdit: () => void
}) {
  const { vocabulary, savedAt } = item
  const {
    id,
    type,
    level,
    text,
    translation,
    pronunciation,
    source,
    example,
    usage,
    audio,
  } = vocabulary
  const titleId = `saved-term-${id}`

  return (
    <article
      aria-labelledby={titleId}
      className="min-w-0 space-y-3 rounded-xl border border-plum/25 bg-cream p-4 [overflow-wrap:anywhere] sm:p-5"
    >
      <header className="space-y-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-bold">
          <span className="rounded-md bg-sage px-2 py-0.5">
            {notebookTypeLabels[type]}
          </span>
          <span>Nível {level}</span>
        </p>
        <h2
          id={titleId}
          lang="en"
          className="text-2xl leading-snug font-semibold"
        >
          {text}
        </h2>
        {pronunciation && (
          <p lang="en" className="text-sm">
            {pronunciation}
          </p>
        )}
        <p className="font-bold">{translation}</p>
      </header>
      <p className="text-sm">
        {notebookSourceLabels[source.kind]}
        {source.title && (
          <>
            {' '}
            · <span lang={source.language}>{source.title}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <PronunciationButton
          playback={playback}
          descriptionId={statusId}
          playbackId={id}
          text={text}
          textLanguage="en"
          rate={rate}
          source={audio}
        />
        <Button
          variant="secondary"
          onClick={() => onRemove(id)}
          className="gap-2 px-3 text-sm motion-reduce:transition-none"
        >
          <BookmarkMinus aria-hidden="true" className="size-4 shrink-0" />{' '}
          Remover dos favoritos
          <span className="sr-only" lang="en">
            {' '}
            · {text}
          </span>
        </Button>
      </div>
      <details className="group border-t border-plum/20">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm px-1 py-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
          <span>
            Ver contexto{' '}
            <span className="sr-only" lang="en">
              · {text}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 group-open:rotate-180"
          />
        </summary>
        <div className="space-y-2">
          {usage && <p>{usage}</p>}
          {example && (
            <div className="space-y-0.5 border-l-2 border-terracotta pl-3">
              <p lang="en" className="font-heading">
                {example.text}
              </p>
              <p className="text-sm">{example.translation}</p>
            </div>
          )}
          {savedAt !== undefined && (
            <p className="text-sm">
              Salvo em <SessionDate timestamp={savedAt} />
            </p>
          )}
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
            to={source.href}
          >
            Abrir conteúdo de origem{' '}
            <span className="sr-only" lang="en">
              · {text}
            </span>
          </Link>
        </div>
      </details>
      <PersonalStudy
        label={text}
        english
        annotation={item.annotation}
        onEdit={onEdit}
      />
    </article>
  )
}
