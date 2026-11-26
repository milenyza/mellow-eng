import type { Ref } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { getPracticalDialoguePath } from '@/data/navigation'
import { conversationTranscript } from '@/services/conversation-session'
import { countSimulationAttempts } from '@/services/simulation-progress'
import { formatStudyTime } from '@/services/study-time'
import type { SimulationResult } from '@/types/conversation'
import type { Phrasebook } from '@/types/practical-english'
import { PracticalExpressionReview } from './practical-expression-review'
import { SimulationTranscript, type SimulationAudio } from './simulation-turn'

export function SimulationResults({
  result,
  storageUnavailable,
  audio,
  translated,
  phrasebook,
  returnPath,
  onRestart,
  heading,
}: {
  result: SimulationResult
  storageUnavailable: boolean
  audio: SimulationAudio
  translated: boolean
  phrasebook: Phrasebook
  returnPath: string
  onRestart: () => void
  heading: Ref<HTMLHeadingElement>
}) {
  const { scenario } = audio
  const transcript = conversationTranscript(
    scenario,
    result.decisions,
    result.terminalNodeId,
  )
  const attempts = countSimulationAttempts(result.attempts)
  const metrics = [
    ['Decisões concluídas', result.decisions.length],
    ['Tentativas', attempts.total],
    ['Acertos', attempts.correct],
    ['Erros', attempts.incorrect],
    [
      'Respostas adequadas na primeira tentativa',
      result.firstAttemptAppropriate,
    ],
    ['Dicas usadas', result.hintNodeIds.length],
    ['Correções revisadas', result.reviewedCorrections],
    ['Tempo ativo estimado', formatStudyTime(result.activeMs)],
  ] as const

  return (
    <>
      <section
        className="space-y-3 rounded-xl border-l-4 border-sage bg-sage/30 p-4 sm:p-5"
        aria-labelledby="simulation-result-title"
      >
        <h2
          id="simulation-result-title"
          ref={heading}
          tabIndex={-1}
          className="rounded-sm text-2xl font-semibold"
        >
          Conversa concluída
        </h2>
        <p>
          Você chegou ao fim de <strong>{scenario.title}</strong>. Pode revisar
          as falas ou praticar por outro caminho.
        </p>
        <p>
          <strong>Objetivo</strong> · {scenario.goal}
        </p>
        {storageUnavailable && (
          <p
            role="status"
            className="rounded-lg border border-border bg-cream p-3"
          >
            O navegador não conseguiu salvar o resultado. Ele fica disponível
            enquanto esta página estiver aberta.
          </p>
        )}
        <dl className="grid gap-2 sm:grid-cols-2">
          {metrics.map(([label, value]) => (
            <div key={label} className="border-t border-plum/20 pt-2">
              <dt className="text-sm font-bold">{label}</dt>
              <dd className="font-heading text-xl">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button onClick={onRestart}>Praticar novamente</Button>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
            to={returnPath}
          >
            Voltar às simulações da situação
          </Link>
        </div>
      </section>
      <section
        className="space-y-3"
        aria-labelledby="simulation-transcript-title"
      >
        <h2 id="simulation-transcript-title" className="text-2xl font-semibold">
          Registro da conversa
        </h2>
        <SimulationTranscript
          audio={audio}
          translated={translated}
          messages={transcript}
        />
      </section>
      <PracticalExpressionReview
        expressionIds={transcript.flatMap(
          ({ expressionIds }) => expressionIds ?? [],
        )}
        phrasebook={phrasebook}
        sectionId="expressoes-da-simulacao"
        title="Expressões para revisar"
      />
      <Link
        className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
        to={getPracticalDialoguePath(scenario.situationId, scenario.dialogueId)}
      >
        Consultar diálogo relacionado
      </Link>
    </>
  )
}
