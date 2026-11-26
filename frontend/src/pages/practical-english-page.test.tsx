// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { practicalEnglishPath } from '@/data/navigation'
import { serializeProgress } from '@/services/progress-format'
import {
  createLocalProgressRepository,
  progressStorageKey,
} from '@/services/progress-repository'
import { PracticalEnglishPage } from './practical-english-page'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

it('announces search results, combines category and search, and returns focus on reset', async () => {
  const user = userEvent.setup()
  render(<PracticalEnglishPage />, { wrapper: MemoryRouter })
  expect(screen.getByRole('status').textContent).toBe('8 situações')

  const search = screen.getByRole('searchbox', {
    name: 'Título ou palavra-chave',
  })
  const category = screen.getByLabelText('Categoria')
  await user.type(search, 'cafe cardapio')
  expect(screen.getByRole('status').textContent).toBe('1 situação')
  expect(
    screen.getByRole('heading', { name: 'Restaurantes e cafeterias' }),
  ).toBeTruthy()
  await user.selectOptions(category, 'shopping')
  expect(screen.getByRole('status').textContent).toBe('0 situações')
  expect(
    screen.getByRole('heading', { name: 'Nenhuma situação encontrada' }),
  ).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(document.activeElement).toBe(search)
  expect(category).toHaveProperty('value', '')
  expect(screen.getByRole('status').textContent).toBe('8 situações')
})

it('renders eight illustrated cards with labelled previews and only published phrasebook links', async () => {
  render(<PracticalEnglishPage />, { wrapper: MemoryRouter })
  const user = userEvent.setup()
  const cards = screen.getAllByRole('article')
  expect(cards).toHaveLength(8)
  expect(screen.getAllByText('Em breve')).toHaveLength(5)
  expect(screen.getAllByText('Expressões disponíveis')).toHaveLength(3)
  expect(screen.getAllByText('Nível A1')).toHaveLength(8)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.getAllByRole('link')).toHaveLength(3)
  expect(
    screen
      .getByRole('link', { name: 'Consultar expressões de No aeroporto' })
      .getAttribute('href'),
  ).toBe('/ingles-na-pratica/at-the-airport')
  const images = cards.map((card) => card.querySelector('img'))
  expect(new Set(images.map((image) => image?.getAttribute('src'))).size).toBe(
    8,
  )
  expect(images.every((image) => image?.getAttribute('alt') === '')).toBe(true)
  const airport = within(cards[0])
  expect(airport.getByText('At the airport').lang).toBe('en')
  expect(
    airport.getByRole('list', { name: 'Objetivos de aprendizagem' }),
  ).toBeTruthy()
  const preview = airport
    .getByText('Ver prévia', { exact: false })
    .closest('summary')!
  expect(preview.textContent).toContain('de No aeroporto')
  const details = preview.closest('details')
  expect(details?.open).toBe(false)
  await user.tab()
  await user.tab()
  await user.tab()
  expect(document.activeElement).toBe(airport.getByRole('link'))
  await user.tab()
  expect(document.activeElement).toBe(preview)
  await user.click(preview)
  expect(details?.open).toBe(true)
  expect(airport.getByText('Em busca do portão')).toBeTruthy()
  expect(airport.getByText(/Confirmar o horário de embarque./)).toBeTruthy()
  await user.click(preview)
  expect(details?.open).toBe(false)
})

it('loads the catalog through the real Dashboard and keeps learner records byte-for-byte intact', async () => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  const data = serializeProgress({
    lessons: {
      'en-a1-introductions-hello': {
        run: {
          id: 'lesson-run',
          startedAt: 12000,
          blockId: 'introduction',
          visitedBlockIds: ['introduction'],
          activities: {},
          activeMs: 1000,
        },
      },
    },
    dailyStudyMs: { '2026-11-25': 3000 },
    reading: {
      preferences: { fontSize: 'large', translations: true },
      stories: {
        'a-rainy-morning': {
          readChapterIds: [],
          activeMs: 2000,
          run: {
            id: 'story-run',
            chapterId: 'rain-at-the-window',
            startedAt: 13000,
            activeMs: 2000,
            chapters: {},
          },
        },
      },
    },
    gameSessions: {
      'saved-game': {
        sessionId: 'saved-game',
        gameId: 'memory-game',
        level: 'A1',
        difficulty: 'easy',
        outcome: 'completed',
        source: 'stories',
        startedAt: 11000,
        endedAt: 14000,
        activeMs: 2000,
        dailyPracticeMs: { '2026-11-25': 2000 },
        answeredCount: 4,
        correctCount: 4,
        totalPairs: 4,
        incorrectAttempts: 0,
        vocabularyIds: [
          'story-rainy-morning-raining',
          'story-rainy-morning-umbrella',
          'story-first-trip-ticket',
          'story-first-trip-platform',
        ],
      },
    },
  })
  const favorites = '["en-a-little","story-first-trip-ticket"]'
  localStorage.setItem(progressStorageKey, data)
  localStorage.setItem('mellow:favorite-words', favorites)
  window.history.replaceState(null, '', '/')
  const repository = createLocalProgressRepository()
  const snapshot = repository.getSnapshot()
  expect(snapshot.data.gameSessions?.['saved-game']).toBeTruthy()

  const { router } = await import('@/router')
  render(
    <ProgressProvider repository={repository}>
      <RouterProvider router={router} />
    </ProgressProvider>,
  )
  const user = userEvent.setup()
  const routeWait = { timeout: 4000 }
  const main = within(screen.getByRole('main'))
  await user.click(main.getByRole('link', { name: /Inglês na prática/ }))
  expect(
    await main.findByRole('heading', { name: 'Inglês na prática' }, routeWait),
  ).toBeTruthy()
  expect(window.location.pathname).toBe(practicalEnglishPath)
  const sidebar = within(screen.getByRole('complementary'))
  expect(
    sidebar
      .getByRole('link', { name: 'Inglês na prática' })
      .getAttribute('aria-current'),
  ).toBe('page')
  await user.selectOptions(main.getByLabelText('Categoria'), 'hotel')
  await user.click(main.getByText('Ver prévia', { exact: false }))
  expect(main.getByText('Chegada à recepção')).toBeTruthy()
  await user.click(
    main.getByRole('link', { name: 'Consultar expressões de No hotel' }),
  )
  expect(
    await main.findByRole(
      'heading',
      { name: 'Expressões essenciais' },
      routeWait,
    ),
  ).toBeTruthy()
  expect(window.location.pathname).toBe('/ingles-na-pratica/at-the-hotel')
  expect(
    sidebar
      .getByRole('link', { name: 'Inglês na prática' })
      .getAttribute('aria-current'),
  ).toBe('page')
  await user.click(sidebar.getByRole('link', { name: 'Histórias' }))
  expect(
    await main.findByRole(
      'heading',
      { name: 'Biblioteca de histórias' },
      routeWait,
    ),
  ).toBeTruthy()
  await user.click(sidebar.getByRole('link', { name: 'Inglês na prática' }))
  expect(
    await main.findByRole('heading', { name: 'No aeroporto' }, routeWait),
  ).toBeTruthy()
  expect(localStorage.getItem(progressStorageKey)).toBe(data)
  expect(localStorage.getItem('mellow:favorite-words')).toBe(favorites)
  expect(repository.getSnapshot()).toBe(snapshot)
}, 10000)
