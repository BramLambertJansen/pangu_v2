import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterWizard } from '@/hooks/useCharacterWizard'

const USER = 'test-user'

describe('useCharacterWizard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty draft on step 0', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.stepId).toBe('basis')
    expect(result.current.draft.name).toBe('')
    expect(result.current.hasProgress).toBe(false)
    expect(result.current.validation.ok).toBe(false)
  })

  it('seeds the campaign id from the argument', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, 'camp-1'))
    expect(result.current.draft.campaignId).toBe('camp-1')
  })

  it('blocks goNext while the current step is invalid', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    act(() => result.current.goNext())
    expect(result.current.stepIndex).toBe(0)
    act(() => result.current.patch({ name: 'Lyria' }))
    act(() => result.current.goNext())
    expect(result.current.stepIndex).toBe(1)
  })

  it('only allows stepper navigation up to the first invalid step', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    act(() => result.current.patch({ name: 'Lyria' }))
    expect(result.current.maxReachableIndex).toBe(1)
    act(() => result.current.goToStep(5))
    expect(result.current.stepIndex).toBe(0)
    act(() => result.current.goToStep(1))
    expect(result.current.stepIndex).toBe(1)
  })

  it('persists the draft and resumes across hook instances', () => {
    const first = renderHook(() => useCharacterWizard(USER, null))
    act(() => first.result.current.patch({ name: 'Lyria' }))
    act(() => first.result.current.selectRace('high-elf'))
    act(() => first.result.current.goNext())
    first.unmount()

    const second = renderHook(() => useCharacterWizard(USER, null))
    expect(second.result.current.draft.name).toBe('Lyria')
    expect(second.result.current.draft.raceId).toBe('high-elf')
    expect(second.result.current.stepIndex).toBe(1)
  })

  it('namespaces drafts per user', () => {
    const first = renderHook(() => useCharacterWizard(USER, null))
    act(() => first.result.current.patch({ name: 'Lyria' }))
    first.unmount()

    const other = renderHook(() => useCharacterWizard('other-user', null))
    expect(other.result.current.draft.name).toBe('')
  })

  it('drops unknown ids when restoring an outdated draft', () => {
    localStorage.setItem(
      `pangu-wizard:${USER}`,
      JSON.stringify({
        v: 1,
        stepIndex: 2,
        draft: { name: 'Oud', raceId: 'verwijderd-ras', classId: 'wizard' },
      }),
    )
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    expect(result.current.draft.name).toBe('Oud')
    expect(result.current.draft.raceId).toBeNull()
    expect(result.current.draft.classId).toBe('wizard')
    // stap wordt teruggeklemd naar de eerste invalide stap (ras)
    expect(result.current.stepIndex).toBe(1)
  })

  it('selectClass resets class-dependent choices', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    act(() =>
      result.current.patch({
        subclassId: 'evocation',
        skillProficiencies: ['Magie'],
        cantripIds: ['c1'],
        spellIds: ['s1'],
        spellsDeferred: true,
      }),
    )
    act(() => result.current.selectClass('rogue'))
    expect(result.current.draft.classId).toBe('rogue')
    expect(result.current.draft.subclassId).toBeNull()
    expect(result.current.draft.skillProficiencies).toEqual([])
    expect(result.current.draft.cantripIds).toEqual([])
    expect(result.current.draft.spellIds).toEqual([])
    expect(result.current.draft.spellsDeferred).toBe(false)
  })

  it('selectRace resets flexible bonus picks', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    act(() => result.current.selectRace('half-elf'))
    act(() => result.current.patch({ flexBonusPicks: ['stat_dex', 'stat_con'] }))
    act(() => result.current.selectRace('human'))
    expect(result.current.draft.flexBonusPicks).toEqual([])
  })

  it('clear wipes draft and storage', () => {
    const { result } = renderHook(() => useCharacterWizard(USER, null))
    act(() => result.current.patch({ name: 'Lyria' }))
    expect(localStorage.getItem(`pangu-wizard:${USER}`)).not.toBeNull()
    act(() => result.current.clear())
    expect(result.current.draft.name).toBe('')
    expect(localStorage.getItem(`pangu-wizard:${USER}`)).toBeNull()
  })
})
