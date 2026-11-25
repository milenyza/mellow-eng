import { Button } from '@/components/ui/button'
import { sentenceBuilderGame } from '@/data/games'
import { sentenceTopics } from '@/data/sentence-challenges'
import { difficultyLabels } from '@/data/game-labels'
import type {
  SentenceDifficulty,
  SentenceTopicSelection,
} from '@/types/sentence-builder'

export function SentenceBuilderSetup({
  topic,
  counts,
  onTopic,
  onStart,
}: {
  topic: SentenceTopicSelection
  counts: Record<SentenceDifficulty, number>
  onTopic: (topic: SentenceTopicSelection) => void
  onStart: (difficulty: SentenceDifficulty) => void
}) {
  const settings = sentenceBuilderGame.difficulties.filter(
    ({ id, roundSize }) => counts[id] >= roundSize,
  )

  return (
    <section
      aria-labelledby="sentence-setup"
      className="max-w-xl space-y-5 rounded-xl bg-lavender/60 p-4 sm:p-6"
    >
      <h2 id="sentence-setup" className="text-2xl font-semibold">
        Prepare sua sessão
      </h2>
      <p>
        Monte frases do nível A1 a partir de situações do dia a dia. A
        dificuldade define o tamanho das frases e quantos desafios você vai
        praticar.
      </p>
      <div className="space-y-1.5">
        <label className="block font-bold" htmlFor="sentence-topic">
          Tema de gramática
        </label>
        <select
          id="sentence-topic"
          value={topic}
          onChange={(event) =>
            onTopic(event.target.value as SentenceTopicSelection)
          }
          className="min-h-11 w-full rounded-md border border-border bg-cream px-3 py-2"
        >
          {Object.entries(sentenceTopics).map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p role="status">
        {settings.length > 0
          ? `${settings.length} ${settings.length === 1 ? 'dificuldade disponível' : 'dificuldades disponíveis'} para este tema.`
          : 'Ainda não há frases suficientes para uma sessão deste tema. Escolha outro tema ou experimente a prática mista.'}
      </p>
      {settings.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-bold">
            Escolha a dificuldade para começar
          </legend>
          <ul className="space-y-3">
            {settings.map(({ id, roundSize }) => (
              <li
                key={id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1"
              >
                <Button onClick={() => onStart(id)}>
                  {difficultyLabels[id]} · {roundSize} desafios
                </Button>
                <p className="text-sm">
                  {
                    {
                      easy: '3 a 5 palavras por frase',
                      medium: '5 a 8 palavras por frase',
                      hard: '6 a 10 palavras por frase, com palavras extras',
                    }[id]
                  }
                </p>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </section>
  )
}
