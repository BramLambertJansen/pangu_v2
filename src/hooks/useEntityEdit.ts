import { useState, useEffect, useCallback } from 'react'

interface UseEntityEditOptions<T> {
  entity: T | undefined
  isNew: boolean
}

export function useEntityEdit<T>({ entity, isNew }: UseEntityEditOptions<T>) {
  const [committed, setCommitted] = useState(!isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<T>>({})
  const [dirty, setDirty] = useState(false)

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
    if (entity) setForm(entity)
    setDirty(false)
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
  }
}
