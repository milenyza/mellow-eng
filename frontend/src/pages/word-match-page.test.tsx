// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { StrictMode } from 'react'
import { progressStorageKey } from '@/services/progress-repository'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { wordMatchPath } from '@/data/navigation'
import { WordMatchPage } from './word-match-page'

beforeEach(() => {
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
  vi.unstubAllGlobals()
})

function mount() {
  const router = createMemoryRouter(
    [
      { path: wordMatchPath, Component: WordMatchPage },
      { path: '/jogos', element: <h1>Jogos</h1> },
    ],
    { initialEntries: [wordMatchPath] },
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

const savedPairs = [
  ['ticket', 'Passagem / Bilhete'],
  ['platform', 'Plataforma'],
  ['turn left', 'Vire à esquerda'],
  ['a little', 'um pouco'],
]

function saveFour() {
  localStorage.setItem(
    'mellow:favorite-words',
    JSON.stringify([
      'story-first-trip-ticket',
      'story-first-trip-platform',
      'story-first-trip-turn-left',
      'en-a-little',
    ]),
  )
}

it('shows an empty favorite source and offers only suitable difficulties', async () => {
  const user = mount()
  const source = screen.getByLabelText('Fonte de vocabulário')
  await user.selectOptions(source, 'saved')
  expect(screen.getByRole('status').textContent).toContain(
    'salve mais expressões',
  )
  expect(screen.queryByRole('button', { name: /pares/ })).toBeNull()
  await user.selectOptions(source, 'stories')
  expect(screen.getByRole('button', { name: 'Difícil · 8 pares' })).toBeTruthy()
})

it('plays three rounds, announces retries, reviews with simulated speech and shows accurate results', async () => {
  saveFour()
  const speak = vi.fn()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  const user = mount()
  await user.selectOptions(
    screen.getByLabelText('Fonte de vocabulário'),
    'saved',
  )
  expect(screen.queryByRole('button', { name: /Médio|Difícil/ })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Fácil · 4 pares' }))
  expect(document.activeElement).toBe(
    screen.getByRole('heading', { name: 'Rodada 1 de 3' }),
  )

  const english = () => within(screen.getByRole('region', { name: 'Inglês' }))
  const portuguese = () =>
    within(screen.getByRole('region', { name: 'Português' }))
  const ticket = english().getByRole('button', { name: 'ticket' })
  const wrong = portuguese().getByRole('button', { name: 'Plataforma' })
  wrong.focus()
  await user.keyboard(' ')
  expect(wrong.getAttribute('aria-pressed')).toBe('true')
  ticket.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByText(/Esses cartões não formam/)).toBeTruthy()
  expect(screen.getByText('Tentativas na sessão: 1')).toBeTruthy()
  expect(speak).not.toHaveBeenCalled()

  for (let index = 0; index < 3; index++) {
    for (const [term, translation] of savedPairs) {
      await user.click(english().getByRole('button', { name: term }))
      await user.click(portuguese().getByRole('button', { name: translation }))
      expect(screen.getByText('Nice match!')).toBeTruthy()
      expect(
        english()
          .getByRole('button', { name: new RegExp(term + ' Par formado') })
          .getAttribute('aria-disabled'),
      ).toBe('true')
      if (index === 0 && term === 'ticket') {
        await user.click(screen.getByText('Revisar'))
        await user.click(
          screen.getByRole('button', { name: /Ouvir pronúncia.*ticket/ }),
        )
        expect(speak).toHaveBeenCalledWith(
          expect.objectContaining({ text: 'ticket' }),
        )
      }
    }
    if (index === 2) {
      const saved = JSON.parse(localStorage.getItem(progressStorageKey) ?? '{}')
      expect(Object.values(saved.data.gameSessions)).toMatchObject([
        { gameId: 'word-match', answeredCount: 13 },
      ])
    }
    await user.click(
      screen.getByRole('button', {
        name: index === 2 ? 'Ver resultados' : 'Próxima rodada',
      }),
    )
  }
  expect(cancel).toHaveBeenCalled()
  expect(
    Object.keys(
      JSON.parse(localStorage.getItem(progressStorageKey) ?? '{}').data
        .gameSessions,
    ),
  ).toHaveLength(1)
  expect(screen.getByRole('heading', { name: /Sessão concluída/ })).toBeTruthy()
  expect(screen.getByText('13')).toBeTruthy()
  expect(screen.getByText('10 de 12')).toBeTruthy()
  expect(
    within(
      screen.getByRole('region', { name: 'Palavras que vale rever' }),
    ).getAllByRole('listitem'),
  ).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: 'Jogar novamente' }))
  expect(
    screen.getByRole('heading', { name: 'Prepare sua sessão' }),
  ).toBeTruthy()
  expect(screen.getByLabelText('Fonte de vocabulário')).toHaveProperty(
    'value',
    'saved',
  )
}, 10000)

it('asks before restarting or leaving and resets the round only after confirmation', async () => {
  const user = mount()
  await user.click(screen.getByRole('button', { name: 'Fácil · 4 pares' }))
  const first = within(
    screen.getByRole('region', { name: 'Inglês' }),
  ).getAllByRole('button')[0]
  await user.click(first)
  await user.click(screen.getByRole('button', { name: 'Reiniciar sessão' }))
  await user.click(screen.getByRole('button', { name: 'Continuar jogando' }))
  expect(first.getAttribute('aria-pressed')).toBe('true')
  await user.click(screen.getByRole('button', { name: 'Reiniciar sessão' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar reinício' }))
  expect(screen.getByText('Tentativas na sessão: 0')).toBeTruthy()
  expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
  await user.click(screen.getByRole('link', { name: 'Voltar aos jogos' }))
  expect(screen.getByRole('dialog', { name: 'Sair da sessão?' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Sair da sessão' }))
  expect(await screen.findByRole('heading', { name: 'Jogos' })).toBeTruthy()
})
