import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme axes. A `theme` is a full skin (selected via `data-theme` on <html>),
 * while `accent` (primary tint) and `density` (spacing) are orthogonal axes the
 * design system ships as `data-accent` / `data-density`. Default = today's look.
 *
 * The actual extra theme bodies + a Settings switch land in step 4; this store
 * is the groundwork so the switch becomes a one-line state change.
 */
export type ThemeName = 'sanctum'
export type ThemeAccent = 'violet' | 'teal' | 'gold' | 'azure' | 'crimson'
export type ThemeDensity = 'standard' | 'cozy' | 'compact'

export const THEMES: ThemeName[] = ['sanctum']
export const ACCENTS: ThemeAccent[] = ['violet', 'teal', 'gold', 'azure', 'crimson']
export const DENSITIES: ThemeDensity[] = ['standard', 'cozy', 'compact']

interface ThemeState {
  theme: ThemeName
  accent: ThemeAccent
  density: ThemeDensity
  setTheme: (theme: ThemeName) => void
  setAccent: (accent: ThemeAccent) => void
  setDensity: (density: ThemeDensity) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'sanctum',
      accent: 'violet',
      density: 'standard',
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
    }),
    { name: 'theme' },
  ),
)
