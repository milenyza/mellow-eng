import {
  ExerciseReport,
  ReportDuration,
  ReportLink,
  ReportMetrics,
} from './report-elements'
import {
  getLessonPath,
  getStoryPath,
  lessonsPath,
  storiesPath,
} from '@/data/navigation'
import type {
  selectLessonReport,
  selectStoryReport,
} from '@/services/learning-reports'

export function LessonReport({
  report,
}: {
  report: ReturnType<typeof selectLessonReport>
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Percurso acumulado</p>
      <ReportMetrics
        items={[
          ['Aulas distintas concluídas', report.curriculum.completed],
          ['Aulas em andamento', report.curriculum.inProgress],
          ['Aulas disponíveis para começar', report.curriculum.ready],
        ]}
      />
      <a
        href="#progress-curriculum"
        className="inline-flex min-h-11 items-center rounded-sm text-sm font-bold underline underline-offset-4"
      >
        Ver unidades e objetivos do currículo
      </a>
      <h5 className="font-semibold">Respostas e revisões no período</h5>
      <ReportDuration duration={report.activeMs} label="aulas" />
      <ExerciseReport practice={report.performance} showModes />
      <h5 className="font-semibold">Temas para revisitar</h5>
      <p className="text-sm">
        O tema vem do foco da aula em que houve respostas incorretas ou
        correções revisadas.
      </p>
      {report.review.length ? (
        <ul className="divide-y divide-plum/20">
          {report.review.map(({ id, title, focus, incorrect, corrections }) => (
            <li key={id} className="py-1 text-sm">
              <ReportLink to={getLessonPath(id)} lang="en">
                {title}
              </ReportLink>
              <p>
                {focus} · {incorrect} respostas incorretas · {corrections}{' '}
                correções revisadas
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">
          Sem temas associados a erros ou correções registrados neste período.
        </p>
      )}
      <ReportLink to={lessonsPath}>Abrir aulas</ReportLink>
    </div>
  )
}

const readingLabels = {
  completed: 'História concluída',
  'in-progress': 'Leitura em andamento',
  'not-started': 'Disponível para começar',
}

export function StoryReport({
  report,
}: {
  report: ReturnType<typeof selectStoryReport>
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">Leituras acumuladas</p>
      <ReportMetrics
        items={[
          ['Histórias distintas concluídas', report.stories],
          ['Histórias em leitura', report.reading],
          ['Capítulos distintos lidos', report.chapters],
          [
            'Histórias publicadas no catálogo',
            `${report.coverage.published} de ${report.coverage.total}`,
          ],
        ]}
      />
      {report.undated > 0 && (
        <p className="text-sm">
          Capítulos lidos sem data disponível · {report.undated}
        </p>
      )}
      <h5 className="font-semibold">Compreensão no período</h5>
      <p className="text-sm">
        As atividades de compreensão são opcionais. Os capítulos são marcados
        como lidos separadamente.
      </p>
      <ReportDuration label="leitura" duration={report.activeMs} />
      <ExerciseReport practice={report.performance} />
      <div className="divide-y divide-plum/20 rounded-lg border border-plum/20 px-3">
        {report.entries.map(({ id, title, status, read, chapters }) => (
          <details key={id} className="py-1">
            <summary className="min-h-11 cursor-pointer rounded-sm py-2 font-bold">
              <span lang="en">{title}</span> · {readingLabels[status]}
            </summary>
            <p className="text-sm">
              {read} de {chapters.length} capítulos lidos
            </p>
            <ReportLink to={getStoryPath(id)}>
              {status === 'completed'
                ? 'Revisitar história'
                : status === 'in-progress'
                  ? 'Retomar leitura'
                  : 'Abrir história'}
            </ReportLink>
            <ul className="divide-y divide-plum/20">
              {chapters.map(({ id: chapterId, title, read, performance }) => (
                <li key={chapterId} className="py-1 text-sm">
                  <ReportLink to={getStoryPath(id, chapterId)} lang="en">
                    {title}
                  </ReportLink>
                  <p>
                    {read ? 'Capítulo lido' : 'Capítulo disponível'} ·{' '}
                    {performance.submissions} respostas de compreensão ·{' '}
                    {performance.corrections} correções revisadas no período
                  </p>
                  {performance.attempted > 0 && (
                    <p>
                      {performance.correct} de {performance.attempted} primeiras
                      respostas corretas
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <ReportLink to={storiesPath}>Abrir biblioteca de histórias</ReportLink>
    </div>
  )
}
