// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, RouterProvider } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ProgressProvider } from '@/components/progress/progress-provider'
import {
  createLocalProgressRepository,
  progressStorageKey,
} from '@/services/progress-repository'
import { learningProgressPath } from '@/data/navigation'
import { favoriteWordsKey } from '@/services/word-favorites'
import { HomePage } from './home-page'
import { LearningProgressPage } from './learning-progress-page'

afterEach(() => {
  vi.useRealTimers()
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

const value = (
  label: string,
  scope: Pick<typeof screen, 'getByText'> = screen,
) => scope.getByText(label).nextElementSibling?.textContent

it('shows valid zeros and distinguishes featured published content from the whole curriculum', () => {
  render(
    <ProgressProvider>
      <LearningProgressPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
  expect(screen.getByRole('heading', { name: 'Meu progresso' })).toBeTruthy()
  expect(screen.getByText('My progress').lang).toBe('en')
  expect(screen.getByText(/Seu percurso começa aos poucos/)).toBeTruthy()
  expect(value('Tempo de estudo ativo')).toBe('0 s')
  expect(value('Dias com estudo ativo')).toBe('0')
  expect(
    screen.getByRole('progressbar', { name: 'Aulas publicadas concluídas' }),
  ).toHaveProperty('max', 4)
  expect(screen.getByText('0 de 48')).toBeTruthy()
  expect(screen.getByText('4 publicadas · 44 planejadas')).toBeTruthy()
})

it('loads the real route on demand, preserves legacy data and filters only dated activity', async () => {
  vi.setSystemTime(new Date(2026, 10, 26, 12))
  const legacy = JSON.stringify({
    version: 4,
    data: {
      lessons: {},
      dailyStudyMs: { '2026-11-25': 10_000, '2026-11-26': 20_000 },
      reading: {
        preferences: { fontSize: 'large', translations: true },
        stories: {},
      },
      gameSessions: {},
      simulationSessions: {},
    },
  })
  localStorage.setItem(progressStorageKey, legacy)
  const saved = JSON.stringify(['en-a-little'])
  localStorage.setItem(favoriteWordsKey, saved)
  const repository = createLocalProgressRepository()
  window.history.replaceState(null, '', learningProgressPath)
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  const { router } = await import('@/router')
  render(
    <ProgressProvider repository={repository}>
      <RouterProvider router={router} />
    </ProgressProvider>,
  )
  await screen.findByRole(
    'heading',
    { name: 'Meu progresso' },
    { timeout: 5000 },
  )
  const user = userEvent.setup()
  const period = within(
    screen.getByRole('region', { name: 'Atividade por período' }),
  )
  expect(value('Tempo de estudo ativo', period)).toBe('30 s')
  await user.selectOptions(screen.getByLabelText('Período de estudo'), 'custom')
  fireEvent.change(screen.getByLabelText('Data inicial'), {
    target: { value: '2026-11-26' },
  })
  fireEvent.change(screen.getByLabelText('Data final'), {
    target: { value: '2026-11-25' },
  })
  await user.click(screen.getByRole('button', { name: 'Aplicar período' }))
  expect(screen.getByRole('alert').textContent).toContain('Confira as datas')
  expect(value('Tempo de estudo ativo', period)).toBe('30 s')
  fireEvent.change(screen.getByLabelText('Data final'), {
    target: { value: '2026-11-26' },
  })
  await user.click(screen.getByRole('button', { name: 'Aplicar período' }))
  const distribution = within(
    period.getByRole('region', { name: 'Distribuição do tempo ativo' }),
  )
  expect(distribution.getByText('Aulas e leitura')).toBeTruthy()
  expect(distribution.getByText('20 s · 100%')).toBeTruthy()
  expect(value('Tempo de estudo ativo', period)).toBe('20 s')
  expect(
    period.getByText('Dias com estudo ativo').nextElementSibling?.textContent,
  ).toBe('1')
  expect(screen.getByText('0 de 48')).toBeTruthy()
  const chart = within(
    period.getByRole('region', { name: 'Tempo de estudo ao longo do tempo' }),
  )
  const point = chart.getByRole('button', { name: /26 de nov.*20 s/ })
  point.focus()
  await user.keyboard('{Enter}')
  expect(point.getAttribute('aria-pressed')).toBe('true')
  expect(chart.getByRole('status').textContent).toContain(
    '20 s de estudo ativo estimado',
  )

  const calendar = within(
    screen.getByRole('region', { name: 'Calendário de estudo' }),
  )
  const today = calendar.getByRole('button', { name: /26 de novembro.*20 s/ })
  today.focus()
  await user.keyboard('{ArrowLeft}')
  const previous = calendar.getByRole('button', {
    name: /25 de novembro.*10 s/,
  })
  expect(document.activeElement).toBe(previous)
  expect(previous.getAttribute('aria-pressed')).toBe('true')
  expect(calendar.getByText(/27 de novembro.*Data futura/)).toBeTruthy()
  expect(
    calendar
      .getByRole('button', { name: 'Próximo mês' })
      .getAttribute('aria-disabled'),
  ).toBe('true')
  await user.click(calendar.getByRole('button', { name: 'Mês anterior' }))
  expect(calendar.getByRole('table', { name: 'outubro de 2026' })).toBeTruthy()
  await user.click(calendar.getByRole('button', { name: 'Próximo mês' }))
  expect(calendar.getByRole('table', { name: 'novembro de 2026' })).toBeTruthy()
  await user.selectOptions(screen.getByLabelText('Período de estudo'), 'week')
  expect(value('Dias com estudo ativo', period)).toBe('2')
  await user.selectOptions(screen.getByLabelText('Período de estudo'), 'seven')
  expect(value('Tempo de estudo ativo', period)).toBe('30 s')
  await user.selectOptions(screen.getByLabelText('Período de estudo'), 'all')
  expect(value('Tempo de estudo ativo', period)).toBe('30 s')
  expect(localStorage.getItem(progressStorageKey)).toBe(legacy)
  expect(localStorage.getItem(favoriteWordsKey)).toBe(saved)
})

it('matches the Dashboard total and reports unavailable reading splits consistently', () => {
  vi.setSystemTime(new Date(2026, 10, 26, 12))
  const record = JSON.stringify({
    version: 5,
    data: {
      lessons: {},
      dailyStudyMs: { '2026-11-26': 5000 },
      reading: {
        preferences: { fontSize: 'normal', translations: false },
        stories: {
          'a-rainy-morning': {
            activeMs: 10_000,
            readChapterIds: ['older'],
            run: {
              id: 'run',
              activeMs: 10_000,
              chapterId: 'first',
              startedAt: 0,
              chapters: {},
            },
          },
        },
      },
    },
  })
  localStorage.setItem(progressStorageKey, record)
  render(
    <ProgressProvider>
      <HomePage />
      <LearningProgressPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
  const home = within(
    screen.getByRole('region', { name: 'Resumo do aprendizado' }),
  )
  const progress = within(
    screen.getByRole('region', { name: 'Atividade por período' }),
  )
  expect(
    home.getByText('Tempo de estudo ativo').nextElementSibling?.textContent,
  ).toBe('5 s')
  expect(
    progress.getByText('Tempo de estudo ativo').nextElementSibling?.textContent,
  ).toBe('5 s')
  expect(
    home.getByText('Tempo de leitura ativo').nextElementSibling?.textContent,
  ).toBe('Indisponível')
  expect(progress.getByText('Aulas e leitura')).toBeTruthy()
  expect(localStorage.getItem(progressStorageKey)).toBe(record)
})

it('opens real curriculum outlines and shows the selected report with accessible educational links', async () => {
  render(
    <ProgressProvider>
      <LearningProgressPage />
    </ProgressProvider>,
    { wrapper: MemoryRouter },
  )
  const user = userEvent.setup()
  const journey = within(screen.getByRole('region', { name: 'Currículo A1' }))
  await user.click(journey.getByText('Ver progresso por unidade'))
  const firstUnit = journey
    .getByText('Hello, nice to meet you!', {
      selector: 'summary span[lang=en]',
    })
    .closest('summary')!
  firstUnit.focus()
  await user.keyboard('{Enter}')
  const first = within(firstUnit.closest('details')!)
  expect(
    first.getByText('Olá, prazer em conhecer você!', { exact: false }),
  ).toBeTruthy()
  expect(first.getAllByRole('link')).toHaveLength(4)
  expect(first.getByRole('progressbar')).toHaveProperty('max', 4)
  const lastUnit = journey
    .getByText("Let's make plans!", { selector: 'summary span[lang=en]' })
    .closest('summary')!
  await user.click(lastUnit)
  expect(
    within(lastUnit.closest('details')!).queryAllByRole('link'),
  ).toHaveLength(0)
  expect(
    within(lastUnit.closest('details')!).getAllByText('Em breve'),
  ).toHaveLength(4)
  expect(
    journey.getByRole('progressbar', { name: 'Cobertura de publicação' }),
  ).toHaveProperty('value', 4)

  const reports = within(
    screen.getByRole('region', { name: 'Relatórios por módulo' }),
  )
  expect(
    reports.queryByRole('region', { name: 'Relatório de Aulas' }),
  ).toBeNull()
  const lessonButton = reports.getByRole('button', {
    name: 'Aulas',
    pressed: false,
  })
  lessonButton.focus()
  await user.keyboard('{Enter}')
  expect(lessonButton.getAttribute('aria-pressed')).toBe('true')
  expect(
    reports.getByText(
      'Nenhuma resposta ou correção com data registrada no período.',
    ),
  ).toBeTruthy()
  await user.click(reports.getByRole('button', { name: 'Histórias' }))
  expect(
    reports.queryByRole('region', { name: 'Relatório de Aulas' }),
  ).toBeNull()
  expect(
    reports.getByText(/atividades de compreensão são opcionais/),
  ).toBeTruthy()
  await user.click(reports.getByText('A Rainy Morning'))
  expect(
    reports
      .getByRole('link', { name: 'Rain at the Window' })
      .getAttribute('href'),
  ).toBe('/historias/a-rainy-morning/rain-at-the-window')
  await user.click(reports.getByRole('button', { name: 'Jogos' }))
  expect(
    reports.getByText('Nenhuma sessão de jogo concluída neste período.'),
  ).toBeTruthy()
  expect(
    reports
      .getByRole('link', { name: 'Abrir histórico de jogos' })
      .getAttribute('href'),
  ).toBe('/jogos/historico')
  await user.click(reports.getByRole('button', { name: 'Inglês na prática' }))
  await user.click(reports.getByText(/No aeroporto · 0 de 2/))
  expect(
    reports
      .getByRole('link', { name: 'Check-in para o voo' })
      .getAttribute('href'),
  ).toBe('/ingles-na-pratica/at-the-airport/simulacoes/flight-check-in')
  await user.click(reports.getByRole('button', { name: 'Meu caderno' }))
  expect(
    reports
      .getByRole('link', { name: 'Abrir histórico de revisões' })
      .getAttribute('href'),
  ).toBe('/meu-caderno/revisoes')
  expect(
    reports.queryByRole('heading', { name: 'Revisão sugerida' }),
  ).toBeNull()
  await user.click(reports.getByText('Ver sugestões de revisão'))
  expect(
    await reports.findByRole('heading', { name: 'Revisão sugerida' }),
  ).toBeTruthy()
})
