// @vitest-environment jsdom

import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { parseProgress, serializeProgress } from '@/services/progress-format'
import { startReading, updateReadingChapter } from '@/services/reading-progress'
import { progressStorageKey } from '@/services/progress-repository'
import { HomePage } from './home-page'
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
    <ProgressProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path={storiesPath} element={<StoriesPage />} />
          <Route path={storyRoute} element={<StoryPage />} />
        </Routes>
      </MemoryRouter>
    </ProgressProvider>,
  )
  return { ...view, user }
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
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
  expect(screen.getAllByText('Em breve')).toHaveLength(4)
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
  const planned = mount(getStoryPath('the-new-neighbor'))
  expect(
    screen.getByRole('heading', { name: 'História em breve' }),
  ).toBeTruthy()
  await planned.user.click(screen.getByText('Prévia da história'))
  expect(screen.getByText('Boxes in the Hall')).toBeTruthy()
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

it('hides translations by default and preserves preferences across chapters and reloads', async () => {
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
  expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe(
    'extra-large',
  )
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
  expect(
    within(screen.getByRole('region', { name: 'Narração' })).getByRole('status')
      .textContent,
  ).toContain('Não foi possível reproduzir')
  view.unmount()

  vi.stubGlobal('speechSynthesis', undefined)
  mount()
  expect(
    screen.getByRole<HTMLButtonElement>('button', { name: 'Ouvir capítulo' })
      .disabled,
  ).toBe(true)
  expect(
    within(screen.getByRole('region', { name: 'Narração' })).getByRole('status')
      .textContent,
  ).toContain('indisponível')
  expect(screen.getByText(/^It is Monday morning/)).toBeTruthy()
})

it('renders optional comprehension after the narrative and preserves feedback and drafts across chapters', async () => {
  const { user, unmount } = mount()
  const section = () =>
    within(screen.getByRole('region', { name: 'Compreensão da leitura' }))
  const submit = () =>
    section().getByRole<HTMLButtonElement>('button', {
      name: 'Conferir resposta',
    })
  const button = (name: string) => section().getByRole('button', { name })
  const storyParagraph = document.getElementById('story-paragraph-morning-rain')
  const comprehension = screen.getByRole('region', {
    name: 'Compreensão da leitura',
  })
  expect(storyParagraph?.compareDocumentPosition(comprehension)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
  expect(section().getByText('Exercício 1 de 5')).toBeTruthy()
  expect(
    section()
      .getByRole('heading', { name: 'What day is it?' })
      .getAttribute('lang'),
  ).toBe('en')
  expect(
    section()
      .getByRole('link', { name: 'Reler parágrafo 1' })
      .getAttribute('href'),
  ).toBe('#story-paragraph-morning-rain')
  expect(
    section()
      .getByRole('link', { name: 'Voltar ao texto do capítulo' })
      .getAttribute('href'),
  ).toBe('#story-chapter-heading')
  expect(submit().disabled).toBe(true)
  expect(section().queryByText('Resposta esperada')).toBeNull()

  await user.click(section().getByRole('radio', { name: 'Tuesday' }))
  await user.click(submit())
  expect(section().getByText('Vamos revisar a resposta')).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Próximo capítulo' }))
  expect(
    screen.getByRole('heading', { name: 'Inside the Bakery' }),
  ).toBeTruthy()
  expect(section().getByText('Exercício 1 de 5')).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Capítulo anterior' }))
  expect(section().getByText('Vamos revisar a resposta')).toBeTruthy()
  await user.click(button('Tentar novamente'))
  expect(
    section().getByRole<HTMLInputElement>('radio', { name: 'Tuesday' }).checked,
  ).toBe(true)
  await user.click(section().getByRole('radio', { name: 'Monday' }))
  await user.click(submit())
  expect(section().getByText('Resposta correta')).toBeTruthy()
  await user.click(button('Próximo exercício'))
  await user.type(section().getByRole('textbox'), 'umb')
  await user.click(screen.getByRole('link', { name: 'Próximo capítulo' }))
  await user.click(screen.getByRole('link', { name: 'Capítulo anterior' }))
  expect(section().getByRole<HTMLInputElement>('textbox').value).toBe('umb')
  expect(
    parseProgress(localStorage.getItem(progressStorageKey))?.lessons,
  ).toEqual({})
  unmount()
  mount()
  expect(section().getByText('Exercício 2 de 5')).toBeTruthy()
  expect(section().getByRole<HTMLInputElement>('textbox').value).toBe('umb')
})

it('uses shared correction review and keyboard ordering through the last reading exercise', async () => {
  const { user } = mount()
  const section = within(
    screen.getByRole('region', { name: 'Compreensão da leitura' }),
  )
  const click = (name: string) =>
    user.click(section.getByRole('button', { name }))

  await user.click(section.getByRole('radio', { name: 'Saturday' }))
  await click('Conferir resposta')
  await click('Revisei a correção')
  expect(section.getByText('Correção revisada')).toBeTruthy()
  await click('Próximo exercício')

  await user.type(section.getByRole('textbox'), 'umbrella')
  await click('Conferir resposta')
  await click('Próximo exercício')
  await user.click(section.getByRole('radio', { name: 'Falso' }))
  await click('Conferir resposta')
  await click('Próximo exercício')
  await user.click(section.getByRole('radio', { name: 'Ela fica na esquina.' }))
  await click('Conferir resposta')
  await click('Próximo exercício')
  const choices = within(
    section.getByRole('group', { name: 'Acontecimentos disponíveis' }),
  )
  for (const name of [
    'Lia looks out the window.',
    'Lia takes her umbrella.',
    'Lia goes into the bakery.',
  ]) {
    choices.getByRole('button', { name }).focus()
    await user.keyboard('{Enter}')
  }
  expect(
    section.getByRole('list', { name: 'Ordem dos acontecimentos' }).children,
  ).toHaveLength(3)
  await click('Conferir resposta')
  expect(section.getByText('Resposta correta')).toBeTruthy()
  await click('Encerrar prática')
  expect(section.getByText('5 de 5 exercícios revisados')).toBeTruthy()
  expect(
    section.getByText('Você pode reler o capítulo ou seguir na história.'),
  ).toBeTruthy()
})

it('resumes a stored chapter and real paragraph anchor and offers continue reading', async () => {
  const record = updateReadingChapter(
    startReading('inside-the-bakery'),
    'inside-the-bakery',
    () => ({
      paragraphId: 'sharing-table',
    }),
  )
  localStorage.setItem(
    progressStorageKey,
    serializeProgress({
      lessons: {},
      dailyStudyMs: {},
      reading: {
        stories: { [story.id]: record },
        preferences: { fontSize: 'large', translations: true },
      },
    }),
  )
  const { user } = mount(storiesPath)
  const section = within(
    screen.getByRole('region', { name: 'Continuar lendo' }),
  )
  await user.click(
    section.getByRole('link', { name: /A Rainy Morning.*Inside the Bakery/ }),
  )
  expect(
    screen.getByRole('heading', { name: 'Inside the Bakery' }),
  ).toBeTruthy()
  expect(
    screen.getByText(story.chapters[1].paragraphs[0].translation),
  ).toBeTruthy()
  const target = document.getElementById('story-paragraph-sharing-table')
  await waitFor(() =>
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts).toContain(
      target,
    ),
  )
})

it('marks chapters explicitly without exercises, shows the result, and updates library and Dashboard', async () => {
  const { user, unmount } = mount()
  const mark = () =>
    user.click(
      screen.getByRole('button', { name: 'Marcar capítulo como lido' }),
    )
  const next = () =>
    user.click(screen.getByRole('link', { name: 'Próximo capítulo' }))
  await next()
  await next()
  expect(screen.queryByText('Capítulo marcado como lido')).toBeNull()
  await mark()
  expect(screen.queryByText('Parabéns pela leitura!')).toBeNull()
  await user.click(screen.getByRole('link', { name: 'Capítulo anterior' }))
  await mark()
  await user.click(screen.getByRole('link', { name: 'Capítulo anterior' }))
  await mark()
  expect(
    screen.getByRole('heading', { name: 'Parabéns pela leitura!' }),
  ).toBeTruthy()
  expect(screen.getByText('3 de 3')).toBeTruthy()
  expect(screen.queryByText('Acertos na primeira tentativa')).toBeNull()
  await user.click(screen.getByRole('link', { name: 'Voltar à biblioteca' }))
  await user.selectOptions(
    screen.getByLabelText('Estado da leitura'),
    'completed',
  )
  expect(screen.getByText('1 história')).toBeTruthy()
  expect(screen.getByText('Leitura concluída')).toBeTruthy()
  await user.click(
    screen.getByRole('link', { name: /Reler história.*A Rainy Morning/ }),
  )
  await user.click(screen.getByRole('button', { name: 'Reiniciar leitura' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar reinício' }))
  await mark()
  const record = parseProgress(localStorage.getItem(progressStorageKey))
    ?.reading?.stories[story.id]
  expect(record?.readChapterIds).toHaveLength(3)
  expect(record?.completion?.run.id).not.toBe(record?.run.id)
  unmount()
  mount('/')
  expect(
    screen.getByText('Histórias concluídas').parentElement?.querySelector('dd')
      ?.textContent,
  ).toBe('1')
  expect(
    screen.getByText('Capítulos lidos').parentElement?.querySelector('dd')
      ?.textContent,
  ).toBe('3')
})
