import { useEffect, useId, useRef, useState } from 'react'
import { GameSessionConfirmation } from '@/components/games/game-session-confirmation'
import { Button } from '@/components/ui/button'
import { PronunciationStatus } from '@/components/ui/pronunciation'
import { useGameClock } from '@/hooks/use-game-clock'
import { useGameSessionGuard } from '@/hooks/use-game-session-guard'
import { useSpeechPlayback } from '@/hooks/use-speech-playback'
import {
  conversationTranscript,
  currentConversationNode,
  finishConversation,
  startConversation,
  updateConversation,
  type ConversationAction,
} from '@/services/conversation-session'
import type { GuidedConversation, SimulationResult } from '@/types/conversation'
import type { Phrasebook } from '@/types/practical-english'
import { SimulationResponse } from './simulation-response'
import { SimulationResults } from './simulation-results'
import {
  SimulationTranscript,
  SimulationTurn,
  type SimulationAudio,
} from './simulation-turn'

export function SimulationPlayer({
  scenario,
  phrasebook,
  returnPath,
  onRestart,
}: {
  scenario: GuidedConversation
  phrasebook: Phrasebook
  returnPath: string
  onRestart: () => void
}) {
  const [session, setSession] = useState(() => startConversation(scenario))
  const [result, setResult] = useState<SimulationResult>()
  const [translated, setTranslated] = useState(false)
  const [rate, setRate] = useState(1)
  const [restarting, setRestarting] = useState(false)
  const playback = useSpeechPlayback()
  const readTime = useGameClock()
  const blocker = useGameSessionGuard(!result)
  const statusId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const node = currentConversationNode(scenario, session)
  const audio: SimulationAudio = { scenario, rate, playback, statusId }

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [node.id])

  function stopAudio() {
    if (playback.activeId) playback.stop(playback.activeId)
  }

  function act(action: ConversationAction) {
    const next = updateConversation(scenario, session, action)
    if (next.nodeId !== session.nodeId) {
      stopAudio()
      setResult(finishConversation(scenario, next, readTime().activeMs))
    } else if (
      next.selectedId !== session.selectedId &&
      playback.activeId === `selected-${session.selectedId}`
    ) {
      stopAudio()
    }
    setSession(next)
  }

  const leaving = blocker.state === 'blocked'
  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-xl border border-plum/20 bg-lavender/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <label className="space-y-1">
            <span className="block text-sm font-bold">Velocidade do áudio</span>
            <select
              className="min-h-11 rounded-md border border-border bg-cream px-3 py-2"
              value={rate}
              onChange={(event) => {
                stopAudio()
                setRate(Number(event.target.value))
              }}
            >
              <option value={1}>Normal</option>
              <option value={0.75}>Reduzida</option>
            </select>
          </label>
          <Button
            variant="secondary"
            aria-pressed={translated}
            onClick={() => setTranslated(!translated)}
          >
            Traduções
          </Button>
          <Button
            variant="secondary"
            onClick={stopAudio}
            disabled={!playback.activeId}
          >
            Parar áudio
          </Button>
        </div>
        <PronunciationStatus id={statusId} playback={playback} />
      </div>
      {node.kind === 'decision' && (
        <section
          className="space-y-4"
          aria-labelledby="current-simulation-turn"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div>
              <h2
                ref={heading}
                tabIndex={-1}
                id="current-simulation-turn"
                className="rounded-sm text-2xl font-semibold"
              >
                Sua vez de responder
              </h2>
              <p className="text-sm font-bold">
                Decisões concluídas: {session.decisions.length}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setRestarting(true)}>
              Reiniciar conversa
            </Button>
          </div>
          <SimulationTurn
            message={{ ...node.message, id: node.id }}
            audio={audio}
            translated={translated}
            audioId={`turn-${node.id}`}
          />
          <SimulationResponse
            key={node.id}
            node={node}
            session={session}
            translated={translated}
            act={act}
            audio={audio}
          />
        </section>
      )}
      {!result && session.decisions.length > 0 && (
        <details className="space-y-3 rounded-lg border border-plum/20 p-3">
          <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold">
            Ver falas anteriores
          </summary>
          <SimulationTranscript
            audio={audio}
            translated={translated}
            messages={conversationTranscript(scenario, session.decisions)}
          />
        </details>
      )}
      {result && (
        <SimulationResults
          result={result}
          audio={audio}
          translated={translated}
          phrasebook={phrasebook}
          returnPath={returnPath}
          onRestart={onRestart}
          heading={heading}
        />
      )}
      {(leaving || restarting) && (
        <GameSessionConfirmation
          action={leaving ? 'leave' : 'restart'}
          continueLabel="Continuar conversa"
          restartDescription="As escolhas desta sessão serão descartadas e você voltará à primeira fala."
          onCancel={() => {
            if (leaving) blocker.reset()
            else setRestarting(false)
          }}
          onConfirm={() => {
            stopAudio()
            if (leaving) blocker.proceed()
            else onRestart()
          }}
        />
      )}
    </div>
  )
}
