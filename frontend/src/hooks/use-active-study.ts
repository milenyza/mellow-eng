import { useEffect, useRef } from 'react'
import {
  createStudyClock,
  recordReadingInterval,
  recordStudyInterval,
} from '@/services/study-time'
import type { ProgressRepository } from '@/services/progress-repository'

export function useActiveStudy(
  repository: ProgressRepository,
  itemId: string,
  runId?: string,
  mode: 'lesson' | 'reading' = 'lesson',
) {
  const flush = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    if (!runId) return
    const clock = createStudyClock((start, end) =>
      repository.update((data) =>
        (mode === 'reading' ? recordReadingInterval : recordStudyInterval)(
          data,
          itemId,
          runId,
          start,
          end,
        ),
      ),
    )
    const isForeground = () =>
      document.visibilityState === 'visible' && document.hasFocus()
    const refresh = () => {
      if (isForeground()) clock.resume(Date.now())
      else clock.pause(Date.now())
    }
    const pause = () => clock.pause(Date.now())
    const interact = () => clock.interact(Date.now())
    const tick = () => clock.flush(Date.now())
    const inputs = ['pointerdown', 'keydown', 'wheel'] as const

    refresh()
    flush.current = tick
    const timer = window.setInterval(() => {
      if (isForeground()) tick()
      else pause()
    }, 5000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('blur', pause)
    window.addEventListener('pagehide', pause)
    window.addEventListener('pageshow', refresh)
    for (const input of inputs)
      document.addEventListener(input, interact, { passive: true })

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('blur', pause)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', refresh)
      for (const input of inputs) document.removeEventListener(input, interact)
      flush.current = undefined
      pause()
    }
  }, [repository, itemId, runId, mode])

  return flush
}
