// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import {
  getPracticalSimulationPath,
  practicalSimulationRoute,
  practicalSituationRoute,
} from '@/data/navigation'
import { loadSimulation } from '@/data/simulations/load-simulation'
import { PracticalSimulationPage } from './practical-simulation-page'

function mount(situation = 'at-the-airport', scenario = 'flight-check-in') {
  const router = createMemoryRouter(
    [
      {
        path: practicalSimulationRoute,
        HydrateFallback: () => <p>Carregando simulação…</p>,
        loader: ({ params }) =>
          loadSimulation(params.situationId, params.scenarioId),
        Component: PracticalSimulationPage,
      },
      { path: practicalSituationRoute, element: <h1>Catálogo da situação</h1> },
    ],
    { initialEntries: [getPracticalSimulationPath(situation, scenario)] },
  )
  const view = render(<RouterProvider router={router} />)
  return { ...view, user: userEvent.setup() }
}

class Utterance {
  onstart?: () => void
  constructor(public text: string) {}
}

function stubSpeech() {
  const voices = ['US A', 'US B'].map((name) => ({
    name,
    voiceURI: name,
    lang: 'en-US',
  }))
  const speak = vi.fn((utterance: Utterance) => utterance.onstart?.())
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => voices })
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  return { speak, cancel }
}

function stubDialog() {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false
      },
    },
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('hides translations and future messages and plays only requested audio at either rate with a consistent voice per role', async () => {
  const { speak, cancel } = stubSpeech()
  const { user } = mount()
  await user.click(
    await screen.findByRole('button', { name: 'Começar conversa' }),
  )
  expect(speak).not.toHaveBeenCalled()
  expect(screen.queryByText(/Bom dia. Você está/)).toBeNull()
  expect(screen.queryByText(/Can I see your passport/)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Traduções' }))
  expect(screen.getByText(/Bom dia. Você está/)).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Traduções' }))
  await user.click(screen.getByRole('button', { name: /^Ouvir fala/ }))
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({
      text: expect.stringContaining('Good morning'),
      rate: 1,
      voice: expect.objectContaining({ name: 'US B' }),
    }),
  )
  await user.selectOptions(screen.getByLabelText('Velocidade do áudio'), '0.75')
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(
    screen.getByRole('button', { name: 'Confirmar resposta' }),
  ).toHaveProperty('disabled', true)
  const response = screen.getByRole('radio', {
    name: 'My flight number is 205.',
  })
  response.focus()
  await user.keyboard(' ')
  expect(response).toHaveProperty('checked', true)
  expect(screen.queryByText('Resposta adequada')).toBeNull()
  await user.click(
    screen.getByRole('button', { name: /^Ouvir resposta selecionada/ }),
  )
  expect(speak).toHaveBeenLastCalledWith(
    expect.objectContaining({
      text: 'My flight number is 205.',
      rate: 0.75,
      voice: expect.objectContaining({ name: 'US A' }),
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Confirmar resposta' }))
  expect(
    screen.getByText('Resposta adequada').closest('[role=status]'),
  ).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Continuar conversa' }))
  expect(cancel).toHaveBeenCalledTimes(2)
  expect(screen.getByText(/^Flight 205. Can I see your passport/)).toBeTruthy()
  expect(screen.queryByText(/Do you have a bag to check/)).toBeNull()
  await user.click(screen.getByText('Ver falas anteriores'))
  const transcript = screen.getByRole('list', { name: 'Falas em ordem' })
  expect(within(transcript).getByText('My flight number is 205.')).toBeTruthy()
})

it('completes an alternate path through explicit review, displays counts, and saves only existing expression IDs', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  localStorage.setItem('mellow:favorite-words', '["en-a-little"]')
  const previousProgress =
    '{"version":3,"data":{"lessons":{},"dailyStudyMs":{}}}'
  localStorage.setItem('mellow:learner-progress', previousProgress)
  const { user } = mount()
  const tap = (name: string | RegExp) =>
    user.click(screen.getByRole('button', { name }))
  const submit = async (name: string) => {
    await user.click(screen.getByRole('radio', { name }))
    await tap('Confirmar resposta')
  }
  async function answer(name: string) {
    await submit(name)
    await tap('Continuar conversa')
  }

  await user.click(
    await screen.findByRole('button', { name: 'Começar conversa' }),
  )
  expect(screen.getByText(/áudio está indisponível/i)).toBeTruthy()
  await tap('Ver dica')
  await submit('I have a hotel reservation.')
  expect(screen.getByText('Resposta fora do contexto')).toBeTruthy()
  await tap('Tentar novamente')
  expect(
    screen.getByRole('button', { name: 'Confirmar resposta' }),
  ).toHaveProperty('disabled', true)
  await submit('I have a hotel reservation.')
  await tap('Revisar correção')
  await tap(/^Usar esta resposta.*Here is my passport/)
  expect(screen.getByText(/^Thank you. What’s your flight number/)).toBeTruthy()
  await answer('My flight number is 205.')
  await answer('Yes. I’d like to check this bag.')
  await answer('Thank you. What’s my gate?')
  expect(
    screen.getByRole('heading', { name: 'Conversa concluída' }),
  ).toBeTruthy()
  const stats = screen.getByRole('region', { name: 'Conversa concluída' })
  for (const [label, value] of [
    ['Decisões concluídas', '4'],
    ['Tentativas', '5'],
    ['Respostas adequadas na primeira tentativa', '3'],
    ['Dicas usadas', '1'],
    ['Correções revisadas', '1'],
  ]) {
    expect(within(stats).getByText(label).nextElementSibling?.textContent).toBe(
      value,
    )
  }
  const transcript = screen.getByRole('list', { name: 'Falas em ordem' })
  expect(within(transcript).getAllByRole('listitem')).toHaveLength(9)
  expect(
    within(transcript).queryByText('I have a hotel reservation.'),
  ).toBeNull()
  expect(within(transcript).getByText(/Correção revisada/)).toBeTruthy()
  const expressions = screen.getByRole('region', {
    name: 'Expressões para revisar',
  })
  const favorite = within(expressions).getByRole('button', {
    name: /Favorito.*Here is my passport/,
  })
  await user.click(favorite)
  expect(JSON.parse(localStorage.getItem('mellow:favorite-words')!)).toEqual([
    'en-a-little',
    'practical-at-the-airport-passport',
  ])
  expect(
    within(expressions)
      .getByRole('link', { name: /Consultar no guia.*Here is my passport/ })
      .getAttribute('href'),
  ).toContain('#practical-at-the-airport-passport')
  await user.click(favorite)
  expect(JSON.parse(localStorage.getItem('mellow:favorite-words')!)).toEqual([
    'en-a-little',
  ])
  expect(localStorage.getItem('mellow:learner-progress')).toBe(previousProgress)
  expect(localStorage.length).toBe(2)
  await tap('Praticar novamente')
  expect(screen.getByText('Decisões concluídas: 0')).toBeTruthy()
  expect(
    screen.queryByRole('heading', { name: 'Conversa concluída' }),
  ).toBeNull()
})

it('confirms restart and exit, preserves the session when cancelled, and cancels audio on exit', async () => {
  stubDialog()
  const { cancel } = stubSpeech()
  const { user } = mount()
  await user.click(
    await screen.findByRole('button', { name: 'Começar conversa' }),
  )
  await user.click(
    screen.getByRole('radio', { name: 'My flight number is 205.' }),
  )
  await user.click(screen.getByRole('button', { name: 'Reiniciar conversa' }))
  let dialog = screen.getByRole('dialog', { name: 'Reiniciar a sessão?' })
  await user.click(
    within(dialog).getByRole('button', { name: 'Continuar conversa' }),
  )
  expect(
    screen.getByRole('radio', { name: 'My flight number is 205.' }),
  ).toHaveProperty('checked', true)
  await user.click(screen.getByRole('button', { name: 'Reiniciar conversa' }))
  dialog = screen.getByRole('dialog', { name: 'Reiniciar a sessão?' })
  await user.click(
    within(dialog).getByRole('button', { name: 'Confirmar reinício' }),
  )
  expect(
    screen.getByRole('radio', { name: 'My flight number is 205.' }),
  ).toHaveProperty('checked', false)
  await user.click(screen.getByRole('button', { name: /^Ouvir fala/ }))
  await user.click(screen.getByRole('link', { name: 'Voltar à situação' }))
  dialog = screen.getByRole('dialog', { name: 'Sair da sessão?' })
  await user.click(
    within(dialog).getByRole('button', { name: 'Continuar conversa' }),
  )
  expect(cancel).not.toHaveBeenCalled()
  await user.click(screen.getByRole('link', { name: 'Voltar à situação' }))
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Sair da sessão',
    }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Catálogo da situação' }),
  ).toBeTruthy()
  expect(cancel).toHaveBeenCalledTimes(1)
})

it('handles preview-only and invalid routes with helpful navigation', async () => {
  const view = mount('at-the-airport', 'invalid')
  expect(
    await screen.findByRole('heading', { name: 'Simulação não encontrada' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Pedindo direções até o portão/ }),
  ).toBeTruthy()
  view.unmount()
  mount('shopping', 'ask-the-price')
  expect(
    await screen.findByRole('heading', { name: 'Simulação não encontrada' }),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar à situação' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Começar conversa' })).toBeNull()
})
