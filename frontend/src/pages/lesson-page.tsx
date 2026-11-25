import { Link, useParams } from 'react-router'
import { LessonStatusBadge } from '@/components/curriculum/lesson-status-badge'
import { LessonPlayer } from '@/components/lesson/lesson-player'
import { PageIntro } from '@/components/page-intro'
import { Button } from '@/components/ui/button'
import { englishCourse } from '@/data/curriculum/english-course'
import { lessonsPath } from '@/data/navigation'
import { findCourseLesson, getNextPublishedLesson } from '@/services/curriculum'

export function LessonPage() {
  const { lessonId } = useParams()
  const entry = lessonId && findCourseLesson(englishCourse, lessonId)

  if (!entry || entry.lesson.availability === 'planned') {
    const heading = entry ? 'Aula em breve' : 'Aula não encontrada'
    return (
      <>
        <title>{`${heading} | Mellow`}</title>
        <PageIntro
          title={heading}
          description={
            entry
              ? 'Esta aula faz parte do roteiro e estará disponível em uma próxima etapa.'
              : 'Confira o endereço ou escolha uma aula no catálogo.'
          }
        >
          {entry && (
            <div className="mt-4 space-y-2">
              <p
                lang={englishCourse.targetLanguage}
                className="font-heading text-xl font-semibold"
              >
                {entry.lesson.title}
              </p>
              <LessonStatusBadge status="planned" />
            </div>
          )}
          <Button asChild className="mt-4">
            <Link to={lessonsPath}>Voltar ao catálogo</Link>
          </Button>
        </PageIntro>
      </>
    )
  }

  return (
    <>
      <title>{`${entry.lesson.title} | Mellow`}</title>
      <LessonPlayer
        {...entry}
        lesson={entry.lesson}
        language={englishCourse.targetLanguage}
        nextLesson={getNextPublishedLesson(englishCourse, entry.lesson.id)}
        key={entry.lesson.id}
      />
    </>
  )
}
