import { useId, useRef, useState } from 'react'
import { StoryAudioButton } from '@/components/stories/story-audio-button'
import { StoryVocabularyPopover } from '@/components/stories/story-vocabulary-popover'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import {
  getStorySegments,
  storyParagraphAnchor,
  storySpeechSource,
} from '@/services/story-reader'
import type { ReadableStoryChapter, StoryVocabularyEntry } from '@/types/story'

const speedOptions = [
  { value: 1, label: 'Normal (1×)' },
  { value: 0.75, label: 'Reduzida (0,75×)' },
] as const

export type StorySpeed = (typeof speedOptions)[number]['value']

export function StoryChapter({
  chapter,
  translations,
  readingClass,
  speed,
  setSpeed,
}: {
  chapter: ReadableStoryChapter
  translations: boolean
  readingClass: string
  speed: StorySpeed
  setSpeed: (speed: StorySpeed) => void
}) {
  const playback = useSpeechPlayback()
  const statusId = useId()
  const [selected, setSelected] = useState<StoryVocabularyEntry>()
  const trigger = useRef<HTMLButtonElement>(null)
  const vocabulary = new Map(
    chapter.vocabulary?.map((entry) => [entry.id, entry]),
  )

  return (
    <>
      <section
        aria-label="Narração"
        className="space-y-3 rounded-lg bg-lavender/55 p-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <fieldset
            disabled={!playback.supported || playback.activeId !== null}
            className="min-w-0"
          >
            <legend className="text-sm font-bold">
              Velocidade da narração
            </legend>
            <div className="flex flex-wrap gap-x-4">
              {speedOptions.map(({ value, label }) => (
                <label
                  key={value}
                  className="inline-flex min-h-11 items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name={statusId}
                    checked={speed === value}
                    onChange={() => setSpeed(value)}
                    className="size-4 shrink-0 accent-plum"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <StoryAudioButton
            playback={playback}
            playbackId="chapter"
            source={chapter.narration ?? storySpeechSource(chapter.paragraphs)}
            speed={speed}
            label="Ouvir capítulo"
            stopLabel="Parar narração do capítulo"
            statusId={statusId}
          />
        </div>
        <PronunciationStatus playback={playback} id={statusId} />
      </section>
      <div className="divide-y divide-plum/15">
        {chapter.paragraphs.map((paragraph, index) => (
          <div
            key={paragraph.id}
            id={storyParagraphAnchor(paragraph.id)}
            tabIndex={-1}
            className="scroll-mt-6 space-y-3 rounded-sm py-6"
          >
            <p lang="en" className={readingClass}>
              {getStorySegments(paragraph).map(
                ({ text, vocabularyId, offset }) => {
                  const entry = vocabularyId && vocabulary.get(vocabularyId)
                  return entry ? (
                    <button
                      key={offset}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={(event) => {
                        if (playback.activeId) playback.stop(playback.activeId)
                        trigger.current = event.currentTarget
                        setSelected(entry)
                      }}
                      className="cursor-pointer rounded-sm bg-sage px-0.5 text-left underline decoration-1 underline-offset-4 hover:bg-lavender"
                    >
                      <span lang="pt-BR" className="sr-only">
                        Consultar vocabulário:{' '}
                      </span>
                      {text}
                    </button>
                  ) : (
                    text
                  )
                },
              )}
            </p>
            {translations && paragraph.translation && (
              <p
                lang="pt-BR"
                className="border-l-2 border-terracotta pl-3 leading-relaxed"
              >
                {paragraph.translation}
              </p>
            )}
            <StoryAudioButton
              playback={playback}
              playbackId={`paragraph-${paragraph.id}`}
              source={paragraph.narration ?? storySpeechSource([paragraph])}
              speed={speed}
              label={`Ouvir parágrafo ${index + 1}`}
              stopLabel={`Parar narração do parágrafo ${index + 1}`}
              statusId={statusId}
            />
          </div>
        ))}
      </div>
      {selected && (
        <StoryVocabularyPopover
          key={selected.id}
          entry={selected}
          playback={playback}
          speed={speed}
          onClose={() => {
            playback.stop(selected.id)
            setSelected(undefined)
            trigger.current?.focus({ preventScroll: true })
          }}
        />
      )}
    </>
  )
}
