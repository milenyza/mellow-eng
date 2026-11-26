// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
  act,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { loadCulturalGuidance } from '@/data/cultural-guidance/load-cultural-guidance'
import {
  getPracticalGuidancePath,
  practicalGuidanceRoute,
  practicalSituationRoute,
} from '@/data/navigation'
import { PracticalGuidancePage } from './practical-guidance-page'

function mount(situation = 'at-the-airport', hash = '') {
  const router = createMemoryRouter(
    [
      {
        path: practicalGuidanceRoute,
        HydrateFallback: () => <p role="status">Carregando orientações…</p>,
        loader: ({ params }) => loadCulturalGuidance(params.situationId),
        Component: PracticalGuidancePage,
      },
      { path: practicalSituationRoute, element: <h1>Situação</h1> },
    ],
    { initialEntries: [getPracticalGuidancePath(situation) + hash] },
  )
  const view = render(<RouterProvider router={router} />)
  return { ...view, user: userEvent.setup() }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('opens a direct guidance link, focuses the chosen article and reuses the phrasebook favorite ID', async () => {
  localStorage.setItem(
    'mellow:favorite-words',
    '["en-a-little","practical-at-the-airport-repeat"]',
  )
  const { user } = mount('at-the-airport', '#repeat-flight-information')
  const article = await screen.findByRole('article', {
    name: 'Pedir para ouvir de novo',
  })
  await waitFor(() => expect(document.activeElement).toBe(article))
  const favorite = within(article).getByRole('button', {
    name: /Favorito.*Could you say that again/,
  })
  expect(favorite.getAttribute('aria-pressed')).toBe('true')
  await user.click(favorite)
  expect(localStorage.getItem('mellow:favorite-words')).toBe('["en-a-little"]')
  await user.click(favorite)
  expect(localStorage.getItem('mellow:favorite-words')).toBe(
    '["en-a-little","practical-at-the-airport-repeat"]',
  )
  expect(
    within(article)
      .getByRole('link', { name: /No guia.*Could you say that again/ })
      .getAttribute('href'),
  ).toContain('#practical-at-the-airport-repeat')
  expect(
    within(article)
      .getByRole('link', { name: /Diálogo.*Onde fica o portão/ })
      .getAttribute('href'),
  ).toContain('/dialogos/boarding-gate')
  expect(
    within(article)
      .getByRole('link', { name: /Simulação.*Pedindo direções/ })
      .getAttribute('href'),
  ).toContain('/simulacoes/find-the-gate')
  expect(localStorage.getItem('mellow:learner-progress')).toBeNull()
})

it('requests locale-aware playback, reacts to errors and cancels on replacement and exit', async () => {
  class MockUtterance {
    onerror?: () => void
    constructor(public text: string) {}
  }
  const speak = vi.fn<(utterance: MockUtterance) => void>()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
  const { user } = mount()
  const regional = await screen.findByRole('article', {
    name: 'Ler as placas de retirada de bagagem',
  })
  expect(within(regional).getByText('Inglês britânico')).toBeTruthy()
  const american = within(regional).getByRole('button', {
    name: /Ouvir.*baggage claim/,
  })
  const british = within(regional).getByRole('button', {
    name: /Ouvir.*baggage reclaim/,
  })
  await user.click(american)
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ lang: 'en-US', rate: 1 }),
  )
  await user.click(british)
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ lang: 'en-GB' }),
  )
  act(() => speak.mock.calls[1][0].onerror?.())
  expect(screen.getByText(/Não foi possível reproduzir/)).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Velocidade do áudio'), '0.75')
  await user.click(british)
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ rate: 0.75 }),
  )
  await user.click(screen.getByRole('link', { name: 'Voltar à situação' }))
  expect(cancel).toHaveBeenCalledTimes(2)
})

it('offers the bilingual content without audio and handles unknown situations', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  const view = mount('meeting-people')
  const article = await screen.findByRole('article', {
    name: 'Escolher o que compartilhar',
  })
  expect(screen.getByText(/áudio está indisponível/)).toBeTruthy()
  expect(within(article).getByText('Prefiro não dizer.')).toBeTruthy()
  expect(
    within(article).getByRole('button', { name: /Ouvir.*rather not say/ }),
  ).toHaveProperty('disabled', true)
  view.unmount()
  mount('unknown')
  expect(
    await screen.findByRole('heading', { name: 'Orientações indisponíveis' }),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar às situações' })).toBeTruthy()
})
