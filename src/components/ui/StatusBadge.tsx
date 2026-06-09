import { memo } from 'react'
import { cn } from '@/utils/cn'

export interface StatusBadgeProps {
  label: string
  color: string
  /** `solid` (default) fills with `color`; `soft` tints text/border/background for use over imagery. */
  tone?: 'solid' | 'soft'
  className?: string
}

export const StatusBadge = memo(function StatusBadge({ label, color, tone = 'solid', className }: StatusBadgeProps) {
  const style =
    tone === 'soft'
      ? {
          color,
          border: `1px solid color-mix(in srgb, ${color} 33%, transparent)`,
          background: `color-mix(in srgb, ${color} 7%, transparent)`,
        }
      : { background: color }
  return (
    <span
      className={cn('status-badge', tone === 'soft' && 'status-badge--soft', className)}
      style={style}
    >
      {label}
    </span>
  )
})
