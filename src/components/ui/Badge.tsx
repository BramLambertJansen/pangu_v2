import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: Variant
}

const variantClass: Record<Variant, string> = {
  default: 'badge-neutral',
  success: 'badge-teal',
  warning: 'badge-gold',
  danger: 'badge-crimson',
  info: 'badge-violet',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', variantClass[variant], className)} {...props}>
      {children}
    </span>
  )
}
