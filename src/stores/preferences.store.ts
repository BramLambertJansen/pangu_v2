import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

function getUserId(): string {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') ?? '{}')
    return (auth?.state?.user?.id as string | undefined) ?? 'guest'
  } catch {
    return 'guest'
  }
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
    {
      name: 'preferences',
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(`${name}:${getUserId()}`),
        setItem: (name, value) => localStorage.setItem(`${name}:${getUserId()}`, value),
        removeItem: (name) => localStorage.removeItem(`${name}:${getUserId()}`),
      })),
    },
  ),
)
