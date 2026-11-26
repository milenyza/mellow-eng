import { englishA1Index } from '@/data/curriculum/english-a1-index'
import { gameTitle } from '@/data/game-labels'
import {
  getFlashcardHistoryPath,
  getGameSessionPath,
  getLessonPath,
  getPracticalSimulationPath,
  getStoryPath,
} from '@/data/navigation'
import { simulationSummaries } from '@/data/simulations'
import { storyIndex } from '@/data/story-index'
import type { RecordedActivity } from '@/types/activity-history'

const lessons = new Map(
  englishA1Index.units.flatMap(({ lessons }) =>
    lessons.map((lesson) => [lesson.id, lesson] as const),
  ),
)
const stories = new Map(storyIndex.map((story) => [story.id, story]))
const simulations = new Map(
  simulationSummaries.map((scenario) => [
    JSON.stringify([scenario.situationId, scenario.id]),
    scenario,
  ]),
)

interface ActivityDescription {
  label: string
  title?: string
  context?: string
  language?: 'en'
  destination?: { to: string; label: string }
}

export function describeActivity(event: RecordedActivity): ActivityDescription {
  const { contentId } = event
  switch (event.kind) {
    case 'lesson': {
      const lesson = lessons.get(contentId)
      return {
        label:
          event.classification === 'milestone'
            ? 'Aula concluída'
            : 'Aula praticada novamente',
        title: lesson?.title,
        language: 'en',
        destination:
          lesson?.availability === 'available'
            ? { to: getLessonPath(contentId), label: 'Abrir aula' }
            : undefined,
      }
    }
    case 'story': {
      const story = stories.get(contentId)
      return {
        label: 'História concluída',
        title: story?.title,
        language: 'en',
        destination:
          story?.publication === 'available'
            ? { to: getStoryPath(contentId), label: 'Abrir história' }
            : undefined,
      }
    }
    case 'chapter': {
      const story = stories.get(event.parentId)
      const chapter = story?.chapters.find(({ id }) => id === contentId)
      return {
        label: 'Capítulo marcado como lido',
        title: chapter?.title,
        context: story?.title,
        language: 'en',
        destination:
          story?.publication === 'available' && chapter
            ? {
                to: getStoryPath(story.id, chapter.id),
                label: 'Abrir capítulo',
              }
            : undefined,
      }
    }
    case 'game':
      return {
        label: 'Jogo concluído',
        title: gameTitle(event.contentId),
        language: 'en',
        destination: {
          to: getGameSessionPath(event.sessionId),
          label: 'Ver resultado do jogo',
        },
      }
    case 'simulation': {
      const scenario = simulations.get(
        JSON.stringify([event.parentId, contentId]),
      )
      return {
        label: 'Simulação concluída',
        title: scenario?.title,
        destination: scenario
          ? {
              to: getPracticalSimulationPath(event.parentId, contentId),
              label: 'Abrir simulação e histórico',
            }
          : undefined,
      }
    }
    case 'flashcard':
      return {
        label: 'Revisão com cartões concluída',
        destination: {
          to: getFlashcardHistoryPath(event.sessionId),
          label: 'Ver revisão com cartões',
        },
      }
  }
}
