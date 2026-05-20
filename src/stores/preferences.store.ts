import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PreferencesLanguage = 'nl' | 'en' | 'de' | 'fr'

interface PreferencesState {
  sessionReminders: boolean
  soundEffects: boolean
  autosaveNotes: boolean
  loreSuggestions: boolean
  language: PreferencesLanguage
  setPreference: <K extends keyof Omit<PreferencesState, 'setPreference'>>(
    key: K,
    value: PreferencesState[K],
  ) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      sessionReminders: true,
      soundEffects: false,
      autosaveNotes: true,
      loreSuggestions: true,
      language: 'nl',
      setPreference: (key, value) => set({ [key]: value } as Partial<PreferencesState>),
    }),
    { name: 'preferences' },
  ),
)
