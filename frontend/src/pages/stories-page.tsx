import { StoryLibrary } from '@/components/stories/story-library'
import { stories } from '@/data/stories'

export function StoriesPage() {
  return (
    <>
      <title>Histórias | Mellow</title>
      <div className="space-y-7">
        <header className="border-t border-plum/20 pt-7 sm:pt-8">
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Biblioteca de histórias
          </h1>
          <p className="mt-3 max-w-prose text-lg leading-relaxed">
            Explore roteiros de histórias curtas em inglês. Conheça os
            personagens e os capítulos planejados para cada nível.
          </p>
        </header>
        <StoryLibrary stories={stories} />
      </div>
    </>
  )
}
