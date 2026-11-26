import { SessionDate } from '@/components/ui/session-date'
import { gameTitles } from '@/data/game-labels'
import {
  gameHistoryPath,
  getGameSessionPath,
  getPracticalSimulationPath,
  getPracticalSituationPath,
  memoryGamePath,
  practicalEnglishPath,
  sentenceBuilderPath,
  wordMatchPath,
} from '@/data/navigation'
import { practicalSituations } from '@/data/practical-english'
import { sentenceTopics } from '@/data/sentence-metadata'
import type {
  selectGamesReport,
  selectPracticalReport,
} from '@/services/learning-reports'
import { ReportDuration, ReportLink, ReportMetrics } from './report-elements'

function GameResult({
  session,
}: {
  session: ReturnType<typeof selectGamesReport>['recent'][number]
}) {
  switch (session.gameId) {
    case 'word-match':
      return (
        <>
          {session.firstAttemptCorrect} de {session.correctCount} pares corretos
          na primeira tentativa
        </>
      )
    case 'sentence-builder':
      return (
        <>
          {session.correctCount} frases com resposta correta ·{' '}
          {session.reviewCount} correções revisadas
        </>
      )
    case 'memory-game':
      return (
        <>
          {session.totalPairs} pares encontrados em {session.answeredCount}{' '}
          tentativas de combinação
        </>
      )
  }
}

export function GamesReport({
  report,
}: {
  report: ReturnType<typeof selectGamesReport>
}) {
  const { wordMatch, sentenceBuilder, memory } = report
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Sessões registradas no período</p>
      <ReportMetrics
        items={[
          ['Sessões de jogos concluídas', report.completed],
          ['Itens de vocabulário praticados', report.uniqueVocabulary],
        ]}
      />
      <ReportDuration label="jogos" duration={report.activeMs} />
      {!report.completed && (
        <p className="text-sm">
          Nenhuma sessão de jogo concluída neste período.
        </p>
      )}
      <div className="divide-y divide-plum/20 rounded-lg border border-plum/20 px-3">
        <div className="space-y-1 py-2 text-sm">
          <h5 lang="en" className="text-base font-semibold">
            Word Match
          </h5>
          <p>
            {wordMatch.sessions} sessões · {wordMatch.attempts} tentativas de
            combinação
          </p>
          {wordMatch.pairs > 0 && (
            <p>
              {wordMatch.firstCorrect} de {wordMatch.pairs} pares corretos na
              primeira tentativa · {wordMatch.reviewItems} itens com
              oportunidade de revisão
            </p>
          )}
          <ReportLink to={wordMatchPath}>Praticar combinações</ReportLink>
        </div>
        <div className="space-y-1 py-2 text-sm">
          <h5 lang="en" className="text-base font-semibold">
            Sentence Builder
          </h5>
          <p>
            {sentenceBuilder.sessions} sessões · {sentenceBuilder.practiced}{' '}
            frases praticadas
          </p>
          {sentenceBuilder.practiced > 0 && (
            <p>
              {sentenceBuilder.independentlyCorrect} frases com resposta correta
              · {sentenceBuilder.firstCorrect} na primeira tentativa ·{' '}
              {sentenceBuilder.corrections} correções revisadas
            </p>
          )}
          {!!sentenceBuilder.topics.length && (
            <p>
              Temas praticados ·{' '}
              {sentenceBuilder.topics
                .map((topic) => sentenceTopics[topic])
                .join(' · ')}
            </p>
          )}
          <ReportLink to={sentenceBuilderPath}>
            Praticar a construção de frases
          </ReportLink>
        </div>
        <div className="space-y-1 py-2 text-sm">
          <h5 lang="en" className="text-base font-semibold">
            Memory Game
          </h5>
          <p>
            {memory.sessions} sessões · {memory.pairs} pares encontrados ·{' '}
            {memory.attempts} tentativas de combinação
          </p>
          <p>As tentativas descrevem a busca pela posição das cartas.</p>
          <ReportLink to={memoryGamePath}>
            Praticar com cartas de memória
          </ReportLink>
        </div>
      </div>
      {!!report.recent.length && (
        <div className="space-y-1">
          <h5 className="font-semibold">Resultados recentes por jogo</h5>
          <ul className="divide-y divide-plum/20">
            {report.recent.map((session) => (
              <li key={session.sessionId} className="py-1 text-sm">
                <ReportLink to={getGameSessionPath(session.sessionId)}>
                  <span lang="en">{gameTitles[session.gameId]}</span>
                  &nbsp;·&nbsp;
                  <SessionDate timestamp={session.endedAt} />
                </ReportLink>
                <p>
                  <GameResult session={session} />
                </p>
                {session.gameId === 'sentence-builder' && (
                  <details>
                    <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold">
                      Ver frases praticadas
                    </summary>
                    <ul className="list-disc pl-5">
                      {session.knownSentences.map(({ id, text, reviewed }) => (
                        <li key={id}>
                          <span lang="en">{text}</span> ·{' '}
                          {reviewed ? 'Correção revisada' : 'Resposta correta'}
                        </li>
                      ))}
                    </ul>
                    {session.knownSentences.length <
                      session.challenges.length && (
                      <p>Há frases deste registro sem texto disponível.</p>
                    )}
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ReportLink to={gameHistoryPath}>Abrir histórico de jogos</ReportLink>
    </div>
  )
}

const situationNames = new Map<string, string>(
  practicalSituations.map(({ id, title }) => [id, title]),
)

export function PracticalReport({
  report,
}: {
  report: ReturnType<typeof selectPracticalReport>
}) {
  const { responses } = report
  const bySituation = new Map(
    report.situations.map((entry) => [entry.id, entry]),
  )
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Simulações concluídas no período</p>
      <ReportMetrics
        items={[
          ['Sessões concluídas', report.sessions],
          ['Simulações distintas concluídas', report.distinct],
          ['Situações praticadas', report.practiced],
        ]}
      />
      <ReportDuration label="simulações" duration={report.activeMs} />
      <p className="text-sm">
        A cobertura conta sessões concluídas nas simulações. Guias de expressões
        e diálogos são atividades de consulta.
      </p>
      {report.sessions ? (
        <>
          <ReportMetrics
            items={[
              ['Respostas enviadas', responses.attempts],
              [
                'Respostas adequadas na primeira tentativa',
                responses.decisions
                  ? `${responses.firstAppropriate} de ${responses.decisions}`
                  : 'Sem respostas registradas',
              ],
              ['Correções revisadas', responses.corrections],
            ]}
          />
          <p className="text-sm">
            Respostas que pediram ajuste ao contexto · {responses.context}.
            Respostas que pediram ajuste no uso do inglês · {responses.language}
            .
          </p>
        </>
      ) : (
        <p className="text-sm">Nenhuma simulação concluída neste período.</p>
      )}
      <h5 className="font-semibold">Cobertura acumulada por situação</h5>
      <div className="divide-y divide-plum/20 rounded-lg border border-plum/20 px-3">
        {report.coverage.map(({ id, scenarios, completed }) => (
          <details key={id} className="py-1">
            <summary className="min-h-11 cursor-pointer rounded-sm py-2 text-sm font-bold">
              {situationNames.get(id) ?? 'Situação registrada'} · {completed} de{' '}
              {scenarios.length} simulações concluídas
            </summary>
            <p className="text-sm">
              {bySituation.get(id)?.sessions ?? 0} sessões concluídas no período
            </p>
            <ReportLink to={getPracticalSituationPath(id)}>
              Abrir situação
            </ReportLink>
            <ul className="divide-y divide-plum/20">
              {scenarios.map(({ id: scenarioId, title, completed }) => (
                <li key={scenarioId} className="text-sm">
                  <ReportLink to={getPracticalSimulationPath(id, scenarioId)}>
                    {title}
                  </ReportLink>
                  <p>
                    {completed
                      ? 'Concluída · histórico na página da simulação'
                      : 'Disponível para praticar'}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <ReportLink to={practicalEnglishPath}>Abrir Inglês na prática</ReportLink>
    </div>
  )
}
