import { useState, useEffect, useCallback } from 'react'
import { useEditGuard, type EditGuard } from './useEditGuard'

interface UseEntityEditOptions<T> {
  entity: T | undefined
  isNew: boolean
}

export function useEntityEdit<T>({ entity, isNew }: UseEntityEditOptions<T>) {
  const [committed, setCommitted] = useState(!isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<T>>({})
  const [dirty, setDirty] = useState(false)

  const guard: EditGuard = useEditGuard({ committed, dirty })

  useEffect(() => {
    if (entity) {
      setForm(entity)
      setDirty(false)
    }
  }, [entity])

  const set = useCallback(<K extends keyof T>(key: K, value: T[K] | null) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }, [])

  const resetForm = useCallback(() => {
    // Only reset when we actually have data to restore; if entity is undefined
    // (e.g. query is still loading after a network blip), leave form and dirty
    // untouched so the user can still save or retry.
    if (entity) {
      setForm(entity)
      setDirty(false)
    }
  }, [entity])

  return {
    form,
    setForm,
    set,
    dirty,
    setDirty,
    committed,
    setCommitted,
    deleteOpen,
    setDeleteOpen,
    resetForm,
    guard,
  }
}
