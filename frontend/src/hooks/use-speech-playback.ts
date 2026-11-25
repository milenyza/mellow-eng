import { useEffect, useRef, useState } from 'react'
import { createAudioPlayback } from '@/services/audio-playback'
import type { AudioSource } from '@/types/audio'

type PlaybackStatus = 'idle' | 'playing' | 'ended' | 'stopped' | 'error'

const messages = {
  idle: '',
  playing: 'Reproduzindo o áudio.',
  ended: 'Reprodução concluída.',
  stopped: 'Reprodução interrompida.',
  error: 'Não foi possível reproduzir o áudio neste navegador.',
  unsupported: 'A reprodução de áudio está indisponível neste navegador.',
} satisfies Record<PlaybackStatus | 'unsupported', string>

export function useSpeechPlayback(language = 'en-US') {
  const [playback, setPlayback] = useState<{
    activeId: string | null
    status: PlaybackStatus
  }>({ activeId: null, status: 'idle' })
  const current = useRef<{
    id: string
    controller: ReturnType<typeof createAudioPlayback>
  } | null>(null)
  const synthesis = window.speechSynthesis
  const supported =
    typeof synthesis?.speak === 'function' &&
    typeof synthesis.cancel === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'

  useEffect(() => {
    return () => {
      const active = current.current
      current.current = null
      active?.controller.stop()
    }
  }, [])

  function stop(id: string) {
    const active = current.current
    if (!active || active.id !== id) return
    current.current = null
    try {
      active.controller.stop()
      setPlayback({ activeId: null, status: 'stopped' })
    } catch {
      setPlayback({ activeId: null, status: 'error' })
    }
  }

  function toggle(
    id: string,
    input: string | AudioSource,
    rate = 0.85,
    onEnded?: () => void,
  ) {
    if (!supported) return

    try {
      const previous = current.current
      current.current = null
      previous?.controller.stop()
      if (previous?.id === id) {
        setPlayback({ activeId: null, status: 'stopped' })
        return
      }

      const source: AudioSource =
        typeof input === 'string'
          ? { kind: 'speech', language, parts: [{ text: input }] }
          : input
      const controller = createAudioPlayback(source, rate, (status) => {
        if (current.current?.controller !== controller) return
        current.current = null
        setPlayback({ activeId: null, status })
        if (status === 'ended') onEnded?.()
      })
      current.current = { id, controller }
      setPlayback({ activeId: id, status: 'playing' })
      controller.start()
    } catch {
      current.current = null
      setPlayback({ activeId: null, status: 'error' })
    }
  }

  const status = supported ? playback.status : 'unsupported'
  return {
    activeId: playback.activeId,
    message: messages[status],
    status,
    supported,
    stop,
    toggle,
  }
}

export type SpeechPlayback = ReturnType<typeof useSpeechPlayback>
