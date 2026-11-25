import { useCallback } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router'

export function useGameSessionGuard(active: boolean) {
  useBeforeUnload(
    useCallback(
      (event) => {
        if (!active) return
        event.preventDefault()
        event.returnValue = ''
      },
      [active],
    ),
  )

  return useBlocker(active)
}
