// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it } from 'vitest'
import { stories } from '@/data/stories'
import type { Story } from '@/types/story'
import { StoryLibrary } from './story-library'

afterEach(cleanup)

it('renders metadata and exposes a focusable native story preview', async () => {
  const user = userEvent.setup()
  render(<StoryLibrary stories={stories} />, { wrapper: MemoryRouter })
  expect(screen.getByRole('status').textContent).toBe('6 histórias')
  expect(screen.getAllByText('Em breve')).toHaveLength(5)
  const card = screen
    .getByRole('heading', { name: 'A Rainy Morning' })
    .closest('article')
  if (!card) throw new Error('Missing story card')
  expect(within(card).getByText('A1')).toBeTruthy()
  expect(within(card).getByText('3 capítulos')).toBeTruthy()
  expect(within(card).getByText('6 min de leitura estimada')).toBeTruthy()
  const preview = within(card).getByText('Prévia da história')
  const details = preview.closest('details')
  expect(details?.open).toBe(false)
  for (let index = 0; index < 5; index++) await user.tab()
  expect(document.activeElement).toBe(preview)
  await user.click(preview)
  expect(details?.open).toBe(true)
  expect(
    within(card).getByRole('heading', { name: 'Objetivos de leitura' }),
  ).toBeTruthy()
  expect(
    within(card).getByText('Rain at the Window').getAttribute('lang'),
  ).toBe('en')
  await user.click(preview)
  expect(details?.open).toBe(false)
})

it('applies native filters and search together and resets the empty results to the full collection', async () => {
  const user = userEvent.setup()
  render(<StoryLibrary stories={stories} />, { wrapper: MemoryRouter })
  const title = screen.getByRole('searchbox', { name: 'Buscar por título' })
  await user.selectOptions(screen.getByLabelText('Nível CEFR'), 'A2')
  await user.selectOptions(screen.getByLabelText('Gênero'), 'travel')
  expect(screen.getByRole('status').textContent).toBe('1 história')
  expect(
    screen.getByRole('heading', { name: 'A Letter from London' }),
  ).toBeTruthy()
  await user.type(title, 'rain')
  expect(screen.getByRole('status').textContent).toBe('0 histórias')
  expect(
    screen.getByRole('heading', { name: 'Nenhuma história encontrada' }),
  ).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  expect(document.activeElement).toBe(title)
  expect(screen.getByRole('status').textContent).toBe('6 histórias')
  expect(
    screen.queryByRole('heading', { name: 'Nenhuma história encontrada' }),
  ).toBeNull()
})

it('distinguishes a readable story fixture from a planned outline', () => {
  const available: Story = {
    ...stories[0],
    id: 'readable-fixture',
    publication: 'available',
    chapters: [
      {
        ...stories[0].chapters[0],
        paragraphs: [{ id: 'paragraph', text: 'It is a rainy morning.' }],
      },
    ],
  }

  render(<StoryLibrary stories={[available, stories[1]]} />, {
    wrapper: MemoryRouter,
  })
  expect(screen.getByText('Disponível')).toBeTruthy()
  expect(screen.getByText('Em breve')).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Ler história/ }).getAttribute('href'),
  ).toBe('/historias/readable-fixture')
  expect(screen.queryByText('It is a rainy morning.')).toBeNull()
})

it('explains when the underlying collection has no stories', () => {
  render(<StoryLibrary stories={[]} />)
  expect(
    screen.getByRole('heading', { name: 'A coleção está sendo preparada' }),
  ).toBeTruthy()
  expect(screen.queryByRole('searchbox')).toBeNull()
})
