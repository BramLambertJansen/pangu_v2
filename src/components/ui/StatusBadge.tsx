import { memo } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '@/utils/cn'

export interface StatusBadgeProps {
  label: string
  /** A `var(--token)` colour string from statusMaps (e.g. `var(--gold)`). */
  color: string
  /** `solid` (default) fills with `color`; `soft` tints it for use over imagery. */
  tone?: 'solid' | 'soft'
  className?: string
}

/**
 * The colour is handed to CSS via the `--sb-color` custom property so the
 * solid/soft tints (incl. color-mix) live in the stylesheet, not inline —
 * keeping the channel token-driven and theme-safe.
 */
export const StatusBadge = memo(function StatusBadge({
  label,
  color,
  tone = 'solid',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn('status-badge', tone === 'soft' && 'status-badge--soft', className)}
      style={{ '--sb-color': color } as CSSProperties}
    >
      {label}
    </span>
  )
})
