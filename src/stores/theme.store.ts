import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Theme axes. A `theme` is a full skin (selected via `data-theme` on <html>),
 * while `accent` (primary tint) and `density` (spacing) are orthogonal axes the
 * design system ships as `data-accent` / `data-density`. Default = today's look.
 *
 * Themes change structure/mood (surfaces, voids, hairlines, radii); accent and
 * density stay orthogonal so any combination is valid.
 */
export type ThemeName = 'sanctum' | 'ember'
export type ThemeAccent = 'violet' | 'teal' | 'gold' | 'azure' | 'crimson'
export type ThemeDensity = 'standard' | 'cozy' | 'compact'

export const THEMES: ThemeName[] = ['sanctum', 'ember']
export const THEME_LABELS: Record<ThemeName, string> = { sanctum: 'Sanctum', ember: 'Ember' }
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
