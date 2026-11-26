// @vitest-environment jsdom

import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { ProgressProvider } from '@/components/progress/progress-provider'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  getVocabularyAnnotations,
  saveVocabularyAnnotation,
  vocabularyAnnotationsKey,
} from '@/services/vocabulary-annotations'
import { favoriteWordsKey } from '@/services/word-favorites'
import { NotebookPage } from './notebook-page'

const daily = 'en-a-little'
const story = 'story-first-trip-ticket'
const missing = 'old-vocabulary-reference'

function mount(ids = [daily, story], seed = true) {
  if (seed) localStorage.setItem(favoriteWordsKey, JSON.stringify(ids))
  const router = createMemoryRouter(
    [
      { path: '/meu-caderno', element: <NotebookPage /> },
      { path: '/', element: <h1>Início</h1> },
    ],
    { initialEntries: ['/meu-caderno'] },
  )
  const user = userEvent.setup()
  return {
    ...render(
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>,
    ),
    user,
    router,
  }
}

async function openEditor(
  user: ReturnType<typeof userEvent.setup>,
  card: HTMLElement,
) {
  const summary = within(card)
    .getByText(/Estudo pessoal/)
    .closest('summary')!
  if (!summary.closest('details')?.open) await user.click(summary)
  await user.click(
    within(card).getByRole('button', { name: /Editar estudo pessoal/ }),
  )
  return within(screen.getByRole('dialog', { name: 'Editar estudo pessoal' }))
}

beforeEach(() => {
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
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

it('assigns, searches and clears personal study, preserving legacy unclassified favorites and safe multiline text after remount', async () => {
  const first = mount()
  const summary = screen.getByRole('region', {
    name: 'Familiaridade no caderno',
  })
  const stat = (label: string) =>
    within(summary).getByText(label).nextElementSibling?.textContent
  expect(stat('Sem classificação')).toBe('2')
  const card = await screen.findByRole('article', { name: 'a little' })
  let editor = await openEditor(first.user, card)
  expect(editor.getByLabelText('Familiaridade')).toHaveProperty('value', '')
  await first.user.selectOptions(
    editor.getByLabelText('Familiaridade'),
    'reviewing',
  )
  const personalNote = 'Atenção ao café\n<img src=x onerror="alert(1)">'
  await first.user.type(editor.getByLabelText('Nota pessoal'), personalNote)
  await first.user.type(
    editor.getByLabelText('Meu exemplo em inglês'),
    "I'll have a little coffee.",
  )
  expect(localStorage.getItem(vocabularyAnnotationsKey)).toBeNull()
  await first.user.click(
    editor.getByRole('button', { name: 'Salvar alterações' }),
  )
  expect(screen.getByText('Estudo pessoal salvo.')).toBeTruthy()
  expect(stat('Revisando')).toBe('1')
  expect(stat('Sem classificação')).toBe('1')
  expect(card.querySelector('img')).toBeNull()
  expect(card.querySelector('.whitespace-pre-wrap')?.textContent).toBe(
    personalNote,
  )

  first.unmount()
  const restored = mount([], false)
  const search = screen.getByRole('searchbox')
  await restored.user.selectOptions(
    screen.getByLabelText('Filtrar por familiaridade'),
    'reviewing',
  )
  await restored.user.type(search, 'ATENCAO')
  const storedCard = await screen.findByRole('article', { name: 'a little' })
  expect(screen.queryByRole('article', { name: 'ticket' })).toBeNull()
  editor = await openEditor(restored.user, storedCard)
  expect(editor.getByLabelText('Meu exemplo em inglês')).toHaveProperty(
    'value',
    "I'll have a little coffee.",
  )
  await restored.user.clear(editor.getByLabelText('Nota pessoal'))
  await restored.user.type(
    editor.getByLabelText('Nota pessoal'),
    'Revisão da frase original',
  )
  await restored.user.click(
    editor.getByRole('button', { name: 'Salvar alterações' }),
  )
  expect(getVocabularyAnnotations().records.get(daily)?.note).toBe(
    'Revisão da frase original',
  )

  await restored.user.click(
    screen.getByRole('button', { name: 'Limpar filtros' }),
  )
  editor = await openEditor(
    restored.user,
    await screen.findByRole('article', { name: 'a little' }),
  )
  await restored.user.clear(editor.getByLabelText('Nota pessoal'))
  await restored.user.clear(editor.getByLabelText('Meu exemplo em inglês'))
  await restored.user.selectOptions(editor.getByLabelText('Familiaridade'), '')
  await restored.user.click(
    editor.getByRole('button', { name: 'Salvar alterações' }),
  )
  expect(getVocabularyAnnotations().records.has(daily)).toBe(false)
  await restored.user.selectOptions(
    screen.getByLabelText('Filtrar por familiaridade'),
    'unclassified',
  )
  expect(screen.getAllByRole('article')).toHaveLength(2)
})

it('guards unsaved changes on Escape and route navigation', async () => {
  const { router, user } = mount([daily])
  const confirm = vi
    .spyOn(window, 'confirm')
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true)
  const editor = await openEditor(
    user,
    await screen.findByRole('article', { name: 'a little' }),
  )
  await user.type(editor.getByLabelText('Nota pessoal'), 'Rascunho')
  act(() =>
    screen
      .getByRole('dialog')
      .dispatchEvent(new Event('cancel', { cancelable: true })),
  )
  expect(editor.getByLabelText('Nota pessoal')).toHaveProperty(
    'value',
    'Rascunho',
  )
  await act(async () => {
    await router.navigate('/')
  })
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2))
  expect(editor.getByLabelText('Nota pessoal')).toHaveProperty(
    'value',
    'Rascunho',
  )
  await act(async () => {
    await router.navigate('/')
  })
  expect(await screen.findByRole('heading', { name: 'Início' })).toBeTruthy()
  expect(localStorage.getItem(vocabularyAnnotationsKey)).toBeNull()
})

it('keeps annotations editable when educational sources are unavailable and confirms removal', async () => {
  const { user } = mount([missing])
  saveVocabularyAnnotation(
    missing,
    { familiarity: 'familiar', note: 'A expressão da revisão' },
    undefined,
  )
  const section = await screen.findByRole('region', {
    name: 'Itens indisponíveis',
  })
  const editor = await openEditor(user, section)
  expect(editor.getByLabelText('Nota pessoal')).toHaveProperty(
    'value',
    'A expressão da revisão',
  )
  await user.type(
    editor.getByLabelText('Meu exemplo em inglês'),
    'A sentence I wrote.',
  )
  await user.click(editor.getByRole('button', { name: 'Salvar alterações' }))
  const confirm = vi
    .spyOn(window, 'confirm')
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true)
  const remove = within(section).getByRole('button', { name: /Remover item/ })
  await user.click(remove)
  expect(section.isConnected).toBe(true)
  await user.click(remove)
  expect(
    await screen.findByRole('heading', { name: 'O caderno está vazio' }),
  ).toBeTruthy()
  expect(getVocabularyAnnotations().records.get(missing)?.personalExample).toBe(
    'A sentence I wrote.',
  )
  expect(confirm).toHaveBeenCalledWith(
    expect.stringContaining('ficam guardados'),
  )
})

it('refreshes annotations from another tab and keeps an unsaved draft on conflicting edits', async () => {
  const { user } = mount([daily])
  const card = await screen.findByRole('article', { name: 'a little' })
  const editor = await openEditor(user, card)
  await user.type(editor.getByLabelText('Nota pessoal'), 'Meu rascunho')
  act(() => {
    localStorage.setItem(
      vocabularyAnnotationsKey,
      JSON.stringify({
        version: 1,
        records: {
          [daily]: {
            vocabularyId: daily,
            createdAt: 10,
            updatedAt: 20,
            familiarity: 'learning',
            note: 'Texto da outra aba',
          },
        },
      }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', { key: vocabularyAnnotationsKey }),
    )
  })
  await user.click(editor.getByRole('button', { name: 'Salvar alterações' }))
  expect(editor.getByRole('alert').textContent).toContain('mudou em outra aba')
  expect(editor.getByLabelText('Nota pessoal')).toHaveProperty(
    'value',
    'Meu rascunho',
  )
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  await user.click(editor.getByRole('button', { name: 'Cancelar' }))
  expect(within(card).getByText('Texto da outra aba')).toBeTruthy()
})
