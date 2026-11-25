// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import {
  gameHistoryPath,
  gameHistoryRoute,
  getGameSessionPath,
} from '@/data/navigation'
import { serializeProgress } from '@/services/progress-format'
import {
  createLocalProgressRepository,
  progressStorageKey,
} from '@/services/progress-repository'
import { addDailyTime } from '@/services/study-time'
import type { CompletedGameSession } from '@/types/game-history'
import { GameHistoryPage } from './game-history-page'
import { GamesPage } from './games-page'
import { HomePage } from './home-page'

const now = Date.now()
const wordId = 'story-first-trip-ticket'
const memory = {
  gameId: 'memory-game',
  sessionId: 'memory-1',
  startedAt: now - 4000,
  endedAt: now - 1000,
  level: 'A1',
  difficulty: 'easy',
  outcome: 'completed',
  source: 'stories',
  activeMs: 3000,
  dailyPracticeMs: addDailyTime({}, now - 4000, now - 1000),
  answeredCount: 2,
  correctCount: 1,
  totalPairs: 1,
  incorrectAttempts: 1,
  vocabularyIds: [wordId],
} satisfies CompletedGameSession
const sentence = {
  gameId: 'sentence-builder',
  sessionId: 'sentence-1',
  startedAt: now - 5000,
  endedAt: now - 3000,
  level: 'A1',
  difficulty: 'medium',
  outcome: 'completed',
  topic: 'introductions',
  activeMs: 2000,
  dailyPracticeMs: addDailyTime({}, now - 5000, now - 3000),
  answeredCount: 1,
  correctCount: 0,
  firstAttemptCorrect: 0,
  challenges: [
    { id: 'name-ana', reviewed: true, incorrectAnswers: ['Ana is my name'] },
  ],
} satisfies CompletedGameSession

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function mount(
  path: string,
  repository?: ReturnType<typeof createLocalProgressRepository>,
) {
  return render(
    <ProgressProvider repository={repository}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jogos" element={<GamesPage />} />
          <Route path={gameHistoryRoute} element={<GameHistoryPage />} />
        </Routes>
      </MemoryRouter>
    </ProgressProvider>,
  )
}

it('shows a helpful empty state and handles a missing session URL', () => {
  const first = mount(gameHistoryPath)
  expect(screen.getByText(/ainda não concluiu uma sessão/)).toBeTruthy()
  first.unmount()
  mount(getGameSessionPath('missing'))
  expect(
    screen.getByRole('heading', { name: 'Sessão não encontrada' }),
  ).toBeTruthy()
})

it('filters by game and difficulty, preserves filters on return, and restores sentence details from storage', async () => {
  const user = userEvent.setup()
  localStorage.setItem(
    progressStorageKey,
    serializeProgress({
      lessons: {},
      dailyStudyMs: {},
      gameSessions: { 'memory-1': memory, 'sentence-1': sentence },
    }),
  )
  const view = mount(gameHistoryPath)
  expect(screen.getAllByRole('listitem')[0].textContent).toContain(
    'Memory Game',
  )
  await user.selectOptions(screen.getByLabelText('Jogo'), 'sentence-builder')
  await user.selectOptions(screen.getByLabelText('Dificuldade'), 'easy')
  expect(screen.getByText(/Nenhuma sessão corresponde/)).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Dificuldade'), 'medium')
  await user.click(screen.getByRole('link', { name: /Sentence Builder/ }))
  expect(screen.getByText('My name is Ana.')).toBeTruthy()
  expect(screen.getByText('Correção revisada')).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Voltar ao histórico' }))
  expect(screen.getByLabelText('Dificuldade')).toHaveProperty('value', 'medium')
  view.unmount()
  mount(getGameSessionPath('memory-1'))
  expect(screen.getByRole('heading', { name: 'Memory Game' })).toBeTruthy()
  expect(screen.getByText('ticket')).toBeTruthy()
  expect(screen.queryByText('Acertos na primeira tentativa')).toBeNull()
  expect(screen.queryByText('Vale rever este par')).toBeNull()
})

it('synchronizes game metrics, total time and weekly progress with the shared repository', () => {
  const repository = createLocalProgressRepository()
  mount('/', repository)
  const activity = screen.getByRole('region', { name: 'Prática em jogos' })
  expect(
    within(activity).getByText('Sua primeira sessão concluída aparecerá aqui.'),
  ).toBeTruthy()
  act(() =>
    repository.update((data) => ({
      ...data,
      gameSessions: { 'memory-1': memory },
    })),
  )
  expect(within(activity).getByText('3 s')).toBeTruthy()
  expect(
    within(activity).getByRole('link', { name: /Memory Game/ }),
  ).toBeTruthy()
  expect(screen.getAllByText('3 s')).toHaveLength(2)
  expect(
    within(screen.getByRole('region', { name: 'Progresso semanal' })).getByText(
      /, estudado/,
    ),
  ).toBeTruthy()
})
