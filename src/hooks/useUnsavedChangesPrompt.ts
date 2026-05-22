import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

export interface UnsavedChangesPrompt {
  blocked: boolean
  proceed: () => void
  reset: () => void
}

export function useUnsavedChangesPrompt(dirty: boolean): UnsavedChangesPrompt {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  return {
    blocked: blocker.state === 'blocked',
    proceed: () => blocker.state === 'blocked' && blocker.proceed(),
    reset: () => blocker.state === 'blocked' && blocker.reset(),
  }
}
