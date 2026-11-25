// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { introductionsLesson } from '@/data/curriculum/introductions-lesson'
import { LessonPlayer } from './lesson-player'

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(cleanup)

it('keeps drafts, feedback and exercise position when leaving and revisiting practice', async () => {
  const user = userEvent.setup()
  render(
    <ProgressProvider>
      <MemoryRouter>
        <LessonPlayer
          lesson={introductionsLesson}
          language="en"
          level="A1"
          unitNumber={1}
          lessonNumber={1}
        />
      </MemoryRouter>
    </ProgressProvider>,
  )
  const click = (name: string) =>
    user.click(screen.getByRole('button', { name }))
  const submit = () => click('Conferir resposta')

  for (let stage = 0; stage < 6; stage++) await click('Próxima etapa')
  expect(screen.getByText('Etapa 7 de 9')).toBeTruthy()
  expect(screen.getByText('Exercício 1 de 10')).toBeTruthy()
  await user.click(screen.getByRole('radio', { name: 'Goodbye!' }))
  await click('Etapa anterior')
  expect(screen.getByText('Identifique o cumprimento')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ouvir áudio' })).toBeTruthy()

  await click('Próxima etapa')
  expect(
    screen.getByRole<HTMLInputElement>('radio', { name: 'Goodbye!' }).checked,
  ).toBe(true)
  await submit()
  await click('Próxima etapa')
  expect(screen.getByText('Experimente falar em voz alta')).toBeTruthy()
  await click('Etapa anterior')
  expect(screen.getByRole('status').textContent).toContain(
    'Vamos revisar a resposta',
  )
  await click('Revisei a correção')
  await click('Próximo exercício')
  await user.type(screen.getByRole('textbox'), 'is')
  await click('Próxima etapa')
  await click('Etapa anterior')
  expect(screen.getByText('Exercício 2 de 10')).toBeTruthy()
  expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('is')
  expect(screen.getByText('Etapa 7 de 9')).toBeTruthy()
})

it('keeps listening responses, feedback and text mode across lesson stages', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  try {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <MemoryRouter>
          <LessonPlayer
            lesson={introductionsLesson}
            language="en"
            level="A1"
            unitNumber={1}
            lessonNumber={1}
          />
        </MemoryRouter>
      </ProgressProvider>,
    )
    const click = (name: string) =>
      user.click(screen.getByRole('button', { name }))

    for (let stage = 0; stage < 5; stage++) await click('Próxima etapa')
    expect(screen.getByText('Etapa 6 de 9')).toBeTruthy()
    expect(screen.getByText('Atividade 1 de 6')).toBeTruthy()
    await click('Usar alternativa em texto')
    await user.click(screen.getByRole('radio', { name: 'À noite' }))
    await click('Próxima etapa')
    await click('Etapa anterior')
    expect(screen.getByText('Alternativa em texto')).toBeTruthy()
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'À noite' }).checked,
    ).toBe(true)

    await click('Conferir resposta')
    await click('Etapa anterior')
    await click('Próxima etapa')
    expect(screen.getByText('Vamos revisar a resposta')).toBeTruthy()
    expect(screen.getByText('Ver transcrição e tradução')).toBeTruthy()
    await click('Revisei a correção')
    await click('Próxima atividade')
    expect(screen.getByText('Atividade 2 de 6')).toBeTruthy()
    expect(screen.queryByText('Ver transcrição e tradução')).toBeNull()
    await click('Próxima etapa')
    await click('Etapa anterior')
    expect(screen.getByText('Atividade 2 de 6')).toBeTruthy()
  } finally {
    cleanup()
    vi.unstubAllGlobals()
  }
})
