import {
  BookOpen,
  ChartNoAxesCombined,
  Gamepad2,
  GraduationCap,
  House,
  MessagesSquare,
  NotebookPen,
  Settings,
  UserRound,
} from 'lucide-react'

export const home = {
  path: '/',
  title: 'Início',
  icon: House,
}

export const storiesPath = '/historias'
export const storyRoute = `${storiesPath}/:storyId/:chapterId?`

export function getStoryPath(storyId: string, chapterId?: string) {
  const path = `${storiesPath}/${encodeURIComponent(storyId)}`
  return chapterId ? `${path}/${encodeURIComponent(chapterId)}` : path
}

export const lessonsPath = '/aulas'
export const gamesPath = '/jogos'
export const practicalEnglishPath = '/ingles-na-pratica'
export const practicalSituationRoute = `${practicalEnglishPath}/:situationId`
export const practicalDialogueRoute = `${practicalSituationRoute}/dialogos/:dialogueId`

export const practicalSimulationRoute = `${practicalSituationRoute}/simulacoes/:scenarioId`

export function getPracticalSimulationPath(
  situationId: string,
  scenarioId: string,
) {
  return `${getPracticalSituationPath(situationId)}/simulacoes/${encodeURIComponent(scenarioId)}`
}

export function getPracticalSituationPath(situationId: string) {
  return `${practicalEnglishPath}/${encodeURIComponent(situationId)}`
}
export function getPracticalDialoguePath(
  situationId: string,
  dialogueId: string,
) {
  return `${getPracticalSituationPath(situationId)}/dialogos/${encodeURIComponent(dialogueId)}`
}

export const gameHistoryPath = `${gamesPath}/historico`
export const gameHistoryRoute = `${gameHistoryPath}/:sessionId?`
export function getGameSessionPath(sessionId: string) {
  return `${gameHistoryPath}/${encodeURIComponent(sessionId)}`
}
export const sentenceBuilderPath = `${gamesPath}/sentence-builder`
export const memoryGamePath = `${gamesPath}/memory-game`
export const wordMatchPath = `${gamesPath}/word-match`
export const lessonRoute = `${lessonsPath}/:lessonId`

export function getLessonPath(id: string) {
  return `${lessonsPath}/${encodeURIComponent(id)}`
}

export const modules = [
  {
    path: lessonsPath,
    title: 'Aulas',
    icon: GraduationCap,
    description:
      'O espaço para dar os primeiros passos no inglês e praticar no seu ritmo.',
  },
  {
    path: storiesPath,
    title: 'Histórias',
    icon: BookOpen,
    description:
      'O espaço para descobrir palavras e expressões em histórias curtas em inglês.',
  },
  {
    path: gamesPath,
    title: 'Jogos',
    icon: Gamepad2,
    description:
      'O espaço para praticar inglês com desafios leves e interativos.',
  },
  {
    path: practicalEnglishPath,
    title: 'Inglês na prática',
    icon: MessagesSquare,
    description:
      'O espaço para ensaiar conversas em inglês em situações do dia a dia.',
  },
  {
    path: '/meu-caderno',
    title: 'Meu caderno',
    icon: NotebookPen,
    description:
      'Seu espaço para reunir palavras e expressões que você quer lembrar.',
  },
  {
    path: '/meu-progresso',
    title: 'Meu progresso',
    icon: ChartNoAxesCombined,
    description:
      'O espaço para acompanhar seu percurso e reconhecer o que você já aprendeu.',
  },
]

export const accountPages = [
  {
    path: '/perfil',
    title: 'Perfil',
    icon: UserRound,
    description:
      'Seu espaço para consultar e personalizar as informações do perfil.',
  },
  {
    path: '/configuracoes',
    title: 'Configurações',
    icon: Settings,
    description: 'O espaço para ajustar suas preferências de uso do Mellow.',
  },
]

export const primaryNavigation = [home, ...modules.slice(0, 3)]
export const moreNavigation = [...modules.slice(3), ...accountPages]
