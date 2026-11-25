// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { introductionsExercises } from '@/data/curriculum/introductions-exercises'
import type { PracticeSession } from '@/types/exercise'
import type { PracticeBlock } from '@/types/lesson-content'
import { PracticePlayer } from './practice-player'

afterEach(cleanup)

const [choice, blanks, builder, matching, affirmation] = introductionsExercises

function renderPractice(exercises: PracticeBlock['exercises']) {
  const block: PracticeBlock = {
    id: 'test-practice',
    kind: 'practice',
    title: 'Prática',
    instructions: 'Confira cada resposta.',
    exercises,
  }
  function TestPractice() {
    const [session, setSession] = useState<PracticeSession>()
    return (
      <PracticePlayer
        block={block}
        language="en"
        session={session}
        onChange={setSession}
      />
    )
  }
  render(<TestPractice />)
  return userEvent.setup()
}

const button = (name: string) =>
  screen.getByRole<HTMLButtonElement>('button', { name })
const submit = () => button('Conferir resposta')

describe('PracticePlayer', () => {
  it('requires explicit submission and opens hints on request', async () => {
    const user = renderPractice([choice])
    expect(submit().disabled).toBe(true)
    expect(screen.queryByText('Resposta esperada')).toBeNull()
    const hint = screen.getByText('Ver dica').closest('details')
    expect(hint?.open).toBe(false)
    await user.click(screen.getByText('Ver dica'))
    expect(hint?.open).toBe(true)
    await user.click(screen.getByRole('radio', { name: 'Good morning!' }))
    expect(screen.getByRole('status').textContent).toBe('')
    await user.click(submit())
    expect(screen.getByRole('status').textContent).toContain('Resposta correta')
    expect(screen.getByRole('status').textContent).toContain(choice.feedback)
    await user.click(button('Encerrar prática'))
    expect(
      screen.getByRole('heading', { name: 'Prática revisada' }),
    ).toBeTruthy()
  })

  it('explains an incorrect response and allows editing the same answer on retry', async () => {
    const user = renderPractice([choice, blanks])
    await user.click(screen.getByRole('radio', { name: 'Goodbye!' }))
    await user.click(submit())
    expect(screen.getByRole('status').textContent).toContain(
      'Vamos revisar a resposta',
    )
    expect(screen.getByRole('status').textContent).toContain('Good morning!')
    expect(
      screen.queryByRole('button', { name: 'Próximo exercício' }),
    ).toBeNull()
    await user.click(button('Tentar novamente'))
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Goodbye!' }).checked,
    ).toBe(true)
    expect(screen.getByRole('status').textContent).toBe('')
    await user.click(screen.getByRole('radio', { name: 'Good morning!' }))
    await user.click(submit())
    await user.click(button('Próximo exercício'))
    expect(screen.getByText('Exercício 2 de 2')).toBeTruthy()
    expect(document.activeElement?.textContent).toBe(blanks.prompt)
    expect(submit().disabled).toBe(true)
  })

  it('permits progression after an explicit review of the correction', async () => {
    const user = renderPractice([blanks, affirmation])
    await user.type(screen.getByRole('textbox'), '   ')
    expect(submit().disabled).toBe(true)
    await user.type(screen.getByRole('textbox'), 'are')
    await user.click(submit())
    await user.click(button('Revisei a correção'))
    expect(screen.getByRole('status').textContent).toContain(
      'Correção revisada',
    )
    await user.click(button('Próximo exercício'))
    await user.click(screen.getByRole('radio', { name: 'Verdadeiro' }))
    await user.click(submit())
    expect(screen.getByRole('status').textContent).toContain('Resposta correta')
  })

  it('keeps words in selection order and lets keyboard users remove and reorder them', async () => {
    const user = renderPractice([builder])
    const bank = within(
      screen.getByRole('group', { name: 'Palavras disponíveis' }),
    )
    const word = (name: string) =>
      bank.getByRole<HTMLButtonElement>('button', { name })
    await user.tab()
    expect(document.activeElement).toBe(word('name?'))
    await user.keyboard('{Enter}')
    expect(submit().disabled).toBe(true)
    await user.keyboard('{Enter}')
    expect(word('name?').getAttribute('aria-pressed')).toBe('false')
    await user.click(word('What’s'))
    await user.click(word('your'))
    await user.click(word('name?'))
    expect(
      within(screen.getByRole('list', { name: 'Ordem das palavras' }))
        .getAllByRole('button')
        .map((tile) => tile.textContent),
    ).toEqual([
      'Remover palavra 1: What’s',
      'Remover palavra 2: your',
      'Remover palavra 3: name?',
    ])
    await user.click(submit())
    expect(screen.getByRole('status').textContent).toContain('Resposta correta')
  })

  it('prevents duplicate matches and requires every row before submission', async () => {
    const user = renderPractice([matching])
    const first = screen.getByRole('combobox', {
      name: 'Par para Good morning',
    })
    const second = screen.getByRole('combobox', {
      name: 'Par para Good afternoon',
    })
    const third = screen.getByRole('combobox', {
      name: 'Par para Good evening',
    })
    await user.selectOptions(first, 'morning')
    expect(
      within(second).getByRole<HTMLOptionElement>('option', { name: 'Bom dia' })
        .disabled,
    ).toBe(true)
    await user.selectOptions(second, 'afternoon')
    expect(submit().disabled).toBe(true)
    await user.selectOptions(first, '')
    expect(
      within(second).getByRole<HTMLOptionElement>('option', { name: 'Bom dia' })
        .disabled,
    ).toBe(false)
    await user.selectOptions(first, 'morning')
    await user.selectOptions(third, 'night')
    await user.click(submit())
    expect(screen.getByRole('status').textContent).toContain('Resposta correta')
  })
})
