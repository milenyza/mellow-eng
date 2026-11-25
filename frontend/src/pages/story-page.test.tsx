// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { rainyMorningStory } from '@/data/stories/rainy-morning'
import { getStoryPath, storiesPath, storyRoute } from '@/data/navigation'
import { readFavoriteWordIds, setWordFavorite } from '@/services/word-favorites'
import { StoriesPage } from './stories-page'
import { StoryPage } from './story-page'

const story = rainyMorningStory
const firstTranslation = story.chapters[0].paragraphs[0].translation

class MockUtterance {
  lang = ''
  rate = 1
  onend?: () => void
  onerror?: () => void

  constructor(public text: string) {}
}

function mockSpeech() {
  const speak = vi.fn<(speech: MockUtterance) => void>()
  const cancel = vi.fn()
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] })
  return { speak, cancel }
}

function mount(path = getStoryPath(story.id)) {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={storiesPath} element={<StoriesPage />} />
        <Route path={storyRoute} element={<StoryPage />} />
      </Routes>
    </MemoryRouter>,
  )
  return { ...view, user }
}

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '')
      this.querySelector('button')?.focus()
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    },
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('opens the published story from the library and navigates ordered chapter URLs', async () => {
  const { user } = mount(storiesPath)
  expect(screen.getAllByText('Em breve')).toHaveLength(5)
  await user.click(
    screen.getByRole('link', { name: /Ler história.*A Rainy Morning/ }),
  )
  expect(
    screen.getByRole('heading', { name: 'Rain at the Window' }),
  ).toBeTruthy()
  expect(screen.getByText('Capítulo 1 de 3')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Capítulo anterior' })).toBeNull()
  const next = screen.getByRole('link', { name: 'Próximo capítulo' })
  expect(next.getAttribute('href')).toBe(
    getStoryPath(story.id, 'inside-the-bakery'),
  )
  await user.click(next)
  expect(
    screen.getByRole('heading', { name: 'Inside the Bakery' }),
  ).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Próximo capítulo' }))
  expect(screen.getByText('Capítulo 3 de 3')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Próximo capítulo' })).toBeNull()
  await user.click(screen.getByRole('link', { name: 'Capítulo anterior' }))
  expect(screen.getByText('Capítulo 2 de 3')).toBeTruthy()
})

it('keeps planned stories as previews and explains invalid story and chapter IDs', async () => {
  const planned = mount(getStoryPath('the-first-trip'))
  expect(
    screen.getByRole('heading', { name: 'História em breve' }),
  ).toBeTruthy()
  await planned.user.click(screen.getByText('Prévia da história'))
  expect(screen.getByText('A Ticket to the Coast')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Ler história/ })).toBeNull()
  planned.unmount()

  const missingChapter = mount(getStoryPath(story.id, 'missing-chapter'))
  expect(
    screen.getByRole('heading', { name: 'Capítulo não encontrado' }),
  ).toBeTruthy()
  await missingChapter.user.click(
    screen.getByRole('link', { name: 'Abrir primeiro capítulo' }),
  )
  expect(screen.getByText('Capítulo 1 de 3')).toBeTruthy()
  missingChapter.unmount()

  const missingStory = mount(getStoryPath('missing-story', 'inside-the-bakery'))
  expect(
    screen.getByRole('heading', { name: 'História não encontrada' }),
  ).toBeTruthy()
  await missingStory.user.click(
    screen.getByRole('link', { name: 'Voltar à biblioteca' }),
  )
  expect(
    screen.getByRole('heading', { name: 'Biblioteca de histórias' }),
  ).toBeTruthy()
})

it('hides translations at entry and carries font size and visibility across chapter navigation', async () => {
  const { user, unmount } = mount()
  expect(screen.queryByText(firstTranslation)).toBeNull()
  const control = screen.getByRole('checkbox', { name: 'Mostrar traduções' })
  await user.click(control)
  expect(screen.getByText(firstTranslation).getAttribute('lang')).toBe('pt-BR')
  const size = screen.getByLabelText('Tamanho do texto')
  await user.selectOptions(size, 'extra-large')
  expect(
    screen.getByText(/^It is Monday morning/).classList.contains('text-2xl'),
  ).toBe(true)
  await user.click(screen.getByRole('link', { name: 'Próximo capítulo' }))
  expect(
    screen.getByText(story.chapters[1].paragraphs[0].translation),
  ).toBeTruthy()
  expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe(
    'extra-large',
  )
  await user.click(screen.getByRole('checkbox', { name: 'Mostrar traduções' }))
  expect(
    screen.queryByText(story.chapters[1].paragraphs[0].translation),
  ).toBeNull()
  unmount()
  mount(getStoryPath(story.id, 'inside-the-bakery'))
  expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('normal')
  expect(
    screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Mostrar traduções',
    }).checked,
  ).toBe(false)
})

it('opens contextual vocabulary by keyboard and persists its favorite alongside existing IDs', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  setWordFavorite('en-a-little', true)
  const { user, unmount } = mount()
  const trigger = screen.getByRole('button', {
    name: /Consultar vocabulário.*umbrella/,
  })
  trigger.focus()
  await user.keyboard('{Enter}')
  const dialog = screen.getByRole('dialog', { name: 'umbrella' })
  expect(within(dialog).getByText('/ʌmˈbrel.ə/')).toBeTruthy()
  expect(
    within(dialog).getByText('Guarda-chuva, usado para se proteger da chuva.'),
  ).toBeTruthy()
  expect(
    within(dialog).getByText('Tenho um guarda-chuva na minha bolsa.'),
  ).toBeTruthy()
  expect(
    within(dialog).getByRole<HTMLButtonElement>('button', {
      name: 'Ouvir pronúncia',
    }).disabled,
  ).toBe(true)
  await user.click(
    within(dialog).getByRole('button', { name: 'Salvar nos favoritos' }),
  )
  expect(readFavoriteWordIds()).toEqual([
    'en-a-little',
    'story-rainy-morning-umbrella',
  ])
  await user.click(
    within(dialog).getByRole('button', { name: 'Fechar vocabulário' }),
  )
  expect(document.activeElement).toBe(trigger)
  unmount()

  const restored = mount()
  await restored.user.click(
    screen.getByRole('button', { name: /Consultar vocabulário.*umbrella/ }),
  )
  await restored.user.click(
    screen.getByRole('button', { name: 'Remover dos favoritos' }),
  )
  expect(readFavoriteWordIds()).toEqual(['en-a-little'])
})

it('reads chapter segments in order and cancels when switching audio, closing vocabulary or moving chapters', async () => {
  const { speak, cancel } = mockSpeech()
  const { user } = mount()
  const button = (name: string) => screen.getByRole('button', { name })
  await user.click(screen.getByRole('radio', { name: 'Reduzida (0,75×)' }))
  await user.click(button('Ouvir capítulo'))
  const first = speak.mock.calls[0][0]
  expect(first).toMatchObject({
    text: story.chapters[0].paragraphs[0].text,
    rate: 0.75,
    lang: 'en-US',
  })
  act(() => first.onend?.())
  expect(speak.mock.calls[1][0].text).toBe(story.chapters[0].paragraphs[1].text)
  await user.click(button('Ouvir parágrafo 2'))
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(speak.mock.calls[2][0].rate).toBe(0.75)
  await user.click(button('Parar narração do parágrafo 2'))
  expect(cancel).toHaveBeenCalledTimes(2)

  await user.click(
    screen.getByRole('button', { name: /Consultar vocabulário.*umbrella/ }),
  )
  await user.click(button('Ouvir pronúncia'))
  expect(speak.mock.calls[3][0].text).toBe('umbrella')
  await user.click(button('Fechar vocabulário'))
  expect(cancel).toHaveBeenCalledTimes(3)
  await user.click(button('Ouvir capítulo'))
  await user.click(screen.getByRole('link', { name: 'Próximo capítulo' }))
  expect(cancel).toHaveBeenCalledTimes(4)
  act(() => speak.mock.calls[4][0].onend?.())
  expect(speak).toHaveBeenCalledTimes(5)
  expect(screen.getByText('Capítulo 2 de 3')).toBeTruthy()
})

it('reports playback errors and keeps the reader usable without speech synthesis', async () => {
  const { speak } = mockSpeech()
  const view = mount()
  await view.user.click(
    screen.getByRole('button', { name: 'Ouvir parágrafo 1' }),
  )
  expect(speak.mock.calls[0][0].rate).toBe(1)
  act(() => speak.mock.calls[0][0].onerror?.())
  expect(screen.getByRole('status').textContent).toContain(
    'Não foi possível reproduzir',
  )
  view.unmount()

  vi.stubGlobal('speechSynthesis', undefined)
  mount()
  expect(
    screen.getByRole<HTMLButtonElement>('button', { name: 'Ouvir capítulo' })
      .disabled,
  ).toBe(true)
  expect(screen.getByRole('status').textContent).toContain('indisponível')
  expect(screen.getByText(/^It is Monday morning/)).toBeTruthy()
})
