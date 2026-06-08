import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ChipProps extends ComponentPropsWithoutRef<'span'> {
  /** Optional leading glyph/icon. */
  icon?: ReactNode
}

/** Compact, pill-shaped metadata token (race · class, tags, counts). */
export function Chip({ icon, className, children, ...props }: ChipProps) {
  return (
    <span className={cn('chip', className)} {...props}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  )
}
