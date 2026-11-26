// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { progressStorageKey } from '@/services/progress-repository'
import { ActivityHistoryPage } from './activity-history-page'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})

function openHistory() {
  render(
    <ProgressProvider>
      <ActivityHistoryPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
}

it('provides clear empty, filter and return actions', () => {
  openHistory()
  expect(
    screen.getByRole('heading', { name: 'Histórico de atividades' }),
  ).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('Nenhuma atividade')
  expect(
    screen
      .getByRole('link', { name: 'Voltar a Meu progresso' })
      .getAttribute('href'),
  ).toBe('/meu-progresso')
  expect(screen.getByRole('combobox', { name: 'Módulo' })).toBeTruthy()
})

it('supports keyboard pagination, filters, unavailable references and keeps the underlying storage intact', async () => {
  const at = new Date(2026, 10, 26, 12).getTime()
  vi.setSystemTime(at)
  const run = {
    id: 'legacy',
    blockId: 'start',
    startedAt: at - 86_401_000,
    finishedAt: at - 86_400_000,
    visitedBlockIds: [],
    activities: {},
    activeMs: 800,
  }
  const gameSessions = Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const id = `memory-${index}`
      return [
        id,
        {
          sessionId: id,
          gameId: 'memory-game',
          level: 'A1',
          difficulty: 'easy',
          source: 'saved',
          startedAt: at,
          endedAt: at + index,
          activeMs: 0,
          dailyPracticeMs: {},
          outcome: 'completed',
          answeredCount: 2,
          correctCount: 1,
          totalPairs: 1,
          incorrectAttempts: 1,
          vocabularyIds: ['removed-favorite'],
        },
      ]
    }),
  )
  const stored = JSON.stringify({
    version: 5,
    data: {
      lessons: {
        'older-lesson': {
          run,
          completion: { run, completedAt: run.finishedAt },
        },
      },
      dailyStudyMs: {},
      gameSessions,
    },
  })
  localStorage.setItem(progressStorageKey, stored)
  openHistory()
  const user = userEvent.setup()
  expect(screen.getByRole('heading', { name: /^Hoje/ })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toContain('1 a 12 de 13')
  const next = screen.getByRole('button', { name: 'Próxima página' })
  next.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('status').textContent).toContain('13 a 13 de 13')
  expect(document.activeElement).toBe(next)
  expect(screen.getByRole('heading', { name: /^Ontem/ })).toBeTruthy()
  expect(
    screen.getByText('Conteúdo indisponível no catálogo atual.'),
  ).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Abrir aula' })).toBeNull()
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Módulo' }),
    'games',
  )
  expect(screen.getByRole('status').textContent).toContain('1 a 12 de 12')
  expect(
    screen
      .getAllByRole('link', { name: /resultado do jogo/i })[0]
      .getAttribute('href'),
  ).toBe('/jogos/historico/memory-11')
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Período de estudo' }),
    'custom',
  )
  fireEvent.change(screen.getByLabelText('Data inicial'), {
    target: { value: '2026-11-26' },
  })
  fireEvent.change(screen.getByLabelText('Data final'), {
    target: { value: '2026-11-25' },
  })
  await user.click(screen.getByRole('button', { name: 'Aplicar período' }))
  expect(screen.getByRole('alert').textContent).toContain('Confira as datas')
  fireEvent.change(screen.getByLabelText('Data inicial'), {
    target: { value: '2026-11-25' },
  })
  await user.click(screen.getByRole('button', { name: 'Aplicar período' }))
  expect(screen.getByRole('status').textContent).toContain('Nenhuma atividade')
  expect(localStorage.getItem(progressStorageKey)).toBe(stored)
})
