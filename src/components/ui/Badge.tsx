import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: Variant
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-surface-2 text-ink-soft',
  success: 'bg-teal/15 text-teal',
  warning: 'bg-gold/15 text-gold',
  danger:  'bg-crimson/15 text-crimson',
  info:    'bg-violet/15 text-violet',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
