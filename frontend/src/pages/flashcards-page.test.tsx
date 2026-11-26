// @vitest-environment jsdom

import { StrictMode } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { ProgressProvider } from '@/components/progress/progress-provider'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { flashcardsPath, notebookPath } from '@/data/navigation'
import { NotebookPage } from './notebook-page'
import { FlashcardsPage } from './flashcards-page'

const favorites = 'mellow:favorite-words'
const annotations = 'mellow:vocabulary-annotations'
const progress = 'mellow:learner-progress'
const daily = 'en-a-little'
const story = 'story-first-trip-ticket'

function mount(initialEntry = flashcardsPath) {
  const router = createMemoryRouter(
    [
      { path: notebookPath, Component: NotebookPage },
      { path: flashcardsPath, Component: FlashcardsPage },
    ],
    { initialEntries: [initialEntry] },
  )
  const user = userEvent.setup()
  return {
    ...render(
      <StrictMode>
        <ProgressProvider>
          <RouterProvider router={router} />
        </ProgressProvider>
      </StrictMode>,
    ),
    user,
    router,
  }
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function seedAnnotation() {
  const data = JSON.stringify({
    version: 1,
    records: {
      [daily]: {
        vocabularyId: daily,
        createdAt: 1,
        updatedAt: 2,
        familiarity: 'learning',
        note: 'Café de manhã',
        personalExample: 'I like a little cake.',
      },
    },
  })
  localStorage.setItem(annotations, data)
  return data
}

it('keeps the English answer, audio and annotations inaccessible before revealing, then completes once and repeats without changing personal data', async () => {
  localStorage.setItem(favorites, JSON.stringify([daily, 'unavailable']))
  const metadata = seedAnnotation()
  localStorage.setItem(
    progress,
    '{"version":4,"data":{"lessons":{},"dailyStudyMs":{}}}',
  )
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
  const time = vi.spyOn(Date, 'now').mockReturnValue(1000)
  const { user } = mount()
  expect(await screen.findByText('1 cartão disponível')).toBeTruthy()
  expect(screen.getByText(/sem conteúdo de origem disponível/)).toBeTruthy()
  expect(
    within(screen.getByLabelText('Quantidade de cartões')).getAllByRole(
      'option',
    ),
  ).toHaveLength(1)
  await user.selectOptions(screen.getByLabelText('Direção da revisão'), 'pt-en')
  await user.click(screen.getByRole('button', { name: 'Começar revisão' }))
  expect(screen.getByRole('heading', { name: 'um pouco' })).toBeTruthy()
  expect(screen.queryByText('a little')).toBeNull()
  expect(screen.queryByText('Café de manhã')).toBeNull()
  expect(screen.queryByText('I like a little cake.')).toBeNull()
  expect(screen.queryByRole('button', { name: /Ouvir/ })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Não lembrei' })).toBeNull()
  expect(speak).not.toHaveBeenCalled()
  const reveal = screen.getByRole('button', { name: 'Revelar resposta' })
  reveal.focus()
  await user.keyboard('{Enter}')
  const answer = screen.getByRole('heading', { name: 'a little' })
  expect(document.activeElement).toBe(answer)
  expect(screen.getByText('Exemplo do Mellow')).toBeTruthy()
  expect(screen.getByText('I like a little cake.')).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Velocidade do áudio'), '0.75')
  await user.click(screen.getByRole('button', { name: /Ouvir pronúncia/ }))
  expect(speak).toHaveBeenCalledWith(
    expect.objectContaining({ text: 'a little', rate: 0.75 }),
  )
  time.mockReturnValue(4000)
  await user.click(screen.getByRole('button', { name: 'Com esforço' }))
  expect(cancel).toHaveBeenCalledTimes(1)
  const result = screen.getByRole('region', { name: 'Revisão concluída' })
  expect(
    within(result).getByText('Com esforço').nextElementSibling?.textContent,
  ).toBe('1')
  expect(
    within(result).getByText(/Tempo ativo estimado/).textContent,
  ).toContain('3 s')
  expect(screen.getByRole('region', { name: 'Itens para rever' })).toBeTruthy()
  await user.click(
    screen.getByRole('button', {
      name: 'Rever os itens que custaram a lembrar',
    }),
  )
  expect(screen.getByText('Cartão 1 de 1')).toBeTruthy()
  expect(screen.queryByText('I like a little cake.')).toBeNull()
  expect(localStorage.getItem(annotations)).toBe(metadata)
  expect(localStorage.getItem(favorites)).toBe(
    JSON.stringify([daily, 'unavailable']),
  )
  const persisted = JSON.parse(localStorage.getItem(progress)!)
  expect(persisted.version).toBe(5)
  expect(Object.values(persisted.data.flashcardSessions)).toEqual([
    expect.objectContaining({
      observations: [
        { vocabularyId: daily, direction: 'pt-en', rating: 'effort' },
      ],
      activeMs: 3000,
    }),
  ])
  expect(persisted.data.lessons).toEqual({})
  await user.click(screen.getByRole('button', { name: 'Revelar resposta' }))
  await user.click(screen.getByRole('button', { name: 'Com facilidade' }))
  expect(
    Object.keys(
      JSON.parse(localStorage.getItem(progress)!).data.flashcardSessions,
    ),
  ).toHaveLength(2)
})

it('carries notebook search and filters, permits reviewing a previous card and confirms exit and restart', async () => {
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
  const speak = vi.fn()
  const cancel = vi.fn()
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  localStorage.setItem(favorites, JSON.stringify([daily, story]))
  seedAnnotation()
  const { user, router } = mount(notebookPath)
  await screen.findByRole('article', { name: 'a little' })
  await user.type(screen.getByRole('searchbox'), 'CAFE')
  await user.selectOptions(
    screen.getByLabelText('Filtrar por familiaridade'),
    'learning',
  )
  await user.click(
    screen.getByRole('link', { name: 'Revisar com os filtros atuais' }),
  )
  expect(await screen.findByText('1 cartão disponível')).toBeTruthy()
  expect(router.state.location.search).not.toContain('CAFE')
  expect(screen.getByRole('searchbox')).toHaveProperty('value', 'CAFE')
  expect(screen.getByLabelText('Filtrar por familiaridade')).toHaveProperty(
    'value',
    'learning',
  )
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(await screen.findByText('2 cartões disponíveis')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Começar revisão' }))
  expect(screen.queryByText('um pouco')).toBeNull()
  expect(screen.queryByText('Passagem / Bilhete')).toBeNull()
  await user.click(screen.getByRole('button', { name: /Ouvir pronúncia/ }))
  expect(speak).toHaveBeenCalledOnce()
  await user.click(screen.getByRole('button', { name: 'Revelar resposta' }))
  await user.click(screen.getByRole('button', { name: 'Não lembrei' }))
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Cartão 2 de 2')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Cartão anterior' }))
  expect(screen.getByText(/Sua avaliação/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Com facilidade' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Próximo cartão' }))
  await user.click(screen.getByRole('button', { name: 'Reiniciar sessão' }))
  let confirm = within(screen.getByRole('dialog'))
  await user.click(confirm.getByRole('button', { name: 'Continuar revisão' }))
  expect(screen.getByText('Cartão 2 de 2')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Reiniciar sessão' }))
  confirm = within(screen.getByRole('dialog'))
  await user.click(confirm.getByRole('button', { name: 'Confirmar reinício' }))
  expect(screen.getByText('Cartão 1 de 2')).toBeTruthy()
  expect(screen.getByRole('progressbar')).toHaveProperty('value', 0)
  await user.click(screen.getByRole('button', { name: /Ouvir pronúncia/ }))
  await user.click(screen.getByRole('link', { name: 'Voltar ao caderno' }))
  confirm = within(screen.getByRole('dialog'))
  await user.click(confirm.getByRole('button', { name: 'Sair da sessão' }))
  expect(
    await screen.findByRole('heading', { name: 'Meu caderno' }),
  ).toBeTruthy()
  expect(cancel).toHaveBeenCalledTimes(2)
  expect(localStorage.getItem(progress)).toBeNull()
})

it('shows a helpful empty state without reviewable favorites', async () => {
  mount()
  expect(await screen.findByText(/Salve palavras e expressões/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Começar revisão' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Voltar ao caderno' })).toBeTruthy()
})
