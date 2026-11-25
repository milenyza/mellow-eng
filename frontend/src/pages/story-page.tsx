import { Link, useParams } from 'react-router'
import { PageIntro } from '@/components/page-intro'
import { StoryCard } from '@/components/stories/story-card'
import { StoryReader } from '@/components/stories/story-reader'
import { Button } from '@/components/ui/button'
import { getStoryPath, storiesPath } from '@/data/navigation'
import { stories } from '@/data/stories'

export function StoryPage() {
  const { storyId, chapterId } = useParams()
  const story = stories.find(({ id }) => id === storyId)
  const chapterIndex = chapterId
    ? (story?.chapters.findIndex(({ id }) => id === chapterId) ?? -1)
    : 0

  if (story?.publication === 'available' && chapterIndex >= 0) {
    return (
      <>
        <title>{`${story.chapters[chapterIndex].title} | Mellow`}</title>
        <StoryReader key={story.id} story={story} chapterIndex={chapterIndex} />
      </>
    )
  }

  const heading = !story
    ? 'História não encontrada'
    : chapterIndex < 0
      ? 'Capítulo não encontrado'
      : 'História em breve'
  const description = !story
    ? 'Confira o endereço ou escolha uma história na biblioteca.'
    : chapterIndex < 0
      ? 'Este capítulo não faz parte da história. Você pode voltar à biblioteca ou abrir o primeiro capítulo, quando disponível.'
      : 'O roteiro está disponível para consulta. Os capítulos ainda estão em preparação.'

  return (
    <>
      <title>{`${heading} | Mellow`}</title>
      <PageIntro title={heading} description={description}>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to={storiesPath}>Voltar à biblioteca</Link>
          </Button>
          {story?.publication === 'available' && (
            <Button variant="secondary" asChild>
              <Link to={getStoryPath(story.id)}>Abrir primeiro capítulo</Link>
            </Button>
          )}
        </div>
        {story?.publication === 'planned' && (
          <div className="mt-6 max-w-sm">
            <StoryCard story={story} />
          </div>
        )}
      </PageIntro>
    </>
  )
}
