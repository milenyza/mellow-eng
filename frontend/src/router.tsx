import { createBrowserRouter } from 'react-router'
import {
  accountPages,
  gamesPath,
  flashcardsPath,
  flashcardHistoryRoute,
  gameHistoryRoute,
  memoryGamePath,
  lessonRoute,
  lessonsPath,
  modules,
  notebookPath,
  activityHistoryPath,
  learningProgressPath,
  practicalEnglishPath,
  practicalSituationRoute,
  practicalDialogueRoute,
  practicalGuidanceRoute,
  practicalSimulationRoute,
  storiesPath,
  storyRoute,
  sentenceBuilderPath,
  wordMatchPath,
} from '@/data/navigation'
import { RootLayout } from '@/layouts/root-layout'
import { HomePage } from '@/pages/home-page'
import { ModulePage } from '@/pages/module-page'
import { NotFoundPage } from '@/pages/not-found-page'

const storiesFallback = <p role="status">Carregando histórias…</p>

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: lessonRoute,
        hydrateFallbackElement: <p role="status">Carregando aula…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/lesson-page')).LessonPage,
        }),
      },
      {
        path: lessonsPath,
        hydrateFallbackElement: <p role="status">Carregando aulas…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/lessons-page')).LessonsPage,
        }),
      },
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
      {
        path: practicalEnglishPath,
        hydrateFallbackElement: <p role="status">Carregando situações…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/practical-english-page'))
            .PracticalEnglishPage,
        }),
      },
      {
        path: practicalSituationRoute,
        hydrateFallbackElement: <p role="status">Carregando expressões…</p>,
        loader: async ({ params }) =>
          (
            await import('@/data/phrasebooks/load-phrasebook')
          ).loadPracticalSituation(params.situationId),
        lazy: async () => ({
          Component: (await import('@/pages/practical-situation-page'))
            .PracticalSituationPage,
        }),
      },
      {
        path: practicalDialogueRoute,
        hydrateFallbackElement: <p role="status">Carregando diálogo…</p>,
        loader: async ({ params }) =>
          (
            await import('@/data/dialogues/load-dialogue')
          ).loadPracticalDialogue(params.situationId, params.dialogueId),
        lazy: async () => ({
          Component: (await import('@/pages/practical-dialogue-page'))
            .PracticalDialoguePage,
        }),
      },
      {
        path: practicalSimulationRoute,
        hydrateFallbackElement: <p role="status">Carregando simulação…</p>,
        loader: async ({ params }) =>
          (await import('@/data/simulations/load-simulation')).loadSimulation(
            params.situationId,
            params.scenarioId,
          ),
        lazy: async () => ({
          Component: (await import('@/pages/practical-simulation-page'))
            .PracticalSimulationPage,
        }),
      },
      {
        path: practicalGuidanceRoute,
        hydrateFallbackElement: <p role="status">Carregando orientações…</p>,
        loader: async ({ params }) =>
          (
            await import('@/data/cultural-guidance/load-cultural-guidance')
          ).loadCulturalGuidance(params.situationId),
        lazy: async () => ({
          Component: (await import('@/pages/practical-guidance-page'))
            .PracticalGuidancePage,
        }),
      },
      {
        path: notebookPath,
        hydrateFallbackElement: <p role="status">Carregando o caderno…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/notebook-page')).NotebookPage,
        }),
      },
      {
        path: flashcardsPath,
        hydrateFallbackElement: <p role="status">Carregando cartões…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/flashcards-page')).FlashcardsPage,
        }),
      },
      {
        path: flashcardHistoryRoute,
        hydrateFallbackElement: (
          <p role="status">Carregando histórico de cartões…</p>
        ),
        lazy: async () => ({
          Component: (await import('@/pages/flashcard-history-page'))
            .FlashcardHistoryPage,
        }),
      },
      {
        path: learningProgressPath,
        hydrateFallbackElement: <p role="status">Carregando seu progresso…</p>,
        lazy: async () => ({
          Component: (await import('@/pages/learning-progress-page'))
            .LearningProgressPage,
        }),
      },
      {
        path: activityHistoryPath,
        hydrateFallbackElement: (
          <p role="status">Carregando histórico de atividades…</p>
        ),
        lazy: async () => ({
          Component: (await import('@/pages/activity-history-page'))
            .ActivityHistoryPage,
        }),
      },
      ...[...modules, ...accountPages]
        .filter(
          ({ path }) =>
            path !== lessonsPath &&
            path !== storiesPath &&
            path !== gamesPath &&
            path !== practicalEnglishPath &&
            path !== notebookPath &&
            path !== learningProgressPath,
        )
        .map(({ path, title, description }) => ({
          path,
          element: <ModulePage title={title} description={description} />,
        })),
      { path: '*', Component: NotFoundPage },
    ],
  },
])
