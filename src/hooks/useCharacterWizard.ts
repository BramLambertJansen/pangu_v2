import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createEmptyDraft,
  firstInvalidStepIndex,
  validateStep,
  WIZARD_STEPS,
} from '@/utils/characterWizard'
import { getRace, getClass, getBackground } from '@/data/dnd5e'
import type { WizardDraft, WizardStepId } from '@/types/character_wizard.types'

const STORAGE_VERSION = 1

function storageKey(userId: string): string {
  return `pangu-wizard:${userId}`
}

interface WizardState {
  draft: WizardDraft
  stepIndex: number
}

interface PersistedWizard extends WizardState {
  v: number
}

function restoreState(userId: string, campaignId: string | null): WizardState | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedWizard
    if (parsed.v !== STORAGE_VERSION || !parsed.draft) return null
    // merge over een leeg draft zodat later toegevoegde velden defaults krijgen
    const draft: WizardDraft = { ...createEmptyDraft(campaignId), ...parsed.draft }
    // de kroniek uit de route wint van een herstelde draft uit een andere context
    if (campaignId !== null) draft.campaignId = campaignId
    if (draft.raceId && !getRace(draft.raceId)) draft.raceId = null
    if (draft.classId && !getClass(draft.classId)) draft.classId = null
    if (draft.backgroundId && !getBackground(draft.backgroundId)) draft.backgroundId = null
    const stepIndex = Math.min(
      Math.max(0, parsed.stepIndex ?? 0),
      WIZARD_STEPS.length - 1,
      firstInvalidStepIndex(draft),
    )
    return { draft, stepIndex }
  } catch {
    return null
  }
}

function persistState(userId: string, state: WizardState) {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ v: STORAGE_VERSION, ...state } satisfies PersistedWizard),
    )
  } catch {
    // storage vol/geblokkeerd — wizard blijft werken zonder hervatten
  }
}

function hasDraftProgress(draft: WizardDraft): boolean {
  return draft.name.trim().length > 0 || draft.raceId !== null || draft.classId !== null
}

export function clearWizardDraft(userId: string) {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // ignore
  }
}

export interface UseCharacterWizardReturn {
  draft: WizardDraft
  stepIndex: number
  stepId: WizardStepId
  steps: typeof WIZARD_STEPS
  /** Hoogste index die via de stepper bereikbaar is. */
  maxReachableIndex: number
  /** Validatie van de huidige stap (drijft de Doorgaan-knop). */
  validation: { ok: boolean; reason?: string }
  /** Is er al iets ingevuld? (voor de annuleer-bevestiging) */
  hasProgress: boolean
  patch: (updates: Partial<WizardDraft>) => void
  selectRace: (raceId: string | null) => void
  selectClass: (classId: string | null) => void
  goNext: () => void
  goBack: () => void
  goToStep: (index: number) => void
  /** Wist draft + opslag (na afronden of annuleren). */
  clear: () => void
}

/**
 * Draft-state van de karakter-wizard met per-user localStorage-persistentie
 * (hervatbaar na refresh). Er ontstaat pas een DB-rij bij het afronden.
 */
export function useCharacterWizard(
  userId: string,
  campaignId: string | null,
): UseCharacterWizardReturn {
  const [state, setState] = useState<WizardState>(
    () => restoreState(userId, campaignId) ?? { draft: createEmptyDraft(campaignId), stepIndex: 0 },
  )
  const userIdRef = useRef(userId)

  // userId is 'anon' totdat auth hydrateert; herstel dan alsnog de echte
  // draft van deze gebruiker, mits er onder de placeholder nog niets is ingevuld.
  useEffect(() => {
    if (userIdRef.current === userId) return
    userIdRef.current = userId
    setState((prev) => {
      if (hasDraftProgress(prev.draft)) return prev
      return restoreState(userId, campaignId) ?? { draft: createEmptyDraft(campaignId), stepIndex: 0 }
    })
  }, [userId, campaignId])

  const update = useCallback(
    (updater: (prev: WizardState) => WizardState) => {
      setState((prev) => {
        const next = updater(prev)
        persistState(userId, next)
        return next
      })
    },
    [userId],
  )

  const patch = useCallback(
    (updates: Partial<WizardDraft>) => {
      update((prev) => ({ ...prev, draft: { ...prev.draft, ...updates } }))
    },
    [update],
  )

  const selectRace = useCallback(
    (raceId: string | null) => {
      // vrije rasbonussen horen bij het oude ras
      patch({ raceId, flexBonusPicks: [] })
    },
    [patch],
  )

  const selectClass = useCallback(
    (classId: string | null) => {
      // skill-pool en spreuklijst zijn klasse-gebonden
      patch({
        classId,
        subclassId: null,
        skillProficiencies: [],
        cantripIds: [],
        spellIds: [],
        spellsDeferred: false,
      })
    },
    [patch],
  )

  const maxReachableIndex = Math.min(firstInvalidStepIndex(state.draft), WIZARD_STEPS.length - 1)

  const goToStep = useCallback(
    (index: number) => {
      update((prev) => {
        const reachable = Math.min(firstInvalidStepIndex(prev.draft), WIZARD_STEPS.length - 1)
        if (index < 0 || index > reachable) return prev
        return { ...prev, stepIndex: index }
      })
    },
    [update],
  )

  const goNext = useCallback(() => {
    update((prev) => {
      const stepId = WIZARD_STEPS[prev.stepIndex].id
      if (!validateStep(stepId, prev.draft).ok) return prev
      return { ...prev, stepIndex: Math.min(prev.stepIndex + 1, WIZARD_STEPS.length - 1) }
    })
  }, [update])

  const goBack = useCallback(() => {
    update((prev) => ({ ...prev, stepIndex: Math.max(prev.stepIndex - 1, 0) }))
  }, [update])

  const clear = useCallback(() => {
    clearWizardDraft(userId)
    setState({ draft: createEmptyDraft(campaignId), stepIndex: 0 })
  }, [userId, campaignId])

  const stepId = WIZARD_STEPS[state.stepIndex].id
  const { draft } = state

  return {
    draft,
    stepIndex: state.stepIndex,
    stepId,
    steps: WIZARD_STEPS,
    maxReachableIndex,
    validation: validateStep(stepId, draft),
    hasProgress: hasDraftProgress(draft),
    patch,
    selectRace,
    selectClass,
    goNext,
    goBack,
    goToStep,
    clear,
  }
}
