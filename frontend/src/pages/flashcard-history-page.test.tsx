// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import {
  flashcardHistoryPath,
  flashcardHistoryRoute,
  flashcardsPath,
  notebookPath,
  memoryGamePath,
  wordMatchPath,
} from '@/data/navigation'
import { recordFlashcardSession } from '@/services/flashcard-history'
import { emptyProgress, serializeProgress } from '@/services/progress-format'
import { addDailyTime } from '@/services/study-time'
import type { FlashcardResult } from '@/types/flashcards'
import { FlashcardHistoryPage } from './flashcard-history-page'
import { FlashcardsPage } from './flashcards-page'
import { HomePage } from './home-page'
import { NotebookPage } from './notebook-page'
import { MemoryGamePage } from './memory-game-page'
import { WordMatchPage } from './word-match-page'

const ticket = 'story-first-trip-ticket'
const daily = 'en-a-little'
const missing = 'unknown-reference'
const progressKey = 'mellow:learner-progress'
const favoritesKey = 'mellow:favorite-words'

function mount(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/', Component: HomePage },
      { path: flashcardHistoryRoute, Component: FlashcardHistoryPage },
      { path: flashcardsPath, Component: FlashcardsPage },
      { path: notebookPath, Component: NotebookPage },
      { path: wordMatchPath, Component: WordMatchPage },
      { path: memoryGamePath, Component: MemoryGamePage },
    ],
    { initialEntries: [path] },
  )
  const user = userEvent.setup()
  return {
    ...render(
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>,
    ),
    user,
    router,
  }
}

function seed() {
  const completedAt = Date.now()
  const startedAt = Math.max(
    new Date().setHours(0, 0, 0, 0),
    completedAt - 2000,
  )
  const result: FlashcardResult = {
    sessionId: 'initial',
    startedAt,
    completedAt,
    activeMs: completedAt - startedAt,
    configuration: {
      direction: 'en-pt',
      length: 'all',
      scope: 'saved',
      filters: { query: '', source: '', type: '', level: '' },
    },
    observations: [
      { vocabularyId: ticket, direction: 'en-pt', rating: 'effort' },
      { vocabularyId: daily, direction: 'en-pt', rating: 'forgot' },
      { vocabularyId: missing, direction: 'en-pt', rating: 'easy' },
    ],
  }
  const data = recordFlashcardSession(
    emptyProgress(),
    result,
    addDailyTime({}, startedAt, completedAt),
  )
  const saved = serializeProgress(
    recordFlashcardSession(
      data,
      {
        ...result,
        sessionId: 'another',
        configuration: { ...result.configuration, direction: 'mixed' },
        observations: [
          { vocabularyId: ticket, direction: 'pt-en', rating: 'effort' },
        ],
      },
      addDailyTime({}, startedAt, completedAt),
    ),
  )
  localStorage.setItem(progressKey, saved)
  localStorage.setItem(favoritesKey, JSON.stringify([ticket]))
  return saved
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

it('restores and filters history, resolves removed and unavailable references, and replays the currently saved subset', async () => {
  const before = seed()
  const { user, router } = mount(flashcardHistoryPath)
  const history = screen.getByRole('list', {
    name: 'Sessões da mais recente à mais antiga',
  })
  expect(within(history).getAllByRole('listitem')).toHaveLength(2)
  await user.selectOptions(
    screen.getByLabelText('Filtrar por direção'),
    'en-pt',
  )
  await user.click(
    within(history).getByRole('link', { name: /Inglês para português/ }),
  )
  expect(await screen.findByRole('link', { name: 'a little' })).toBeTruthy()
  expect(screen.getAllByText('Fora dos favoritos atuais')).toHaveLength(2)
  expect(
    screen.getByText(/Referência unknown-reference · Conteúdo indisponível/),
  ).toBeTruthy()
  expect(
    screen.getByRole('region', { name: 'Itens que custaram a lembrar' }),
  ).toBeTruthy()
  await user.click(
    screen.getByRole('link', { name: 'Revisar favoritos desta sessão' }),
  )
  expect(await screen.findByText('1 cartão disponível')).toBeTruthy()
  expect(router.state.location.search).toBe('?revisao=initial')
  expect(localStorage.getItem(progressKey)).toBe(before)
})

it('shows unique Dashboard activity, keeps unsaved suggestions separate and configures existing games using saved vocabulary', async () => {
  const before = seed()
  const first = mount('/')
  const summary = screen.getByRole('region', { name: 'Atividade com cartões' })
  expect(
    within(summary).getByText('Sessões concluídas').nextElementSibling
      ?.textContent,
  ).toBe('2')
  expect(
    within(summary).getByText('Itens distintos revisados').nextElementSibling
      ?.textContent,
  ).toBe('3')
  expect(within(summary).getByRole('listitem')).toBeTruthy()
  if (JSON.parse(before).data.flashcardSessions.initial.activeMs > 0)
    expect(
      document.querySelector('li[aria-current="date"]')?.textContent,
    ).toContain('estudado')
  first.unmount()

  const { user, router } = mount(notebookPath)
  const suggested = screen.getByRole('region', { name: 'Revisão sugerida' })
  await within(suggested).findByRole('heading', {
    name: 'Outros conteúdos para praticar',
  })
  expect(
    within(suggested).getByRole('heading', { name: 'Nos seus favoritos' }),
  ).toBeTruthy()
  expect(JSON.parse(localStorage.getItem(favoritesKey)!)).toEqual([ticket])
  await user.click(
    within(suggested).getByRole('button', {
      name: /Salvar nos favoritos.*a little/,
    }),
  )
  expect(JSON.parse(localStorage.getItem(favoritesKey)!)).toEqual([
    ticket,
    daily,
  ])
  await user.click(
    await within(suggested).findByRole('link', {
      name: 'Revisar favoritos sugeridos',
    }),
  )
  expect(await screen.findByText('2 cartões disponíveis')).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Voltar ao caderno' }))
  await user.click(await screen.findByRole('link', { name: 'Memory Game' }))
  expect(screen.getByLabelText('Fonte de vocabulário')).toHaveProperty(
    'value',
    'saved',
  )
  expect(screen.getByRole('status').textContent).toContain('pelo menos 4')
  await act(async () => await router.navigate(notebookPath))
  await user.click(await screen.findByRole('link', { name: 'Word Match' }))
  expect(screen.getByLabelText('Fonte de vocabulário')).toHaveProperty(
    'value',
    'saved',
  )
  expect(screen.getByRole('status').textContent).toContain('pelo menos 4')
  expect(localStorage.getItem(progressKey)).toBe(before)
})
