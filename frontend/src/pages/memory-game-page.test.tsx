// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { StrictMode } from 'react'
import { progressStorageKey } from '@/services/progress-repository'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { gamesPath, memoryGamePath } from '@/data/navigation'
import { MemoryGamePage } from './memory-game-page'

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99999)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false
    },
  })
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mount() {
  const router = createMemoryRouter(
    [
      { path: memoryGamePath, Component: MemoryGamePage },
      { path: gamesPath, element: <h1>Jogos</h1> },
    ],
    { initialEntries: [memoryGamePath] },
  )
  render(
    <StrictMode>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </StrictMode>,
  )
  return userEvent.setup()
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const cards = () =>
  within(
    screen.getByRole('list', { name: 'Cartas do tabuleiro' }),
  ).getAllByRole('button')

it('offers only playable configurations and explains when saved words are insufficient', async () => {
  localStorage.setItem('mellow:favorite-words', '["story-first-trip-ticket"]')
  const user = mount()
  const source = screen.getByLabelText('Fonte de vocabulário')
  await user.selectOptions(source, 'saved')
  expect(screen.getByRole('status').textContent).toContain(
    'salve mais expressões',
  )
  expect(screen.queryByRole('button', { name: /pares/ })).toBeNull()
  await user.selectOptions(source, 'stories')
  expect(screen.getByText('8 cartas')).toBeTruthy()
  expect(screen.getByText('12 cartas')).toBeTruthy()
  expect(screen.getByText('16 cartas')).toBeTruthy()
  await user.click(button('Difícil · 8 pares'))
  expect(cards()).toHaveLength(16)
})

it('conceals vocabulary, supports keyboard reveals and requires explicit mismatch dismissal', async () => {
  const user = mount()
  await user.click(button('Fácil · 4 pares'))
  expect(document.activeElement).toBe(
    screen.getByRole('heading', { name: 'Encontre os pares' }),
  )
  const first = button('Carta 1 Virada para baixo')
  expect(cards()).toHaveLength(8)
  expect(screen.queryByText('Hello')).toBeNull()
  expect(first.querySelector('[lang]')).toBeNull()
  first.focus()
  await user.keyboard('{Enter}')
  expect(first.querySelector('[lang="en"]')?.textContent).toBe('Hello')
  await user.keyboard('{Enter}')
  expect(screen.getByText('Tentativas: 0')).toBeTruthy()
  await user.click(button('Carta 3 Virada para baixo'))
  expect(button('Virar cartas e continuar')).toBe(document.activeElement)
  expect(screen.getByRole('status').textContent).toContain('não formam um par')
  expect(cards().filter((card) => card.querySelector('[lang]'))).toHaveLength(2)
  expect(
    cards().every((card) => card.getAttribute('aria-disabled') === 'true'),
  ).toBe(true)
  await user.click(cards()[1])
  expect(screen.getByText('Tentativas: 1')).toBeTruthy()
  await user.keyboard('{Enter}')
  expect(button('Carta 3 Virada para baixo')).toBe(document.activeElement)
  expect(cards().every((card) => !card.querySelector('[lang]'))).toBe(true)
  await user.click(cards()[1])
  await user.click(cards()[0])
  expect(
    screen
      .getByText('Par encontrado! Você pode virar outra carta.')
      .getAttribute('role'),
  ).toBe('status')
  expect(cards()[0].textContent).toContain('Par encontrado')
  expect(cards()[1].textContent).toContain('Par encontrado')
  expect(cards()[0].getAttribute('aria-disabled')).toBe('true')
  await user.click(cards()[0])
  expect(screen.getByText('Tentativas: 2')).toBeTruthy()
})

it('finishes a board and reuses vocabulary review, on-demand simulated audio and the active timer', async () => {
  const speak = vi.fn()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  let time = 10000
  vi.spyOn(Date, 'now').mockImplementation(() => time)
  const user = mount()
  await user.selectOptions(
    screen.getByLabelText('Fonte de vocabulário'),
    'stories',
  )
  await user.click(button('Fácil · 4 pares'))
  await user.click(cards()[0])
  await user.click(cards()[1])
  expect(speak).not.toHaveBeenCalled()
  await user.click(screen.getByText('Revisar pares encontrados'))
  expect(screen.getByText('Está chovendo hoje de manhã.')).toBeTruthy()
  expect(screen.getByText('/ˈreɪ.nɪŋ/')).toBeTruthy()
  await user.click(button(/Ouvir pronúncia.*raining/))
  expect(speak).toHaveBeenCalledWith(
    expect.objectContaining({ text: 'raining' }),
  )

  time = 12000
  act(() => window.dispatchEvent(new Event('blur')))
  time = 72000
  act(() => window.dispatchEvent(new Event('focus')))
  time = 75000
  for (let index = 2; index < 8; index++) await user.click(cards()[index])
  const persisted = JSON.parse(localStorage.getItem(progressStorageKey) ?? '{}')
  expect(Object.values(persisted.data.gameSessions)).toMatchObject([
    { gameId: 'memory-game', totalPairs: 4, activeMs: 5000 },
  ])
  await user.click(button('Ver resumo'))
  expect(JSON.parse(localStorage.getItem(progressStorageKey) ?? '{}')).toEqual(
    persisted,
  )
  expect(cancel).toHaveBeenCalled()
  expect(
    screen.getByRole('heading', { name: 'Você encontrou todos os pares!' }),
  ).toBe(document.activeElement)
  expect(screen.getByText('4 de 4')).toBeTruthy()
  expect(screen.getByText('5 s')).toBeTruthy()
  expect(screen.getByText('4')).toBeTruthy()
  const practiced = screen.getByRole('region', {
    name: 'Vocabulário praticado',
  })
  expect(
    within(practiced).getByText('raining', { selector: 'li' }),
  ).toBeTruthy()
  await user.click(screen.getByText('Revisar significados e pronúncia'))
  await user.click(button(/Ouvir pronúncia.*raining/))
  await user.click(button('Jogar novamente'))
  expect(cancel).toHaveBeenCalledTimes(2)
  expect(screen.getByLabelText('Fonte de vocabulário')).toHaveProperty(
    'value',
    'stories',
  )
})

it('keeps the board when confirmation is cancelled, resets on restart and confirms navigation', async () => {
  const user = mount()
  await user.click(button('Médio · 6 pares'))
  await user.click(cards()[0])
  await user.click(button('Reiniciar sessão'))
  await user.click(button('Continuar jogando'))
  expect(cards()[0].querySelector('[lang]')).toBeTruthy()
  await user.click(button('Reiniciar sessão'))
  await user.click(button('Confirmar reinício'))
  expect(cards()).toHaveLength(12)
  expect(cards().every((card) => !card.querySelector('[lang]'))).toBe(true)
  await user.click(screen.getByRole('link', { name: 'Voltar aos jogos' }))
  expect(screen.getByRole('dialog', { name: 'Sair da sessão?' })).toBeTruthy()
  await user.click(button('Sair da sessão'))
  expect(screen.getByRole('heading', { name: 'Jogos' })).toBeTruthy()
  expect(localStorage.getItem(progressStorageKey)).toBeNull()
})
