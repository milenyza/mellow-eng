// @vitest-environment jsdom

import { afterEach, expect, it, vi } from 'vitest'
import { createAudioPlayback, supportsSpeechPause } from './audio-playback'
import { createDialogueAudio } from './dialogue-audio'
import { loadPracticalDialogue } from '@/data/dialogues/load-dialogue'

class Utterance {
  lang = ''
  rate = 1
  voice?: SpeechSynthesisVoice
  onstart?: () => void
  onend?: () => void
  onerror?: () => void

  constructor(public text: string) {}
}

function voice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, voiceURI: name, localService: true, default: false }
}

function setup(initialVoices: SpeechSynthesisVoice[] = []) {
  const utterances: Utterance[] = []
  let voices = initialVoices
  const synthesis = {
    paused: false,
    getVoices: () => voices,
    speak: vi.fn((item: Utterance) => utterances.push(item)),
    cancel: vi.fn(),
    pause() {
      this.paused = true
    },
    resume() {
      this.paused = false
    },
  }
  vi.stubGlobal('speechSynthesis', synthesis)
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  return {
    synthesis,
    utterances,
    addVoices: (list: SpeechSynthesisVoice[]) => {
      voices = list
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

it('uses onend to sequence turns, highlights only started parts and prefers distinct US voices', async () => {
  const us1 = voice('US 1', 'en-US')
  const us2 = voice('US 2', 'en_US')
  const { utterances, synthesis } = setup([
    voice('PT', 'pt-BR'),
    voice('UK', 'en-GB'),
    us1,
    us2,
  ])
  const { dialogue } = await loadPracticalDialogue(
    'at-the-airport',
    'flight-check-in',
  )
  const end = vi.fn()
  const starts = vi.fn()
  const controller = createAudioPlayback(
    createDialogueAudio(dialogue!),
    0.75,
    end,
    starts,
  )

  controller.start()
  expect(utterances).toHaveLength(1)
  expect(starts).not.toHaveBeenCalled()
  expect(utterances[0]).toMatchObject({ voice: us1, rate: 0.75 })
  utterances[0].onstart?.()
  expect(starts.mock.calls[0][0]).toMatchObject({ id: 'counter' })
  expect(controller.pause()).toBe(true)
  expect(synthesis.paused).toBe(true)
  expect(controller.resume()).toBe(true)

  utterances[0].onend?.()
  expect(utterances).toHaveLength(2)
  expect(utterances[1].voice).toBe(us2)
  utterances[0].onend?.()
  expect(utterances).toHaveLength(2)
  utterances[1].onend?.()
  expect(utterances[2].voice).toBe(us1)
  for (let i = 2; i < dialogue!.turns.length; i++) utterances[i].onend?.()
  expect(end).toHaveBeenCalledExactlyOnceWith('ended')

  createAudioPlayback(
    createDialogueAudio(dialogue!, 'destination'),
    1,
    vi.fn(),
  ).start()
  expect(utterances.at(-1)?.voice).toBe(us2)
})

it('uses a single stable fallback until voices become available and ignores late events after stop', async () => {
  const { utterances, synthesis, addVoices } = setup([voice('PT', 'pt-BR')])
  const { dialogue } = await loadPracticalDialogue(
    'at-the-hotel',
    'hotel-reservation',
  )
  const source = createDialogueAudio(dialogue!)
  const end = vi.fn()
  const run = createAudioPlayback(source, 1, end)
  run.start()
  expect(utterances[0]).toMatchObject({ lang: 'en-US' })
  expect(utterances[0].voice).toBeUndefined()
  const english = voice('UK', 'en-GB')
  addVoices([english])
  utterances[0].onend?.()
  expect(utterances[1].voice).toBeUndefined()
  run.pause()
  run.stop()
  expect(synthesis.cancel).toHaveBeenCalledTimes(1)
  expect(synthesis.paused).toBe(false)
  utterances[1].onend?.()
  expect(utterances).toHaveLength(2)
  expect(end).not.toHaveBeenCalled()

  const next = createAudioPlayback(source, 1, end)
  next.start()
  expect(utterances[2].voice).toBe(english)
  utterances[2].onend?.()
  expect(utterances[3].voice).toBe(english)
  utterances[3].onerror?.()
  expect(end).toHaveBeenCalledExactlyOnceWith('error')
  expect(utterances).toHaveLength(4)
  expect(supportsSpeechPause(undefined)).toBe(false)
})
