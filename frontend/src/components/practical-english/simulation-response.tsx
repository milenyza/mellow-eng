import { Button } from '@/components/ui/button'
import { cn } from '@/components/utils'
import type {
  ConversationAction,
  ConversationSession,
} from '@/services/conversation-session'
import type { ConversationChoice, ConversationNode } from '@/types/conversation'
import {
  SimulationPronunciation,
  type SimulationAudio,
} from './simulation-turn'

const feedbackLabels: Record<ConversationChoice['fit'], string> = {
  appropriate: 'Resposta adequada',
  context: 'Resposta fora do contexto',
  language: 'Ajuste de inglês',
}

export function SimulationResponse({
  node,
  session,
  translated,
  audio,
  act,
}: {
  node: Extract<ConversationNode, { kind: 'decision' }>
  session: ConversationSession
  translated: boolean
  audio: SimulationAudio
  act: (action: ConversationAction) => void
}) {
  const selected = node.choices.find(({ id }) => id === session.selectedId)
  const submitted = node.choices.find(({ id }) => id === session.submittedId)
  const hintVisible = session.hintNodeIds.includes(node.id)
  return (
    <>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          act({ kind: 'submit' })
        }}
      >
        <fieldset disabled={!!submitted} className="min-w-0 space-y-2">
          <legend className="mb-2 font-bold">Como você responde?</legend>
          {session.orders[node.id].map((choiceId) => {
            const choice = node.choices.find(({ id }) => id === choiceId)
            if (!choice) return null
            const checked = selected?.id === choice.id
            return (
              <label
                key={choice.id}
                className={cn(
                  'flex min-h-11 items-start gap-3 rounded-lg border bg-cream px-3 py-2.5 has-[:enabled]:cursor-pointer has-[:enabled]:hover:bg-lavender/40',
                  checked ? 'border-plum ring-1 ring-plum' : 'border-plum/25',
                )}
              >
                <input
                  type="radio"
                  className="mt-1 size-4 shrink-0 accent-plum"
                  name="simulation-response"
                  checked={checked}
                  onChange={() => act({ kind: 'select', choiceId: choice.id })}
                />
                <span className="min-w-0">
                  <span lang="en" className="block font-bold">
                    {choice.text}
                  </span>
                  {translated && (
                    <span className="block text-sm">{choice.translation}</span>
                  )}
                </span>
              </label>
            )
          })}
        </fieldset>
        {selected && (
          <SimulationPronunciation
            audio={audio}
            id={`selected-${selected.id}`}
            message={{ ...selected, participantId: audio.scenario.learnerId }}
            label="Ouvir resposta selecionada"
          />
        )}
        {!submitted && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={!selected}>
              Confirmar resposta
            </Button>
            {node.hint && !hintVisible && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => act({ kind: 'hint' })}
              >
                Ver dica
              </Button>
            )}
          </div>
        )}
      </form>
      <div role="status">
        {hintVisible && (
          <p className="rounded-lg border-l-4 border-lavender bg-lavender/35 p-3">
            <strong>Dica</strong> · {node.hint}
          </p>
        )}
      </div>
      <div role="status">
        {submitted && (
          <div
            className={cn(
              'space-y-1 rounded-lg border-l-4 p-3',
              submitted.fit === 'appropriate'
                ? 'border-sage bg-sage/50'
                : 'border-terracotta bg-terracotta/15',
            )}
          >
            <p className="font-extrabold">{feedbackLabels[submitted.fit]}</p>
            <p>{submitted.feedback}</p>
          </div>
        )}
      </div>
      {submitted?.fit === 'appropriate' && (
        <Button onClick={() => act({ kind: 'continue' })}>
          Continuar conversa
        </Button>
      )}
      {submitted && submitted.fit !== 'appropriate' && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => act({ kind: 'retry' })}>
            Tentar novamente
          </Button>
          {!session.reviewing && (
            <Button variant="secondary" onClick={() => act({ kind: 'review' })}>
              Revisar correção
            </Button>
          )}
        </div>
      )}
      {session.reviewing && (
        <section
          className="space-y-3 rounded-lg bg-lavender/35 p-3"
          aria-label="Revisão da resposta"
        >
          <p>Veja quais respostas funcionam e escolha uma para continuar.</p>
          <ul className="space-y-3">
            {node.choices
              .filter(({ fit }) => fit === 'appropriate')
              .map((choice) => (
                <li
                  key={choice.id}
                  className="space-y-2 rounded-lg border border-plum/20 bg-cream p-3"
                >
                  <p lang="en" className="font-bold">
                    {choice.text}
                  </p>
                  {translated && <p>{choice.translation}</p>}
                  <p>{choice.feedback}</p>
                  <div className="flex flex-wrap gap-2">
                    <SimulationPronunciation
                      audio={audio}
                      id={`review-${choice.id}`}
                      message={{
                        ...choice,
                        participantId: audio.scenario.learnerId,
                      }}
                      label="Ouvir esta resposta"
                    />
                    <Button
                      variant="secondary"
                      onClick={() =>
                        act({ kind: 'continue', reviewedChoiceId: choice.id })
                      }
                    >
                      Usar esta resposta
                      <span className="sr-only" lang="en">
                        : {choice.text}
                      </span>
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  )
}
