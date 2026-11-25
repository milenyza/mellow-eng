// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { introductionsListening } from '@/data/curriculum/introductions-listening'
import type { ListeningBlock } from '@/types/lesson-content'
import type { ListeningSession } from '@/types/listening'
import { ListeningPlayer } from './listening-player'

class MockUtterance {
  lang = ''
  rate = 1
  voice?: SpeechSynthesisVoice
  onend?: () => void
  onerror?: () => void

  constructor(public text: string) {}
}

const usVoice = { lang: 'en-US', name: 'American English' }
const gbVoice = { lang: 'en-GB', name: 'British English' }
const ptVoice = { lang: 'pt-BR', name: 'Português' }

function mockSpeech(voices = [ptVoice, gbVoice, usVoice]) {
  const speak = vi.fn<(speech: MockUtterance) => void>()
  const cancel = vi.fn()
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
  vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => voices })
  return { speak, cancel }
}

function renderListening(
  activities: ListeningBlock['activities'] = introductionsListening,
) {
  const block: ListeningBlock = {
    id: 'listening',
    kind: 'listening',
    title: 'Escuta',
    instructions: 'Ouça e responda.',
    activities,
  }

  function TestListening() {
    const [session, setSession] = useState<ListeningSession>()
    return (
      <ListeningPlayer
        block={block}
        language="en"
        session={session}
        onChange={setSession}
      />
    )
  }

  return { ...render(<TestListening />), user: userEvent.setup() }
}

const button = (name: string) =>
  screen.getByRole<HTMLButtonElement>('button', { name })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('plays at the selected speed, prefers en-US, stops and replays without a limit', async () => {
  const { speak, cancel } = mockSpeech()
  const { user } = renderListening()
  expect(
    screen.getByRole<HTMLInputElement>('radio', { name: 'Normal (1×)' })
      .checked,
  ).toBe(true)
  await user.click(button('Ouvir áudio'))
  const first = speak.mock.calls[0][0]
  expect(first).toMatchObject({
    text: 'Good morning, Clara!',
    lang: 'en-US',
    rate: 1,
    voice: usVoice,
  })
  expect(screen.getByText('Reproduzindo o áudio.')).toBeTruthy()
  await user.click(button('Parar áudio'))
  expect(cancel).toHaveBeenCalledTimes(1)
  act(() => first.onend?.())
  expect(screen.getByText('Reprodução interrompida.')).toBeTruthy()

  await user.click(screen.getByRole('radio', { name: 'Reduzida (0,75×)' }))
  for (let replay = 0; replay < 3; replay++) {
    await user.click(button('Ouvir áudio'))
    const speech = speak.mock.calls.at(-1)?.[0]
    expect(speech?.rate).toBe(0.75)
    act(() => speech?.onend?.())
    expect(screen.getByText('Reprodução concluída.')).toBeTruthy()
  }
  expect(speak).toHaveBeenCalledTimes(4)
  expect(button('Conferir resposta').disabled).toBe(true)
})

it('plays dialogue lines in order, falls back to another English voice and cancels on unmount', async () => {
  const { speak, cancel } = mockSpeech([ptVoice, gbVoice])
  const { user, unmount } = renderListening([introductionsListening[4]])
  await user.click(button('Ouvir áudio'))
  const first = speak.mock.calls[0][0]
  expect(first).toMatchObject({
    text: introductionsListening[4].source.parts[0].text,
    voice: gbVoice,
    lang: 'en-GB',
  })
  act(() => first.onend?.())
  const second = speak.mock.calls[1][0]
  expect(second.text).toBe(introductionsListening[4].source.parts[1].text)
  unmount()
  expect(cancel).toHaveBeenCalledTimes(1)
  act(() => second.onend?.())
  expect(speak).toHaveBeenCalledTimes(2)
})

it('reports unsupported audio and offers an explicit reading activity without the transcript', async () => {
  vi.stubGlobal('speechSynthesis', undefined)
  const { user } = renderListening()
  expect(button('Ouvir áudio').disabled).toBe(true)
  expect(
    screen.getByText(
      'A reprodução de áudio está indisponível neste navegador.',
    ),
  ).toBeTruthy()
  expect(screen.queryByText('Good morning, Clara!')).toBeNull()
  expect(screen.queryByText('Ver transcrição e tradução')).toBeNull()
  expect(
    screen.queryByText(introductionsListening[0].textAlternative),
  ).toBeNull()

  await user.click(button('Usar alternativa em texto'))
  expect(
    screen.getByText('Nesta atividade, você está praticando por leitura.'),
  ).toBeTruthy()
  expect(
    screen.getByText(introductionsListening[0].textAlternative),
  ).toBeTruthy()
  expect(screen.queryByText('Good morning, Clara!')).toBeNull()

  await user.click(screen.getByRole('radio', { name: 'À noite' }))
  await user.click(button('Conferir resposta'))
  expect(screen.getByText('Vamos revisar a resposta')).toBeTruthy()
  const transcript = screen.getByText('Ver transcrição e tradução')
  expect(transcript.closest('details')?.open).toBe(false)
  await user.click(transcript)
  expect(transcript.closest('details')?.open).toBe(true)
  expect(screen.getByText('Bom dia, Clara!')).toBeTruthy()
  await user.click(button('Tentar novamente'))
  expect(screen.queryByText('Ver transcrição e tradução')).toBeNull()
  expect(
    screen.getByText(introductionsListening[0].textAlternative),
  ).toBeTruthy()
  await user.click(screen.getByRole('radio', { name: 'De manhã' }))
  await user.click(button('Conferir resposta'))
  expect(screen.getByText('Resposta correta')).toBeTruthy()
})

it('reports playback errors and evaluates transcription through the exercise engine', async () => {
  const { speak } = mockSpeech([ptVoice])
  const { user } = renderListening([introductionsListening[3]])
  await user.click(button('Ouvir áudio'))
  const speech = speak.mock.calls[0][0]
  expect(speech.lang).toBe('en-US')
  expect(speech.voice).toBeUndefined()
  act(() => speech.onerror?.())
  expect(
    screen.getByText('Não foi possível reproduzir o áudio neste navegador.'),
  ).toBeTruthy()

  await user.type(screen.getByRole('textbox'), 'Whats your name')
  await user.click(button('Conferir resposta'))
  expect(screen.getByText('Vamos revisar a resposta')).toBeTruthy()
  await user.click(button('Tentar novamente'))
  await user.clear(screen.getByRole('textbox'))
  await user.type(screen.getByRole('textbox'), " WHAT'S  YOUR NAME ")
  await user.click(button('Conferir resposta'))
  expect(screen.getByText('Resposta correta')).toBeTruthy()
})
