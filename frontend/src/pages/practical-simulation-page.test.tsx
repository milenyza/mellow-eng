// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { ProgressProvider } from '@/components/progress/progress-provider'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import {
  getPracticalSimulationPath,
  practicalSimulationRoute,
  practicalSituationRoute,
} from '@/data/navigation'
import { loadPracticalSituation } from '@/data/phrasebooks/load-phrasebook'
import { parseProgress } from '@/services/progress-format'
import { progressStorageKey } from '@/services/progress-repository'
import { selectSimulationHistory } from '@/services/simulation-progress'
import { PracticalSituationPage } from './practical-situation-page'
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
      {
        path: practicalSituationRoute,
        HydrateFallback: () => <p>Carregando situação…</p>,
        loader: ({ params }) => loadPracticalSituation(params.situationId),
        Component: PracticalSituationPage,
      },
    ],
    { initialEntries: [getPracticalSimulationPath(situation, scenario)] },
  )
  const view = render(
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>,
  )
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
  const first = mount()
  const { user } = first
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
    ['Acertos', '3'],
    ['Erros', '2'],
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
  const stored = parseProgress(localStorage.getItem(progressStorageKey))!
  const history = selectSimulationHistory(
    stored,
    'at-the-airport',
    'flight-check-in',
  )
  expect(history).toHaveLength(1)
  expect(history[0].attempts.map(({ fit }) => fit)).toEqual([
    'context',
    'context',
    'appropriate',
    'appropriate',
    'appropriate',
  ])
  expect(history[0].completedAt).toBeGreaterThanOrEqual(history[0].startedAt)
  expect(stored.lessons).toEqual({})
  expect(stored.dailyStudyMs).toEqual({})
  expect(localStorage.length).toBe(2)
  await tap('Praticar novamente')
  expect(screen.getByText('Decisões concluídas: 0')).toBeTruthy()
  expect(
    screen.queryByRole('heading', { name: 'Conversa concluída' }),
  ).toBeNull()
  await answer('My flight number is 205.')
  await answer('Here is my passport.')
  await answer('Yes. I’d like to check this bag.')
  await answer('Thank you. What’s my gate?')
  const repeated = selectSimulationHistory(
    parseProgress(localStorage.getItem(progressStorageKey))!,
    'at-the-airport',
  )
  expect(repeated).toHaveLength(2)
  expect(repeated[0].attempts).toHaveLength(4)
  expect(repeated[1]).toEqual(history[0])
  first.unmount()

  const restored = mount()
  const historySection = await screen.findByRole('region', {
    name: 'Histórico de sessões',
  })
  const completedTime = within(historySection)
    .getByText(/Última realização/)
    .querySelector('time')
  expect(completedTime?.dateTime).toBe(
    new Date(repeated[0].completedAt).toISOString(),
  )
  await restored.user.click(
    within(historySection).getByText('Ver sessões concluídas (2)'),
  )
  const entries = within(historySection).getAllByRole('listitem')
  expect(entries[0].textContent).toContain('Tentativas4Acertos4Erros0')
  expect(entries[1].textContent).toContain('Tentativas5Acertos3Erros2')

  await restored.user.click(
    screen.getByRole('link', { name: 'Voltar à situação' }),
  )
  expect(await screen.findByText('1 de 2 simulações concluídas')).toBeTruthy()
  expect(
    screen.getByRole('link', {
      name: /Check-in para o voo.*Concluída.*Última prática/,
    }),
  ).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Pedindo direções.*Ainda não concluída/ }),
  ).toBeTruthy()
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
    await screen.findByRole('heading', { name: 'No aeroporto' }),
  ).toBeTruthy()
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem(progressStorageKey)).toBeNull()
})

it('handles cross-situation and invalid routes with helpful navigation', async () => {
  const view = mount('at-the-airport', 'invalid')
  expect(
    await screen.findByRole('heading', { name: 'Simulação não encontrada' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Pedindo direções até o portão/ }),
  ).toBeTruthy()
  view.unmount()
  mount('shopping', 'flight-check-in')
  expect(
    await screen.findByRole('heading', { name: 'Simulação não encontrada' }),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar à situação' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Começar conversa' })).toBeNull()
})

it('completes a newly published shopping branch and restores history and linked vocabulary', async () => {
  const first = mount('shopping', 'ask-the-price')
  const { user } = first
  await user.click(
    await screen.findByRole('button', { name: 'Começar conversa' }),
  )
  expect(screen.queryByText('Oi. Posso ajudar?')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Traduções' }))
  expect(screen.getByText('Oi. Posso ajudar?')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Traduções' }))
  async function submit(text: string) {
    await user.click(screen.getByRole('radio', { name: text }))
    await user.click(screen.getByRole('button', { name: 'Confirmar resposta' }))
  }
  async function answer(text: string) {
    await submit(text)
    await user.click(screen.getByRole('button', { name: 'Continuar conversa' }))
  }
  await user.click(screen.getByRole('button', { name: 'Ver dica' }))
  await submit('How much this is?')
  expect(screen.getByText('Ajuste de inglês')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  await answer('Is this on sale?')
  expect(screen.getByText(/^This one isn’t on sale/)).toBeTruthy()
  await answer('Can I see a small notebook, please?')
  await answer('Yes, I’ll take it.')
  await answer('Can I have a receipt, please?')
  expect(
    screen.getByRole('heading', { name: 'Conversa concluída' }),
  ).toBeTruthy()
  const favorite = screen.getByRole('button', {
    name: /Favorito.*Can I have a receipt/,
  })
  await user.click(favorite)
  expect(JSON.parse(localStorage.getItem('mellow:favorite-words')!)).toContain(
    'practical-shopping-receipt',
  )
  first.unmount()
  mount('shopping', 'ask-the-price')
  expect(
    await screen.findByRole('heading', { name: 'Histórico de sessões' }),
  ).toBeTruthy()
  expect(screen.getByText('Ver sessões concluídas (1)')).toBeTruthy()
})
