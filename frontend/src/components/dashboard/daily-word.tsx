import { Bookmark, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
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
  const [speaking, setSpeaking] = useState(false)
  const [speechMessage, setSpeechMessage] = useState('')
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)
  const synthesis = window.speechSynthesis
  const canSpeak =
    typeof synthesis?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'

  useEffect(() => {
    return () => {
      if (utterance.current) {
        utterance.current = null
        synthesis.cancel()
      }
    }
  }, [synthesis])

  function togglePronunciation() {
    if (!canSpeak) return
    if (utterance.current) {
      utterance.current = null
      synthesis.cancel()
      setSpeaking(false)
      setSpeechMessage('Reprodução interrompida.')
      return
    }

    try {
      const speech = new SpeechSynthesisUtterance(entry.word)
      speech.lang = 'en-US'
      speech.rate = 0.85
      utterance.current = speech

      function finish(message: string) {
        if (utterance.current !== speech) return
        utterance.current = null
        setSpeaking(false)
        setSpeechMessage(message)
      }

      speech.onend = () => finish('Pronúncia concluída.')
      speech.onerror = () =>
        finish('Não foi possível reproduzir a pronúncia neste navegador.')
      setSpeaking(true)
      setSpeechMessage('Reproduzindo a pronúncia em inglês.')
      synthesis.speak(speech)
    } catch {
      utterance.current = null
      setSpeaking(false)
      setSpeechMessage(
        'Não foi possível reproduzir a pronúncia neste navegador.',
      )
    }
  }

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
        <button
          type="button"
          onClick={togglePronunciation}
          disabled={!canSpeak}
          aria-describedby={canSpeak ? undefined : 'pronuncia-indisponivel'}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold enabled:cursor-pointer enabled:hover:bg-lavender"
        >
          {speaking ? (
            <Square aria-hidden="true" className="size-4" />
          ) : (
            <Volume2 aria-hidden="true" className="size-4" />
          )}
          {speaking ? 'Parar pronúncia' : 'Ouvir pronúncia'}
        </button>
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
      {!canSpeak && (
        <p id="pronuncia-indisponivel" className="mt-2 text-sm">
          A reprodução de áudio está indisponível neste navegador.
        </p>
      )}
      <p role="status" className={speechMessage ? 'mt-2 text-sm' : 'sr-only'}>
        {speechMessage}
      </p>
      <p role="status" className={feedback ? 'mt-2 text-sm' : 'sr-only'}>
        {feedback}
      </p>
    </section>
  )
}
