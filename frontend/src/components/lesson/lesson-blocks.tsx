import { PronunciationButton } from '@/components/ui/pronunciation'
import type { SpeechPlayback } from '@/hooks/use-speech-playback'
import type {
  DialogueBlock,
  GrammarBlock,
  IntroductionBlock,
  LessonBlock,
  ListeningBlock,
  PracticeBlock,
  ReviewBlock,
  SpeakingBlock,
  TranslatedExample,
  VocabularyBlock,
} from '@/types/lesson-content'

interface AudioProps {
  playback: SpeechPlayback
  descriptionId: string
  language: string
}

function SpokenExample({
  example,
  audio,
  label,
}: {
  example: TranslatedExample
  audio: AudioProps
  label?: string
}) {
  return (
    <div className="space-y-1.5">
      <p lang={audio.language} className="font-semibold">
        {example.text}
      </p>
      <p className="text-sm">{example.translation}</p>
      <PronunciationButton
        {...audio}
        text={example.text}
        label={label ?? 'Ouvir frase'}
        textLanguage={audio.language}
      />
    </div>
  )
}

function Introduction({
  block,
  objectives,
}: {
  block: IntroductionBlock
  objectives: readonly string[]
}) {
  return (
    <>
      {block.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <div className="rounded-lg bg-sage p-4 sm:p-5">
        <h3 className="text-lg font-semibold">Objetivos da aula</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

function Vocabulary({
  block,
  audio,
}: {
  block: VocabularyBlock
  audio: AudioProps
}) {
  return (
    <ul className="divide-y divide-plum/20">
      {block.entries.map(({ id, expression, example, usage }) => (
        <li key={id} className="space-y-3 py-4 first:pt-0">
          <SpokenExample
            example={expression}
            audio={audio}
            label="Ouvir expressão"
          />
          {usage && <p>{usage}</p>}
          <div className="border-l-2 border-terracotta pl-3">
            <SpokenExample example={example} audio={audio} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Grammar({ block, audio }: { block: GrammarBlock; audio: AudioProps }) {
  return (
    <>
      <p>{block.explanation}</p>
      <ul className="space-y-3">
        {block.patterns.map(({ note, example }) => (
          <li key={note} className="space-y-2 rounded-lg bg-lavender/50 p-4">
            <p>{note}</p>
            <SpokenExample example={example} audio={audio} />
          </li>
        ))}
      </ul>
    </>
  )
}

function Dialogue({
  block,
  audio,
}: {
  block: DialogueBlock
  audio: AudioProps
}) {
  return (
    <>
      <p>{block.context}</p>
      <ol className="space-y-3 border-l-2 border-sage pl-3">
        {block.lines.map((line) => (
          <li key={line.text} className="space-y-1 px-1 py-2">
            <p className="text-sm font-extrabold">{line.speaker}</p>
            <SpokenExample
              example={line}
              audio={audio}
              label={`Ouvir fala de ${line.speaker}`}
            />
          </li>
        ))}
      </ol>
    </>
  )
}

function Speaking({
  block,
  audio,
}: {
  block: SpeakingBlock
  audio: AudioProps
}) {
  return (
    <>
      <p>{block.instructions}</p>
      <ol className="list-decimal space-y-3 pl-5">
        {block.prompts.map(({ instruction, model }) => (
          <li
            key={instruction}
            className="space-y-2 border-b border-plum/20 py-3 pl-1"
          >
            <p>{instruction}</p>
            <SpokenExample example={model} audio={audio} />
          </li>
        ))}
      </ol>
    </>
  )
}

function Review({ block, audio }: { block: ReviewBlock; audio: AudioProps }) {
  return (
    <>
      <ul className="list-disc space-y-2 rounded-lg bg-sage py-4 pr-4 pl-10">
        {block.reminders.map((reminder) => (
          <li key={reminder}>{reminder}</li>
        ))}
      </ul>
      {block.examples.map((example) => (
        <SpokenExample key={example.text} example={example} audio={audio} />
      ))}
    </>
  )
}

export function LessonBlockContent({
  block,
  objectives,
  audio,
}: {
  block: Exclude<LessonBlock, PracticeBlock | ListeningBlock>
  objectives: readonly string[]
  audio: AudioProps
}) {
  switch (block.kind) {
    case 'introduction':
      return <Introduction block={block} objectives={objectives} />
    case 'vocabulary':
      return <Vocabulary block={block} audio={audio} />
    case 'grammar':
      return <Grammar block={block} audio={audio} />
    case 'dialogue':
      return <Dialogue block={block} audio={audio} />
    case 'speaking':
      return <Speaking block={block} audio={audio} />
    case 'review':
      return <Review block={block} audio={audio} />
  }
}
