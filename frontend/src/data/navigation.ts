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

export const modules = [
  {
    path: '/aulas',
    title: 'Aulas',
    icon: GraduationCap,
    description:
      'O espaço para dar os primeiros passos no inglês e praticar no seu ritmo.',
  },
  {
    path: '/historias',
    title: 'Histórias',
    icon: BookOpen,
    description:
      'O espaço para descobrir palavras e expressões em histórias curtas em inglês.',
  },
  {
    path: '/jogos',
    title: 'Jogos',
    icon: Gamepad2,
    description:
      'O espaço para praticar inglês com desafios leves e interativos.',
  },
  {
    path: '/ingles-na-pratica',
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
