// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { ProgressProvider } from '@/components/progress/progress-provider'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { loadPracticalSituation } from '@/data/phrasebooks/load-phrasebook'
import {
  practicalEnglishPath,
  practicalSituationRoute,
} from '@/data/navigation'
import { PracticalSituationPage } from './practical-situation-page'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function mount(id = 'at-the-hotel') {
  const router = createMemoryRouter(
    [
      { path: practicalEnglishPath, element: <h1>Catálogo</h1> },
      {
        path: practicalSituationRoute,
        HydrateFallback: () => <p role="status">Carregando expressões…</p>,
        loader: ({ params }) => loadPracticalSituation(params.situationId),
        Component: PracticalSituationPage,
      },
    ],
    { initialEntries: [`${practicalEnglishPath}/${id}`] },
  )
  const view = render(
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>,
  )
  return { ...view, user: userEvent.setup() }
}

it('loads a direct detail route and shows available dialogues, simulations and cultural guidance', async () => {
  mount()
  expect(screen.getByText('Carregando expressões…')).toBeTruthy()
  expect(await screen.findByRole('heading', { name: 'No hotel' })).toBeTruthy()
  expect(
    screen.getByRole('heading', { name: 'Expressões essenciais' }),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: /Chegada com reserva/ })).toBeTruthy()
  expect(screen.getByRole('link', { name: /Chegando ao hotel/ })).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Pedindo ajuda na recepção/ }),
  ).toBeTruthy()
  const section = screen
    .getByRole('heading', { name: 'Orientações culturais' })
    .closest('section')!
  expect(
    within(section)
      .getByRole('link', { name: 'Ler orientações culturais' })
      .getAttribute('href'),
  ).toBe('/ingles-na-pratica/at-the-hotel/orientacoes')
})

it('loads the new shopping guide and offers a way back from an invalid identifier', async () => {
  const view = mount('shopping')
  expect(
    await screen.findByRole('heading', { name: 'Fazendo compras' }),
  ).toBeTruthy()
  expect(screen.getByRole('searchbox')).toBeTruthy()
  const simulations = screen.getByRole('region', {
    name: 'Simulações de conversa',
  })
  expect(within(simulations).getAllByRole('link')).toHaveLength(2)
  expect(
    within(simulations).getByText('0 de 2 simulações concluídas'),
  ).toBeTruthy()
  expect(
    within(screen.getByRole('region', { name: 'Diálogos' })).getAllByRole(
      'link',
    ),
  ).toHaveLength(2)
  expect(screen.queryByText('Em breve')).toBeNull()
  view.unmount()
  mount('unknown')
  expect(
    await screen.findByRole('heading', { name: 'Situação não encontrada' }),
  ).toBeTruthy()
  expect(
    screen
      .getByRole('link', { name: 'Voltar às situações' })
      .getAttribute('href'),
  ).toBe(practicalEnglishPath)
})

it('filters expressions, saves and removes a complete phrase, and preserves legacy favorites', async () => {
  const existing = ['en-a-little', 'story-first-trip-ticket']
  localStorage.setItem('mellow:favorite-words', JSON.stringify(existing))
  const view = mount()
  const search = await screen.findByRole('searchbox', {
    name: 'Expressão ou palavra-chave',
  })
  const intent = screen.getByLabelText('Objetivo de comunicação')
  await view.user.selectOptions(intent, 'departure')
  await view.user.type(search, 'CAFE DA MANHA')
  expect(
    screen.getByRole('heading', { name: 'Nenhuma expressão encontrada' }),
  ).toBeTruthy()
  await view.user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(document.activeElement).toBe(search)
  await view.user.type(search, 'horario em que o hotel serve')
  expect(screen.getByText('1 expressão')).toBeTruthy()
  const label = /Favorito.*What time is breakfast/
  const button = screen.getByRole('button', { name: label })
  expect(button.getAttribute('aria-pressed')).toBe('false')
  button.focus()
  await view.user.keyboard('{Enter}')
  expect(button.getAttribute('aria-pressed')).toBe('true')
  expect(
    JSON.parse(localStorage.getItem('mellow:favorite-words') ?? '[]'),
  ).toEqual([...existing, 'practical-at-the-hotel-breakfast-time'])
  view.unmount()

  const restored = mount()
  const existingButton = await screen.findByRole('button', { name: label })
  expect(existingButton.getAttribute('aria-pressed')).toBe('true')
  await restored.user.click(existingButton)
  expect(existingButton.getAttribute('aria-pressed')).toBe('false')
  expect(
    JSON.parse(localStorage.getItem('mellow:favorite-words') ?? '[]'),
  ).toEqual(existing)
})

it('uses the shared speech engine at both speeds and cancels when leaving the phrasebook', async () => {
  const speak = vi.fn()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  const { user } = mount('at-the-airport')
  const name = /Ouvir pronúncia.*Here is my passport/
  await user.click(await screen.findByRole('button', { name }))
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ text: 'Here is my passport.', rate: 1 }),
  )
  expect(screen.getByText('Reproduzindo o áudio.')).toBeTruthy()
  await user.click(
    screen.getByRole('button', {
      name: /Parar pronúncia.*Here is my passport/,
    }),
  )
  expect(cancel).toHaveBeenCalledTimes(1)
  await user.selectOptions(
    screen.getByLabelText('Velocidade da pronúncia'),
    '0.75',
  )
  await user.click(screen.getByRole('button', { name }))
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({ rate: 0.75 }),
  )
  await user.click(screen.getByRole('link', { name: 'Voltar às situações' }))
  expect(cancel).toHaveBeenCalledTimes(2)
})

it('explains unavailable speech without blocking the consultation', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  mount('restaurants-and-coffee-shops')
  expect(
    await screen.findByText(
      'A reprodução de áudio está indisponível neste navegador.',
    ),
  ).toBeTruthy()
  expect(
    screen.getByRole('button', { name: /Ouvir pronúncia.*A table for two/ }),
  ).toHaveProperty('disabled', true)
  expect(
    screen.getByText('Uma mesa para duas pessoas, por favor.'),
  ).toBeTruthy()
})
