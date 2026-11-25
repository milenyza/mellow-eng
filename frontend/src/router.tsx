import { createBrowserRouter } from 'react-router'
import {
  accountPages,
  gamesPath,
  gameHistoryRoute,
  memoryGamePath,
  lessonRoute,
  lessonsPath,
  modules,
  storiesPath,
  storyRoute,
  sentenceBuilderPath,
  wordMatchPath,
} from '@/data/navigation'
import { RootLayout } from '@/layouts/root-layout'
import { HomePage } from '@/pages/home-page'
import { LessonPage } from '@/pages/lesson-page'
import { LessonsPage } from '@/pages/lessons-page'
import { ModulePage } from '@/pages/module-page'
import { NotFoundPage } from '@/pages/not-found-page'

const storiesFallback = <p role="status">Carregando histórias…</p>

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: lessonRoute, Component: LessonPage },
      { path: lessonsPath, Component: LessonsPage },
      {
        path: gamesPath,
        hydrateFallbackElement: <p role="status">Carregando jogos…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/games-page')).GamesPage,
        }),
      },
      {
        path: wordMatchPath,
        hydrateFallbackElement: <p role="status">Carregando Word Match…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/word-match-page')).WordMatchPage,
        }),
      },
      {
        path: sentenceBuilderPath,
        hydrateFallbackElement: (
          <p role="status">Carregando Sentence Builder…</p>
        ),
        lazy: async () => ({
          Component: (await import('@/pages/sentence-builder-page'))
            .SentenceBuilderPage,
        }),
      },
      {
        path: memoryGamePath,
        hydrateFallbackElement: <p role="status">Carregando Memory Game…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/memory-game-page')).MemoryGamePage,
        }),
      },
      {
        path: gameHistoryRoute,
        hydrateFallbackElement: <p role="status">Carregando histórico…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/game-history-page'))
            .GameHistoryPage,
        }),
      },
      {
        path: storiesPath,
        hydrateFallbackElement: storiesFallback,
        lazy: async () => ({
          Component: (await import('@/pages/stories-page')).StoriesPage,
        }),
      },
      {
        path: storyRoute,
        hydrateFallbackElement: storiesFallback,
        lazy: async () => ({
          Component: (await import('@/pages/story-page')).StoryPage,
        }),
      },
      ...[...modules, ...accountPages]
        .filter(
          ({ path }) =>
            path !== lessonsPath && path !== storiesPath && path !== gamesPath,
        )
        .map(({ path, title, description }) => ({
          path,
          element: <ModulePage title={title} description={description} />,
        })),
      { path: '*', Component: NotFoundPage },
    ],
  },
])
