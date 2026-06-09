import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ChipProps extends ComponentPropsWithoutRef<'span'> {
  /** Optional leading glyph/icon. */
  icon?: ReactNode
  /** Semantic colour tint. `neutral` (default) uses the surface palette. */
  tone?: 'neutral' | 'violet' | 'crimson' | 'teal'
}

/** Compact, pill-shaped metadata token (race · class, tags, counts). */
export function Chip({ icon, tone = 'neutral', className, children, ...props }: ChipProps) {
  return (
    <span className={cn('chip', tone !== 'neutral' && `chip--${tone}`, className)} {...props}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  )
}
