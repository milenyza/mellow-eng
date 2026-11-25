import { StoryLibrary } from '@/components/stories/story-library'
import { useProgress } from '@/hooks/use-progress'
import { getReadingProgress } from '@/services/reading-progress'
import { stories } from '@/data/stories'

export function StoriesPage() {
  const { data } = useProgress()
  return (
    <>
      <title>Histórias | Mellow</title>
      <div className="space-y-7">
        <header className="border-t border-plum/20 pt-7 sm:pt-8">
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Biblioteca de histórias
          </h1>
          <p className="mt-3 max-w-prose text-lg leading-relaxed">
            Leia histórias curtas em inglês no seu ritmo. Escolha uma leitura
            disponível ou explore os próximos roteiros.
          </p>
        </header>
        <StoryLibrary
          stories={stories}
          progress={getReadingProgress(data).stories}
        />
      </div>
    </>
  )
}
