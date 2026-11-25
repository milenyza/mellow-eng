// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LessonPlayer } from '@/components/lesson/lesson-player'
import { ProgressProvider } from '@/components/progress/progress-provider'
import { introductionsExercises } from '@/data/curriculum/introductions-exercises'
import { introductionsLesson } from '@/data/curriculum/introductions-lesson'
import { introductionsListening } from '@/data/curriculum/introductions-listening'
import { getLessonPath } from '@/data/navigation'
import { HomePage } from '@/pages/home-page'
import { LessonsPage } from '@/pages/lessons-page'
import { createLocalProgressRepository } from '@/services/progress-repository'
import type { AvailableLesson } from '@/types/curriculum'

const lesson: AvailableLesson = {
  ...introductionsLesson,
  blocks: [
    introductionsLesson.blocks[0],
    {
      ...introductionsLesson.blocks[5],
      activities: [introductionsListening[0]],
    },
    {
      ...introductionsLesson.blocks[6],
      exercises: [introductionsExercises[0], introductionsExercises[1]],
    },
    introductionsLesson.blocks[8],
  ],
}
const playerPath = getLessonPath(lesson.id)

function mount(path = playerPath) {
  const repository = createLocalProgressRepository()
  const user = userEvent.setup()
  const view = render(
    <ProgressProvider repository={repository}>
      <MemoryRouter initialEntries={[path]}>
        <Link to="/">Início</Link>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/aulas" element={<LessonsPage />} />
          <Route
            path={playerPath}
            element={
              <LessonPlayer
                lesson={lesson}
                language="en"
                level="A1"
                unitNumber={1}
                lessonNumber={1}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </ProgressProvider>,
  )
  const button = (name: string) =>
    screen.getByRole<HTMLButtonElement>('button', { name })
  return {
    ...view,
    repository,
    user,
    button,
    click: (name: string) => user.click(button(name)),
  }
}

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
    configurable: true,
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    value(this: HTMLDialogElement) {
      this.removeAttribute('open')
    },
    configurable: true,
  })
})

afterEach(cleanup)

it('restores listening, practice feedback, drafts and current position from a new repository', async () => {
  const first = mount()
  await first.click('Próxima etapa')
  await first.click('Usar alternativa em texto')
  await first.user.click(screen.getByRole('radio', { name: 'À noite' }))
  await first.click('Conferir resposta')
  first.unmount()

  const second = mount()
  expect(screen.getByText('Vamos revisar a resposta')).toBeTruthy()
  expect(screen.getByText('Alternativa em texto')).toBeTruthy()
  const record = second.repository.getSnapshot().data.lessons[lesson.id]
  expect(
    record?.run.activities.listening?.attempts[
      introductionsListening[0].exercise.id
    ]?.submissions[0].mode,
  ).toBe('text-alternative')

  await second.click('Revisei a correção')
  await second.click('Próxima etapa')
  await second.user.click(screen.getByRole('radio', { name: 'Good morning!' }))
  await second.click('Conferir resposta')
  await second.click('Próximo exercício')
  await second.user.type(screen.getByRole('textbox'), ' i')
  second.unmount()

  mount()
  expect(screen.getByText('Exercício 2 de 2')).toBeTruthy()
  expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(' i')
})

it('requires explicit confirmation, synchronizes catalog and Dashboard, and preserves completion during restart', async () => {
  const { click, button, user, repository } = mount()
  // Visiting the final stage cannot finish the lesson.
  for (let stage = 0; stage < 3; stage++) await click('Próxima etapa')
  expect(button('Confirmar conclusão').disabled).toBe(true)
  expect(
    screen.getByText('Atividades obrigatórias para responder ou revisar: 3.'),
  ).toBeTruthy()

  await click('Ir para a etapa pendente')
  await click('Usar alternativa em texto')
  await user.click(screen.getByRole('radio', { name: 'À noite' }))
  await click('Conferir resposta')
  await click('Revisei a correção')
  await click('Próxima etapa')
  await user.click(screen.getByRole('radio', { name: 'Good morning!' }))
  await click('Conferir resposta')
  await click('Próximo exercício')
  await user.type(screen.getByRole('textbox'), 'is')
  await click('Conferir resposta')
  await click('Próxima etapa')
  expect(button('Confirmar conclusão').disabled).toBe(false)
  expect(
    repository.getSnapshot().data.lessons[lesson.id]?.completion,
  ).toBeUndefined()
  await click('Confirmar conclusão')
  expect(
    screen.getByRole('heading', { name: 'Parabéns pela aula concluída!' }),
  ).toBeTruthy()
  expect(screen.getByText('Alternativa em texto')).toBeTruthy()
  expect(screen.getByText('0 de 1')).toBeTruthy()
  expect(screen.getByText('2 de 2')).toBeTruthy()
  const completed = repository.getSnapshot().data.lessons[lesson.id]?.completion

  await click('Reiniciar aula')
  expect(
    screen.getByRole('dialog', { name: 'Reiniciar esta aula?' }),
  ).toBeTruthy()
  await click('Cancelar')
  expect(
    screen.getByRole('heading', { name: 'Parabéns pela aula concluída!' }),
  ).toBeTruthy()
  await click('Reiniciar aula')
  await click('Confirmar reinício')
  expect(
    screen.getByRole('heading', { name: 'Uma primeira conversa' }),
  ).toBeTruthy()
  expect(repository.getSnapshot().data.lessons[lesson.id]?.completion).toEqual(
    completed,
  )

  await user.click(screen.getByRole('link', { name: 'Voltar ao catálogo' }))
  expect(
    screen.getByText('de 48 aulas concluídas · 2%', { exact: false }),
  ).toBeTruthy()
  expect(screen.getByText('Concluída', { exact: true })).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Início' }))
  expect(screen.getByText('Where are you from?', { exact: true })).toBeTruthy()
  expect(
    screen.getByText('Aulas concluídas').parentElement?.querySelector('dd')
      ?.textContent,
  ).toBe('1')
  expect(screen.queryByText('Palavras aprendidas')).toBeNull()
})

it('requires confirmation to discard an unfinished run and clears its drafts after restart', async () => {
  const { click, user, repository } = mount()
  await click('Próxima etapa')
  await user.click(screen.getByRole('radio', { name: 'De manhã' }))
  const firstRun = repository.getSnapshot().data.lessons[lesson.id]?.run
  await click('Reiniciar aula')
  await click('Cancelar')
  expect(
    screen.getByRole<HTMLInputElement>('radio', { name: 'De manhã' }).checked,
  ).toBe(true)
  await click('Reiniciar aula')
  await click('Confirmar reinício')
  const newRun = repository.getSnapshot().data.lessons[lesson.id]?.run
  expect(newRun?.id).not.toBe(firstRun?.id)
  expect(newRun?.visitedBlockIds).toEqual(['introduction'])
  expect(newRun?.activities).toEqual({})
})
