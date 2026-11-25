import { useEffect, useRef } from 'react'
import { addDailyTime, createStudyClock } from '@/services/study-time'

export function useGameClock() {
  const elapsed = useRef(0)
  const daily = useRef<ReturnType<typeof addDailyTime>>({})
  const clock = useRef<ReturnType<typeof createStudyClock> | null>(null)

  useEffect(() => {
    const tracker = createStudyClock((start, end) => {
      elapsed.current += end - start
      daily.current = addDailyTime(daily.current, start, end)
    })
    clock.current = tracker
    const refresh = () => {
      if (document.visibilityState === 'visible' && document.hasFocus())
        tracker.resume(Date.now())
      else tracker.pause(Date.now())
    }
    const interact = () => tracker.interact(Date.now())
    const pause = () => tracker.pause(Date.now())
    const events = {
      focus: refresh,
      blur: pause,
      pagehide: pause,
      pageshow: refresh,
    }
    const listeners = Object.entries(events)
    const inputs = ['pointerdown', 'keydown', 'wheel'] as const
    for (const [event, listener] of listeners)
      window.addEventListener(event, listener)
    document.addEventListener('visibilitychange', refresh)
    for (const event of inputs) document.addEventListener(event, interact)
    refresh()
    return () => {
      for (const [event, listener] of listeners)
        window.removeEventListener(event, listener)
      document.removeEventListener('visibilitychange', refresh)
      for (const event of inputs) document.removeEventListener(event, interact)
      tracker.pause(Date.now())
      clock.current = null
    }
  }, [])

  return () => {
    clock.current?.flush(Date.now())
    return { activeMs: elapsed.current, dailyPracticeMs: daily.current }
  }
}
