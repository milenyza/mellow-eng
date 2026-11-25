// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { StrictMode } from 'react'
import { progressStorageKey } from '@/services/progress-repository'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { sentenceBuilderPath } from '@/data/navigation'
import { SentenceBuilderPage } from './sentence-builder-page'

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
      { path: sentenceBuilderPath, Component: SentenceBuilderPage },
      { path: '/jogos', element: <h1>Jogos</h1> },
    ],
    { initialEntries: [sentenceBuilderPath] },
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

const word = (name: string) =>
  within(screen.getByRole('group', { name: 'Palavras disponíveis' })).getByRole(
    'button',
    { name },
  )
const action = (name: string) => screen.getByRole('button', { name })

it('filters difficulties by topic and starts hard practice with optional extra tiles', async () => {
  const user = mount()
  await user.selectOptions(
    screen.getByLabelText('Tema de gramática'),
    'introductions',
  )
  expect(action('Fácil · 5 desafios')).toBeTruthy()
  expect(
    screen.queryByRole('button', { name: 'Difícil · 10 desafios' }),
  ).toBeNull()
  await user.selectOptions(screen.getByLabelText('Tema de gramática'), 'mixed')
  await user.click(action('Difícil · 10 desafios'))
  expect(screen.getByText('Desafio 1 de 10')).toBeTruthy()
  expect(screen.queryByText('This is my friend Leo from Canada.')).toBeNull()
  for (const tile of ['This', 'is', 'my', 'friend', 'Leo', 'from', 'Canada']) {
    await user.click(word(tile))
  }
  expect(word('are')).toHaveProperty('disabled', true)
  await user.click(action('Conferir resposta'))
  expect(screen.getByText('Resposta correta')).toBeTruthy()
})

it('supports keyboard construction, moving words, undo, clear, retry, correction review, audio and results', async () => {
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
  await user.click(action('Fácil · 5 desafios'))
  expect(document.activeElement?.textContent).toContain('Meu nome é Ana')
  expect(action('Conferir resposta')).toHaveProperty('disabled', true)

  word('My').focus()
  await user.keyboard('{Enter}')
  await user.click(word('is'))
  await user.click(word('name'))
  await user.selectOptions(
    screen.getByLabelText('Palavra para mover'),
    screen.getByRole('option', { name: '3. name' }),
  )
  await user.click(action('Mover antes'))
  const assembled = () =>
    within(screen.getByRole('list', { name: 'Ordem das palavras' }))
  expect(assembled().getAllByRole('listitem')[1].textContent).toContain('name')
  await user.click(action('Limpar frase'))
  expect(screen.queryByRole('list', { name: 'Ordem das palavras' })).toBeNull()
  await user.click(action('Desfazer'))
  expect(assembled().getAllByRole('listitem')).toHaveLength(3)
  await user.click(action('Desfazer'))
  expect(assembled().getAllByRole('listitem')[1].textContent).toContain('is')
  await user.click(word('Ana'))
  await user.click(action('Conferir resposta'))
  expect(screen.getByText('Vamos revisar a resposta')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Ouvir pronúncia/ })).toBeNull()
  await user.click(action('Tentar novamente'))
  await user.click(action('Conferir resposta'))
  await user.click(action('Revisei a correção'))
  expect(screen.getByText('Correção revisada')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: /Ouvir pronúncia/ }))
  expect(speak).toHaveBeenCalledWith(
    expect.objectContaining({ text: 'My name is Ana.' }),
  )
  await user.click(action('Próximo desafio'))
  expect(cancel).toHaveBeenCalled()

  const solutions = [
    ['My', 'name', 'is', 'Leo'],
    ['Nice', 'to', 'meet', 'you'],
    ['Good', 'morning', 'Clara'],
    ['I', 'am', 'Clara'],
  ]
  for (const [index, solution] of solutions.entries()) {
    for (const tile of solution) await user.click(word(tile))
    await user.click(action('Conferir resposta'))
    expect(screen.getByText('Resposta correta')).toBeTruthy()
    await user.click(
      action(
        index === solutions.length - 1 ? 'Ver resultados' : 'Próximo desafio',
      ),
    )
  }
  expect(screen.getByRole('heading', { name: /Sessão concluída/ })).toBeTruthy()
  expect(screen.getByText('4 de 5')).toBeTruthy()
  const persisted = JSON.parse(localStorage.getItem(progressStorageKey) ?? '{}')
  expect(Object.values(persisted.data.gameSessions)).toMatchObject([
    {
      gameId: 'sentence-builder',
      answeredCount: 6,
      correctCount: 4,
      challenges: [
        { reviewed: true },
        { reviewed: false },
        { reviewed: false },
        { reviewed: false },
        { reviewed: false },
      ],
    },
  ])
  expect(screen.getByText('6')).toBeTruthy()
  expect(screen.getByText('My is name Ana')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'O que vale rever' })).toBeTruthy()
  await user.click(action('Jogar novamente'))
  expect(
    screen.getByRole('heading', { name: 'Prepare sua sessão' }),
  ).toBeTruthy()
})

it('preserves a draft when cancellation is chosen and confirms restart and route exit', async () => {
  const user = mount()
  await user.click(action('Fácil · 5 desafios'))
  await user.click(word('My'))
  await user.click(action('Reiniciar sessão'))
  await user.click(action('Continuar jogando'))
  expect(screen.getByText(/1 de 4 palavras na frase/)).toBeTruthy()
  await user.click(action('Reiniciar sessão'))
  await user.click(action('Confirmar reinício'))
  expect(screen.getByText('0 de 4 palavras na frase')).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Voltar aos jogos' }))
  expect(screen.getByRole('dialog', { name: 'Sair da sessão?' })).toBeTruthy()
  await user.click(action('Sair da sessão'))
  expect(screen.getByRole('heading', { name: 'Jogos' })).toBeTruthy()
})
