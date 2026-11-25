import { Bookmark } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  PronunciationButton,
  PronunciationStatus,
} from '@/components/ui/pronunciation'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import { readFavoriteWordIds, setWordFavorite } from '@/services/word-favorites'
import type { DailyWordData } from '@/types/dashboard'

export function DailyWord({ entry }: { entry: DailyWordData }) {
  const [saved, setSaved] = useState(() => {
    try {
      return readFavoriteWordIds().includes(entry.id)
    } catch {
      return false
    }
  })
  const [feedback, setFeedback] = useState('')
  const playback = useSpeechPlayback()
  const audioStatusId = useId()

  function toggleFavorite() {
    try {
      setWordFavorite(entry.id, !saved)
      setSaved(!saved)
      setFeedback(
        saved
          ? 'Palavra removida dos favoritos.'
          : 'Palavra salva nos favoritos.',
      )
    } catch {
      setFeedback('Não foi possível atualizar os favoritos neste navegador.')
    }
  }

  return (
    <section
      aria-labelledby="palavra-do-dia"
      className="rounded-xl border border-plum/25 p-5 sm:p-6"
    >
      <h2 id="palavra-do-dia" className="text-lg font-semibold">
        Palavra do dia
      </h2>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p lang="en" className="font-heading text-3xl font-semibold">
          {entry.word}
        </p>
        <p lang="en" className="text-sm">
          {entry.pronunciation}
        </p>
      </div>
      <p className="mt-1 font-bold">{entry.translation}</p>
      <div className="my-4 border-l-2 border-terracotta pl-3">
        <p lang="en" className="font-heading italic">
          {entry.example}
        </p>
        <p className="mt-1 text-sm">{entry.exampleTranslation}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PronunciationButton
          playback={playback}
          text={entry.word}
          descriptionId={audioStatusId}
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
      <div className="mt-2">
        <PronunciationStatus playback={playback} id={audioStatusId} />
      </div>
      <p role="status" className={feedback ? 'mt-2 text-sm' : 'sr-only'}>
        {feedback}
      </p>
    </section>
  )
}
