// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import { ProgressProvider } from '@/components/progress/progress-provider'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { DailyWord } from '@/components/dashboard/daily-word'
import { dailyWord } from '@/data/dashboard'
import {
  favoriteWordsKey,
  getFavoriteWordsSnapshot,
  setWordFavorite,
} from '@/services/word-favorites'
import { NotebookPage } from './notebook-page'

const practical = 'practical-shopping-receipt'
const story = 'story-first-trip-ticket'
const daily = dailyWord.id

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('shows empty guidance, then reflects a favorite saved from the Dashboard and removes it without touching progress', async () => {
  localStorage.setItem(
    'mellow:learner-progress',
    '{"version":4,"data":{"lessons":{},"dailyStudyMs":{}}}',
  )
  const progress = localStorage.getItem('mellow:learner-progress')
  const user = userEvent.setup()
  render(
    <ProgressProvider>
      <DailyWord entry={dailyWord} />
      <NotebookPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
  expect(
    screen.getByRole('heading', { name: 'O caderno está vazio' }),
  ).toBeTruthy()
  const dashboard = screen.getByRole('region', { name: 'Palavra do dia' })
  await user.click(
    within(dashboard).getByRole('button', { name: 'Salvar nos favoritos' }),
  )
  const card = await screen.findByRole('article', { name: 'a little' })
  expect(getFavoriteWordsSnapshot().savedAt[daily]).toBeGreaterThan(0)
  await user.click(
    within(card).getByRole('button', { name: /Remover dos favoritos/ }),
  )
  expect(
    within(dashboard).getByRole('button', { name: 'Salvar nos favoritos' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('heading', { name: 'O caderno está vazio' }),
  ).toBeTruthy()
  expect(document.activeElement).toBe(
    screen.getByRole('heading', { name: 'Meu caderno' }),
  )
  expect(localStorage.getItem('mellow:learner-progress')).toBe(progress)
})

it('filters and sorts legacy and new favorites, keeps unresolved entries and expands contextual examples', async () => {
  localStorage.setItem(
    favoriteWordsKey,
    JSON.stringify([story, daily, 'old-missing', daily]),
  )
  setWordFavorite(practical, true)
  vi.stubGlobal('speechSynthesis', undefined)
  const user = userEvent.setup()
  render(
    <ProgressProvider>
      <NotebookPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
  expect(screen.getByText('4 itens salvos')).toBeTruthy()
  expect(
    await screen.findByRole('heading', { name: 'Itens indisponíveis' }),
  ).toBeTruthy()
  const card = screen.getByRole('article', { name: 'ticket' })
  const detail = within(card).getByText(/Ver contexto/)
  expect(detail.closest('details')?.open).toBe(false)
  await user.click(detail)
  expect(detail.closest('details')?.open).toBe(true)
  expect(within(card).getByText('Tenho uma passagem de trem.')).toBeTruthy()
  expect(within(card).queryByText('Salvo em')).toBeNull()
  expect(
    within(card).getByRole('button', { name: /Ouvir pronúncia/ }),
  ).toHaveProperty('disabled', true)
  await user.selectOptions(screen.getByLabelText('Ordenar por'), 'recent')
  expect(screen.getAllByRole('article')[0].textContent).toContain('receipt')
  await user.selectOptions(screen.getByLabelText('Origem'), 'story')
  await user.selectOptions(screen.getByLabelText('Tipo de conteúdo'), 'word')
  await user.selectOptions(screen.getByLabelText('Nível'), 'A1')
  const input = screen.getByRole('searchbox')
  await user.type(input, 'BILHETE')
  expect(screen.getAllByRole('article')).toEqual([card])
  await user.type(input, ' inválido')
  expect(
    screen.getByRole('heading', { name: 'Nenhum item corresponde à busca' }),
  ).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(document.activeElement).toBe(input)
  await user.click(
    screen.getByRole('button', { name: /Remover item.*old-missing/ }),
  )
  expect(JSON.parse(localStorage.getItem(favoriteWordsKey)!)).toEqual([
    story,
    daily,
    practical,
  ])
})

it('reflects storage events and cancels pronunciation on replacement and route exit', async () => {
  const speak = vi.fn()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  localStorage.setItem(favoriteWordsKey, JSON.stringify([daily]))
  const user = userEvent.setup()
  const view = render(
    <ProgressProvider>
      <NotebookPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
  const first = await screen.findByRole('button', {
    name: /Ouvir pronúncia.*a little/,
  })
  expect(
    screen.getByRole('option', { name: 'Salvos recentemente' }),
  ).toHaveProperty('disabled', true)
  act(() => {
    localStorage.setItem(favoriteWordsKey, JSON.stringify([daily, story]))
    window.dispatchEvent(new StorageEvent('storage', { key: favoriteWordsKey }))
  })
  const second = await screen.findByRole('button', {
    name: /Ouvir pronúncia.*ticket/,
  })
  await user.selectOptions(screen.getByLabelText('Velocidade do áudio'), '0.75')
  await user.click(first)
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ text: 'a little', rate: 0.75 }),
  )
  await user.click(second)
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ text: 'ticket', rate: 0.75 }),
  )
  expect(cancel).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(cancel).toHaveBeenCalledTimes(2)
})
