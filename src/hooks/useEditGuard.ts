import { useState, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

export interface EditGuard {
  discardOpen: boolean
  /** True when the item has never been saved — dialog shows "weggooien" language */
  isDraftDiscard: boolean
  /** Call when Cancel/Back is clicked on an uncommitted item */
  requestDiscard: () => void
  /**
   * Call after cleanup (deletion) is done.
   * Returns true if the blocker handled navigation — do NOT call navigate() in that case.
   */
  confirmLeave: () => boolean
  /** Call when user dismisses the dialog */
  cancelLeave: () => void
}

/**
 * Blocks navigation when the edit form is uncommitted or has unsaved changes.
 * For uncommitted items the dialog uses "weggooien" language; the caller is
 * responsible for deleting the draft before calling confirmLeave().
 */
export function useEditGuard({
  committed,
  dirty,
}: {
  committed: boolean
  dirty: boolean
}): EditGuard {
  const shouldBlock = !committed || dirty

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      shouldBlock && currentLocation.pathname !== nextLocation.pathname,
  )

  const [discardOpen, setDiscardOpen] = useState(false)

  // Open dialog when react-router navigation is intercepted
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setDiscardOpen(true)
    }
  }, [blocker.state])

  // Prevent browser close/refresh when there's something to lose
  useEffect(() => {
    if (!shouldBlock) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [shouldBlock])

  function requestDiscard() {
    setDiscardOpen(true)
  }

  function confirmLeave(): boolean {
    setDiscardOpen(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
      return true
    }
    return false
  }

  function cancelLeave() {
    setDiscardOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }

  return {
    discardOpen,
    isDraftDiscard: !committed,
    requestDiscard,
    confirmLeave,
    cancelLeave,
  }
}
