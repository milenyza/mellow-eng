// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { progressStorageKey } from '@/services/progress-repository'
import { GamesPage } from './games-page'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

it('displays status and metadata and provides distinct keyboard-focusable game previews', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ProgressProvider>
        <GamesPage />
      </ProgressProvider>
    </MemoryRouter>,
  )

  const cards = screen.getAllByRole('article')
  expect(cards).toHaveLength(3)
  expect(screen.getAllByRole('link', { name: /Jogar/ })).toHaveLength(3)
  expect(
    screen.getByRole('link', { name: 'Jogar Word Match' }).getAttribute('href'),
  ).toBe('/jogos/word-match')
  expect(screen.queryByRole('button', { name: /jogar|iniciar/i })).toBeNull()

  for (const [card, name, minutes] of [
    [cards[0], 'Word Match', '3 min'],
    [cards[1], 'Sentence Builder', '5 min'],
    [cards[2], 'Memory Game', '6 min'],
  ] as const) {
    const section = within(card)
    expect(section.getByRole('heading', { name }).lang).toBe('en')
    expect(section.getByText('Disponível')).toBeTruthy()
    expect(section.getByText('CEFR A1')).toBeTruthy()
    expect(section.getByText(minutes)).toBeTruthy()
    expect(section.getByText('Fácil, Médio e Difícil')).toBeTruthy()
    expect(card.querySelector('img')?.getAttribute('alt')).toBe('')
    const disclosure = section.getByText('Como funciona')
    const details = disclosure.closest('details')
    expect(disclosure.textContent).toContain(name)
    expect(details?.open).toBe(false)
    await user.tab()
    expect(document.activeElement).toBe(disclosure)
    await user.click(disclosure)
    expect(details?.open).toBe(true)
    expect(section.getAllByRole('list')).toHaveLength(2)
    await user.click(disclosure)
    expect(details?.open).toBe(false)
    await user.tab()
    expect(document.activeElement).toBe(
      section.getByRole('link', { name: `Jogar ${name}` }),
    )
  }
})

it('opens the existing games URL through the real navigation and preserves stored data', async () => {
  const routeWait = { timeout: 4000 }
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  const progress =
    '{"version":2,"data":{"lessons":{},"dailyStudyMs":{"2025-01-01":2000},"reading":{"stories":{},"preferences":{"fontSize":"large","translations":true}}}}'
  const savedWords = '["en-a-little"]'
  localStorage.setItem(progressStorageKey, progress)
  localStorage.setItem('mellow:favorite-words', savedWords)
  window.history.replaceState(null, '', '/jogos')

  const { router } = await import('@/router')
  render(
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>,
  )
  expect(
    await screen.findByRole(
      'heading',
      { name: 'Jogos para praticar inglês' },
      routeWait,
    ),
  ).toBeTruthy()

  const user = userEvent.setup()
  const sidebar = screen.getByRole('complementary')
  const gamesLink = within(sidebar).getByRole('link', { name: 'Jogos' })
  expect(gamesLink.getAttribute('aria-current')).toBe('page')
  await user.click(within(sidebar).getByRole('link', { name: 'Histórias' }))
  expect(
    await screen.findByRole('heading', { name: 'The First Trip' }, routeWait),
  ).toBeTruthy()
  await user.click(within(sidebar).getByRole('link', { name: 'Aulas' }))
  expect(window.location.pathname).toBe('/aulas')
  await user.click(gamesLink)
  expect(
    await screen.findByRole('heading', { name: 'Word Match' }, routeWait),
  ).toBeTruthy()
  expect(window.location.pathname).toBe('/jogos')
  await user.click(screen.getByRole('link', { name: 'Jogar Word Match' }))
  expect(
    await screen.findByRole(
      'heading',
      { name: 'Prepare sua sessão' },
      routeWait,
    ),
  ).toBeTruthy()
  expect(window.location.pathname).toBe('/jogos/word-match')
  expect(gamesLink.getAttribute('aria-current')).toBe('page')
  await user.click(gamesLink)
  await user.click(
    await screen.findByRole(
      'link',
      { name: 'Jogar Sentence Builder' },
      routeWait,
    ),
  )
  expect(
    await screen.findByRole(
      'heading',
      { name: 'Prepare sua sessão' },
      routeWait,
    ),
  ).toBeTruthy()
  expect(window.location.pathname).toBe('/jogos/sentence-builder')
  expect(gamesLink.getAttribute('aria-current')).toBe('page')
  await user.click(gamesLink)
  await user.click(
    await screen.findByRole('link', { name: 'Jogar Memory Game' }, routeWait),
  )
  expect(
    await screen.findByRole(
      'heading',
      { name: 'Prepare sua sessão' },
      routeWait,
    ),
  ).toBeTruthy()
  expect(window.location.pathname).toBe('/jogos/memory-game')
  expect(gamesLink.getAttribute('aria-current')).toBe('page')
  expect(localStorage.getItem(progressStorageKey)).toBe(progress)
  expect(localStorage.getItem('mellow:favorite-words')).toBe(savedWords)
}, 10000)
