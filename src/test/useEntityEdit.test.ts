import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEntityEdit } from '@/hooks/useEntityEdit'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useBlocker: () => ({ state: 'unblocked', proceed: vi.fn(), reset: vi.fn() }),
  }
})

interface Entity {
  id: string
  name: string
  subtitle: string | null
}

const entity: Entity = { id: '1', name: 'Test', subtitle: null }

describe('useEntityEdit', () => {
  it('committed starts false when isNew=true', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity: undefined, isNew: true }))
    expect(result.current.committed).toBe(false)
  })

  it('committed starts true when isNew=false', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity, isNew: false }))
    expect(result.current.committed).toBe(true)
  })

  it('syncs form from entity and clears dirty on entity load', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity, isNew: false }))
    expect(result.current.form).toEqual(entity)
    expect(result.current.dirty).toBe(false)
  })

  it('set() updates the form field and marks dirty', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity, isNew: false }))
    act(() => { result.current.set('name', 'Nieuw') })
    expect(result.current.form.name).toBe('Nieuw')
    expect(result.current.dirty).toBe(true)
  })

  it('set() with null stores null in form', () => {
    const withSubtitle: Entity = { ...entity, subtitle: 'Oud' }
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity: withSubtitle, isNew: false }))
    act(() => { result.current.set('subtitle', null) })
    expect(result.current.form.subtitle).toBeNull()
    expect(result.current.dirty).toBe(true)
  })

  it('resetForm() restores entity values and clears dirty', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity, isNew: false }))
    act(() => { result.current.set('name', 'Gewijzigd') })
    expect(result.current.dirty).toBe(true)

    act(() => { result.current.resetForm() })
    expect(result.current.form.name).toBe('Test')
    expect(result.current.dirty).toBe(false)
  })

  it('deleteOpen starts false', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity, isNew: false }))
    expect(result.current.deleteOpen).toBe(false)
  })

  it('setDeleteOpen toggles deleteOpen', () => {
    const { result } = renderHook(() => useEntityEdit<Entity>({ entity, isNew: false }))
    act(() => { result.current.setDeleteOpen(true) })
    expect(result.current.deleteOpen).toBe(true)
  })
})
