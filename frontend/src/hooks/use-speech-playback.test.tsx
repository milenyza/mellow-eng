// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useSpeechPlayback } from './use-speech-playback'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('cancels speech across mounted controls before the next starts and cancels on unmount', () => {
  const events: string[] = []
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  vi.stubGlobal('speechSynthesis', {
    cancel: () => events.push('cancel'),
    speak: ({ text }: SpeechSynthesisUtterance) => events.push(text),
    getVoices: () => [],
  })
  const a = renderHook(() => useSpeechPlayback())
  const b = renderHook(() => useSpeechPlayback())
  act(() => a.result.current.toggle('first', 'Hello'))
  act(() => b.result.current.toggle('next', 'Good morning'))
  expect(events).toEqual(['Hello', 'cancel', 'Good morning'])
  expect(a.result.current.status).toBe('stopped')
  expect(b.result.current.status).toBe('playing')
  a.unmount()
  expect(events).toHaveLength(3)
  b.unmount()
  expect(events).toEqual(['Hello', 'cancel', 'Good morning', 'cancel'])
})
