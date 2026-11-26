// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { loadPracticalDialogue } from '@/data/dialogues/load-dialogue'
import {
  getPracticalDialoguePath,
  practicalDialogueRoute,
  practicalSituationRoute,
} from '@/data/navigation'
import { PracticalDialoguePage } from './practical-dialogue-page'

function mount(id = 'flight-check-in') {
  const router = createMemoryRouter(
    [
      {
        path: practicalDialogueRoute,
        HydrateFallback: () => <p role="status">Carregando diálogo…</p>,
        loader: ({ params }) =>
          loadPracticalDialogue(params.situationId, params.dialogueId),
        Component: PracticalDialoguePage,
      },
      { path: practicalSituationRoute, element: <h1>Catálogo da situação</h1> },
    ],
    { initialEntries: [getPracticalDialoguePath('at-the-airport', id)] },
  )
  const view = render(<RouterProvider router={router} />)
  return { ...view, user: userEvent.setup() }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

class Utterance {
  onstart?: () => void
  onend?: () => void
  onerror?: () => void
  constructor(public text: string) {}
}

function stubSpeech() {
  const utterances: Utterance[] = []
  const speak = vi.fn((utterance: Utterance) => {
    utterances.push(utterance)
    utterance.onstart?.()
  })
  const cancel = vi.fn()
  const native = {
    paused: false,
    speak,
    cancel,
    getVoices: () => [],
    pause() {
      this.paused = true
    },
    resume() {
      this.paused = false
    },
  }
  vi.stubGlobal('speechSynthesis', native)
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  return { utterances, speak, cancel }
}

it('loads a direct dialogue link and lets individuals override global translation visibility', async () => {
  const { user } = mount()
  expect(screen.getByText('Carregando diálogo…')).toBeTruthy()
  expect(
    await screen.findByRole('heading', { name: 'Check-in para o voo' }),
  ).toBeTruthy()
  const first = screen.getByRole('button', {
    name: 'Mostrar tradução da fala 1',
  })
  const translation = document.getElementById(
    first.getAttribute('aria-controls')!,
  )!
  expect(translation.hidden).toBe(true)
  first.focus()
  await user.keyboard('{Enter}')
  expect(translation.hidden).toBe(false)
  expect(first.getAttribute('aria-expanded')).toBe('true')
  await user.click(
    screen.getByRole('button', { name: 'Mostrar todas as traduções' }),
  )
  expect(
    screen.getAllByRole('button', { name: /Ocultar tradução da fala/ }),
  ).toHaveLength(10)
  await user.click(
    screen.getByRole('button', { name: 'Ocultar todas as traduções' }),
  )
  expect(translation.hidden).toBe(true)
  await user.click(screen.getByRole('link', { name: /Onde fica o portão/ }))
  expect(
    await screen.findByRole('heading', { name: 'Onde fica o portão?' }),
  ).toBeTruthy()
  expect(
    screen.getAllByRole('button', { name: /Mostrar tradução da fala/ }),
  ).toHaveLength(10)
})

it('narrates in order, highlights active turns, pauses and cancels when another playback or route takes over', async () => {
  const { utterances, speak, cancel } = stubSpeech()
  const { user } = mount()
  const full = await screen.findByRole('button', {
    name: 'Ouvir diálogo completo',
  })
  await user.selectOptions(
    screen.getByLabelText('Velocidade da narração'),
    '0.75',
  )
  await user.click(full)
  expect(speak).toHaveBeenCalledTimes(1)
  expect(utterances[0]).toMatchObject({ rate: 0.75 })
  expect(
    screen.getByText('Em reprodução').closest('li')?.textContent,
  ).toContain('Can I check in here?')
  await user.click(screen.getByRole('button', { name: 'Pausar áudio' }))
  expect(screen.getByText('Áudio pausado.')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Continuar áudio' }))
  act(() => utterances[0].onend?.())
  expect(
    screen.getByText('Em reprodução').closest('li')?.textContent,
  ).toContain('Where are you flying today?')
  await user.click(screen.getByRole('button', { name: /Ouvir fala 4/ }))
  expect(cancel).toHaveBeenCalledTimes(1)
  act(() => utterances[1].onend?.())
  expect(speak).toHaveBeenCalledTimes(3)
  act(() => utterances[2].onerror?.())
  expect(screen.getByText(/Não foi possível reproduzir/)).toBeTruthy()
  await user.click(full)
  await user.click(screen.getByRole('link', { name: /Onde fica o portão/ }))
  expect(
    await screen.findByRole('heading', { name: 'Onde fica o portão?' }),
  ).toBeTruthy()
  expect(cancel).toHaveBeenCalledTimes(2)
})

it('saves the authentic phrasebook ID and offers its source link without replacing existing favorites', async () => {
  localStorage.setItem('mellow:favorite-words', '["en-a-little"]')
  const { user } = mount()
  const expressions = await screen.findByRole('region', {
    name: 'Expressões do diálogo',
  })
  const favorite = within(expressions).getByRole('button', {
    name: /Favorito.*Here is my passport/,
  })
  await user.click(favorite)
  expect(favorite.getAttribute('aria-pressed')).toBe('true')
  expect(
    JSON.parse(localStorage.getItem('mellow:favorite-words') ?? '[]'),
  ).toEqual(['en-a-little', 'practical-at-the-airport-passport'])
  expect(
    within(expressions)
      .getByRole('link', { name: /Consultar no guia.*Here is my passport/ })
      .getAttribute('href'),
  ).toBe('/ingles-na-pratica/at-the-airport#practical-at-the-airport-passport')
  await user.click(favorite)
  expect(
    JSON.parse(localStorage.getItem('mellow:favorite-words') ?? '[]'),
  ).toEqual(['en-a-little'])
})

it('keeps dialogue reading available without speech synthesis and reports invalid routes', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  const first = mount()
  expect(await screen.findByText(/áudio está indisponível/)).toBeTruthy()
  expect(
    screen.getByRole('button', { name: 'Ouvir diálogo completo' }),
  ).toHaveProperty('disabled', true)
  first.unmount()
  mount('unknown')
  expect(
    await screen.findByRole('heading', { name: 'Diálogo não encontrado' }),
  ).toBeTruthy()
})
