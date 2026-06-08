import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/stores/theme.store'

/**
 * Applies the active theme axes to the <html> element as data-attributes.
 * Components read only design tokens, so flipping these attributes re-skins the
 * whole app with no markup changes — the mechanism behind the future theme switch.
 * The default values map to today's look (identity), so this is visually inert now.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme)
  const accent = useThemeStore((s) => s.accent)
  const density = useThemeStore((s) => s.density)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // Default accent/density are the baseline — omit the attribute so no override applies.
    if (accent === 'violet') root.removeAttribute('data-accent')
    else root.setAttribute('data-accent', accent)
    if (density === 'standard') root.removeAttribute('data-density')
    else root.setAttribute('data-density', density)
  }, [theme, accent, density])

  return <>{children}</>
}
