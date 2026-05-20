import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: Variant
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-700 text-gray-200',
  success: 'bg-green-900 text-green-300',
  warning: 'bg-yellow-900 text-yellow-300',
  danger:  'bg-red-900 text-red-300',
  info:    'bg-indigo-900 text-indigo-300',
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
