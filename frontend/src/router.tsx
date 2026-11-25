import { createBrowserRouter } from 'react-router'
import {
  accountPages,
  lessonRoute,
  lessonsPath,
  modules,
  storiesPath,
  storyRoute,
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
        .filter(({ path }) => path !== lessonsPath && path !== storiesPath)
        .map(({ path, title, description }) => ({
          path,
          element: <ModulePage title={title} description={description} />,
        })),
      { path: '*', Component: NotFoundPage },
    ],
  },
])
