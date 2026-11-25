import { Bookmark } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { StoryAudioButton } from '@/components/stories/story-audio-button'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'
import { readFavoriteWordIds, setWordFavorite } from '@/services/word-favorites'
import type { StoryVocabularyEntry } from '@/types/story'

export function StoryVocabularyPopover({
  entry,
  playback,
  speed,
  onClose,
}: {
  entry: StoryVocabularyEntry
  playback: SpeechPlayback
  speed: number
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [feedback, setFeedback] = useState('')
  const [saved, setSaved] = useState(() => {
    try {
      return readFavoriteWordIds().includes(entry.id)
    } catch {
      return false
    }
  })

  useEffect(() => {
    const panel = dialog.current
    if (panel && !panel.open) panel.showModal()
  }, [])

  function toggleFavorite() {
    try {
      setWordFavorite(entry.id, !saved)
      setSaved(!saved)
      setFeedback(
        saved
          ? 'Expressão removida dos favoritos.'
          : 'Expressão salva nos favoritos.',
      )
    } catch {
      setFeedback('Não foi possível atualizar os favoritos neste navegador.')
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md space-y-4 overflow-y-auto rounded-xl border border-border bg-background p-5 text-foreground backdrop:bg-plum/35 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id={`${id}-title`}
          lang="en"
          className="min-w-0 font-heading text-2xl font-semibold"
        >
          {entry.word}
        </h3>
        <Button
          variant="secondary"
          onClick={() => dialog.current?.close()}
          className="text-sm"
        >
          Fechar vocabulário
        </Button>
      </div>
      <p lang="en" className="text-sm font-semibold">
        {entry.pronunciation}
      </p>
      <p className="leading-relaxed">{entry.meaning}</p>
      <div className="space-y-1 border-l-2 border-terracotta pl-3">
        <p lang="en" className="font-heading text-lg leading-relaxed">
          {entry.example.text}
        </p>
        <p className="text-sm">{entry.example.translation}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <StoryAudioButton
          playback={playback}
          playbackId={entry.id}
          source={entry.word}
          speed={speed}
          label="Ouvir pronúncia"
          stopLabel="Parar pronúncia"
          statusId={`${id}-audio`}
        />
        <Button
          variant="secondary"
          onClick={toggleFavorite}
          className="gap-2 text-sm"
        >
          <Bookmark
            aria-hidden="true"
            className={saved ? 'size-4 fill-current' : 'size-4'}
          />
          {saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        </Button>
      </div>
      <PronunciationStatus playback={playback} id={`${id}-audio`} />
      <p role="status" className={feedback ? 'text-sm' : 'sr-only'}>
        {feedback}
      </p>
    </dialog>
  )
}
